const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const adminCredentials = {
  email: 'admin@aiagentcrm.com',
  password: 'admin123'
};

const userCredentials = {
  email: 'rahul@example.com',
  password: 'password123'
};

let adminToken = '';
let userToken = '';

class CRUDTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFunction) {
    try {
      console.log(`\n🧪 Testing: ${name}`.yellow);
      await testFunction();
      console.log(`✅ ${name} - PASSED`.green);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}`.red);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting CRUD Operations Test Suite (Fixed)'.blue.bold);
    console.log('=' * 60);

    // 1. Authentication Setup
    await this.test('Admin Authentication', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
      if (response.status !== 200) throw new Error('Admin login failed');
      adminToken = response.data.token;
      if (!adminToken) throw new Error('No admin token received');
    });

    await this.test('User Authentication', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, userCredentials);
      if (response.status !== 200) throw new Error('User login failed');
      userToken = response.data.token;
      if (!userToken) throw new Error('No user token received');
    });

    // 2. ADMIN PANEL CRUD OPERATIONS

    console.log('\n📋 ADMIN PANEL CRUD OPERATIONS'.blue.bold);
    console.log('=' * 40);

    // User Management CRUD
    let testUserId = '';
    await this.test('Admin - Create User', async () => {
      const newUser = {
        email: `testuser${Date.now()}@example.com`,
        password: 'testpass123',
        name: 'Test User',
        role: 'user'
      };
      
      const response = await axios.post(`${BASE_URL}/admin/users`, newUser, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 201) throw new Error('Failed to create user');
      if (!response.data.success) throw new Error('Create user response not successful');
      testUserId = response.data.user._id;
      if (!testUserId) throw new Error('No user ID returned');
    });

    await this.test('Admin - Read All Users', async () => {
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get users');
      if (!response.data.users || !Array.isArray(response.data.users)) throw new Error('Users data not in correct format');
      if (response.data.users.length === 0) throw new Error('No users found');
    });

    await this.test('Admin - Update User', async () => {
      if (!testUserId) throw new Error('No test user ID available');
      
      const updateData = {
        name: 'Updated Test User',
        businessName: 'Test Business'
      };
      
      const response = await axios.put(`${BASE_URL}/admin/users/${testUserId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update user');
      if (!response.data.user || response.data.user.name !== 'Updated Test User') throw new Error('User not updated correctly');
    });

    await this.test('Admin - Deactivate User', async () => {
      if (!testUserId) throw new Error('No test user ID available');
      
      const response = await axios.patch(`${BASE_URL}/admin/users/${testUserId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to deactivate user');
      if (!response.data.success) throw new Error('Deactivate response not successful');
    });

    // Plan Management CRUD
    let testPlanId = '';
    await this.test('Admin - Create Plan', async () => {
      const newPlan = {
        name: `Test Plan ${Date.now()}`,
        description: 'Test plan for CRUD operations',
        price: 999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['Test Feature 1', 'Test Feature 2'],
        limits: {
          leads: 100,
          aiReplies: 50,
          followUps: 25,
          messages: 200,
          storage: 1000
        }
      };
      
      const response = await axios.post(`${BASE_URL}/admin/plans`, newPlan, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 201) throw new Error('Failed to create plan');
      testPlanId = response.data.plan._id;
      if (!testPlanId) throw new Error('No plan ID returned');
    });

    await this.test('Admin - Read All Plans', async () => {
      const response = await axios.get(`${BASE_URL}/admin/plans`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get plans');
      if (!Array.isArray(response.data)) throw new Error('Plans data not an array');
      if (response.data.length === 0) throw new Error('No plans found');
    });

    await this.test('Admin - Update Plan', async () => {
      if (!testPlanId) throw new Error('No test plan ID available');
      
      const updateData = {
        name: 'Updated Test Plan',
        price: 1499,
        features: ['Updated Feature 1', 'Updated Feature 2', 'New Feature']
      };
      
      const response = await axios.put(`${BASE_URL}/admin/plans/${testPlanId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update plan');
      if (response.data.plan.name !== 'Updated Test Plan') throw new Error('Plan not updated correctly');
    });

    await this.test('Admin - Delete Plan', async () => {
      if (!testPlanId) throw new Error('No test plan ID available');
      
      const response = await axios.delete(`${BASE_URL}/admin/plans/${testPlanId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to delete plan');
    });

    // Email Template CRUD
    let testTemplateId = '';
    await this.test('Admin - Create Email Template', async () => {
      const newTemplate = {
        name: `Test Template ${Date.now()}`,
        subject: 'Test Email Subject',
        htmlContent: '<h1>Test Email</h1><p>This is a test email template.</p>',
        textContent: 'Test Email\n\nThis is a test email template.',
        category: 'test',
        variables: ['{{name}}', '{{email}}']
      };
      
      const response = await axios.post(`${BASE_URL}/admin/email-templates`, newTemplate, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 201) throw new Error('Failed to create email template');
      testTemplateId = response.data.template._id;
      if (!testTemplateId) throw new Error('No template ID returned');
    });

    await this.test('Admin - Read All Email Templates', async () => {
      const response = await axios.get(`${BASE_URL}/admin/email-templates`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get email templates');
      if (!Array.isArray(response.data)) throw new Error('Email templates data not an array');
    });

    await this.test('Admin - Update Email Template', async () => {
      if (!testTemplateId) throw new Error('No test template ID available');
      
      const updateData = {
        name: 'Updated Test Template',
        subject: 'Updated Test Subject',
        htmlContent: '<h1>Updated Test Email</h1><p>This template has been updated.</p>'
      };
      
      const response = await axios.put(`${BASE_URL}/admin/email-templates/${testTemplateId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update email template');
      if (response.data.template.name !== 'Updated Test Template') throw new Error('Template not updated correctly');
    });

    await this.test('Admin - Delete Email Template', async () => {
      if (!testTemplateId) throw new Error('No test template ID available');
      
      const response = await axios.delete(`${BASE_URL}/admin/email-templates/${testTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to delete email template');
    });

    // 3. USER PANEL CRUD OPERATIONS

    console.log('\n👤 USER PANEL CRUD OPERATIONS'.blue.bold);
    console.log('=' * 40);

    // User Profile Management
    await this.test('User - Read Profile', async () => {
      const response = await axios.get(`${BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get profile');
      if (!response.data.user) throw new Error('No user data in response');
      if (!response.data.user.email) throw new Error('No email in profile');
    });

    await this.test('User - Update Profile', async () => {
      const updateData = {
        name: 'Updated User Name',
        businessName: 'Updated Business',
        bio: 'Updated bio for testing'
      };
      
      const response = await axios.put(`${BASE_URL}/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update profile');
      if (response.data.user.name !== 'Updated User Name') throw new Error('Profile not updated correctly');
    });

    await this.test('User - Update Preferences', async () => {
      const preferences = {
        language: 'en',
        timezone: 'UTC',
        currency: 'INR',
        theme: 'dark'
      };
      
      const response = await axios.put(`${BASE_URL}/users/preferences`, preferences, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update preferences');
    });

    await this.test('User - Update Notifications', async () => {
      const notifications = {
        email: {
          leads: true,
          messages: false,
          payments: true
        },
        push: {
          leads: true,
          messages: true
        }
      };
      
      const response = await axios.put(`${BASE_URL}/users/notifications`, notifications, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update notifications');
    });

    // Lead Management
    let testLeadId = '';
    await this.test('User - Create Lead', async () => {
      const newLead = {
        name: 'Test Lead',
        email: `testlead${Date.now()}@example.com`,
        phone: '+1234567890',
        company: 'Test Company',
        status: 'new',
        source: 'manual',
        dealValue: 5000,
        currency: 'INR'
      };
      
      const response = await axios.post(`${BASE_URL}/leads`, newLead, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 201) throw new Error('Failed to create lead');
      testLeadId = response.data.lead._id;
      if (!testLeadId) throw new Error('No lead ID returned');
    });

    await this.test('User - Read All Leads', async () => {
      const response = await axios.get(`${BASE_URL}/leads`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get leads');
      if (!Array.isArray(response.data)) throw new Error('Leads data not an array');
    });

    await this.test('User - Update Lead', async () => {
      if (!testLeadId) throw new Error('No test lead ID available');
      
      const updateData = {
        name: 'Updated Test Lead',
        status: 'qualified',
        dealValue: 7500,
        notes: 'Updated lead for testing'
      };
      
      const response = await axios.put(`${BASE_URL}/leads/${testLeadId}`, updateData, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to update lead');
      if (response.data.lead.name !== 'Updated Test Lead') throw new Error('Lead not updated correctly');
    });

    await this.test('User - Delete Lead', async () => {
      if (!testLeadId) throw new Error('No test lead ID available');
      
      const response = await axios.delete(`${BASE_URL}/leads/${testLeadId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to delete lead');
    });

    // Dashboard and Analytics
    await this.test('User - Get Dashboard Stats', async () => {
      const response = await axios.get(`${BASE_URL}/users/dashboard-stats`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.status !== 200) throw new Error('Failed to get dashboard stats');
      if (!response.data.stats) throw new Error('No stats in response');
    });

    // Print results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CRUD OPERATIONS TEST RESULTS'.blue.bold);
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${this.results.passed}`.green);
    console.log(`❌ Failed: ${this.results.failed}`.red);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`.blue);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:'.red.bold);
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`.red);
        });
    }
    
    console.log('\n📋 CRUD OPERATIONS SUMMARY:'.blue.bold);
    console.log('✅ Admin Panel:'.green);
    console.log('  - User Management: Create, Read, Update, Deactivate');
    console.log('  - Plan Management: Create, Read, Update, Delete');
    console.log('  - Email Templates: Create, Read, Update, Delete');
    
    console.log('\n✅ User Panel:'.green);
    console.log('  - Profile Management: Read, Update');
    console.log('  - Preferences: Update');
    console.log('  - Notifications: Update');
    console.log('  - Lead Management: Create, Read, Update, Delete');
    console.log('  - Dashboard: Read Stats');
    
    console.log('\n🎉 All CRUD operations have been tested!'.green.bold);
  }
}

// Run the tests
const tester = new CRUDTester();
tester.runAllTests().catch(console.error); 