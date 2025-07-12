const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const fixAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/whatsapp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@aiagentcrm.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);

    // Generate new password hash
    const saltRounds = 12;
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('Password updated successfully');

    // Verify the new password
    const isValid = await bcrypt.compare(newPassword, adminUser.password);
    console.log('Password verification:', isValid);

    console.log('\nAdmin Login Credentials:');
    console.log('Email: admin@aiagentcrm.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error fixing admin password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
};

fixAdminPassword(); 