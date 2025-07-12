const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/plans/public - Get all available plans (public endpoint)
router.get('/public', async (req, res) => {
  try {
    const plans = await Plan.find({ 
      status: 'active', 
      isPublic: true 
    }).sort({ sortOrder: 1, 'price.monthly': 1 });

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Get public plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plans'
    });
  }
});

// GET /api/plans - Get all plans (admin/authenticated endpoint)
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    let query = { status: 'active' };
    if (!isAdmin) {
      query.isPublic = true;
    }

    const plans = await Plan.find(query).sort({ sortOrder: 1, 'price.monthly': 1 });

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plans'
    });
  }
});

// GET /api/plans/:id - Get specific plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Check if plan is public or user is admin
    if (!plan.isPublic && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plan'
    });
  }
});

// POST /api/plans - Create new plan (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const planData = req.body;
    const plan = new Plan(planData);
    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plan'
    });
  }
});

// PUT /api/plans/:id - Update plan (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plan'
    });
  }
});

// DELETE /api/plans/:id - Delete plan (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
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
      error: 'Failed to delete plan'
    });
  }
});

// GET /api/plans/user/subscription - Get user's current subscription
router.get('/user/subscription', auth, async (req, res) => {
  try {
    const user = await req.user.populate('plan');
    
    res.json({
      success: true,
      subscription: {
        plan: user.plan,
        status: user.subscription?.status,
        startDate: user.subscription?.startDate,
        endDate: user.subscription?.endDate,
        trialEndDate: user.subscription?.trialEndDate,
        autoRenew: user.subscription?.autoRenew
      },
      usage: user.usage
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription'
    });
  }
});

// POST /api/plans/user/subscribe - Subscribe to a plan
router.post('/user/subscribe', auth, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isPublic || plan.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }

    // Update user's plan and subscription
    const user = await User.findById(req.user.userId);
    user.plan = planId;
    user.subscription = {
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      autoRenew: true
    };

    await user.save();

    res.json({
      success: true,
      message: 'Successfully subscribed to plan',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to plan'
    });
  }
});

module.exports = router; 