const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/tasks - Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Tasks get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tasks'
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const Task = require('../models/Task');
    const { title, description, priority, dueDate, leadId, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const task = new Task({
      userId: req.user._id,
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      leadId: leadId || null,
      status: status || 'pending'
    });

    await task.save();

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const Task = require('../models/Task');
    const { title, description, priority, dueDate, status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load task'
    });
  }
});

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', async (req, res) => {
  try {
    const Task = require('../models/Task');
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task status'
    });
  }
});

// GET /api/tasks/lead/:leadId - Get tasks for specific lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const tasks = await Task.find({
      userId: req.user._id,
      leadId: req.params.leadId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Lead tasks get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load lead tasks'
    });
  }
});

module.exports = router; 
