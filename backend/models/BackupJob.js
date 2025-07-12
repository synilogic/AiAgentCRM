const mongoose = require('mongoose');

const backupJobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['full_backup', 'incremental_backup', 'collection_backup', 'export', 'migration'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'running', 'completed', 'failed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['manual', 'daily', 'weekly', 'monthly'],
      default: 'manual'
    },
    time: String, // Format: "HH:MM"
    dayOfWeek: Number, // 0-6, Sunday=0
    dayOfMonth: Number, // 1-31
    timezone: {
      type: String,
      default: 'UTC'
    },
    nextRun: Date,
    lastRun: Date
  },
  configuration: {
    collections: [String], // Specific collections to backup (empty = all)
    excludeCollections: [String],
    compression: {
      type: Boolean,
      default: true
    },
    encryption: {
      enabled: {
        type: Boolean,
        default: false
      },
      algorithm: String,
      keyId: String
    },
    retention: {
      days: {
        type: Number,
        default: 30
      },
      maxBackups: {
        type: Number,
        default: 10
      }
    },
    destination: {
      type: {
        type: String,
        enum: ['local', 's3', 'ftp', 'google_drive'],
        default: 'local'
      },
      path: String,
      credentials: {
        accessKey: String,
        secretKey: String,
        bucket: String,
        region: String,
        endpoint: String
      }
    },
    notifications: {
      email: [String],
      webhook: String,
      onSuccess: {
        type: Boolean,
        default: false
      },
      onFailure: {
        type: Boolean,
        default: true
      }
    }
  },
  execution: {
    startedAt: Date,
    completedAt: Date,
    duration: Number, // in milliseconds
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentStep: String,
    totalSteps: Number,
    processedDocuments: {
      type: Number,
      default: 0
    },
    totalDocuments: Number,
    errors: [{
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      collection: String,
      documentId: String
    }],
    warnings: [{
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  output: {
    filePath: String,
    fileSize: Number, // in bytes
    fileHash: String, // MD5 or SHA256
    metadata: {
      databaseVersion: String,
      backupVersion: String,
      collectionsCount: Number,
      documentsCount: Number,
      indexesCount: Number,
      dataSize: Number,
      storageSize: Number
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
backupJobSchema.index({ type: 1, status: 1 });
backupJobSchema.index({ 'schedule.nextRun': 1, isActive: 1 });
backupJobSchema.index({ createdBy: 1, createdAt: -1 });
backupJobSchema.index({ status: 1, priority: 1 });

// Virtual for checking if job is overdue
backupJobSchema.virtual('isOverdue').get(function() {
  if (this.schedule.frequency === 'manual' || !this.schedule.nextRun) {
    return false;
  }
  return this.schedule.nextRun < new Date() && this.status === 'scheduled';
});

// Virtual for estimated completion time
backupJobSchema.virtual('estimatedCompletion').get(function() {
  if (this.status !== 'running' || !this.execution.startedAt) {
    return null;
  }
  
  const elapsed = Date.now() - this.execution.startedAt.getTime();
  const progress = this.execution.progress || 1;
  const totalTime = (elapsed / progress) * 100;
  const remaining = totalTime - elapsed;
  
  return new Date(Date.now() + remaining);
});

// Virtual for execution summary
backupJobSchema.virtual('executionSummary').get(function() {
  return {
    duration: this.execution.duration,
    documentsProcessed: this.execution.processedDocuments,
    errorsCount: this.execution.errors.length,
    warningsCount: this.execution.warnings.length,
    fileSize: this.output.fileSize,
    success: this.status === 'completed' && this.execution.errors.length === 0
  };
});

// Pre-save middleware to update nextRun
backupJobSchema.pre('save', function(next) {
  if (this.isModified('schedule') && this.schedule.frequency !== 'manual') {
    this.calculateNextRun();
  }
  next();
});

// Method to calculate next run time
backupJobSchema.methods.calculateNextRun = function() {
  if (this.schedule.frequency === 'manual') {
    this.schedule.nextRun = null;
    return;
  }

  const now = new Date();
  let nextRun = new Date();

  switch (this.schedule.frequency) {
    case 'daily':
      if (this.schedule.time) {
        const [hours, minutes] = this.schedule.time.split(':');
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      const targetDay = this.schedule.dayOfWeek || 0;
      const currentDay = nextRun.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      if (this.schedule.time) {
        const [hours, minutes] = this.schedule.time.split(':');
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      break;

    case 'monthly':
      const targetDate = this.schedule.dayOfMonth || 1;
      nextRun.setDate(targetDate);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      if (this.schedule.time) {
        const [hours, minutes] = this.schedule.time.split(':');
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      break;
  }

  this.schedule.nextRun = nextRun;
};

// Method to start execution
backupJobSchema.methods.startExecution = async function() {
  this.status = 'running';
  this.execution.startedAt = new Date();
  this.execution.progress = 0;
  this.execution.errors = [];
  this.execution.warnings = [];
  this.execution.processedDocuments = 0;
  
  await this.save();
  
  // Log activity
  const Activity = require('./Activity');
  await Activity.create({
    user: this.createdBy,
    type: 'backup_job_started',
    description: `Backup job '${this.name}' started execution`,
    metadata: {
      jobId: this._id,
      type: this.type,
      collections: this.configuration.collections
    }
  });
};

// Method to update progress
backupJobSchema.methods.updateProgress = async function(progress, currentStep, processedDocs) {
  this.execution.progress = Math.min(100, Math.max(0, progress));
  if (currentStep) this.execution.currentStep = currentStep;
  if (processedDocs !== undefined) this.execution.processedDocuments = processedDocs;
  
  await this.save();
};

// Method to complete execution
backupJobSchema.methods.completeExecution = async function(output, errors = []) {
  this.status = errors.length > 0 ? 'failed' : 'completed';
  this.execution.completedAt = new Date();
  this.execution.duration = this.execution.completedAt - this.execution.startedAt;
  this.execution.progress = 100;
  
  if (output) {
    this.output = { ...this.output, ...output };
  }
  
  if (errors.length > 0) {
    this.execution.errors.push(...errors);
  }
  
  // Update last run and calculate next run
  this.schedule.lastRun = new Date();
  if (this.schedule.frequency !== 'manual') {
    this.calculateNextRun();
  }
  
  await this.save();
  
  // Send notification if configured
  await this.sendNotification();
  
  // Log activity
  const Activity = require('./Activity');
  await Activity.create({
    user: this.createdBy,
    type: this.status === 'completed' ? 'backup_job_completed' : 'backup_job_failed',
    description: `Backup job '${this.name}' ${this.status}`,
    metadata: {
      jobId: this._id,
      duration: this.execution.duration,
      fileSize: this.output.fileSize,
      errorsCount: this.execution.errors.length
    }
  });
};

// Method to send notifications
backupJobSchema.methods.sendNotification = async function() {
  const shouldNotify = this.status === 'completed' ? 
    this.configuration.notifications.onSuccess : 
    this.configuration.notifications.onFailure;
    
  if (!shouldNotify) return;
  
  // Email notifications
  if (this.configuration.notifications.email.length > 0) {
    // In a real implementation, you would send emails here
    console.log(`Email notification sent for backup job ${this.name}`);
  }
  
  // Webhook notifications
  if (this.configuration.notifications.webhook) {
    try {
      // In a real implementation, you would make HTTP request here
      console.log(`Webhook notification sent for backup job ${this.name}`);
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
};

// Static method to find jobs ready for execution
backupJobSchema.statics.findReadyJobs = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    status: 'scheduled',
    'schedule.nextRun': { $lte: now },
    'schedule.frequency': { $ne: 'manual' }
  }).sort({ priority: -1, 'schedule.nextRun': 1 });
};

// Static method to get job statistics
backupJobSchema.statics.getStatistics = async function(timeRange = '30d') {
  const timeRanges = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['30d']));
  
  const [totalJobs, completedJobs, failedJobs, runningJobs, scheduledJobs] = await Promise.all([
    this.countDocuments({ createdAt: { $gte: since } }),
    this.countDocuments({ status: 'completed', createdAt: { $gte: since } }),
    this.countDocuments({ status: 'failed', createdAt: { $gte: since } }),
    this.countDocuments({ status: 'running' }),
    this.countDocuments({ status: 'scheduled', isActive: true })
  ]);
  
  const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  
  // Get storage usage
  const storageStats = await this.aggregate([
    { $match: { status: 'completed', 'output.fileSize': { $exists: true } } },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$output.fileSize' },
        averageSize: { $avg: '$output.fileSize' },
        backupCount: { $sum: 1 }
      }
    }
  ]);
  
  return {
    totalJobs,
    completedJobs,
    failedJobs,
    runningJobs,
    scheduledJobs,
    successRate: Math.round(successRate * 100) / 100,
    storage: storageStats[0] || { totalSize: 0, averageSize: 0, backupCount: 0 },
    timeRange
  };
};

module.exports = mongoose.model('BackupJob', backupJobSchema); 