const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {}
    };

    // Check MongoDB connection
    try {
      const mongoStatus = mongoose.connection.readyState;
      health.services.mongodb = {
        status: mongoStatus === 1 ? 'connected' : 'disconnected',
        readyState: mongoStatus
      };
    } catch (error) {
      health.services.mongodb = {
        status: 'error',
        error: error.message
      };
    }

    // Check Redis connection
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.disconnect();
      
      health.services.redis = {
        status: 'connected'
      };
    } catch (error) {
      health.services.redis = {
        status: 'error',
        error: error.message
      };
    }

    // Check external services
    health.services.external = {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
      email: process.env.EMAIL_SERVICE ? 'configured' : 'not_configured'
    };

    // Check system resources
    health.system = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    // Determine overall health status
    const hasErrors = Object.values(health.services).some(service => 
      service.status === 'error' || service.status === 'disconnected'
    );

    if (hasErrors) {
      health.status = 'degraded';
      res.status(503);
    }

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Database checks
    try {
      const dbStats = await mongoose.connection.db.stats();
      detailedHealth.checks.database = {
        status: 'healthy',
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      };
    } catch (error) {
      detailedHealth.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Redis checks
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await redisClient.connect();
      const redisInfo = await redisClient.info();
      await redisClient.disconnect();
      
      detailedHealth.checks.redis = {
        status: 'healthy',
        info: redisInfo.split('\n').slice(0, 10) // First 10 lines of info
      };
    } catch (error) {
      detailedHealth.checks.redis = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Environment checks
    detailedHealth.checks.environment = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5000,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasRazorpay: !!process.env.RAZORPAY_KEY_ID,
      hasEmail: !!process.env.EMAIL_SERVICE
    };

    // Process checks
    detailedHealth.checks.process = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };

    // Determine overall status
    const unhealthyChecks = Object.values(detailedHealth.checks).filter(
      check => check.status === 'unhealthy'
    );

    if (unhealthyChecks.length > 0) {
      detailedHealth.status = 'unhealthy';
      res.status(503);
    }

    res.json({
      success: true,
      health: detailedHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Detailed health check failed',
      details: error.message
    });
  }
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // Database metrics
    try {
      const dbStats = await mongoose.connection.db.stats();
      metrics.metrics.database = {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        objects: dbStats.objects
      };
    } catch (error) {
      metrics.metrics.database = { error: error.message };
    }

    // Memory metrics
    const memUsage = process.memoryUsage();
    metrics.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };

    // Process metrics
    metrics.metrics.process = {
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid
    };

    // Application metrics
    metrics.metrics.application = {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    };

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Metrics collection failed',
      details: error.message
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    const mongoReady = mongoose.connection.readyState === 1;
    
    // Check if Redis is ready
    let redisReady = false;
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.disconnect();
      redisReady = true;
    } catch (error) {
      redisReady = false;
    }

    const isReady = mongoReady && redisReady;

    if (isReady) {
      res.json({
        success: true,
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        ready: false,
        timestamp: new Date().toISOString(),
        services: {
          mongodb: mongoReady,
          redis: redisReady
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      ready: false,
      error: error.message
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({
    success: true,
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 
