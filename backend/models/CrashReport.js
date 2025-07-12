const mongoose = require('mongoose');

const CrashReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios'],
    required: true,
    index: true
  },
  appVersion: {
    type: String,
    required: true
  },
  error: {
    type: String,
    required: true
  },
  stackTrace: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    deviceModel: String,
    osVersion: String,
    networkType: String,
    batteryLevel: Number,
    memoryUsage: Number,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CrashReportSchema.index({ user: 1, timestamp: -1 });
CrashReportSchema.index({ platform: 1, timestamp: -1 });
CrashReportSchema.index({ severity: 1, timestamp: -1 });
CrashReportSchema.index({ resolved: 1, timestamp: -1 });
CrashReportSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Virtual for crash age
CrashReportSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Pre-save middleware to set severity based on error type
CrashReportSchema.pre('save', function(next) {
  if (this.isNew) {
    // Determine severity based on error content
    const errorLower = this.error.toLowerCase();
    if (errorLower.includes('outofmemory') || errorLower.includes('fatal')) {
      this.severity = 'critical';
    } else if (errorLower.includes('nullpointer') || errorLower.includes('exception')) {
      this.severity = 'high';
    } else if (errorLower.includes('warning') || errorLower.includes('deprecated')) {
      this.severity = 'low';
    } else {
      this.severity = 'medium';
    }
  }
  next();
});

// Instance methods
CrashReportSchema.methods.resolve = function(userId, notes) {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Static methods
CrashReportSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 20, resolved, severity, platform } = options;
  const skip = (page - 1) * limit;
  
  const query = { user: userId };
  
  if (resolved !== undefined) {
    query.resolved = resolved;
  }
  
  if (severity) {
    query.severity = severity;
  }
  
  if (platform) {
    query.platform = platform;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('resolvedBy', 'name email');
};

CrashReportSchema.statics.getCrashStats = function(userId, period = '30d') {
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
        user: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        count: { $sum: 1 },
        bySeverity: { $push: '$severity' },
        byPlatform: { $push: '$platform' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

CrashReportSchema.statics.getUnresolvedCrashes = function(userId) {
  return this.find({
    user: userId,
    resolved: false
  })
  .sort({ timestamp: -1 })
  .populate('resolvedBy', 'name email');
};

CrashReportSchema.statics.getCriticalCrashes = function(userId) {
  return this.find({
    user: userId,
    severity: 'critical',
    resolved: false
  })
  .sort({ timestamp: -1 })
  .populate('resolvedBy', 'name email');
};

CrashReportSchema.statics.getCrashAnalytics = function(userId) {
  return this.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        totalCrashes: { $sum: 1 },
        resolvedCrashes: { $sum: { $cond: ['$resolved', 1, 0] } },
        criticalCrashes: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        bySeverity: {
          $push: '$severity'
        },
        byPlatform: {
          $push: '$platform'
        },
        byAppVersion: {
          $push: '$appVersion'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalCrashes: 1,
        resolvedCrashes: 1,
        criticalCrashes: 1,
        resolutionRate: {
          $cond: [
            { $eq: ['$totalCrashes', 0] },
            0,
            { $divide: ['$resolvedCrashes', '$totalCrashes'] }
          ]
        },
        bySeverity: {
          $reduce: {
            input: '$bySeverity',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $literal: {
                    $concat: [
                      '$$this',
                      ': ',
                      { $toString: { $sum: { $cond: [{ $eq: ['$$this', '$$this'] }, 1, 0] } } }
                    ]
                  }
                }
              ]
            }
          }
        },
        byPlatform: {
          $reduce: {
            input: '$byPlatform',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $literal: {
                    $concat: [
                      '$$this',
                      ': ',
                      { $toString: { $sum: { $cond: [{ $eq: ['$$this', '$$this'] }, 1, 0] } } }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

CrashReportSchema.statics.cleanupOldCrashes = function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    resolved: true
  });
};

// Export model
module.exports = mongoose.model('CrashReport', CrashReportSchema); 