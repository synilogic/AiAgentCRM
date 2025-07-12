const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/whatsapp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log('Total users in database:', users.length);

    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Admin users found:', adminUsers.length);

    for (const admin of adminUsers) {
      console.log('\nAdmin User Details:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Created:', admin.createdAt);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', admin.password);
      console.log('Password "admin123" is valid:', isPasswordValid);
    }

    // Find specific admin user
    const specificAdmin = await User.findOne({ email: 'admin@aiagentcrm.com' });
    if (specificAdmin) {
      console.log('\nSpecific Admin Found:');
      console.log('Email:', specificAdmin.email);
      console.log('Role:', specificAdmin.role);
      const passwordCheck = await bcrypt.compare('admin123', specificAdmin.password);
      console.log('Password check result:', passwordCheck);
    } else {
      console.log('\nAdmin user with email admin@aiagentcrm.com not found');
    }

  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
};

checkAdmin(); 