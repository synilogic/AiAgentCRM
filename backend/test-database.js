const mongoose = require('mongoose');
const Plan = require('./models/Plan');
const User = require('./models/User');
const Lead = require('./models/Lead');

async function testDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/AIAgentCRM');
    console.log('🔌 Connected to MongoDB');
    
    // Test 1: Check plans
    const plans = await Plan.find({ status: 'active' }).sort({ sortOrder: 1 });
    console.log('📊 Plans available:', plans.length);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: ₹${plan.price.monthly}/month (${plan.price.currency})`);
    });
    
    // Test 2: Check users with plans
    const users = await User.find({ plan: { $exists: true } }).populate('plan');
    console.log('👥 Users with plans:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email}: ${user.plan?.name || 'No plan'} (${user.subscription?.status})`);
    });
    
    // Test 3: Check leads
    const leads = await Lead.find().limit(5);
    console.log('📝 Sample leads:', leads.length);
    leads.forEach(lead => {
      console.log(`  - ${lead.name}: ${lead.status} (₹${lead.dealValue || 0})`);
    });
    
    // Test 4: Verify INR currency
    const inrPlans = await Plan.find({ 'price.currency': 'INR' });
    console.log('💰 Plans with INR currency:', inrPlans.length + '/' + plans.length);
    
    console.log('✅ Database verification completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database test failed:', err);
    process.exit(1);
  }
}

testDatabase(); 