const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { setupTestDB, clearTestDB, createTestUser, createTestPlan, createTestSubscription, generateAuthToken, mockRazorpay } = require('./testUtils');

// Mock Razorpay
jest.mock('../utils/razorpay', () => ({
  createOrder: jest.fn(),
  createSubscription: jest.fn(),
  verifyPayment: jest.fn(),
  getPaymentDetails: jest.fn(),
  cancelSubscription: jest.fn()
}));

const razorpayUtils = require('../utils/razorpay');

describe('Payment and Subscription Endpoints', () => {
  let token;
  let user;
  let plan;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await clearTestDB();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    user = await createTestUser();
    plan = await createTestPlan();
    token = await generateAuthToken(user);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create-order', () => {
    it('should create payment order', async () => {
      const orderData = {
        planId: plan._id.toString(),
        amount: 99900,
        currency: 'INR'
      };

      const mockOrder = {
        id: 'order_test123',
        amount: 99900,
        currency: 'INR',
        receipt: 'receipt_test123'
      };

      razorpayUtils.createOrder.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toEqual(mockOrder);
      expect(razorpayUtils.createOrder).toHaveBeenCalledWith(orderData);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate plan exists', async () => {
      const fakePlanId = new mongoose.Types.ObjectId();
      const orderData = {
        planId: fakePlanId.toString(),
        amount: 99900
      };

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Plan not found');
    });

    it('should handle order creation failure', async () => {
      const orderData = {
        planId: plan._id.toString(),
        amount: 99900
      };

      razorpayUtils.createOrder.mockRejectedValue(new Error('Order creation failed'));

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to create order');
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify payment and create subscription', async () => {
      const paymentData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature'
      };

      const mockPayment = {
        id: 'pay_test123',
        status: 'captured',
        amount: 99900,
        currency: 'INR'
      };

      razorpayUtils.verifyPayment.mockResolvedValue({
        success: true,
        payment: mockPayment
      });

      razorpayUtils.createSubscription.mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeDefined();
      expect(razorpayUtils.verifyPayment).toHaveBeenCalledWith(paymentData);
    });

    it('should handle payment verification failure', async () => {
      const paymentData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature'
      };

      razorpayUtils.verifyPayment.mockResolvedValue({
        success: false,
        error: 'Invalid signature'
      });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid signature');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/payments/create-subscription', () => {
    it('should create subscription directly', async () => {
      const subscriptionData = {
        planId: plan._id.toString(),
        startDate: new Date().toISOString()
      };

      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
      };

      razorpayUtils.createSubscription.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeDefined();
      expect(razorpayUtils.createSubscription).toHaveBeenCalledWith({
        planId: plan._id.toString(),
        userId: user._id.toString(),
        startDate: subscriptionData.startDate
      });
    });

    it('should validate plan exists', async () => {
      const fakePlanId = new mongoose.Types.ObjectId();
      const subscriptionData = {
        planId: fakePlanId.toString()
      };

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Plan not found');
    });

    it('should handle subscription creation failure', async () => {
      const subscriptionData = {
        planId: plan._id.toString()
      };

      razorpayUtils.createSubscription.mockRejectedValue(new Error('Subscription creation failed'));

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to create subscription');
    });
  });

  describe('GET /api/payments/subscription', () => {
    it('should get current user subscription', async () => {
      const subscription = await createTestSubscription({}, user._id, plan._id);

      const response = await request(app)
        .get('/api/payments/subscription')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription._id).toBe(subscription._id.toString());
      expect(response.body.subscription.plan._id).toBe(plan._id.toString());
    });

    it('should return null for user without subscription', async () => {
      const response = await request(app)
        .get('/api/payments/subscription')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/payments/subscription')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/subscription/:id/cancel', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await createTestSubscription({}, user._id, plan._id);
    });

    it('should cancel subscription', async () => {
      razorpayUtils.cancelSubscription.mockResolvedValue({
        success: true,
        message: 'Subscription cancelled'
      });

      const response = await request(app)
        .post(`/api/payments/subscription/${subscription._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Subscription cancelled');
      expect(razorpayUtils.cancelSubscription).toHaveBeenCalledWith(subscription.razorpaySubscriptionId);
    });

    it('should not cancel subscription from different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherSubscription = await createTestSubscription({}, otherUser._id, plan._id);

      const response = await request(app)
        .post(`/api/payments/subscription/${otherSubscription._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle cancellation failure', async () => {
      razorpayUtils.cancelSubscription.mockRejectedValue(new Error('Cancellation failed'));

      const response = await request(app)
        .post(`/api/payments/subscription/${subscription._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to cancel subscription');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should get payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it('should paginate payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/plans', () => {
    it('should get all available plans', async () => {
      const response = await request(app)
        .get('/api/payments/plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.plans).toBeDefined();
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);
    });

    it('should include plan details', async () => {
      const response = await request(app)
        .get('/api/payments/plans')
        .expect(200);

      const plan = response.body.plans[0];
      expect(plan).toHaveProperty('_id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('features');
      expect(plan).toHaveProperty('maxLeads');
      expect(plan).toHaveProperty('maxMessages');
    });
  });

  describe('GET /api/payments/plans/:id', () => {
    it('should get specific plan details', async () => {
      const response = await request(app)
        .get(`/api/payments/plans/${plan._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.plan._id).toBe(plan._id.toString());
      expect(response.body.plan.name).toBe(plan.name);
    });

    it('should return 404 for non-existent plan', async () => {
      const fakePlanId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/payments/plans/${fakePlanId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Plan not found');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle payment success webhook', async () => {
      const webhookData = {
        event: 'payment.captured',
        payload: {
          payment: {
            id: 'pay_test123',
            order_id: 'order_test123',
            status: 'captured',
            amount: 99900
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook processed');
    });

    it('should handle subscription webhook', async () => {
      const webhookData = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_test123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000)
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle unknown webhook event', async () => {
      const webhookData = {
        event: 'unknown.event',
        payload: {}
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unknown webhook event');
    });

    it('should validate webhook data', async () => {
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/payments/usage', () => {
    it('should get current usage statistics', async () => {
      const response = await request(app)
        .get('/api/payments/usage')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.usage).toBeDefined();
      expect(response.body.usage.leadsUsed).toBeDefined();
      expect(response.body.usage.messagesUsed).toBeDefined();
      expect(response.body.usage.planLimits).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/payments/usage')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 