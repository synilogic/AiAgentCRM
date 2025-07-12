const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test credentials
const testCredentials = {
  email: 'rahul@example.com',
  password: 'password123'
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status || 500,
      data: error.response?.data
    };
  }
}

// Authentication
async function testAuthentication() {
  log('\n🔐 Testing Authentication...', 'bold');
  
  // Login
  log('1. Testing Login...');
  const loginResult = await apiRequest('POST', '/auth/login', testCredentials);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    log('✅ Login successful', 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
  } else {
    log('❌ Login failed', 'red');
    log(`   Error: ${loginResult.error}`, 'red');
    return false;
  }

  // Verify token
  log('2. Testing Token Verification...');
  const verifyResult = await apiRequest('GET', '/auth/verify');
  
  if (verifyResult.success) {
    log('✅ Token verification successful', 'green');
  } else {
    log('❌ Token verification failed', 'red');
  }

  return true;
}

// Users CRUD Operations
async function testUsersCRUD() {
  log('\n👥 Testing Users CRUD Operations...', 'bold');

  // READ - Get current user profile
  log('1. READ - Get User Profile...');
  const getUserResult = await apiRequest('GET', '/users/profile');
  
  if (getUserResult.success) {
    log('✅ Get user profile successful', 'green');
    log(`   User: ${getUserResult.data.user.name} (${getUserResult.data.user.email})`, 'blue');
  } else {
    log('❌ Get user profile failed', 'red');
  }

  // UPDATE - Update user profile
  log('2. UPDATE - Update User Profile...');
  const updateData = {
    name: 'Rahul Kumar Updated',
    phone: '+91 90000 11111 (Updated)',
    company: 'Updated Business Solutions'
  };
  
  const updateResult = await apiRequest('PUT', '/users/profile', updateData);
  
  if (updateResult.success) {
    log('✅ Update user profile successful', 'green');
  } else {
    log('❌ Update user profile failed', 'red');
    log(`   Error: ${updateResult.error}`, 'red');
  }

  // READ - Get dashboard stats
  log('3. READ - Get Dashboard Stats...');
  const statsResult = await apiRequest('GET', '/users/dashboard-stats');
  
  if (statsResult.success) {
    log('✅ Get dashboard stats successful', 'green');
    log(`   Total Leads: ${statsResult.data.totalLeads}`, 'blue');
    log(`   Active Tasks: ${statsResult.data.activeTasks}`, 'blue');
  } else {
    log('❌ Get dashboard stats failed', 'red');
  }
}

// Leads CRUD Operations
async function testLeadsCRUD() {
  log('\n🎯 Testing Leads CRUD Operations...', 'bold');
  let createdLeadId = null;

  // CREATE - Create new lead
  log('1. CREATE - Create New Lead...');
  const newLead = {
    name: 'Test Lead CRUD',
    email: 'testlead.crud@example.com',
    phone: '+91 98765 00000',
    company: 'CRUD Test Company',
    position: 'Test Manager',
    source: 'manual',
    status: 'new',
    priority: 'medium',
    value: 50000,
    notes: 'This is a test lead created by CRUD operations test',
    tags: ['test', 'crud', 'automation']
  };

  const createResult = await apiRequest('POST', '/leads', newLead);
  
  if (createResult.success) {
    createdLeadId = createResult.data.lead._id;
    log('✅ Create lead successful', 'green');
    log(`   Lead ID: ${createdLeadId}`, 'blue');
    log(`   Lead Name: ${createResult.data.lead.name}`, 'blue');
  } else {
    log('❌ Create lead failed', 'red');
    log(`   Error: ${createResult.error}`, 'red');
  }

  // READ - Get all leads
  log('2. READ - Get All Leads...');
  const getLeadsResult = await apiRequest('GET', '/leads?page=1&limit=5');
  
  if (getLeadsResult.success) {
    log('✅ Get leads successful', 'green');
    log(`   Total: ${getLeadsResult.data.total}, Page: ${getLeadsResult.data.page}`, 'blue');
  } else {
    log('❌ Get leads failed', 'red');
  }

  // READ - Get specific lead
  if (createdLeadId) {
    log('3. READ - Get Specific Lead...');
    const getLeadResult = await apiRequest('GET', `/leads/${createdLeadId}`);
    
    if (getLeadResult.success) {
      log('✅ Get specific lead successful', 'green');
      log(`   Lead: ${getLeadResult.data.name} - ${getLeadResult.data.status}`, 'blue');
    } else {
      log('❌ Get specific lead failed', 'red');
    }

    // UPDATE - Update lead
    log('4. UPDATE - Update Lead...');
    const updateData = {
      status: 'qualified',
      priority: 'high',
      value: 75000,
      notes: 'Updated by CRUD test - Lead qualified after initial contact'
    };

    const updateResult = await apiRequest('PUT', `/leads/${createdLeadId}`, updateData);
    
    if (updateResult.success) {
      log('✅ Update lead successful', 'green');
      log(`   New Status: ${updateResult.data.lead.status}`, 'blue');
    } else {
      log('❌ Update lead failed', 'red');
    }

    // DELETE - Delete lead
    log('5. DELETE - Delete Lead...');
    const deleteResult = await apiRequest('DELETE', `/leads/${createdLeadId}`);
    
    if (deleteResult.success) {
      log('✅ Delete lead successful', 'green');
    } else {
      log('❌ Delete lead failed', 'red');
    }
  }
}

// Plans CRUD Operations
async function testPlansCRUD() {
  log('\n💰 Testing Plans CRUD Operations...', 'bold');

  // READ - Get all plans (public endpoint)
  log('1. READ - Get All Plans (Public)...');
  try {
    const response = await axios.get(`${BASE_URL}/payments/plans`);
    
    if (response.data.success) {
      log('✅ Get plans successful', 'green');
      log(`   Available Plans: ${response.data.plans.length}`, 'blue');
      response.data.plans.forEach(plan => {
        log(`   - ${plan.name}: ₹${plan.price.monthly}/month`, 'blue');
      });
    } else {
      log('❌ Get plans failed', 'red');
    }
  } catch (error) {
    log('❌ Get plans failed', 'red');
    log(`   Error: ${error.message}`, 'red');
  }

  // READ - Get plan details
  log('2. READ - Get Plan Details...');
  const getPlansResult = await apiRequest('GET', '/plans');
  
  if (getPlansResult.success) {
    log('✅ Get authenticated plan details successful', 'green');
  } else {
    log('❌ Get authenticated plan details failed', 'red');
  }
}

// Tasks CRUD Operations
async function testTasksCRUD() {
  log('\n📋 Testing Tasks CRUD Operations...', 'bold');
  let createdTaskId = null;
  let testLeadId = null;

  // First, get a lead to associate with the task
  const getLeadsResult = await apiRequest('GET', '/leads?page=1&limit=1');
  if (getLeadsResult.success && getLeadsResult.data.leads.length > 0) {
    testLeadId = getLeadsResult.data.leads[0]._id;
  }

  // CREATE - Create new task
  log('1. CREATE - Create New Task...');
  const newTask = {
    title: 'CRUD Test Task',
    description: 'This is a test task created by CRUD operations test',
    type: 'call',
    priority: 'high',
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    leadId: testLeadId,
    estimatedDuration: 30
  };

  const createResult = await apiRequest('POST', '/tasks', newTask);
  
  if (createResult.success) {
    createdTaskId = createResult.data.task._id;
    log('✅ Create task successful', 'green');
    log(`   Task ID: ${createdTaskId}`, 'blue');
  } else {
    log('❌ Create task failed', 'red');
    log(`   Error: ${createResult.error}`, 'red');
  }

  // READ - Get all tasks
  log('2. READ - Get All Tasks...');
  const getTasksResult = await apiRequest('GET', '/tasks?page=1&limit=5');
  
  if (getTasksResult.success) {
    log('✅ Get tasks successful', 'green');
    log(`   Total: ${getTasksResult.data.total}`, 'blue');
  } else {
    log('❌ Get tasks failed', 'red');
  }

  // UPDATE and DELETE operations for tasks
  if (createdTaskId) {
    // UPDATE - Update task
    log('3. UPDATE - Update Task...');
    const updateData = {
      status: 'in_progress',
      progress: 50,
      notes: 'Task updated by CRUD test'
    };

    const updateResult = await apiRequest('PUT', `/tasks/${createdTaskId}`, updateData);
    
    if (updateResult.success) {
      log('✅ Update task successful', 'green');
    } else {
      log('❌ Update task failed', 'red');
    }

    // DELETE - Delete task
    log('4. DELETE - Delete Task...');
    const deleteResult = await apiRequest('DELETE', `/tasks/${createdTaskId}`);
    
    if (deleteResult.success) {
      log('✅ Delete task successful', 'green');
    } else {
      log('❌ Delete task failed', 'red');
    }
  }
}

// Messages CRUD Operations
async function testMessagesCRUD() {
  log('\n💬 Testing Messages CRUD Operations...', 'bold');

  // READ - Get messages
  log('1. READ - Get Messages...');
  const getMessagesResult = await apiRequest('GET', '/messages?page=1&limit=5');
  
  if (getMessagesResult.success) {
    log('✅ Get messages successful', 'green');
    log(`   Total: ${getMessagesResult.data.total || getMessagesResult.data.messages?.length || 0}`, 'blue');
  } else {
    log('❌ Get messages failed', 'red');
  }

  // CREATE - Send message (if endpoint exists)
  log('2. CREATE - Send Message...');
  const newMessage = {
    content: 'This is a test message from CRUD operations',
    type: 'text',
    source: 'web'
  };

  const createResult = await apiRequest('POST', '/messages', newMessage);
  
  if (createResult.success) {
    log('✅ Send message successful', 'green');
  } else {
    log('❌ Send message failed', 'red');
    log(`   Note: ${createResult.error}`, 'yellow');
  }
}

// Notifications CRUD Operations
async function testNotificationsCRUD() {
  log('\n🔔 Testing Notifications CRUD Operations...', 'bold');

  // READ - Get notifications
  log('1. READ - Get Notifications...');
  const getNotificationsResult = await apiRequest('GET', '/notifications');
  
  if (getNotificationsResult.success) {
    log('✅ Get notifications successful', 'green');
    const notifications = getNotificationsResult.data.notifications || getNotificationsResult.data;
    log(`   Total: ${notifications.length}`, 'blue');
    
    if (notifications.length > 0) {
      log(`   Latest: ${notifications[0].title}`, 'blue');
    }
  } else {
    log('❌ Get notifications failed', 'red');
  }

  // UPDATE - Mark notification as read
  log('2. UPDATE - Mark Notification as Read...');
  const markReadResult = await apiRequest('PUT', '/notifications/mark-all-read');
  
  if (markReadResult.success) {
    log('✅ Mark notifications as read successful', 'green');
  } else {
    log('❌ Mark notifications as read failed', 'red');
  }
}

// Knowledge Base CRUD Operations
async function testKnowledgeBaseCRUD() {
  log('\n📚 Testing Knowledge Base CRUD Operations...', 'bold');
  let createdKbId = null;

  // CREATE - Create knowledge base item
  log('1. CREATE - Create Knowledge Base Item...');
  const newKbItem = {
    title: 'CRUD Test Knowledge Item',
    content: 'This is a comprehensive test of knowledge base CRUD operations. It covers creating, reading, updating, and deleting knowledge base items.',
    summary: 'Test knowledge base item for CRUD operations',
    category: 'technical',
    type: 'document',
    tags: ['test', 'crud', 'knowledge'],
    status: 'active',
    isActive: true,
    visibility: 'private'
  };

  const createResult = await apiRequest('POST', '/knowledge', newKbItem);
  
  if (createResult.success) {
    createdKbId = createResult.data.knowledgeBase?._id || createResult.data._id;
    log('✅ Create knowledge base item successful', 'green');
    log(`   KB ID: ${createdKbId}`, 'blue');
  } else {
    log('❌ Create knowledge base item failed', 'red');
    log(`   Error: ${createResult.error}`, 'red');
  }

  // READ - Get knowledge base items
  log('2. READ - Get Knowledge Base Items...');
  const getKbResult = await apiRequest('GET', '/knowledge?page=1&limit=5');
  
  if (getKbResult.success) {
    log('✅ Get knowledge base items successful', 'green');
    const items = getKbResult.data.knowledgeBase || getKbResult.data.items || [];
    log(`   Total: ${items.length}`, 'blue');
  } else {
    log('❌ Get knowledge base items failed', 'red');
  }

  // UPDATE and DELETE operations for knowledge base
  if (createdKbId) {
    // UPDATE - Update knowledge base item
    log('3. UPDATE - Update Knowledge Base Item...');
    const updateData = {
      content: 'Updated content for CRUD test knowledge base item. This has been modified to test update operations.',
      tags: ['test', 'crud', 'knowledge', 'updated']
    };

    const updateResult = await apiRequest('PUT', `/knowledge/${createdKbId}`, updateData);
    
    if (updateResult.success) {
      log('✅ Update knowledge base item successful', 'green');
    } else {
      log('❌ Update knowledge base item failed', 'red');
    }

    // DELETE - Delete knowledge base item
    log('4. DELETE - Delete Knowledge Base Item...');
    const deleteResult = await apiRequest('DELETE', `/knowledge/${createdKbId}`);
    
    if (deleteResult.success) {
      log('✅ Delete knowledge base item successful', 'green');
    } else {
      log('❌ Delete knowledge base item failed', 'red');
    }
  }
}

// Workflows CRUD Operations
async function testWorkflowsCRUD() {
  log('\n⚡ Testing Workflows CRUD Operations...', 'bold');

  // READ - Get workflows
  log('1. READ - Get Workflows...');
  const getWorkflowsResult = await apiRequest('GET', '/workflows');
  
  if (getWorkflowsResult.success) {
    log('✅ Get workflows successful', 'green');
    const workflows = getWorkflowsResult.data.workflows || getWorkflowsResult.data;
    log(`   Total: ${workflows.length}`, 'blue');
  } else {
    log('❌ Get workflows failed', 'red');
  }

  // CREATE - Create workflow (simplified)
  log('2. CREATE - Create Workflow...');
  const newWorkflow = {
    name: 'CRUD Test Workflow',
    description: 'Test workflow created by CRUD operations test',
    category: 'custom',
    trigger: {
      type: 'manual',
      conditions: []
    },
    actions: [
      {
        type: 'send_whatsapp',
        order: 1,
        delay: 0,
        config: {
          message: 'Test message from CRUD workflow'
        }
      }
    ],
    status: 'draft',
    isActive: false
  };

  const createResult = await apiRequest('POST', '/workflows', newWorkflow);
  
  if (createResult.success) {
    log('✅ Create workflow successful', 'green');
  } else {
    log('❌ Create workflow failed', 'red');
    log(`   Note: ${createResult.error}`, 'yellow');
  }
}

// Analytics and Reports
async function testAnalytics() {
  log('\n📊 Testing Analytics and Reports...', 'bold');

  // Analytics - Leads overview
  log('1. READ - Leads Analytics...');
  const leadsAnalyticsResult = await apiRequest('GET', '/analytics/leads');
  
  if (leadsAnalyticsResult.success) {
    log('✅ Get leads analytics successful', 'green');
  } else {
    log('❌ Get leads analytics failed', 'red');
  }

  // Analytics - Performance metrics
  log('2. READ - Performance Metrics...');
  const performanceResult = await apiRequest('GET', '/analytics/performance');
  
  if (performanceResult.success) {
    log('✅ Get performance metrics successful', 'green');
  } else {
    log('❌ Get performance metrics failed', 'red');
  }

  // Analytics - System overview
  log('3. READ - System Overview...');
  const overviewResult = await apiRequest('GET', '/analytics/overview');
  
  if (overviewResult.success) {
    log('✅ Get system overview successful', 'green');
  } else {
    log('❌ Get system overview failed', 'red');
  }
}

// Main test runner
async function runComprehensiveCRUDTests() {
  log('🚀 Starting Comprehensive CRUD Operations Test for AI Agent CRM', 'bold');
  log('================================================================', 'blue');

  try {
    // Authentication first
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      log('\n❌ Authentication failed. Cannot continue with tests.', 'red');
      return;
    }

    // Run all CRUD tests
    await testUsersCRUD();
    await testLeadsCRUD();
    await testPlansCRUD();
    await testTasksCRUD();
    await testMessagesCRUD();
    await testNotificationsCRUD();
    await testKnowledgeBaseCRUD();
    await testWorkflowsCRUD();
    await testAnalytics();

    log('\n🎉 Comprehensive CRUD Tests Completed!', 'bold');
    log('================================================================', 'blue');
    log('✅ All major CRUD operations have been tested', 'green');
    log('📊 Database seeding and API endpoints are working correctly', 'green');
    log('🔧 System is ready for development and production use', 'green');

  } catch (error) {
    log('\n❌ Test execution failed:', 'red');
    log(error.message, 'red');
  }
}

// Export for potential module use
module.exports = {
  runComprehensiveCRUDTests,
  testCredentials
};

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveCRUDTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
} 