const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const fixAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/whatsapp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@aiagentcrm.com' });
    console.log('Deleted existing admin user');

    // Create new admin with fresh password hash
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    console.log('Creating new admin user...');
    console.log('Password:', 'admin123');
    console.log('Salt Rounds:', saltRounds);
    console.log('Hash Preview:', hashedPassword.substring(0, 20) + '...');

    const adminUser = new User({
      email: 'admin@aiagentcrm.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      businessName: 'AI Agent CRM',
      isEmailVerified: true,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');

    // Test the password immediately
    const testMatch = await bcrypt.compare('admin123', hashedPassword);
    console.log('✅ Password test:', testMatch ? 'PASSED' : 'FAILED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAdminPassword(); 