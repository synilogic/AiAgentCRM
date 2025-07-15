const _ = require('lodash');
const moment = require('moment');

class SamplePlugin {
  constructor() {
    this.name = 'sample-plugin';
    this.version = '1.0.0';
    this.startTime = new Date();
  }

  /**
   * Plugin initialization
   */
  async init(context) {
    this.context = context;
    this.api = context.api;
    this.settings = context.plugin.settings;
    
    console.log(`[${this.name}] Plugin initialized successfully`);
    console.log(`[${this.name}] Settings:`, this.settings);
    
    // Register event listeners
    this.registerEventListeners();
    
    return this;
  }

  /**
   * Register event listeners
   */
  registerEventListeners() {
    // Listen for lead creation events
    this.api.events.on('lead:created', this.onLeadCreated.bind(this));
    
    // Listen for plugin system events
    this.api.events.on('plugin:loaded', this.onPluginLoaded.bind(this));
  }

  /**
   * Route handler: GET /hello
   */
  async getHello(req, res) {
    try {
      const uptime = Date.now() - this.startTime.getTime();
      
      res.json({
        message: 'Hello from Sample Plugin!',
        plugin: {
          name: this.name,
          version: this.version,
          uptime: moment.duration(uptime).humanize(),
          settings: this.settings
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[${this.name}] Error in getHello:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Route handler: GET /leads/sample
   */
  async getSampleLeads(req, res) {
    try {
      const { limit = 10 } = req.query;
      const maxResults = Math.min(limit, this.settings.maxResults || 10);
      
      // Fetch leads using the CRM API
      const leads = await this.api.models.Lead.find()
        .limit(maxResults)
        .sort({ createdAt: -1 });
      
      // Process leads with plugin-specific logic
      const processedLeads = leads.map(lead => ({
        id: lead._id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        score: lead.score,
        priority: lead.priority,
        pluginData: {
          processed: true,
          timestamp: new Date().toISOString(),
          classification: this.classifyLead(lead)
        }
      }));
      
      res.json({
        success: true,
        data: processedLeads,
        meta: {
          total: processedLeads.length,
          plugin: this.name,
          processedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`[${this.name}] Error in getSampleLeads:`, error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  /**
   * Route handler: POST /leads/sample
   */
  async createSampleLead(req, res) {
    try {
      const { name, email, company } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }
      
      // Create lead using the CRM API
      const leadData = {
        name,
        email,
        company: company || 'Unknown',
        source: 'sample-plugin',
        score: this.calculateInitialScore(req.body),
        priority: 'medium',
        notes: `Lead created by ${this.name} plugin`,
        tags: ['sample-plugin', 'automated'],
        customFields: {
          pluginCreated: true,
          pluginName: this.name,
          createdAt: new Date().toISOString()
        }
      };
      
      const lead = new this.api.models.Lead(leadData);
      await lead.save();
      
      // Create activity record
      const activity = new this.api.models.Activity({
        userId: req.user?._id,
        leadId: lead._id,
        type: 'lead_created',
        description: `Lead created by ${this.name} plugin`,
        source: 'plugin',
        platform: 'api',
        metadata: {
          pluginName: this.name,
          pluginVersion: this.version
        }
      });
      
      await activity.save();
      
      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead created successfully by sample plugin'
      });
    } catch (error) {
      console.error(`[${this.name}] Error in createSampleLead:`, error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }

  /**
   * Classify lead based on plugin logic
   */
  classifyLead(lead) {
    if (lead.score >= 80) return 'hot';
    if (lead.score >= 60) return 'warm';
    if (lead.score >= 40) return 'lukewarm';
    return 'cold';
  }

  /**
   * Calculate initial score for new leads
   */
  calculateInitialScore(leadData) {
    let score = 50; // base score
    
    if (leadData.company && leadData.company !== 'Unknown') {
      score += 10;
    }
    
    if (leadData.phone) {
      score += 10;
    }
    
    if (leadData.email && leadData.email.includes('@')) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Event handler: Lead created
   */
  async onLeadCreated(lead) {
    console.log(`[${this.name}] New lead created: ${lead.name} (${lead.email})`);
    
    // Plugin-specific processing
    if (this.settings.enableNotifications) {
      console.log(`[${this.name}] Processing lead notification for ${lead.name}`);
      
      // Here you could send notifications, trigger workflows, etc.
      // For example, create a notification
      try {
        const notification = new this.api.models.Notification({
          userId: lead.userId,
          title: 'New Lead Processed',
          message: `Lead ${lead.name} has been processed by ${this.name}`,
          type: 'info',
          category: 'lead',
          metadata: {
            leadId: lead._id,
            pluginName: this.name,
            classification: this.classifyLead(lead)
          }
        });
        
        await notification.save();
      } catch (error) {
        console.error(`[${this.name}] Error creating notification:`, error);
      }
    }
  }

  /**
   * Event handler: Plugin loaded
   */
  onPluginLoaded(plugin) {
    if (plugin.name !== this.name) {
      console.log(`[${this.name}] Another plugin loaded: ${plugin.name}`);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      // Check database connectivity
      await this.api.models.Lead.findOne().limit(1);
      
      // Check settings
      if (!this.settings.apiKey) {
        return {
          status: 'warning',
          message: 'API key not configured'
        };
      }
      
      return {
        status: 'healthy',
        uptime: Date.now() - this.startTime.getTime(),
        message: 'Plugin is running normally'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Plugin cleanup
   */
  async cleanup() {
    console.log(`[${this.name}] Cleaning up plugin resources...`);
    
    // Remove event listeners
    this.api.events.removeAllListeners('lead:created');
    this.api.events.removeAllListeners('plugin:loaded');
    
    // Clean up any timers, connections, etc.
    console.log(`[${this.name}] Cleanup completed`);
  }

  /**
   * Plugin configuration update
   */
  async updateConfiguration(newSettings) {
    console.log(`[${this.name}] Updating configuration:`, newSettings);
    
    this.settings = { ...this.settings, ...newSettings };
    
    // React to configuration changes
    if (newSettings.hasOwnProperty('enableNotifications')) {
      console.log(`[${this.name}] Notifications ${newSettings.enableNotifications ? 'enabled' : 'disabled'}`);
    }
    
    return this.settings;
  }
}

// Export plugin class
module.exports = SamplePlugin; 