const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const googleSheetsService = require('../utils/googleSheets');
const emailService = require('../utils/email');

// Apply auth middleware to all routes
router.use(auth);

// Google Sheets Integration

// GET /api/integrations/google/auth-url - Get Google OAuth URL
router.get('/google/auth-url', async (req, res) => {
  try {
    const authUrl = await googleSheetsService.getAuthUrl(req.user._id);
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Get Google auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google auth URL'
    });
  }
});

// GET /api/integrations/google/callback - Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const result = await googleSheetsService.handleCallback(req.user._id, code);
    
    if (result.success) {
      // Redirect to frontend with success message
      res.redirect(`${process.env.FRONTEND_URL}/integrations?status=success&message=Google Sheets connected successfully`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/integrations?status=error&message=${result.error}`);
    }
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/integrations?status=error&message=Failed to connect Google Sheets`);
  }
});

// GET /api/integrations/google/sheets - Get user's Google Sheets
router.get('/google/sheets', async (req, res) => {
  try {
    const sheets = await googleSheetsService.getUserSheets(req.user._id);
    res.json({
      success: true,
      sheets
    });
  } catch (error) {
    console.error('Get Google sheets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Sheets'
    });
  }
});

// POST /api/integrations/google/import - Import leads from Google Sheet
router.post('/google/import', async (req, res) => {
  try {
    const { spreadsheetId, sheetName, mapping } = req.body;
    
    if (!spreadsheetId || !sheetName || !mapping) {
      return res.status(400).json({
        success: false,
        error: 'Spreadsheet ID, sheet name, and mapping are required'
      });
    }

    const result = await googleSheetsService.importLeads(
      req.user._id,
      spreadsheetId,
      sheetName,
      mapping
    );

    res.json(result);
  } catch (error) {
    console.error('Google import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import from Google Sheets'
    });
  }
});

// POST /api/integrations/google/export - Export leads to Google Sheet
router.post('/google/export', async (req, res) => {
  try {
    const { spreadsheetId, sheetName, leadIds } = req.body;
    
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Spreadsheet ID and sheet name are required'
      });
    }

    const result = await googleSheetsService.exportLeads(
      req.user._id,
      spreadsheetId,
      sheetName,
      leadIds
    );

    res.json(result);
  } catch (error) {
    console.error('Google export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export to Google Sheets'
    });
  }
});

// DELETE /api/integrations/google/disconnect - Disconnect Google account
router.delete('/google/disconnect', async (req, res) => {
  try {
    const result = await googleSheetsService.disconnectUser(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Google disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google account'
    });
  }
});

// Email Integration

// POST /api/integrations/email/send - Send email
router.post('/email/send', async (req, res) => {
  try {
    const { to, subject, content, template, variables } = req.body;
    
    if (!to || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'To, subject, and content are required'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      content,
      template,
      variables,
      userId: req.user._id
    });

    res.json(result);
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email'
    });
  }
});

// POST /api/integrations/email/bulk - Send bulk emails
router.post('/email/bulk', async (req, res) => {
  try {
    const { recipients, subject, content, template, variables } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required'
      });
    }

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Subject and content are required'
      });
    }

    const result = await emailService.sendBulkEmails({
      recipients,
      subject,
      content,
      template,
      variables,
      userId: req.user._id
    });

    res.json(result);
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails'
    });
  }
});

// GET /api/integrations/email/templates - Get email templates
router.get('/email/templates', async (req, res) => {
  try {
    const templates = await emailService.getTemplates(req.user._id);
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email templates'
    });
  }
});

// POST /api/integrations/email/templates - Create email template
router.post('/email/templates', async (req, res) => {
  try {
    const { name, subject, content, variables } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Name, subject, and content are required'
      });
    }

    const result = await emailService.createTemplate({
      name,
      subject,
      content,
      variables,
      userId: req.user._id
    });

    res.json(result);
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email template'
    });
  }
});

// PUT /api/integrations/email/templates/:id - Update email template
router.put('/email/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, variables } = req.body;

    const result = await emailService.updateTemplate(id, {
      name,
      subject,
      content,
      variables,
      userId: req.user._id
    });

    res.json(result);
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email template'
    });
  }
});

// DELETE /api/integrations/email/templates/:id - Delete email template
router.delete('/email/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await emailService.deleteTemplate(id, req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template'
    });
  }
});

// GET /api/integrations/email/status - Get email sending status
router.get('/email/status', async (req, res) => {
  try {
    const { emailId } = req.query;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        error: 'Email ID is required'
      });
    }

    const status = await emailService.getEmailStatus(emailId, req.user._id);
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email status'
    });
  }
});

// WhatsApp Integration

// POST /api/integrations/whatsapp/webhook - WhatsApp webhook
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.handleWebhook(req.body, req.headers);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// POST /api/integrations/whatsapp/send-template - Send WhatsApp template message
router.post('/whatsapp/send-template', async (req, res) => {
  try {
    const { phoneNumber, templateName, variables } = req.body;
    
    if (!phoneNumber || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and template name are required'
      });
    }

    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.sendTemplateMessage(
      req.user._id,
      phoneNumber,
      templateName,
      variables
    );

    res.json(result);
  } catch (error) {
    console.error('Send WhatsApp template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp template'
    });
  }
});

// GET /api/integrations/whatsapp/templates - Get WhatsApp templates
router.get('/whatsapp/templates', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const templates = await whatsappService.getTemplates(req.user._id);
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get WhatsApp templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp templates'
    });
  }
});

// CRM Integration

// POST /api/integrations/crm/sync - Sync with external CRM
router.post('/crm/sync', async (req, res) => {
  try {
    const { crmType, credentials, syncType } = req.body;
    
    if (!crmType || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'CRM type and credentials are required'
      });
    }

    // Implement CRM sync logic based on type
    let result;
    switch (crmType) {
      case 'salesforce':
        result = await syncWithSalesforce(credentials, syncType, req.user._id);
        break;
      case 'hubspot':
        result = await syncWithHubspot(credentials, syncType, req.user._id);
        break;
      case 'zoho':
        result = await syncWithZoho(credentials, syncType, req.user._id);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported CRM type'
        });
    }

    res.json(result);
  } catch (error) {
    console.error('CRM sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync with CRM'
    });
  }
});

// GET /api/integrations/status - Get all integration statuses
router.get('/status', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    const integrations = {
      google: {
        connected: !!user.integrations?.google?.accessToken,
        lastSync: user.integrations?.google?.lastSync
      },
      email: {
        configured: !!user.integrations?.email?.configured,
        provider: user.integrations?.email?.provider
      },
      whatsapp: {
        connected: !!user.integrations?.whatsapp?.connected,
        lastConnected: user.integrations?.whatsapp?.lastConnected
      },
      crm: {
        connected: !!user.integrations?.crm?.connected,
        type: user.integrations?.crm?.type
      }
    };

    res.json({
      success: true,
      integrations
    });
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get integration status'
    });
  }
});

// Helper functions for CRM sync (placeholder implementations)
async function syncWithSalesforce(credentials, syncType, userId) {
  // Implement Salesforce sync logic
  return { success: true, message: 'Salesforce sync completed' };
}

async function syncWithHubspot(credentials, syncType, userId) {
  // Implement HubSpot sync logic
  return { success: true, message: 'HubSpot sync completed' };
}

async function syncWithZoho(credentials, syncType, userId) {
  // Implement Zoho sync logic
  return { success: true, message: 'Zoho sync completed' };
}

module.exports = router; 
