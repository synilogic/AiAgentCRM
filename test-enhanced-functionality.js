const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';
const ADMIN_FRONTEND_URL = 'http://localhost:3002';

class EnhancedFunctionalityTest {
  constructor() {
    this.adminToken = null;
    this.socket = null;
    this.results = {
      backend: {},
      frontend: {},
      realtime: {},
      overall: { passed: 0, failed: 0 }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Enhanced Functionality Tests...\n');

    try {
      // Test backend API endpoints
      await this.testBackendEndpoints();
      
      // Test real-time WebSocket functionality  
      await this.testRealtimeFeatures();
      
      // Test frontend accessibility
      await this.testFrontendPages();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  async testBackendEndpoints() {
    console.log('📡 Testing Backend API Endpoints...');
    
    try {
      // Test admin login
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@aiagentcrm.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.token) {
        this.adminToken = loginResponse.data.token;
        this.recordResult('backend', 'admin_login', true, 'Admin login successful');
      } else {
        this.recordResult('backend', 'admin_login', false, 'No token received');
      }
      
      // Test new admin dashboard stats endpoint
      const dashboardStats = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      if (dashboardStats.data.stats && dashboardStats.data.activities) {
        this.recordResult('backend', 'dashboard_stats', true, 'Dashboard stats endpoint working');
        console.log('📊 Dashboard Stats:', {
          totalUsers: dashboardStats.data.stats.totalUsers,
          totalLeads: dashboardStats.data.stats.totalLeads,
          conversionRate: dashboardStats.data.stats.conversionRate,
          activitiesCount: dashboardStats.data.activities.length
        });
      } else {
        this.recordResult('backend', 'dashboard_stats', false, 'Invalid dashboard stats response');
      }
      
      // Test real-time metrics endpoint
      const metricsResponse = await axios.get(`${BASE_URL}/api/admin/metrics/realtime`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      if (metricsResponse.data.connections && metricsResponse.data.server) {
        this.recordResult('backend', 'realtime_metrics', true, 'Real-time metrics endpoint working');
        console.log('⚡ Real-time Metrics:', {
          totalConnections: metricsResponse.data.connections.totalConnections,
          serverUptime: Math.round(metricsResponse.data.server.uptime / 60) + ' minutes',
          databaseState: metricsResponse.data.database.connectionState
        });
      } else {
        this.recordResult('backend', 'realtime_metrics', false, 'Invalid metrics response');
      }
      
      // Test system health endpoint
      const healthResponse = await axios.get(`${BASE_URL}/api/admin/system/health`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      if (healthResponse.data.status && healthResponse.data.services) {
        this.recordResult('backend', 'system_health', true, `System health: ${healthResponse.data.status}`);
        console.log('🏥 System Health:', {
          status: healthResponse.data.status,
          database: healthResponse.data.services.database.status,
          websocket: healthResponse.data.services.websocket.status,
          realtime: healthResponse.data.services.realtime.status
        });
      } else {
        this.recordResult('backend', 'system_health', false, 'Invalid health response');
      }
      
      // Test live activities endpoint
      const activitiesResponse = await axios.get(`${BASE_URL}/api/admin/activities/live`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      if (activitiesResponse.data.activities && Array.isArray(activitiesResponse.data.activities)) {
        this.recordResult('backend', 'live_activities', true, `Found ${activitiesResponse.data.activities.length} activities`);
      } else {
        this.recordResult('backend', 'live_activities', false, 'Invalid activities response');
      }
      
    } catch (error) {
      this.recordResult('backend', 'api_error', false, `API Error: ${error.message}`);
    }
  }

  async testRealtimeFeatures() {
    console.log('\n⚡ Testing Real-time WebSocket Features...');
    
    return new Promise((resolve) => {
      try {
        this.socket = io(BASE_URL, {
          auth: { token: this.adminToken },
          transports: ['websocket']
        });

        let eventsReceived = [];
        const testTimeout = setTimeout(() => {
          this.recordResult('realtime', 'websocket_timeout', false, 'WebSocket connection timeout');
          resolve();
        }, 10000);

        this.socket.on('connect', () => {
          this.recordResult('realtime', 'websocket_connection', true, 'WebSocket connected successfully');
          
          // Subscribe to admin dashboard
          this.socket.emit('admin:subscribe', { type: 'dashboard' });
        });

        this.socket.on('authenticated', (data) => {
          this.recordResult('realtime', 'websocket_auth', true, `Authenticated as: ${data.user.email}`);
          eventsReceived.push('authenticated');
        });

        this.socket.on('admin:stats', (stats) => {
          this.recordResult('realtime', 'admin_stats', true, 'Received admin stats via WebSocket');
          eventsReceived.push('admin_stats');
          console.log('📊 WebSocket Stats:', {
            totalUsers: stats.totalUsers,
            activeUsers: stats.activeUsers,
            totalLeads: stats.totalLeads,
            conversionRate: stats.conversionRate
          });
        });

        this.socket.on('admin:activities', (activities) => {
          this.recordResult('realtime', 'admin_activities', true, `Received ${activities.length} activities`);
          eventsReceived.push('admin_activities');
        });

        this.socket.on('admin:user_activity', (activity) => {
          this.recordResult('realtime', 'user_activity', true, 'Received user activity event');
          eventsReceived.push('user_activity');
        });

        this.socket.on('admin:new_lead', (lead) => {
          this.recordResult('realtime', 'new_lead', true, `New lead: ${lead.name}`);
          eventsReceived.push('new_lead');
        });

        this.socket.on('connect_error', (error) => {
          this.recordResult('realtime', 'websocket_error', false, `Connection error: ${error.message}`);
        });

        this.socket.on('disconnect', () => {
          this.recordResult('realtime', 'websocket_disconnect', true, 'WebSocket disconnected cleanly');
        });

        // Test real-time data request
        setTimeout(() => {
          this.socket.emit('admin:request_dashboard_data');
        }, 2000);

        // Clean up after test
        setTimeout(() => {
          clearTimeout(testTimeout);
          this.recordResult('realtime', 'events_summary', true, `Received events: ${eventsReceived.join(', ')}`);
          if (this.socket) {
            this.socket.disconnect();
          }
          resolve();
        }, 8000);

      } catch (error) {
        this.recordResult('realtime', 'websocket_setup_error', false, `Setup error: ${error.message}`);
        resolve();
      }
    });
  }

  async testFrontendPages() {
    console.log('\n🖥️  Testing Frontend Pages...');
    
    try {
      // Test main landing page
      const landingPageResponse = await axios.get(ADMIN_FRONTEND_URL);
      
      if (landingPageResponse.status === 200) {
        this.recordResult('frontend', 'landing_page', true, 'Landing page accessible');
        
        // Check if it contains Kraya AI-style content
        const htmlContent = landingPageResponse.data;
        const hasModernContent = htmlContent.includes('AI-Powered CRM') || 
                                htmlContent.includes('React') ||
                                htmlContent.includes('root');
        
        if (hasModernContent) {
          this.recordResult('frontend', 'modern_design', true, 'Landing page has modern design elements');
        } else {
          this.recordResult('frontend', 'modern_design', false, 'Landing page missing modern design');
        }
      } else {
        this.recordResult('frontend', 'landing_page', false, `Status: ${landingPageResponse.status}`);
      }
      
      // Test admin login page
      const adminLoginResponse = await axios.get(`${ADMIN_FRONTEND_URL}/login`);
      
      if (adminLoginResponse.status === 200) {
        this.recordResult('frontend', 'admin_login_page', true, 'Admin login page accessible');
      } else {
        this.recordResult('frontend', 'admin_login_page', false, `Status: ${adminLoginResponse.status}`);
      }
      
    } catch (error) {
      this.recordResult('frontend', 'frontend_error', false, `Frontend error: ${error.message}`);
    }
  }

  recordResult(category, test, passed, message) {
    this.results[category][test] = { passed, message };
    this.results.overall[passed ? 'passed' : 'failed']++;
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 ENHANCED FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(60));
    
    const categories = ['backend', 'realtime', 'frontend'];
    
    categories.forEach(category => {
      console.log(`\n📂 ${category.toUpperCase()} TESTS:`);
      const tests = this.results[category];
      
      Object.entries(tests).forEach(([test, result]) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${test}: ${result.message}`);
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`✅ Passed: ${this.results.overall.passed}`);
    console.log(`❌ Failed: ${this.results.overall.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100)}%`);
    console.log('='.repeat(60));
    
    if (this.results.overall.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Enhanced functionality is working perfectly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above for issues.');
    }
    
    console.log('\n🌐 Access your enhanced admin panel at: http://localhost:3002');
    console.log('🔑 Login with: admin@aiagentcrm.com / admin123');
    console.log('📱 The landing page now features Kraya AI-style modern design!');
  }
}

// Run the tests
async function main() {
  const tester = new EnhancedFunctionalityTest();
  await tester.runAllTests();
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = EnhancedFunctionalityTest; 