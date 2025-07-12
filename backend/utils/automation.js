const cron = require('node-cron');
const openaiService = require('./openai');
const whatsappService = require('./whatsapp');
const emailService = require('./email');

class AutomationService {
  constructor() {
    this.workflows = new Map();
    this.scheduledTasks = new Map();
    this.isInitialized = false;
  }

  // Initialize automation service
  async initialize() {
    if (this.isInitialized) return;

    // Schedule daily tasks
    this.scheduleDailyTasks();
    
    // Schedule hourly tasks
    this.scheduleHourlyTasks();
    
    // Load saved workflows
    await this.loadWorkflows();
    
    this.isInitialized = true;
    console.log('Automation service initialized');
  }

  // Schedule daily automation tasks
  scheduleDailyTasks() {
    // Daily lead follow-up check at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.processDailyFollowups();
    });

    // Daily lead scoring update at 10 AM
    cron.schedule('0 10 * * *', async () => {
      await this.updateLeadScores();
    });

    // Daily analytics report at 6 PM
    cron.schedule('0 18 * * *', async () => {
      await this.generateDailyReport();
    });

    // Daily cleanup tasks at 11 PM
    cron.schedule('0 23 * * *', async () => {
      await this.performCleanupTasks();
    });
  }

  // Schedule hourly automation tasks
  scheduleHourlyTasks() {
    // Check for urgent leads every hour
    cron.schedule('0 * * * *', async () => {
      await this.checkUrgentLeads();
    });

    // Process automation workflows every hour
    cron.schedule('30 * * * *', async () => {
      await this.processWorkflows();
    });
  }

  // Create a new automation workflow
  async createWorkflow(workflowData) {
    try {
      const workflow = {
        id: `workflow_${Date.now()}`,
        name: workflowData.name,
        description: workflowData.description,
        triggers: workflowData.triggers || [],
        conditions: workflowData.conditions || [],
        actions: workflowData.actions || [],
        isActive: workflowData.isActive || true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.workflows.set(workflow.id, workflow);
      await this.saveWorkflows();

      return {
        success: true,
        workflow: workflow
      };
    } catch (error) {
      console.error('Workflow creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process automation workflows
  async processWorkflows() {
    try {
      for (const [workflowId, workflow] of this.workflows) {
        if (!workflow.isActive) continue;

        const shouldExecute = await this.evaluateWorkflowConditions(workflow);
        
        if (shouldExecute) {
          await this.executeWorkflowActions(workflow);
        }
      }
    } catch (error) {
      console.error('Workflow processing error:', error);
    }
  }

  // Evaluate workflow conditions
  async evaluateWorkflowConditions(workflow) {
    try {
      for (const condition of workflow.conditions) {
        const result = await this.evaluateCondition(condition);
        if (!result) return false;
      }
      return true;
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  // Evaluate a single condition
  async evaluateCondition(condition) {
    switch (condition.type) {
      case 'lead_score':
        return await this.evaluateLeadScoreCondition(condition);
      case 'lead_status':
        return await this.evaluateLeadStatusCondition(condition);
      case 'time_since_last_contact':
        return await this.evaluateTimeCondition(condition);
      case 'message_count':
        return await this.evaluateMessageCountCondition(condition);
      case 'engagement_level':
        return await this.evaluateEngagementCondition(condition);
      default:
        return false;
    }
  }

  // Execute workflow actions
  async executeWorkflowActions(workflow) {
    try {
      for (const action of workflow.actions) {
        await this.executeAction(action);
      }
    } catch (error) {
      console.error('Action execution error:', error);
    }
  }

  // Execute a single action
  async executeAction(action) {
    try {
      switch (action.type) {
        case 'send_whatsapp':
          await this.sendWhatsAppMessage(action);
          break;
        case 'send_email':
          await this.sendEmail(action);
          break;
        case 'update_lead_status':
          await this.updateLeadStatus(action);
          break;
        case 'assign_lead':
          await this.assignLead(action);
          break;
        case 'create_task':
          await this.createTask(action);
          break;
        case 'generate_ai_response':
          await this.generateAIResponse(action);
          break;
        default:
          console.log(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Action execution error for ${action.type}:`, error);
    }
  }

  // Process daily follow-ups
  async processDailyFollowups() {
    try {
      console.log('Processing daily follow-ups...');
      
      // Get leads that need follow-up
      const leadsNeedingFollowup = await this.getLeadsNeedingFollowup();
      
      for (const lead of leadsNeedingFollowup) {
        await this.processLeadFollowup(lead);
      }
      
      console.log(`Processed ${leadsNeedingFollowup.length} follow-ups`);
    } catch (error) {
      console.error('Daily follow-up processing error:', error);
    }
  }

  // Get leads that need follow-up
  async getLeadsNeedingFollowup() {
    try {
      // This would typically query the database
      // For now, return mock data
      return [
        {
          id: 'lead_1',
          name: 'John Doe',
          phone: '+919876543210',
          email: 'john@example.com',
          lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          score: 75,
          status: 'active'
        }
      ];
    } catch (error) {
      console.error('Get leads needing follow-up error:', error);
      return [];
    }
  }

  // Process follow-up for a specific lead
  async processLeadFollowup(lead) {
    try {
      // Generate personalized follow-up message
      const message = await this.generateFollowupMessage(lead);
      
      // Send via WhatsApp
      if (lead.phone) {
        await whatsappService.sendMessage(lead.userId, lead.phone, message);
      }
      
      // Send via email
      if (lead.email) {
        await emailService.sendEmail({
          to: lead.email,
          subject: 'Following up on your inquiry',
          html: message
        });
      }
      
      // Update lead record
      await this.updateLeadLastContact(lead.id);
      
    } catch (error) {
      console.error(`Follow-up processing error for lead ${lead.id}:`, error);
    }
  }

  // Generate personalized follow-up message
  async generateFollowupMessage(lead) {
    try {
      const context = `
        Lead: ${lead.name}
        Score: ${lead.score}/100
        Last Contact: ${lead.lastContact}
        Status: ${lead.status}
        
        Generate a personalized follow-up message that is:
        - Friendly and professional
        - References their previous interaction
        - Offers value or next steps
        - Includes a clear call to action
      `;

      const result = await openaiService.generateResponse(context, {
        businessName: 'Your Business',
        businessType: 'Technology'
      });

      return result.success ? result.response : this.getDefaultFollowupMessage(lead);
    } catch (error) {
      console.error('Follow-up message generation error:', error);
      return this.getDefaultFollowupMessage(lead);
    }
  }

  // Get default follow-up message
  getDefaultFollowupMessage(lead) {
    return `Hi ${lead.name}, I hope you're doing well! I wanted to follow up on your recent inquiry. Is there anything specific I can help you with today?`;
  }

  // Update lead scores
  async updateLeadScores() {
    try {
      console.log('Updating lead scores...');
      
      // This would typically update all lead scores based on recent activity
      // For now, just log the action
      console.log('Lead scores updated');
    } catch (error) {
      console.error('Lead score update error:', error);
    }
  }

  // Check for urgent leads
  async checkUrgentLeads() {
    try {
      const urgentLeads = await this.getUrgentLeads();
      
      for (const lead of urgentLeads) {
        await this.handleUrgentLead(lead);
      }
    } catch (error) {
      console.error('Urgent lead check error:', error);
    }
  }

  // Get urgent leads
  async getUrgentLeads() {
    try {
      // This would typically query for leads with high urgency indicators
      return [];
    } catch (error) {
      console.error('Get urgent leads error:', error);
      return [];
    }
  }

  // Handle urgent lead
  async handleUrgentLead(lead) {
    try {
      // Send immediate notification
      await this.sendUrgentNotification(lead);
      
      // Create high-priority task
      await this.createUrgentTask(lead);
      
    } catch (error) {
      console.error(`Urgent lead handling error for ${lead.id}:`, error);
    }
  }

  // Generate daily report
  async generateDailyReport() {
    try {
      console.log('Generating daily report...');
      
      const report = await this.createDailyReport();
      
      // Send report to admin
      await this.sendDailyReport(report);
      
    } catch (error) {
      console.error('Daily report generation error:', error);
    }
  }

  // Create daily report
  async createDailyReport() {
    try {
      // This would typically gather data from the database
      return {
        date: new Date().toISOString().split('T')[0],
        newLeads: 15,
        followupsSent: 25,
        conversions: 3,
        totalRevenue: 50000,
        topPerformingLeads: [],
        issues: []
      };
    } catch (error) {
      console.error('Daily report creation error:', error);
      return {};
    }
  }

  // Send daily report
  async sendDailyReport(report) {
    try {
      const html = `
        <h2>Daily Report - ${report.date}</h2>
        <p><strong>New Leads:</strong> ${report.newLeads}</p>
        <p><strong>Follow-ups Sent:</strong> ${report.followupsSent}</p>
        <p><strong>Conversions:</strong> ${report.conversions}</p>
        <p><strong>Total Revenue:</strong> ₹${report.totalRevenue}</p>
      `;

      await emailService.sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Daily Report - ${report.date}`,
        html: html
      });
    } catch (error) {
      console.error('Daily report sending error:', error);
    }
  }

  // Perform cleanup tasks
  async performCleanupTasks() {
    try {
      console.log('Performing cleanup tasks...');
      
      // Clean up old sessions
      await this.cleanupOldSessions();
      
      // Archive old leads
      await this.archiveOldLeads();
      
      // Clean up temporary files
      await this.cleanupTempFiles();
      
    } catch (error) {
      console.error('Cleanup tasks error:', error);
    }
  }

  // Load saved workflows
  async loadWorkflows() {
    try {
      // This would typically load from database
      // For now, create some default workflows
      const defaultWorkflows = [
        {
          id: 'workflow_1',
          name: 'New Lead Welcome',
          description: 'Automatically welcome new leads',
          triggers: ['new_lead'],
          conditions: [],
          actions: [
            {
              type: 'send_whatsapp',
              template: 'welcome_message',
              delay: 0
            }
          ],
          isActive: true
        },
        {
          id: 'workflow_2',
          name: 'Follow-up Reminder',
          description: 'Send follow-up reminders for inactive leads',
          triggers: ['lead_inactive'],
          conditions: [
            {
              type: 'time_since_last_contact',
              operator: 'greater_than',
              value: 3 // days
            }
          ],
          actions: [
            {
              type: 'send_whatsapp',
              template: 'followup_reminder',
              delay: 0
            }
          ],
          isActive: true
        }
      ];

      for (const workflow of defaultWorkflows) {
        this.workflows.set(workflow.id, workflow);
      }
    } catch (error) {
      console.error('Workflow loading error:', error);
    }
  }

  // Save workflows
  async saveWorkflows() {
    try {
      // This would typically save to database
      console.log('Workflows saved');
    } catch (error) {
      console.error('Workflow saving error:', error);
    }
  }

  // Get all workflows
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  // Update workflow
  async updateWorkflow(workflowId, updates) {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      Object.assign(workflow, updates, { updatedAt: new Date() });
      await this.saveWorkflows();

      return {
        success: true,
        workflow: workflow
      };
    } catch (error) {
      console.error('Workflow update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete workflow
  async deleteWorkflow(workflowId) {
    try {
      const deleted = this.workflows.delete(workflowId);
      if (deleted) {
        await this.saveWorkflows();
      }

      return {
        success: deleted,
        message: deleted ? 'Workflow deleted' : 'Workflow not found'
      };
    } catch (error) {
      console.error('Workflow deletion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AutomationService(); 