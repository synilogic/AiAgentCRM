const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/whatsapp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@aiagentcrm.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Update password if needed
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin password updated to: admin123');
      
      process.exit(0);
    }

    // Create admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const adminUser = new User({
      email: 'admin@aiagentcrm.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      businessName: 'AI Agent CRM',
      isEmailVerified: true,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();

    console.log('Admin user created successfully!');
    console.log('Email: admin@aiagentcrm.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

createAdmin(); 