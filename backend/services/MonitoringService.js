const os = require('os');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const SystemMetric = require('../models/SystemMetric');
const mongoose = require('mongoose');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.intervals = new Map();
    this.metrics = new Map();
    this.alertThresholds = new Map();
    
    // Initialize default thresholds
    this.initializeThresholds();
  }

  initializeThresholds() {
    this.alertThresholds.set('cpu_usage', { warning: 70, critical: 90 });
    this.alertThresholds.set('memory_usage', { warning: 80, critical: 95 });
    this.alertThresholds.set('disk_usage', { warning: 85, critical: 95 });
    this.alertThresholds.set('response_time', { warning: 1000, critical: 5000 });
    this.alertThresholds.set('error_rate', { warning: 5, critical: 10 });
    this.alertThresholds.set('database_connections', { warning: 80, critical: 95 });
  }

  // Start monitoring service
  async start() {
    if (this.isRunning) {
      console.log('Monitoring service is already running');
      return;
    }

    console.log('Starting monitoring service...');
    this.isRunning = true;

    // Collect different metrics at different intervals
    this.intervals.set('system', setInterval(() => this.collectSystemMetrics(), 30000)); // Every 30 seconds
    this.intervals.set('memory', setInterval(() => this.collectMemoryMetrics(), 15000)); // Every 15 seconds
    this.intervals.set('database', setInterval(() => this.collectDatabaseMetrics(), 60000)); // Every minute
    this.intervals.set('application', setInterval(() => this.collectApplicationMetrics(), 45000)); // Every 45 seconds
    this.intervals.set('disk', setInterval(() => this.collectDiskMetrics(), 120000)); // Every 2 minutes

    // Start immediate collection
    this.collectAllMetrics();

    console.log('Monitoring service started successfully');
  }

  // Stop monitoring service
  stop() {
    if (!this.isRunning) {
      console.log('Monitoring service is not running');
      return;
    }

    console.log('Stopping monitoring service...');
    this.isRunning = false;

    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped ${name} metrics collection`);
    }
    
    this.intervals.clear();
    console.log('Monitoring service stopped');
  }

  // Collect all metrics once
  async collectAllMetrics() {
    try {
      await Promise.all([
        this.collectSystemMetrics(),
        this.collectMemoryMetrics(),
        this.collectDatabaseMetrics(),
        this.collectApplicationMetrics(),
        this.collectDiskMetrics()
      ]);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  // Collect CPU and system metrics
  async collectSystemMetrics() {
    try {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      
      // Calculate CPU usage
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - Math.round(100 * idle / total);

      await SystemMetric.recordMetric({
        metricType: 'cpu_usage',
        value: cpuUsage,
        unit: 'percentage',
        metadata: {
          cpu_cores: cpus.length,
          load_average: loadAvg,
          architecture: os.arch(),
          platform: os.platform()
        }
      });

      // Check thresholds and emit events
      this.checkThresholds('cpu_usage', cpuUsage, {
        title: 'High CPU Usage',
        description: `CPU usage is at ${cpuUsage}%`,
        metadata: { cpu_cores: cpus.length, load_average: loadAvg }
      });

      // Record load average
      await SystemMetric.recordMetric({
        metricType: 'system_load',
        value: loadAvg[0], // 1-minute load average
        unit: 'count',
        metadata: {
          load_1m: loadAvg[0],
          load_5m: loadAvg[1],
          load_15m: loadAvg[2],
          cpu_cores: cpus.length
        }
      });

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  // Collect memory metrics
  async collectMemoryMetrics() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsage = Math.round((usedMem / totalMem) * 100);

      await SystemMetric.recordMetric({
        metricType: 'memory_usage',
        value: memoryUsage,
        unit: 'percentage',
        metadata: {
          total_memory: totalMem,
          free_memory: freeMem,
          used_memory: usedMem
        }
      });

      // Check thresholds and emit events
      this.checkThresholds('memory_usage', memoryUsage, {
        title: 'High Memory Usage',
        description: `Memory usage is at ${memoryUsage}%`,
        metadata: { total_memory: totalMem, used_memory: usedMem }
      });

      // Process memory usage
      const processMemory = process.memoryUsage();
      const heapUsage = Math.round((processMemory.heapUsed / processMemory.heapTotal) * 100);

      await SystemMetric.recordMetric({
        metricType: 'heap_usage',
        value: heapUsage,
        unit: 'percentage',
        metadata: {
          heap_used: processMemory.heapUsed,
          heap_total: processMemory.heapTotal,
          heap_limit: processMemory.heapTotal,
          external_memory: processMemory.external,
          rss: processMemory.rss
        }
      });

    } catch (error) {
      console.error('Error collecting memory metrics:', error);
    }
  }

  // Collect database metrics
  async collectDatabaseMetrics() {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbStats = await mongoose.connection.db.stats();
        const connectionCount = mongoose.connections.length;

        await SystemMetric.recordMetric({
          metricType: 'database_connections',
          value: connectionCount,
          unit: 'count',
          metadata: {
            active_connections: connectionCount,
            db_size: dbStats.dataSize,
            index_size: dbStats.indexSize,
            collections: dbStats.collections,
            objects: dbStats.objects
          }
        });

        // Database size metrics
        const dbSizeGB = dbStats.dataSize / (1024 * 1024 * 1024);
        await SystemMetric.recordMetric({
          metricType: 'database_size',
          value: dbSizeGB,
          unit: 'gb',
          metadata: {
            data_size: dbStats.dataSize,
            storage_size: dbStats.storageSize,
            index_size: dbStats.indexSize,
            avg_obj_size: dbStats.avgObjSize
          }
        });
      }
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  }

  // Collect application metrics
  async collectApplicationMetrics() {
    try {
      // Process uptime
      const uptime = process.uptime();
      await SystemMetric.recordMetric({
        metricType: 'process_uptime',
        value: uptime,
        unit: 'milliseconds',
        metadata: {
          uptime_hours: uptime / 3600,
          pid: process.pid,
          version: process.version
        }
      });

      // Event loop lag (approximate)
      const start = Date.now();
      setImmediate(() => {
        const lag = Date.now() - start;
        SystemMetric.recordMetric({
          metricType: 'event_loop_lag',
          value: lag,
          unit: 'milliseconds',
          metadata: {
            measured_at: new Date()
          }
        }).catch(err => console.error('Error recording event loop lag:', err));
      });

      // Active handles and requests
      const handles = process._getActiveHandles();
      const requests = process._getActiveRequests();

      await SystemMetric.recordMetric({
        metricType: 'active_handles',
        value: handles.length,
        unit: 'count',
        metadata: {
          active_requests: requests.length,
          handle_types: handles.map(h => h.constructor.name).reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Error collecting application metrics:', error);
    }
  }

  // Collect disk metrics
  async collectDiskMetrics() {
    try {
      // Get disk usage for the current directory
      const stats = await this.getDiskUsage(process.cwd());
      
      if (stats) {
        const usagePercent = Math.round(((stats.total - stats.free) / stats.total) * 100);
        
        await SystemMetric.recordMetric({
          metricType: 'disk_usage',
          value: usagePercent,
          unit: 'percentage',
          metadata: {
            disk_total: stats.total,
            disk_free: stats.free,
            disk_used: stats.total - stats.free,
            path: process.cwd()
          }
        });
      }
    } catch (error) {
      console.error('Error collecting disk metrics:', error);
    }
  }

  // Get disk usage statistics
  async getDiskUsage(directory) {
    return new Promise((resolve) => {
      try {
        fs.statvfs(directory, (err, stats) => {
          if (err) {
            // Fallback for systems without statvfs
            resolve(this.getDiskUsageFallback(directory));
          } else {
            resolve({
              total: stats.blocks * stats.bavail,
              free: stats.bavail * stats.bsize
            });
          }
        });
      } catch (error) {
        resolve(this.getDiskUsageFallback(directory));
      }
    });
  }

  // Fallback disk usage method
  getDiskUsageFallback(directory) {
    try {
      const stats = fs.statSync(directory);
      // This is a very rough approximation
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB assumption
        free: 50 * 1024 * 1024 * 1024    // 50GB free assumption
      };
    } catch (error) {
      return null;
    }
  }

  // Get current metrics snapshot
  async getMetricsSnapshot() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const metrics = await SystemMetric.find({
        timestamp: { $gte: fiveMinutesAgo }
      }).sort({ timestamp: -1 });

      const snapshot = {
        timestamp: new Date(),
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          architecture: os.arch(),
          uptime: os.uptime(),
          loadavg: os.loadavg()
        },
        metrics: {},
        alerts: []
      };

      // Group metrics by type and get latest values
      const metricsByType = {};
      metrics.forEach(metric => {
        if (!metricsByType[metric.metricType]) {
          metricsByType[metric.metricType] = [];
        }
        metricsByType[metric.metricType].push(metric);
      });

      for (const [type, typeMetrics] of Object.entries(metricsByType)) {
        const latest = typeMetrics[0]; // Already sorted by timestamp desc
        snapshot.metrics[type] = {
          value: latest.value,
          unit: latest.unit,
          timestamp: latest.timestamp,
          isAnomaly: latest.is_anomaly,
          thresholdBreached: latest.threshold_breached
        };

        // Check for alerts
        if (latest.threshold_breached && !latest.alert_sent) {
          snapshot.alerts.push({
            type,
            value: latest.value,
            unit: latest.unit,
            severity: latest.anomaly_score > 90 ? 'critical' : 'warning',
            timestamp: latest.timestamp
          });
        }
      }

      return snapshot;
    } catch (error) {
      console.error('Error getting metrics snapshot:', error);
      return null;
    }
  }

  // Get system health status
  async getHealthStatus() {
    try {
      const snapshot = await this.getMetricsSnapshot();
      if (!snapshot) return { status: 'unknown', score: 0 };

      let score = 100;
      let status = 'healthy';
      const issues = [];

      // Check critical metrics
      const criticalMetrics = ['cpu_usage', 'memory_usage', 'disk_usage'];
      
      for (const metricType of criticalMetrics) {
        const metric = snapshot.metrics[metricType];
        if (metric) {
          const threshold = this.alertThresholds.get(metricType);
          if (threshold) {
            if (metric.value >= threshold.critical) {
              score -= 30;
              status = 'critical';
              issues.push(`${metricType} is at ${metric.value}% (critical threshold: ${threshold.critical}%)`);
            } else if (metric.value >= threshold.warning) {
              score -= 15;
              if (status === 'healthy') status = 'warning';
              issues.push(`${metricType} is at ${metric.value}% (warning threshold: ${threshold.warning}%)`);
            }
          }
        }
      }

      // Check for anomalies
      const anomalies = Object.values(snapshot.metrics).filter(m => m.isAnomaly);
      if (anomalies.length > 0) {
        score -= anomalies.length * 5;
        if (status === 'healthy') status = 'warning';
        issues.push(`${anomalies.length} metrics showing anomalous behavior`);
      }

      score = Math.max(0, score);

      return {
        status,
        score,
        issues,
        metricsCount: Object.keys(snapshot.metrics).length,
        alertCount: snapshot.alerts.length,
        lastUpdated: snapshot.timestamp
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return { status: 'error', score: 0, issues: ['Failed to retrieve health status'] };
    }
  }

  // Update alert thresholds
  updateThresholds(newThresholds) {
    for (const [metric, thresholds] of Object.entries(newThresholds)) {
      this.alertThresholds.set(metric, thresholds);
    }
    console.log('Alert thresholds updated:', newThresholds);
  }

  // Get performance report
  async getPerformanceReport(timeRange = '24h') {
    try {
      const dashboardData = await SystemMetric.getDashboardData(timeRange);
      const healthStatus = await this.getHealthStatus();
      const trends = await SystemMetric.getPerformanceTrends(timeRange);

      return {
        ...dashboardData,
        healthStatus,
        trends,
        recommendations: this.generateRecommendations(dashboardData, healthStatus)
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      return null;
    }
  }

  // Generate performance recommendations
  generateRecommendations(dashboardData, healthStatus) {
    const recommendations = [];

    // Analyze metrics and suggest improvements
    for (const metric of dashboardData.latestMetrics) {
      switch (metric._id) {
        case 'cpu_usage':
          if (metric.latestValue > 80) {
            recommendations.push({
              type: 'performance',
              priority: 'high',
              title: 'High CPU Usage Detected',
              description: 'Consider optimizing CPU-intensive operations or scaling horizontally',
              metric: 'cpu_usage',
              currentValue: metric.latestValue
            });
          }
          break;
        case 'memory_usage':
          if (metric.latestValue > 85) {
            recommendations.push({
              type: 'performance',
              priority: 'high',
              title: 'High Memory Usage',
              description: 'Review memory leaks and consider increasing available memory',
              metric: 'memory_usage',
              currentValue: metric.latestValue
            });
          }
          break;
        case 'response_time':
          if (metric.latestValue > 1000) {
            recommendations.push({
              type: 'performance',
              priority: 'medium',
              title: 'Slow Response Times',
              description: 'Optimize database queries and implement caching strategies',
              metric: 'response_time',
              currentValue: metric.latestValue
            });
          }
          break;
      }
    }

    // Add general recommendations based on health score
    if (healthStatus.score < 70) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        title: 'Overall System Health Needs Attention',
        description: 'Multiple metrics are showing concerning values. Consider a comprehensive review.',
        score: healthStatus.score
      });
    }

    return recommendations;
  }

  // Check thresholds and emit events
  checkThresholds(metricType, value, alertData) {
    const threshold = this.alertThresholds.get(metricType);
    if (!threshold) return;

    if (value >= threshold.critical) {
      this.emit('metric:critical', {
        type: metricType,
        value,
        threshold: threshold.critical,
        severity: 'critical',
        ...alertData
      });
    } else if (value >= threshold.warning) {
      this.emit('metric:warning', {
        type: metricType,
        value,
        threshold: threshold.warning,
        severity: 'warning',
        ...alertData
      });
    }
  }

  // Emit security alert
  emitSecurityAlert(alert) {
    this.emit('security:alert', alert);
  }

  // Emit backup events
  emitBackupCompleted(backup) {
    this.emit('backup:completed', backup);
  }

  emitBackupFailed(backup) {
    this.emit('backup:failed', backup);
  }

  // Emit system health check
  emitSystemHealthCheck(health) {
    this.emit('system:health_check', health);
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService; 