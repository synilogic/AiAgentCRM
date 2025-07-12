const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Lead = require('../models/Lead');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Workflow = require('../models/Workflow');
const WorkflowExecution = require('../models/WorkflowExecution');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const KnowledgeBase = require('../models/KnowledgeBase');
const EmailTemplate = require('../models/EmailTemplate');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...');
  
  const collections = [
    User, Lead, Plan, Payment, Message, Notification, 
    Workflow, WorkflowExecution, Activity, Task, 
    KnowledgeBase, EmailTemplate
  ];

  for (const Model of collections) {
    try {
      await Model.deleteMany({});
      console.log(`✅ Cleared ${Model.modelName}`);
    } catch (error) {
      console.error(`❌ Error clearing ${Model.modelName}:`, error);
    }
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@aiagentcrm.com',
      password: adminPassword,
      role: 'admin',
      phone: '+91 98765 43210',
      status: 'active',
      plan: null, // Will be set after plans are created
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      settings: {
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisible: true, dataSharing: false },
        preferences: { language: 'en', timezone: 'Asia/Kolkata', theme: 'light' }
      }
    },
    {
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+91 90000 11111',
      status: 'active',
      company: 'Updated Business',
      plan: null,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    },
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+91 90000 22222',
      status: 'active',
      company: 'E-commerce Ventures',
      plan: null
    },
    {
      name: 'Arjun Patel',
      email: 'arjun@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+91 90000 33333',
      status: 'active',
      company: 'Tech Innovations Ltd',
      plan: null
    },
    {
      name: 'Sneha Singh',
      email: 'sneha@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+91 90000 44444',
      status: 'active',
      company: 'Healthcare Solutions',
      plan: null
    },
    {
      name: 'Vikram Reddy',
      email: 'vikram@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+91 90000 55555',
      status: 'active',
      company: 'Real Estate Pro',
      plan: null
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedPlans() {
  console.log('💰 Seeding subscription plans...');
  
  const plans = [
    {
      name: 'Basic',
      description: 'Perfect for small businesses starting with WhatsApp automation',
      type: 'basic',
      price: {
        monthly: 499,
        yearly: 4990,
        currency: 'INR'
      },
      features: {
        whatsappIntegration: true,
        aiAssistant: true,
        basicAnalytics: true,
        emailSupport: true,
        advancedAnalytics: false,
        customWorkflows: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        multiUser: false
      },
      limits: {
        leads: 1000,
        messages: 5000,
        aiReplies: 500,
        workflows: 5,
        teamMembers: 1,
        integrations: 3,
        storage: 1 // GB
      },
      isPopular: false,
      status: 'active',
      isPublic: true,
      trialDays: 14,
      category: 'starter',
      sortOrder: 1
    },
    {
      name: 'Pro',
      description: 'Advanced features for growing businesses with team collaboration',
      type: 'pro',
      price: {
        monthly: 999,
        yearly: 9990,
        currency: 'INR'
      },
      features: {
        whatsappIntegration: true,
        aiAssistant: true,
        basicAnalytics: true,
        emailSupport: true,
        advancedAnalytics: true,
        customWorkflows: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: false,
        multiUser: true
      },
      limits: {
        leads: 10000,
        messages: 50000,
        aiReplies: 5000,
        workflows: 50,
        teamMembers: 5,
        integrations: 10,
        storage: 10 // GB
      },
      isPopular: true,
      status: 'active',
      isPublic: true,
      trialDays: 14,
      category: 'professional',
      sortOrder: 2
    },
    {
      name: 'Enterprise',
      description: 'Complete solution for large organizations with custom requirements',
      type: 'enterprise',
      price: {
        monthly: 2499,
        yearly: 24990,
        currency: 'INR'
      },
      features: {
        whatsappIntegration: true,
        aiAssistant: true,
        basicAnalytics: true,
        emailSupport: true,
        advancedAnalytics: true,
        customWorkflows: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: true,
        multiUser: true
      },
      limits: {
        leads: -1, // unlimited
        messages: -1,
        aiReplies: -1,
        workflows: -1,
        teamMembers: 50,
        integrations: -1,
        storage: 100 // GB
      },
      isPopular: false,
      status: 'active',
      isPublic: true,
      trialDays: 30,
      category: 'enterprise',
      sortOrder: 3
    }
  ];

  const createdPlans = await Plan.insertMany(plans);
  console.log(`✅ Created ${createdPlans.length} plans`);
  return createdPlans;
}

async function seedLeads(users) {
  console.log('🎯 Seeding leads...');
  
  const leadStatuses = ['new', 'contacted', 'qualified', 'negotiation', 'closed_won', 'closed_lost'];
  const sources = ['website', 'whatsapp', 'referral', 'social_media', 'email_campaign', 'cold_call'];
  
  const leads = [
    {
      name: 'Rajesh Gupta',
      email: 'rajesh.gupta@techcorp.com',
      phone: '+91 98765 12345',
      company: 'TechCorp Solutions',
      position: 'CTO',
      source: 'website',
      status: 'qualified',
      priority: 'high',
      value: 150000,
      notes: 'Interested in enterprise automation solution',
      tags: ['enterprise', 'tech', 'hot_lead'],
      userId: users[1]._id,
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      additionalInfo: {
        industry: 'Technology',
        companySize: '100-500',
        budget: '1-5 Lakhs',
        timeline: '1-3 months'
      }
    },
    {
      name: 'Anita Desai',
      email: 'anita@ecommercehub.com',
      phone: '+91 99887 76543',
      company: 'E-commerce Hub',
      position: 'Marketing Manager',
      source: 'whatsapp',
      status: 'new',
      priority: 'medium',
      value: 75000,
      notes: 'Looking for WhatsApp marketing automation',
      tags: ['ecommerce', 'marketing', 'warm_lead'],
      userId: users[2]._id,
      location: { city: 'Delhi', state: 'Delhi', country: 'India' }
    },
    {
      name: 'Suresh Reddy',
      email: 'suresh@healthplus.com',
      phone: '+91 88776 65432',
      company: 'HealthPlus Clinic',
      position: 'Operations Head',
      source: 'referral',
      status: 'contacted',
      priority: 'high',
      value: 100000,
      notes: 'Patient appointment automation needed',
      tags: ['healthcare', 'appointments', 'automation'],
      userId: users[3]._id,
      location: { city: 'Bangalore', state: 'Karnataka', country: 'India' }
    },
    {
      name: 'Kavita Sharma',
      email: 'kavita@realestate.com',
      phone: '+91 77665 54321',
      company: 'Prime Properties',
      position: 'Sales Director',
      source: 'social_media',
      status: 'negotiation',
      priority: 'high',
      value: 200000,
      notes: 'Lead management for real estate business',
      tags: ['real_estate', 'sales', 'crm'],
      userId: users[4]._id,
      location: { city: 'Pune', state: 'Maharashtra', country: 'India' }
    },
    {
      name: 'Mohamed Ali',
      email: 'mohamed@retailmart.com',
      phone: '+91 66554 43210',
      company: 'RetailMart Chain',
      position: 'IT Manager',
      source: 'email_campaign',
      status: 'closed_won',
      priority: 'medium',
      value: 80000,
      notes: 'Customer support automation implemented',
      tags: ['retail', 'customer_support', 'won'],
      userId: users[5]._id,
      location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }
    },
    {
      name: 'Deepika Patel',
      email: 'deepika@fooddelivery.com',
      phone: '+91 55443 32109',
      company: 'QuickFood Delivery',
      position: 'Product Manager',
      source: 'cold_call',
      status: 'closed_lost',
      priority: 'low',
      value: 50000,
      notes: 'Budget constraints, may reconsider next quarter',
      tags: ['food_delivery', 'budget_issue', 'lost'],
      userId: users[1]._id,
      location: { city: 'Hyderabad', state: 'Telangana', country: 'India' }
    }
  ];

  // Add more leads for better testing
  for (let i = 7; i <= 20; i++) {
    leads.push({
      name: `Test Lead ${i}`,
      email: `testlead${i}@example.com`,
      phone: `+91 ${90000 + i}${String(i).padStart(4, '0')}`,
      company: `Test Company ${i}`,
      position: 'Manager',
      source: sources[i % sources.length],
      status: leadStatuses[i % leadStatuses.length],
      priority: ['low', 'medium', 'high'][i % 3],
      value: Math.floor(Math.random() * 200000) + 10000,
      notes: `Test notes for lead ${i}`,
      tags: ['test', 'demo'],
      userId: users[(i % (users.length - 1)) + 1]._id,
      location: { city: 'Test City', state: 'Test State', country: 'India' }
    });
  }

  const createdLeads = await Lead.insertMany(leads);
  console.log(`✅ Created ${createdLeads.length} leads`);
  return createdLeads;
}

async function seedMessages(users, leads) {
  console.log('💬 Seeding messages...');
  
  const messages = [];
  
  // Create messages for first 5 leads
  for (let i = 0; i < 5; i++) {
    const lead = leads[i];
    const user = users.find(u => u._id.toString() === lead.userId.toString());
    const roomId = `room_${user._id}_${lead._id}`;
    
    messages.push(
      {
        content: `Hi ${lead.name}, thank you for your interest in our AI Agent CRM solution!`,
        user: user._id,
        roomId: roomId,
        type: 'text',
        source: 'whatsapp',
        status: 'sent',
        priority: 'normal',
        metadata: {
          leadId: lead._id,
          leadName: lead.name,
          direction: 'outbound'
        }
      },
      {
        content: `Hi, I'm interested to know more about your automation features.`,
        user: user._id,
        roomId: roomId,
        type: 'text',
        source: 'whatsapp',
        status: 'delivered',
        priority: 'normal',
        readBy: [{ user: user._id, readAt: new Date() }],
        metadata: {
          leadId: lead._id,
          leadName: lead.name,
          direction: 'inbound'
        }
      }
    );
  }

  const createdMessages = await Message.insertMany(messages);
  console.log(`✅ Created ${createdMessages.length} messages`);
  return createdMessages;
}

async function seedWorkflows(users) {
  console.log('⚡ Seeding workflows...');
  
  const workflows = [
    {
      name: 'Welcome New Lead',
      description: 'Automated welcome sequence for new leads',
      category: 'onboarding',
      trigger: {
        type: 'lead_created',
        conditions: []
      },
      actions: [
        {
          type: 'send_whatsapp',
          order: 1,
          delay: 5, // 5 minutes delay
          config: {
            message: 'Welcome! Thank you for your interest. How can we help you today?'
          }
        }
      ],
      status: 'active',
      isActive: true,
      userId: users[1]._id
    },
    {
      name: 'Follow-up Qualified Leads',
      description: 'Follow up with qualified leads after 24 hours',
      category: 'follow_up',
      trigger: {
        type: 'lead_status_changed',
        conditions: [
          { field: 'status', operator: 'equals', value: 'qualified' }
        ]
      },
      actions: [
        {
          type: 'send_whatsapp',
          order: 1,
          delay: 1440, // 24 hours delay
          config: {
            message: 'Hi {{name}}, shall we schedule a call to discuss your requirements?'
          }
        },
        {
          type: 'create_task',
          order: 2,
          delay: 0,
          config: {
            taskTitle: 'Follow up with {{name}}',
            taskDescription: 'Schedule a call to discuss requirements',
            dueDate: '3 days'
          }
        }
      ],
      status: 'active',
      isActive: true,
      userId: users[2]._id
    },
    {
      name: 'Tag High-Value Leads',
      description: 'Automatically tag leads with high deal values',
      category: 'lead_nurturing',
      trigger: {
        type: 'lead_created',
        conditions: [
          { field: 'dealValue', operator: 'greater_than', value: 100000 }
        ]
      },
      actions: [
        {
          type: 'add_tag',
          order: 1,
          delay: 0,
          config: {
            tag: 'high_value'
          }
        },
        {
          type: 'change_status',
          order: 2,
          delay: 0,
          config: {
            field: 'priority',
            value: 'high'
          }
        }
      ],
      status: 'active',
      isActive: true,
      userId: users[3]._id
    }
  ];

  const createdWorkflows = await Workflow.insertMany(workflows);
  console.log(`✅ Created ${createdWorkflows.length} workflows`);
  return createdWorkflows;
}

async function seedTasks(users, leads) {
  console.log('📋 Seeding tasks...');
  
  const tasks = [
    {
      title: 'Call Rajesh Gupta',
      description: 'Follow up call to discuss enterprise solution pricing',
      type: 'call',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignee: users[1]._id,
      createdBy: users[1]._id,
      leadId: leads[0]._id,
      userId: users[1]._id,
      estimatedDuration: 30,
      metadata: {
        callType: 'sales',
        notes: 'Prepare pricing document'
      }
    },
    {
      title: 'Send proposal to Anita',
      description: 'Prepare and send WhatsApp marketing automation proposal',
      type: 'email',
      priority: 'medium',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignee: users[2]._id,
      createdBy: users[2]._id,
      leadId: leads[1]._id,
      userId: users[2]._id,
      estimatedDuration: 60,
      progress: 50
    },
    {
      title: 'Demo HealthPlus integration',
      description: 'Show appointment booking automation demo',
      type: 'meeting',
      priority: 'high',
      status: 'completed',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedDate: new Date(),
      assignee: users[3]._id,
      createdBy: users[3]._id,
      leadId: leads[2]._id,
      userId: users[3]._id,
      estimatedDuration: 45,
      actualDuration: 50,
      progress: 100
    }
  ];

  const createdTasks = await Task.insertMany(tasks);
  console.log(`✅ Created ${createdTasks.length} tasks`);
  return createdTasks;
}

async function seedKnowledgeBase(users) {
  console.log('📚 Seeding knowledge base...');
  
  const knowledgeItems = [
    {
      title: 'Getting Started with WhatsApp Integration',
      content: 'This guide will help you set up WhatsApp Business API integration with AI Agent CRM. Step 1: Configure your WhatsApp Business account. Step 2: Generate API keys. Step 3: Set up webhook URLs.',
      summary: 'Complete guide for WhatsApp Business API integration setup',
      type: 'document',
      category: 'technical',
      tags: ['whatsapp', 'integration', 'setup', 'api'],
      status: 'active',
      isActive: true,
      userId: users[0]._id,
      visibility: 'public',
      qualityScore: 85,
      metadata: {
        author: 'Admin User',
        department: 'Technical',
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    },
    {
      title: 'AI Reply Configuration',
      content: 'Learn how to configure AI-powered automatic replies for common customer queries. Use intent recognition to categorize messages. Set up response templates for different scenarios.',
      summary: 'Guide to configure AI-powered automatic replies',
      type: 'faq',
      category: 'product',
      tags: ['ai', 'automation', 'replies', 'chatbot'],
      status: 'active',
      isActive: true,
      userId: users[0]._id,
      visibility: 'public',
      qualityScore: 90
    },
    {
      title: 'Lead Scoring Best Practices',
      content: 'Optimize your lead scoring system for better conversion rates. Consider engagement, company size, budget, and timeline factors. Use demographic and behavioral data.',
      summary: 'Best practices for effective lead scoring',
      type: 'document',
      category: 'sales',
      tags: ['leads', 'scoring', 'conversion', 'sales'],
      status: 'active',
      isActive: true,
      userId: users[0]._id,
      visibility: 'public',
      qualityScore: 88
    },
    {
      title: 'Common Integration Issues',
      content: 'Troubleshooting guide for common integration problems. Check API credentials, verify webhook URLs, ensure proper permissions.',
      summary: 'Troubleshooting guide for integration issues',
      type: 'faq',
      category: 'support',
      tags: ['troubleshooting', 'integration', 'support'],
      status: 'active',
      isActive: true,
      userId: users[0]._id,
      visibility: 'public',
      qualityScore: 82
    }
  ];

  const createdKnowledge = await KnowledgeBase.insertMany(knowledgeItems);
  console.log(`✅ Created ${createdKnowledge.length} knowledge base items`);
  return createdKnowledge;
}

async function seedNotifications(users) {
  console.log('🔔 Seeding notifications...');
  
  const notifications = [
    {
      title: 'Welcome to AI Agent CRM',
      message: 'Thank you for joining us! Complete your profile setup to get started.',
      type: 'info',
      category: 'system',
      priority: 'medium',
      user: users[1]._id,
      isRead: false,
      action: {
        type: 'link',
        label: 'Complete Profile',
        url: '/settings/profile'
      },
      metadata: {
        action: 'complete_profile',
        priority: 'medium'
      }
    },
    {
      title: 'New Lead Assigned',
      message: 'You have been assigned a new high-priority lead: Rajesh Gupta',
      type: 'success',
      category: 'leads',
      priority: 'high',
      user: users[1]._id,
      isRead: true,
      deliveryStatus: {
        inApp: { sent: true, sentAt: new Date(), readAt: new Date() }
      },
      metadata: {
        leadId: 'lead_id_here',
        priority: 'high'
      }
    },
    {
      title: 'Task Due Tomorrow',
      message: 'Task "Call Rajesh Gupta" is due tomorrow',
      type: 'warning',
      category: 'system',
      priority: 'high',
      user: users[1]._id,
      isRead: false,
      action: {
        type: 'link',
        label: 'View Task',
        url: '/tasks'
      },
      metadata: {
        taskId: 'task_id_here',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    },
    {
      title: 'Workflow Execution Complete',
      message: 'Welcome New Lead workflow has been executed successfully',
      type: 'success',
      category: 'system',
      priority: 'low',
      user: users[2]._id,
      isRead: false,
      metadata: {
        workflowId: 'workflow_id_here',
        executionStatus: 'success'
      }
    },
    {
      title: 'Payment Received',
      message: 'Payment for Pro plan has been received and activated',
      type: 'success',
      category: 'payments',
      priority: 'medium',
      user: users[3]._id,
      isRead: false,
      metadata: {
        planName: 'Pro',
        amount: 999,
        currency: 'INR'
      }
    }
  ];

  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
}

async function seedEmailTemplates(users) {
  console.log('📧 Seeding email templates...');
  
  const templates = [
    {
      name: 'welcome_email',
      displayName: 'Welcome Email',
      subject: 'Welcome to {{company_name}}!',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome {{customer_name}}!</h2>
          <p>Thank you for your interest in our AI Agent CRM solution.</p>
          <p>We're excited to help you automate and streamline your business processes.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <h3>Getting Started:</h3>
            <ul>
              <li>Complete your profile setup</li>
              <li>Configure your WhatsApp integration</li>
              <li>Import your existing leads</li>
            </ul>
          </div>
          <p>Best regards,<br>The AI Agent CRM Team</p>
        </div>
      `,
      textContent: `Welcome {{customer_name}}!\n\nThank you for your interest in our AI Agent CRM solution.\n\nWe're excited to help you automate and streamline your business processes.\n\nGetting Started:\n- Complete your profile setup\n- Configure your WhatsApp integration\n- Import your existing leads\n\nBest regards,\nThe AI Agent CRM Team`,
      category: 'user_management',
      isActive: true,
      createdBy: users[0]._id,
      variables: [
        { name: 'customer_name', description: 'Customer full name', required: true },
        { name: 'company_name', description: 'Company name', required: false, defaultValue: 'AI Agent CRM' }
      ]
    },
    {
      name: 'followup_email',
      displayName: 'Follow-up Email',
      subject: 'Following up on your inquiry about {{product_name}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hi {{customer_name}},</p>
          <p>I wanted to follow up on your recent inquiry about our {{product_name}} solution.</p>
          <p>Do you have any questions I can help answer? I'm here to help you understand how our platform can benefit your business.</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="{{calendar_link}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Schedule a Demo</a>
          </div>
          <p>Best regards,<br>{{sender_name}}<br>{{sender_title}}</p>
        </div>
      `,
      textContent: `Hi {{customer_name}},\n\nI wanted to follow up on your recent inquiry about our {{product_name}} solution.\n\nDo you have any questions I can help answer? I'm here to help you understand how our platform can benefit your business.\n\nSchedule a demo: {{calendar_link}}\n\nBest regards,\n{{sender_name}}\n{{sender_title}}`,
      category: 'marketing',
      isActive: true,
      createdBy: users[0]._id,
      variables: [
        { name: 'customer_name', description: 'Customer full name', required: true },
        { name: 'product_name', description: 'Product or service name', required: true },
        { name: 'sender_name', description: 'Sender full name', required: true },
        { name: 'sender_title', description: 'Sender job title', required: false, defaultValue: 'Sales Representative' },
        { name: 'calendar_link', description: 'Calendar booking link', required: false, defaultValue: '#' }
      ]
    },
    {
      name: 'payment_confirmation',
      displayName: 'Payment Confirmation',
      subject: 'Payment Confirmed - {{plan_name}} Plan',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Payment Confirmed!</h2>
          <p>Dear {{customer_name}},</p>
          <p>Your payment has been successfully processed and your {{plan_name}} plan has been activated.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Plan:</strong> {{plan_name}}</li>
              <li><strong>Amount:</strong> {{currency}} {{amount}}</li>
              <li><strong>Billing Cycle:</strong> {{billing_cycle}}</li>
              <li><strong>Next Billing Date:</strong> {{next_billing_date}}</li>
            </ul>
          </div>
          <p>You can now access all the features of your {{plan_name}} plan.</p>
          <p>Thank you for choosing AI Agent CRM!</p>
        </div>
      `,
      textContent: `Payment Confirmed!\n\nDear {{customer_name}},\n\nYour payment has been successfully processed and your {{plan_name}} plan has been activated.\n\nPayment Details:\n- Plan: {{plan_name}}\n- Amount: {{currency}} {{amount}}\n- Billing Cycle: {{billing_cycle}}\n- Next Billing Date: {{next_billing_date}}\n\nYou can now access all the features of your {{plan_name}} plan.\n\nThank you for choosing AI Agent CRM!`,
      category: 'billing',
      isActive: true,
      createdBy: users[0]._id,
      variables: [
        { name: 'customer_name', description: 'Customer full name', required: true },
        { name: 'plan_name', description: 'Subscription plan name', required: true },
        { name: 'amount', description: 'Payment amount', required: true },
        { name: 'currency', description: 'Currency symbol', required: false, defaultValue: '₹' },
        { name: 'billing_cycle', description: 'Billing cycle (monthly/yearly)', required: true },
        { name: 'next_billing_date', description: 'Next billing date', required: true }
      ]
    },
    {
      name: 'system_notification',
      displayName: 'System Notification',
      subject: 'System Update: {{notification_title}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #17a2b8;">{{notification_title}}</h2>
          <p>Dear {{customer_name}},</p>
          <div style="padding: 15px; border-left: 4px solid #17a2b8; background-color: #f8f9fa; margin: 20px 0;">
            {{notification_content}}
          </div>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>AI Agent CRM Team</p>
        </div>
      `,
      textContent: `{{notification_title}}\n\nDear {{customer_name}},\n\n{{notification_content}}\n\nIf you have any questions, please don't hesitate to contact our support team.\n\nBest regards,\nAI Agent CRM Team`,
      category: 'system',
      isActive: true,
      createdBy: users[0]._id,
      variables: [
        { name: 'customer_name', description: 'Customer full name', required: true },
        { name: 'notification_title', description: 'Notification title', required: true },
        { name: 'notification_content', description: 'Notification content', required: true }
      ]
    }
  ];

  const createdTemplates = await EmailTemplate.insertMany(templates);
  console.log(`✅ Created ${createdTemplates.length} email templates`);
  return createdTemplates;
}

async function updateUserPlans(users, plans) {
  console.log('🔄 Updating user plans...');
  
  // Assign plans to users
  users[0].plan = plans[2]._id; // Admin gets Enterprise
  users[1].plan = plans[1]._id; // Rahul gets Pro
  users[2].plan = plans[1]._id; // Priya gets Pro
  users[3].plan = plans[0]._id; // Arjun gets Basic
  users[4].plan = plans[1]._id; // Sneha gets Pro
  users[5].plan = plans[0]._id; // Vikram gets Basic

  for (const user of users) {
    await User.findByIdAndUpdate(user._id, { plan: user.plan });
  }

  console.log('✅ Updated user plans');
}

async function createSamplePayments(users, plans) {
  console.log('💳 Creating sample payments...');
  
  const payments = [
    {
      user: users[1]._id,
      plan: plans[1]._id,
      amount: 999,
      currency: 'INR',
      description: 'Pro plan monthly subscription',
      status: 'completed',
      gateway: 'razorpay',
      gatewayOrderId: 'order_test_001',
      gatewayPaymentId: 'pay_test_001',
      paymentMethod: 'card',
      completedAt: new Date(),
      processedAt: new Date(Date.now() - 5000),
      metadata: {
        planName: 'Pro',
        planType: 'pro',
        billingCycle: 'monthly',
        userEmail: users[1].email
      }
    },
    {
      user: users[2]._id,
      plan: plans[1]._id,
      amount: 9990,
      currency: 'INR',
      description: 'Pro plan yearly subscription',
      status: 'completed',
      gateway: 'razorpay',
      gatewayOrderId: 'order_test_002',
      gatewayPaymentId: 'pay_test_002',
      paymentMethod: 'upi',
      completedAt: new Date(),
      processedAt: new Date(Date.now() - 3000),
      metadata: {
        planName: 'Pro',
        planType: 'pro',
        billingCycle: 'yearly',
        userEmail: users[2].email
      }
    },
    {
      user: users[3]._id,
      plan: plans[0]._id,
      amount: 499,
      currency: 'INR',
      description: 'Basic plan monthly subscription',
      status: 'completed',
      gateway: 'razorpay',
      gatewayOrderId: 'order_test_003',
      gatewayPaymentId: 'pay_test_003',
      paymentMethod: 'netbanking',
      completedAt: new Date(),
      processedAt: new Date(Date.now() - 2000),
      metadata: {
        planName: 'Basic',
        planType: 'basic',
        billingCycle: 'monthly',
        userEmail: users[3].email
      }
    },
    {
      user: users[4]._id,
      plan: plans[2]._id,
      amount: 2499,
      currency: 'INR',
      description: 'Enterprise plan monthly subscription',
      status: 'pending',
      gateway: 'razorpay',
      gatewayOrderId: 'order_test_004',
      gatewayPaymentId: 'pay_test_004',
      paymentMethod: 'card',
      metadata: {
        planName: 'Enterprise',
        planType: 'enterprise',
        billingCycle: 'monthly',
        userEmail: users[4].email
      }
    }
  ];

  const createdPayments = await Payment.insertMany(payments);
  console.log(`✅ Created ${createdPayments.length} sample payments`);
  return createdPayments;
}

async function createActivities(users, leads) {
  console.log('📊 Creating activities...');
  
  const activities = [];
  
  // Create activities for the first few leads
  for (let i = 0; i < 3; i++) {
    const lead = leads[i];
    const user = users.find(u => u._id.toString() === lead.userId.toString());
    
    activities.push(
      {
        type: 'lead_created',
        description: `New lead ${lead.name} was created`,
        userId: user._id,
        leadId: lead._id,
        metadata: {
          leadName: lead.name,
          leadStatus: lead.status,
          source: lead.source
        }
      },
      {
        type: 'message_sent',
        description: `Message sent to ${lead.name}`,
        userId: user._id,
        leadId: lead._id,
        metadata: {
          messageType: 'text',
          channel: 'whatsapp'
        }
      }
    );
  }

  const createdActivities = await Activity.insertMany(activities);
  console.log(`✅ Created ${createdActivities.length} activities`);
  return createdActivities;
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');
    
    await connectDatabase();
    await clearDatabase();
    
    // Seed all entities
    const users = await seedUsers();
    const plans = await seedPlans();
    const leads = await seedLeads(users);
    const messages = await seedMessages(users, leads);
    const workflows = await seedWorkflows(users);
    const tasks = await seedTasks(users, leads);
    const knowledgeBase = await seedKnowledgeBase(users);
    const notifications = await seedNotifications(users);
    const emailTemplates = await seedEmailTemplates(users);
    const activities = await createActivities(users, leads);
    
    // Update relationships
    await updateUserPlans(users, plans);
    const payments = await createSamplePayments(users, plans);
    
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`💰 Plans: ${plans.length}`);
    console.log(`🎯 Leads: ${leads.length}`);
    console.log(`💬 Messages: ${messages.length}`);
    console.log(`⚡ Workflows: ${workflows.length}`);
    console.log(`📋 Tasks: ${tasks.length}`);
    console.log(`📚 Knowledge Base: ${knowledgeBase.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`📧 Email Templates: ${emailTemplates.length}`);
    console.log(`📊 Activities: ${activities.length}`);
    console.log(`💳 Payments: ${payments.length}`);
    console.log('');
    console.log('🔑 Test Credentials:');
    console.log('Admin: admin@aiagentcrm.com / admin123');
    console.log('User: rahul@example.com / password123');
    console.log('User: priya@example.com / password123');
    console.log('User: arjun@example.com / password123');
    console.log('User: sneha@example.com / password123');
    console.log('User: vikram@example.com / password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

main(); 