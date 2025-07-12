const Queue = require('bull');
const logger = require('./logger');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.isInitialized = false;
  }

  // Initialize all queues
  async initialize() {
    try {
      const redisConfig = {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0
        }
      };

      // Define queues
      const queueDefinitions = [
        {
          name: 'email',
          concurrency: 5,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: 100,
            removeOnFail: 50
          }
        },
        {
          name: 'whatsapp',
          concurrency: 3,
          defaultJobOptions: {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 5000
            },
            removeOnComplete: 50,
            removeOnFail: 25
          }
        },
        {
          name: 'ai-processing',
          concurrency: 2,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 10000
            },
            removeOnComplete: 30,
            removeOnFail: 15
          }
        },
        {
          name: 'lead-scoring',
          concurrency: 10,
          defaultJobOptions: {
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 5000
            },
            removeOnComplete: 200,
            removeOnFail: 100
          }
        },
        {
          name: 'analytics',
          concurrency: 3,
          defaultJobOptions: {
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 3000
            },
            removeOnComplete: 100,
            removeOnFail: 50
          }
        },
        {
          name: 'notifications',
          concurrency: 5,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: 150,
            removeOnFail: 75
          }
        },
        {
          name: 'cleanup',
          concurrency: 1,
          defaultJobOptions: {
            attempts: 1,
            removeOnComplete: 10,
            removeOnFail: 5
          }
        }
      ];

      // Create queues
      for (const definition of queueDefinitions) {
        const queue = new Queue(definition.name, redisConfig);
        
        // Set default job options
        queue.defaultJobOptions = definition.defaultJobOptions;
        
        // Add event listeners
        queue.on('error', (error) => {
          logger.error(`Queue ${definition.name} error:`, error);
        });

        queue.on('failed', (job, err) => {
          logger.error(`Job ${job.id} in queue ${definition.name} failed:`, err);
        });

        queue.on('completed', (job) => {
          logger.debug(`Job ${job.id} in queue ${definition.name} completed`);
        });

        queue.on('stalled', (job) => {
          logger.warn(`Job ${job.id} in queue ${definition.name} stalled`);
        });

        this.queues.set(definition.name, queue);
      }

      this.isInitialized = true;
      logger.info('Queue manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  // Get queue by name
  getQueue(name) {
    if (!this.isInitialized) {
      throw new Error('Queue manager not initialized');
    }
    
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue '${name}' not found`);
    }
    
    return queue;
  }

  // Add job to queue
  async addJob(queueName, jobType, data, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.add(jobType, data, options);
      
      logger.debug(`Job added to queue ${queueName}: ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  // Process jobs in queue
  processQueue(queueName, processor) {
    try {
      const queue = this.getQueue(queueName);
      queue.process(processor);
      
      this.processors.set(queueName, processor);
      logger.info(`Processor registered for queue: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to process queue ${queueName}:`, error);
      throw error;
    }
  }

  // Email queue processors
  setupEmailProcessors() {
    const emailQueue = this.getQueue('email');
    
    emailQueue.process('send-welcome', async (job) => {
      const { userId, email, name } = job.data;
      
      try {
        // Import email service
        const { sendWelcomeEmail } = require('./email');
        await sendWelcomeEmail(email, name);
        
        logger.info(`Welcome email sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        logger.error(`Failed to send welcome email to ${email}:`, error);
        throw error;
      }
    });

    emailQueue.process('send-password-reset', async (job) => {
      const { email, resetToken } = job.data;
      
      try {
        const { sendPasswordResetEmail } = require('./email');
        await sendPasswordResetEmail(email, resetToken);
        
        logger.info(`Password reset email sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        logger.error(`Failed to send password reset email to ${email}:`, error);
        throw error;
      }
    });

    emailQueue.process('send-notification', async (job) => {
      const { email, subject, content } = job.data;
      
      try {
        const { sendNotificationEmail } = require('./email');
        await sendNotificationEmail(email, subject, content);
        
        logger.info(`Notification email sent to ${email}`);
        return { success: true, email };
      } catch (error) {
        logger.error(`Failed to send notification email to ${email}:`, error);
        throw error;
      }
    });
  }

  // WhatsApp queue processors
  setupWhatsAppProcessors() {
    const whatsappQueue = this.getQueue('whatsapp');
    
    whatsappQueue.process('send-message', async (job) => {
      const { userId, to, message, type, mediaUrl } = job.data;
      
      try {
        const { sendWhatsAppMessage } = require('./whatsapp');
        const result = await sendWhatsAppMessage(userId, to, message, type, mediaUrl);
        
        logger.info(`WhatsApp message sent to ${to}`);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        logger.error(`Failed to send WhatsApp message to ${to}:`, error);
        throw error;
      }
    });

    whatsappQueue.process('bulk-message', async (job) => {
      const { userId, recipients, message, type } = job.data;
      
      try {
        const { sendWhatsAppMessage } = require('./whatsapp');
        const results = [];
        
        for (const recipient of recipients) {
          try {
            const result = await sendWhatsAppMessage(userId, recipient, message, type);
            results.push({ recipient, success: true, messageId: result.messageId });
          } catch (error) {
            results.push({ recipient, success: false, error: error.message });
          }
          
          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        logger.info(`Bulk WhatsApp messages sent to ${recipients.length} recipients`);
        return { success: true, results };
      } catch (error) {
        logger.error('Failed to send bulk WhatsApp messages:', error);
        throw error;
      }
    });
  }

  // AI processing queue processors
  setupAIProcessors() {
    const aiQueue = this.getQueue('ai-processing');
    
    aiQueue.process('analyze-lead', async (job) => {
      const { leadId, conversation } = job.data;
      
      try {
        const { analyzeLeadConversation } = require('./openai');
        const analysis = await analyzeLeadConversation(conversation);
        
        // Update lead with analysis
        const Lead = require('../models/Lead');
        await Lead.findByIdAndUpdate(leadId, {
          aiAnalysis: analysis,
          lastAnalyzed: new Date()
        });
        
        logger.info(`Lead ${leadId} analyzed successfully`);
        return { success: true, analysis };
      } catch (error) {
        logger.error(`Failed to analyze lead ${leadId}:`, error);
        throw error;
      }
    });

    aiQueue.process('generate-response', async (job) => {
      const { conversation, context, userId } = job.data;
      
      try {
        const { generateAIResponse } = require('./openai');
        const response = await generateAIResponse(conversation, context, userId);
        
        logger.info(`AI response generated for user ${userId}`);
        return { success: true, response };
      } catch (error) {
        logger.error(`Failed to generate AI response for user ${userId}:`, error);
        throw error;
      }
    });

    aiQueue.process('extract-contacts', async (job) => {
      const { conversation, userId } = job.data;
      
      try {
        const { extractContacts } = require('./openai');
        const contacts = await extractContacts(conversation);
        
        logger.info(`Contacts extracted for user ${userId}`);
        return { success: true, contacts };
      } catch (error) {
        logger.error(`Failed to extract contacts for user ${userId}:`, error);
        throw error;
      }
    });
  }

  // Lead scoring queue processors
  setupLeadScoringProcessors() {
    const scoringQueue = this.getQueue('lead-scoring');
    
    scoringQueue.process('calculate-score', async (job) => {
      const { leadId, factors } = job.data;
      
      try {
        const { calculateLeadScore } = require('./leadScoring');
        const score = await calculateLeadScore(factors);
        
        // Update lead with new score
        const Lead = require('../models/Lead');
        await Lead.findByIdAndUpdate(leadId, {
          score,
          scoreFactors: factors,
          lastScored: new Date()
        });
        
        logger.info(`Lead ${leadId} scored: ${score}`);
        return { success: true, score };
      } catch (error) {
        logger.error(`Failed to calculate score for lead ${leadId}:`, error);
        throw error;
      }
    });

    scoringQueue.process('bulk-scoring', async (job) => {
      const { leadIds } = job.data;
      
      try {
        const { calculateLeadScore } = require('./leadScoring');
        const Lead = require('../models/Lead');
        const results = [];
        
        for (const leadId of leadIds) {
          try {
            const lead = await Lead.findById(leadId);
            if (lead) {
              const score = await calculateLeadScore(lead);
              await Lead.findByIdAndUpdate(leadId, {
                score,
                lastScored: new Date()
              });
              results.push({ leadId, success: true, score });
            }
          } catch (error) {
            results.push({ leadId, success: false, error: error.message });
          }
        }
        
        logger.info(`Bulk scoring completed for ${leadIds.length} leads`);
        return { success: true, results };
      } catch (error) {
        logger.error('Failed to perform bulk scoring:', error);
        throw error;
      }
    });
  }

  // Analytics queue processors
  setupAnalyticsProcessors() {
    const analyticsQueue = this.getQueue('analytics');
    
    analyticsQueue.process('generate-report', async (job) => {
      const { userId, reportType, dateRange } = job.data;
      
      try {
        // Generate analytics report
        const report = await this.generateAnalyticsReport(userId, reportType, dateRange);
        
        logger.info(`Analytics report generated for user ${userId}`);
        return { success: true, report };
      } catch (error) {
        logger.error(`Failed to generate analytics report for user ${userId}:`, error);
        throw error;
      }
    });

    analyticsQueue.process('update-metrics', async (job) => {
      const { userId } = job.data;
      
      try {
        // Update user metrics
        await this.updateUserMetrics(userId);
        
        logger.info(`Metrics updated for user ${userId}`);
        return { success: true };
      } catch (error) {
        logger.error(`Failed to update metrics for user ${userId}:`, error);
        throw error;
      }
    });
  }

  // Notifications queue processors
  setupNotificationProcessors() {
    const notificationQueue = this.getQueue('notifications');
    
    notificationQueue.process('send-push', async (job) => {
      const { userId, title, body, data } = job.data;
      
      try {
        // Send push notification
        const { sendPushNotification } = require('./notifications');
        await sendPushNotification(userId, title, body, data);
        
        logger.info(`Push notification sent to user ${userId}`);
        return { success: true };
      } catch (error) {
        logger.error(`Failed to send push notification to user ${userId}:`, error);
        throw error;
      }
    });

    notificationQueue.process('send-sms', async (job) => {
      const { phone, message } = job.data;
      
      try {
        // Send SMS
        const { sendSMS } = require('./notifications');
        await sendSMS(phone, message);
        
        logger.info(`SMS sent to ${phone}`);
        return { success: true };
      } catch (error) {
        logger.error(`Failed to send SMS to ${phone}:`, error);
        throw error;
      }
    });
  }

  // Cleanup queue processors
  setupCleanupProcessors() {
    const cleanupQueue = this.getQueue('cleanup');
    
    cleanupQueue.process('cleanup-old-data', async (job) => {
      try {
        // Clean up old data
        await this.cleanupOldData();
        
        logger.info('Old data cleanup completed');
        return { success: true };
      } catch (error) {
        logger.error('Failed to cleanup old data:', error);
        throw error;
      }
    });

    cleanupQueue.process('cleanup-failed-jobs', async (job) => {
      try {
        // Clean up failed jobs
        await this.cleanupFailedJobs();
        
        logger.info('Failed jobs cleanup completed');
        return { success: true };
      } catch (error) {
        logger.error('Failed to cleanup failed jobs:', error);
        throw error;
      }
    });
  }

  // Setup all processors
  setupAllProcessors() {
    this.setupEmailProcessors();
    this.setupWhatsAppProcessors();
    this.setupAIProcessors();
    this.setupLeadScoringProcessors();
    this.setupAnalyticsProcessors();
    this.setupNotificationProcessors();
    this.setupCleanupProcessors();
    
    logger.info('All queue processors setup completed');
  }

  // Get queue statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of this.queues) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);
        
        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length
        };
      } catch (error) {
        logger.error(`Failed to get stats for queue ${name}:`, error);
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }

  // Pause all queues
  async pauseAll() {
    for (const [name, queue] of this.queues) {
      await queue.pause();
      logger.info(`Queue ${name} paused`);
    }
  }

  // Resume all queues
  async resumeAll() {
    for (const [name, queue] of this.queues) {
      await queue.resume();
      logger.info(`Queue ${name} resumed`);
    }
  }

  // Clean up resources
  async cleanup() {
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }
    
    this.queues.clear();
    this.processors.clear();
    this.isInitialized = false;
  }

  // Helper methods for analytics and cleanup
  async generateAnalyticsReport(userId, reportType, dateRange) {
    // Implementation for generating analytics reports
    return { reportType, dateRange, data: {} };
  }

  async updateUserMetrics(userId) {
    // Implementation for updating user metrics
    return { success: true };
  }

  async cleanupOldData() {
    // Implementation for cleaning up old data
    return { success: true };
  }

  async cleanupFailedJobs() {
    // Implementation for cleaning up failed jobs
    return { success: true };
  }
}

// Create singleton instance
const queueManager = new QueueManager();

// Export singleton and class
module.exports = {
  queueManager,
  QueueManager
}; 