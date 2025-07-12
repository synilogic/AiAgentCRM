const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetAdminPassword() {
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
      
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser = new User({
        email: 'admin@aiagentcrm.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        isActive: true,
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
      
      // Reset password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('✅ Admin password reset successfully');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('✅ Password verification:', isPasswordValid ? 'PASSED' : 'FAILED');

    // Test login simulation
    console.log('\n🧪 Testing login simulation...');
    const testUser = await User.findOne({ email: 'admin@aiagentcrm.com' });
    const testPasswordValid = await bcrypt.compare('admin123', testUser.password);
    
    if (testPasswordValid) {
      console.log('✅ Login simulation: SUCCESS');
      console.log('📋 Admin Credentials:');
      console.log('   Email: admin@aiagentcrm.com');
      console.log('   Password: admin123');
      console.log('   Role:', testUser.role);
    } else {
      console.log('❌ Login simulation: FAILED');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 