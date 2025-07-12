const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const clearTestDB = async () => {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
};

const createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '+919876543210',
    businessName: 'Test Business',
    isEmailVerified: true,
    ...userData
  };

  const user = new User(defaultUser);
  await user.save();
  
  return user;
};

const createTestLead = async (leadData = {}, userId) => {
  const Lead = require('../models/Lead');
  
  const defaultLead = {
    name: 'Test Lead',
    phone: '+919876543210',
    email: 'lead@example.com',
    source: 'WhatsApp',
    status: 'New',
    score: 50,
    tags: ['test'],
    notes: 'Test lead notes',
    ...leadData
  };

  if (userId) {
    defaultLead.user = userId;
  }

  const lead = new Lead(defaultLead);
  await lead.save();
  
  return lead;
};

const createTestPlan = async (planData = {}) => {
  const Plan = require('../models/Plan');
  
  const defaultPlan = {
    name: 'Test Plan',
    price: 999,
    currency: 'INR',
    interval: 'month',
    features: ['WhatsApp Integration', 'AI Responses'],
    maxLeads: 1000,
    maxMessages: 5000,
    ...planData
  };

  const plan = new Plan(defaultPlan);
  await plan.save();
  
  return plan;
};

const createTestSubscription = async (subscriptionData = {}, userId, planId) => {
  const Subscription = require('../models/Subscription');
  
  const defaultSubscription = {
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    razorpaySubscriptionId: 'sub_test123',
    razorpayCustomerId: 'cust_test123',
    ...subscriptionData
  };

  if (userId) {
    defaultSubscription.user = userId;
  }
  
  if (planId) {
    defaultSubscription.plan = planId;
  }

  const subscription = new Subscription(defaultSubscription);
  await subscription.save();
  
  return subscription;
};

const generateAuthToken = async (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const mockWhatsAppClient = () => {
  return {
    initialize: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue({ id: 'msg_test123' }),
    getChats: jest.fn().mockResolvedValue([]),
    getChatById: jest.fn().mockResolvedValue({ messages: [] }),
    isConnected: true
  };
};

const mockOpenAI = () => {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'This is a test AI response'
            }
          }]
        })
      }
    }
  };
};

const mockRazorpay = () => {
  return {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 99900,
        currency: 'INR'
      })
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        status: 'captured'
      })
    }
  };
};

module.exports = {
  setupTestDB,
  clearTestDB,
  createTestUser,
  createTestLead,
  createTestPlan,
  createTestSubscription,
  generateAuthToken,
  mockWhatsAppClient,
  mockOpenAI,
  mockRazorpay
}; 