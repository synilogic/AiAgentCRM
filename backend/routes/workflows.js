const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/workflows - Get all workflows for the user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const Workflow = require('../models/Workflow');
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const workflows = await Workflow.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Workflow.countDocuments(query);

    res.json({
      success: true,
      workflows,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows'
    });
  }
});

// POST /api/workflows - Create a new workflow
router.post('/', async (req, res) => {
  try {
    const { name, description, trigger, actions, category = 'custom' } = req.body;
    
    if (!name || !trigger || !actions || actions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, trigger, and actions are required'
      });
    }

    const Workflow = require('../models/Workflow');
    const workflow = new Workflow({
      userId: req.user._id,
      name,
      description,
      trigger,
      actions,
      category,
      status: 'draft',
      isActive: false
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow'
    });
  }
});

// PUT /api/workflows/:id - Update a workflow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const Workflow = require('../models/Workflow');
    const workflow = await Workflow.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true }
    );
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow'
    });
  }
});

// DELETE /api/workflows/:id - Delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const Workflow = require('../models/Workflow');
    const workflow = await Workflow.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow'
    });
  }
});

// POST /api/workflows/:id/activate - Activate a workflow
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const Workflow = require('../models/Workflow');
    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    workflow.status = 'active';
    workflow.isActive = true;
    await workflow.save();

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Activate workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate workflow'
    });
  }
});

// POST /api/workflows/:id/deactivate - Deactivate a workflow
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const Workflow = require('../models/Workflow');
    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    workflow.status = 'inactive';
    workflow.isActive = false;
    await workflow.save();

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Deactivate workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate workflow'
    });
  }
});

module.exports = router; 
