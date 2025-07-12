const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');
const { logger } = require('../utils/logger');

// Import models for health checking
const User = require('../models/User');
const Lead = require('../models/Lead');
const SystemMetric = require('../models/SystemMetric');
const SecurityAlert = require('../models/SecurityAlert');
const ApiKey = require('../models/ApiKey');

class HealthCheckService {
  constructor() {
    this.lastHealthCheck = null;
    this.healthStatus = {
      overall: 'unknown',
      components: {},
      lastChecked: null,
      uptime: 0
    };
    
    this.healthChecks = {
      database: {
        name: 'Database Connection',
        critical: true,
        timeout: 5000
      },
      mongodb: {
        name: 'MongoDB Operations',
        critical: true,
        timeout: 10000
      },
      server: {
        name: 'Server Resources',
        critical: true,
        timeout: 3000
      },
      storage: {
        name: 'Storage & File System',
        critical: false,
        timeout: 5000
      },
      external: {
        name: 'External Services',
        critical: false,
        timeout: 15000
      },
      models: {
        name: 'Data Models',
        critical: true,
        timeout: 8000
      },
      security: {
        name: 'Security Components',
        critical: true,
        timeout: 5000
      },
      performance: {
        name: 'Performance Metrics',
        critical: false,
        timeout: 3000
      }
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = performance.now();
    const timestamp = new Date();
    
    logger.info('🔍 Starting comprehensive health check...');

    const results = {
      timestamp,
      overall: 'healthy',
      components: {},
      summary: {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        failed: 0
      },
      performance: {
        duration: 0,
        startTime: startTime
      }
    };

    // Run all health checks in parallel
    const healthCheckPromises = Object.entries(this.healthChecks).map(async ([key, config]) => {
      try {
        const componentResult = await this.runComponentHealthCheck(key, config);
        results.components[key] = componentResult;
        results.summary.total++;

        // Update summary counts
        switch (componentResult.status) {
          case 'healthy':
            results.summary.healthy++;
            break;
          case 'warning':
            results.summary.warning++;
            break;
          case 'critical':
            results.summary.critical++;
            break;
          case 'failed':
            results.summary.failed++;
            break;
        }

        // Determine overall status
        if (componentResult.status === 'failed' && config.critical) {
          results.overall = 'critical';
        } else if (componentResult.status === 'critical' && results.overall !== 'critical') {
          results.overall = 'degraded';
        } else if (componentResult.status === 'warning' && results.overall === 'healthy') {
          results.overall = 'warning';
        }

      } catch (error) {
        logger.error(`Health check failed for ${key}:`, error);
        results.components[key] = {
          status: 'failed',
          message: `Health check failed: ${error.message}`,
          timestamp,
          error: error.message
        };
        results.summary.total++;
        results.summary.failed++;
        
        if (config.critical) {
          results.overall = 'critical';
        }
      }
    });

    await Promise.all(healthCheckPromises);

    // Calculate total duration
    results.performance.duration = performance.now() - startTime;

    // Store health check results
    this.lastHealthCheck = results;
    this.healthStatus = {
      overall: results.overall,
      components: results.components,
      lastChecked: timestamp,
      uptime: process.uptime()
    };

    logger.info(`✅ Health check completed in ${Math.round(results.performance.duration)}ms - Status: ${results.overall}`);

    // Create health check metric
    await this.recordHealthMetric(results);

    return results;
  }

  /**
   * Run individual component health check
   */
  async runComponentHealthCheck(component, config) {
    const startTime = performance.now();
    
    try {
      let result;
      
      switch (component) {
        case 'database':
          result = await this.checkDatabase();
          break;
        case 'mongodb':
          result = await this.checkMongoDB();
          break;
        case 'server':
          result = await this.checkServerResources();
          break;
        case 'storage':
          result = await this.checkStorage();
          break;
        case 'external':
          result = await this.checkExternalServices();
          break;
        case 'models':
          result = await this.checkDataModels();
          break;
        case 'security':
          result = await this.checkSecurity();
          break;
        case 'performance':
          result = await this.checkPerformance();
          break;
        default:
          throw new Error(`Unknown health check component: ${component}`);
      }

      return {
        ...result,
        name: config.name,
        duration: performance.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        status: 'failed',
        name: config.name,
        message: error.message,
        duration: performance.now() - startTime,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      // Check MongoDB connection state
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (state !== 1) {
        return {
          status: 'critical',
          message: `Database is ${states[state]}`,
          details: { connectionState: state }
        };
      }

      // Test basic connectivity with a ping
      await mongoose.connection.db.admin().ping();

      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          connectionState: 'connected',
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Database connectivity failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check MongoDB operations
   */
  async checkMongoDB() {
    try {
      const startTime = performance.now();
      
      // Test basic CRUD operations
      const testCollection = mongoose.connection.db.collection('health_check_test');
      
      // Insert test document
      const testDoc = { _id: 'health_check', timestamp: new Date() };
      await testCollection.replaceOne({ _id: 'health_check' }, testDoc, { upsert: true });
      
      // Read test document
      const retrieved = await testCollection.findOne({ _id: 'health_check' });
      
      // Delete test document
      await testCollection.deleteOne({ _id: 'health_check' });
      
      const operationTime = performance.now() - startTime;

      // Get database stats
      const dbStats = await mongoose.connection.db.stats();
      const collections = await mongoose.connection.db.listCollections().toArray();

      return {
        status: operationTime > 5000 ? 'warning' : 'healthy',
        message: operationTime > 5000 ? 'MongoDB operations are slow' : 'MongoDB operations are healthy',
        details: {
          operationTime: Math.round(operationTime),
          collections: collections.length,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `MongoDB operations failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check server resources
   */
  async checkServerResources() {
    try {
      const cpuUsage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem()
      };
      
      const memUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100);
      const systemMemUsagePercent = ((systemMem.total - systemMem.free) / systemMem.total) * 100;
      
      // Load averages (Unix-like systems only)
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      
      let status = 'healthy';
      let message = 'Server resources are healthy';
      const warnings = [];

      // Check memory usage
      if (memUsagePercent > 90) {
        status = 'critical';
        warnings.push('High heap memory usage');
      } else if (memUsagePercent > 80) {
        status = 'warning';
        warnings.push('Elevated heap memory usage');
      }

      if (systemMemUsagePercent > 95) {
        status = 'critical';
        warnings.push('Critical system memory usage');
      } else if (systemMemUsagePercent > 85) {
        status = status === 'critical' ? 'critical' : 'warning';
        warnings.push('High system memory usage');
      }

      // Check load average (if available)
      if (loadAvg[0] > cpuCount * 1.5) {
        status = status === 'critical' ? 'critical' : 'warning';
        warnings.push('High system load');
      }

      if (warnings.length > 0) {
        message = `Resource warnings: ${warnings.join(', ')}`;
      }

      return {
        status,
        message,
        details: {
          memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsagePercent: Math.round(memUsagePercent),
            systemUsagePercent: Math.round(systemMemUsagePercent)
          },
          cpu: {
            loadAverage: loadAvg,
            cpuCount,
            uptime: os.uptime()
          },
          process: {
            pid: process.pid,
            uptime: process.uptime(),
            nodeVersion: process.version
          }
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Server resource check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check storage and file system
   */
  async checkStorage() {
    try {
      const checks = [];
      const directories = ['./logs', './temp', './uploads'];
      
      for (const dir of directories) {
        try {
          await fs.access(dir);
          const stats = await fs.stat(dir);
          checks.push({
            directory: dir,
            accessible: true,
            isDirectory: stats.isDirectory(),
            lastModified: stats.mtime
          });
        } catch (error) {
          checks.push({
            directory: dir,
            accessible: false,
            error: error.message
          });
        }
      }

      const inaccessible = checks.filter(check => !check.accessible);
      const status = inaccessible.length > 0 ? 'warning' : 'healthy';
      const message = inaccessible.length > 0 
        ? `Some directories are inaccessible: ${inaccessible.map(c => c.directory).join(', ')}`
        : 'All storage directories are accessible';

      return {
        status,
        message,
        details: {
          checks,
          accessibleCount: checks.filter(c => c.accessible).length,
          totalCount: checks.length
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Storage check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check external services
   */
  async checkExternalServices() {
    try {
      const services = [];
      
      // Check if we can make HTTP requests
      try {
        const response = await axios.get('https://httpbin.org/status/200', { timeout: 5000 });
        services.push({
          name: 'HTTP Connectivity',
          status: response.status === 200 ? 'healthy' : 'warning',
          responseTime: response.config.timeout
        });
      } catch (error) {
        services.push({
          name: 'HTTP Connectivity',
          status: 'warning',
          error: error.message
        });
      }

      // Add checks for other external services if configured
      // Example: OpenAI, WhatsApp, Email services, etc.
      
      const failedServices = services.filter(s => s.status === 'failed');
      const warningServices = services.filter(s => s.status === 'warning');
      
      let status = 'healthy';
      let message = 'External services are healthy';
      
      if (failedServices.length > 0) {
        status = 'warning'; // External services are not critical by default
        message = `Some external services failed: ${failedServices.map(s => s.name).join(', ')}`;
      } else if (warningServices.length > 0) {
        status = 'warning';
        message = `Some external services have warnings: ${warningServices.map(s => s.name).join(', ')}`;
      }

      return {
        status,
        message,
        details: {
          services,
          healthy: services.filter(s => s.status === 'healthy').length,
          warning: warningServices.length,
          failed: failedServices.length
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `External services check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check data models
   */
  async checkDataModels() {
    try {
      const modelChecks = [];
      
      // Test basic operations on key models
      const models = [
        { model: User, name: 'Users' },
        { model: Lead, name: 'Leads' },
        { model: SystemMetric, name: 'System Metrics' },
        { model: SecurityAlert, name: 'Security Alerts' },
        { model: ApiKey, name: 'API Keys' }
      ];

      for (const { model, name } of models) {
        try {
          const startTime = performance.now();
          const count = await model.countDocuments();
          const queryTime = performance.now() - startTime;
          
          modelChecks.push({
            name,
            status: queryTime > 3000 ? 'warning' : 'healthy',
            count,
            queryTime: Math.round(queryTime)
          });
        } catch (error) {
          modelChecks.push({
            name,
            status: 'failed',
            error: error.message
          });
        }
      }

      const failed = modelChecks.filter(check => check.status === 'failed');
      const warnings = modelChecks.filter(check => check.status === 'warning');
      
      let status = 'healthy';
      let message = 'All data models are healthy';
      
      if (failed.length > 0) {
        status = 'critical';
        message = `Model operations failed: ${failed.map(c => c.name).join(', ')}`;
      } else if (warnings.length > 0) {
        status = 'warning';
        message = `Some models are slow: ${warnings.map(c => c.name).join(', ')}`;
      }

      return {
        status,
        message,
        details: {
          models: modelChecks,
          healthy: modelChecks.filter(c => c.status === 'healthy').length,
          warning: warnings.length,
          failed: failed.length
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Data model check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check security components
   */
  async checkSecurity() {
    try {
      const securityChecks = [];
      
      // Check if JWT secret is set
      securityChecks.push({
        name: 'JWT Secret',
        status: process.env.JWT_SECRET ? 'healthy' : 'critical',
        message: process.env.JWT_SECRET ? 'JWT secret is configured' : 'JWT secret is missing'
      });

      // Check if database has recent security alerts
      const recentAlerts = await SecurityAlert.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        severity: { $in: ['high', 'critical'] }
      });

      securityChecks.push({
        name: 'Recent Security Alerts',
        status: recentAlerts > 10 ? 'warning' : 'healthy',
        message: recentAlerts > 10 ? `${recentAlerts} high/critical alerts in last 24h` : 'No significant security alerts',
        count: recentAlerts
      });

      // Check if there are active API keys
      const activeApiKeys = await ApiKey.countDocuments({ status: 'active' });
      securityChecks.push({
        name: 'API Keys',
        status: 'healthy',
        message: `${activeApiKeys} active API keys`,
        count: activeApiKeys
      });

      const criticalIssues = securityChecks.filter(check => check.status === 'critical');
      const warnings = securityChecks.filter(check => check.status === 'warning');
      
      let status = 'healthy';
      let message = 'Security components are healthy';
      
      if (criticalIssues.length > 0) {
        status = 'critical';
        message = `Critical security issues: ${criticalIssues.map(c => c.name).join(', ')}`;
      } else if (warnings.length > 0) {
        status = 'warning';
        message = `Security warnings: ${warnings.map(c => c.name).join(', ')}`;
      }

      return {
        status,
        message,
        details: {
          checks: securityChecks,
          healthy: securityChecks.filter(c => c.status === 'healthy').length,
          warning: warnings.length,
          critical: criticalIssues.length
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Security check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    try {
      const startTime = performance.now();
      
      // Test database query performance
      const dbStartTime = performance.now();
      await User.findOne().limit(1);
      const dbQueryTime = performance.now() - dbStartTime;

      // Get recent system metrics
      const recentMetrics = await SystemMetric.find({
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }).sort({ timestamp: -1 }).limit(10);

      const performanceMetrics = {
        databaseQueryTime: Math.round(dbQueryTime),
        systemMetricsCount: recentMetrics.length,
        processUptime: Math.round(process.uptime()),
        systemUptime: Math.round(os.uptime())
      };

      let status = 'healthy';
      let message = 'Performance metrics are healthy';
      const warnings = [];

      if (dbQueryTime > 1000) {
        status = 'warning';
        warnings.push('Slow database queries');
      }

      if (recentMetrics.length === 0) {
        status = status === 'warning' ? 'warning' : 'warning';
        warnings.push('No recent system metrics');
      }

      if (warnings.length > 0) {
        message = `Performance warnings: ${warnings.join(', ')}`;
      }

      return {
        status,
        message,
        details: performanceMetrics
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Performance check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Record health check as system metric
   */
  async recordHealthMetric(results) {
    try {
      const healthScore = (results.summary.healthy / results.summary.total) * 100;
      
      await SystemMetric.create({
        type: 'system_health_score',
        value: Math.round(healthScore),
        unit: 'percentage',
        timestamp: results.timestamp,
        status: results.overall,
        metadata: {
          summary: results.summary,
          duration: Math.round(results.performance.duration),
          components: Object.keys(results.components).map(key => ({
            name: key,
            status: results.components[key].status
          }))
        }
      });
    } catch (error) {
      logger.warn('Failed to record health metric:', error);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      ...this.healthStatus,
      lastHealthCheck: this.lastHealthCheck
    };
  }

  /**
   * Get detailed health report
   */
  async getDetailedHealthReport() {
    if (!this.lastHealthCheck || 
        Date.now() - this.lastHealthCheck.timestamp.getTime() > 5 * 60 * 1000) {
      // Refresh if older than 5 minutes
      await this.performHealthCheck();
    }

    return this.lastHealthCheck;
  }
}

// Export singleton instance
module.exports = new HealthCheckService(); 