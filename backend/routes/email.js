const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

// In-memory storage for demo (use database in production)
let emailLogs = [];
let customTemplates = {};

// ==================== SMTP SETTINGS ROUTES ====================

// Get SMTP settings
router.get('/smtp/settings', auth, async (req, res) => {
  try {
    const settings = {
      enabled: emailService.settings.enabled,
      host: emailService.settings.host,
      port: emailService.settings.port,
      username: emailService.settings.username,
      password: emailService.settings.password ? '****hidden****' : '',
      encryption: emailService.settings.encryption,
      from_email: emailService.settings.from_email,
      from_name: emailService.settings.from_name,
      reply_to: emailService.settings.reply_to,
      test_mode: emailService.settings.test_mode
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching SMTP settings:', error);
    res.status(500).json({ error: 'Failed to fetch SMTP settings' });
  }
});

// Update SMTP settings
router.put('/smtp/settings', auth, async (req, res) => {
  try {
    const {
      enabled,
      host,
      port,
      username,
      password,
      encryption,
      from_email,
      from_name,
      reply_to,
      test_mode
    } = req.body;

    // Validate required fields
    if (enabled && (!host || !username || !from_email)) {
      return res.status(400).json({ 
        error: 'Host, username, and from_email are required when email is enabled' 
      });
    }

    const newSettings = {
      enabled,
      host,
      port: parseInt(port) || 587,
      username,
      encryption: encryption || 'tls',
      from_email,
      from_name: from_name || 'AI Agent CRM',
      reply_to,
      test_mode: test_mode !== false
    };

    // Only update password if provided
    if (password && password !== '****hidden****') {
      newSettings.password = password;
    }

    emailService.updateSettings(newSettings);

    logger.info('SMTP settings updated', { 
      host, 
      username, 
      enabled,
      updatedBy: req.user.id 
    });

    res.json({
      success: true,
      message: 'SMTP settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating SMTP settings:', error);
    res.status(500).json({ error: 'Failed to update SMTP settings' });
  }
});

// Test SMTP connection
router.post('/smtp/test-connection', auth, async (req, res) => {
  try {
    const result = await emailService.verifyConnection();
    res.json(result);
  } catch (error) {
    logger.error('SMTP connection test failed:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Send test email
router.post('/smtp/send-test', auth, async (req, res) => {
  try {
    const { to, subject, template } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    let result;
    if (template) {
      // Send test with template
      result = await emailService.sendEmail({
        to,
        template,
        variables: {
          user_name: 'Test User',
          email: to,
          amount: '999',
          days_left: '7',
          activation_link: 'https://example.com/activate',
          upgrade_link: 'https://example.com/upgrade',
          reset_link: 'https://example.com/reset'
        }
      });
    } else {
      // Send simple test email
      result = await emailService.sendTestEmail(to, subject);
    }

    logger.info('Test email sent', { to, template, sentBy: req.user.id });

    res.json(result);
  } catch (error) {
    logger.error('Failed to send test email:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== EMAIL TEMPLATES ROUTES ====================

// Get email templates
router.get('/templates', auth, async (req, res) => {
  try {
    const defaultTemplates = emailService.getDefaultTemplates();
    
    // Merge with custom templates
    const allTemplates = defaultTemplates.map(template => ({
      ...template,
      ...customTemplates[template.id],
      is_custom: !!customTemplates[template.id]
    }));

    res.json(allTemplates);
  } catch (error) {
    logger.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// Get specific template
router.get('/templates/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = emailService.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Merge with custom template if exists
    const result = {
      ...template,
      ...customTemplates[templateId]
    };

    res.json(result);
  } catch (error) {
    logger.error('Error fetching email template:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

// Update email template
router.put('/templates/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      subject,
      html_content,
      text_content,
      status,
      variables
    } = req.body;

    // Validate template exists
    const baseTemplate = emailService.getTemplate(templateId);
    if (!baseTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Save custom template
    customTemplates[templateId] = {
      subject: subject || baseTemplate.subject,
      html_content: html_content || baseTemplate.html_content,
      text_content: text_content || baseTemplate.text_content,
      status: status || baseTemplate.status,
      variables: variables || baseTemplate.variables,
      updated_at: new Date(),
      updated_by: req.user.id
    };

    logger.info('Email template updated', { 
      templateId, 
      updatedBy: req.user.id 
    });

    res.json({
      success: true,
      message: 'Email template updated successfully',
      template: {
        ...baseTemplate,
        ...customTemplates[templateId]
      }
    });
  } catch (error) {
    logger.error('Error updating email template:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

// Reset template to default
router.post('/templates/:templateId/reset', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Remove custom template
    delete customTemplates[templateId];
    
    const defaultTemplate = emailService.getTemplate(templateId);
    if (!defaultTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    logger.info('Email template reset to default', { 
      templateId, 
      resetBy: req.user.id 
    });

    res.json({
      success: true,
      message: 'Template reset to default successfully',
      template: defaultTemplate
    });
  } catch (error) {
    logger.error('Error resetting email template:', error);
    res.status(500).json({ error: 'Failed to reset email template' });
  }
});

// Preview template with sample data
router.post('/templates/:templateId/preview', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables = {} } = req.body;
    
    const template = emailService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Merge with custom template
    const fullTemplate = {
      ...template,
      ...customTemplates[templateId]
    };

    // Sample variables if not provided
    const sampleVariables = {
      user_name: variables.user_name || 'John Doe',
      email: variables.email || 'john@example.com',
      amount: variables.amount || '999',
      days_left: variables.days_left || '7',
      plan_name: variables.plan_name || 'Pro Plan',
      transaction_id: variables.transaction_id || 'TXN123456',
      payment_date: variables.payment_date || new Date().toLocaleDateString(),
      billing_date: variables.billing_date || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
      activation_link: variables.activation_link || 'https://example.com/activate?token=xyz',
      upgrade_link: variables.upgrade_link || 'https://example.com/upgrade',
      reset_link: variables.reset_link || 'https://example.com/reset?token=abc',
      invoice_link: variables.invoice_link || 'https://example.com/invoice/123',
      receipt_link: variables.receipt_link || 'https://example.com/receipt/123',
      expiry_time: variables.expiry_time || '1 hour',
      ...variables
    };

    const preview = {
      subject: emailService.processTemplate(fullTemplate.subject, sampleVariables),
      html_content: emailService.processTemplate(fullTemplate.html_content, sampleVariables),
      text_content: emailService.processTemplate(fullTemplate.text_content, sampleVariables),
      variables: sampleVariables
    };

    res.json(preview);
  } catch (error) {
    logger.error('Error previewing email template:', error);
    res.status(500).json({ error: 'Failed to preview email template' });
  }
});

// ==================== EMAIL LOGS ROUTES ====================

// Get email logs
router.get('/logs', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      template,
      start_date,
      end_date
    } = req.query;

    let filteredLogs = [...emailLogs];

    // Apply filters
    if (status) {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }
    if (template) {
      filteredLogs = filteredLogs.filter(log => log.template === template);
    }
    if (start_date) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.created_at) >= new Date(start_date)
      );
    }
    if (end_date) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.created_at) <= new Date(end_date)
      );
    }

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      logs: paginatedLogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: filteredLogs.length,
        total_pages: Math.ceil(filteredLogs.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// Get email statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const now = new Date();
    const startDate = getStartDateForPeriod(period, now);
    
    const periodLogs = emailLogs.filter(log => 
      new Date(log.created_at) >= startDate
    );

    const totalEmails = periodLogs.length;
    const sentEmails = periodLogs.filter(log => log.status === 'sent').length;
    const failedEmails = periodLogs.filter(log => log.status === 'failed').length;
    const deliveryRate = totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0;

    // Template usage stats
    const templateStats = {};
    periodLogs.forEach(log => {
      if (log.template) {
        if (!templateStats[log.template]) {
          templateStats[log.template] = { sent: 0, failed: 0 };
        }
        templateStats[log.template][log.status]++;
      }
    });

    res.json({
      period,
      total_emails: totalEmails,
      sent_emails: sentEmails,
      failed_emails: failedEmails,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      template_stats: templateStats,
      daily_counts: generateDailyCounts(periodLogs)
    });
  } catch (error) {
    logger.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email statistics' });
  }
});

// ==================== UTILITY FUNCTIONS ====================

function getStartDateForPeriod(period, now) {
  const date = new Date(now);
  switch (period) {
    case 'daily':
      date.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      date.setDate(date.getDate() - 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 1);
  }
  return date;
}

function generateDailyCounts(logs) {
  const counts = {};
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    if (!counts[date]) {
      counts[date] = { sent: 0, failed: 0 };
    }
    counts[date][log.status]++;
  });
  return counts;
}

// Initialize demo email logs
function initializeDemoLogs() {
  const templates = ['user_registration', 'trial_expire', 'payment_success', 'plan_purchase'];
  
  for (let i = 0; i < 20; i++) {
    emailLogs.push({
      id: `log_${i + 1}`,
      to_email: `user${i + 1}@example.com`,
      subject: `Test Subject ${i + 1}`,
      template: templates[Math.floor(Math.random() * templates.length)],
      template_name: templates[Math.floor(Math.random() * templates.length)].replace('_', ' '),
      status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success rate
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      message_id: `msg_${i + 1}`,
      error: Math.random() > 0.9 ? 'SMTP connection failed' : null
    });
  }
}

// Initialize demo data
initializeDemoLogs();

module.exports = router; 