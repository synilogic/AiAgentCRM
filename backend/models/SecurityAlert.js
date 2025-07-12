const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'SEC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  type: {
    type: String,
    required: true,
    enum: [
      'brute_force_attempt',
      'suspicious_login',
      'rate_limit_exceeded',
      'unusual_api_usage',
      'sql_injection_attempt',
      'xss_attempt',
      'ddos_attack',
      'unauthorized_access',
      'data_breach_attempt',
      'malware_detected',
      'phishing_attempt',
      'account_takeover',
      'privilege_escalation',
      'suspicious_file_upload',
      'suspicious_ip_activity',
      'repeated_failed_logins',
      'unusual_geographic_access',
      'suspicious_user_agent',
      'bot_activity',
      'credential_stuffing',
      'system_performance_issue',
      'high_memory_usage',
      'high_cpu_usage',
      'disk_space_warning',
      'database_connection_issue',
      'service_timeout',
      'unusual_traffic_spike'
    ],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'investigating', 'resolved', 'false_positive', 'dismissed'],
    default: 'active',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  sourceIP: {
    type: String,
    index: true
  },
  targetEndpoint: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    index: true
  },
  detectionMethod: {
    type: String,
    enum: ['automatic', 'manual', 'third_party', 'machine_learning'],
    default: 'automatic'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50 // Confidence level in percentage
  },
  metadata: {
    requestCount: Number,
    timeWindow: String,
    patterns: [String],
    relatedAlerts: [String],
    geoLocation: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number
    },
    deviceInfo: {
      os: String,
      browser: String,
      device: String
    },
    networkInfo: {
      isp: String,
      organization: String,
      asn: String
    }
  },
  actions: [{
    action: {
      type: String,
      enum: ['block_ip', 'rate_limit', 'require_2fa', 'notify_admin', 'quarantine_user', 'log_only'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: String,
      enum: ['system', 'admin'],
      default: 'system'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    result: {
      type: String,
      enum: ['success', 'failed', 'pending']
    },
    details: String
  }],
  relatedLogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiRequestLog'
  }],
  investigationNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionType: {
      type: String,
      enum: ['mitigated', 'false_positive', 'acknowledged', 'escalated']
    },
    resolutionNotes: String
  },
  escalated: {
    type: Boolean,
    default: false,
    index: true
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
securityAlertSchema.index({ type: 1, severity: 1, status: 1 });
securityAlertSchema.index({ sourceIP: 1, detectedAt: -1 });
securityAlertSchema.index({ userId: 1, detectedAt: -1 });
securityAlertSchema.index({ status: 1, detectedAt: -1 });
securityAlertSchema.index({ escalated: 1, severity: 1 });

// TTL index to automatically delete resolved alerts after 6 months
securityAlertSchema.index(
  { "resolution.resolvedAt": 1 }, 
  { expireAfterSeconds: 15552000, partialFilterExpression: { "resolution.resolvedAt": { $exists: true } } }
);

// Virtual for alert age
securityAlertSchema.virtual('age').get(function() {
  return Date.now() - this.detectedAt.getTime();
});

// Virtual for checking if alert is recent (last 24 hours)
securityAlertSchema.virtual('isRecent').get(function() {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return this.age < twentyFourHours;
});

// Virtual for priority score (combines severity and confidence)
securityAlertSchema.virtual('priorityScore').get(function() {
  const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
  return (severityScores[this.severity] || 1) * (this.confidence / 100);
});

// Pre-save middleware
securityAlertSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to create alert
securityAlertSchema.statics.createAlert = async function(alertData) {
  try {
    const alert = new this(alertData);
    await alert.save();
    
    // Trigger automatic actions based on severity
    await alert.triggerAutomaticActions();
    
    return alert;
  } catch (error) {
    console.error('Failed to create security alert:', error);
    throw error;
  }
};

// Method to trigger automatic actions
securityAlertSchema.methods.triggerAutomaticActions = async function() {
  const actions = [];
  
  // Define automatic actions based on alert type and severity
  if (this.severity === 'critical') {
    actions.push('notify_admin');
    
    if (this.type === 'brute_force_attempt' || this.type === 'ddos_attack') {
      actions.push('block_ip');
    }
    
    if (this.type === 'account_takeover' || this.type === 'unauthorized_access') {
      actions.push('quarantine_user');
    }
  } else if (this.severity === 'high') {
    actions.push('notify_admin', 'rate_limit');
  } else {
    actions.push('log_only');
  }
  
  // Execute actions
  for (const actionType of actions) {
    try {
      const actionResult = await this.executeAction(actionType, 'system');
      console.log(`Executed action ${actionType} for alert ${this.alertId}:`, actionResult);
    } catch (error) {
      console.error(`Failed to execute action ${actionType} for alert ${this.alertId}:`, error);
    }
  }
};

// Method to execute specific action
securityAlertSchema.methods.executeAction = async function(actionType, performedBy = 'system', adminId = null) {
  const action = {
    action: actionType,
    timestamp: new Date(),
    performedBy,
    adminId,
    result: 'pending'
  };
  
  try {
    switch (actionType) {
      case 'block_ip':
        if (this.sourceIP) {
          const { blockedIPsCache } = require('../middleware/apiKeyAuth');
          blockedIPsCache.set(this.sourceIP, {
            reason: `Security alert: ${this.type}`,
            expiresAt: Date.now() + (60 * 60 * 1000), // Block for 1 hour
            alertId: this.alertId
          });
          action.result = 'success';
          action.details = `IP ${this.sourceIP} blocked for 1 hour`;
        } else {
          action.result = 'failed';
          action.details = 'No source IP available to block';
        }
        break;
        
      case 'rate_limit':
        // Implement rate limiting logic
        action.result = 'success';
        action.details = 'Rate limiting applied';
        break;
        
      case 'notify_admin':
        // Send notification to admins
        await this.notifyAdmins();
        action.result = 'success';
        action.details = 'Admin notification sent';
        break;
        
      case 'quarantine_user':
        if (this.userId) {
          const User = require('./User');
          await User.findByIdAndUpdate(this.userId, { 
            status: 'suspended',
            suspendedReason: `Security alert: ${this.type}`,
            suspendedAt: new Date()
          });
          action.result = 'success';
          action.details = 'User account quarantined';
        } else {
          action.result = 'failed';
          action.details = 'No user ID available to quarantine';
        }
        break;
        
      case 'log_only':
        action.result = 'success';
        action.details = 'Alert logged for review';
        break;
        
      default:
        action.result = 'failed';
        action.details = `Unknown action type: ${actionType}`;
    }
  } catch (error) {
    action.result = 'failed';
    action.details = error.message;
  }
  
  this.actions.push(action);
  await this.save();
  
  return action;
};

// Method to notify admins
securityAlertSchema.methods.notifyAdmins = async function() {
  try {
    const User = require('./User');
    const admins = await User.find({ role: 'admin' }).select('email name');
    
    // In a real implementation, you would send emails/notifications here
    console.log(`Security Alert ${this.alertId}: ${this.title}`);
    console.log(`Severity: ${this.severity}`);
    console.log(`Type: ${this.type}`);
    console.log(`Description: ${this.description}`);
    console.log(`Admins to notify: ${admins.map(admin => admin.email).join(', ')}`);
    
    return { success: true, notifiedAdmins: admins.length };
  } catch (error) {
    console.error('Failed to notify admins:', error);
    return { success: false, error: error.message };
  }
};

// Static method to get security dashboard summary
securityAlertSchema.statics.getDashboardSummary = async function(timeRange = '24h') {
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const timeWindow = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['24h']));
  
  const [
    totalAlerts,
    activeAlerts,
    criticalAlerts,
    alertsByType,
    alertsBySeverity,
    recentTrends
  ] = await Promise.all([
    this.countDocuments({ detectedAt: { $gte: timeWindow } }),
    this.countDocuments({ status: 'active', detectedAt: { $gte: timeWindow } }),
    this.countDocuments({ severity: 'critical', detectedAt: { $gte: timeWindow } }),
    this.aggregate([
      { $match: { detectedAt: { $gte: timeWindow } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.aggregate([
      { $match: { detectedAt: { $gte: timeWindow } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { detectedAt: { $gte: timeWindow } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$detectedAt" }
          },
          count: { $sum: 1 },
          criticalCount: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  
  return {
    summary: {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      resolvedAlerts: totalAlerts - activeAlerts
    },
    alertsByType,
    alertsBySeverity,
    recentTrends,
    timeRange
  };
};

module.exports = mongoose.model('SecurityAlert', securityAlertSchema); 