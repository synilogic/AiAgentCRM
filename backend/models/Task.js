const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  // Basic Information
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Task Details
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'follow_up', 'research', 'proposal', 'demo', 'other'],
    default: 'other',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'deferred'],
    default: 'pending',
    index: true
  },
  
  // Scheduling
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  startDate: Date,
  completedDate: Date,
  estimatedDuration: {
    type: Number, // in minutes
    min: 0
  },
  actualDuration: {
    type: Number, // in minutes
    min: 0
  },
  
  // Assignment
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms', 'whatsapp'],
      required: true
    },
    time: {
      type: String, // HH:MM format
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  
  // Progress Tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  checkList: [{
    item: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  // Communication
  notes: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags & Categories
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Integration Data
  externalId: String, // For integration with external systems
  source: {
    type: String,
    enum: ['manual', 'workflow', 'integration', 'template'],
    default: 'manual'
  },
  
  // Metadata
  metadata: {
    location: String,
    attendees: [String],
    meetingUrl: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TaskSchema.index({ userId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ assignee: 1, status: 1, dueDate: 1 });
TaskSchema.index({ leadId: 1, status: 1, createdAt: -1 });
TaskSchema.index({ dueDate: 1, status: 'pending' });
TaskSchema.index({ 'reminders.date': 1, 'reminders.sent': false });
TaskSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate < new Date();
});

// Virtual for days until due
TaskSchema.virtual('daysUntilDue').get(function() {
  if (this.status === 'completed') return null;
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
TaskSchema.virtual('completionPercentage').get(function() {
  if (this.checkList.length === 0) return this.progress;
  const completedItems = this.checkList.filter(item => item.completed).length;
  return Math.round((completedItems / this.checkList.length) * 100);
});

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  // Update progress based on checklist
  if (this.checkList && this.checkList.length > 0) {
    const completedItems = this.checkList.filter(item => item.completed).length;
    this.progress = Math.round((completedItems / this.checkList.length) * 100);
  }
  
  // Set completed date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  // Set start date when status changes to in_progress
  if (this.isModified('status') && this.status === 'in_progress' && !this.startDate) {
    this.startDate = new Date();
  }
  
  next();
});

// Instance methods
TaskSchema.methods.addNote = function(content, author, isPrivate = false) {
  this.notes.push({
    content,
    author,
    isPrivate
  });
  return this.save();
};

TaskSchema.methods.addChecklistItem = function(item) {
  this.checkList.push({ item });
  return this.save();
};

TaskSchema.methods.toggleChecklistItem = function(itemIndex) {
  if (this.checkList[itemIndex]) {
    this.checkList[itemIndex].completed = !this.checkList[itemIndex].completed;
    this.checkList[itemIndex].completedAt = this.checkList[itemIndex].completed ? new Date() : null;
    return this.save();
  }
  return Promise.resolve(this);
};

TaskSchema.methods.addReminder = function(type, time, date) {
  this.reminders.push({
    type,
    time,
    date
  });
  return this.save();
};

TaskSchema.methods.markAsCompleted = function(actualDuration = null) {
  this.status = 'completed';
  this.completedDate = new Date();
  if (actualDuration !== null) {
    this.actualDuration = actualDuration;
  }
  return this.save();
};

TaskSchema.methods.assignTo = function(userId) {
  this.assignee = userId;
  return this.save();
};

// Static methods
TaskSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 20, status, priority, type, overdue } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;
  if (overdue) {
    query.dueDate = { $lt: new Date() };
    query.status = 'pending';
  }
  
  return this.find(query)
    .sort({ dueDate: 1, priority: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('leadId', 'name email company')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');
};

TaskSchema.statics.findByAssignee = function(assigneeId, options = {}) {
  const { page = 1, limit = 20, status, priority } = options;
  const skip = (page - 1) * limit;
  
  const query = { assignee: assigneeId };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  
  return this.find(query)
    .sort({ dueDate: 1, priority: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('leadId', 'name email company')
    .populate('userId', 'name email');
};

TaskSchema.statics.findOverdueTasks = function(userId = null) {
  const query = {
    dueDate: { $lt: new Date() },
    status: 'pending'
  };
  
  if (userId) {
    query.$or = [
      { userId },
      { assignee: userId }
    ];
  }
  
  return this.find(query)
    .sort({ dueDate: 1 })
    .populate('leadId', 'name email company')
    .populate('assignee', 'name email')
    .populate('userId', 'name email');
};

TaskSchema.statics.getTaskStats = function(userId, period = '30d') {
  const periods = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };
  
  const days = periods[period] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pendingTasks: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        overdueTasks: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$dueDate', new Date()] }] },
              1,
              0
            ]
          }
        },
        byPriority: { $push: '$priority' },
        byType: { $push: '$type' }
      }
    }
  ]);
};

TaskSchema.statics.getUpcomingTasks = function(userId, days = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    userId,
    dueDate: { $gte: new Date(), $lte: endDate },
    status: { $in: ['pending', 'in_progress'] }
  })
  .sort({ dueDate: 1 })
  .populate('leadId', 'name email company')
  .populate('assignee', 'name email');
};

module.exports = mongoose.model('Task', TaskSchema); 