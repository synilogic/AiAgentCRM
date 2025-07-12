const admin = require('firebase-admin');
const { cacheManager } = require('./cache');
const { notificationManager } = require('./notifications');
const logger = require('./logger');

class MobileService {
  constructor() {
    this.isInitialized = false;
    this.firebaseAdmin = null;
  }

  // Initialize mobile service
  async initialize() {
    try {
      // Initialize Firebase Admin if not already done
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        this.firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      } else {
        this.firebaseAdmin = admin.app();
      }

      this.isInitialized = true;
      logger.info('Mobile service initialized');
    } catch (error) {
      logger.error('Failed to initialize mobile service:', error);
      throw error;
    }
  }

  // Register mobile device
  async registerDevice(userId, deviceData) {
    try {
      const { deviceToken, deviceId, platform, appVersion, deviceModel } = deviceData;

      const device = {
        userId,
        deviceToken,
        deviceId,
        platform,
        appVersion,
        deviceModel,
        registeredAt: new Date(),
        lastSeen: new Date(),
        isActive: true
      };

      // Store device info in cache
      await cacheManager.hset(`mobile_devices:${userId}`, deviceId, JSON.stringify(device));

      // Update user's device tokens
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        $addToSet: { 
          mobileDevices: {
            deviceId,
            deviceToken,
            platform,
            appVersion,
            deviceModel,
            registeredAt: new Date()
          }
        }
      });

      logger.info(`Mobile device registered: ${deviceId} for user ${userId}`);
      return { success: true, deviceId };
    } catch (error) {
      logger.error(`Failed to register mobile device for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Unregister mobile device
  async unregisterDevice(userId, deviceId) {
    try {
      // Remove device from cache
      await cacheManager.hdel(`mobile_devices:${userId}`, deviceId);

      // Remove device from user's devices
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        $pull: { mobileDevices: { deviceId } }
      });

      logger.info(`Mobile device unregistered: ${deviceId} for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to unregister mobile device for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Update device status
  async updateDeviceStatus(userId, deviceId, status) {
    try {
      const deviceData = await cacheManager.hget(`mobile_devices:${userId}`, deviceId);
      if (deviceData) {
        const device = JSON.parse(deviceData);
        device.lastSeen = new Date();
        device.isActive = status === 'active';
        
        await cacheManager.hset(`mobile_devices:${userId}`, deviceId, JSON.stringify(device));
      }

      // Update user's device status
      const User = require('../models/User');
      await User.updateOne(
        { _id: userId, 'mobileDevices.deviceId': deviceId },
        {
          $set: {
            'mobileDevices.$.lastSeen': new Date(),
            'mobileDevices.$.isActive': status === 'active'
          }
        }
      );

      logger.debug(`Device status updated: ${deviceId} - ${status}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to update device status for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification to mobile device
  async sendMobilePushNotification(userId, deviceId, notification) {
    try {
      const deviceData = await cacheManager.hget(`mobile_devices:${userId}`, deviceId);
      if (!deviceData) {
        throw new Error('Device not found');
      }

      const device = JSON.parse(deviceData);
      
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...notification.data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          screen: notification.screen || 'home',
          id: notification.id || Date.now().toString()
        },
        token: device.deviceToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'ai_agent_crm',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      
      logger.info(`Mobile push notification sent to ${deviceId}: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      logger.error(`Failed to send mobile push notification to ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification to all user devices
  async sendMobilePushToUser(userId, notification) {
    try {
      const devices = await this.getUserDevices(userId);
      const results = [];

      for (const device of devices) {
        if (device.isActive) {
          const result = await this.sendMobilePushNotification(userId, device.deviceId, notification);
          results.push({ deviceId: device.deviceId, ...result });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`Mobile push sent to ${successCount}/${devices.length} devices for user ${userId}`);
      
      return { success: true, results, successCount };
    } catch (error) {
      logger.error(`Failed to send mobile push to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get user's mobile devices
  async getUserDevices(userId) {
    try {
      const devices = await cacheManager.hgetall(`mobile_devices:${userId}`);
      return Object.values(devices).map(device => JSON.parse(device));
    } catch (error) {
      logger.error(`Failed to get devices for user ${userId}:`, error);
      return [];
    }
  }

  // Send lead notification to mobile
  async sendLeadNotification(userId, leadData) {
    try {
      const notification = {
        title: 'New Lead Alert!',
        body: `You have a new lead: ${leadData.name}`,
        screen: 'leads',
        data: {
          type: 'lead',
          leadId: leadData._id.toString(),
          leadName: leadData.name,
          leadSource: leadData.source
        }
      };

      return await this.sendMobilePushToUser(userId, notification);
    } catch (error) {
      logger.error(`Failed to send lead notification to mobile for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send message notification to mobile
  async sendMessageNotification(userId, messageData) {
    try {
      const notification = {
        title: 'New Message',
        body: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
        screen: 'messages',
        data: {
          type: 'message',
          messageId: messageData._id.toString(),
          from: messageData.from,
          roomId: messageData.roomId
        }
      };

      return await this.sendMobilePushToUser(userId, notification);
    } catch (error) {
      logger.error(`Failed to send message notification to mobile for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send payment notification to mobile
  async sendPaymentNotification(userId, paymentData) {
    try {
      const notification = {
        title: 'Payment Update',
        body: `Payment ${paymentData.status}: $${paymentData.amount}`,
        screen: 'payments',
        data: {
          type: 'payment',
          paymentId: paymentData._id.toString(),
          status: paymentData.status,
          amount: paymentData.amount
        }
      };

      return await this.sendMobilePushToUser(userId, notification);
    } catch (error) {
      logger.error(`Failed to send payment notification to mobile for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send system notification to mobile
  async sendSystemNotification(userId, systemData) {
    try {
      const notification = {
        title: systemData.title,
        body: systemData.message,
        screen: systemData.screen || 'home',
        data: {
          type: 'system',
          ...systemData.data
        }
      };

      return await this.sendMobilePushToUser(userId, notification);
    } catch (error) {
      logger.error(`Failed to send system notification to mobile for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get mobile app statistics
  async getMobileStats(userId) {
    try {
      const devices = await this.getUserDevices(userId);
      const User = require('../models/User');
      const user = await User.findById(userId).select('mobileDevices');

      const stats = {
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.isActive).length,
        platforms: devices.reduce((acc, device) => {
          acc[device.platform] = (acc[device.platform] || 0) + 1;
          return acc;
        }, {}),
        appVersions: devices.reduce((acc, device) => {
          acc[device.appVersion] = (acc[device.appVersion] || 0) + 1;
          return acc;
        }, {}),
        lastSeen: devices.length > 0 ? 
          Math.max(...devices.map(d => new Date(d.lastSeen).getTime())) : null
      };

      return { success: true, stats };
    } catch (error) {
      logger.error(`Failed to get mobile stats for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Clean up inactive devices
  async cleanupInactiveDevices() {
    try {
      const User = require('../models/User');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days

      const result = await User.updateMany(
        { 'mobileDevices.lastSeen': { $lt: cutoffDate } },
        { $set: { 'mobileDevices.$.isActive': false } }
      );

      logger.info(`Cleaned up ${result.modifiedCount} inactive mobile devices`);
      return { success: true, cleanedCount: result.modifiedCount };
    } catch (error) {
      logger.error('Failed to cleanup inactive devices:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate mobile app version
  async validateAppVersion(platform, version) {
    try {
      const minVersions = {
        android: process.env.MIN_ANDROID_VERSION || '1.0.0',
        ios: process.env.MIN_IOS_VERSION || '1.0.0'
      };

      const minVersion = minVersions[platform];
      if (!minVersion) {
        return { success: false, error: 'Unsupported platform' };
      }

      const isValid = this.compareVersions(version, minVersion) >= 0;
      
      return {
        success: true,
        isValid,
        currentVersion: version,
        minVersion,
        updateRequired: !isValid
      };
    } catch (error) {
      logger.error('Failed to validate app version:', error);
      return { success: false, error: error.message };
    }
  }

  // Compare version strings
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  // Get mobile app configuration
  async getMobileConfig() {
    try {
      const config = {
        features: {
          pushNotifications: true,
          realTimeChat: true,
          leadManagement: true,
          analytics: true,
          payments: true
        },
        api: {
          baseUrl: process.env.API_BASE_URL || 'https://api.aiagentcrm.com',
          version: 'v1'
        },
        notifications: {
          channels: ['push', 'in_app'],
          categories: ['leads', 'messages', 'payments', 'system']
        },
        limits: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxImageSize: 5 * 1024 * 1024, // 5MB
          maxMessageLength: 5000
        }
      };

      return { success: true, config };
    } catch (error) {
      logger.error('Failed to get mobile config:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle mobile app crash report
  async handleCrashReport(userId, crashData) {
    try {
      const { deviceId, platform, appVersion, error, stackTrace, timestamp } = crashData;

      // Log crash report
      logger.error('Mobile app crash report:', {
        userId,
        deviceId,
        platform,
        appVersion,
        error,
        stackTrace,
        timestamp
      });

      // Store crash report
      const CrashReport = require('../models/CrashReport');
      const crashReport = new CrashReport({
        user: userId,
        deviceId,
        platform,
        appVersion,
        error,
        stackTrace,
        timestamp: new Date(timestamp)
      });

      await crashReport.save();

      // Update device status
      await this.updateDeviceStatus(userId, deviceId, 'error');

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle crash report:', error);
      return { success: false, error: error.message };
    }
  }

  // Get mobile app analytics
  async getMobileAnalytics(userId, period = '30d') {
    try {
      const devices = await this.getUserDevices(userId);
      const periods = { '7d': 7, '30d': 30, '90d': 90 };
      const days = periods[period] || 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get device activity
      const activity = devices.map(device => ({
        deviceId: device.deviceId,
        platform: device.platform,
        lastSeen: device.lastSeen,
        isActive: device.isActive,
        daysSinceLastSeen: Math.floor((Date.now() - new Date(device.lastSeen).getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        success: true,
        analytics: {
          totalDevices: devices.length,
          activeDevices: devices.filter(d => d.isActive).length,
          platformDistribution: devices.reduce((acc, d) => {
            acc[d.platform] = (acc[d.platform] || 0) + 1;
            return acc;
          }, {}),
          activity
        }
      };
    } catch (error) {
      logger.error(`Failed to get mobile analytics for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const mobileService = new MobileService();

// Export singleton and class
module.exports = {
  mobileService,
  MobileService
}; 