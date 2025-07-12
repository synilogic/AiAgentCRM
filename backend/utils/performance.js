const { performance } = require('perf_hooks');
const { cacheManager } = require('./cache');
const logger = require('./logger');

class PerformanceService {
  constructor() {
    this.isInitialized = false;
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  // Initialize performance service
  async initialize() {
    try {
      this.isInitialized = true;
      logger.info('Performance service initialized');
    } catch (error) {
      logger.error('Failed to initialize performance service:', error);
      throw error;
    }
  }

  // Start performance measurement
  startTimer(name) {
    const timer = {
      name,
      startTime: performance.now(),
      startDate: new Date()
    };
    
    this.metrics.set(name, timer);
    return timer;
  }

  // End performance measurement
  endTimer(name) {
    const timer = this.metrics.get(name);
    if (!timer) {
      logger.warn(`Timer ${name} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    timer.endTime = endTime;
    timer.duration = duration;
    timer.endDate = new Date();

    // Store metric in cache
    this.storeMetric(name, duration);

    this.metrics.delete(name);
    return timer;
  }

  // Store performance metric
  async storeMetric(name, duration) {
    try {
      const key = `perf:${name}:${new Date().toISOString().split('T')[0]}`;
      const existing = await cacheManager.hgetall(key);
      
      const metrics = {
        count: parseInt(existing.count || 0) + 1,
        total: parseFloat(existing.total || 0) + duration,
        min: Math.min(parseFloat(existing.min || Infinity), duration),
        max: Math.max(parseFloat(existing.max || 0), duration),
        last: duration,
        updated: new Date().toISOString()
      };

      metrics.avg = metrics.total / metrics.count;

      await cacheManager.hset(key, metrics);
      
      // Set TTL for 30 days
      await cacheManager.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      logger.error('Failed to store performance metric:', error);
    }
  }

  // Get performance metrics
  async getMetrics(name, days = 7) {
    try {
      const metrics = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const key = `perf:${name}:${dateStr}`;
        const data = await cacheManager.hgetall(key);
        
        if (data.count) {
          metrics.push({
            date: dateStr,
            count: parseInt(data.count),
            avg: parseFloat(data.avg),
            min: parseFloat(data.min),
            max: parseFloat(data.max),
            total: parseFloat(data.total)
          });
        }
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  // Get system performance stats
  async getSystemStats() {
    try {
      const stats = {
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        activeTimers: this.metrics.size,
        timestamp: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get system stats:', error);
      return null;
    }
  }

  // Performance middleware
  performanceMiddleware() {
    return (req, res, next) => {
      const timerName = `${req.method}_${req.path}`;
      const timer = this.startTimer(timerName);

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(...args) {
        this.endTimer(timerName);
        originalEnd.apply(this, args);
      }.bind(this);

      next();
    };
  }

  // Database query performance monitoring
  async monitorQuery(query, duration) {
    try {
      const queryType = this.getQueryType(query);
      const metricName = `db_${queryType}`;
      
      await this.storeMetric(metricName, duration);
      
      // Log slow queries
      if (duration > 1000) { // 1 second threshold
        logger.warn(`Slow query detected: ${queryType} took ${duration}ms`);
      }
    } catch (error) {
      logger.error('Failed to monitor query:', error);
    }
  }

  // Get query type from MongoDB query
  getQueryType(query) {
    if (typeof query === 'string') {
      return 'raw';
    }
    
    if (query.operationType) {
      return query.operationType;
    }
    
    if (query.find) return 'find';
    if (query.findOne) return 'findOne';
    if (query.insertOne) return 'insertOne';
    if (query.insertMany) return 'insertMany';
    if (query.updateOne) return 'updateOne';
    if (query.updateMany) return 'updateMany';
    if (query.deleteOne) return 'deleteOne';
    if (query.deleteMany) return 'deleteMany';
    if (query.aggregate) return 'aggregate';
    
    return 'unknown';
  }

  // Monitor external API calls
  async monitorApiCall(service, endpoint, duration, status) {
    try {
      const metricName = `api_${service}_${endpoint}`;
      await this.storeMetric(metricName, duration);
      
      // Track success/failure rates
      const statusKey = `api_status:${service}:${endpoint}:${new Date().toISOString().split('T')[0]}`;
      const statusData = await cacheManager.hgetall(statusKey);
      
      const statusMetrics = {
        total: parseInt(statusData.total || 0) + 1,
        success: parseInt(statusData.success || 0) + (status < 400 ? 1 : 0),
        error: parseInt(statusData.error || 0) + (status >= 400 ? 1 : 0),
        avgDuration: parseFloat(statusData.avgDuration || 0)
      };
      
      statusMetrics.avgDuration = (statusMetrics.avgDuration * (statusMetrics.total - 1) + duration) / statusMetrics.total;
      statusMetrics.successRate = statusMetrics.success / statusMetrics.total;
      
      await cacheManager.hset(statusKey, statusMetrics);
      await cacheManager.expire(statusKey, 30 * 24 * 60 * 60);
      
    } catch (error) {
      logger.error('Failed to monitor API call:', error);
    }
  }

  // Get performance report
  async getPerformanceReport(days = 7) {
    try {
      const report = {
        period: `${days} days`,
        generated: new Date().toISOString(),
        system: await this.getSystemStats(),
        endpoints: {},
        database: {},
        apis: {},
        summary: {}
      };

      // Get endpoint metrics
      const endpointMetrics = await this.getMetrics('GET_/api', days);
      if (endpointMetrics.length > 0) {
        report.endpoints = this.calculateSummary(endpointMetrics);
      }

      // Get database metrics
      const dbMetrics = await this.getMetrics('db_find', days);
      if (dbMetrics.length > 0) {
        report.database = this.calculateSummary(dbMetrics);
      }

      // Get API metrics
      const apiMetrics = await this.getMetrics('api_openai_completions', days);
      if (apiMetrics.length > 0) {
        report.apis = this.calculateSummary(apiMetrics);
      }

      // Calculate overall summary
      report.summary = {
        totalRequests: report.endpoints.count || 0,
        avgResponseTime: report.endpoints.avg || 0,
        slowQueries: report.database.count || 0,
        apiCalls: report.apis.count || 0
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      return null;
    }
  }

  // Calculate summary statistics
  calculateSummary(metrics) {
    if (!metrics || metrics.length === 0) {
      return {};
    }

    const total = metrics.reduce((sum, m) => sum + m.count, 0);
    const avg = metrics.reduce((sum, m) => sum + m.avg * m.count, 0) / total;
    const min = Math.min(...metrics.map(m => m.min));
    const max = Math.max(...metrics.map(m => m.max));

    return {
      count: total,
      avg,
      min,
      max,
      days: metrics.length
    };
  }

  // Performance optimization suggestions
  async getOptimizationSuggestions() {
    try {
      const suggestions = [];
      
      // Check for slow endpoints
      const endpointMetrics = await this.getMetrics('GET_/api', 1);
      if (endpointMetrics.length > 0 && endpointMetrics[0].avg > 500) {
        suggestions.push({
          type: 'slow_endpoint',
          severity: 'medium',
          message: 'API endpoints are responding slowly',
          recommendation: 'Consider implementing caching or database optimization'
        });
      }

      // Check for slow database queries
      const dbMetrics = await this.getMetrics('db_find', 1);
      if (dbMetrics.length > 0 && dbMetrics[0].avg > 100) {
        suggestions.push({
          type: 'slow_queries',
          severity: 'high',
          message: 'Database queries are taking too long',
          recommendation: 'Review and optimize database indexes'
        });
      }

      // Check memory usage
      const systemStats = await this.getSystemStats();
      if (systemStats && systemStats.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
        suggestions.push({
          type: 'high_memory',
          severity: 'medium',
          message: 'High memory usage detected',
          recommendation: 'Consider implementing memory cleanup or scaling'
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Failed to get optimization suggestions:', error);
      return [];
    }
  }

  // Clear old performance data
  async cleanupOldData(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // This would require iterating through all keys in Redis
      // For now, we'll rely on TTL set during storage
      logger.info('Performance data cleanup completed (TTL-based)');
      return { success: true };
    } catch (error) {
      logger.error('Failed to cleanup old performance data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const performanceService = new PerformanceService();

// Export singleton and class
module.exports = {
  performanceService,
  PerformanceService
}; 