const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Plan = require('../models/Plan');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Create default plans
    const plans = [
      {
        name: 'Basic Plan',
        type: 'basic',
        price: 29,
        features: [
          'Up to 100 leads',
          '50 AI replies per month',
          'Basic follow-up automation',
          'Email support'
        ],
        limits: {
          leads: 100,
          aiReplies: 50,
          followUps: 10
        }
      },
      {
        name: 'Pro Plan',
        type: 'pro',
        price: 79,
        features: [
          'Up to 500 leads',
          '200 AI replies per month',
          'Advanced follow-up automation',
          'Priority support',
          'Analytics dashboard'
        ],
        limits: {
          leads: 500,
          aiReplies: 200,
          followUps: 50
        }
      },
      {
        name: 'Enterprise Plan',
        type: 'enterprise',
        price: 199,
        features: [
          'Unlimited leads',
          'Unlimited AI replies',
          'Advanced automation',
          'Dedicated support',
          'Custom integrations',
          'White-label options'
        ],
        limits: {
          leads: -1, // Unlimited
          aiReplies: -1, // Unlimited
          followUps: -1 // Unlimited
        }
      }
    ];

    // Insert plans
    for (const planData of plans) {
      const existingPlan = await Plan.findOne({ type: planData.type });
      if (!existingPlan) {
        await Plan.create(planData);
        console.log(`✅ Created ${planData.name}`);
      } else {
        console.log(`⏭️  ${planData.name} already exists`);
      }
    }

    // Create admin user
    const adminEmail = 'admin@whatsappcrm.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const basicPlan = await Plan.findOne({ type: 'basic' });
      
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        plan: basicPlan._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });
      console.log('✅ Created admin user');
    } else {
      console.log('⏭️  Admin user already exists');
    }

    // Create test user
    const testEmail = 'test@whatsappcrm.com';
    const existingTestUser = await User.findOne({ email: testEmail });
    
    if (!existingTestUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      const basicPlan = await Plan.findOne({ type: 'basic' });
      
      await User.create({
        email: testEmail,
        password: hashedPassword,
        role: 'user',
        plan: basicPlan._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      console.log('✅ Created test user');
    } else {
      console.log('⏭️  Test user already exists');
    }

    console.log('🎉 Database seeding completed!');
    console.log('\n📋 Default credentials:');
    console.log('Admin: admin@whatsappcrm.com / admin123');
    console.log('User: test@whatsappcrm.com / test123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

module.exports = { seedDatabase }; 