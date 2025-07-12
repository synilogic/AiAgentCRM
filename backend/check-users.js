const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/AIAgentCRM');
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`\nTotal users found: ${users.length}\n`);

    for (const user of users) {
      console.log('User Details:');
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt}`);
      
      // Test password for john@example.com
      if (user.email === 'john@example.com') {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`Password "password123" is valid: ${isValid}`);
      }
      
      console.log('---');
    }

    // Try to find john@example.com specifically
    const john = await User.findOne({ email: 'john@example.com' });
    if (john) {
      console.log('\nJohn user found:');
      console.log(`Email: ${john.email}`);
      console.log(`Role: ${john.role}`);
      const isValidPassword = await bcrypt.compare('password123', john.password);
      console.log(`Password check result: ${isValidPassword}`);
    } else {
      console.log('\nJohn user NOT found in database!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

checkUsers(); 