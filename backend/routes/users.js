const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');
const Lead = require('../models/Lead');
const Workflow = require('../models/Workflow');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/users/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('plan')
      .select('-password -passwordResetToken -emailVerificationToken');
    
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', [
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),
  body('businessName').optional().isLength({ max: 200 }).withMessage('Business name must be max 200 characters'),
  body('industry').optional().isLength({ max: 100 }).withMessage('Industry must be max 100 characters'),
  body('website').optional().isURL().withMessage('Valid website URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedFields = [
      'name', 'phone', 'bio', 'businessName', 'industry', 
      'companySize', 'website', 'avatar'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plan').select('-password -passwordResetToken -emailVerificationToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const { language, timezone, dateFormat, currency, theme } = req.body;
    
    const updateData = {};
    if (language) updateData['preferences.language'] = language;
    if (timezone) updateData['preferences.timezone'] = timezone;
    if (dateFormat) updateData['preferences.dateFormat'] = dateFormat;
    if (currency) updateData['preferences.currency'] = currency;
    if (theme) updateData['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plan').select('-password -passwordResetToken -emailVerificationToken');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// PUT /api/users/notifications - Update notification settings
router.put('/notifications', async (req, res) => {
  try {
    const { email, push, sms, whatsapp } = req.body;
    
    const updateData = {};
    if (email) {
      Object.keys(email).forEach(key => {
        updateData[`notificationSettings.email.${key}`] = email[key];
      });
    }
    if (push) {
      Object.keys(push).forEach(key => {
        updateData[`notificationSettings.push.${key}`] = push[key];
      });
    }
    if (sms) {
      Object.keys(sms).forEach(key => {
        updateData[`notificationSettings.sms.${key}`] = sms[key];
      });
    }
    if (whatsapp) {
      Object.keys(whatsapp).forEach(key => {
        updateData[`notificationSettings.whatsapp.${key}`] = whatsapp[key];
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plan').select('-password -passwordResetToken -emailVerificationToken');

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      user
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
});

// PUT /api/users/password - Change password
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// GET /api/users/usage - Get user usage statistics
router.get('/usage', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('plan');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate usage percentages
    const usage = user.usage || {};
    const limits = user.plan?.limits || {};
    
    const usageStats = {
      leads: {
        used: usage.leads || 0,
        limit: limits.leads === -1 ? null : limits.leads || 0,
        percentage: limits.leads === -1 ? 0 : Math.round(((usage.leads || 0) / (limits.leads || 1)) * 100)
      },
      aiReplies: {
        used: usage.aiReplies || 0,
        limit: limits.aiReplies === -1 ? null : limits.aiReplies || 0,
        percentage: limits.aiReplies === -1 ? 0 : Math.round(((usage.aiReplies || 0) / (limits.aiReplies || 1)) * 100)
      },
      followUps: {
        used: usage.followUps || 0,
        limit: limits.followUps === -1 ? null : limits.followUps || 0,
        percentage: limits.followUps === -1 ? 0 : Math.round(((usage.followUps || 0) / (limits.followUps || 1)) * 100)
      },
      messages: {
        used: usage.messages || 0,
        limit: limits.messages === -1 ? null : limits.messages || 0,
        percentage: limits.messages === -1 ? 0 : Math.round(((usage.messages || 0) / (limits.messages || 1)) * 100)
      },
      storageUsed: {
        used: usage.storageUsed || 0,
        limit: limits.storage === -1 ? null : limits.storage || 100,
        percentage: limits.storage === -1 ? 0 : Math.round(((usage.storageUsed || 0) / (limits.storage || 100)) * 100)
      }
    };

    res.json({
      success: true,
      usage: usageStats,
      plan: user.plan,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

// POST /api/users/subscription - Update subscription plan
router.post('/subscription', async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        plan: planId,
        'subscription.status': 'active',
        'subscription.startDate': new Date(),
        'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      { new: true }
    ).populate('plan');

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      user
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
});

// GET /api/users/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalLeads,
      newLeads,
      totalMessages,
      pendingTasks,
      activeWorkflows,
      todayLeads,
      leadStatusDistribution
    ] = await Promise.all([
      Lead.countDocuments({ userId }),
      Lead.countDocuments({ 
        userId, 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      require('../models/Message').countDocuments({ userId }).catch(() => 0),
      Lead.countDocuments({ 
        userId, 
        nextFollowUp: { $lte: new Date() },
        status: { $in: ['new', 'qualified', 'in_conversation'] }
      }),
      Workflow.countDocuments({ userId, isActive: true }).catch(() => 0),
      Lead.countDocuments({ 
        userId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Lead.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      totalLeads,
      newLeads,
      totalMessages,
      pendingTasks,
      activeWorkflows,
      todayLeads,
      leadStatusDistribution: leadStatusDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// DELETE /api/users/account - Delete user account
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Delete user and related data
    const Message = require('../models/Message');
    const Task = require('../models/Task');
    const Workflow = require('../models/Workflow');

    await Promise.all([
      Lead.deleteMany({ userId: req.user._id }),
      Message.deleteMany({ userId: req.user._id }),
      Task.deleteMany({ userId: req.user._id }),
      Workflow.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id)
    ]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

module.exports = router; 
