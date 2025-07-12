const mongoose = require('mongoose');
const { cacheManager } = require('./cache');
const logger = require('./logger');

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize analytics service
  async initialize() {
    try {
      this.isInitialized = true;
      logger.info('Analytics service initialized');
    } catch (error) {
      logger.error('Failed to initialize analytics service:', error);
      throw error;
    }
  }

  // Track user activity
  async trackUserActivity(userId, action, data = {}) {
    try {
      const Activity = require('../models/Activity');
      
      const activity = new Activity({
        user: userId,
        action,
        data,
        timestamp: new Date(),
        ip: data.ip,
        userAgent: data.userAgent
      });

      await activity.save();
      
      // Invalidate user cache
      await cacheManager.invalidateUserCache(userId);
      
      logger.debug(`User activity tracked: ${userId} - ${action}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to track user activity for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Track lead interaction
  async trackLeadInteraction(leadId, userId, interaction, data = {}) {
    try {
      const LeadInteraction = require('../models/LeadInteraction');
      
      const interactionRecord = new LeadInteraction({
        lead: leadId,
        user: userId,
        interaction,
        data,
        timestamp: new Date()
      });

      await interactionRecord.save();
      
      // Update lead analytics
      await this.updateLeadAnalytics(leadId);
      
      logger.debug(`Lead interaction tracked: ${leadId} - ${interaction}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to track lead interaction for ${leadId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Track WhatsApp message
  async trackWhatsAppMessage(userId, messageData) {
    try {
      const WhatsAppMessage = require('../models/WhatsAppMessage');
      
      const message = new WhatsAppMessage({
        user: userId,
        from: messageData.from,
        to: messageData.to,
        content: messageData.content,
        type: messageData.type,
        direction: messageData.direction,
        status: messageData.status,
        timestamp: new Date(),
        metadata: messageData.metadata || {}
      });

      await message.save();
      
      // Update WhatsApp analytics
      await this.updateWhatsAppAnalytics(userId);
      
      logger.debug(`WhatsApp message tracked: ${userId} - ${messageData.direction}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to track WhatsApp message for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Track AI interaction
  async trackAIInteraction(userId, interactionData) {
    try {
      const AIInteraction = require('../models/AIInteraction');
      
      const interaction = new AIInteraction({
        user: userId,
        type: interactionData.type,
        input: interactionData.input,
        output: interactionData.output,
        model: interactionData.model,
        tokens: interactionData.tokens,
        cost: interactionData.cost,
        duration: interactionData.duration,
        timestamp: new Date(),
        metadata: interactionData.metadata || {}
      });

      await interaction.save();
      
      // Update AI analytics
      await this.updateAIAnalytics(userId);
      
      logger.debug(`AI interaction tracked: ${userId} - ${interactionData.type}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to track AI interaction for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Track payment event
  async trackPaymentEvent(userId, paymentData) {
    try {
      const PaymentEvent = require('../models/PaymentEvent');
      
      const event = new PaymentEvent({
        user: userId,
        type: paymentData.type,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        timestamp: new Date(),
        metadata: paymentData.metadata || {}
      });

      await event.save();
      
      // Update payment analytics
      await this.updatePaymentAnalytics(userId);
      
      logger.debug(`Payment event tracked: ${userId} - ${paymentData.type}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to track payment event for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get user analytics
  async getUserAnalytics(userId, dateRange = {}) {
    try {
      const cacheKey = `analytics:user:${userId}:${JSON.stringify(dateRange)}`;
      
      return await cacheManager.cacheWithFallback(cacheKey, async () => {
        const { startDate, endDate } = this.getDateRange(dateRange);
        
        const [
          leadStats,
          messageStats,
          aiStats,
          paymentStats,
          activityStats
        ] = await Promise.all([
          this.getLeadStats(userId, startDate, endDate),
          this.getMessageStats(userId, startDate, endDate),
          this.getAIStats(userId, startDate, endDate),
          this.getPaymentStats(userId, startDate, endDate),
          this.getActivityStats(userId, startDate, endDate)
        ]);

        return {
          success: true,
          analytics: {
            leads: leadStats,
            messages: messageStats,
            ai: aiStats,
            payments: paymentStats,
            activity: activityStats,
            summary: this.generateSummary({
              leads: leadStats,
              messages: messageStats,
              ai: aiStats,
              payments: paymentStats,
              activity: activityStats
            })
          }
        };
      }, 3600); // Cache for 1 hour
    } catch (error) {
      logger.error(`Failed to get user analytics for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get lead statistics
  async getLeadStats(userId, startDate, endDate) {
    try {
      const Lead = require('../models/Lead');
      
      const pipeline = [
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            newLeads: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
            contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Contacted'] }, 1, 0] } },
            qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] } },
            convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
            avgScore: { $avg: '$score' },
            bySource: { $push: '$source' }
          }
        }
      ];

      const result = await Lead.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate source distribution
      const sourceCounts = {};
      if (stats.bySource) {
        stats.bySource.forEach(source => {
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
      }

      return {
        totalLeads: stats.totalLeads || 0,
        newLeads: stats.newLeads || 0,
        contactedLeads: stats.contactedLeads || 0,
        qualifiedLeads: stats.qualifiedLeads || 0,
        convertedLeads: stats.convertedLeads || 0,
        avgScore: Math.round((stats.avgScore || 0) * 100) / 100,
        conversionRate: stats.totalLeads ? (stats.convertedLeads / stats.totalLeads * 100).toFixed(2) : 0,
        bySource: sourceCounts
      };
    } catch (error) {
      logger.error(`Failed to get lead stats for ${userId}:`, error);
      return {};
    }
  }

  // Get message statistics
  async getMessageStats(userId, startDate, endDate) {
    try {
      const WhatsAppMessage = require('../models/WhatsAppMessage');
      
      const pipeline = [
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            sentMessages: { $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] } },
            receivedMessages: { $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] } },
            deliveredMessages: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            failedMessages: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        }
      ];

      const result = await WhatsAppMessage.aggregate(pipeline);
      const stats = result[0] || {};

      return {
        totalMessages: stats.totalMessages || 0,
        sentMessages: stats.sentMessages || 0,
        receivedMessages: stats.receivedMessages || 0,
        deliveredMessages: stats.deliveredMessages || 0,
        failedMessages: stats.failedMessages || 0,
        deliveryRate: stats.sentMessages ? (stats.deliveredMessages / stats.sentMessages * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error(`Failed to get message stats for ${userId}:`, error);
      return {};
    }
  }

  // Get AI statistics
  async getAIStats(userId, startDate, endDate) {
    try {
      const AIInteraction = require('../models/AIInteraction');
      
      const pipeline = [
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalInteractions: { $sum: 1 },
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' },
            avgDuration: { $avg: '$duration' },
            byType: { $push: '$type' }
          }
        }
      ];

      const result = await AIInteraction.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate type distribution
      const typeCounts = {};
      if (stats.byType) {
        stats.byType.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }

      return {
        totalInteractions: stats.totalInteractions || 0,
        totalTokens: stats.totalTokens || 0,
        totalCost: Math.round((stats.totalCost || 0) * 100) / 100,
        avgDuration: Math.round((stats.avgDuration || 0) * 100) / 100,
        byType: typeCounts
      };
    } catch (error) {
      logger.error(`Failed to get AI stats for ${userId}:`, error);
      return {};
    }
  }

  // Get payment statistics
  async getPaymentStats(userId, startDate, endDate) {
    try {
      const PaymentEvent = require('../models/PaymentEvent');
      
      const pipeline = [
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] } },
            failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            byType: { $push: '$type' }
          }
        }
      ];

      const result = await PaymentEvent.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate type distribution
      const typeCounts = {};
      if (stats.byType) {
        stats.byType.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }

      return {
        totalPayments: stats.totalPayments || 0,
        totalAmount: stats.totalAmount || 0,
        successfulPayments: stats.successfulPayments || 0,
        failedPayments: stats.failedPayments || 0,
        successRate: stats.totalPayments ? (stats.successfulPayments / stats.totalPayments * 100).toFixed(2) : 0,
        byType: typeCounts
      };
    } catch (error) {
      logger.error(`Failed to get payment stats for ${userId}:`, error);
      return {};
    }
  }

  // Get activity statistics
  async getActivityStats(userId, startDate, endDate) {
    try {
      const Activity = require('../models/Activity');
      
      const pipeline = [
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            byAction: { $push: '$action' }
          }
        }
      ];

      const result = await Activity.aggregate(pipeline);
      const stats = result[0] || {};

      // Calculate action distribution
      const actionCounts = {};
      if (stats.byAction) {
        stats.byAction.forEach(action => {
          actionCounts[action] = (actionCounts[action] || 0) + 1;
        });
      }

      return {
        totalActivities: stats.totalActivities || 0,
        byAction: actionCounts
      };
    } catch (error) {
      logger.error(`Failed to get activity stats for ${userId}:`, error);
      return {};
    }
  }

  // Generate summary
  generateSummary(stats) {
    const { leads, messages, ai, payments, activity } = stats;
    
    return {
      totalLeads: leads.totalLeads || 0,
      totalMessages: messages.totalMessages || 0,
      totalAIInteractions: ai.totalInteractions || 0,
      totalRevenue: payments.totalAmount || 0,
      totalActivities: activity.totalActivities || 0,
      conversionRate: leads.conversionRate || 0,
      messageDeliveryRate: messages.deliveryRate || 0,
      paymentSuccessRate: payments.successRate || 0
    };
  }

  // Get date range
  getDateRange(range) {
    const now = new Date();
    let startDate, endDate;

    switch (range.period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case 'custom':
        startDate = new Date(range.startDate);
        endDate = new Date(range.endDate);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        endDate = now;
    }

    return { startDate, endDate };
  }

  // Update lead analytics
  async updateLeadAnalytics(leadId) {
    try {
      const Lead = require('../models/Lead');
      const lead = await Lead.findById(leadId);
      
      if (!lead) return;

      // Update lead analytics
      lead.analytics = {
        views: (lead.analytics?.views || 0) + 1,
        interactions: (lead.analytics?.interactions || 0) + 1,
        lastActivity: new Date()
      };

      await lead.save();
    } catch (error) {
      logger.error(`Failed to update lead analytics for ${leadId}:`, error);
    }
  }

  // Update WhatsApp analytics
  async updateWhatsAppAnalytics(userId) {
    try {
      // Invalidate WhatsApp cache
      await cacheManager.invalidateWhatsAppCache(userId);
    } catch (error) {
      logger.error(`Failed to update WhatsApp analytics for ${userId}:`, error);
    }
  }

  // Update AI analytics
  async updateAIAnalytics(userId) {
    try {
      // Invalidate AI cache
      await cacheManager.delPattern(`ai:${userId}:*`);
    } catch (error) {
      logger.error(`Failed to update AI analytics for ${userId}:`, error);
    }
  }

  // Update payment analytics
  async updatePaymentAnalytics(userId) {
    try {
      // Invalidate payment cache
      await cacheManager.delPattern(`payments:${userId}:*`);
    } catch (error) {
      logger.error(`Failed to update payment analytics for ${userId}:`, error);
    }
  }

  // Get system-wide analytics (admin only)
  async getSystemAnalytics(dateRange = {}) {
    try {
      const cacheKey = `analytics:system:${JSON.stringify(dateRange)}`;
      
      return await cacheManager.cacheWithFallback(cacheKey, async () => {
        const { startDate, endDate } = this.getDateRange(dateRange);
        
        const [
          userStats,
          leadStats,
          messageStats,
          aiStats,
          paymentStats
        ] = await Promise.all([
          this.getSystemUserStats(startDate, endDate),
          this.getSystemLeadStats(startDate, endDate),
          this.getSystemMessageStats(startDate, endDate),
          this.getSystemAIStats(startDate, endDate),
          this.getSystemPaymentStats(startDate, endDate)
        ]);

        return {
          success: true,
          analytics: {
            users: userStats,
            leads: leadStats,
            messages: messageStats,
            ai: aiStats,
            payments: paymentStats
          }
        };
      }, 1800); // Cache for 30 minutes
    } catch (error) {
      logger.error('Failed to get system analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // System-wide statistics methods
  async getSystemUserStats(startDate, endDate) {
    try {
      const User = require('../models/User');
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            premiumUsers: { $sum: { $cond: [{ $eq: ['$plan', 'premium'] }, 1, 0] } }
          }
        }
      ];

      const result = await User.aggregate(pipeline);
      return result[0] || {};
    } catch (error) {
      logger.error('Failed to get system user stats:', error);
      return {};
    }
  }

  async getSystemLeadStats(startDate, endDate) {
    try {
      const Lead = require('../models/Lead');
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
            avgScore: { $avg: '$score' }
          }
        }
      ];

      const result = await Lead.aggregate(pipeline);
      return result[0] || {};
    } catch (error) {
      logger.error('Failed to get system lead stats:', error);
      return {};
    }
  }

  async getSystemMessageStats(startDate, endDate) {
    try {
      const WhatsAppMessage = require('../models/WhatsAppMessage');
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            deliveredMessages: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
          }
        }
      ];

      const result = await WhatsAppMessage.aggregate(pipeline);
      return result[0] || {};
    } catch (error) {
      logger.error('Failed to get system message stats:', error);
      return {};
    }
  }

  async getSystemAIStats(startDate, endDate) {
    try {
      const AIInteraction = require('../models/AIInteraction');
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalInteractions: { $sum: 1 },
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' }
          }
        }
      ];

      const result = await AIInteraction.aggregate(pipeline);
      return result[0] || {};
    } catch (error) {
      logger.error('Failed to get system AI stats:', error);
      return {};
    }
  }

  async getSystemPaymentStats(startDate, endDate) {
    try {
      const PaymentEvent = require('../models/PaymentEvent');
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] } }
          }
        }
      ];

      const result = await PaymentEvent.aggregate(pipeline);
      return result[0] || {};
    } catch (error) {
      logger.error('Failed to get system payment stats:', error);
      return {};
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export singleton and class
module.exports = {
  analyticsService,
  AnalyticsService
}; 