const { google } = require('googleapis');
const axios = require('axios');
const logger = require('./logger');
const { cacheManager } = require('./cache');
const { queueManager } = require('./queue');

class IntegrationsService {
  constructor() {
    this.isInitialized = false;
    this.googleAuth = null;
  }

  // Initialize integrations service
  async initialize() {
    try {
      this.isInitialized = true;
      logger.info('Integrations service initialized');
    } catch (error) {
      logger.error('Failed to initialize integrations service:', error);
      throw error;
    }
  }

  // Google Sheets Integration
  async setupGoogleSheets(userId, credentials) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      // Store credentials securely
      await cacheManager.hset(`google_credentials:${userId}`, 'sheets', credentials);
      
      logger.info(`Google Sheets setup completed for user ${userId}`);
      return { success: true, message: 'Google Sheets connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup Google Sheets for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async importFromGoogleSheets(userId, spreadsheetId, range) {
    try {
      const credentials = await cacheManager.hget(`google_credentials:${userId}`, 'sheets');
      if (!credentials) {
        throw new Error('Google Sheets not connected');
      }

      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return { success: false, error: 'No data found in spreadsheet' };
      }

      // Process headers
      const headers = rows[0];
      const data = rows.slice(1);

      // Map data to leads
      const leads = data.map(row => {
        const lead = {};
        headers.forEach((header, index) => {
          const value = row[index] || '';
          switch (header.toLowerCase()) {
            case 'name':
            case 'full name':
            case 'contact name':
              lead.name = value;
              break;
            case 'email':
            case 'email address':
              lead.email = value;
              break;
            case 'phone':
            case 'phone number':
            case 'mobile':
              lead.phone = value;
              break;
            case 'company':
            case 'organization':
              lead.company = value;
              break;
            case 'source':
            case 'lead source':
              lead.source = value;
              break;
            case 'notes':
            case 'description':
            case 'comments':
              lead.notes = value;
              break;
            default:
              lead[header] = value;
          }
        });
        return lead;
      });

      // Queue lead import
      await queueManager.addJob('lead-scoring', 'bulk-import', {
        userId,
        leads,
        source: 'google_sheets',
        spreadsheetId
      });

      logger.info(`Imported ${leads.length} leads from Google Sheets for user ${userId}`);
      return { success: true, leadsCount: leads.length };
    } catch (error) {
      logger.error(`Failed to import from Google Sheets for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Facebook Ads Integration
  async setupFacebookAds(userId, accessToken) {
    try {
      // Verify access token
      const response = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
      
      if (response.data.error) {
        throw new Error('Invalid Facebook access token');
      }

      // Store access token securely
      await cacheManager.hset(`facebook_credentials:${userId}`, 'access_token', accessToken);
      await cacheManager.hset(`facebook_credentials:${userId}`, 'user_id', response.data.id);

      logger.info(`Facebook Ads setup completed for user ${userId}`);
      return { success: true, message: 'Facebook Ads connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup Facebook Ads for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async importLeadsFromFacebookAds(userId, adAccountId, dateRange) {
    try {
      const accessToken = await cacheManager.hget(`facebook_credentials:${userId}`, 'access_token');
      if (!accessToken) {
        throw new Error('Facebook Ads not connected');
      }

      const { startDate, endDate } = dateRange;
      
      // Get lead ads data
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${adAccountId}/leads`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,created_time,field_data,ad_id,ad_name,form_id,form_name',
            time_range: JSON.stringify({
              since: startDate,
              until: endDate
            })
          }
        }
      );

      const leads = response.data.data.map(lead => {
        const fieldData = {};
        lead.field_data.forEach(field => {
          fieldData[field.name] = field.values[0];
        });

        return {
          name: fieldData.full_name || fieldData.name || fieldData.first_name,
          email: fieldData.email,
          phone: fieldData.phone_number || fieldData.phone,
          company: fieldData.company_name || fieldData.organization,
          source: 'facebook_ads',
          sourceId: lead.id,
          adId: lead.ad_id,
          adName: lead.ad_name,
          formId: lead.form_id,
          formName: lead.form_name,
          notes: `Imported from Facebook Ad: ${lead.ad_name}`,
          metadata: {
            facebookLeadId: lead.id,
            adId: lead.ad_id,
            formId: lead.form_id,
            createdTime: lead.created_time
          }
        };
      });

      // Queue lead import
      await queueManager.addJob('lead-scoring', 'bulk-import', {
        userId,
        leads,
        source: 'facebook_ads',
        adAccountId
      });

      logger.info(`Imported ${leads.length} leads from Facebook Ads for user ${userId}`);
      return { success: true, leadsCount: leads.length };
    } catch (error) {
      logger.error(`Failed to import leads from Facebook Ads for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // HubSpot Integration
  async setupHubSpot(userId, apiKey) {
    try {
      // Verify API key
      const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: { limit: 1 }
      });

      // Store API key securely
      await cacheManager.hset(`hubspot_credentials:${userId}`, 'api_key', apiKey);

      logger.info(`HubSpot setup completed for user ${userId}`);
      return { success: true, message: 'HubSpot connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup HubSpot for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async importLeadsFromHubSpot(userId, dateRange) {
    try {
      const apiKey = await cacheManager.hget(`hubspot_credentials:${userId}`, 'api_key');
      if (!apiKey) {
        throw new Error('HubSpot not connected');
      }

      const { startDate, endDate } = dateRange;
      
      // Get contacts from HubSpot
      const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 100,
          after: 0,
          properties: 'firstname,lastname,email,phone,company,lifecyclestage,lead_status'
        }
      });

      const leads = response.data.results.map(contact => {
        const properties = contact.properties;
        return {
          name: `${properties.firstname || ''} ${properties.lastname || ''}`.trim(),
          email: properties.email,
          phone: properties.phone,
          company: properties.company,
          source: 'hubspot',
          sourceId: contact.id,
          status: properties.lead_status || properties.lifecyclestage || 'New',
          notes: `Imported from HubSpot contact: ${contact.id}`,
          metadata: {
            hubspotContactId: contact.id,
            lifecycleStage: properties.lifecyclestage,
            leadStatus: properties.lead_status
          }
        };
      });

      // Queue lead import
      await queueManager.addJob('lead-scoring', 'bulk-import', {
        userId,
        leads,
        source: 'hubspot'
      });

      logger.info(`Imported ${leads.length} leads from HubSpot for user ${userId}`);
      return { success: true, leadsCount: leads.length };
    } catch (error) {
      logger.error(`Failed to import leads from HubSpot for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Salesforce Integration
  async setupSalesforce(userId, credentials) {
    try {
      const { username, password, securityToken, instanceUrl } = credentials;
      
      // Verify credentials by making a test API call
      const response = await axios.post(`${instanceUrl}/services/oauth2/token`, {
        grant_type: 'password',
        username,
        password: password + securityToken,
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET
      });

      // Store credentials securely
      await cacheManager.hset(`salesforce_credentials:${userId}`, 'access_token', response.data.access_token);
      await cacheManager.hset(`salesforce_credentials:${userId}`, 'instance_url', instanceUrl);

      logger.info(`Salesforce setup completed for user ${userId}`);
      return { success: true, message: 'Salesforce connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup Salesforce for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async importLeadsFromSalesforce(userId, dateRange) {
    try {
      const accessToken = await cacheManager.hget(`salesforce_credentials:${userId}`, 'access_token');
      const instanceUrl = await cacheManager.hget(`salesforce_credentials:${userId}`, 'instance_url');
      
      if (!accessToken || !instanceUrl) {
        throw new Error('Salesforce not connected');
      }

      const { startDate, endDate } = dateRange;
      
      // Get leads from Salesforce
      const response = await axios.get(`${instanceUrl}/services/data/v58.0/query`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          q: `SELECT Id, FirstName, LastName, Email, Phone, Company, LeadSource, Status, Description, CreatedDate FROM Lead WHERE CreatedDate >= ${startDate} AND CreatedDate <= ${endDate}`
        }
      });

      const leads = response.data.records.map(lead => ({
        name: `${lead.FirstName || ''} ${lead.LastName || ''}`.trim(),
        email: lead.Email,
        phone: lead.Phone,
        company: lead.Company,
        source: lead.LeadSource || 'salesforce',
        sourceId: lead.Id,
        status: lead.Status,
        notes: lead.Description,
        metadata: {
          salesforceLeadId: lead.Id,
          leadSource: lead.LeadSource,
          createdDate: lead.CreatedDate
        }
      }));

      // Queue lead import
      await queueManager.addJob('lead-scoring', 'bulk-import', {
        userId,
        leads,
        source: 'salesforce'
      });

      logger.info(`Imported ${leads.length} leads from Salesforce for user ${userId}`);
      return { success: true, leadsCount: leads.length };
    } catch (error) {
      logger.error(`Failed to import leads from Salesforce for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Zapier Integration
  async setupZapier(userId, webhookUrl) {
    try {
      // Test webhook
      const response = await axios.post(webhookUrl, {
        test: true,
        timestamp: new Date().toISOString()
      });

      if (response.status !== 200) {
        throw new Error('Invalid webhook URL');
      }

      // Store webhook URL
      await cacheManager.hset(`zapier_credentials:${userId}`, 'webhook_url', webhookUrl);

      logger.info(`Zapier setup completed for user ${userId}`);
      return { success: true, message: 'Zapier connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup Zapier for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendToZapier(userId, data) {
    try {
      const webhookUrl = await cacheManager.hget(`zapier_credentials:${userId}`, 'webhook_url');
      if (!webhookUrl) {
        throw new Error('Zapier not connected');
      }

      const response = await axios.post(webhookUrl, {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'ai_agent_crm'
      });

      logger.info(`Data sent to Zapier for user ${userId}`);
      return { success: true, response: response.data };
    } catch (error) {
      logger.error(`Failed to send data to Zapier for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Webhook Integration
  async setupWebhook(userId, webhookConfig) {
    try {
      const { url, events, headers } = webhookConfig;
      
      // Test webhook
      const response = await axios.post(url, {
        event: 'test',
        timestamp: new Date().toISOString()
      }, { headers });

      if (response.status !== 200) {
        throw new Error('Invalid webhook URL');
      }

      // Store webhook configuration
      await cacheManager.hset(`webhook_config:${userId}`, 'config', JSON.stringify(webhookConfig));

      logger.info(`Webhook setup completed for user ${userId}`);
      return { success: true, message: 'Webhook connected successfully' };
    } catch (error) {
      logger.error(`Failed to setup webhook for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async triggerWebhook(userId, event, data) {
    try {
      const configStr = await cacheManager.hget(`webhook_config:${userId}`, 'config');
      if (!configStr) {
        throw new Error('Webhook not configured');
      }

      const config = JSON.parse(configStr);
      
      // Check if event is configured
      if (!config.events.includes(event)) {
        return { success: true, message: 'Event not configured for webhook' };
      }

      const response = await axios.post(config.url, {
        event,
        data,
        timestamp: new Date().toISOString(),
        source: 'ai_agent_crm'
      }, { headers: config.headers });

      logger.info(`Webhook triggered for user ${userId}, event: ${event}`);
      return { success: true, response: response.data };
    } catch (error) {
      logger.error(`Failed to trigger webhook for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get integration status
  async getIntegrationStatus(userId) {
    try {
      const integrations = {};
      
      // Check Google Sheets
      const googleSheets = await cacheManager.hget(`google_credentials:${userId}`, 'sheets');
      integrations.googleSheets = !!googleSheets;
      
      // Check Facebook Ads
      const facebookAds = await cacheManager.hget(`facebook_credentials:${userId}`, 'access_token');
      integrations.facebookAds = !!facebookAds;
      
      // Check HubSpot
      const hubspot = await cacheManager.hget(`hubspot_credentials:${userId}`, 'api_key');
      integrations.hubspot = !!hubspot;
      
      // Check Salesforce
      const salesforce = await cacheManager.hget(`salesforce_credentials:${userId}`, 'access_token');
      integrations.salesforce = !!salesforce;
      
      // Check Zapier
      const zapier = await cacheManager.hget(`zapier_credentials:${userId}`, 'webhook_url');
      integrations.zapier = !!zapier;
      
      // Check Webhook
      const webhook = await cacheManager.hget(`webhook_config:${userId}`, 'config');
      integrations.webhook = !!webhook;

      return { success: true, integrations };
    } catch (error) {
      logger.error(`Failed to get integration status for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Disconnect integration
  async disconnectIntegration(userId, integration) {
    try {
      switch (integration) {
        case 'googleSheets':
          await cacheManager.del(`google_credentials:${userId}`);
          break;
        case 'facebookAds':
          await cacheManager.del(`facebook_credentials:${userId}`);
          break;
        case 'hubspot':
          await cacheManager.del(`hubspot_credentials:${userId}`);
          break;
        case 'salesforce':
          await cacheManager.del(`salesforce_credentials:${userId}`);
          break;
        case 'zapier':
          await cacheManager.del(`zapier_credentials:${userId}`);
          break;
        case 'webhook':
          await cacheManager.del(`webhook_config:${userId}`);
          break;
        default:
          throw new Error('Invalid integration');
      }

      logger.info(`Integration ${integration} disconnected for user ${userId}`);
      return { success: true, message: `${integration} disconnected successfully` };
    } catch (error) {
      logger.error(`Failed to disconnect integration ${integration} for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const integrationsService = new IntegrationsService();

// Export singleton and class
module.exports = {
  integrationsService,
  IntegrationsService
}; 