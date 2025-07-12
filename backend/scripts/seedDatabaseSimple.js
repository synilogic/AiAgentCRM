const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@aiagentcrm.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      name: 'AI Agent CRM Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      businessName: 'AI Agent CRM Admin Panel',
      isEmailVerified: true,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        autoRenew: true
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        theme: 'light'
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    console.log('🔑 Password: admin123');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Seed plans
const seedPlans = async () => {
  try {
    const existingPlans = await Plan.countDocuments();
    
    if (existingPlans > 0) {
      console.log('✅ Plans already exist');
      return;
    }

    const plans = [
      {
        name: 'Starter',
        description: 'Perfect for small businesses just getting started with AI-powered CRM',
        type: 'basic',
        price: {
          monthly: 29,
          yearly: 290,
          currency: 'USD'
        },
        limits: {
          leads: 100,
          aiReplies: 50,
          followUps: 25,
          messages: 500,
          apiCalls: 1000,
          storage: 1024, // 1GB
          teamMembers: 1,
          workflows: 3,
          integrations: 2
        },
        features: {
          aiAssistant: true,
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
        name: 'Professional',
        description: 'Advanced features for growing businesses with team collaboration',
        type: 'pro',
        price: {
          monthly: 79,
          yearly: 790,
          currency: 'USD'
        },
        limits: {
          leads: 1000,
          aiReplies: 500,
          followUps: 250,
          messages: 5000,
          apiCalls: 10000,
          storage: 5120, // 5GB
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
          prioritySupport: false,
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
        description: 'Complete solution for large organizations with advanced integrations',
        type: 'enterprise',
        price: {
          monthly: 199,
          yearly: 1990,
          currency: 'USD'
        },
        limits: {
          leads: -1, // Unlimited
          aiReplies: -1,
          followUps: -1,
          messages: -1,
          apiCalls: -1,
          storage: 20480, // 20GB
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

    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(`✅ Created plan: ${plan.name}`);
    }

    console.log('✅ All plans created successfully');
  } catch (error) {
    console.error('❌ Error creating plans:', error);
    throw error;
  }
};

// Create sample users for testing
const seedSampleUsers = async () => {
  try {
    const existingUsers = await User.countDocuments({ role: 'user' });
    
    if (existingUsers > 0) {
      console.log('✅ Sample users already exist');
      return;
    }

    const plans = await Plan.find();
    const starterPlan = plans.find(p => p.type === 'basic');
    const proPlan = plans.find(p => p.type === 'pro');

    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        businessName: 'John\'s Business Solutions',
        industry: 'Technology',
        companySize: '1-10',
        plan: starterPlan?._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        isEmailVerified: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        businessName: 'Creative Marketing Agency',
        industry: 'Marketing',
        companySize: '11-50',
        plan: proPlan?._id,
        subscription: {
          status: 'trial',
          startDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        isEmailVerified: true
      },
      {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        businessName: 'E-commerce Store',
        industry: 'Retail',
        companySize: '1-10',
        subscription: {
          status: 'inactive',
          autoRenew: false
        },
        isEmailVerified: false
      }
    ];

    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created sample user: ${user.email}`);
    }

    console.log('✅ All sample users created successfully');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    await seedAdminUser();
    await seedPlans();
    await seedSampleUsers();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('📧 Email: admin@aiagentcrm.com');
    console.log('🔑 Password: admin123');
    console.log('\n🚀 You can now start the backend server and access the admin panel!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedAdminUser,
  seedPlans,
  seedSampleUsers,
  connectDB
}; 