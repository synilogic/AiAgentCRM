const axios = require('axios');

// Test dashboard API endpoints
async function testDashboardAPI() {
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

    // Test dashboard stats
    const dashboardResponse = await axios.get('http://localhost:5000/api/users/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard stats:', dashboardResponse.data);

    // Test followups stats
    const followupsResponse = await axios.get('http://localhost:5000/api/followups/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Followups stats:', followupsResponse.data);

    // Test knowledge stats
    const knowledgeResponse = await axios.get('http://localhost:5000/api/knowledge/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Knowledge stats:', knowledgeResponse.data);

    // Test leads
    const leadsResponse = await axios.get('http://localhost:5000/api/leads?page=1&limit=20', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Leads:', leadsResponse.data);

    // Test notifications
    const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Notifications:', notificationsResponse.data);

    console.log('\n🎉 All API endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testDashboardAPI(); 