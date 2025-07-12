const admin = require('firebase-admin');
const twilio = require('twilio');
const logger = require('./logger');

class NotificationManager {
  constructor() {
    this.firebaseAdmin = null;
    this.twilioClient = null;
    this.isInitialized = false;
  }

  // Initialize notification services
  async initialize() {
    try {
      // Initialize Firebase Admin for push notifications
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        this.firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        
        logger.info('Firebase Admin initialized for push notifications');
      }

      // Initialize Twilio for SMS
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        logger.info('Twilio client initialized for SMS');
      }

      this.isInitialized = true;
      logger.info('Notification manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification manager:', error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(userId, title, body, data = {}, options = {}) {
    try {
      if (!this.firebaseAdmin) {
        throw new Error('Firebase Admin not initialized');
      }

      // Get user's FCM token from database
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user || !user.fcmToken) {
        logger.warn(`No FCM token found for user ${userId}`);
        return { success: false, error: 'No FCM token found' };
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: user.fcmToken,
        ...options
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      
      logger.info(`Push notification sent to user ${userId}: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      logger.error(`Failed to send push notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification to multiple users
  async sendBulkPushNotification(userIds, title, body, data = {}, options = {}) {
    try {
      if (!this.firebaseAdmin) {
        throw new Error('Firebase Admin not initialized');
      }

      // Get FCM tokens for all users
      const User = require('../models/User');
      const users = await User.find({ _id: { $in: userIds }, fcmToken: { $exists: true } });
      
      if (users.length === 0) {
        logger.warn('No users with FCM tokens found');
        return { success: false, error: 'No FCM tokens found' };
      }

      const tokens = users.map(user => user.fcmToken);
      
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens,
        ...options
      };

      const response = await this.firebaseAdmin.messaging().sendMulticast(message);
      
      logger.info(`Bulk push notification sent to ${response.successCount}/${tokens.length} users`);
      return { 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Failed to send bulk push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS
  async sendSMS(to, message, from = null) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const twilioFrom = from || process.env.TWILIO_PHONE_NUMBER;
      
      const response = await this.twilioClient.messages.create({
        body: message,
        from: twilioFrom,
        to: to
      });
      
      logger.info(`SMS sent to ${to}: ${response.sid}`);
      return { success: true, messageId: response.sid };
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk SMS
  async sendBulkSMS(recipients, message, from = null) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const twilioFrom = from || process.env.TWILIO_PHONE_NUMBER;
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const response = await this.twilioClient.messages.create({
            body: message,
            from: twilioFrom,
            to: recipient
          });
          
          results.push({ recipient, success: true, messageId: response.sid });
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const successCount = results.filter(r => r.success).length;
      logger.info(`Bulk SMS sent: ${successCount}/${recipients.length} successful`);
      
      return { success: true, results, successCount };
    } catch (error) {
      logger.error('Failed to send bulk SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Create in-app notification
  async createInAppNotification(userId, type, title, message, data = {}) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date()
      });
      
      await notification.save();
      
      logger.info(`In-app notification created for user ${userId}: ${type}`);
      return { success: true, notificationId: notification._id };
    } catch (error) {
      logger.error(`Failed to create in-app notification for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }
      
      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
      return { success: true, notification };
    } catch (error) {
      logger.error(`Failed to mark notification ${notificationId} as read:`, error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const Notification = require('../models/Notification');
      
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );
      
      logger.info(`All notifications marked as read for user ${userId}: ${result.modifiedCount} updated`);
      return { success: true, updatedCount: result.modifiedCount };
    } catch (error) {
      logger.error(`Failed to mark all notifications as read for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const Notification = require('../models/Notification');
      
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      if (unreadOnly) {
        query.read = false;
      }
      
      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query)
      ]);
      
      return {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Failed to get notifications for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const Notification = require('../models/Notification');
      
      const result = await Notification.deleteOne({ _id: notificationId, user: userId });
      
      if (result.deletedCount === 0) {
        return { success: false, error: 'Notification not found' };
      }
      
      logger.info(`Notification ${notificationId} deleted by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete notification ${notificationId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send lead notification
  async sendLeadNotification(userId, leadId, type, data = {}) {
    try {
      const Lead = require('../models/Lead');
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      const notificationData = {
        leadId,
        leadName: lead.name,
        ...data
      };

      // Create in-app notification
      await this.createInAppNotification(
        userId,
        type,
        `New Lead: ${lead.name}`,
        `You have a new lead from ${lead.source}`,
        notificationData
      );

      // Send push notification if enabled
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (user && user.notificationSettings?.push?.leads) {
        await this.sendPushNotification(
          userId,
          `New Lead: ${lead.name}`,
          `You have a new lead from ${lead.source}`,
          notificationData
        );
      }

      // Send SMS if enabled
      if (user && user.notificationSettings?.sms?.leads && user.phone) {
        await this.sendSMS(
          user.phone,
          `New lead: ${lead.name} from ${lead.source}. Check your dashboard for details.`
        );
      }

      logger.info(`Lead notification sent to user ${userId} for lead ${leadId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send lead notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send message notification
  async sendMessageNotification(userId, messageId, type, data = {}) {
    try {
      const Message = require('../models/Message');
      const message = await Message.findById(messageId);
      
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      const notificationData = {
        messageId,
        from: message.from,
        ...data
      };

      // Create in-app notification
      await this.createInAppNotification(
        userId,
        type,
        `New Message from ${message.from}`,
        message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        notificationData
      );

      // Send push notification if enabled
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (user && user.notificationSettings?.push?.messages) {
        await this.sendPushNotification(
          userId,
          `New Message from ${message.from}`,
          message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          notificationData
        );
      }

      logger.info(`Message notification sent to user ${userId} for message ${messageId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send message notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send system notification
  async sendSystemNotification(userId, title, message, type = 'system', data = {}) {
    try {
      // Create in-app notification
      await this.createInAppNotification(userId, type, title, message, data);

      // Send push notification if enabled
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (user && user.notificationSettings?.push?.system) {
        await this.sendPushNotification(userId, title, message, data);
      }

      logger.info(`System notification sent to user ${userId}: ${title}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send system notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const Notification = require('../models/Notification');
      
      const [total, unread, byType] = await Promise.all([
        Notification.countDocuments({ user: userId }),
        Notification.countDocuments({ user: userId, read: false }),
        Notification.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);
      
      return {
        success: true,
        stats: {
          total,
          unread,
          byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      logger.error(`Failed to get notification stats for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const Notification = require('../models/Notification');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old notifications`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export singleton and class
module.exports = {
  notificationManager,
  NotificationManager
}; 