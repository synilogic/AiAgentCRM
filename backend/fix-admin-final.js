const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find admin user
    let adminUser = await User.findOne({ email: 'admin@aiagentcrm.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found, creating new one...');
      
      // Create new admin user with plain password (pre-save middleware will hash it)
      adminUser = new User({
        email: 'admin@aiagentcrm.com',
        password: 'admin123', // Plain text - will be hashed by pre-save middleware
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          dashboard: {
            defaultView: 'overview',
            refreshInterval: 30
          }
        }
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found:', adminUser.email);
      
      // Set plain password - the pre-save middleware will handle hashing
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('✅ Admin password reset successfully');
    }

    // Test the password using the model's comparePassword method
    const freshUser = await User.findOne({ email: 'admin@aiagentcrm.com' });
    const isPasswordValid = await freshUser.comparePassword('admin123');
    
    console.log('\n🧪 Password verification test:');
    console.log('✅ Password check:', isPasswordValid ? 'PASSED' : 'FAILED');

    if (isPasswordValid) {
      console.log('\n📋 Admin Login Credentials:');
      console.log('   Email: admin@aiagentcrm.com');
      console.log('   Password: admin123');
      console.log('   Role:', freshUser.role);
      console.log('   Status: Ready for login');
    } else {
      console.log('❌ Password verification failed');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPassword(); 