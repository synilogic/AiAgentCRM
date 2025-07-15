const mongoose = require('mongoose');
const MigrationManager = require('./migrate-enhanced');
const ComprehensiveSeeder = require('./seed-comprehensive-enhanced');
require('dotenv').config();

async function runMigrationAndSeed() {
  console.log('🗄️  AI Agent CRM - Migration & Seeding Tool');
  console.log('============================================\n');
  
  try {
    // Initialize migration manager
    const migrationManager = new MigrationManager();
    await migrationManager.connectDB();
    
    console.log('📋 Step 1: Running Migrations...');
    await migrationManager.runAllPending();
    
    console.log('\n📋 Step 2: Checking Migration Status...');
    await migrationManager.status();
    
    // Disconnect from migration manager
    await mongoose.disconnect();
    
    console.log('\n📋 Step 3: Running Comprehensive Seeder...');
    
    // Initialize seeder with custom options
    const seeder = new ComprehensiveSeeder({
      users: 10,      // Smaller numbers for faster testing
      leads: 30,
      messages: 50,
      activities: 40,
      tasks: 20,
      workflows: 5,
      payments: 10,
      notifications: 15,
      knowledgeBase: 10,
      securityAlerts: 5,
      systemMetrics: 20
    });
    
    await seeder.run();
    
    console.log('\n🎉 All operations completed successfully!');
    console.log('\n🌐 Your application is ready with:');
    console.log('✅ Updated database schema (migrations)');
    console.log('✅ Sample data across all models (seeder)');
    console.log('✅ Test users and admin account');
    console.log('✅ Realistic relationships between data');
    
    console.log('\n🔗 Access your application:');
    console.log('🌍 User Frontend: http://localhost:3000');
    console.log('🔧 Admin Frontend: http://localhost:3001');
    console.log('🚀 Backend API: http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  runMigrationAndSeed();
}

module.exports = { runMigrationAndSeed }; 