const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdminUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('\n📋 Admin Users Found:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user._id}`);
      console.log('---');
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found! Creating default admin...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
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
      console.log('✅ Default admin user created successfully');
      console.log('   Email: admin@aiagentcrm.com');
      console.log('   Password: admin123');
    }

    // Also check for any users with the wrong email
    const wrongEmailUsers = await User.find({ email: 'admin@aiaagentcrm.com' });
    if (wrongEmailUsers.length > 0) {
      console.log('\n🔧 Fixing admin email typo...');
      await User.updateMany(
        { email: 'admin@aiaagentcrm.com' },
        { email: 'admin@aiagentcrm.com' }
      );
      console.log('✅ Fixed admin email typo');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdminUsers(); 