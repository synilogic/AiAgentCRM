const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Workflow = require('../models/Workflow');
const WorkflowExecution = require('../models/WorkflowExecution');
const Payment = require('../models/Payment');
const PaymentGateway = require('../models/PaymentGateway');
const EmailTemplate = require('../models/EmailTemplate');
const KnowledgeBase = require('../models/KnowledgeBase');
const Notification = require('../models/Notification');
const SecurityAlert = require('../models/SecurityAlert');
const SystemMetric = require('../models/SystemMetric');
const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');
const BackupJob = require('../models/BackupJob');
const CrashReport = require('../models/CrashReport');

class ComprehensiveSeeder {
  constructor(options = {}) {
    this.options = {
      users: 20,
      leads: 100,
      messages: 200,
      activities: 150,
      tasks: 80,
      workflows: 10,
      payments: 30,
      notifications: 50,
      knowledgeBase: 25,
      securityAlerts: 15,
      systemMetrics: 100,
      ...options
    };
    
    this.createdData = {
      users: [],
      plans: [],
      leads: [],
      workflows: []
    };
  }

  async connectDB() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM';
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB for seeding');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async clearDatabase() {
    console.log('🗑️  Clearing existing data...');
    
    // Keep admin user but clear other data
    await Promise.allSettled([
      User.deleteMany({ email: { $ne: 'admin@aiagentcrm.com' } }),
      Plan.deleteMany({}),
      Lead.deleteMany({}),
      Message.deleteMany({}),
      Activity.deleteMany({}),
      Task.deleteMany({}),
      Workflow.deleteMany({}),
      WorkflowExecution.deleteMany({}),
      Payment.deleteMany({}),
      PaymentGateway.deleteMany({}),
      EmailTemplate.deleteMany({}),
      KnowledgeBase.deleteMany({}),
      Notification.deleteMany({}),
      SecurityAlert.deleteMany({}),
      SystemMetric.deleteMany({}),
      ApiKey.deleteMany({}),
      ApiRequestLog.deleteMany({}),
      BackupJob.deleteMany({}),
      CrashReport.deleteMany({})
    ]);
    
    console.log('✅ Database cleared (admin user preserved)');
  }

  async createPlans() {
    console.log('📋 Creating subscription plans...');
    
    const plans = [
      {
        name: 'Free Starter',
        description: 'Perfect for individuals getting started with CRM',
        type: 'basic',
        price: { monthly: 0, yearly: 0, currency: 'INR' },
        limits: {
          leads: 50,
          aiReplies: 100,
          followUps: 50,
          messages: 500,
          apiCalls: 1000,
          storage: 100,
          teamMembers: 1,
          workflows: 2,
          integrations: 2
        },
        features: {
          aiAssistant: true,
          whatsappIntegration: false,
          googleSheetsIntegration: true,
          facebookAdsIntegration: false,
          advancedAnalytics: false,
          customWorkflows: false,
          teamCollaboration: false,
          apiAccess: false,
          prioritySupport: false,
          whiteLabel: false,
          customDomain: false,
          dataExport: true,
          advancedReporting: false,
          mobileApp: true,
          sso: false
        },
        status: 'active',
        isPublic: true,
        trialDays: 14,
        sortOrder: 1,
        category: 'starter'
      },
      {
        name: 'Professional',
        description: 'Best for growing businesses and small teams',
        type: 'pro',
        price: { monthly: 2999, yearly: 29990, currency: 'INR' },
        limits: {
          leads: 1000,
          aiReplies: 2000,
          followUps: 1000,
          messages: 10000,
          apiCalls: 50000,
          storage: 5000,
          teamMembers: 5,
          workflows: 20,
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
          whiteLabel: false,
          customDomain: false,
          dataExport: true,
          advancedReporting: true,
          mobileApp: true,
          sso: false
        },
        status: 'active',
        isPublic: true,
        isPopular: true,
        trialDays: 30,
        sortOrder: 2,
        category: 'professional'
      },
      {
        name: 'Enterprise',
        description: 'Complete solution for large organizations',
        type: 'enterprise',
        price: { monthly: 9999, yearly: 99990, currency: 'INR' },
        limits: {
          leads: -1, // unlimited
          aiReplies: -1,
          followUps: -1,
          messages: -1,
          apiCalls: -1,
          storage: -1,
          teamMembers: -1,
          workflows: -1,
          integrations: -1
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
        status: 'active',
        isPublic: true,
        trialDays: 30,
        sortOrder: 3,
        category: 'enterprise'
      }
    ];

    this.createdData.plans = await Plan.insertMany(plans);
    console.log(`✅ Created ${this.createdData.plans.length} subscription plans`);
    return this.createdData.plans;
  }

  async createUsers() {
    console.log('👥 Creating users...');
    
    const basicPlan = this.createdData.plans.find(p => p.type === 'basic');
    const proPlan = this.createdData.plans.find(p => p.type === 'pro');
    const enterprisePlan = this.createdData.plans.find(p => p.type === 'enterprise');
    
    const users = [];
    
    // Create admin user if doesn't exist
    const existingAdmin = await User.findOne({ email: 'admin@aiagentcrm.com' });
    if (!existingAdmin) {
      users.push({
        name: 'Admin User',
        email: 'admin@aiagentcrm.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        businessName: 'AI Agent CRM',
        industry: 'Software',
        companySize: '11-50',
        website: 'https://aiagentcrm.com',
        phone: '+91 9876543210',
        plan: enterprisePlan._id,
        subscription: {
          status: 'active',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        goals: [
          {
            id: 'goal_admin_1',
            title: 'Onboard 1000 New Users',
            target: 1000,
            current: 245,
            deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'leads',
            status: 'active'
          },
          {
            id: 'goal_admin_2',
            title: 'Achieve ₹10 Lakh ARR',
            target: 1000000,
            current: 350000,
            deadline: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'revenue',
            status: 'active'
          }
        ],
        socialLinks: [
          {
            platform: 'linkedin',
            url: 'https://linkedin.com/company/aiagentcrm',
            icon: 'linkedin',
            color: '#0077B5'
          },
          {
            platform: 'twitter',
            url: 'https://twitter.com/aiagentcrm',
            icon: 'twitter',
            color: '#1DA1F2'
          }
        ],
        teamMembers: [
          {
            id: 'team_1',
            name: 'Sarah Johnson',
            email: 'sarah@aiagentcrm.com',
            role: 'Manager',
            status: 'active',
            permissions: ['read', 'edit']
          }
        ]
      });
    }

    // Create regular users
    for (let i = 0; i < this.options.users; i++) {
      const planIndex = Math.floor(Math.random() * 3);
      const plan = [basicPlan, proPlan, enterprisePlan][planIndex];
      
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email(firstName, lastName).toLowerCase();
      
      users.push({
        name: `${firstName} ${lastName}`,
        email: email,
        password: await bcrypt.hash('password123', 12),
        role: ['user', 'manager', 'agent'][Math.floor(Math.random() * 3)],
        businessName: faker.company.companyName(),
        industry: faker.commerce.department(),
        companySize: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
        website: faker.internet.url(),
        phone: faker.phone.phoneNumber('+91 ##########'),
        plan: plan._id,
        subscription: {
          status: ['active', 'trial', 'inactive'][Math.floor(Math.random() * 3)],
          startDate: faker.date.past(1),
          endDate: faker.date.future(1),
          autoRenew: Math.random() > 0.3
        },
        usage: {
          leads: Math.floor(Math.random() * 100),
          aiReplies: Math.floor(Math.random() * 500),
          followUps: Math.floor(Math.random() * 200),
          messages: Math.floor(Math.random() * 1000),
          apiCalls: Math.floor(Math.random() * 5000),
          storageUsed: Math.floor(Math.random() * 1000)
        },
        preferences: {
          notifications: {
            email: Math.random() > 0.5,
            push: Math.random() > 0.5,
            sms: Math.random() > 0.7
          },
          language: 'en',
          timezone: 'Asia/Kolkata',
          theme: ['light', 'dark'][Math.floor(Math.random() * 2)]
        },
        goals: [
          {
            id: `goal_${i}_1`,
            title: `Acquire ${Math.floor(Math.random() * 50 + 20)} New Leads`,
            target: Math.floor(Math.random() * 50 + 20),
            current: Math.floor(Math.random() * 15),
            deadline: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'leads',
            status: 'active'
          }
        ]
      });
    }

    this.createdData.users = await User.insertMany(users);
    console.log(`✅ Created ${this.createdData.users.length} users`);
    return this.createdData.users;
  }

  async createLeads() {
    console.log('🎯 Creating leads...');
    
    const leads = [];
    const users = this.createdData.users.filter(u => u.role !== 'admin');
    
    for (let i = 0; i < this.options.leads; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      leads.push({
        userId: user._id,
        name: faker.name.findName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber('+91 ##########'),
        company: faker.company.companyName(),
        position: faker.name.jobTitle(),
        industry: faker.commerce.department(),
        companySize: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
        source: ['facebook', 'google_sheets', 'manual', 'whatsapp', 'website', 'referral'][Math.floor(Math.random() * 6)],
        status: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'][Math.floor(Math.random() * 7)],
        score: Math.floor(Math.random() * 100),
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        scoreFactors: {
          engagement: Math.floor(Math.random() * 100),
          budget: Math.floor(Math.random() * 100),
          authority: Math.floor(Math.random() * 100),
          need: Math.floor(Math.random() * 100),
          timeline: Math.floor(Math.random() * 100),
          fit: Math.floor(Math.random() * 100)
        },
        dealValue: Math.floor(Math.random() * 1000000),
        currency: 'INR',
        probability: Math.floor(Math.random() * 100),
        expectedCloseDate: faker.date.future(0.5),
        notes: faker.lorem.paragraph(),
        tags: [faker.commerce.productAdjective(), faker.commerce.productMaterial()],
        lastContact: faker.date.past(0.1),
        nextFollowUp: faker.date.future(0.1),
        aiAnalysis: {
          sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
          intent: ['buying', 'researching', 'complaining', 'inquiry'][Math.floor(Math.random() * 4)],
          urgency: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
          confidence: Math.floor(Math.random() * 100),
          lastAnalyzed: faker.date.recent(),
          keywords: [faker.commerce.productName(), faker.commerce.productAdjective()],
          suggestedActions: ['Follow up via email', 'Schedule a call', 'Send proposal']
        }
      });
    }

    this.createdData.leads = await Lead.insertMany(leads);
    console.log(`✅ Created ${this.createdData.leads.length} leads`);
    return this.createdData.leads;
  }

  async createActivities() {
    console.log('📊 Creating activities...');
    
    const activities = [];
    const leads = this.createdData.leads;
    
    for (let i = 0; i < this.options.activities; i++) {
      const lead = leads[Math.floor(Math.random() * leads.length)];
      const user = this.createdData.users.find(u => u._id.equals(lead.userId));
      
      activities.push({
        userId: user._id,
        leadId: lead._id,
        type: [
          'lead_created', 'lead_updated', 'status_changed', 'tag_added',
          'message_sent', 'call_made', 'email_sent', 'followup_scheduled'
        ][Math.floor(Math.random() * 8)],
        description: faker.lorem.sentence(),
        metadata: {
          previousStatus: 'new',
          newStatus: 'contacted',
          source: 'web'
        },
        source: ['system', 'user', 'workflow', 'integration'][Math.floor(Math.random() * 4)],
        platform: ['web', 'mobile', 'whatsapp', 'email'][Math.floor(Math.random() * 4)],
        status: 'completed',
        isPublic: true,
        isImportant: Math.random() > 0.8,
        isAutomatic: Math.random() > 0.6
      });
    }

    await Activity.insertMany(activities);
    console.log(`✅ Created ${activities.length} activities`);
  }

  async createTasks() {
    console.log('✅ Creating tasks...');
    
    const tasks = [];
    const leads = this.createdData.leads;
    const users = this.createdData.users;
    
    for (let i = 0; i < this.options.tasks; i++) {
      const lead = leads[Math.floor(Math.random() * leads.length)];
      const user = this.createdData.users.find(u => u._id.equals(lead.userId));
      const assignee = users[Math.floor(Math.random() * users.length)];
      
      tasks.push({
        userId: user._id,
        leadId: lead._id,
        title: faker.lorem.words(4),
        description: faker.lorem.paragraph(),
        type: ['call', 'email', 'meeting', 'follow_up', 'research', 'proposal', 'demo'][Math.floor(Math.random() * 7)],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        status: ['pending', 'in_progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
        dueDate: faker.date.future(0.2),
        assignee: assignee._id,
        createdBy: user._id,
        estimatedDuration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
        progress: Math.floor(Math.random() * 100),
        tags: [faker.hacker.adjective(), faker.hacker.noun()],
        reminders: [
          {
            type: 'email',
            time: '09:00',
            date: faker.date.future(0.1),
            sent: false
          }
        ]
      });
    }

    await Task.insertMany(tasks);
    console.log(`✅ Created ${tasks.length} tasks`);
  }

  async createWorkflows() {
    console.log('🔄 Creating workflows...');
    
    const workflows = [];
    const users = this.createdData.users.filter(u => u.role !== 'admin');
    
    for (let i = 0; i < this.options.workflows; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      workflows.push({
        userId: user._id,
        name: `${faker.hacker.adjective()} ${faker.hacker.noun()} Workflow`,
        description: faker.lorem.sentence(),
        trigger: {
          type: ['lead_created', 'lead_status_changed', 'lead_score_changed', 'time_based'][Math.floor(Math.random() * 4)],
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'new'
            }
          ]
        },
        actions: [
          {
            type: 'send_email',
            order: 1,
            delay: 0,
            config: {
              template: 'welcome_email',
              subject: 'Welcome to our CRM!',
              recipients: ['{{lead.email}}']
            },
            enabled: true
          },
          {
            type: 'create_task',
            order: 2,
            delay: 60, // 1 hour delay
            config: {
              taskTitle: 'Follow up with {{lead.name}}',
              taskDescription: 'Initial follow up call',
              dueDate: '2 days',
              assignee: user._id
            },
            enabled: true
          }
        ],
        status: ['active', 'inactive', 'draft'][Math.floor(Math.random() * 3)],
        isActive: Math.random() > 0.3,
        executionStats: {
          totalExecutions: Math.floor(Math.random() * 50),
          successfulExecutions: Math.floor(Math.random() * 40),
          failedExecutions: Math.floor(Math.random() * 5),
          lastExecuted: faker.date.recent(),
          averageExecutionTime: Math.floor(Math.random() * 5000) + 1000
        }
      });
    }

    this.createdData.workflows = await Workflow.insertMany(workflows);
    console.log(`✅ Created ${workflows.length} workflows`);
  }

  async createMessages() {
    console.log('💬 Creating messages...');
    
    const messages = [];
    const users = this.createdData.users;
    
    for (let i = 0; i < this.options.messages; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      messages.push({
        user: user._id,
        roomId: `room_${Math.floor(Math.random() * 20) + 1}`,
        content: faker.lorem.sentence(),
        type: ['text', 'image', 'file'][Math.floor(Math.random() * 3)],
        status: ['sent', 'delivered', 'read'][Math.floor(Math.random() * 3)],
        source: ['web', 'mobile', 'whatsapp', 'email'][Math.floor(Math.random() * 4)],
        priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
        timestamp: faker.date.recent()
      });
    }

    await Message.insertMany(messages);
    console.log(`✅ Created ${messages.length} messages`);
  }

  async createKnowledgeBase() {
    console.log('📚 Creating knowledge base articles...');
    
    const articles = [];
    const users = this.createdData.users;
    
    for (let i = 0; i < this.options.knowledgeBase; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      articles.push({
        userId: user._id,
        title: faker.lorem.words(5),
        content: faker.lorem.paragraphs(3),
        summary: faker.lorem.sentence(),
        category: ['general', 'product', 'support', 'sales', 'technical'][Math.floor(Math.random() * 5)],
        tags: [faker.hacker.adjective(), faker.hacker.noun()],
        type: ['text', 'faq', 'document'][Math.floor(Math.random() * 3)],
        source: 'manual',
        status: ['active', 'draft', 'inactive'][Math.floor(Math.random() * 3)],
        isActive: true,
        priority: Math.floor(Math.random() * 10) + 1,
        version: 1,
        language: 'en',
        visibility: ['private', 'shared', 'public'][Math.floor(Math.random() * 3)],
        qualityScore: Math.floor(Math.random() * 100),
        usage: {
          queries: Math.floor(Math.random() * 100),
          matches: Math.floor(Math.random() * 50),
          lastUsed: faker.date.recent(),
          avgRelevanceScore: Math.random()
        }
      });
    }

    await KnowledgeBase.insertMany(articles);
    console.log(`✅ Created ${articles.length} knowledge base articles`);
  }

  async createPayments() {
    console.log('💳 Creating payments...');
    
    const payments = [];
    const users = this.createdData.users.filter(u => u.subscription.status === 'active');
    const plans = this.createdData.plans;
    
    for (let i = 0; i < this.options.payments; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      
      payments.push({
        user: user._id,
        plan: plan._id,
        amount: plan.price.monthly,
        currency: 'INR',
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        gateway: 'razorpay',
        gatewayPaymentId: `pay_${faker.random.alphaNumeric(14)}`,
        gatewayOrderId: `order_${faker.random.alphaNumeric(14)}`,
        paymentMethod: ['card', 'netbanking', 'upi', 'wallet'][Math.floor(Math.random() * 4)],
        description: `Payment for ${plan.name} plan`,
        processedAt: faker.date.recent(),
        completedAt: faker.date.recent()
      });
    }

    await Payment.insertMany(payments);
    console.log(`✅ Created ${payments.length} payments`);
  }

  async createNotifications() {
    console.log('🔔 Creating notifications...');
    
    const notifications = [];
    const users = this.createdData.users;
    
    for (let i = 0; i < this.options.notifications; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      notifications.push({
        userId: user._id,
        title: faker.lorem.words(4),
        message: faker.lorem.sentence(),
        type: ['info', 'success', 'warning', 'error'][Math.floor(Math.random() * 4)],
        category: ['system', 'lead', 'payment', 'workflow', 'security'][Math.floor(Math.random() * 5)],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        channel: ['in_app', 'email', 'push', 'sms'][Math.floor(Math.random() * 4)],
        status: ['pending', 'sent', 'delivered', 'read', 'failed'][Math.floor(Math.random() * 5)],
        isRead: Math.random() > 0.5,
        scheduledFor: faker.date.recent(),
        metadata: {
          source: 'system',
          actionUrl: '/dashboard/leads'
        }
      });
    }

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);
  }

  async createSecurityAlerts() {
    console.log('🔒 Creating security alerts...');
    
    const alerts = [];
    const users = this.createdData.users;
    
    for (let i = 0; i < this.options.securityAlerts; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      alerts.push({
        type: [
          'brute_force_attempt', 'suspicious_login', 'rate_limit_exceeded',
          'unusual_api_usage', 'unauthorized_access', 'unusual_geographic_access'
        ][Math.floor(Math.random() * 6)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        status: ['active', 'investigating', 'resolved'][Math.floor(Math.random() * 3)],
        title: faker.lorem.words(4),
        description: faker.lorem.sentence(),
        sourceIP: faker.internet.ip(),
        targetEndpoint: '/api/auth/login',
        userAgent: faker.internet.userAgent(),
        userId: user._id,
        metadata: {
          attemptCount: Math.floor(Math.random() * 10) + 1,
          timeWindow: '5 minutes',
          location: faker.address.city()
        },
        riskScore: Math.floor(Math.random() * 100),
        automatedResponse: {
          enabled: true,
          action: 'block_ip',
          duration: 3600
        }
      });
    }

    await SecurityAlert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} security alerts`);
  }

  async createSystemMetrics() {
    console.log('📈 Creating system metrics...');
    
    const metrics = [];
    const metricTypes = [
      'cpu_usage', 'memory_usage', 'disk_usage', 'response_time',
      'error_rate', 'throughput', 'active_users', 'api_calls'
    ];
    
    for (let i = 0; i < this.options.systemMetrics; i++) {
      const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
      
      let value, unit;
      switch (metricType) {
        case 'cpu_usage':
        case 'memory_usage':
        case 'disk_usage':
        case 'error_rate':
          value = Math.random() * 100;
          unit = 'percentage';
          break;
        case 'response_time':
          value = Math.random() * 1000;
          unit = 'milliseconds';
          break;
        case 'throughput':
        case 'api_calls':
          value = Math.floor(Math.random() * 1000);
          unit = 'requests_per_second';
          break;
        case 'active_users':
          value = Math.floor(Math.random() * 100);
          unit = 'count';
          break;
        default:
          value = Math.random() * 100;
          unit = 'count';
      }
      
      metrics.push({
        metricType,
        value,
        unit,
        metadata: {
          hostname: faker.internet.domainName(),
          environment: 'development',
          region: 'ap-south-1'
        },
        timestamp: faker.date.recent()
      });
    }

    await SystemMetric.insertMany(metrics);
    console.log(`✅ Created ${metrics.length} system metrics`);
  }

  async createEmailTemplates() {
    console.log('📧 Creating email templates...');
    
    const templates = [
      {
        name: 'welcome_email',
        displayName: 'Welcome Email',
        subject: 'Welcome to {{company_name}}!',
        htmlContent: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining us.</p>',
        textContent: 'Welcome {{user_name}}! Thank you for joining us.',
        variables: [
          { name: 'user_name', description: 'User\'s full name', required: true },
          { name: 'company_name', description: 'Company name', required: true }
        ],
        category: 'user_management',
        isActive: true,
        isDefault: true
      },
      {
        name: 'password_reset',
        displayName: 'Password Reset',
        subject: 'Reset Your Password',
        htmlContent: '<h1>Password Reset</h1><p>Click <a href="{{reset_url}}">here</a> to reset your password.</p>',
        textContent: 'Reset your password: {{reset_url}}',
        variables: [
          { name: 'reset_url', description: 'Password reset URL', required: true }
        ],
        category: 'user_management',
        isActive: true
      },
      {
        name: 'payment_success',
        displayName: 'Payment Successful',
        subject: 'Payment Confirmation - {{amount}}',
        htmlContent: '<h1>Payment Successful</h1><p>Thank you for your payment of {{amount}}.</p>',
        textContent: 'Payment Successful: Thank you for your payment of {{amount}}.',
        variables: [
          { name: 'amount', description: 'Payment amount', required: true }
        ],
        category: 'billing',
        isActive: true
      }
    ];

    await EmailTemplate.insertMany(templates);
    console.log(`✅ Created ${templates.length} email templates`);
  }

  async createPaymentGateways() {
    console.log('🏦 Creating payment gateways...');
    
    const gateways = [
      {
        name: 'Razorpay',
        provider: 'razorpay',
        isActive: true,
        isPrimary: true,
        supportedCurrencies: ['INR', 'USD'],
        supportedMethods: ['card', 'netbanking', 'upi', 'wallet'],
        configuration: {
          keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
          keySecret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
          webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret'
        },
        fees: {
          domestic: { percentage: 2.0, fixed: 0 },
          international: { percentage: 3.0, fixed: 0 }
        },
        limits: {
          minAmount: 100,
          maxAmount: 10000000
        }
      },
      {
        name: 'PayPal',
        provider: 'paypal',
        isActive: false,
        isPrimary: false,
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedMethods: ['paypal'],
        configuration: {
          clientId: 'paypal_client_id',
          clientSecret: 'paypal_client_secret'
        },
        fees: {
          domestic: { percentage: 2.9, fixed: 30 },
          international: { percentage: 4.4, fixed: 30 }
        }
      }
    ];

    await PaymentGateway.insertMany(gateways);
    console.log(`✅ Created ${gateways.length} payment gateways`);
  }

  async createApiKeys() {
    console.log('🔑 Creating API keys...');
    
    const apiKeys = [];
    const users = this.createdData.users.filter(u => u.role === 'admin' || u.role === 'manager');
    
    for (const user of users.slice(0, 5)) {
      apiKeys.push({
        userId: user._id,
        name: `${user.name}'s API Key`,
        keyId: `ak_${faker.random.alphaNumeric(16)}`,
        keySecret: faker.random.alphaNumeric(32),
        permissions: ['read', 'write'],
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        lastUsedAt: faker.date.recent(),
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        },
        usage: {
          totalRequests: Math.floor(Math.random() * 1000),
          lastRequest: faker.date.recent()
        }
      });
    }

    await ApiKey.insertMany(apiKeys);
    console.log(`✅ Created ${apiKeys.length} API keys`);
  }

  async run() {
    console.log('🚀 Starting comprehensive database seeding...\n');
    
    await this.connectDB();
    await this.clearDatabase();
    
    // Create core data first
    await this.createPlans();
    await this.createUsers();
    
    // Create dependent data
    await this.createLeads();
    await this.createActivities();
    await this.createTasks();
    await this.createWorkflows();
    await this.createMessages();
    await this.createKnowledgeBase();
    await this.createPayments();
    await this.createNotifications();
    await this.createSecurityAlerts();
    await this.createSystemMetrics();
    await this.createEmailTemplates();
    await this.createPaymentGateways();
    await this.createApiKeys();
    
    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`✅ Users: ${this.createdData.users.length}`);
    console.log(`✅ Plans: ${this.createdData.plans.length}`);
    console.log(`✅ Leads: ${this.createdData.leads.length}`);
    console.log(`✅ Workflows: ${this.createdData.workflows.length}`);
    console.log(`✅ And many more supporting records...`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@aiagentcrm.com / admin123');
    console.log('User: Check generated users in database\n');
  }
}

// CLI Interface
async function main() {
  const options = {};
  
  // Parse command line arguments
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value && !isNaN(value)) {
        options[key] = parseInt(value);
      }
    }
  }
  
  const seeder = new ComprehensiveSeeder(options);
  
  try {
    await seeder.run();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from database');
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveSeeder; 