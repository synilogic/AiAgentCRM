const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Lead = require('../models/Lead');
const { scoreLead } = require('../utils/openai');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/leads - Get all leads for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, source, score } = req.query;
    
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (score) filter.score = score;

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Lead.countDocuments(filter);

    res.json({
      leads,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/leads - Create a new lead
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('source').optional().isIn(['facebook', 'google_sheets', 'manual', 'whatsapp']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, source = 'manual', notes, facebookData, sheetsData } = req.body;

    // Create lead
    const lead = new Lead({
      userId: req.user._id,
      name,
      email,
      phone,
      source,
      notes,
      facebookData,
      sheetsData
    });

    await lead.save();

    // Update user usage
    req.user.usage.leads += 1;
    await req.user.save();

    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/leads/:id - Get a specific lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/leads/:id - Update a lead
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['new', 'in_progress', 'closed']),
  body('score').optional().isIn(['cold', 'warm', 'hot']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        lead[key] = req.body[key];
      }
    });

    await lead.save();
    res.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/leads/:id - Delete a lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/leads/:id/score - Score a lead using AI
router.post('/:id/score', async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // TODO: Get lead messages for scoring
    const messages = []; // This would come from Message model
    
    const score = await scoreLead(messages);
    lead.score = score;
    await lead.save();

    res.json({ score, lead });
  } catch (error) {
    console.error('Score lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/leads/bulk-import - Import leads from external source
router.post('/bulk-import', [
  body('leads').isArray({ min: 1 }),
  body('source').isIn(['facebook', 'google_sheets'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leads, source } = req.body;
    const importedLeads = [];

    for (const leadData of leads) {
      const lead = new Lead({
        userId: req.user._id,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source,
        facebookData: source === 'facebook' ? leadData.facebookData : undefined,
        sheetsData: source === 'google_sheets' ? leadData.sheetsData : undefined
      });

      await lead.save();
      importedLeads.push(lead);
    }

    // Update user usage
    req.user.usage.leads += importedLeads.length;
    await req.user.save();

    res.json({ 
      message: `${importedLeads.length} leads imported successfully`,
      leads: importedLeads 
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 