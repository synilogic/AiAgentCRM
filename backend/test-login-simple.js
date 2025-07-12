const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@aiagentcrm.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    console.log('Response:', response.data);
    
    // Test user login
    console.log('\nTesting user login...');
    const userResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahul@example.com',
      password: 'password123'
    });
    
    console.log('✅ User login successful');
    console.log('Response:', userResponse.data);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin(); 