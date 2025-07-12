const axios = require('axios');

async function testPlansAPI() {
  try {
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahul@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // Test plans endpoint
    const plansResponse = await axios.get('http://localhost:5000/api/payments/plans', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Plans API Response:', plansResponse.data);

    // Test without auth (should work for public endpoint)
    const publicPlansResponse = await axios.get('http://localhost:5000/api/payments/plans');
    console.log('✅ Public Plans API Response:', publicPlansResponse.data);

  } catch (error) {
    console.error('❌ Error testing plans API:', error.response?.data || error.message);
  }
}

testPlansAPI(); 