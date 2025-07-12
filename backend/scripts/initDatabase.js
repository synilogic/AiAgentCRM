const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Plan = require('../models/Plan');
const Workflow = require('../models/Workflow');
const Task = require('../models/Task');
const CrashReport = require('../models/CrashReport');

// Simple logger for initialization script
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => {
    if (error && error.stack) {
      console.error(`[ERROR] ${message}\n${error.stack}`);
    } else if (error) {
      console.error(`[ERROR] ${message}\n${JSON.stringify(error, null, 2)}`);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  warn: (message) => console.warn(`[WARN] ${message}`),
  debug: (message) => console.log(`[DEBUG] ${message}`)
};

class DatabaseInitializer {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.isConnected = true;
      logger.info('✅ Connected to MongoDB');
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      logger.info('✅ Disconnected from MongoDB');
    }
  }

  async createIndexes() {
    logger.info('📊 Creating database indexes...');
    
    try {
      // User indexes
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ role: 1, createdAt: -1 });
      await User.collection.createIndex({ 'subscription.status': 1, 'subscription.endDate': 1 });
      await User.collection.createIndex({ 'status.online': 1, 'status.lastSeen': -1 });
      await User.collection.createIndex({ 'isEmailVerified': 1, createdAt: -1 });
      
      // Lead indexes
      await Lead.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
      await Lead.collection.createIndex({ userId: 1, source: 1, createdAt: -1 });
      await Lead.collection.createIndex({ userId: 1, score: -1, createdAt: -1 });
      await Lead.collection.createIndex({ userId: 1, priority: 1, createdAt: -1 });
      await Lead.collection.createIndex({ userId: 1, nextFollowUp: 1 });
      await Lead.collection.createIndex({ email: 1, userId: 1 });
      await Lead.collection.createIndex({ phone: 1, userId: 1 });
      await Lead.collection.createIndex({ 'tags': 1, userId: 1 });
      
      // Message indexes
      await Message.collection.createIndex({ roomId: 1, timestamp: -1 });
      await Message.collection.createIndex({ user: 1, timestamp: -1 });
      await Message.collection.createIndex({ type: 1, timestamp: -1 });
      await Message.collection.createIndex({ status: 1, timestamp: -1 });
      await Message.collection.createIndex({ priority: 1, timestamp: -1 });
      await Message.collection.createIndex({ 'readBy.user': 1, timestamp: -1 });
      await Message.collection.createIndex({ 'reactions.user': 1, timestamp: -1 });
      
      // Activity indexes
      await Activity.collection.createIndex({ user: 1, action: 1, timestamp: -1 });
      await Activity.collection.createIndex({ action: 1, timestamp: -1 });
      await Activity.collection.createIndex({ status: 1, timestamp: -1 });
      await Activity.collection.createIndex({ resource: 1, resourceId: 1, timestamp: -1 });
      
      // Notification indexes
      await Notification.collection.createIndex({ user: 1, read: 1, createdAt: -1 });
      await Notification.collection.createIndex({ user: 1, type: 1, createdAt: -1 });
      await Notification.collection.createIndex({ user: 1, priority: 1, createdAt: -1 });
      
      // Plan indexes
      await Plan.collection.createIndex({ type: 1, status: 1, sortOrder: 1 });
      await Plan.collection.createIndex({ isPublic: 1, status: 1 });
      await Plan.collection.createIndex({ 'price.monthly': 1 });
      await Plan.collection.createIndex({ 'price.yearly': 1 });
      
      // Workflow indexes
      await Workflow.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
      await Workflow.collection.createIndex({ userId: 1, isActive: 1 });
      await Workflow.collection.createIndex({ 'trigger.type': 1, isActive: 1 });
      
      // Task indexes
      await Task.collection.createIndex({ userId: 1, status: 1, dueDate: 1 });
      await Task.collection.createIndex({ assignee: 1, status: 1, dueDate: 1 });
      await Task.collection.createIndex({ leadId: 1, status: 1, createdAt: -1 });
      await Task.collection.createIndex({ dueDate: 1, status: 1 });
      await Task.collection.createIndex({ 'reminders.date': 1, 'reminders.sent': 1 });
      
      // CrashReport indexes
      await CrashReport.collection.createIndex({ user: 1, timestamp: -1 });
      await CrashReport.collection.createIndex({ platform: 1, timestamp: -1 });
      await CrashReport.collection.createIndex({ severity: 1, timestamp: -1 });
      await CrashReport.collection.createIndex({ resolved: 1, timestamp: -1 });
      
      logger.info('✅ All database indexes created successfully');
    } catch (error) {
      logger.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  async createSamplePlans() {
    logger.info('📋 Creating sample subscription plans...');
    
    try {
      const plans = [
        {
          name: 'Starter',
          description: 'Perfect for small businesses getting started with CRM',
          type: 'basic',
          price: {
            monthly: 29,
            yearly: 290,
            currency: 'USD'
          },
          limits: {
            leads: 100,
            aiReplies: 50,
            followUps: 200,
            messages: 500,
            apiCalls: 1000,
            storage: 1024, // 1GB
            teamMembers: 1,
            workflows: 2,
            integrations: 1
          },
          features: {
            aiAssistant: true,
            whatsappIntegration: false,
            googleSheetsIntegration: false,
            facebookAdsIntegration: false,
            advancedAnalytics: false,
            customWorkflows: false,
            teamCollaboration: false,
            apiAccess: false,
            prioritySupport: false,
            whiteLabel: false,
            customDomain: false,
            dataExport: false,
            advancedReporting: false,
            mobileApp: false,
            sso: false
          },
          trialDays: 14,
          isPopular: false,
          sortOrder: 1
        },
        {
          name: 'Professional',
          description: 'Advanced features for growing businesses',
          type: 'pro',
          price: {
            monthly: 79,
            yearly: 790,
            currency: 'USD'
          },
          limits: {
            leads: 1000,
            aiReplies: 500,
            followUps: 2000,
            messages: 5000,
            apiCalls: 10000,
            storage: 10240, // 10GB
            teamMembers: 5,
            workflows: 10,
            integrations: 3
          },
          features: {
            aiAssistant: true,
            whatsappIntegration: true,
            googleSheetsIntegration: true,
            facebookAdsIntegration: false,
            advancedAnalytics: true,
            customWorkflows: true,
            teamCollaboration: true,
            apiAccess: true,
            prioritySupport: false,
            whiteLabel: false,
            customDomain: false,
            dataExport: true,
            advancedReporting: true,
            mobileApp: true,
            sso: false
          },
          trialDays: 14,
          isPopular: true,
          sortOrder: 2
        },
        {
          name: 'Enterprise',
          description: 'Complete solution for large organizations',
          type: 'enterprise',
          price: {
            monthly: 199,
            yearly: 1990,
            currency: 'USD'
          },
          limits: {
            leads: 10000,
            aiReplies: 5000,
            followUps: 20000,
            messages: 50000,
            apiCalls: 100000,
            storage: 102400, // 100GB
            teamMembers: 50,
            workflows: 100,
            integrations: 10
          },
          features: {
            aiAssistant: true,
            whatsappIntegration: true,
            googleSheetsIntegration: true,
            facebookAdsIntegration: true,
            advancedAnalytics: true,
            customWorkflows: true,
            teamCollaboration: true,
            apiAccess: true,
            prioritySupport: true,
            whiteLabel: true,
            customDomain: true,
            dataExport: true,
            advancedReporting: true,
            mobileApp: true,
            sso: true
          },
          trialDays: 30,
          isPopular: false,
          sortOrder: 3
        }
      ];

      for (const planData of plans) {
        const existingPlan = await Plan.findOne({ name: planData.name });
        if (!existingPlan) {
          const plan = new Plan(planData);
          await plan.save();
          logger.info(`✅ Created plan: ${planData.name}`);
        } else {
          logger.info(`⏭️  Plan already exists: ${planData.name}`);
        }
      }
      
      logger.info('✅ Sample plans created successfully');
    } catch (error) {
      logger.error('❌ Error creating sample plans:', error);
      throw error;
    }
  }

  async createSampleUsers() {
    logger.info('👥 Creating sample users...');
    
    try {
      // Create admin user
      const adminEmail = 'admin@aiaagentcrm.com';
      let adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        adminUser = new User({
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isEmailVerified: true,
          businessName: 'AI Agent CRM',
          industry: 'Technology',
          companySize: '11-50',
          status: {
            online: false,
            lastSeen: new Date()
          }
        });
        await adminUser.save();
        logger.info('✅ Created admin user');
      } else {
        logger.info('⏭️  Admin user already exists');
      }

      // Create sample regular user
      const userEmail = 'demo@aiaagentcrm.com';
      let demoUser = await User.findOne({ email: userEmail });
      
      if (!demoUser) {
        const hashedPassword = await bcrypt.hash('demo123', 12);
        demoUser = new User({
          name: 'Demo User',
          email: userEmail,
          password: hashedPassword,
          role: 'user',
          isEmailVerified: true,
          businessName: 'Demo Business',
          industry: 'Consulting',
          companySize: '1-10',
          status: {
            online: false,
            lastSeen: new Date()
          }
        });
        await demoUser.save();
        logger.info('✅ Created demo user');
      } else {
        logger.info('⏭️  Demo user already exists');
      }

      return { adminUser, demoUser };
    } catch (error) {
      logger.error('❌ Error creating sample users:', error);
      throw error;
    }
  }

  async createSampleLeads(users) {
    logger.info('🎯 Creating sample leads...');
    
    try {
      const { demoUser } = users;
      const sampleLeads = [
        {
          userId: demoUser._id,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1234567890',
          company: 'Tech Solutions Inc.',
          position: 'CEO',
          source: 'website',
          status: 'new',
          score: 75,
          priority: 'high',
          notes: 'Interested in AI automation solutions. Very responsive to emails.',
          tags: ['hot', 'decision-maker', 'tech']
        },
        {
          userId: demoUser._id,
          name: 'Sarah Johnson',
          email: 'sarah.j@marketingpro.com',
          phone: '+1987654321',
          company: 'Marketing Pro',
          position: 'Marketing Director',
          source: 'facebook',
          status: 'contacted',
          score: 60,
          priority: 'medium',
          notes: 'Looking for CRM solution for their growing team.',
          tags: ['warm', 'marketing', 'growing']
        },
        {
          userId: demoUser._id,
          name: 'Mike Chen',
          email: 'mike.chen@startup.co',
          phone: '+1555123456',
          company: 'StartupXYZ',
          position: 'Founder',
          source: 'referral',
          status: 'qualified',
          score: 85,
          priority: 'urgent',
          notes: 'Ready to implement CRM. Budget approved. Timeline: 2 weeks.',
          tags: ['hot', 'startup', 'urgent', 'budget-approved']
        }
      ];

      for (const leadData of sampleLeads) {
        const existingLead = await Lead.findOne({ 
          userId: leadData.userId, 
          email: leadData.email 
        });
        
        if (!existingLead) {
          const lead = new Lead(leadData);
          await lead.save();
          logger.info(`✅ Created lead: ${leadData.name}`);
        } else {
          logger.info(`⏭️  Lead already exists: ${leadData.name}`);
        }
      }
      
      logger.info('✅ Sample leads created successfully');
    } catch (error) {
      logger.error('❌ Error creating sample leads:', error);
      throw error;
    }
  }

  async createSampleWorkflows(users) {
    logger.info('🔄 Creating sample workflows...');
    
    try {
      const { demoUser } = users;
      const sampleWorkflows = [
        {
          userId: demoUser._id,
          name: 'New Lead Welcome',
          description: 'Automatically welcome new leads with personalized messages',
          trigger: {
            type: 'lead_created',
            conditions: []
          },
          actions: [
            {
              type: 'send_email',
              order: 1,
              delay: 0,
              config: {
                template: 'welcome',
                subject: 'Welcome to {{company}}!',
                body: 'Hi {{name}}, welcome to our CRM system!',
                recipients: ['{{email}}']
              }
            },
            {
              type: 'add_tag',
              order: 2,
              delay: 0,
              config: {
                tag: 'welcome-sent'
              }
            }
          ],
          status: 'active',
          isActive: true,
          category: 'lead_nurturing'
        },
        {
          userId: demoUser._id,
          name: 'Follow-up Reminder',
          description: 'Send follow-up reminders for leads that haven\'t been contacted',
          trigger: {
            type: 'time_based',
            schedule: {
              enabled: true,
              frequency: 'daily',
              time: '09:00'
            }
          },
          actions: [
            {
              type: 'send_email',
              order: 1,
              delay: 0,
              config: {
                template: 'followup',
                subject: 'Follow-up reminder for {{name}}',
                body: 'Don\'t forget to follow up with {{name}} from {{company}}',
                recipients: ['{{user_email}}']
              }
            }
          ],
          status: 'active',
          isActive: true,
          category: 'follow_up'
        }
      ];

      for (const workflowData of sampleWorkflows) {
        const existingWorkflow = await Workflow.findOne({ 
          userId: workflowData.userId, 
          name: workflowData.name 
        });
        
        if (!existingWorkflow) {
          const workflow = new Workflow(workflowData);
          await workflow.save();
          logger.info(`✅ Created workflow: ${workflowData.name}`);
        } else {
          logger.info(`⏭️  Workflow already exists: ${workflowData.name}`);
        }
      }
      
      logger.info('✅ Sample workflows created successfully');
    } catch (error) {
      logger.error('❌ Error creating sample workflows:', error);
      throw error;
    }
  }

  async initialize() {
    try {
      await this.connect();
      await this.createIndexes();
      
      const users = await this.createSampleUsers();
      await this.createSamplePlans();
      await this.createSampleLeads(users);
      await this.createSampleWorkflows(users);
      
      logger.info('🎉 Database initialization completed successfully!');
      logger.info('📝 Sample data created:');
      logger.info('   - Admin user: admin@aiaagentcrm.com (password: admin123)');
      logger.info('   - Demo user: demo@aiaagentcrm.com (password: demo123)');
      logger.info('   - 3 subscription plans');
      logger.info('   - 3 sample leads');
      logger.info('   - 2 sample workflows');
      
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  initializer.initialize()
    .then(() => {
      logger.info('✅ Database initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Database initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseInitializer; 