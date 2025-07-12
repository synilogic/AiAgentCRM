const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

// Import models for cleanup
const SystemMetric = require('../models/SystemMetric');
const SecurityAlert = require('../models/SecurityAlert');
const ApiRequestLog = require('../models/ApiRequestLog');
const BackupJob = require('../models/BackupJob');
const Activity = require('../models/Activity');
const User = require('../models/User');

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
    this.cleanupRules = {
      // System metrics older than 30 days
      systemMetrics: {
        retentionDays: 30,
        batchSize: 1000
      },
      // Security alerts older than 90 days (resolved only)
      securityAlerts: {
        retentionDays: 90,
        batchSize: 500
      },
      // API request logs older than 7 days
      apiLogs: {
        retentionDays: 7,
        batchSize: 2000
      },
      // Backup jobs older than 60 days
      backupJobs: {
        retentionDays: 60,
        batchSize: 100
      },
      // Activity logs older than 180 days
      activityLogs: {
        retentionDays: 180,
        batchSize: 1000
      },
      // Temp files older than 1 day
      tempFiles: {
        retentionHours: 24,
        directories: ['./temp', './uploads/temp']
      },
      // Log files older than 30 days
      logFiles: {
        retentionDays: 30,
        directories: ['./logs']
      },
      // Inactive users (soft delete older than 2 years)
      inactiveUsers: {
        retentionDays: 730,
        batchSize: 50
      }
    };
  }

  /**
   * Start the cleanup service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('CleanupService is already running');
      return;
    }

    try {
      this.isRunning = true;
      
      // Schedule cleanup jobs
      await this.scheduleCleanupJobs();
      
      logger.info('✅ CleanupService started successfully');
    } catch (error) {
      logger.error('Failed to start CleanupService:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the cleanup service
   */
  async stop() {
    try {
      // Cancel all scheduled jobs
      for (const [name, job] of this.scheduledJobs) {
        job.stop();
        logger.debug(`Stopped cleanup job: ${name}`);
      }
      
      this.scheduledJobs.clear();
      this.isRunning = false;
      
      logger.info('✅ CleanupService stopped successfully');
    } catch (error) {
      logger.error('Error stopping CleanupService:', error);
      throw error;
    }
  }

  /**
   * Schedule all cleanup jobs
   */
  async scheduleCleanupJobs() {
    // Daily cleanup at 2 AM
    const dailyCleanup = cron.schedule('0 2 * * *', async () => {
      await this.performDailyCleanup();
    }, { scheduled: false });

    // Weekly deep cleanup on Sunday at 3 AM
    const weeklyCleanup = cron.schedule('0 3 * * 0', async () => {
      await this.performWeeklyCleanup();
    }, { scheduled: false });

    // Hourly temp file cleanup
    const hourlyTempCleanup = cron.schedule('0 * * * *', async () => {
      await this.cleanupTempFiles();
    }, { scheduled: false });

    // Start all jobs
    dailyCleanup.start();
    weeklyCleanup.start();
    hourlyTempCleanup.start();

    this.scheduledJobs.set('daily', dailyCleanup);
    this.scheduledJobs.set('weekly', weeklyCleanup);
    this.scheduledJobs.set('hourly_temp', hourlyTempCleanup);

    logger.info('Cleanup jobs scheduled successfully');
  }

  /**
   * Perform daily cleanup operations
   */
  async performDailyCleanup() {
    const startTime = Date.now();
    logger.info('🧹 Starting daily cleanup...');

    const cleanupStats = {
      systemMetrics: 0,
      apiLogs: 0,
      tempFiles: 0,
      logFiles: 0,
      errors: []
    };

    try {
      // Clean old system metrics
      cleanupStats.systemMetrics = await this.cleanupSystemMetrics();
      
      // Clean old API logs
      cleanupStats.apiLogs = await this.cleanupApiLogs();
      
      // Clean temp files
      cleanupStats.tempFiles = await this.cleanupTempFiles();
      
      // Clean old log files
      cleanupStats.logFiles = await this.cleanupLogFiles();

      const duration = Date.now() - startTime;
      logger.info(`✅ Daily cleanup completed in ${duration}ms`, cleanupStats);

      // Log cleanup activity
      await Activity.create({
        type: 'system_cleanup_daily',
        description: 'Daily automated cleanup completed',
        metadata: {
          duration,
          stats: cleanupStats,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Daily cleanup failed:', error);
      cleanupStats.errors.push(error.message);
    }

    return cleanupStats;
  }

  /**
   * Perform weekly deep cleanup operations
   */
  async performWeeklyCleanup() {
    const startTime = Date.now();
    logger.info('🔄 Starting weekly deep cleanup...');

    const cleanupStats = {
      securityAlerts: 0,
      backupJobs: 0,
      activityLogs: 0,
      inactiveUsers: 0,
      databaseOptimization: 0,
      errors: []
    };

    try {
      // Clean resolved security alerts
      cleanupStats.securityAlerts = await this.cleanupSecurityAlerts();
      
      // Clean old backup jobs
      cleanupStats.backupJobs = await this.cleanupBackupJobs();
      
      // Clean old activity logs
      cleanupStats.activityLogs = await this.cleanupActivityLogs();
      
      // Handle inactive users
      cleanupStats.inactiveUsers = await this.cleanupInactiveUsers();
      
      // Optimize database
      cleanupStats.databaseOptimization = await this.optimizeDatabase();

      const duration = Date.now() - startTime;
      logger.info(`✅ Weekly cleanup completed in ${duration}ms`, cleanupStats);

      // Log cleanup activity
      await Activity.create({
        type: 'system_cleanup_weekly',
        description: 'Weekly automated deep cleanup completed',
        metadata: {
          duration,
          stats: cleanupStats,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Weekly cleanup failed:', error);
      cleanupStats.errors.push(error.message);
    }

    return cleanupStats;
  }

  /**
   * Clean old system metrics
   */
  async cleanupSystemMetrics() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.systemMetrics.retentionDays);

    try {
      const result = await SystemMetric.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.debug(`Cleaned ${result.deletedCount} old system metrics`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning system metrics:', error);
      throw error;
    }
  }

  /**
   * Clean resolved security alerts
   */
  async cleanupSecurityAlerts() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.securityAlerts.retentionDays);

    try {
      const result = await SecurityAlert.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: 'resolved'
      });

      logger.debug(`Cleaned ${result.deletedCount} resolved security alerts`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning security alerts:', error);
      throw error;
    }
  }

  /**
   * Clean old API request logs
   */
  async cleanupApiLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.apiLogs.retentionDays);

    try {
      const result = await ApiRequestLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.debug(`Cleaned ${result.deletedCount} old API request logs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning API logs:', error);
      throw error;
    }
  }

  /**
   * Clean old backup jobs
   */
  async cleanupBackupJobs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.backupJobs.retentionDays);

    try {
      const result = await BackupJob.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['completed', 'failed'] }
      });

      logger.debug(`Cleaned ${result.deletedCount} old backup jobs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning backup jobs:', error);
      throw error;
    }
  }

  /**
   * Clean old activity logs
   */
  async cleanupActivityLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.activityLogs.retentionDays);

    try {
      const result = await Activity.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.debug(`Cleaned ${result.deletedCount} old activity logs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning activity logs:', error);
      throw error;
    }
  }

  /**
   * Clean temporary files
   */
  async cleanupTempFiles() {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.cleanupRules.tempFiles.retentionHours);

    let totalCleaned = 0;

    for (const dir of this.cleanupRules.tempFiles.directories) {
      try {
        const files = await this.getOldFiles(dir, cutoffTime);
        
        for (const file of files) {
          try {
            await fs.unlink(file);
            totalCleaned++;
          } catch (error) {
            logger.warn(`Failed to delete temp file ${file}:`, error.message);
          }
        }
      } catch (error) {
        logger.warn(`Failed to access directory ${dir}:`, error.message);
      }
    }

    if (totalCleaned > 0) {
      logger.debug(`Cleaned ${totalCleaned} temporary files`);
    }

    return totalCleaned;
  }

  /**
   * Clean old log files
   */
  async cleanupLogFiles() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.logFiles.retentionDays);

    let totalCleaned = 0;

    for (const dir of this.cleanupRules.logFiles.directories) {
      try {
        const files = await this.getOldFiles(dir, cutoffDate, '.log');
        
        for (const file of files) {
          try {
            await fs.unlink(file);
            totalCleaned++;
          } catch (error) {
            logger.warn(`Failed to delete log file ${file}:`, error.message);
          }
        }
      } catch (error) {
        logger.warn(`Failed to access log directory ${dir}:`, error.message);
      }
    }

    if (totalCleaned > 0) {
      logger.debug(`Cleaned ${totalCleaned} old log files`);
    }

    return totalCleaned;
  }

  /**
   * Handle inactive users
   */
  async cleanupInactiveUsers() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupRules.inactiveUsers.retentionDays);

    try {
      // Find users who haven't logged in for 2+ years and are not admins
      const inactiveUsers = await User.find({
        lastLoginAt: { $lt: cutoffDate },
        role: { $ne: 'admin' },
        isActive: true
      }).limit(this.cleanupRules.inactiveUsers.batchSize);

      let processed = 0;

      for (const user of inactiveUsers) {
        try {
          // Soft delete - mark as inactive instead of hard delete
          user.isActive = false;
          user.deactivatedAt = new Date();
          user.deactivationReason = 'auto_cleanup_inactive';
          await user.save();
          processed++;
        } catch (error) {
          logger.warn(`Failed to deactivate user ${user._id}:`, error.message);
        }
      }

      if (processed > 0) {
        logger.debug(`Deactivated ${processed} inactive users`);
      }

      return processed;
    } catch (error) {
      logger.error('Error cleaning inactive users:', error);
      throw error;
    }
  }

  /**
   * Optimize database collections
   */
  async optimizeDatabase() {
    let optimizedCollections = 0;

    try {
      const collections = ['systemmetrics', 'apirequestlogs', 'activities', 'securityalerts'];
      
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          
          // Compact collection (if supported)
          await collection.compact();
          
          // Update collection statistics
          await collection.stats();
          
          optimizedCollections++;
        } catch (error) {
          logger.warn(`Failed to optimize collection ${collectionName}:`, error.message);
        }
      }

      if (optimizedCollections > 0) {
        logger.debug(`Optimized ${optimizedCollections} database collections`);
      }

      return optimizedCollections;
    } catch (error) {
      logger.error('Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Get old files from directory
   */
  async getOldFiles(directory, cutoffTime, extension = null) {
    try {
      await fs.access(directory);
      const files = await fs.readdir(directory);
      
      const oldFiles = [];
      
      for (const file of files) {
        if (extension && !file.endsWith(extension)) {
          continue;
        }

        const filePath = path.join(directory, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && stats.mtime < cutoffTime) {
            oldFiles.push(filePath);
          }
        } catch (error) {
          // Skip files we can't access
          continue;
        }
      }
      
      return oldFiles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Manual cleanup trigger
   */
  async runManualCleanup(options = {}) {
    const {
      includeDaily = true,
      includeWeekly = false,
      customRules = null
    } = options;

    logger.info('🧹 Starting manual cleanup...');
    
    const results = {
      daily: null,
      weekly: null,
      custom: null
    };

    try {
      if (includeDaily) {
        results.daily = await this.performDailyCleanup();
      }

      if (includeWeekly) {
        results.weekly = await this.performWeeklyCleanup();
      }

      if (customRules) {
        results.custom = await this.runCustomCleanup(customRules);
      }

      logger.info('✅ Manual cleanup completed', results);
      
      return results;
    } catch (error) {
      logger.error('Manual cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Run custom cleanup with specific rules
   */
  async runCustomCleanup(rules) {
    const results = {};

    for (const [operation, config] of Object.entries(rules)) {
      try {
        switch (operation) {
          case 'systemMetrics':
            this.cleanupRules.systemMetrics = { ...this.cleanupRules.systemMetrics, ...config };
            results.systemMetrics = await this.cleanupSystemMetrics();
            break;
          case 'apiLogs':
            this.cleanupRules.apiLogs = { ...this.cleanupRules.apiLogs, ...config };
            results.apiLogs = await this.cleanupApiLogs();
            break;
          case 'tempFiles':
            this.cleanupRules.tempFiles = { ...this.cleanupRules.tempFiles, ...config };
            results.tempFiles = await this.cleanupTempFiles();
            break;
          default:
            logger.warn(`Unknown cleanup operation: ${operation}`);
        }
      } catch (error) {
        logger.error(`Custom cleanup operation ${operation} failed:`, error);
        results[operation] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        systemMetricsCount,
        apiLogsCount,
        securityAlertsCount,
        backupJobsCount,
        activityLogsCount,
        recentCleanupActivities
      ] = await Promise.all([
        SystemMetric.countDocuments(),
        ApiRequestLog.countDocuments(),
        SecurityAlert.countDocuments(),
        BackupJob.countDocuments(),
        Activity.countDocuments(),
        Activity.find({
          type: { $regex: /cleanup/ },
          createdAt: { $gte: last7d }
        }).sort({ createdAt: -1 }).limit(10)
      ]);

      return {
        currentCounts: {
          systemMetrics: systemMetricsCount,
          apiLogs: apiLogsCount,
          securityAlerts: securityAlertsCount,
          backupJobs: backupJobsCount,
          activityLogs: activityLogsCount
        },
        cleanupRules: this.cleanupRules,
        isRunning: this.isRunning,
        scheduledJobs: Array.from(this.scheduledJobs.keys()),
        recentActivities: recentCleanupActivities
      };
    } catch (error) {
      logger.error('Error getting cleanup stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new CleanupService(); 