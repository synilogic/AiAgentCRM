const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const Plan = require('../models/Plan');

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// GET /api/plans - Get all plans (admin only)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/plans - Create a new plan (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['basic', 'pro', 'enterprise']),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('features').isArray(),
  body('limits.leads').optional().isNumeric().isInt({ min: 0 }),
  body('limits.aiReplies').optional().isNumeric().isInt({ min: 0 }),
  body('limits.followUps').optional().isNumeric().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, price, features, limits } = req.body;

    // Check if plan type already exists
    const existingPlan = await Plan.findOne({ type });
    if (existingPlan) {
      return res.status(400).json({ message: 'Plan type already exists' });
    }

    const plan = new Plan({
      name,
      type,
      price,
      features,
      limits
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/plans/:id - Update a plan (admin only)
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('features').optional().isArray(),
  body('limits.leads').optional().isNumeric().isInt({ min: 0 }),
  body('limits.aiReplies').optional().isNumeric().isInt({ min: 0 }),
  body('limits.followUps').optional().isNumeric().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        plan[key] = req.body[key];
      }
    });

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/plans/:id - Delete a plan (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/plans/public - Get plans for public display (no auth required)
router.get('/public', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 }).select('-__v');
    res.json({ plans });
  } catch (error) {
    console.error('Get public plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 