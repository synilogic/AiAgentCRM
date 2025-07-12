const mongoose = require('mongoose');

const apiRequestLogSchema = new mongoose.Schema({
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  fullUrl: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  responseTime: {
    type: Number,
    required: true, // in milliseconds
    index: true
  },
  requestSize: {
    type: Number,
    default: 0 // in bytes
  },
  responseSize: {
    type: Number,
    default: 0 // in bytes
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  referer: {
    type: String,
    default: ''
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  queryParams: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  errorMessage: {
    type: String,
    default: null
  },
  stackTrace: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Geographical data
  country: {
    type: String,
    default: null,
    index: true
  },
  region: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  // Performance metrics
  cpuUsage: {
    type: Number,
    default: null
  },
  memoryUsage: {
    type: Number,
    default: null
  },
  // Security flags
  isBlocked: {
    type: Boolean,
    default: false,
    index: true
  },
  blockReason: {
    type: String,
    default: null
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  suspiciousReasons: [{
    type: String
  }]
}, {
  timestamps: false, // Using custom timestamp field
  capped: { size: 100000000, max: 1000000 } // Cap collection at 100MB or 1M documents
});

// Compound indexes for common queries
apiRequestLogSchema.index({ timestamp: -1, statusCode: 1 });
apiRequestLogSchema.index({ apiKeyId: 1, timestamp: -1 });
apiRequestLogSchema.index({ userId: 1, timestamp: -1 });
apiRequestLogSchema.index({ endpoint: 1, method: 1, timestamp: -1 });
apiRequestLogSchema.index({ ipAddress: 1, timestamp: -1 });
apiRequestLogSchema.index({ isBlocked: 1, timestamp: -1 });
apiRequestLogSchema.index({ isSuspicious: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 90 days
apiRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual for success status
apiRequestLogSchema.virtual('isSuccess').get(function() {
  return this.statusCode >= 200 && this.statusCode < 300;
});

// Virtual for error status
apiRequestLogSchema.virtual('isError').get(function() {
  return this.statusCode >= 400;
});

// Virtual for server error status
apiRequestLogSchema.virtual('isServerError').get(function() {
  return this.statusCode >= 500;
});

// Static method to log API request
apiRequestLogSchema.statics.logRequest = async function(requestData) {
  try {
    const log = new this(requestData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log API request:', error);
    // Don't throw error to avoid breaking the original request
    return null;
  }
};

// Static method to get analytics data
apiRequestLogSchema.statics.getAnalytics = async function(filters = {}) {
  const pipeline = [];
  
  // Match stage
  const matchStage = {};
  if (filters.startDate) matchStage.timestamp = { $gte: filters.startDate };
  if (filters.endDate) {
    matchStage.timestamp = matchStage.timestamp || {};
    matchStage.timestamp.$lte = filters.endDate;
  }
  if (filters.apiKeyId) matchStage.apiKeyId = filters.apiKeyId;
  if (filters.userId) matchStage.userId = filters.userId;
  if (filters.endpoint) matchStage.endpoint = filters.endpoint;
  if (filters.method) matchStage.method = filters.method;
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  // Group by time intervals
  pipeline.push({
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        hour: { $hour: "$timestamp" }
      },
      totalRequests: { $sum: 1 },
      successRequests: { $sum: { $cond: [{ $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 300] }] }, 1, 0] } },
      errorRequests: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
      avgResponseTime: { $avg: "$responseTime" },
      totalDataTransfer: { $sum: { $add: ["$requestSize", "$responseSize"] } }
    }
  });
  
  pipeline.push({ $sort: { "_id.date": 1, "_id.hour": 1 } });
  
  return await this.aggregate(pipeline);
};

// Static method to get top endpoints
apiRequestLogSchema.statics.getTopEndpoints = async function(limit = 10, filters = {}) {
  const pipeline = [];
  
  const matchStage = {};
  if (filters.startDate) matchStage.timestamp = { $gte: filters.startDate };
  if (filters.endDate) {
    matchStage.timestamp = matchStage.timestamp || {};
    matchStage.timestamp.$lte = filters.endDate;
  }
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  pipeline.push({
    $group: {
      _id: { endpoint: "$endpoint", method: "$method" },
      totalRequests: { $sum: 1 },
      avgResponseTime: { $avg: "$responseTime" },
      errorRate: { $avg: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } }
    }
  });
  
  pipeline.push({ $sort: { totalRequests: -1 } });
  pipeline.push({ $limit: limit });
  
  return await this.aggregate(pipeline);
};

// Static method to detect suspicious activity
apiRequestLogSchema.statics.detectSuspiciousActivity = async function() {
  const timeWindow = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
  
  // Find IPs with unusual activity
  const suspiciousIPs = await this.aggregate([
    { $match: { timestamp: { $gte: timeWindow } } },
    {
      $group: {
        _id: "$ipAddress",
        requestCount: { $sum: 1 },
        errorRate: { $avg: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        endpoints: { $addToSet: "$endpoint" }
      }
    },
    {
      $match: {
        $or: [
          { requestCount: { $gt: 100 } }, // More than 100 requests in 5 minutes
          { errorRate: { $gt: 0.5 } }, // More than 50% error rate
          { endpoints: { $size: { $gt: 20 } } } // Accessing more than 20 different endpoints
        ]
      }
    }
  ]);
  
  return suspiciousIPs;
};

module.exports = mongoose.model('ApiRequestLog', apiRequestLogSchema); 