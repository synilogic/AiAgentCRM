const axios = require('axios');

async function testUserEndpoints() {
  try {
    // First login to get token
    console.log('🔐 Getting user token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahul@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ User token obtained');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test dashboard-stats endpoint
    console.log('\n🧪 Testing dashboard-stats endpoint...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/users/dashboard-stats', { headers });
      console.log('✅ Dashboard stats:', dashboardResponse.data);
    } catch (error) {
      console.log('❌ Dashboard stats failed:', error.response?.data || error.message);
    }

    // Test profile endpoint
    console.log('\n🧪 Testing profile endpoint...');
    try {
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', { headers });
      console.log('✅ Profile:', profileResponse.data.user?.email || 'No email found');
    } catch (error) {
      console.log('❌ Profile failed:', error.response?.data || error.message);
    }

    // Test leads endpoint
    console.log('\n🧪 Testing leads endpoint...');
    try {
      const leadsResponse = await axios.get('http://localhost:5000/api/leads', { headers });
      console.log('✅ Leads:', Array.isArray(leadsResponse.data) ? `${leadsResponse.data.length} leads found` : 'Not an array');
    } catch (error) {
      console.log('❌ Leads failed:', error.response?.data || error.message);
    }

    // Test plans endpoint
    console.log('\n🧪 Testing plans endpoint...');
    try {
      const plansResponse = await axios.get('http://localhost:5000/api/payments/plans', { headers });
      console.log('✅ Plans:', Array.isArray(plansResponse.data) ? `${plansResponse.data.length} plans found` : 'Not an array');
    } catch (error) {
      console.log('❌ Plans failed:', error.response?.data || error.message);
    }

    // Test WhatsApp QR endpoint
    console.log('\n🧪 Testing WhatsApp QR endpoint...');
    try {
      const whatsappResponse = await axios.get('http://localhost:5000/api/whatsapp/qr', { headers });
      console.log('✅ WhatsApp QR:', whatsappResponse.data.qr ? 'QR code received' : 'No QR code');
    } catch (error) {
      console.log('❌ WhatsApp QR failed:', error.response?.data || error.message);
    }

    // Test WhatsApp status endpoint
    console.log('\n🧪 Testing WhatsApp status endpoint...');
    try {
      const statusResponse = await axios.get('http://localhost:5000/api/whatsapp/status', { headers });
      console.log('✅ WhatsApp status:', statusResponse.data);
    } catch (error) {
      console.log('❌ WhatsApp status failed:', error.response?.data || error.message);
    }

    // Test knowledge base endpoint
    console.log('\n🧪 Testing knowledge base endpoint...');
    try {
      const knowledgeResponse = await axios.get('http://localhost:5000/api/knowledge', { headers });
      console.log('✅ Knowledge base:', Array.isArray(knowledgeResponse.data) ? `${knowledgeResponse.data.length} items found` : 'Not an array');
    } catch (error) {
      console.log('❌ Knowledge base failed:', error.response?.data || error.message);
    }

    // Test analytics endpoint
    console.log('\n🧪 Testing analytics endpoint...');
    try {
      const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/overview', { headers });
      console.log('✅ Analytics:', analyticsResponse.data);
    } catch (error) {
      console.log('❌ Analytics failed:', error.response?.data || error.message);
    }

    // Test notifications endpoint
    console.log('\n🧪 Testing notifications endpoint...');
    try {
      const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', { headers });
      console.log('✅ Notifications:', Array.isArray(notificationsResponse.data) ? `${notificationsResponse.data.length} notifications found` : 'Not an array');
    } catch (error) {
      console.log('❌ Notifications failed:', error.response?.data || error.message);
    }

    console.log('\n✅ User endpoints test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserEndpoints(); 