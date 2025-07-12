const logger = require('../utils/logger');
const { emailService } = require('../utils/email');
const { notificationManager } = require('../utils/notifications');

class ActionExecutor {
  constructor() {
    this.actionHandlers = new Map();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.actionHandlers.set('send_email', this.sendEmail.bind(this));
    this.actionHandlers.set('send_whatsapp', this.sendWhatsApp.bind(this));
    this.actionHandlers.set('create_task', this.createTask.bind(this));
    this.actionHandlers.set('update_lead', this.updateLead.bind(this));
    this.actionHandlers.set('add_tag', this.addTag.bind(this));
    this.actionHandlers.set('remove_tag', this.removeTag.bind(this));
    this.actionHandlers.set('change_status', this.changeStatus.bind(this));
    this.actionHandlers.set('assign_user', this.assignUser.bind(this));
    this.actionHandlers.set('webhook', this.callWebhook.bind(this));
  }

  async execute(action, leadData, execution) {
    const handler = this.actionHandlers.get(action.type);
    if (!handler) {
      throw new Error(`Unknown action type: ${action.type}`);
    }

    try {
      logger.info(`Executing action: ${action.type} for lead ${leadData._id}`);
      
      const result = await handler(action, leadData, execution);
      
      logger.info(`Action ${action.type} executed successfully for lead ${leadData._id}`);
      return result;
    } catch (error) {
      logger.error(`Action ${action.type} failed for lead ${leadData._id}:`, error);
      throw error;
    }
  }

  async sendEmail(action, leadData, execution) {
    const { config } = action;
    const { template, subject, body, recipients } = config;

    // Process template variables
    const processedSubject = this.processTemplate(subject, leadData);
    const processedBody = this.processTemplate(body, leadData);
    const processedRecipients = this.processRecipients(recipients, leadData);

    // Send email
    const emailResult = await emailService.sendEmail(
      processedRecipients,
      processedSubject,
      processedBody,
      template
    );

    return {
      success: emailResult.success,
      messageId: emailResult.messageId,
      recipients: processedRecipients
    };
  }

  async sendWhatsApp(action, leadData, execution) {
    const { config } = action;
    const { message, mediaUrl } = config;

    // Process template variables
    const processedMessage = this.processTemplate(message, leadData);

    // Send WhatsApp message
    const whatsappService = require('../services/WhatsAppService');
    const result = await whatsappService.sendMessage(
      leadData.phone,
      processedMessage,
      mediaUrl
    );

    return {
      success: result.success,
      messageId: result.messageId
    };
  }

  async createTask(action, leadData, execution) {
    const { config } = action;
    const { taskTitle, taskDescription, dueDate, assignee } = config;

    // Process template variables
    const processedTitle = this.processTemplate(taskTitle, leadData);
    const processedDescription = this.processTemplate(taskDescription, leadData);
    const processedDueDate = this.calculateDueDate(dueDate);

    // Create task
    const Task = require('../models/Task');
    const task = new Task({
      userId: leadData.userId,
      leadId: leadData._id,
      title: processedTitle,
      description: processedDescription,
      dueDate: processedDueDate,
      assignee: assignee || leadData.userId,
      priority: 'medium',
      status: 'pending'
    });

    await task.save();

    return {
      success: true,
      taskId: task._id
    };
  }

  async updateLead(action, leadData, execution) {
    const { config } = action;
    const { field, value } = config;

    // Process template variables
    const processedValue = this.processTemplate(value, leadData);

    // Update lead
    const Lead = require('../models/Lead');
    const updatedLead = await Lead.findByIdAndUpdate(
      leadData._id,
      { [field]: processedValue },
      { new: true }
    );

    return {
      success: true,
      field,
      value: processedValue
    };
  }

  async addTag(action, leadData, execution) {
    const { config } = action;
    const { tag } = config;

    // Process template variables
    const processedTag = this.processTemplate(tag, leadData);

    // Add tag to lead
    const Lead = require('../models/Lead');
    const updatedLead = await Lead.findByIdAndUpdate(
      leadData._id,
      { $addToSet: { tags: processedTag } },
      { new: true }
    );

    return {
      success: true,
      tag: processedTag
    };
  }

  async removeTag(action, leadData, execution) {
    const { config } = action;
    const { tag } = config;

    // Process template variables
    const processedTag = this.processTemplate(tag, leadData);

    // Remove tag from lead
    const Lead = require('../models/Lead');
    const updatedLead = await Lead.findByIdAndUpdate(
      leadData._id,
      { $pull: { tags: processedTag } },
      { new: true }
    );

    return {
      success: true,
      tag: processedTag
    };
  }

  async changeStatus(action, leadData, execution) {
    const { config } = action;
    const { status } = config;

    // Update lead status
    const Lead = require('../models/Lead');
    const updatedLead = await Lead.findByIdAndUpdate(
      leadData._id,
      { status },
      { new: true }
    );

    return {
      success: true,
      oldStatus: leadData.status,
      newStatus: status
    };
  }

  async assignUser(action, leadData, execution) {
    const { config } = action;
    const { userId } = config;

    // Update lead assignment
    const Lead = require('../models/Lead');
    const updatedLead = await Lead.findByIdAndUpdate(
      leadData._id,
      { assignedTo: userId },
      { new: true }
    );

    return {
      success: true,
      assignedTo: userId
    };
  }

  async callWebhook(action, leadData, execution) {
    const { config } = action;
    const { url, method, headers, body } = config;

    // Process template variables
    const processedUrl = this.processTemplate(url, leadData);
    const processedBody = this.processTemplate(body, leadData);

    // Make HTTP request
    const axios = require('axios');
    const response = await axios({
      method: method || 'POST',
      url: processedUrl,
      headers: headers || {},
      data: processedBody,
      timeout: 30000
    });

    return {
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      responseData: response.data
    };
  }

  // Helper methods
  processTemplate(template, leadData) {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, field) => {
      return leadData[field] || match;
    });
  }

  processRecipients(recipients, leadData) {
    if (!recipients || !Array.isArray(recipients)) {
      return [leadData.email];
    }

    return recipients.map(recipient => {
      if (recipient === '{{email}}') {
        return leadData.email;
      }
      if (recipient === '{{user_email}}') {
        return leadData.userId?.email || '';
      }
      return recipient;
    }).filter(email => email);
  }

  calculateDueDate(dueDateString) {
    if (!dueDateString) return new Date();

    const now = new Date();
    const match = dueDateString.match(/(\d+)\s*(day|week|month|year)s?/i);
    
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      switch (unit) {
        case 'day':
          return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
        case 'week':
          return new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getFullYear(), now.getMonth() + amount, now.getDate());
        case 'year':
          return new Date(now.getFullYear() + amount, now.getMonth(), now.getDate());
        default:
          return now;
      }
    }

    return now;
  }
}

module.exports = ActionExecutor; 