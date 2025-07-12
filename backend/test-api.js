const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testing login API...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'demo@aiaagentcrm.com',
      password: 'demo123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

async function testHealth() {
  try {
    console.log('\n🔍 Testing health endpoint...');
    
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Health check failed!');
    console.log('Error:', error.message);
  }
}

async function checkUserInDatabase() {
  try {
    console.log('\n🔍 Checking user in database...');
    
    const mongoose = require('mongoose');
    require('dotenv').config();
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const User = require('./models/User');
    const user = await User.findOne({ email: 'demo@aiaagentcrm.com' });
    
    if (user) {
      console.log('✅ User found in database:');
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Has password:', !!user.password);
      console.log('- Password length:', user.password?.length);
    } else {
      console.log('❌ User not found in database');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testHealth();
  await checkUserInDatabase();
  await testLogin();
}

runTests(); 