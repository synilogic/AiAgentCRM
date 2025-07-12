const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Lead = require('../models/Lead');
const EmailTemplate = require('../models/EmailTemplate');
const PaymentGateway = require('../models/PaymentGateway');
const Activity = require('../models/Activity');
const KnowledgeBase = require('../models/KnowledgeBase');
const Notification = require('../models/Notification');

// Connect to database
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Clear existing data
async function clearDatabase() {
  try {
    await Promise.all([
      User.deleteMany({ email: { $ne: 'admin@aiagentcrm.com' } }), // Keep admin
      Plan.deleteMany({}),
      Lead.deleteMany({}),
      Activity.deleteMany({}),
      KnowledgeBase.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data (except admin)');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
}

// Create pricing plans with INR currency
async function createPlans() {
  try {
    const plans = [
      {
        name: 'Basic',
        description: 'Perfect for small businesses starting with WhatsApp automation',
        type: 'basic',
        price: {
          monthly: 999,
          yearly: 9990, // 2 months free
          currency: 'INR'
        },
        limits: {
          leads: 500,
          aiReplies: 1000,
          followUps: 100,
          messages: 2000,
          apiCalls: 5000,
          storage: 1024, // 1GB
          teamMembers: 2,
          workflows: 5,
          integrations: 3
        },
        features: {
          aiAssistant: true,
          whatsappIntegration: true,
          googleSheetsIntegration: false,
          facebookAdsIntegration: false,
          advancedAnalytics: false,
          customWorkflows: false,
          teamCollaboration: true,
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
        isPopular: false,
        trialDays: 14,
        category: 'starter',
        sortOrder: 1
      },
      {
        name: 'Pro',
        description: 'Advanced features for growing businesses with team collaboration',
        type: 'pro',
        price: {
          monthly: 2999,
          yearly: 29990, // 4 months free
          currency: 'INR'
        },
        limits: {
          leads: 2000,
          aiReplies: 5000,
          followUps: 500,
          messages: 10000,
          apiCalls: 25000,
          storage: 5120, // 5GB
          teamMembers: 10,
          workflows: 25,
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
        trialDays: 14,
        category: 'professional',
        sortOrder: 2
      },
      {
        name: 'Enterprise',
        description: 'Complete solution for large organizations with custom requirements',
        type: 'enterprise',
        price: {
          monthly: 9999,
          yearly: 99990, // 2 months free
          currency: 'INR'
        },
        limits: {
          leads: -1, // Unlimited
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
        isPopular: false,
        trialDays: 30,
        category: 'enterprise',
        sortOrder: 3
      }
    ];

    const createdPlans = await Plan.insertMany(plans);
    console.log('📊 Created pricing plans:', createdPlans.map(p => `${p.name} (₹${p.price.monthly}/month)`));
    return createdPlans;
  } catch (error) {
    console.error('❌ Error creating plans:', error);
    return [];
  }
}

// Create test users with different plans
async function createUsers(plans) {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: hashedPassword,
        role: 'user',
        businessName: 'Digital Marketing Solutions',
        industry: 'Marketing',
        phone: '+91-9876543210',
        plan: plans[0]._id, // Basic plan
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'razorpay'
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          theme: 'light'
        }
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: hashedPassword,
        role: 'user',
        businessName: 'E-commerce Ventures',
        industry: 'E-commerce',
        phone: '+91-9876543211',
        plan: plans[1]._id, // Pro plan
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'razorpay'
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          theme: 'dark'
        }
      },
      {
        name: 'Arjun Singh',
        email: 'arjun@example.com',
        password: hashedPassword,
        role: 'user',
        businessName: 'Tech Innovations Ltd',
        industry: 'Technology',
        phone: '+91-9876543212',
        plan: plans[2]._id, // Enterprise plan
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          paymentMethod: 'razorpay'
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          theme: 'light'
        }
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@example.com',
        password: hashedPassword,
        role: 'user',
        businessName: 'Healthcare Solutions',
        industry: 'Healthcare',
        phone: '+91-9876543213',
        plan: plans[0]._id, // Basic plan
        subscription: {
          status: 'trial',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          paymentMethod: null
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          theme: 'light'
        }
      },
      {
        name: 'Vikram Mehta',
        email: 'vikram@example.com',
        password: hashedPassword,
        role: 'user',
        businessName: 'Real Estate Pro',
        industry: 'Real Estate',
        phone: '+91-9876543214',
        plan: plans[1]._id, // Pro plan
        subscription: {
          status: 'expired',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'razorpay'
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          theme: 'light'
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('👥 Created test users:', createdUsers.map(u => `${u.name} (${u.email})`));
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

// Create sample leads
async function createLeads(users) {
  try {
    const leads = [];
    const statuses = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'];
    const sources = ['whatsapp', 'website', 'facebook', 'google_sheets', 'referral', 'manual'];
    
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const lead = {
        userId: user._id,
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        phone: `+91-98765432${i.toString().padStart(2, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        dealValue: Math.floor(Math.random() * 100000) + 5000,
        currency: 'INR',
        tags: ['demo', 'interested'],
        notes: `Sample lead ${i + 1} created for testing purposes`,
        lastContact: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        nextFollowUp: new Date(Date.now() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
        score: Math.floor(Math.random() * 100),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      };
      leads.push(lead);
    }

    const createdLeads = await Lead.insertMany(leads);
    console.log(`📝 Created ${createdLeads.length} sample leads`);
    return createdLeads;
  } catch (error) {
    console.error('❌ Error creating leads:', error);
    return [];
  }
}

// Create sample activities
async function createActivities(users, leads) {
  try {
    const activities = [];
    const activityTypes = ['lead_created', 'lead_updated', 'message_sent', 'call_made', 'email_sent', 'followup_scheduled'];
    
    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const lead = leads[Math.floor(Math.random() * leads.length)];
      
      const activity = {
        userId: user._id,
        leadId: lead._id,
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        description: `Sample activity ${i + 1}`,
        metadata: {
          source: 'system',
          automated: Math.random() > 0.5
        },
        source: 'system',
        platform: 'web',
        status: 'completed',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      };
      activities.push(activity);
    }

    const createdActivities = await Activity.insertMany(activities);
    console.log(`📊 Created ${createdActivities.length} sample activities`);
    return createdActivities;
  } catch (error) {
    console.error('❌ Error creating activities:', error);
    return [];
  }
}

// Create sample knowledge base items
async function createKnowledgeBase(users) {
  try {
    const knowledgeItems = [
      {
        userId: users[0]._id,
        title: 'WhatsApp Business API Setup Guide',
        content: 'Complete guide on setting up WhatsApp Business API for automated messaging...',
        summary: 'Step-by-step guide for WhatsApp Business API integration',
        category: 'technical',
        type: 'document',
        tags: ['whatsapp', 'api', 'setup', 'guide'],
        keywords: ['whatsapp', 'business', 'api', 'setup', 'integration'],
        language: 'en',
        priority: 8,
        status: 'active'
      },
      {
        userId: users[1]._id,
        title: 'Lead Qualification Best Practices',
        content: 'Learn how to effectively qualify leads using AI-powered responses...',
        summary: 'Best practices for qualifying leads in CRM',
        category: 'sales',
        type: 'faq',
        tags: ['leads', 'qualification', 'sales', 'best-practices'],
        keywords: ['lead', 'qualification', 'sales', 'crm'],
        language: 'en',
        priority: 7,
        status: 'active'
      },
      {
        userId: users[2]._id,
        title: 'Customer Support Response Templates',
        content: 'Pre-built templates for common customer support scenarios...',
        summary: 'Ready-to-use customer support templates',
        category: 'support',
        type: 'template',
        tags: ['support', 'templates', 'customer-service'],
        keywords: ['support', 'customer', 'templates', 'responses'],
        language: 'en',
        priority: 6,
        status: 'active'
      }
    ];

    const createdKnowledge = await KnowledgeBase.insertMany(knowledgeItems);
    console.log(`📚 Created ${createdKnowledge.length} knowledge base items`);
    return createdKnowledge;
  } catch (error) {
    console.error('❌ Error creating knowledge base:', error);
    return [];
  }
}

// Update payment gateways to use INR
async function updatePaymentGateways() {
  try {
    await PaymentGateway.updateMany(
      {},
      {
        $set: {
          'configuration.currency': 'INR',
          'configuration.country': 'IN'
        }
      }
    );
    console.log('💳 Updated payment gateways to use INR currency');
  } catch (error) {
    console.error('❌ Error updating payment gateways:', error);
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const plans = await createPlans();
    const users = await createUsers(plans);
    const leads = await createLeads(users);
    const activities = await createActivities(users, leads);
    const knowledge = await createKnowledgeBase(users);
    
    await updatePaymentGateways();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${plans.length} pricing plans created`);
    console.log(`   • ${users.length} test users created`);
    console.log(`   • ${leads.length} sample leads created`);
    console.log(`   • ${activities.length} activities created`);
    console.log(`   • ${knowledge.length} knowledge items created`);
    console.log('\n🔑 Test Credentials:');
    console.log('   • Admin: admin@aiagentcrm.com / admin123');
    console.log('   • User: rahul@example.com / password123');
    console.log('   • User: priya@example.com / password123');
    console.log('   • User: arjun@example.com / password123');
    console.log('\n💰 Plans Available:');
    console.log('   • Basic: ₹999/month');
    console.log('   • Pro: ₹2,999/month (Popular)');
    console.log('   • Enterprise: ₹9,999/month');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 