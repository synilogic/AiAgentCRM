const axios = require('axios');

async function testLogin() {
  const users = [
    'rahul@example.com',
    'priya@example.com', 
    'admin@aiagentcrm.com'
  ];

  for (const email of users) {
    const password = email.includes('admin') ? 'admin123' : 'password123';
    
    try {
      console.log(`\n🔐 Testing login for: ${email}`);
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      console.log('✅ Login successful!');
      console.log(`User: ${response.data.user.name} (${response.data.user.role})`);
      console.log(`Token received: ${response.data.token ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
    }
  }
}

testLogin(); 