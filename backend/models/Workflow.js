const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Workflow Configuration
  trigger: {
    type: {
      type: String,
      enum: ['lead_created', 'lead_status_changed', 'lead_score_changed', 'lead_tagged', 'time_based', 'manual'],
      required: true
    },
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    schedule: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      time: String, // HH:MM format
      daysOfWeek: [Number], // 0-6 for Sunday-Saturday
      dayOfMonth: Number
    }
  },
  
  // Actions
  actions: [{
    type: {
      type: String,
      enum: ['send_email', 'send_whatsapp', 'create_task', 'update_lead', 'add_tag', 'remove_tag', 'change_status', 'assign_user', 'webhook'],
      required: true
    },
    order: { type: Number, required: true },
    delay: { type: Number, default: 0 }, // delay in minutes
    conditions: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }],
    config: {
      // Email configuration
      template: String,
      subject: String,
      body: String,
      recipients: [String],
      
      // WhatsApp configuration
      message: String,
      mediaUrl: String,
      
      // Task configuration
      taskTitle: String,
      taskDescription: String,
      dueDate: String, // relative date like "2 days", "1 week"
      assignee: mongoose.Schema.Types.ObjectId,
      
      // Lead update configuration
      field: String,
      value: mongoose.Schema.Types.Mixed,
      
      // Tag configuration
      tag: String,
      
      // Webhook configuration
      url: String,
      method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
      headers: mongoose.Schema.Types.Mixed,
      body: String
    },
    enabled: { type: Boolean, default: true }
  }],
  
  // Status & Control
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Execution Tracking
  executionStats: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    lastExecuted: Date,
    averageExecutionTime: { type: Number, default: 0 } // in milliseconds
  },
  
  // Performance & Limits
  limits: {
    maxExecutionsPerDay: { type: Number, default: 1000 },
    maxExecutionsPerHour: { type: Number, default: 100 },
    executionTimeout: { type: Number, default: 30000 } // 30 seconds
  },
  
  // Error Handling
  errorHandling: {
    retryOnFailure: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 300000 }, // 5 minutes
    stopOnError: { type: Boolean, default: false }
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    createdAt: Date
  }],
  
  // Metadata
  tags: [String],
  category: {
    type: String,
    enum: ['lead_nurturing', 'follow_up', 'onboarding', 're_engagement', 'custom'],
    default: 'custom'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
WorkflowSchema.index({ userId: 1, status: 1, createdAt: -1 });
WorkflowSchema.index({ userId: 1, isActive: 1 });
WorkflowSchema.index({ 'trigger.type': 1, isActive: 1 });
WorkflowSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Virtual for success rate
WorkflowSchema.virtual('successRate').get(function() {
  if (this.executionStats.totalExecutions === 0) return 0;
  return (this.executionStats.successfulExecutions / this.executionStats.totalExecutions) * 100;
});

// Pre-save middleware
WorkflowSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate action order
  if (this.actions && this.actions.length > 0) {
    this.actions.sort((a, b) => a.order - b.order);
  }
  
  next();
});

// Instance methods
WorkflowSchema.methods.activate = function() {
  this.isActive = true;
  this.status = 'active';
  return this.save();
};

WorkflowSchema.methods.deactivate = function() {
  this.isActive = false;
  this.status = 'inactive';
  return this.save();
};

WorkflowSchema.methods.execute = async function(leadData, context = {}) {
  const WorkflowExecution = require('./WorkflowExecution');
  
  const execution = new WorkflowExecution({
    workflowId: this._id,
    userId: this.userId,
    leadId: leadData._id,
    triggerData: leadData,
    context
  });
  
  await execution.save();
  
  try {
    const startTime = Date.now();
    
    for (const action of this.actions) {
      if (!action.enabled) continue;
      
      // Check conditions
      if (action.conditions && action.conditions.length > 0) {
        const shouldExecute = this.evaluateConditions(action.conditions, leadData);
        if (!shouldExecute) continue;
      }
      
      // Execute action
      await this.executeAction(action, leadData, execution);
      
      // Apply delay
      if (action.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, action.delay * 60 * 1000));
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // Update execution stats
    this.executionStats.totalExecutions += 1;
    this.executionStats.successfulExecutions += 1;
    this.executionStats.lastExecuted = new Date();
    this.executionStats.averageExecutionTime = 
      (this.executionStats.averageExecutionTime + executionTime) / 2;
    
    await this.save();
    
    execution.status = 'completed';
    execution.executionTime = executionTime;
    await execution.save();
    
    return { success: true, executionId: execution._id };
  } catch (error) {
    this.executionStats.totalExecutions += 1;
    this.executionStats.failedExecutions += 1;
    await this.save();
    
    execution.status = 'failed';
    execution.error = error.message;
    await execution.save();
    
    throw error;
  }
};

WorkflowSchema.methods.evaluateConditions = function(conditions, data) {
  for (const condition of conditions) {
    const value = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;
    
    let result = false;
    switch (condition.operator) {
      case 'equals':
        result = value === conditionValue;
        break;
      case 'not_equals':
        result = value !== conditionValue;
        break;
      case 'contains':
        result = String(value).includes(String(conditionValue));
        break;
      case 'not_contains':
        result = !String(value).includes(String(conditionValue));
        break;
      case 'greater_than':
        result = Number(value) > Number(conditionValue);
        break;
      case 'less_than':
        result = Number(value) < Number(conditionValue);
        break;
      case 'is_empty':
        result = !value || value === '';
        break;
      case 'is_not_empty':
        result = value && value !== '';
        break;
    }
    
    if (!result) return false;
  }
  return true;
};

WorkflowSchema.methods.getNestedValue = function(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
};

WorkflowSchema.methods.executeAction = async function(action, leadData, execution) {
  const ActionExecutor = require('../services/ActionExecutor');
  const executor = new ActionExecutor();
  
  await executor.execute(action, leadData, execution);
};

// Static methods
WorkflowSchema.statics.findByUser = function(userId, options = {}) {
  const { status, category, isActive } = options;
  
  const query = { userId };
  if (status) query.status = status;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email');
};

WorkflowSchema.statics.getActiveWorkflows = function() {
  return this.find({ isActive: true, status: 'active' });
};

WorkflowSchema.statics.getWorkflowStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalWorkflows: { $sum: 1 },
        activeWorkflows: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalExecutions: { $sum: '$executionStats.totalExecutions' },
        successfulExecutions: { $sum: '$executionStats.successfulExecutions' },
        byCategory: { $push: '$category' }
      }
    }
  ]);
};

module.exports = mongoose.model('Workflow', WorkflowSchema); 