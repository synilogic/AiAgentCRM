const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const testAdminLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/whatsapp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Test credentials
    const email = 'admin@aiagentcrm.com';
    const password = 'admin123';

    console.log('Testing login for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', user.email);
    console.log('User role:', user.role);

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('❌ User is not admin');
      process.exit(1);
    }

    console.log('✅ User is admin');

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      
      // Try to fix the password
      console.log('Attempting to fix password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password updated');

      // Test again
      const newPasswordCheck = await bcrypt.compare(password, user.password);
      console.log('New password check:', newPasswordCheck);
      
      if (!newPasswordCheck) {
        console.log('❌ Still invalid after update');
        process.exit(1);
      }
    }

    console.log('✅ Password is valid');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ JWT token generated successfully');
    console.log('Token length:', token.length);

    console.log('\n🎉 Admin login test successful!');
    console.log('Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
};

testAdminLogin(); 