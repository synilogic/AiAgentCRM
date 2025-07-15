const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const EmailTemplate = require('../models/EmailTemplate');
const PaymentGateway = require('../models/PaymentGateway');
const Lead = require('../models/Lead');
const mongoose = require('mongoose'); // Added for system health endpoint
const logger = require('../utils/logger'); // Added for system health endpoint

// Import enhanced models and services
const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');
const SecurityAlert = require('../models/SecurityAlert');
const SystemMetric = require('../models/SystemMetric');
const BackupJob = require('../models/BackupJob');
const monitoringService = require('../services/MonitoringService');
const cleanupService = require('../services/CleanupService');
const healthCheckService = require('../services/HealthCheckService');

const router = express.Router();

// ==================== ADMIN AUTHENTICATION ====================

// POST /api/admin/login - Admin login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Invalid input data' 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is admin
    console.log('User role:', user.role);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully');

    // Try to log activity, but don't fail if it doesn't work
    try {
      await Activity.create({
        user: user._id,
        type: 'admin_login',
        description: 'Admin logged in successfully'
      });
      console.log('Activity logged');
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError.message);
    }

    console.log('Admin login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        businessName: user.businessName
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// GET /api/admin/profile - Get admin profile
router.get('/profile', auth, adminAuth, async (req, res) => {
  try {
    // req.user is already the user object loaded by auth middleware
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Apply admin auth middleware to all other routes
router.use(auth);
router.use(adminAuth);

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Enhanced user management with advanced filtering
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      plan = '', 
      role = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom = '',
      dateTo = '',
      isActive = '',
      subscriptionStatus = '',
      lastLoginFrom = '',
      lastLoginTo = '',
      export: exportFormat = ''
    } = req.query;
    
    const filter = {};
    
    // Search filter - enhanced with multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'profile.company': { $regex: search, $options: 'i' } },
        { 'profile.position': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filters
    if (status) {
      filter['subscription.status'] = status;
    }
    
    if (subscriptionStatus) {
      filter['subscription.status'] = subscriptionStatus;
    }
    
    if (plan) {
      filter['plan'] = plan;
    }
    
    if (role) {
      filter.role = role;
    }

    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }
    
    // Date range filters
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (lastLoginFrom || lastLoginTo) {
      filter['lastLoginAt'] = {};
      if (lastLoginFrom) filter['lastLoginAt'].$gte = new Date(lastLoginFrom);
      if (lastLoginTo) filter['lastLoginAt'].$lte = new Date(lastLoginTo);
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Handle export requests
    if (exportFormat) {
      const allUsers = await User.find(filter)
        .select('-password -security.twoFactorSecret')
        .populate('plan')
        .sort(sort);

      if (exportFormat === 'csv') {
        const csv = convertUsersToCSV(allUsers);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
        return res.send(csv);
      } else if (exportFormat === 'excel') {
        const excel = await convertUsersToExcel(allUsers);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.xlsx');
        return res.send(excel);
      }
    }

    // Regular paginated response
    const users = await User.find(filter)
      .select('-password -security.twoFactorSecret')
      .populate('plan')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(filter);

    // Get user analytics
    const analytics = await getUserAnalytics(filter);

    res.json({
      success: true,
      users: users.map(user => ({
        ...user.toObject(),
        lastActivity: user.lastLoginAt || user.updatedAt,
        planName: user.plan?.name || 'No Plan',
        subscriptionDaysRemaining: calculateSubscriptionDaysRemaining(user),
        riskScore: calculateUserRiskScore(user),
        activityScore: calculateUserActivityScore(user),
        totalSpent: user.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      })),
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      analytics
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// GET /api/admin/users/:id - Get detailed user profile
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -security.twoFactorSecret')
      .populate('plan')
      .populate({
        path: 'leads',
        select: 'name email status source value createdAt',
        options: { limit: 10, sort: { createdAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user activities
    const activities = await Activity.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('type description createdAt metadata');

    // Get user's leads statistics
    const leadStats = await Lead.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Get user's payment history
    const payments = await Payment.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount status plan gateway createdAt');

    // Get user's usage statistics
    const usageStats = await getUserUsageStats(user._id);

    // Calculate user metrics
    const metrics = {
      riskScore: calculateUserRiskScore(user),
      activityScore: calculateUserActivityScore(user),
      conversionRate: calculateUserConversionRate(leadStats),
      lifetimeValue: calculateUserLifetimeValue(user),
      engagementScore: calculateUserEngagementScore(user)
    };

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        activities: activities.slice(0, 10),
        leadStats,
        payments,
        usageStats,
        metrics,
        subscription: {
          ...user.subscription,
          daysRemaining: calculateSubscriptionDaysRemaining(user),
          autoRenewal: user.subscription?.autoRenewal || false,
          nextBillingDate: calculateNextBillingDate(user)
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/users/:id - Enhanced user update
router.put('/users/:id', [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 1 }),
  body('role').optional().isIn(['user', 'admin', 'manager']),
  body('plan').optional().isMongoId(),
  body('subscription.status').optional().isIn(['active', 'trial', 'expired', 'cancelled']),
  body('profile.company').optional().isLength({ max: 100 }),
  body('profile.position').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const updateData = req.body;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's unique
    if (updateData.email && updateData.email !== currentUser.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Track changes for audit log
    const changes = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (currentUser[key] !== value) {
        changes.push({
          field: key,
          oldValue: currentUser[key],
          newValue: value
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedAt: new Date(),
        'audit.lastModifiedBy': req.user._id,
        'audit.lastModifiedAt': new Date()
      },
      { new: true, runValidators: true }
    ).select('-password').populate('plan');

    // Log the update activity
    await Activity.create({
      user: req.user._id,
      type: 'admin_user_update',
      description: `Admin updated user ${updatedUser.email}`,
      metadata: { 
        updatedUserId: userId,
        changes,
        adminEmail: req.user.email
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/users/bulk-action - Bulk operations on users
router.post('/users/bulk-action', [
  body('action').isIn(['activate', 'deactivate', 'delete', 'change-plan', 'send-email', 'export']),
  body('userIds').isArray().isLength({ min: 1 }),
  body('data').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { action, userIds, data } = req.body;
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'activate':
            await User.updateOne({ _id: userId }, { isActive: true });
            break;
            
          case 'deactivate':
            await User.updateOne({ _id: userId }, { isActive: false });
            break;
            
          case 'delete':
            // Soft delete - mark as deleted instead of removing
            await User.updateOne({ _id: userId }, { 
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: req.user._id
            });
            break;
            
          case 'change-plan':
            if (data.planId) {
              await User.updateOne({ _id: userId }, { plan: data.planId });
            }
            break;
            
          case 'send-email':
            if (data.emailTemplate && data.subject) {
              // Queue email for sending
              await queueEmailForUser(userId, data);
            }
            break;
        }
        
        results.success++;
      } catch (error) {
        console.error(`Bulk action failed for user ${userId}:`, error);
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    }

    // Log bulk action
    await Activity.create({
      user: req.user._id,
      type: 'admin_bulk_action',
      description: `Admin performed bulk action: ${action} on ${userIds.length} users`,
      metadata: {
        action,
        userCount: userIds.length,
        results,
        data
      }
    });

    res.json({
      success: true,
      message: `Bulk action completed: ${results.success} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/users/analytics - User analytics dashboard
router.get('/users/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getStartDateForTimeframe(timeframe);

    const analytics = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // User distribution by plan
      User.aggregate([
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
        {
          $group: {
            _id: { $ifNull: [{ $arrayElemAt: ['$planInfo.name', 0] }, 'No Plan'] },
            count: { $sum: 1 },
            revenue: { 
              $sum: { $ifNull: [{ $arrayElemAt: ['$planInfo.price', 0] }, 0] }
            }
          }
        }
      ]),

      // User activity metrics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { 
              $sum: { 
                $cond: [
                  { $gte: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            },
            newUsers: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', startDate] },
                  1,
                  0
                ]
              }
            },
            premiumUsers: {
              $sum: {
                $cond: [
                  { $ne: ['$plan', null] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),

      // Churn analysis
      User.aggregate([
        {
          $match: {
            'subscription.status': 'cancelled',
            'subscription.cancelledAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$subscription.cancelledAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        userGrowth: analytics[0],
        planDistribution: analytics[1],
        metrics: analytics[2][0] || {
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          premiumUsers: 0
        },
        churnData: analytics[3]
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions for enhanced user management
function calculateSubscriptionDaysRemaining(user) {
  if (!user.subscription?.endDate) return null;
  const now = new Date();
  const endDate = new Date(user.subscription.endDate);
  const diffTime = endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateUserRiskScore(user) {
  let score = 0;
  
  // Inactive users
  if (!user.lastLoginAt || (new Date() - user.lastLoginAt) > 30 * 24 * 60 * 60 * 1000) {
    score += 30;
  }
  
  // Subscription status
  if (user.subscription?.status === 'expired') score += 40;
  if (user.subscription?.status === 'cancelled') score += 50;
  
  // Payment failures
  if (user.billing?.failedPayments > 2) score += 25;
  
  // Account age
  const accountAge = (new Date() - user.createdAt) / (1000 * 60 * 60 * 24);
  if (accountAge < 7) score += 15; // New accounts are riskier
  
  return Math.min(score, 100);
}

function calculateUserActivityScore(user) {
  let score = 0;
  
  // Recent login
  if (user.lastLoginAt && (new Date() - user.lastLoginAt) < 7 * 24 * 60 * 60 * 1000) {
    score += 25;
  }
  
  // Has active subscription
  if (user.subscription?.status === 'active') score += 30;
  
  // Profile completion
  if (user.profile?.company) score += 10;
  if (user.profile?.position) score += 10;
  if (user.businessName) score += 15;
  if (user.phone) score += 10;
  
  return Math.min(score, 100);
}

async function getUserAnalytics(filter) {
  const total = await User.countDocuments(filter);
  const active = await User.countDocuments({ ...filter, isActive: true });
  const premium = await User.countDocuments({ ...filter, plan: { $ne: null } });
  const newThisMonth = await User.countDocuments({
    ...filter,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  return {
    total,
    active,
    inactive: total - active,
    premium,
    free: total - premium,
    newThisMonth,
    activeRate: total > 0 ? Math.round((active / total) * 100) : 0,
    premiumRate: total > 0 ? Math.round((premium / total) * 100) : 0
  };
}

function getStartDateForTimeframe(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// ==================== SUBSCRIPTION MANAGEMENT ====================

// GET /api/admin/subscriptions - Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      plan = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    
    if (status) {
      filter['subscription.status'] = status;
    }
    
    if (plan) {
      filter['plan'] = plan;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('name email subscription plan createdAt')
      .populate('plan')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      subscriptions: users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/subscriptions/:id/upgrade - Upgrade user subscription
router.put('/subscriptions/:id/upgrade', [
  body('planId').isMongoId(),
  body('billingCycle').optional().isIn(['monthly', 'yearly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, billingCycle = 'monthly' } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Update user plan
    user.plan = planId;
    user.subscription.status = 'active';
    user.subscription.startDate = new Date();
    user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await user.save();

    // Log activity
    await Activity.create({
      user: req.params.id,
      type: 'subscription_upgraded',
      description: `Subscription upgraded to ${plan.name}`,
      metadata: { planId, billingCycle }
    });

    res.json({ message: 'Subscription upgraded successfully', user });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/subscriptions/:id/downgrade - Downgrade user subscription
router.put('/subscriptions/:id/downgrade', [
  body('planId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Update user plan
    user.plan = planId;
    await user.save();

    // Log activity
    await Activity.create({
      user: req.params.id,
      type: 'subscription_downgraded',
      description: `Subscription downgraded to ${plan.name}`,
      metadata: { planId }
    });

    res.json({ message: 'Subscription downgraded successfully', user });
  } catch (error) {
    console.error('Downgrade subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PLANS MANAGEMENT ====================

// GET /api/admin/plans - Get all plans with usage statistics
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ 'price.monthly': 1 });
    
    // Get usage statistics for each plan
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const stats = await User.aggregate([
          { $match: { plan: plan._id } },
          { 
            $group: { 
              _id: null, 
              totalUsers: { $sum: 1 },
              activeUsers: { $sum: { $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0] } },
              averageRevenue: { $avg: '$plan.price.monthly' }
            }
          }
        ]);
        
        return {
          ...plan.toObject(),
          stats: stats[0] || { totalUsers: 0, activeUsers: 0, averageRevenue: 0 }
        };
      })
    );
    
    res.json(plansWithStats);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/plans - Create new plan
router.post('/plans', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    
    res.status(201).json({
      success: true,
      plan,
      message: 'Plan created successfully'
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plan',
      error: error.message
    });
  }
});

// PUT /api/admin/plans/:id - Update plan
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      plan,
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan',
      error: error.message
    });
  }
});

// DELETE /api/admin/plans/:id - Delete plan
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan',
      error: error.message
    });
  }
});

// ==================== EMAIL TEMPLATES MANAGEMENT ====================

// GET /api/admin/email-templates - Get all email templates
router.get('/email-templates', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Status filter
    if (status) {
      filter.isActive = status === 'active';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const templates = await EmailTemplate.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await EmailTemplate.countDocuments(filter);

    res.json({
      success: true,
      templates,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/admin/email-templates/:id - Get email template by ID
router.get('/email-templates/:id', async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/admin/email-templates - Create new email template
router.post('/email-templates', [
  body('name').notEmpty().withMessage('Template name is required'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('htmlContent').notEmpty().withMessage('HTML content is required'),
  body('textContent').notEmpty().withMessage('Text content is required'),
  body('category').isIn(['user_management', 'billing', 'notifications', 'marketing', 'system'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const templateData = {
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const template = new EmailTemplate(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      template,
      message: 'Email template created successfully'
    });
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email template',
      error: error.message
    });
  }
});

// PUT /api/admin/email-templates/:id - Update email template
router.put('/email-templates/:id', [
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('htmlContent').optional().notEmpty().withMessage('HTML content cannot be empty'),
  body('textContent').optional().notEmpty().withMessage('Text content cannot be empty'),
  body('category').optional().isIn(['user_management', 'billing', 'notifications', 'marketing', 'system'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.json({
      success: true,
      template,
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
});

// DELETE /api/admin/email-templates/:id - Delete email template
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Prevent deleting default templates
    if (template.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default email templates'
      });
    }

    await EmailTemplate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email template',
      error: error.message
    });
  }
});

// POST /api/admin/email-templates/:id/preview - Preview email template
router.post('/email-templates/:id/preview', async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    const variables = req.body.variables || {};
    const rendered = template.render(variables);
    const validation = template.validateVariables(variables);

    res.json({
      success: true,
      preview: rendered,
      validation,
      template: {
        name: template.name,
        displayName: template.displayName,
        variables: template.variables
      }
    });
  } catch (error) {
    console.error('Preview email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview email template',
      error: error.message
    });
  }
});

// ==================== PAYMENT GATEWAYS MANAGEMENT ====================

// GET /api/admin/payment-gateways - Get all payment gateways
router.get('/payment-gateways', async (req, res) => {
  try {
    const { 
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const gateways = await PaymentGateway.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort);

    res.json({
      success: true,
      gateways
    });
  } catch (error) {
    console.error('Get payment gateways error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/admin/payment-gateways/:id - Get payment gateway by ID
router.get('/payment-gateways/:id', async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Payment gateway not found'
      });
    }

    res.json({
      success: true,
      gateway
    });
  } catch (error) {
    console.error('Get payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/admin/payment-gateways/:id - Update payment gateway
router.put('/payment-gateways/:id', [
  body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    const gateway = await PaymentGateway.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Payment gateway not found'
      });
    }

    res.json({
      success: true,
      gateway,
      message: 'Payment gateway updated successfully'
    });
  } catch (error) {
    console.error('Update payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment gateway',
      error: error.message
    });
  }
});

// POST /api/admin/payment-gateways/:id/test - Test payment gateway connection
router.post('/payment-gateways/:id/test', async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Payment gateway not found'
      });
    }

    const testResult = await gateway.testConnection();

    res.json({
      success: true,
      testResult,
      gateway: {
        name: gateway.name,
        displayName: gateway.displayName,
        status: gateway.status
      }
    });
  } catch (error) {
    console.error('Test payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test payment gateway',
      error: error.message
    });
  }
});

// ==================== USER ACTIVITY MONITORING ====================

// GET /api/admin/activities - Get all user activities
router.get('/activities', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId = '',
      leadId = '',
      type = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (userId) filter.userId = userId;
    if (leadId) filter.leadId = leadId;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const activities = await Activity.find(filter)
      .populate('userId', 'name email phone businessName')
      .populate('leadId', 'name email phone company')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Activity.countDocuments(filter);

    // Get activity type counts
    const typeCounts = await Activity.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      activities,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET /api/admin/activities/stats - Get activity statistics
router.get('/activities/stats', async (req, res) => {
  try {
    const { period = '7d', userId = '' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const baseFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (userId) baseFilter.userId = userId;

    const [
      totalActivities,
      activitiesByType,
      activitiesByDay,
      topUsers,
      topLeads
    ] = await Promise.all([
      Activity.countDocuments(baseFilter),
      Activity.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Activity.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Activity.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, count: 1, 'user.name': 1, 'user.email': 1 } }
      ]),
      Activity.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$leadId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'leads', localField: '_id', foreignField: '_id', as: 'lead' } },
        { $unwind: '$lead' },
        { $project: { _id: 1, count: 1, 'lead.name': 1, 'lead.email': 1, 'lead.phone': 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalActivities,
        activitiesByType: activitiesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        activitiesByDay: activitiesByDay.map(item => ({
          date: item._id,
          count: item.count
        })),
        topUsers: topUsers.map(item => ({
          userId: item._id,
          name: item.user.name,
          email: item.user.email,
          activityCount: item.count
        })),
        topLeads: topLeads.map(item => ({
          leadId: item._id,
          name: item.lead.name,
          email: item.lead.email,
          phone: item.lead.phone,
          activityCount: item.count
        }))
      },
      period,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

// GET /api/admin/leads/sync-status - Check lead synchronization status
router.get('/leads/sync-status', async (req, res) => {
  try {
    const [
      totalLeads,
      recentLeads,
      leadsByStatus,
      leadsBySource,
      leadsWithActivities,
      orphanedActivities
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      Activity.distinct('leadId'),
      Activity.aggregate([
        {
          $lookup: {
            from: 'leads',
            localField: 'leadId',
            foreignField: '_id',
            as: 'lead'
          }
        },
        { $match: { lead: { $size: 0 } } },
        { $count: 'orphaned' }
      ])
    ]);

    res.json({
      success: true,
      syncStatus: {
        totalLeads,
        recentLeads,
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        leadsBySource: leadsBySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        leadsWithActivities: leadsWithActivities.length,
        orphanedActivities: orphanedActivities[0]?.orphaned || 0,
        lastChecked: new Date()
      }
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check synchronization status',
      error: error.message
    });
  }
});

// POST /api/admin/sync/cleanup - Clean up orphaned data
router.post('/sync/cleanup', async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    const results = {};

    if (type === 'all' || type === 'activities') {
      // Remove activities for non-existent leads
      const orphanedActivities = await Activity.aggregate([
        {
          $lookup: {
            from: 'leads',
            localField: 'leadId',
            foreignField: '_id',
            as: 'lead'
          }
        },
        { $match: { lead: { $size: 0 } } },
        { $project: { _id: 1 } }
      ]);

      const orphanedIds = orphanedActivities.map(a => a._id);
      if (orphanedIds.length > 0) {
        await Activity.deleteMany({ _id: { $in: orphanedIds } });
      }
      
      results.orphanedActivitiesRemoved = orphanedIds.length;
    }

    if (type === 'all' || type === 'notifications') {
      // Remove notifications for non-existent users
      const orphanedNotifications = await Notification.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $match: { user: { $size: 0 } } },
        { $project: { _id: 1 } }
      ]);

      const orphanedNotificationIds = orphanedNotifications.map(n => n._id);
      if (orphanedNotificationIds.length > 0) {
        await Notification.deleteMany({ _id: { $in: orphanedNotificationIds } });
      }
      
      results.orphanedNotificationsRemoved = orphanedNotificationIds.length;
    }

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      results
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup orphaned data',
      error: error.message
    });
  }
});

// GET /api/admin/dashboard-overview - Get comprehensive dashboard data
router.get('/dashboard-overview', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalLeads,
      todayLeads,
      totalActivities,
      todayActivities,
      usersByPlan,
      leadsByStatus,
      recentActivities
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Lead.countDocuments(),
      Lead.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Activity.countDocuments(),
      Activity.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      User.aggregate([
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planDetails' } },
        { $unwind: { path: '$planDetails', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$planDetails.name', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Activity.find()
        .populate('userId', 'name email')
        .populate('leadId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      overview: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byPlan: usersByPlan.reduce((acc, item) => {
            acc[item._id || 'Free'] = item.count;
            return acc;
          }, {})
        },
        leads: {
          total: totalLeads,
          today: todayLeads,
          byStatus: leadsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        activities: {
          total: totalActivities,
          today: todayActivities
        },
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message
    });
  }
});

// Add real-time dashboard endpoints
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const [
      totalUsers,
      totalLeads,
      todayLeads,
      totalActivities,
      recentActivities,
      recentNotifications
    ] = await Promise.all([
      User.countDocuments(),
      Lead.countDocuments(),
      Lead.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Activity.countDocuments(),
      Activity.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'name email avatar'),
      Notification.find({ type: 'admin' })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Calculate conversion rate
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 : 0;

    // Mock revenue calculation (integrate with your payment system)
    const revenue = 125000;

    // Get active users count from WebSocket service
    const webSocketStats = require('../utils/websocket').getStats();
    const activeUsers = webSocketStats.connectedUsers;

    const stats = {
      totalUsers,
      activeUsers,
      totalLeads,
      todayLeads,
      conversionRate,
      revenue,
      totalActivities
    };

    const activities = recentActivities.map(activity => ({
      id: activity._id,
      type: activity.type || 'general',
      message: activity.description,
      timestamp: activity.createdAt || activity.timestamp,
      userId: activity.userId?._id,
      userName: activity.userId?.name,
      userEmail: activity.userId?.email,
      avatar: activity.userId?.avatar || `/api/placeholder/40/40`
    }));

    const notifications = recentNotifications.map(notification => ({
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      severity: notification.priority || 'info',
      timestamp: notification.createdAt
    }));

    res.json({
      stats,
      activities,
      notifications,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
});

// Real-time metrics endpoint
router.get('/metrics/realtime', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const webSocketStats = require('../utils/websocket').getStats();
    
    const metrics = {
      connections: {
        totalConnections: webSocketStats.totalConnections,
        connectedUsers: webSocketStats.connectedUsers,
        connectedAdmins: webSocketStats.connectedAdmins
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      },
      database: {
        connectionState: mongoose.connection.readyState,
        dbName: mongoose.connection.name
      }
    };

    res.json(metrics);

  } catch (error) {
    logger.error('Error fetching real-time metrics:', error);
    res.status(500).json({ 
      message: 'Error fetching metrics',
      error: error.message 
    });
  }
});

// Live activity feed endpoint
router.get('/activities/live', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { page = 1, limit = 20, type, userId, dateFrom, dateTo } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email avatar');

    const totalActivities = await Activity.countDocuments(filter);

    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata,
        userId: activity.userId?._id,
        userName: activity.userId?.name,
        userEmail: activity.userId?.email,
        timestamp: activity.createdAt || activity.timestamp
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalActivities,
        pages: Math.ceil(totalActivities / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching live activities:', error);
    res.status(500).json({ 
      message: 'Error fetching activities',
      error: error.message 
    });
  }
});

// System health endpoint
router.get('/system/health', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const webSocketService = require('../utils/websocket');
    const realtimeService = require('../services/RealtimeDatabase');

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          state: mongoose.connection.readyState,
          name: mongoose.connection.name
        },
        websocket: {
          status: webSocketService.isInitialized ? 'running' : 'stopped',
          connections: webSocketService.getStats()
        },
        realtime: {
          status: realtimeService.isInitialized ? 'running' : 'stopped'
        }
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform
      }
    };

    // Determine overall health status
    const unhealthyServices = Object.values(health.services).filter(
      service => service.status !== 'connected' && service.status !== 'running'
    );
    
    if (unhealthyServices.length > 0) {
      health.status = 'degraded';
    }

    res.json(health);

  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching system health',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Broadcast admin message endpoint
router.post('/broadcast', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { message, type = 'info', targetUsers } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const webSocketService = require('../utils/websocket');
    
    // Create notification record
    const notification = new Notification({
      title: 'Admin Broadcast',
      message,
      type: 'admin_broadcast',
      priority: type,
      createdBy: req.user.id,
      targetUsers: targetUsers || 'all'
    });

    await notification.save();

    // Broadcast via WebSocket
    if (targetUsers && Array.isArray(targetUsers)) {
      // Send to specific users
      targetUsers.forEach(userId => {
        webSocketService.io?.to(`user_${userId}`).emit('admin:notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: notification.createdAt
        });
      });
    } else {
      // Broadcast to all users
      webSocketService.io?.emit('admin:notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt
      });
    }

    res.json({
      message: 'Broadcast sent successfully',
      notificationId: notification._id,
      sentAt: new Date()
    });

  } catch (error) {
    logger.error('Error broadcasting message:', error);
    res.status(500).json({ 
      message: 'Error broadcasting message',
      error: error.message 
    });
  }
});

// System alerts endpoint
router.post('/alerts', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { message, severity = 'info', autoResolve = false } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Alert message is required' });
    }

    const webSocketService = require('../utils/websocket');
    
    // Send system alert
    webSocketService.sendSystemAlert({
      message,
      severity,
      createdBy: req.user.id,
      autoResolve
    });

    // Log the alert
    const activity = new Activity({
      userId: req.user.id,
      type: 'system_alert',
      description: `System alert created: ${message}`,
      metadata: { severity, autoResolve }
    });

    await activity.save();

    res.json({
      message: 'System alert sent successfully',
      alertData: { message, severity, autoResolve },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error creating system alert:', error);
    res.status(500).json({ 
      message: 'Error creating system alert',
      error: error.message 
    });
  }
});

// GET /api/admin/users/:id/leads - Get user's leads
router.get('/users/:id/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    
    const filter = { userId: req.params.id };
    if (status) filter.status = status;

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Lead.countDocuments(filter);

    res.json({
      success: true,
      leads,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user leads',
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/activities - Get user's activities
router.get('/users/:id/activities', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const activities = await Activity.find({ userId: req.params.id })
      .populate('leadId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Activity.countDocuments({ userId: req.params.id });

    res.json({
      success: true,
      activities,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activities',
      error: error.message
    });
  }
});

// ==================== ADVANCED ANALYTICS ====================

// GET /api/admin/analytics/advanced - Get advanced analytics data
router.get('/analytics/advanced', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ createdAt: { $gte: startDate } });
    
    // Revenue calculation (mock for now)
    const revenue = {
      current: 125000,
      previous: 98000,
      trend: 'up',
      change: 27.55,
    };

    // User growth
    const users = {
      current: totalUsers,
      previous: Math.floor(totalUsers * 0.94),
      trend: 'up',
      change: 5.93,
    };

    // Lead metrics
    const leads = {
      current: totalLeads,
      previous: Math.floor(totalLeads * 0.91),
      trend: 'up',
      change: 9.09,
    };

    // Conversion rate
    const conversion = {
      current: 24.5,
      previous: 22.1,
      trend: 'up',
      change: 10.86,
    };

    // Chart data generation
    const chartData = {
      revenue: [],
      userAcquisition: [
        { name: 'Organic', value: 45, color: '#0088FE' },
        { name: 'Social Media', value: 25, color: '#00C49F' },
        { name: 'Referral', value: 20, color: '#FFBB28' },
        { name: 'Paid Ads', value: 10, color: '#FF8042' },
      ],
      planDistribution: await User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $lookup: { from: 'plans', localField: '_id', foreignField: '_id', as: 'planDetails' } },
        { $project: { plan: { $arrayElemAt: ['$planDetails.name', 0] }, users: '$count', revenue: { $multiply: ['$count', 50] } } }
      ]),
      leadSources: await Lead.aggregate([
        { $group: { _id: '$source', leads: { $sum: 1 }, conversion: { $avg: '$conversionRate' } } },
        { $project: { source: "$_id", leads: 1, conversion: { $round: ['$conversion', 0] } } }
      ]),
    };

    // Generate revenue trend data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      chartData.revenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000) + 15000,
        users: Math.floor(Math.random() * 50) + 100,
      });
    }

    // Top performers
    const topPerformers = await User.aggregate([
      { $match: { role: 'user' } },
      { $lookup: { from: 'leads', localField: '_id', foreignField: 'assignedTo', as: 'leads' } },
      { $addFields: { leadCount: { $size: '$leads' }, revenue: { $multiply: [{ $size: '$leads' }, 500] } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { user: '$name', email: '$email', revenue: 1, leads: '$leadCount' } }
    ]);

    res.json({
      analytics: { revenue, users, leads, conversion },
      chartData,
      topPerformers,
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

// GET /api/admin/analytics/export - Export analytics data
router.get('/analytics/export', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Get data for export
    const users = await User.find({}, 'name email createdAt subscription.status plan').populate('plan');
    const leads = await Lead.find({}, 'name email company source status createdAt');
    
    // Create CSV content
    let csvContent = 'Type,Name,Email,Date,Status,Additional\n';
    
    users.forEach(user => {
      csvContent += `User,${user.name},${user.email},${user.createdAt.toISOString()},${user.subscription?.status || 'inactive'},${user.plan?.name || 'Free'}\n`;
    });
    
    leads.forEach(lead => {
      csvContent += `Lead,${lead.name},${lead.email},${lead.createdAt.toISOString()},${lead.status},${lead.source}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
});

// ==================== USER COMMUNICATION ====================

// GET /api/admin/communication/templates - Get communication templates
router.get('/communication/templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.find({});
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to load templates' });
  }
});

// GET /api/admin/communication/campaigns - Get campaign history
router.get('/communication/campaigns', async (req, res) => {
  try {
    // Mock campaign data for now
    const campaigns = [
      { id: 1, name: 'Monthly Newsletter', type: 'email', sent: 1250, opened: 756, clicked: 189, date: '2024-01-15' },
      { id: 2, name: 'Product Update', type: 'email', sent: 890, opened: 534, clicked: 156, date: '2024-01-10' },
      { id: 3, name: 'Payment Reminders', type: 'sms', sent: 45, delivered: 43, replied: 12, date: '2024-01-08' },
    ];
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Failed to load campaigns' });
  }
});

// POST /api/admin/communication/send - Send bulk message
router.post('/communication/send', [
  body('type').isIn(['email', 'sms', 'whatsapp']),
  body('content').notEmpty(),
  body('recipients').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, subject, content, recipients, scheduleDate } = req.body;

    // Get recipient users
    const users = await User.find({ _id: { $in: recipients } });
    
    if (scheduleDate && new Date(scheduleDate) > new Date()) {
      // Schedule the message
      console.log(`Scheduling ${type} message for ${users.length} recipients at ${scheduleDate}`);
      
      // In a real implementation, you would use a job queue like Bull or Agenda
      // For now, just log the scheduled message
      
      res.json({ 
        success: true, 
        message: `Message scheduled successfully for ${users.length} recipients`,
        scheduledFor: scheduleDate
      });
    } else {
      // Send immediately
      console.log(`Sending ${type} message to ${users.length} recipients`);
      
      // Mock sending logic - in real implementation, integrate with email/SMS/WhatsApp services
      const sentCount = users.length;
      const deliveredCount = Math.floor(sentCount * 0.95);
      
      // Log activity
      await Activity.create({
        user: req.user.id,
        type: 'admin_bulk_message',
        description: `Admin sent ${type} message to ${sentCount} users`,
        metadata: { type, recipients: sentCount, subject: subject || 'N/A' }
      });

      res.json({ 
        success: true, 
        message: `Message sent successfully`,
        sent: sentCount,
        delivered: deliveredCount
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// ==================== LEAD MANAGEMENT ====================

// GET /api/admin/leads/advanced - Get leads with advanced filtering
router.get('/leads/advanced', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      source = '',
      status = '',
      priority = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leads = await Lead.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'name email');

    const total = await Lead.countDocuments(filter);

    res.json({
      leads,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Failed to load leads' });
  }
});

// GET /api/admin/leads/analytics - Get lead analytics
router.get('/leads/analytics', async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newToday = await Lead.countDocuments({ 
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const converted = await Lead.countDocuments({ status: 'closed' });
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;
    const averageScore = await Lead.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const hotLeads = await Lead.countDocuments({ priority: 'hot' });

    const analytics = {
      totalLeads,
      newToday,
      converted,
      conversionRate: parseFloat(conversionRate),
      averageScore: averageScore[0]?.avgScore ? averageScore[0].avgScore.toFixed(1) : 0,
      hotLeads,
    };

    // Generate chart data
    const leadTrend = await Lead.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          leads: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);

    const sourceDistribution = await Lead.aggregate([
      { $group: { _id: "$source", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    const conversionFunnel = [
      { stage: 'New Leads', count: await Lead.countDocuments({ status: 'new' }) },
      { stage: 'Contacted', count: await Lead.countDocuments({ status: 'contacted' }) },
      { stage: 'Qualified', count: await Lead.countDocuments({ status: 'qualified' }) },
      { stage: 'Proposal', count: await Lead.countDocuments({ status: 'proposal' }) },
      { stage: 'Closed', count: await Lead.countDocuments({ status: 'closed' }) },
    ];

    const scoreDistribution = await Lead.aggregate([
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 21, 41, 61, 81, 101],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "0-20" },
                { case: { $eq: ["$_id", 21] }, then: "21-40" },
                { case: { $eq: ["$_id", 41] }, then: "41-60" },
                { case: { $eq: ["$_id", 61] }, then: "61-80" },
                { case: { $eq: ["$_id", 81] }, then: "81-100" }
              ],
              default: "Other"
            }
          },
          count: 1
        }
      }
    ]);

    const chartData = {
      leadTrend: leadTrend.map(item => ({
        date: item._id,
        leads: item.leads,
        converted: item.converted
      })),
      sourceDistribution: sourceDistribution.map((item, index) => ({
        ...item,
        color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]
      })),
      conversionFunnel,
      scoreDistribution,
    };

    res.json({ analytics, chartData });
  } catch (error) {
    console.error('Lead analytics error:', error);
    res.status(500).json({ message: 'Failed to load lead analytics' });
  }
});

// PATCH /api/admin/leads/:id/status - Update lead status
router.patch('/leads/:id/status', [
  body('status').isIn(['new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status, lastActivity: new Date() },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_lead_update',
      description: `Admin updated lead ${lead.name} status to ${status}`,
      metadata: { leadId: lead._id, newStatus: status }
    });

    res.json({ success: true, lead });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ message: 'Failed to update lead status' });
  }
});

// ==================== SYSTEM MONITORING ====================

// GET /api/admin/system/health - Get system health metrics
router.get('/system/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Database metrics
    const userCount = await User.countDocuments();
    const leadCount = await Lead.countDocuments();
    const activityCount = await Activity.countDocuments();
    
    // Error rate (mock calculation)
    const errorRate = Math.random() * 0.05; // 0-5% error rate
    
    // Response time (mock)
    const avgResponseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
    
    const health = {
      status: 'healthy',
      database: {
        status: dbStatus,
        collections: {
          users: userCount,
          leads: leadCount,
          activities: activityCount,
        }
      },
      server: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        cpu: Math.floor(Math.random() * 30) + 10, // 10-40% CPU usage
      },
      performance: {
        errorRate: (errorRate * 100).toFixed(2),
        avgResponseTime,
        throughput: Math.floor(Math.random() * 1000) + 500, // 500-1500 requests/min
      },
      timestamp: new Date().toISOString(),
    };

    res.json({ health });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ 
      health: { 
        status: 'unhealthy', 
        error: 'Failed to get system health',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

// ==================== ENHANCED REPORTING ====================

// GET /api/admin/reports/custom - Generate custom reports
router.get('/reports/custom', async (req, res) => {
  try {
    const { 
      reportType = 'users',
      dateFrom,
      dateTo,
      groupBy = 'day',
      metrics = 'count'
    } = req.query;

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    let reportData;

    switch (reportType) {
      case 'users':
        reportData = await User.aggregate([
          { $match: dateFilter.createdAt ? { createdAt: dateFilter } : {} },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: groupBy === 'month' ? "%Y-%m" : "%Y-%m-%d", 
                  date: "$createdAt" 
                }
              },
              count: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'leads':
        reportData = await Lead.aggregate([
          { $match: dateFilter.createdAt ? { createdAt: dateFilter } : {} },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: groupBy === 'month' ? "%Y-%m" : "%Y-%m-%d", 
                  date: "$createdAt" 
                }
              },
              count: { $sum: 1 },
              converted: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
              avgScore: { $avg: "$score" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'revenue':
        // Mock revenue data
        reportData = [
          { _id: '2024-01-01', revenue: 15000, subscriptions: 120 },
          { _id: '2024-01-02', revenue: 18000, subscriptions: 145 },
          { _id: '2024-01-03', revenue: 22000, subscriptions: 165 },
        ];
        break;

      default:
        reportData = [];
    }

    res.json({ reportData, reportType, dateRange: { from: dateFrom, to: dateTo } });
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({ message: 'Failed to generate custom report' });
  }
});

// POST /api/admin/reports/schedule - Schedule automated reports
router.post('/reports/schedule', [
  body('name').notEmpty(),
  body('reportType').isIn(['users', 'leads', 'revenue', 'analytics']),
  body('frequency').isIn(['daily', 'weekly', 'monthly']),
  body('recipients').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, reportType, frequency, recipients, filters } = req.body;

    // In a real implementation, you would store this in a database and use a job scheduler
    const scheduledReport = {
      id: Date.now(),
      name,
      reportType,
      frequency,
      recipients,
      filters,
      createdBy: req.user.id,
      createdAt: new Date(),
      status: 'active',
    };

    console.log('Scheduled report:', scheduledReport);

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_schedule_report',
      description: `Admin scheduled ${frequency} ${reportType} report: ${name}`,
      metadata: { reportType, frequency, recipientCount: recipients.length }
    });

    res.json({ 
      success: true, 
      message: 'Report scheduled successfully',
      scheduledReport
    });
  } catch (error) {
    console.error('Schedule report error:', error);
    res.status(500).json({ message: 'Failed to schedule report' });
  }
});

// ==================== API MANAGEMENT ====================

// GET /api/admin/api-keys - Get all API keys with filtering
router.get('/api-keys', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      userId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // User filter
    if (userId) {
      filter.userId = userId;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ApiKey = require('../models/ApiKey');
    const apiKeys = await ApiKey.find(filter)
      .select('-secret') // Don't expose secrets
      .populate('userId', 'name email businessName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ApiKey.countDocuments(filter);

    res.json({
      success: true,
      apiKeys,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
  }
});

// POST /api/admin/api-keys - Create new API key
router.post('/api-keys', [
  body('name').notEmpty().trim(),
  body('userId').isMongoId(),
  body('permissions').isArray().optional(),
  body('rateLimit').isObject().optional(),
  body('allowedIPs').isArray().optional(),
  body('allowedDomains').isArray().optional(),
  body('expiresAt').isISO8601().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      userId,
      permissions = ['read'],
      rateLimit = {},
      allowedIPs = [],
      allowedDomains = [],
      expiresAt
    } = req.body;

    const ApiKey = require('../models/ApiKey');
    
    // Generate API key and secret
    const key = ApiKey.generateKey();
    const secret = ApiKey.generateSecret();

    const apiKey = new ApiKey({
      name,
      key,
      secret,
      userId,
      permissions,
      rateLimit: {
        requestsPerMinute: rateLimit.requestsPerMinute || 100,
        requestsPerHour: rateLimit.requestsPerHour || 1000,
        requestsPerDay: rateLimit.requestsPerDay || 10000
      },
      allowedIPs,
      allowedDomains,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await apiKey.save();

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_create_api_key',
      description: `Admin created API key '${name}' for user ${userId}`,
      metadata: { apiKeyId: apiKey._id, permissions, rateLimit }
    });

    res.json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key,
        secret: apiKey.secret, // Only show secret on creation
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        allowedIPs: apiKey.allowedIPs,
        allowedDomains: apiKey.allowedDomains,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ success: false, message: 'Failed to create API key' });
  }
});

// PUT /api/admin/api-keys/:id - Update API key
router.put('/api-keys/:id', [
  body('name').optional().trim(),
  body('permissions').isArray().optional(),
  body('rateLimit').isObject().optional(),
  body('allowedIPs').isArray().optional(),
  body('allowedDomains').isArray().optional(),
  body('expiresAt').isISO8601().optional(),
  body('status').isIn(['active', 'inactive', 'revoked']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const ApiKey = require('../models/ApiKey');
    const apiKey = await ApiKey.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email businessName');

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_update_api_key',
      description: `Admin updated API key '${apiKey.name}'`,
      metadata: { apiKeyId: apiKey._id, updates: Object.keys(updateData) }
    });

    res.json({
      success: true,
      message: 'API key updated successfully',
      apiKey
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ success: false, message: 'Failed to update API key' });
  }
});

// DELETE /api/admin/api-keys/:id - Delete API key
router.delete('/api-keys/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ApiKey = require('../models/ApiKey');
    const apiKey = await ApiKey.findByIdAndDelete(id);

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_delete_api_key',
      description: `Admin deleted API key '${apiKey.name}'`,
      metadata: { apiKeyId: apiKey._id, userId: apiKey.userId }
    });

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete API key' });
  }
});

// POST /api/admin/api-keys/:id/regenerate - Regenerate API key
router.post('/api-keys/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;

    const ApiKey = require('../models/ApiKey');
    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    // Generate new key and secret
    apiKey.key = ApiKey.generateKey();
    apiKey.secret = ApiKey.generateSecret();
    apiKey.totalRequests = 0;
    apiKey.monthlyRequests = 0;
    
    await apiKey.save();

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_regenerate_api_key',
      description: `Admin regenerated API key '${apiKey.name}'`,
      metadata: { apiKeyId: apiKey._id, userId: apiKey.userId }
    });

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      apiKey: {
        id: apiKey._id,
        key: apiKey.key,
        secret: apiKey.secret // Show new secret
      }
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate API key' });
  }
});

// GET /api/admin/api-analytics - Get API analytics
router.get('/api-analytics', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      apiKeyId,
      userId,
      endpoint,
      method,
      groupBy = 'hour'
    } = req.query;

    const ApiRequestLog = require('../models/ApiRequestLog');
    
    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (apiKeyId) filters.apiKeyId = apiKeyId;
    if (userId) filters.userId = userId;
    if (endpoint) filters.endpoint = endpoint;
    if (method) filters.method = method;

    const analyticsData = await ApiRequestLog.getAnalytics(filters);
    const topEndpoints = await ApiRequestLog.getTopEndpoints(10, filters);

    // Get summary statistics
    const totalRequests = await ApiRequestLog.countDocuments(filters);
    const errorRequests = await ApiRequestLog.countDocuments({
      ...filters,
      statusCode: { $gte: 400 }
    });

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Get average response time
    const avgResponseTimeResult = await ApiRequestLog.aggregate([
      { $match: filters },
      { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } }
    ]);
    
    const avgResponseTime = avgResponseTimeResult.length > 0 ? 
      avgResponseTimeResult[0].avgResponseTime : 0;

    res.json({
      success: true,
      analytics: {
        summary: {
          totalRequests,
          errorRequests,
          errorRate: errorRate.toFixed(2),
          avgResponseTime: Math.round(avgResponseTime)
        },
        timeline: analyticsData,
        topEndpoints
      }
    });
  } catch (error) {
    console.error('API analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API analytics' });
  }
});

// GET /api/admin/api-logs - Get API request logs
router.get('/api-logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode,
      ipAddress,
      startDate,
      endDate,
      isBlocked,
      isSuspicious
    } = req.query;

    const filter = {};
    
    if (apiKeyId) filter.apiKeyId = apiKeyId;
    if (userId) filter.userId = userId;
    if (endpoint) filter.endpoint = { $regex: endpoint, $options: 'i' };
    if (method) filter.method = method;
    if (statusCode) filter.statusCode = parseInt(statusCode);
    if (ipAddress) filter.ipAddress = ipAddress;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
    if (isSuspicious !== undefined) filter.isSuspicious = isSuspicious === 'true';
    
    if (startDate) filter.timestamp = { $gte: new Date(startDate) };
    if (endDate) {
      filter.timestamp = filter.timestamp || {};
      filter.timestamp.$lte = new Date(endDate);
    }

    const ApiRequestLog = require('../models/ApiRequestLog');
    const logs = await ApiRequestLog.find(filter)
      .populate('apiKeyId', 'name')
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ApiRequestLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('API logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API logs' });
  }
});

// POST /api/admin/api-security/block-ip - Block IP address
router.post('/api-security/block-ip', [
  body('ipAddress').isIP(),
  body('reason').notEmpty(),
  body('duration').isInt({ min: 1 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { ipAddress, reason, duration = 60 } = req.body; // duration in minutes

    const { blockedIPsCache } = require('../middleware/apiKeyAuth');
    
    // Add to blocked IPs cache
    blockedIPsCache.set(ipAddress, {
      reason,
      expiresAt: Date.now() + (duration * 60 * 1000),
      blockedBy: req.user.id,
      blockedAt: new Date()
    });

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'admin_block_ip',
      description: `Admin blocked IP address ${ipAddress} for ${reason}`,
      metadata: { ipAddress, reason, duration }
    });

    res.json({
      success: true,
      message: 'IP address blocked successfully',
      blockedIP: {
        ipAddress,
        reason,
        expiresAt: new Date(Date.now() + (duration * 60 * 1000))
      }
    });
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ success: false, message: 'Failed to block IP address' });
  }
});

// ==================== STAFF MANAGEMENT ====================

// GET /api/admin/staff - Get all staff members with filtering
router.get('/staff', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '',
      department = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { role: { $in: ['admin', 'manager', 'support', 'finance'] } };
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'profile.department': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (status !== '') filter.isActive = status === 'active';
    if (department) filter['profile.department'] = department;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const staff = await User.find(filter)
      .select('-password -security.twoFactorSecret')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(filter);

    // Get audit logs for staff
    const auditLogs = await Activity.find({
      type: { $in: ['staff_created', 'staff_updated', 'staff_deleted', 'role_changed'] }
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    res.json({
      success: true,
      staff,
      auditLogs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
});

// POST /api/admin/staff - Create new staff member
router.post('/staff', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'manager', 'support', 'finance']),
  body('department').optional().trim(),
  body('phone').optional().trim(),
  body('permissions').isArray().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, role, department, phone, permissions = [], notes = '' } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const staff = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      phone,
      profile: {
        department: department || '',
        position: role,
        joiningDate: new Date(),
        emergencyContact: '',
        address: '',
        notes
      },
      permissions: permissions || [],
      isEmailVerified: false,
      mustChangePassword: true
    });

    await staff.save();

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'staff_created',
      description: `Created new staff member: ${name} (${role})`,
      metadata: { staffId: staff._id, role, department }
    });

    // TODO: Send welcome email with temporary password

    res.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.profile.department,
        isActive: staff.isActive,
        createdAt: staff.createdAt
      },
      tempPassword // Only show on creation for admin
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff member' });
  }
});

// PUT /api/admin/staff/:id - Update staff member
router.put('/staff/:id', [
  body('name').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'manager', 'support', 'finance']),
  body('department').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('permissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const staff = await User.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        'profile.department': updateData.department,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -security.twoFactorSecret');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'staff_updated',
      description: `Updated staff member: ${staff.name}`,
      metadata: { staffId: staff._id, updates: Object.keys(updateData) }
    });

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to update staff member' });
  }
});

// DELETE /api/admin/staff/:id - Delete staff member
router.delete('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Soft delete - deactivate instead of removing
    await User.updateOne({ _id: id }, { 
      isActive: false,
      deletedAt: new Date(),
      deletedBy: req.user._id
    });

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'staff_deleted',
      description: `Deleted staff member: ${staff.name}`,
      metadata: { staffId: staff._id, staffRole: staff.role }
    });

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete staff member' });
  }
});

// ==================== ADDON SYSTEM ====================

// GET /api/admin/addon-modules - Get all addon modules
router.get('/addon-modules', async (req, res) => {
  try {
    // For now, return the core modules with some database state
    const coreModules = [
      {
        id: 'auto-followup',
        name: 'Auto Follow-up',
        description: 'Automated follow-up sequences for leads and customers',
        category: 'Automation',
        isCore: true,
        isEnabled: true,
        globallyEnabled: true,
        usage: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 2000),
        planAvailability: ['starter', 'professional', 'enterprise'],
        dependencies: [],
        version: '2.1.0'
      },
      {
        id: 'ai-bot',
        name: 'AI Chat Bot',
        description: 'AI-powered chatbot for customer interactions',
        category: 'AI',
        isCore: true,
        isEnabled: true,
        globallyEnabled: true,
        usage: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 2000),
        planAvailability: ['professional', 'enterprise'],
        dependencies: ['chat-interface'],
        version: '3.0.1'
      },
      {
        id: 'whatsapp-integration',
        name: 'WhatsApp Integration',
        description: 'WhatsApp Business API integration for messaging',
        category: 'Communication',
        isCore: true,
        isEnabled: true,
        globallyEnabled: true,
        usage: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 2000),
        planAvailability: ['starter', 'professional', 'enterprise'],
        dependencies: [],
        version: '2.3.0'
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'Detailed analytics and reporting dashboard',
        category: 'Analytics',
        isCore: true,
        isEnabled: true,
        globallyEnabled: true,
        usage: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 2000),
        planAvailability: ['professional', 'enterprise'],
        dependencies: [],
        version: '2.2.1'
      }
    ];

    res.json({
      success: true,
      modules: coreModules
    });
  } catch (error) {
    console.error('Get addon modules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addon modules' });
  }
});

// PATCH /api/admin/addon-modules/:id - Update addon module
router.patch('/addon-modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled, globallyEnabled, planAvailability } = req.body;

    // For now, just return success - in a real implementation,
    // this would update module configuration in database
    
    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'addon_module_updated',
      description: `Updated addon module: ${id}`,
      metadata: { moduleId: id, changes: req.body }
    });

    res.json({
      success: true,
      message: 'Addon module updated successfully'
    });
  } catch (error) {
    console.error('Update addon module error:', error);
    res.status(500).json({ success: false, message: 'Failed to update addon module' });
  }
});

// ==================== SYSTEM SETTINGS ====================

// GET /api/admin/system-settings - Get system settings
router.get('/system-settings', async (req, res) => {
  try {
    // In a real implementation, these would come from a settings collection
    const settings = {
      adminProfile: {
        name: req.user.name || 'Admin User',
        email: req.user.email || 'admin@aiagentcrm.com',
        role: req.user.role || 'admin',
        timezone: 'UTC',
        language: 'en'
      },
      company: {
        name: 'Ai Agentic CRM',
        email: 'contact@aiagentcrm.com',
        phone: '+91 98765 43210',
        address: 'India',
        website: 'https://aiagentcrm.com',
        description: 'Leading AI-powered CRM solution for modern businesses',
        founded: '2024'
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'hi', 'es', 'fr'],
        timezone: 'IST',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        currencySymbol: '₹'
      },
      security: {
        enableTwoFactor: true,
        requireStrongPasswords: true,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        enableAuditLog: true
      },
      modules: {
        whatsapp: { enabled: true, name: 'WhatsApp Integration' },
        ai: { enabled: true, name: 'AI Assistant' },
        analytics: { enabled: true, name: 'Analytics' },
        integrations: { enabled: true, name: 'Third-party Integrations' }
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system settings' });
  }
});

// PUT /api/admin/system-settings - Update system settings
router.put('/system-settings', async (req, res) => {
  try {
    const { section, data } = req.body;

    // In a real implementation, this would update the settings in database
    // For now, just log the activity
    
    await Activity.create({
      user: req.user._id,
      type: 'system_settings_updated',
      description: `Updated system settings: ${section}`,
      metadata: { section, changes: Object.keys(data) }
    });

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update system settings' });
  }
});

// ==================== SUPPORT MANAGEMENT ====================

// GET /api/admin/support - Get support center data
router.get('/support', async (req, res) => {
  try {
    const supportData = {
      contacts: [
        {
          id: 1,
          type: 'email',
          title: 'Email Support',
          value: 'support@aiagentcrm.com',
          description: 'Get help via email - We respond within 2 hours',
          icon: 'email',
          isActive: true,
          responseTime: '2 hours'
        },
        {
          id: 2,
          type: 'chat',
          title: 'Live Chat',
          value: 'Available 24/7',
          description: 'Chat with our support team in real-time',
          icon: 'chat',
          isActive: true,
          responseTime: 'Instant'
        },
        {
          id: 3,
          type: 'phone',
          title: 'Phone Support',
          value: '+91 98765 43210',
          description: 'Call us for urgent issues',
          icon: 'phone',
          isActive: true,
          responseTime: '5 minutes'
        },
        {
          id: 4,
          type: 'whatsapp',
          title: 'WhatsApp Support',
          value: '+91 98765 43210',
          description: 'Message us on WhatsApp',
          icon: 'whatsapp',
          isActive: true,
          responseTime: '10 minutes'
        }
      ],
      documentation: [
        {
          id: 1,
          title: 'Getting Started Guide',
          description: 'Complete guide to setting up your CRM',
          category: 'Setup',
          downloads: 245,
          lastUpdated: new Date(Date.now() - 86400000 * 7),
          isPopular: true
        },
        {
          id: 2,
          title: 'WhatsApp Integration Setup',
          description: 'Step-by-step WhatsApp integration guide',
          category: 'Integrations',
          downloads: 189,
          lastUpdated: new Date(Date.now() - 86400000 * 3),
          isPopular: true
        },
        {
          id: 3,
          title: 'API Documentation',
          description: 'Complete API reference and examples',
          category: 'Development',
          downloads: 156,
          lastUpdated: new Date(Date.now() - 86400000 * 1),
          isPopular: false
        }
      ],
      faqs: [
        {
          id: 1,
          question: 'How do I connect WhatsApp to my CRM?',
          answer: 'Go to Integrations > WhatsApp and follow the setup wizard.',
          category: 'Integrations',
          helpful: 45,
          notHelpful: 3,
          isPopular: true
        },
        {
          id: 2,
          question: 'Can I customize the AI responses?',
          answer: 'Yes, go to AI Settings to customize responses and training data.',
          category: 'AI Features',
          helpful: 38,
          notHelpful: 1,
          isPopular: true
        }
      ],
      systemStatus: {
        status: 'operational',
        uptime: '99.9%',
        lastIncident: new Date(Date.now() - 86400000 * 15),
        services: [
          { name: 'API', status: 'operational' },
          { name: 'WhatsApp Integration', status: 'operational' },
          { name: 'AI Services', status: 'operational' },
          { name: 'Database', status: 'operational' }
        ]
      }
    };

    res.json({
      success: true,
      data: supportData
    });
  } catch (error) {
    console.error('Get support data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch support data' });
  }
});

module.exports = router;