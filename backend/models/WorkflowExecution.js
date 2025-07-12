const mongoose = require('mongoose');

const WorkflowExecutionSchema = new mongoose.Schema({
  // Basic Information
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
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
  
  // Execution Details
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  triggerType: {
    type: String,
    enum: ['lead_created', 'lead_status_changed', 'lead_score_changed', 'lead_tagged', 'time_based', 'manual'],
    required: true
  },
  
  // Data & Context
  triggerData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Execution Results
  actionsExecuted: [{
    actionId: String,
    actionType: String,
    order: Number,
    status: {
      type: String,
      enum: ['pending', 'executing', 'completed', 'failed', 'skipped'],
      default: 'pending'
    },
    startTime: Date,
    endTime: Date,
    executionTime: Number, // in milliseconds
    result: mongoose.Schema.Types.Mixed,
    error: String,
    retryCount: { type: Number, default: 0 }
  }],
  
  // Performance Metrics
  executionTime: Number, // total execution time in milliseconds
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: Date,
  
  // Error Handling
  error: {
    message: String,
    stack: String,
    actionId: String,
    retryable: { type: Boolean, default: true }
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Scheduling
  scheduledFor: Date,
  nextRetry: Date,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
WorkflowExecutionSchema.index({ workflowId: 1, status: 1, createdAt: -1 });
WorkflowExecutionSchema.index({ userId: 1, status: 1, createdAt: -1 });
WorkflowExecutionSchema.index({ leadId: 1, status: 1, createdAt: -1 });
WorkflowExecutionSchema.index({ status: 1, scheduledFor: 1 });
WorkflowExecutionSchema.index({ status: 1, nextRetry: 1 });
WorkflowExecutionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Virtual for execution duration
WorkflowExecutionSchema.virtual('duration').get(function() {
  if (!this.startTime) return 0;
  const endTime = this.endTime || new Date();
  return endTime.getTime() - this.startTime.getTime();
});

// Virtual for success rate
WorkflowExecutionSchema.virtual('successRate').get(function() {
  if (!this.actionsExecuted || this.actionsExecuted.length === 0) return 0;
  const completed = this.actionsExecuted.filter(a => a.status === 'completed').length;
  return (completed / this.actionsExecuted.length) * 100;
});

// Pre-save middleware
WorkflowExecutionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.endTime = new Date();
  }
  
  if (this.isModified('status') && this.status === 'failed' && this.error && this.error.retryable) {
    this.nextRetry = new Date(Date.now() + (this.retryCount + 1) * 5 * 60 * 1000); // 5 minutes * retry count
  }
  
  next();
});

// Instance methods
WorkflowExecutionSchema.methods.start = function() {
  this.status = 'running';
  this.startTime = new Date();
  return this.save();
};

WorkflowExecutionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.executionTime = this.endTime.getTime() - this.startTime.getTime();
  return this.save();
};

WorkflowExecutionSchema.methods.fail = function(error, retryable = true) {
  this.status = 'failed';
  this.endTime = new Date();
  this.error = {
    message: error.message || error,
    stack: error.stack,
    retryable
  };
  
  if (retryable && this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.nextRetry = new Date(Date.now() + this.retryCount * 5 * 60 * 1000);
  }
  
  return this.save();
};

WorkflowExecutionSchema.methods.addActionResult = function(actionId, actionType, order, result, error = null) {
  const action = {
    actionId,
    actionType,
    order,
    status: error ? 'failed' : 'completed',
    startTime: new Date(),
    endTime: new Date(),
    result,
    error: error ? error.message : null
  };
  
  this.actionsExecuted.push(action);
  return this.save();
};

WorkflowExecutionSchema.methods.canRetry = function() {
  return this.status === 'failed' && 
         this.error && 
         this.error.retryable && 
         this.retryCount < this.maxRetries;
};

// Static methods
WorkflowExecutionSchema.statics.findByWorkflow = function(workflowId, options = {}) {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;
  
  const query = { workflowId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('leadId', 'name email company')
    .populate('userId', 'name email');
};

WorkflowExecutionSchema.statics.findPendingRetries = function() {
  return this.find({
    status: 'failed',
    nextRetry: { $lte: new Date() },
    'error.retryable': true
  }).populate('workflowId');
};

WorkflowExecutionSchema.statics.getExecutionStats = function(userId, period = '30d') {
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
        totalExecutions: { $sum: 1 },
        completedExecutions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failedExecutions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        averageExecutionTime: { $avg: '$executionTime' },
        byStatus: { $push: '$status' },
        byTriggerType: { $push: '$triggerType' }
      }
    }
  ]);
};

WorkflowExecutionSchema.statics.cleanupOldExecutions = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['completed', 'failed'] }
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('WorkflowExecution', WorkflowExecutionSchema); 