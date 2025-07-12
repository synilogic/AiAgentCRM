const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Workflow = require('../models/Workflow');
const Lead = require('../models/Lead');
const Message = require('../models/Message');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/followups - Get all follow-up sequences
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    
    const filter = { 
      userId: req.user._id,
      category: { $in: ['followup', 'automation', 'sequence'] }
    };
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    const followups = await Workflow.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Workflow.countDocuments(filter);

    // Get execution statistics
    const stats = await Promise.all(followups.map(async (followup) => {
      const WorkflowExecution = require('../models/WorkflowExecution');
      const executions = await WorkflowExecution.countDocuments({ workflowId: followup._id });
      const successful = await WorkflowExecution.countDocuments({ 
        workflowId: followup._id, 
        status: 'completed' 
      });
      
      return {
        followupId: followup._id,
        totalExecutions: executions,
        successfulExecutions: successful,
        successRate: executions > 0 ? Math.round((successful / executions) * 100) : 0
      };
    }));

    res.json({
      success: true,
      followups: followups.map(followup => ({
        ...followup.toObject(),
        stats: stats.find(s => s.followupId.toString() === followup._id.toString())
      })),
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get followups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-up sequences'
    });
  }
});

// GET /api/followups/:id - Get single follow-up sequence
router.get('/:id', async (req, res) => {
  try {
    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    // Get execution history
    const WorkflowExecution = require('../models/WorkflowExecution');
    const executions = await WorkflowExecution.find({
      workflowId: req.params.id
    }).sort({ createdAt: -1 }).limit(20).populate('leadId', 'name email phone');

    res.json({
      success: true,
      followup,
      executions
    });
  } catch (error) {
    console.error('Get followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-up sequence'
    });
  }
});

// POST /api/followups - Create new follow-up sequence
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('trigger.type').notEmpty().withMessage('Trigger type is required'),
  body('actions').isArray({ min: 1 }).withMessage('At least one action is required')
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

    const {
      name,
      description,
      trigger,
      actions,
      settings = {},
      tags = []
    } = req.body;

    // Validate trigger types
    const validTriggers = ['lead_created', 'lead_status_changed', 'no_response', 'time_based', 'manual'];
    if (!validTriggers.includes(trigger.type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trigger type'
      });
    }

    // Validate action types
    const validActions = ['send_message', 'send_email', 'update_lead', 'create_task', 'wait', 'condition'];
    const invalidActions = actions.filter(action => !validActions.includes(action.type));
    if (invalidActions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid action types: ${invalidActions.map(a => a.type).join(', ')}`
      });
    }

    const followup = new Workflow({
      userId: req.user._id,
      name,
      description,
      category: 'followup',
      trigger,
      actions,
      settings: {
        ...settings,
        maxExecutions: settings.maxExecutions || -1, // -1 = unlimited
        executionWindow: settings.executionWindow || 'always', // daily, weekly, monthly, always
        pauseBetweenActions: settings.pauseBetweenActions || 0, // minutes
        respectBusinessHours: settings.respectBusinessHours || false,
        businessHours: settings.businessHours || { start: '09:00', end: '17:00' },
        timezone: settings.timezone || 'UTC'
      },
      tags,
      status: 'draft',
      isActive: false
    });

    await followup.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up sequence created successfully',
      followup
    });
  } catch (error) {
    console.error('Create followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create follow-up sequence'
    });
  }
});

// PUT /api/followups/:id - Update follow-up sequence
router.put('/:id', async (req, res) => {
  try {
    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    const allowedFields = [
      'name', 'description', 'trigger', 'actions', 'settings', 'tags'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    Object.assign(followup, updateData);
    await followup.save();

    res.json({
      success: true,
      message: 'Follow-up sequence updated successfully',
      followup
    });
  } catch (error) {
    console.error('Update followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update follow-up sequence'
    });
  }
});

// DELETE /api/followups/:id - Delete follow-up sequence
router.delete('/:id', async (req, res) => {
  try {
    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    // Deactivate first, then delete
    followup.isActive = false;
    followup.status = 'deleted';
    await followup.save();

    res.json({
      success: true,
      message: 'Follow-up sequence deleted successfully'
    });
  } catch (error) {
    console.error('Delete followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete follow-up sequence'
    });
  }
});

// POST /api/followups/:id/activate - Activate follow-up sequence
router.post('/:id/activate', async (req, res) => {
  try {
    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    followup.status = 'active';
    followup.isActive = true;
    followup.activatedAt = new Date();
    await followup.save();

    res.json({
      success: true,
      message: 'Follow-up sequence activated successfully',
      followup
    });
  } catch (error) {
    console.error('Activate followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate follow-up sequence'
    });
  }
});

// POST /api/followups/:id/deactivate - Deactivate follow-up sequence
router.post('/:id/deactivate', async (req, res) => {
  try {
    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    followup.status = 'inactive';
    followup.isActive = false;
    await followup.save();

    res.json({
      success: true,
      message: 'Follow-up sequence deactivated successfully',
      followup
    });
  } catch (error) {
    console.error('Deactivate followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate follow-up sequence'
    });
  }
});

// POST /api/followups/:id/test - Test follow-up sequence with a lead
router.post('/:id/test', [
  body('leadId').notEmpty().withMessage('Lead ID is required')
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

    const { leadId } = req.body;

    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    const lead = await Lead.findOne({
      _id: leadId,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Execute workflow in test mode
    const ActionExecutor = require('../services/ActionExecutor');
    const result = await ActionExecutor.executeWorkflow(followup, lead, { testMode: true });

    res.json({
      success: true,
      message: 'Follow-up sequence test completed',
      result
    });
  } catch (error) {
    console.error('Test followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test follow-up sequence'
    });
  }
});

// POST /api/followups/:id/execute - Manually execute follow-up sequence
router.post('/:id/execute', [
  body('leadId').notEmpty().withMessage('Lead ID is required')
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

    const { leadId } = req.body;

    const followup = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!followup) {
      return res.status(404).json({
        success: false,
        error: 'Follow-up sequence not found'
      });
    }

    const lead = await Lead.findOne({
      _id: leadId,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Execute workflow
    const ActionExecutor = require('../services/ActionExecutor');
    const result = await ActionExecutor.executeWorkflow(followup, lead);

    res.json({
      success: true,
      message: 'Follow-up sequence executed successfully',
      result
    });
  } catch (error) {
    console.error('Execute followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute follow-up sequence'
    });
  }
});

// GET /api/followups/templates - Get predefined follow-up templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome_sequence',
        name: 'Welcome Sequence',
        description: 'Automated welcome message for new leads',
        category: 'onboarding',
        trigger: {
          type: 'lead_created',
          conditions: []
        },
        actions: [
          {
            type: 'wait',
            settings: { duration: 5, unit: 'minutes' }
          },
          {
            type: 'send_message',
            settings: {
              platform: 'whatsapp',
              message: 'Welcome! Thank you for your interest. How can we help you today?',
              variables: ['name', 'company']
            }
          },
          {
            type: 'wait',
            settings: { duration: 1, unit: 'hours' }
          },
          {
            type: 'condition',
            settings: {
              field: 'hasReplied',
              operator: 'equals',
              value: false,
              trueActions: [
                {
                  type: 'send_message',
                  settings: {
                    platform: 'whatsapp',
                    message: 'Hi {{name}}, I wanted to follow up on our previous message. Do you have any questions?'
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'no_response_followup',
        name: 'No Response Follow-up',
        description: 'Follow up with leads who haven\'t responded',
        category: 'engagement',
        trigger: {
          type: 'no_response',
          conditions: [
            { field: 'lastContact', operator: 'older_than', value: 24, unit: 'hours' }
          ]
        },
        actions: [
          {
            type: 'send_message',
            settings: {
              platform: 'whatsapp',
              message: 'Hi {{name}}, just checking in to see if you have any questions about our services.'
            }
          },
          {
            type: 'wait',
            settings: { duration: 2, unit: 'days' }
          },
          {
            type: 'condition',
            settings: {
              field: 'hasReplied',
              operator: 'equals',
              value: false,
              trueActions: [
                {
                  type: 'update_lead',
                  settings: {
                    status: 'unqualified',
                    tags: ['no_response']
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'qualification_sequence',
        name: 'Lead Qualification',
        description: 'Qualify leads through questions',
        category: 'qualification',
        trigger: {
          type: 'lead_status_changed',
          conditions: [
            { field: 'status', operator: 'equals', value: 'new' }
          ]
        },
        actions: [
          {
            type: 'send_message',
            settings: {
              platform: 'whatsapp',
              message: 'Hi {{name}}, what\'s the best way to reach you for a quick discussion about your needs?'
            }
          },
          {
            type: 'wait',
            settings: { duration: 30, unit: 'minutes' }
          },
          {
            type: 'send_message',
            settings: {
              platform: 'whatsapp',
              message: 'Also, what\'s your timeline for making a decision?'
            }
          }
        ]
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get followup templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-up templates'
    });
  }
});

// GET /api/followups/stats - Get follow-up statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalFollowups,
      activeFollowups,
      totalExecutions,
      successfulExecutions,
      todayExecutions
    ] = await Promise.all([
      Workflow.countDocuments({ userId, category: 'followup' }),
      Workflow.countDocuments({ userId, category: 'followup', isActive: true }),
      require('../models/WorkflowExecution').countDocuments({ userId }),
      require('../models/WorkflowExecution').countDocuments({ userId, status: 'completed' }),
      require('../models/WorkflowExecution').countDocuments({
        userId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalFollowups,
        activeFollowups,
        totalExecutions,
        successfulExecutions,
        successRate,
        todayExecutions
      }
    });
  } catch (error) {
    console.error('Get followup stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-up statistics'
    });
  }
});

module.exports = router; 