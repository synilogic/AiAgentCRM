const mongoose = require('mongoose');

const systemMetricSchema = new mongoose.Schema({
  metricType: {
    type: String,
    required: true,
    enum: [
      'cpu_usage',
      'memory_usage',
      'disk_usage',
      'network_io',
      'database_connections',
      'response_time',
      'error_rate',
      'throughput',
      'queue_length',
      'cache_hit_rate',
      'active_users',
      'api_calls',
      'database_queries',
      'file_uploads',
      'email_sends',
      'background_jobs',
      // Add missing values used in MonitoringService
      'system_load',
      'heap_usage',
      'database_size',
      'process_uptime',
      'event_loop_lag',
      'active_handles'
    ],
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['percentage', 'bytes', 'milliseconds', 'count', 'requests_per_second', 'queries_per_second', 'mb', 'gb', 'seconds']
  },
  metadata: {
    hostname: String,
    process_id: Number,
    node_version: String,
    environment: String,
    region: String,
    instance_id: String,
    // CPU specific
    cpu_cores: Number,
    load_average: [Number],
    // Memory specific
    heap_used: Number,
    heap_total: Number,
    heap_limit: Number,
    external_memory: Number,
    // Disk specific
    disk_total: Number,
    disk_free: Number,
    disk_used: Number,
    // Network specific
    bytes_sent: Number,
    bytes_received: Number,
    packets_sent: Number,
    packets_received: Number,
    // Database specific
    active_connections: Number,
    pool_size: Number,
    query_time: Number,
    slow_queries: Number,
    // Application specific
    endpoint: String,
    user_agent: String,
    response_code: Number,
    request_method: String,
    error_message: String,
    stack_trace: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Aggregation helpers
  hourly_average: Number,
  daily_average: Number,
  is_anomaly: {
    type: Boolean,
    default: false,
    index: true
  },
  anomaly_score: {
    type: Number,
    min: 0,
    max: 100
  },
  threshold_breached: {
    type: Boolean,
    default: false,
    index: true
  },
  alert_sent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false, // Using custom timestamp
  capped: { size: 500000000, max: 5000000 } // Cap at 500MB or 5M documents
});

// Indexes for performance
systemMetricSchema.index({ metricType: 1, timestamp: -1 });
systemMetricSchema.index({ timestamp: -1, metricType: 1, value: 1 });
systemMetricSchema.index({ is_anomaly: 1, timestamp: -1 });
systemMetricSchema.index({ threshold_breached: 1, alert_sent: 1 });
systemMetricSchema.index({ 'metadata.hostname': 1, timestamp: -1 });

// TTL index to automatically delete old metrics after 30 days
systemMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Virtual for metric age
systemMetricSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Virtual for checking if metric is recent (last 5 minutes)
systemMetricSchema.virtual('isRecent').get(function() {
  const fiveMinutes = 5 * 60 * 1000;
  return this.age < fiveMinutes;
});

// Static method to record metric
systemMetricSchema.statics.recordMetric = async function(metricData) {
  try {
    // Add system metadata
    const enrichedData = {
      ...metricData,
      metadata: {
        ...metricData.metadata,
        hostname: require('os').hostname(),
        process_id: process.pid,
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Check for anomalies and thresholds
    await this.checkAnomalies(enrichedData);
    
    const metric = new this(enrichedData);
    await metric.save();
    
    return metric;
  } catch (error) {
    console.error('Failed to record metric:', error);
    // Don't throw to avoid breaking the main application
    return null;
  }
};

// Static method to check for anomalies and thresholds
systemMetricSchema.statics.checkAnomalies = async function(metricData) {
  const { metricType, value } = metricData;
  
  // Define thresholds for different metrics
  const thresholds = {
    cpu_usage: { warning: 70, critical: 90 },
    memory_usage: { warning: 80, critical: 95 },
    disk_usage: { warning: 85, critical: 95 },
    response_time: { warning: 1000, critical: 5000 }, // milliseconds
    error_rate: { warning: 5, critical: 10 }, // percentage
    database_connections: { warning: 80, critical: 95 } // percentage of pool
  };
  
  const threshold = thresholds[metricType];
  if (threshold) {
    if (value >= threshold.critical) {
      metricData.threshold_breached = true;
      metricData.anomaly_score = 100;
      metricData.is_anomaly = true;
      
      // Trigger critical alert
      await this.triggerAlert(metricData, 'critical');
    } else if (value >= threshold.warning) {
      metricData.threshold_breached = true;
      metricData.anomaly_score = 75;
      
      // Trigger warning alert
      await this.triggerAlert(metricData, 'warning');
    }
  }
  
  // Check for statistical anomalies (last 24 hours average)
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMetrics = await this.find({
      metricType,
      timestamp: { $gte: oneDayAgo }
    }).limit(100).sort({ timestamp: -1 });
    
    if (recentMetrics.length >= 10) {
      const values = recentMetrics.map(m => m.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length);
      
      // If current value is more than 2 standard deviations from average
      const deviation = Math.abs(value - average) / stdDev;
      if (deviation > 2) {
        metricData.is_anomaly = true;
        metricData.anomaly_score = Math.min(100, deviation * 25);
      }
    }
  } catch (error) {
    console.error('Error checking statistical anomalies:', error);
  }
};

// Static method to trigger alerts
systemMetricSchema.statics.triggerAlert = async function(metricData, severity) {
  try {
    // Check if alert was already sent recently for this metric type
    const recentAlert = await this.findOne({
      metricType: metricData.metricType,
      alert_sent: true,
      timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
    });
    
    if (recentAlert) {
      return; // Don't spam alerts
    }
    
    // Create security alert for system issues
    const SecurityAlert = require('./SecurityAlert');
    await SecurityAlert.createAlert({
      type: 'system_performance_issue',
      severity: severity === 'critical' ? 'critical' : 'high',
      title: `${metricData.metricType} threshold breached`,
      description: `System metric ${metricData.metricType} has reached ${metricData.value}${metricData.unit}, exceeding ${severity} threshold`,
      detectionMethod: 'automatic',
      confidence: 90,
      metadata: {
        metricType: metricData.metricType,
        currentValue: metricData.value,
        unit: metricData.unit,
        threshold: severity,
        hostname: metricData.metadata?.hostname
      }
    });
    
    metricData.alert_sent = true;
    
    console.log(`Alert triggered for ${metricData.metricType}: ${metricData.value}${metricData.unit} (${severity})`);
  } catch (error) {
    console.error('Failed to trigger alert:', error);
  }
};

// Static method to get real-time dashboard data
systemMetricSchema.statics.getDashboardData = async function(timeRange = '1h') {
  const timeRanges = {
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  
  const timeWindow = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['1h']));
  
  // Get latest metrics for each type
  const latestMetrics = await this.aggregate([
    { $match: { timestamp: { $gte: timeWindow } } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$metricType',
        latestValue: { $first: '$value' },
        latestTimestamp: { $first: '$timestamp' },
        unit: { $first: '$unit' },
        average: { $avg: '$value' },
        max: { $max: '$value' },
        min: { $min: '$value' },
        count: { $sum: 1 },
        anomalies: { $sum: { $cond: ['$is_anomaly', 1, 0] } },
        thresholdBreaches: { $sum: { $cond: ['$threshold_breached', 1, 0] } }
      }
    }
  ]);
  
  // Get time series data for key metrics
  const timeSeriesData = await this.aggregate([
    { 
      $match: { 
        timestamp: { $gte: timeWindow },
        metricType: { $in: ['cpu_usage', 'memory_usage', 'response_time', 'error_rate'] }
      }
    },
    {
      $group: {
        _id: {
          metricType: '$metricType',
          time: {
            $dateToString: {
              format: timeRange === '5m' ? '%Y-%m-%d %H:%M' : '%Y-%m-%d %H:00',
              date: '$timestamp'
            }
          }
        },
        averageValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.time': 1 } }
  ]);
  
  // Get system health score
  const healthScore = await this.calculateHealthScore(latestMetrics);
  
  return {
    latestMetrics,
    timeSeriesData,
    healthScore,
    timeRange,
    lastUpdated: new Date()
  };
};

// Static method to calculate system health score
systemMetricSchema.statics.calculateHealthScore = async function(latestMetrics) {
  let score = 100;
  const weights = {
    cpu_usage: 0.25,
    memory_usage: 0.25,
    response_time: 0.20,
    error_rate: 0.15,
    disk_usage: 0.10,
    database_connections: 0.05
  };
  
  for (const metric of latestMetrics) {
    const weight = weights[metric._id] || 0;
    if (weight === 0) continue;
    
    let penalty = 0;
    switch (metric._id) {
      case 'cpu_usage':
      case 'memory_usage':
      case 'disk_usage':
        if (metric.latestValue > 90) penalty = 30;
        else if (metric.latestValue > 70) penalty = 15;
        else if (metric.latestValue > 50) penalty = 5;
        break;
      case 'response_time':
        if (metric.latestValue > 2000) penalty = 25;
        else if (metric.latestValue > 1000) penalty = 10;
        else if (metric.latestValue > 500) penalty = 3;
        break;
      case 'error_rate':
        if (metric.latestValue > 5) penalty = 20;
        else if (metric.latestValue > 2) penalty = 8;
        else if (metric.latestValue > 1) penalty = 3;
        break;
    }
    
    score -= penalty * weight * 100;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Static method to get performance trends
systemMetricSchema.statics.getPerformanceTrends = async function(timeRange = '24h') {
  const timeRanges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const timeWindow = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['24h']));
  
  const trends = await this.aggregate([
    { $match: { timestamp: { $gte: timeWindow } } },
    {
      $group: {
        _id: {
          metricType: '$metricType',
          period: {
            $dateToString: {
              format: timeRange === '1h' ? '%H:%M' : 
                      timeRange === '24h' ? '%H:00' : 
                      timeRange === '7d' ? '%Y-%m-%d' : '%Y-%m',
              date: '$timestamp'
            }
          }
        },
        averageValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
        minValue: { $min: '$value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.period': 1 } }
  ]);
  
  return trends;
};

module.exports = mongoose.model('SystemMetric', systemMetricSchema); 