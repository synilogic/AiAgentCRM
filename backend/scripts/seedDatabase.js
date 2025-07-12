const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Plan = require('../models/Plan');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagentcrm';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Plan.deleteMany({});
    console.log('Cleared existing data');

    // Seed Plans
    const plans = [
      {
        name: 'Free',
        description: 'Perfect for getting started',
        type: 'basic',
        price: {
          monthly: 0,
          yearly: 0,
          currency: 'INR'
        },
        limits: {
          leads: 100,
          aiReplies: 50,
          messages: 100,
          followUps: 10,
          apiCalls: 100,
          storage: 100,
          teamMembers: 1,
          workflows: 2,
          integrations: 1
        },
        features: {
          aiAssistant: false,
          whatsappIntegration: true,
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
          mobileApp: true,
          sso: false
        },
        status: 'active',
        isPublic: true,
        isPopular: false,
        trialDays: 14,
        sortOrder: 1,
        category: 'starter'
      },
      {
        name: 'Pro',
        description: 'For growing businesses',
        type: 'pro',
        price: {
          monthly: 2900,
          yearly: 29000,
          currency: 'INR'
        },
        limits: {
          leads: 1000,
          aiReplies: 500,
          messages: 1000,
          followUps: 100,
          apiCalls: 1000,
          storage: 1000,
          teamMembers: 5,
          workflows: 10,
          integrations: 5
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
        sortOrder: 2,
        category: 'professional'
      },
      {
        name: 'Enterprise',
        description: 'For large organizations',
        type: 'enterprise',
        price: {
          monthly: 9900,
          yearly: 99000,
          currency: 'INR'
        },
        limits: {
          leads: -1,
          aiReplies: -1,
          messages: -1,
          followUps: -1,
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
        trialDays: 14,
        sortOrder: 3,
        category: 'enterprise'
      }
    ];

    const createdPlans = await Plan.insertMany(plans);
    console.log(`Created ${createdPlans.length} plans`);

    // Get the free plan for default assignment
    const freePlan = createdPlans.find(p => p.type === 'basic');

    // Seed Users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@aiagentcrm.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        plan: freePlan._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        usage: {
          leads: 5,
          aiReplies: 15,
          messages: 25,
          followUps: 3,
          apiCalls: 50,
          storageUsed: 10
        },
        isEmailVerified: true
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        plan: freePlan._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        usage: {
          leads: 45,
          aiReplies: 120,
          messages: 89,
          followUps: 23,
          apiCalls: 200,
          storageUsed: 50
        },
        isEmailVerified: true
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        plan: createdPlans.find(p => p.type === 'pro')._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        usage: {
          leads: 234,
          aiReplies: 456,
          messages: 789,
          followUps: 67,
          apiCalls: 800,
          storageUsed: 200
        },
        isEmailVerified: true
      },
      {
        name: 'Arjun Singh',
        email: 'arjun@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        plan: freePlan._id,
        subscription: {
          status: 'trial',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          autoRenew: false
        },
        usage: {
          leads: 23,
          aiReplies: 45,
          messages: 67,
          followUps: 12,
          apiCalls: 100,
          storageUsed: 25
        },
        isEmailVerified: true
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        plan: createdPlans.find(p => p.type === 'enterprise')._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        usage: {
          leads: 1567,
          aiReplies: 2890,
          messages: 3456,
          followUps: 234,
          apiCalls: 5000,
          storageUsed: 800
        },
        isEmailVerified: true
      },
      {
        name: 'Vikram Gupta',
        email: 'vikram@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        plan: freePlan._id,
        subscription: {
          status: 'inactive',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          autoRenew: false
        },
        usage: {
          leads: 98,
          aiReplies: 45,
          messages: 123,
          followUps: 8,
          apiCalls: 150,
          storageUsed: 40
        },
        isEmailVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Seed Leads
    const leads = [
      {
        userId: createdUsers[1]._id, // rahul@example.com
        name: 'John Doe',
        email: 'john@company.com',
        phone: '+91-9876543210',
        company: 'Tech Solutions',
        status: 'new',
        source: 'website',
        tags: ['hot-lead', 'tech'],
        notes: 'Interested in enterprise solution',
        dealValue: 50000,
        currency: 'INR',
        probability: 70
      },
      {
        userId: createdUsers[2]._id, // priya@example.com
        name: 'Jane Smith',
        email: 'jane@startup.com',
        phone: '+91-9876543211',
        company: 'Startup Inc',
        status: 'contacted',
        source: 'referral',
        tags: ['startup', 'saas'],
        notes: 'Looking for affordable pricing',
        dealValue: 25000,
        currency: 'INR',
        probability: 50
      },
      {
        userId: createdUsers[1]._id, // rahul@example.com
        name: 'Mike Johnson',
        email: 'mike@enterprise.com',
        phone: '+91-9876543212',
        company: 'Enterprise Corp',
        status: 'qualified',
        source: 'social_media',
        tags: ['enterprise', 'priority'],
        notes: 'Decision maker, ready to purchase',
        dealValue: 100000,
        currency: 'INR',
        probability: 85
      },
      {
        userId: createdUsers[4]._id, // sneha@example.com
        name: 'Sarah Wilson',
        email: 'sarah@corporation.com',
        phone: '+91-9876543213',
        company: 'Big Corporation',
        status: 'proposal_sent',
        source: 'cold_call',
        tags: ['enterprise', 'decision-maker'],
        notes: 'Proposal sent for enterprise package',
        dealValue: 200000,
        currency: 'INR',
        probability: 60
      },
      {
        userId: createdUsers[3]._id, // arjun@example.com
        name: 'David Brown',
        email: 'david@smallbiz.com',
        phone: '+91-9876543214',
        company: 'Small Business Co',
        status: 'new',
        source: 'google_sheets',
        tags: ['small-business', 'trial'],
        notes: 'Small business looking for basic features',
        dealValue: 15000,
        currency: 'INR',
        probability: 30
      }
    ];

    const createdLeads = await Lead.insertMany(leads);
    console.log(`Created ${createdLeads.length} leads`);

    console.log('Database seeded successfully!');
    console.log('\n--- Seeded Data Summary ---');
    console.log(`Plans: ${createdPlans.length}`);
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Leads: ${createdLeads.length}`);
    
    console.log('\n--- Login Credentials ---');
    console.log('Admin: admin@aiagentcrm.com / admin123');
    console.log('User 1: rahul@example.com / password123 (Free Plan)');
    console.log('User 2: priya@example.com / password123 (Pro Plan)');
    console.log('User 3: arjun@example.com / password123 (Trial)');
    console.log('User 4: sneha@example.com / password123 (Enterprise Plan)');
    console.log('User 5: vikram@example.com / password123 (Inactive)');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase(); 