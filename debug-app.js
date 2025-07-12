const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testLogin() {
  console.log('🔍 Testing login functionality...\n');

  try {
    // Test 1: Backend health check
    console.log('1. Testing backend connectivity...');
    const healthResponse = await axios.get(`${API_BASE}`);
    console.log('✅ Backend is responding:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
  }

  try {
    // Test 2: Login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response status:', loginResponse.status);
    console.log('User data:', loginResponse.data.user ? 'Present' : 'Missing');
    console.log('Token:', loginResponse.data.token ? 'Present' : 'Missing');
    
    const token = loginResponse.data.token;
    
    // Test 3: Protected endpoint with token
    console.log('\n3. Testing protected endpoint...');
    const userResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected endpoint accessible');
    console.log('User verification:', userResponse.data.user ? 'Success' : 'Failed');
    
    // Test 4: Dashboard data endpoint
    console.log('\n4. Testing dashboard data...');
    const dashboardResponse = await axios.get(`${API_BASE}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard data accessible');
    console.log('Dashboard stats:', dashboardResponse.data ? 'Present' : 'Missing');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data || error.message);
  }
}

// Check if users exist
async function checkUsers() {
  console.log('\n🔍 Checking user database...\n');
  
  try {
    // This endpoint might not exist, but let's try
    const usersResponse = await axios.get(`${API_BASE}/users`);
    console.log('✅ Users endpoint accessible');
    console.log('Users found:', usersResponse.data.users?.length || 'Unknown');
  } catch (error) {
    console.log('⚠️ Users endpoint not accessible or protected');
  }
}

// Main execution
async function runDiagnostics() {
  console.log('🚀 AI Agent CRM - Login Diagnostics\n');
  console.log('=' .repeat(50));
  
  await testLogin();
  await checkUsers();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Diagnostics complete!');
  console.log('\nIf login works here but not in the browser:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Clear browser cache and localStorage');
  console.log('3. Check Network tab for failed requests');
  console.log('4. Verify frontend-backend API URL configuration');
}

runDiagnostics(); 