const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/leads - Get all leads with advanced filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      source = '',
      priority = '',
      tags = '',
      assignedTo = '',
      estimatedValueMin = '',
      estimatedValueMax = '',
      lastContactedFrom = '',
      lastContactedTo = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      score = '',
      dateFrom = '',
      dateTo = '',
      includeInactive = 'false'
    } = req.query;

    const filter = { user: req.user._id };

    // Advanced search filter with text index support
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { notes: searchRegex },
        { 'customFields.value': searchRegex }
      ];
    }

    // Status filter (multiple values support)
    if (status) {
      const statusArray = status.split(',');
      filter.status = { $in: statusArray };
    }

    // Source filter (multiple values support)
    if (source) {
      const sourceArray = source.split(',');
      filter.source = { $in: sourceArray };
    }

    // Priority filter
    if (priority) {
      const priorityArray = priority.split(',');
      filter.priority = { $in: priorityArray };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }

    // Assigned to filter
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Estimated value range filter
    if (estimatedValueMin || estimatedValueMax) {
      filter.estimatedValue = {};
      if (estimatedValueMin) filter.estimatedValue.$gte = parseFloat(estimatedValueMin);
      if (estimatedValueMax) filter.estimatedValue.$lte = parseFloat(estimatedValueMax);
    }

    // Last contacted date range filter
    if (lastContactedFrom || lastContactedTo) {
      filter.lastContactedAt = {};
      if (lastContactedFrom) filter.lastContactedAt.$gte = new Date(lastContactedFrom);
      if (lastContactedTo) filter.lastContactedAt.$lte = new Date(lastContactedTo);
    }

    // Score filter
    if (score) {
      const scoreRange = score.split('-');
      if (scoreRange.length === 2) {
        filter.score = {
          $gte: parseInt(scoreRange[0]),
          $lte: parseInt(scoreRange[1])
        };
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Include/exclude inactive leads
    if (includeInactive === 'false') {
      filter.status = { ...filter.status, $ne: 'inactive' };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [leads, totalCount, statusCounts, sourceCounts, priorityCounts, tagCounts] = await Promise.all([
      Lead.find(filter)
      .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'name email')
        .lean(),
      Lead.countDocuments(filter),
      Lead.aggregate([
        { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { user: req.user._id } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { user: req.user._id } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    // Calculate lead statistics
    const totalLeads = await Lead.countDocuments({ user: req.user._id });
    const newLeadsToday = await Lead.countDocuments({
      user: req.user._id,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const convertedLeads = await Lead.countDocuments({
      user: req.user._id,
      status: 'converted'
    });

    res.json({
      success: true,
      data: {
      leads,
      pagination: {
          totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        statusCounts: statusCounts.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        sourceCounts: sourceCounts.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
          }, {}),
          priorityCounts: priorityCounts.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
          }, {}),
          tagCounts: tagCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
        },
        statistics: {
          totalLeads,
          newLeadsToday,
          convertedLeads,
          conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Get lead activities
    const activities = await Activity.find({
      leadId: req.params.id
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      lead,
      activities
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead'
    });
  }
});

// POST /api/leads - Create new lead
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
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
      email,
      phone,
      company,
      source = 'manual',
      status = 'new',
      notes = '',
      score = 0,
      tags = [],
      customFields = {}
    } = req.body;

    // Check for duplicates
    if (email) {
      const existingLead = await Lead.findOne({
        userId: req.user._id,
        email: email
      });
      if (existingLead) {
        return res.status(400).json({
          success: false,
          error: 'Lead with this email already exists'
        });
      }
    }

    const lead = new Lead({
      userId: req.user._id,
      name,
      email,
      phone,
      company,
      source,
      status,
      notes,
      score,
      tags,
      customFields,
      lastContact: new Date(),
      nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await lead.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: lead._id,
      type: 'lead_created',
      description: `Created lead: ${name}`
    });

    // Create notification
    await Notification.create({
      userId: req.user._id,
      type: 'lead_created',
      title: 'New Lead Created',
      message: `Lead "${name}" has been created successfully`,
      metadata: { leadId: lead._id }
    });

    res.status(201).json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead'
    });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
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

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const oldStatus = lead.status;
    const updateData = { ...req.body };
    updateData.lastContact = new Date();

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log activity if status changed
    if (oldStatus !== updatedLead.status) {
      await Activity.create({
        userId: req.user._id,
        leadId: lead._id,
        type: 'status_changed',
        description: `Status changed from ${oldStatus} to ${updatedLead.status}`
      });
    }

    // Log general update activity
    await Activity.create({
      userId: req.user._id,
      leadId: lead._id,
      type: 'lead_updated',
      description: `Updated lead: ${updatedLead.name}`
    });

    res.json({
      success: true,
      lead: updatedLead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead'
    });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: req.params.id,
      type: 'lead_deleted',
      description: `Deleted lead: ${lead.name}`
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead'
    });
  }
});

// POST /api/leads/bulk - Bulk operations
router.post('/bulk', [
  body('action').isIn(['delete', 'update_status', 'add_tags']).withMessage('Invalid action'),
  body('leadIds').isArray().withMessage('leadIds must be an array')
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

    const { action, leadIds, data } = req.body;

    // Verify all leads belong to the user
    const leads = await Lead.find({
      _id: { $in: leadIds },
      userId: req.user._id
    });

    if (leads.length !== leadIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some leads not found or access denied'
      });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await Lead.deleteMany({
          _id: { $in: leadIds },
          userId: req.user._id
        });
        break;
      case 'update_status':
        result = await Lead.updateMany(
          { _id: { $in: leadIds }, userId: req.user._id },
          { $set: { status: data.status, lastContact: new Date() } }
        );
        break;
      case 'add_tags':
        result = await Lead.updateMany(
          { _id: { $in: leadIds }, userId: req.user._id },
          { $addToSet: { tags: { $each: data.tags } } }
        );
        break;
    }

    // Log bulk activity
    await Activity.create({
      userId: req.user._id,
      type: 'bulk_operation',
      description: `Performed bulk ${action} on ${leadIds.length} leads`
    });

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      affected: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
});

// POST /api/leads/import - Import leads from CSV
router.post('/import', async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leads data'
      });
    }

    const importResults = {
      success: 0,
      duplicates: 0,
      errors: []
    };

    for (const leadData of leads) {
      try {
        // Check for duplicates
        if (leadData.email) {
          const existing = await Lead.findOne({
            userId: req.user._id,
            email: leadData.email
          });
          if (existing) {
            importResults.duplicates++;
            continue;
          }
        }

        const lead = new Lead({
          ...leadData,
          userId: req.user._id,
          source: leadData.source || 'import',
          status: leadData.status || 'new',
          lastContact: new Date(),
          nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await lead.save();
        importResults.success++;
      } catch (error) {
        importResults.errors.push({
          lead: leadData,
          error: error.message
        });
      }
    }

    // Log import activity
    await Activity.create({
      userId: req.user._id,
      type: 'leads_imported',
      description: `Imported ${importResults.success} leads, ${importResults.duplicates} duplicates, ${importResults.errors.length} errors`
    });

    res.json({
      success: true,
      results: importResults
    });
  } catch (error) {
    console.error('Import leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import leads'
    });
  }
});

// GET /api/leads/export - Export leads to CSV
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv', status = '', source = '' } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (source) filter.source = source;

    const leads = await Lead.find(filter).select('-userId -__v');

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(leads);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        leads
      });
    }
  } catch (error) {
    console.error('Export leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export leads'
    });
  }
});

// Helper function to convert to CSV
function convertToCSV(leads) {
  if (leads.length === 0) return '';

  const headers = Object.keys(leads[0].toObject());
  const csvHeaders = headers.join(',');
  
  const csvRows = leads.map(lead => {
    const values = headers.map(header => {
      const value = lead[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    return values.join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

// GET /api/leads/:id/tags - Get lead tags
router.get('/:id/tags', async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      tags: lead.tags || []
    });
  } catch (error) {
    console.error('Get lead tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead tags'
    });
  }
});

// POST /api/leads/:id/tags - Add tag to lead
router.post('/:id/tags', [
  body('tag').notEmpty().withMessage('Tag is required').isLength({ max: 50 })
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

    const { tag } = req.body;
    const normalizedTag = tag.toLowerCase().trim();

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Check if tag already exists
    if (lead.tags && lead.tags.includes(normalizedTag)) {
      return res.status(400).json({
        success: false,
        error: 'Tag already exists on this lead'
      });
    }

    // Add tag
    lead.tags = lead.tags || [];
    lead.tags.push(normalizedTag);
    await lead.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: req.params.id,
      type: 'tag_added',
      description: `Added tag: ${normalizedTag}`,
      metadata: { tag: normalizedTag }
    });

    res.json({
      success: true,
      message: 'Tag added successfully',
      tags: lead.tags
    });
  } catch (error) {
    console.error('Add lead tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tag'
    });
  }
});

// DELETE /api/leads/:id/tags/:tag - Remove tag from lead
router.delete('/:id/tags/:tag', async (req, res) => {
  try {
    const { id, tag } = req.params;
    const normalizedTag = tag.toLowerCase().trim();

    const lead = await Lead.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Remove tag
    if (lead.tags) {
      lead.tags = lead.tags.filter(t => t !== normalizedTag);
      await lead.save();

      // Log activity
      await Activity.create({
        userId: req.user._id,
        leadId: id,
        type: 'tag_removed',
        description: `Removed tag: ${normalizedTag}`,
        metadata: { tag: normalizedTag }
      });
    }

    res.json({
      success: true,
      message: 'Tag removed successfully',
      tags: lead.tags || []
    });
  } catch (error) {
    console.error('Remove lead tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove tag'
    });
  }
});

// GET /api/leads/tags - Get all unique tags for user
router.get('/tags', async (req, res) => {
  try {
    const tags = await Lead.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      tags: tags.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    });
  } catch (error) {
    console.error('Get all tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

// GET /api/leads/:id/activities - Get lead activities
router.get('/:id/activities', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const activities = await Activity.find({
      leadId: req.params.id
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Activity.countDocuments({ leadId: req.params.id });

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
    console.error('Get lead activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead activities'
    });
  }
});

// POST /api/leads/:id/notes - Add note to lead
router.post('/:id/notes', [
  body('note').notEmpty().withMessage('Note is required').isLength({ max: 2000 })
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

    const { note } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Add note to existing notes
    const currentNotes = lead.notes || '';
    const timestamp = new Date().toLocaleString();
    const newNote = `[${timestamp}] ${note}`;
    lead.notes = currentNotes ? `${currentNotes}\n\n${newNote}` : newNote;
    
    await lead.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: req.params.id,
      type: 'note_added',
      description: `Added note: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
      metadata: { note }
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      notes: lead.notes
    });
  } catch (error) {
    console.error('Add lead note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
});

// PUT /api/leads/:id/status - Update lead status
router.put('/:id/status', [
  body('status').notEmpty().withMessage('Status is required')
    .isIn(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'unqualified'])
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

    const { status } = req.body;
    const previousStatus = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('status');

    if (!previousStatus) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        status,
        lastContact: new Date()
      },
      { new: true }
    );

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: req.params.id,
      type: 'status_changed',
      description: `Status changed from ${previousStatus.status} to ${status}`,
      metadata: { 
        previousStatus: previousStatus.status,
        newStatus: status 
      }
    });

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      lead
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead status'
    });
  }
});

// POST /api/leads/:id/schedule-followup - Schedule follow-up for lead
router.post('/:id/schedule-followup', [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('notes').optional().isLength({ max: 500 })
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

    const { date, notes = '' } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Update follow-up date
    lead.nextFollowUp = new Date(date);
    await lead.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      leadId: req.params.id,
      type: 'followup_scheduled',
      description: `Follow-up scheduled for ${new Date(date).toLocaleDateString()}${notes ? `: ${notes}` : ''}`,
      metadata: { 
        followupDate: date,
        notes 
      }
    });

    res.json({
      success: true,
      message: 'Follow-up scheduled successfully',
      lead
    });
  } catch (error) {
    console.error('Schedule followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule follow-up'
    });
  }
});

// POST /api/leads/bulk-update - Bulk update multiple leads
router.post('/bulk-update', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('updates').isObject().withMessage('Updates must be an object')
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

    const { leadIds, updates } = req.body;

    // Validate that all leads belong to the user
    const leadsCount = await Lead.countDocuments({
      _id: { $in: leadIds },
      user: req.user._id
    });

    if (leadsCount !== leadIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some leads do not belong to you or do not exist'
      });
    }

    // Filter allowed update fields
    const allowedUpdates = {
      'status': updates.status,
      'priority': updates.priority,
      'assignedTo': updates.assignedTo,
      'source': updates.source,
      'estimatedValue': updates.estimatedValue,
      'tags': updates.tags
    };

    // Remove undefined values
    const cleanUpdates = Object.entries(allowedUpdates)
      .filter(([key, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (Object.keys(cleanUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    // Add lastModified timestamp
    cleanUpdates.lastModified = new Date();

    // Perform bulk update
    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, user: req.user._id },
      { $set: cleanUpdates }
    );

    // Log bulk activity
    await Activity.create({
      user: req.user._id,
      type: 'bulk_update',
      description: `Bulk updated ${result.modifiedCount} leads`,
      metadata: { 
        leadIds,
        updates: cleanUpdates,
        modifiedCount: result.modifiedCount
      }
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} leads`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update leads'
    });
  }
});

// POST /api/leads/bulk-delete - Bulk delete multiple leads
router.post('/bulk-delete', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array')
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

    const { leadIds } = req.body;

    // Validate that all leads belong to the user
    const leadsToDelete = await Lead.find({
      _id: { $in: leadIds },
      user: req.user._id
    }).select('_id name email');

    if (leadsToDelete.length !== leadIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some leads do not belong to you or do not exist'
      });
    }

    // Delete leads
    const result = await Lead.deleteMany({
      _id: { $in: leadIds },
      user: req.user._id
    });

    // Delete related activities
    await Activity.deleteMany({
      leadId: { $in: leadIds }
    });

    // Log bulk activity
    await Activity.create({
      user: req.user._id,
      type: 'bulk_delete',
      description: `Bulk deleted ${result.deletedCount} leads`,
      metadata: { 
        leadIds,
        deletedCount: result.deletedCount,
        deletedLeads: leadsToDelete.map(lead => ({
          id: lead._id,
          name: lead.name,
          email: lead.email
        }))
      }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} leads`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete leads'
    });
  }
});

// POST /api/leads/bulk-assign - Bulk assign leads to user
router.post('/bulk-assign', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID required')
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

    const { leadIds, assignedTo = null } = req.body;

    // Validate that all leads belong to the user
    const leadsCount = await Lead.countDocuments({
      _id: { $in: leadIds },
      user: req.user._id
    });

    if (leadsCount !== leadIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some leads do not belong to you or do not exist'
      });
    }

    // Perform bulk assignment
    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, user: req.user._id },
      { $set: { assignedTo, lastModified: new Date() } }
    );

    // Log bulk activity
    await Activity.create({
      user: req.user._id,
      type: 'bulk_assign',
      description: `Bulk assigned ${result.modifiedCount} leads${assignedTo ? ` to user ${assignedTo}` : ' (unassigned)'}`,
      metadata: { 
        leadIds,
        assignedTo,
        modifiedCount: result.modifiedCount
      }
    });

    res.json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} leads`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk assign leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk assign leads'
    });
  }
});

// POST /api/leads/bulk-tag - Bulk add/remove tags
router.post('/bulk-tag', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('tags').isArray().withMessage('Tags must be an array'),
  body('action').isIn(['add', 'remove', 'replace']).withMessage('Action must be add, remove, or replace')
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

    const { leadIds, tags, action } = req.body;

    // Validate that all leads belong to the user
    const leadsCount = await Lead.countDocuments({
      _id: { $in: leadIds },
      user: req.user._id
    });

    if (leadsCount !== leadIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some leads do not belong to you or do not exist'
      });
    }

    let updateOperation = {};
    
    switch (action) {
      case 'add':
        updateOperation = { $addToSet: { tags: { $each: tags } } };
        break;
      case 'remove':
        updateOperation = { $pull: { tags: { $in: tags } } };
        break;
      case 'replace':
        updateOperation = { $set: { tags: tags } };
        break;
    }

    // Also update lastModified
    updateOperation.$set = { ...updateOperation.$set, lastModified: new Date() };

    // Perform bulk tag operation
    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, user: req.user._id },
      updateOperation
    );

    // Log bulk activity
    await Activity.create({
      user: req.user._id,
      type: 'bulk_tag',
      description: `Bulk ${action} tags on ${result.modifiedCount} leads: ${tags.join(', ')}`,
      metadata: { 
        leadIds,
        tags,
        action,
        modifiedCount: result.modifiedCount
      }
    });

    res.json({
      success: true,
      message: `Successfully ${action}ed tags on ${result.modifiedCount} leads`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk tag leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk tag leads'
    });
  }
});

// GET /api/leads/search - Advanced search with autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q = '', type = 'all', limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    const baseFilter = { user: req.user._id };

    let searchFilters = [];

    if (type === 'all' || type === 'name') {
      searchFilters.push({ name: searchRegex });
    }
    if (type === 'all' || type === 'email') {
      searchFilters.push({ email: searchRegex });
    }
    if (type === 'all' || type === 'phone') {
      searchFilters.push({ phone: searchRegex });
    }
    if (type === 'all' || type === 'company') {
      searchFilters.push({ company: searchRegex });
    }
    if (type === 'all' || type === 'tags') {
      searchFilters.push({ tags: searchRegex });
    }

    const filter = {
      ...baseFilter,
      $or: searchFilters
    };

    const results = await Lead.find(filter)
      .select('name email phone company status priority tags estimatedValue')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      results: results.map(lead => ({
        id: lead._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        priority: lead.priority,
        tags: lead.tags,
        estimatedValue: lead.estimatedValue,
        label: `${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
        value: lead._id
      }))
    });
  } catch (error) {
    console.error('Search leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search leads'
    });
  }
});

// GET /api/leads/filters - Get available filter options
router.get('/filters', async (req, res) => {
  try {
    const [statusOptions, sourceOptions, priorityOptions, tagOptions] = await Promise.all([
      Lead.distinct('status', { user: req.user._id }),
      Lead.distinct('source', { user: req.user._id }),
      Lead.distinct('priority', { user: req.user._id }),
      Lead.distinct('tags', { user: req.user._id })
    ]);

    res.json({
      success: true,
      filters: {
        status: statusOptions.filter(Boolean),
        source: sourceOptions.filter(Boolean),
        priority: priorityOptions.filter(Boolean),
        tags: tagOptions.filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Get lead filters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get filter options'
    });
  }
});

module.exports = router; 
