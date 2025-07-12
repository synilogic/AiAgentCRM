const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  // User and Lead Association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  
  // Activity Details
  type: {
    type: String,
    required: true,
    enum: [
      'lead_created',
      'lead_updated',
      'status_changed',
      'tag_added',
      'tag_removed',
      'note_added',
      'message_sent',
      'message_received',
      'call_made',
      'call_received',
      'email_sent',
      'email_received',
      'followup_scheduled',
      'followup_completed',
      'workflow_triggered',
      'score_updated',
      'custom'
    ],
    index: true
  },
  
  // Activity Content
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Additional Data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['system', 'user', 'workflow', 'integration', 'api'],
    default: 'user'
  },
  
  // Platform/Channel
  platform: {
    type: String,
    enum: ['web', 'mobile', 'whatsapp', 'email', 'phone', 'api', 'webhook'],
    default: 'web'
  },
  
  // Activity Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Important/Priority Activity
  isImportant: {
    type: Boolean,
    default: false
  },
  
  // Automatic or Manual
  isAutomatic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ActivitySchema.index({ userId: 1, leadId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ status: 1, createdAt: -1 });
ActivitySchema.index({ isImportant: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

// Virtual for formatted date
ActivitySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for time ago
ActivitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create activity
ActivitySchema.statics.createActivity = async function(data) {
  try {
    const activity = new this(data);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Static method to get activities for a lead
ActivitySchema.statics.getLeadActivities = async function(leadId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    isImportant
  } = options;

  const filter = { leadId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (isImportant !== undefined) filter.isImportant = isImportant;

  const activities = await this.find(filter)
    .populate('userId', 'name email')
    .populate('leadId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await this.countDocuments(filter);

  return {
    activities,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to get user activities
ActivitySchema.statics.getUserActivities = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    leadId,
    startDate,
    endDate
  } = options;

  const filter = { userId };
  if (type) filter.type = type;
  if (leadId) filter.leadId = leadId;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const activities = await this.find(filter)
    .populate('leadId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await this.countDocuments(filter);

  return {
    activities,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to get activity statistics
ActivitySchema.statics.getActivityStats = async function(userId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  
  const matchStage = { userId };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const [
    totalActivities,
    activitiesByType,
    activitiesByDay,
    importantActivities
  ] = await Promise.all([
    this.countDocuments(matchStage),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: matchStage },
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
    this.countDocuments({ ...matchStage, isImportant: true })
  ]);

  return {
    totalActivities,
    activitiesByType: activitiesByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    activitiesByDay: activitiesByDay.map(item => ({
      date: item._id,
      count: item.count
    })),
    importantActivities
  };
};

// Pre-save middleware
ActivitySchema.pre('save', function(next) {
  // Ensure metadata is an object
  if (typeof this.metadata !== 'object' || this.metadata === null) {
    this.metadata = {};
  }
  
  next();
});

module.exports = mongoose.model('Activity', ActivitySchema); 