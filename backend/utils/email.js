const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');
const { queueManager } = require('./queue');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isInitialized = false;
    this.settings = {
      enabled: false,
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT) || 587,
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      encryption: process.env.SMTP_ENCRYPTION || 'tls',
      from_email: process.env.SMTP_FROM_EMAIL || '',
      from_name: process.env.SMTP_FROM_NAME || 'AI Agent CRM',
      reply_to: process.env.SMTP_REPLY_TO || '',
      test_mode: process.env.SMTP_TEST_MODE === 'true'
    };
    this.initTransporter();
  }

  // Initialize email service
  async initialize() {
    try {
      // Load email templates
      await this.loadTemplates();
      
      this.isInitialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  initTransporter() {
    if (!this.settings.host || !this.settings.username) {
      logger.warn('SMTP not configured - emails will not be sent');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: this.settings.host,
        port: this.settings.port,
        secure: this.settings.encryption === 'ssl',
        auth: {
          user: this.settings.username,
          pass: this.settings.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.initTransporter();
  }

  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      logger.error('SMTP verification failed:', error);
      throw new Error(`SMTP verification failed: ${error.message}`);
    }
  }

  // Load email templates
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Check if templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        // Create default templates if directory doesn't exist
        await this.createDefaultTemplates();
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          
          this.templates.set(templateName, handlebars.compile(templateContent));
          logger.debug(`Loaded email template: ${templateName}`);
        }
      }
      
      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
      throw error;
    }
  }

  // Create default email templates
  async createDefaultTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    await fs.mkdir(templatesDir, { recursive: true });

    const defaultTemplates = {
      'welcome.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to AI Agent CRM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome to AI Agent CRM!</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for joining AI Agent CRM. We're excited to help you manage your leads and grow your business with AI-powered automation.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
                <li>Connect your WhatsApp Business account</li>
                <li>Import your existing leads</li>
                <li>Set up AI-powered responses</li>
                <li>Configure automation workflows</li>
            </ul>
        </div>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>The AI Agent CRM Team</p>
    </div>
</body>
</html>`,

      'password-reset.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - AI Agent CRM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password for your AI Agent CRM account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>Best regards,<br>The AI Agent CRM Team</p>
    </div>
</body>
</html>`,

      'lead-notification.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Lead - AI Agent CRM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">New Lead Alert!</h1>
        <p>Hi {{name}},</p>
        <p>You have a new lead in your AI Agent CRM dashboard.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3>Lead Details:</h3>
            <p><strong>Name:</strong> {{leadName}}</p>
            <p><strong>Phone:</strong> {{leadPhone}}</p>
            <p><strong>Email:</strong> {{leadEmail}}</p>
            <p><strong>Source:</strong> {{leadSource}}</p>
            <p><strong>Score:</strong> {{leadScore}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Lead</a>
        </div>
        
        <p>Best regards,<br>The AI Agent CRM Team</p>
    </div>
</body>
</html>`,

      'subscription-update.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Subscription Update - AI Agent CRM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Subscription Update</h1>
        <p>Hi {{name}},</p>
        <p>Your AI Agent CRM subscription has been updated.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Subscription Details:</h3>
            <p><strong>Plan:</strong> {{planName}}</p>
            <p><strong>Status:</strong> {{status}}</p>
            <p><strong>Next Billing:</strong> {{nextBilling}}</p>
            <p><strong>Amount:</strong> {{amount}}</p>
        </div>
        
        <p>If you have any questions about your subscription, please contact our support team.</p>
        
        <p>Best regards,<br>The AI Agent CRM Team</p>
    </div>
</body>
</html>`,

      'system-notification.hbs': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{title}} - AI Agent CRM</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">{{title}}</h1>
        <p>Hi {{name}},</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {{{message}}}
        </div>
        <p>Best regards,<br>The AI Agent CRM Team</p>
    </div>
</body>
</html>`
    };

    for (const [filename, content] of Object.entries(defaultTemplates)) {
      const filepath = path.join(templatesDir, filename);
      await fs.writeFile(filepath, content);
    }

    logger.info('Created default email templates');
  }

  // Send email with template
  async sendEmailWithTemplate(to, subject, templateName, data, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const html = template(data);
      
      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to} using template ${templateName}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to} using template ${templateName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send simple email
  async sendEmail(to, subject, content, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html: content,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    const data = {
      name,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@aiagentcrm.com'
    };

    return this.sendEmailWithTemplate(
      email,
      'Welcome to AI Agent CRM!',
      'welcome',
      data
    );
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const data = {
      name: email.split('@')[0], // Use email prefix as name
      resetUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@aiagentcrm.com'
    };

    return this.sendEmailWithTemplate(
      email,
      'Password Reset Request - AI Agent CRM',
      'password-reset',
      data
    );
  }

  // Send lead notification email
  async sendLeadNotificationEmail(email, name, leadData) {
    const data = {
      name,
      leadName: leadData.name,
      leadPhone: leadData.phone,
      leadEmail: leadData.email,
      leadSource: leadData.source,
      leadScore: leadData.score,
      dashboardUrl: `${process.env.FRONTEND_URL}/leads/${leadData._id}`
    };

    return this.sendEmailWithTemplate(
      email,
      'New Lead Alert - AI Agent CRM',
      'lead-notification',
      data
    );
  }

  // Send subscription update email
  async sendSubscriptionUpdateEmail(email, name, subscriptionData) {
    const data = {
      name,
      planName: subscriptionData.planName,
      status: subscriptionData.status,
      nextBilling: subscriptionData.nextBilling,
      amount: subscriptionData.amount,
      dashboardUrl: `${process.env.FRONTEND_URL}/billing`
    };

    return this.sendEmailWithTemplate(
      email,
      'Subscription Update - AI Agent CRM',
      'subscription-update',
      data
    );
  }

  // Send system notification email
  async sendSystemNotificationEmail(email, name, title, message) {
    const data = {
      name,
      title,
      message
    };

    return this.sendEmailWithTemplate(
      email,
      `${title} - AI Agent CRM`,
      'system-notification',
      data
    );
  }

  // Send email via queue
  async sendEmailViaQueue(to, subject, templateName, data, options = {}) {
    try {
      const job = await queueManager.addJob('email', 'send-template', {
        to,
        subject,
        templateName,
        data,
        options
      });

      logger.info(`Email queued for ${to} using template ${templateName}: ${job.id}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error(`Failed to queue email for ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, subject, templateName, dataGenerator, options = {}) {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        const data = dataGenerator(recipient);
        const result = await this.sendEmailWithTemplate(
          recipient.email,
          subject,
          templateName,
          data,
          options
        );
        
        results.push({ recipient, ...result });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const successCount = results.filter(r => r.success).length;
      logger.info(`Bulk email sent: ${successCount}/${recipients.length} successful`);
      
      return { success: true, results, successCount };
    } catch (error) {
      logger.error('Failed to send bulk emails:', error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk emails via queue
  async sendBulkEmailsViaQueue(recipients, subject, templateName, dataGenerator, options = {}) {
    try {
      const jobs = [];
      
      for (const recipient of recipients) {
        const data = dataGenerator(recipient);
        const job = await queueManager.addJob('email', 'send-template', {
          to: recipient.email,
          subject,
          templateName,
          data,
          options
        });
        
        jobs.push({ recipient, jobId: job.id });
      }
      
      logger.info(`Bulk emails queued: ${recipients.length} jobs created`);
      return { success: true, jobs };
    } catch (error) {
      logger.error('Failed to queue bulk emails:', error);
      return { success: false, error: error.message };
    }
  }

  // Get email statistics
  async getEmailStats() {
    try {
      const stats = await queueManager.getQueueStats();
      return {
        success: true,
        emailQueue: stats.email || {},
        service: process.env.EMAIL_SERVICE || 'gmail',
        templates: Array.from(this.templates.keys())
      };
    } catch (error) {
      logger.error('Failed to get email stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email service
  async testEmailService(to) {
    try {
      const result = await this.sendEmail(
        to,
        'Test Email - AI Agent CRM',
        '<h1>Test Email</h1><p>This is a test email from AI Agent CRM.</p>'
      );

      return result;
    } catch (error) {
      logger.error('Email service test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmail({ to, subject, html, text, template, variables = {} }) {
    if (!this.settings.enabled) {
      logger.info('Email sending disabled - email not sent');
      return { success: true, message: 'Email sending disabled' };
    }

    if (this.settings.test_mode) {
      logger.info('Test mode - email not actually sent', { to, subject });
      return { success: true, message: 'Test mode - email logged only' };
    }

    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      // Process template if provided
      if (template && !html) {
        const templateData = this.getTemplate(template);
        if (templateData) {
          html = this.processTemplate(templateData.html_content, variables);
          text = this.processTemplate(templateData.text_content, variables);
          subject = subject || this.processTemplate(templateData.subject, variables);
        }
      }

      const mailOptions = {
        from: `${this.settings.from_name} <${this.settings.from_email}>`,
        to: to,
        subject: subject,
        html: html,
        text: text,
        replyTo: this.settings.reply_to
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', { 
        to, 
        subject, 
        messageId: result.messageId 
      });

      // Log email activity
      this.logEmailActivity({
        to,
        subject,
        template,
        status: 'sent',
        message_id: result.messageId
      });

      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully' 
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      
      // Log failed email activity
      this.logEmailActivity({
        to,
        subject,
        template,
        status: 'failed',
        error: error.message
      });

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  processTemplate(template, variables) {
    if (!template) return '';
    
    let processed = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    
    return processed;
  }

  getTemplate(templateId) {
    const templates = this.getDefaultTemplates();
    return templates.find(t => t.id === templateId);
  }

  getDefaultTemplates() {
    return [
      {
        id: 'user_registration',
        name: 'User Registration Welcome',
        subject: 'Welcome to AI Agent CRM - {{user_name}}!',
        category: 'Authentication',
        variables: ['user_name', 'email', 'activation_link'],
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to AI Agent CRM</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .button { background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #2196F3;">Welcome to AI Agent CRM!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{user_name}}!</h2>
            <p>Thank you for joining AI Agent CRM. We're excited to have you on board!</p>
            <p>Your account has been created with the email: <strong>{{email}}</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{activation_link}}" class="button">Activate Your Account</a>
            </div>
            
            <p>If you didn't create this account, please ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>&copy; 2025 AI Agent CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
        text_content: `Hello {{user_name}}!\n\nThank you for joining AI Agent CRM. Please activate your account by clicking: {{activation_link}}\n\nBest regards,\nAI Agent CRM Team`
      },
      {
        id: 'trial_expire',
        name: 'Trial Expiration Notice',
        subject: 'Your AI Agent CRM trial expires in {{days_left}} days',
        category: 'Subscription',
        variables: ['user_name', 'days_left', 'upgrade_link'],
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trial Expiring Soon</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .warning { background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #FF9800; }
        .button { background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .features { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color: #FF9800; text-align: center;">Trial Expiring Soon</h1>
        
        <div class="warning">
            <h2>Hi {{user_name}},</h2>
            <p>Your free trial will expire in <strong>{{days_left}} days</strong>.</p>
            <p>Don't lose access to all the amazing features of AI Agent CRM!</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{upgrade_link}}" class="button">Upgrade Now</a>
            </div>
        </div>
        
        <div class="features">
            <h3>What you'll keep with a paid plan:</h3>
            <ul>
                <li>Unlimited leads management</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Custom integrations</li>
            </ul>
        </div>
    </div>
</body>
</html>`,
        text_content: `Hi {{user_name}},\n\nYour free trial expires in {{days_left}} days. Upgrade now: {{upgrade_link}}\n\nBest regards,\nAI Agent CRM Team`
      },
      {
        id: 'plan_purchase',
        name: 'Plan Purchase Confirmation',
        subject: 'Plan Purchase Successful - {{plan_name}}',
        category: 'Billing',
        variables: ['user_name', 'plan_name', 'amount', 'billing_date', 'invoice_link'],
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Plan Purchase Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background: #d4edda; padding: 20px; border-radius: 10px; border-left: 4px solid #4CAF50; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color: #4CAF50; text-align: center;">Purchase Successful!</h1>
        
        <div class="success">
            <h2>Thank you {{user_name}}!</h2>
            <p>Your purchase of the <strong>{{plan_name}}</strong> plan has been processed successfully.</p>
            
            <div class="details">
                <h3>Purchase Details:</h3>
                <p><strong>Plan:</strong> {{plan_name}}</p>
                <p><strong>Amount:</strong> ₹{{amount}}</p>
                <p><strong>Next Billing:</strong> {{billing_date}}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{invoice_link}}" class="button">Download Invoice</a>
            </div>
        </div>
    </div>
</body>
</html>`,
        text_content: `Thank you {{user_name}}! Your {{plan_name}} plan purchase for ₹{{amount}} was successful. Next billing: {{billing_date}}\n\nDownload invoice: {{invoice_link}}`
      },
      {
        id: 'payment_success',
        name: 'Payment Confirmation',
        subject: 'Payment Received - ₹{{amount}}',
        category: 'Billing',
        variables: ['user_name', 'amount', 'transaction_id', 'payment_date', 'receipt_link'],
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .payment { background: #e3f2fd; padding: 20px; border-radius: 10px; border-left: 4px solid #2196F3; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color: #2196F3; text-align: center;">Payment Received</h1>
        
        <div class="payment">
            <h2>Hi {{user_name}},</h2>
            <p>We've successfully received your payment of <strong>₹{{amount}}</strong>.</p>
            
            <div class="details">
                <h3>Payment Details:</h3>
                <p><strong>Amount:</strong> ₹{{amount}}</p>
                <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
                <p><strong>Date:</strong> {{payment_date}}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{receipt_link}}" class="button">Download Receipt</a>
            </div>
        </div>
    </div>
</body>
</html>`,
        text_content: `Hi {{user_name}},\n\nPayment of ₹{{amount}} received successfully.\nTransaction ID: {{transaction_id}}\nDate: {{payment_date}}\n\nDownload receipt: {{receipt_link}}`
      },
      {
        id: 'password_reset',
        name: 'Password Reset Request',
        subject: 'Reset Your AI Agent CRM Password',
        category: 'Authentication',
        variables: ['user_name', 'reset_link', 'expiry_time'],
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .reset { background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #FF5722; }
        .button { background: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .warning { background: #f8d7da; padding: 10px; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color: #FF5722; text-align: center;">Password Reset Request</h1>
        
        <div class="reset">
            <h2>Hi {{user_name}},</h2>
            <p>We received a request to reset your password for your AI Agent CRM account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_link}}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <p><strong>Important:</strong> This link will expire in {{expiry_time}}.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        text_content: `Hi {{user_name}},\n\nReset your password using this link: {{reset_link}}\n\nLink expires in {{expiry_time}}.\n\nIf you didn't request this, ignore this email.`
      }
    ];
  }

  logEmailActivity(data) {
    // In a real application, save to database
    logger.info('Email activity logged', data);
  }

  // Convenience methods for specific email types
  async sendWelcomeEmail(user, activationLink) {
    return this.sendEmail({
      to: user.email,
      template: 'user_registration',
      variables: {
        user_name: user.name || user.email.split('@')[0],
        email: user.email,
        activation_link: activationLink
      }
    });
  }

  async sendTrialExpirationEmail(user, daysLeft, upgradeLink) {
    return this.sendEmail({
      to: user.email,
      template: 'trial_expire',
      variables: {
        user_name: user.name || user.email.split('@')[0],
        days_left: daysLeft,
        upgrade_link: upgradeLink
      }
    });
  }

  async sendPlanPurchaseEmail(user, plan, amount, billingDate, invoiceLink) {
    return this.sendEmail({
      to: user.email,
      template: 'plan_purchase',
      variables: {
        user_name: user.name || user.email.split('@')[0],
        plan_name: plan.name,
        amount: amount,
        billing_date: billingDate,
        invoice_link: invoiceLink
      }
    });
  }

  async sendPaymentConfirmationEmail(user, amount, transactionId, paymentDate, receiptLink) {
    return this.sendEmail({
      to: user.email,
      template: 'payment_success',
      variables: {
        user_name: user.name || user.email.split('@')[0],
        amount: amount,
        transaction_id: transactionId,
        payment_date: paymentDate,
        receipt_link: receiptLink
      }
    });
  }

  async sendPasswordResetEmail(user, resetLink, expiryTime = '1 hour') {
    return this.sendEmail({
      to: user.email,
      template: 'password_reset',
      variables: {
        user_name: user.name || user.email.split('@')[0],
        reset_link: resetLink,
        expiry_time: expiryTime
      }
    });
  }

  async sendTestEmail(to, subject = 'Test Email from AI Agent CRM') {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2196F3;">Test Email Successful!</h2>
        <p>This is a test email from AI Agent CRM.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: 'Test email from AI Agent CRM - SMTP configuration is working!'
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export singleton and class
module.exports = {
  emailService,
  EmailService
}; 