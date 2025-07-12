const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserPasswords() {
  try {
    console.log('🔧 Fixing user passwords...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const User = require('./models/User');
    
    // Fix demo user
    const demoUser = await User.findOne({ email: 'demo@aiaagentcrm.com' });
    if (demoUser) {
      console.log('✅ Found demo user:', demoUser.email);
      
      // Set the plain password - the pre-save hook will hash it
      demoUser.password = 'demo123';
      await demoUser.save();
      
      console.log('✅ Demo user password updated');
      
      // Test the password
      const isPasswordValid = await demoUser.comparePassword('demo123');
      console.log('🔍 Demo password test:', isPasswordValid ? 'PASSED' : 'FAILED');
    } else {
      console.log('❌ Demo user not found');
    }
    
    // Fix admin user
    const adminUser = await User.findOne({ email: 'admin@aiaagentcrm.com' });
    if (adminUser) {
      console.log('✅ Found admin user:', adminUser.email);
      
      // Set the plain password - the pre-save hook will hash it
      adminUser.password = 'admin123';
      await adminUser.save();
      
      console.log('✅ Admin user password updated');
      
      // Test the password
      const isPasswordValid = await adminUser.comparePassword('admin123');
      console.log('🔍 Admin password test:', isPasswordValid ? 'PASSED' : 'FAILED');
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixUserPasswords(); 