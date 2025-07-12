const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetUserPassword() {
  try {
    console.log('🔧 Resetting user password...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const User = require('./models/User');
    
    // Find the demo user
    const user = await User.findOne({ email: 'demo@aiaagentcrm.com' });
    
    if (!user) {
      console.log('❌ Demo user not found');
      return;
    }
    
    console.log('✅ Found demo user:', user.email);
    
    // Hash the password 'demo123' with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);
    
    console.log('🔐 Generated new password hash');
    console.log('Hash length:', hashedPassword.length);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully');
    
    // Verify the password works
    const isPasswordValid = await bcrypt.compare('demo123', user.password);
    console.log('🔍 Password verification test:', isPasswordValid ? 'PASSED' : 'FAILED');
    
    // Also reset admin password
    const adminUser = await User.findOne({ email: 'admin@aiaagentcrm.com' });
    if (adminUser) {
      const adminHashedPassword = await bcrypt.hash('admin123', salt);
      adminUser.password = adminHashedPassword;
      await adminUser.save();
      console.log('✅ Admin password also updated');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

resetUserPassword(); 