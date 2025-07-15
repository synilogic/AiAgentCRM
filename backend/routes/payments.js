const express = require('express');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();
const { logger } = require('../utils/logger');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');

// Import payment services
const razorpayService = require('../utils/razorpay');
const paypalService = require('../utils/paypal');

// Use the exported Razorpay service instance
const razorpay = razorpayService;

// Payment Gateway Configurations
const PAYMENT_GATEWAYS = {
  razorpay: {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Complete payment solution for businesses',
    logo: '💳',
    fees: '2% + ₹2',
    features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'],
    supported_currencies: ['INR'],
    status: 'active',
    config: {
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxx',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
      webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret',
      test_mode: process.env.RAZORPAY_TEST_MODE === 'true'
    },
    api_url: 'https://api.razorpay.com/v1/'
  },
  cashfree: {
    id: 'cashfree',
    name: 'Cashfree',
    description: 'Next generation payment gateway',
    logo: '💰',
    fees: '1.75% + ₹1.5',
    features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'QR Code'],
    supported_currencies: ['INR'],
    status: 'active',
    config: {
      app_id: process.env.CASHFREE_APP_ID || 'CF_TEST_xxxxxxxx',
      secret_key: process.env.CASHFREE_SECRET_KEY || 'test_secret',
      client_id: process.env.CASHFREE_CLIENT_ID || 'CF_CLIENT_xxxxxxxx',
      test_mode: process.env.CASHFREE_TEST_MODE === 'true'
    },
    api_url: 'https://sandbox.cashfree.com/pg/' // Use production URL in production
  },
  phonepe: {
    id: 'phonepe',
    name: 'PhonePe',
    description: 'Digital payment platform',
    logo: '📱',
    fees: '1.99% + ₹2',
    features: ['UPI', 'Cards', 'Wallets', 'BBPS'],
    supported_currencies: ['INR'],
    status: 'inactive', // Enable when configured
    config: {
      merchant_id: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT',
      salt_key: process.env.PHONEPE_SALT_KEY || 'test_salt',
      salt_index: process.env.PHONEPE_SALT_INDEX || '1',
      test_mode: process.env.PHONEPE_TEST_MODE === 'true'
    },
    api_url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/' // Use production URL in production
  }
};

// In-memory storage for demo (use database in production)
let transactions = [];
let paymentOrders = [];
let gatewaySettings = { ...PAYMENT_GATEWAYS };

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Get available plans for purchase - PUBLIC ROUTE
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ 
      status: 'active', 
      isPublic: true 
    }).sort({ sortOrder: 1, 'price.monthly': 1 });

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        price: plan.price,
        features: plan.features,
        limits: plan.limits,
        isPopular: plan.isPopular,
        trialDays: plan.trialDays,
        category: plan.category
      }))
    });
  } catch (error) {
    logger.error('Error fetching plans for purchase:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch plans' 
    });
  }
});

// Get Razorpay key ID for frontend - PUBLIC ROUTE
router.get('/razorpay/config', (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID,
    currency: 'INR'
  });
});

// Apply auth middleware to all routes below this point
router.use(auth);

// ==================== AUTHENTICATED ROUTES ====================

// Get all payment gateways
router.get('/gateways', async (req, res) => {
  try {
    const gateways = Object.values(gatewaySettings).map(gateway => ({
      ...gateway,
      config: {
        ...gateway.config,
        key_secret: '****hidden****',
        secret_key: '****hidden****',
        salt_key: '****hidden****',
        webhook_secret: '****hidden****'
      }
    }));

    res.json(gateways);
  } catch (error) {
    logger.error('Error fetching payment gateways:', error);
    res.status(500).json({ error: 'Failed to fetch payment gateways' });
  }
});

// Update payment gateway
router.put('/gateways/:gatewayId', async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const { status, ...updateData } = req.body;

    if (!gatewaySettings[gatewayId]) {
      return res.status(404).json({ error: 'Payment gateway not found' });
    }

    gatewaySettings[gatewayId] = {
      ...gatewaySettings[gatewayId],
      ...updateData,
      status: status || gatewaySettings[gatewayId].status
    };

    logger.info(`Payment gateway ${gatewayId} updated`, { updateData });
    
    res.json({
      success: true,
      message: `Gateway ${gatewayId} updated successfully`,
      gateway: gatewaySettings[gatewayId]
    });
  } catch (error) {
    logger.error('Error updating payment gateway:', error);
    res.status(500).json({ error: 'Failed to update payment gateway' });
  }
});

// Update gateway configuration
router.put('/gateways/:gatewayId/config', async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const configUpdates = req.body;

    if (!gatewaySettings[gatewayId]) {
      return res.status(404).json({ error: 'Payment gateway not found' });
    }

    gatewaySettings[gatewayId].config = {
      ...gatewaySettings[gatewayId].config,
      ...configUpdates
    };

    logger.info(`Payment gateway ${gatewayId} configuration updated`);
    
    res.json({
      success: true,
      message: 'Gateway configuration updated successfully'
    });
  } catch (error) {
    logger.error('Error updating gateway configuration:', error);
    res.status(500).json({ error: 'Failed to update gateway configuration' });
  }
});

// ==================== PAYMENT PROCESSING ROUTES ====================

// Create payment order
router.post('/orders', async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      gateway = 'razorpay',
      method,
      plan_id,
      user_details,
      description
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate gateway
    if (!gatewaySettings[gateway] || gatewaySettings[gateway].status !== 'active') {
      return res.status(400).json({ error: 'Selected payment gateway is not available' });
    }

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order = {
      id: orderId,
      amount: amount,
      currency: currency,
      gateway: gateway,
      method: method,
      plan_id: plan_id,
      user_details: user_details,
      description: description,
      status: 'created',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      user_id: req.user.id
    };

    paymentOrders.push(order);

    logger.info('Payment order created', { orderId, gateway, amount, currency });

    res.json({
      success: true,
      order_id: orderId,
      amount: amount,
      currency: currency,
      gateway: gateway,
      payment_url: getPaymentUrl(gateway),
      expires_at: order.expires_at
    });
  } catch (error) {
    logger.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Process payment (webhook handler)
router.post('/webhook/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const webhookData = req.body;

    logger.info(`Webhook received from ${gateway}`, { webhookData });

    // Verify webhook signature (implement based on gateway requirements)
    const isValid = verifyWebhookSignature(gateway, webhookData, req.headers);
    
    if (!isValid) {
      logger.warn(`Invalid webhook signature from ${gateway}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process payment based on gateway
    const result = await processPaymentWebhook(gateway, webhookData);
    
    if (result.success) {
      // Emit real-time event
      if (req.io) {
        req.io.emit('payment_received', {
          transaction_id: result.transaction_id,
          amount: result.amount,
          gateway: gateway,
          user_id: result.user_id
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Test payment
router.post('/test/:gateway', auth, async (req, res) => {
  try {
    const { gateway } = req.params;
    const { amount, currency = 'INR' } = req.body;

    if (!gatewaySettings[gateway]) {
      return res.status(404).json({ error: 'Payment gateway not found' });
    }

    // Simulate test payment
    const success = Math.random() > 0.2; // 80% success rate for demo
    const transactionId = success ? `test_${gateway}_${Date.now()}` : null;

    if (success) {
      // Create test transaction
      const transaction = {
        id: transactionId,
        order_id: `test_order_${Date.now()}`,
        amount: amount,
        currency: currency,
        status: 'success',
        gateway: gateway,
        method: 'test',
        user_email: req.user.email,
        created_at: new Date(),
        test: true
      };

      transactions.push(transaction);
      logger.info(`Test payment successful for ${gateway}`, { transactionId, amount });
    }

    res.json({
      success: success,
      transaction_id: transactionId,
      error: success ? null : 'Test payment failed - simulated failure',
      gateway: gateway,
      amount: amount,
      currency: currency
    });
  } catch (error) {
    logger.error('Error processing test payment:', error);
    res.status(500).json({ error: 'Test payment failed' });
  }
});

// ==================== TRANSACTION MANAGEMENT ROUTES ====================

// Get transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      gateway,
      method,
      start_date,
      end_date
    } = req.query;

    let filteredTransactions = [...transactions];

    // Apply filters
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }
    if (gateway) {
      filteredTransactions = filteredTransactions.filter(t => t.gateway === gateway);
    }
    if (method) {
      filteredTransactions = filteredTransactions.filter(t => t.method === method);
    }
    if (start_date) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.created_at) >= new Date(start_date)
      );
    }
    if (end_date) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.created_at) <= new Date(end_date)
      );
    }

    // Sort by creation date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: filteredTransactions.length,
        total_pages: Math.ceil(filteredTransactions.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get payment statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Calculate stats from transactions
    const now = new Date();
    const startDate = getStartDateForPeriod(period, now);
    
    const periodTransactions = transactions.filter(t => 
      new Date(t.created_at) >= startDate && new Date(t.created_at) <= now
    );

    const totalRevenue = periodTransactions
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransactions = periodTransactions.length;
    const successfulTransactions = periodTransactions.filter(t => t.status === 'success').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    // Today's revenue
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRevenue = transactions
      .filter(t => new Date(t.created_at) >= todayStart && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    // Gateway performance
    const gatewayPerformance = {};
    Object.keys(gatewaySettings).forEach(gateway => {
      const gatewayTransactions = periodTransactions.filter(t => t.gateway === gateway);
      const gatewaySuccessful = gatewayTransactions.filter(t => t.status === 'success');
      const gatewayRevenue = gatewaySuccessful.reduce((sum, t) => sum + t.amount, 0);
      
      gatewayPerformance[gateway] = {
        success_rate: gatewayTransactions.length > 0 ? 
          (gatewaySuccessful.length / gatewayTransactions.length) * 100 : 0,
        volume: totalTransactions > 0 ? 
          (gatewayTransactions.length / totalTransactions) * 100 : 0,
        revenue: gatewayRevenue,
        transactions: gatewayTransactions.length
      };
    });

    res.json({
      total_revenue: totalRevenue,
      total_transactions: totalTransactions,
      success_rate: Math.round(successRate * 100) / 100,
      today_revenue: todayRevenue,
      monthly_growth: 23.5, // Mock data
      currency: 'INR',
      gateway_performance: gatewayPerformance,
      period: period
    });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get payment settings
router.get('/settings', auth, async (req, res) => {
  try {
    const settings = {
      default_gateway: 'razorpay',
      auto_capture: true,
      webhook_timeout: 30,
      retry_attempts: 3,
      default_currency: 'INR',
      supported_currencies: ['INR'],
      test_mode: process.env.NODE_ENV !== 'production',
      notification_settings: {
        email_notifications: true,
        sms_notifications: false,
        webhook_notifications: true
      },
      security_settings: {
        ip_whitelist: [],
        webhook_signature_verification: true,
        ssl_required: true
      }
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching payment settings:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Update payment settings
router.put('/settings', auth, async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real application, save settings to database
    logger.info('Payment settings updated', { settings });
    
    res.json({
      success: true,
      message: 'Payment settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating payment settings:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// ==================== REFUND MANAGEMENT ====================

// Process refund
router.post('/transactions/:transactionId/refund', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'success') {
      return res.status(400).json({ error: 'Cannot refund unsuccessful transaction' });
    }

    // Process refund based on gateway
    const refundResult = await processRefund(transaction, amount, reason);
    
    if (refundResult.success) {
      // Update transaction status
      transaction.refund_status = 'processed';
      transaction.refund_amount = amount;
      transaction.refund_id = refundResult.refund_id;
      
      logger.info('Refund processed', { transactionId, amount, refundId: refundResult.refund_id });
    }

    res.json(refundResult);
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getPaymentUrl(gateway) {
  const urls = {
    razorpay: 'https://checkout.razorpay.com/v1/payment.js',
    cashfree: 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.js',
    phonepe: 'https://mercury.phonepe.com/web/'
  };
  return urls[gateway] || '';
}

function verifyWebhookSignature(gateway, data, headers) {
  // Implement signature verification based on gateway
  // This is a simplified version - use actual verification logic
  return true;
}

async function processPaymentWebhook(gateway, webhookData) {
  try {
    // Process webhook based on gateway format
    const transactionId = webhookData.transaction_id || webhookData.razorpay_payment_id || webhookData.cf_payment_id;
    const status = webhookData.status === 'success' || webhookData.status === 'captured' ? 'success' : 'failed';
    
    // Create transaction record
    const transaction = {
      id: transactionId,
      order_id: webhookData.order_id,
      amount: webhookData.amount / 100, // Convert from paise to rupees
      currency: 'INR',
      status: status,
      gateway: gateway,
      method: webhookData.method || 'unknown',
      user_email: webhookData.email,
      created_at: new Date(),
      webhook_data: webhookData
    };

    transactions.push(transaction);

    return {
      success: status === 'success',
      transaction_id: transactionId,
      amount: transaction.amount,
      user_id: webhookData.user_id
    };
  } catch (error) {
    logger.error('Error processing webhook data:', error);
    return { success: false, error: error.message };
  }
}

async function processRefund(transaction, amount, reason) {
  try {
    // Mock refund processing - implement actual gateway API calls
    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      refund_id: refundId,
      amount: amount,
      status: 'processed',
      message: 'Refund processed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function getStartDateForPeriod(period, now) {
  const date = new Date(now);
  switch (period) {
    case 'daily':
      date.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      date.setDate(date.getDate() - 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 1);
  }
  return date;
}

// Initialize demo data
function initializeDemoData() {
  // Create some sample transactions
  const sampleTransactions = [
    {
      id: 'txn_001',
      order_id: 'order_001',
      amount: 999,
      currency: 'INR',
      status: 'success',
      gateway: 'razorpay',
      method: 'UPI',
      user_email: 'user@example.com',
      created_at: new Date(Date.now() - 3600000), // 1 hour ago
      fees: 22
    },
    {
      id: 'txn_002',
      order_id: 'order_002',
      amount: 2999,
      currency: 'INR',
      status: 'success',
      gateway: 'cashfree',
      method: 'Credit Card',
      user_email: 'premium@company.com',
      created_at: new Date(Date.now() - 7200000), // 2 hours ago
      fees: 54
    },
    {
      id: 'txn_003',
      order_id: 'order_003',
      amount: 499,
      currency: 'INR',
      status: 'failed',
      gateway: 'phonepe',
      method: 'UPI',
      user_email: 'test@domain.com',
      created_at: new Date(Date.now() - 10800000), // 3 hours ago
      fees: 0
    }
  ];

  transactions.push(...sampleTransactions);
}

// Initialize demo data on module load
initializeDemoData();

// ==================== AUTHENTICATED ROUTES ====================

// Create payment order for plan purchase
router.post('/purchase-plan', async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const userId = req.user._id;

    // Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Plan not found or not available'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    const currency = plan.price.currency || 'INR';

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        error: 'Payment gateway not configured. Please contact administrator.',
        details: 'Razorpay credentials are not configured'
      });
    }

    // Create Razorpay order
    const orderResult = await razorpayService.createOrder(
      amount,
      currency,
      `plan_${planId}_${userId}_${Date.now()}`
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        details: orderResult.error
      });
    }

    // Store payment record
    const payment = new Payment({
      userId: userId,
      planId: planId,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      status: 'pending',
      gateway: 'razorpay',
      gatewayOrderId: orderResult.order.id,
      metadata: {
        planName: plan.name,
        planType: plan.type,
        userEmail: user.email
      }
    });

    await payment.save();

    logger.info('Payment order created for plan purchase', {
      userId,
      planId,
      amount,
      orderId: orderResult.order.id
    });

    res.json({
      success: true,
      orderId: orderResult.order.id,
      amount: amount,
      currency: currency,
      plan: {
        id: plan._id,
        name: plan.name,
        description: plan.description
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    logger.error('Error creating plan purchase order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

// Verify payment and activate plan
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    const userId = req.user._id;

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      userId: userId,
      gatewayOrderId: razorpay_order_id,
      status: 'pending'
    }).populate('planId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Get payment details from Razorpay
    const paymentResult = await razorpayService.getPayment(razorpay_payment_id);
    
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify payment'
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewayResponse = paymentResult.payment;
    payment.completedAt = new Date();
    await payment.save();

    // Update user plan and subscription
    const user = await User.findById(userId);
    const plan = payment.planId;
    
    const subscriptionEndDate = payment.billingCycle === 'yearly' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.plan = plan._id;
    user.subscription = {
      status: 'active',
      startDate: new Date(),
      endDate: subscriptionEndDate,
      billingCycle: payment.billingCycle,
      paymentMethod: 'razorpay',
      autoRenew: true
    };
    
    // Reset usage counters
    user.usage = {
      leads: 0,
      aiReplies: 0,
      followUps: 0,
      messages: 0,
      apiCalls: 0,
      storage: 0
    };

    await user.save();

    logger.info('Plan activated successfully', {
      userId,
      planId: plan._id,
      paymentId: razorpay_payment_id,
      amount: payment.amount
    });

    res.json({
      success: true,
      message: 'Payment verified and plan activated successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        type: plan.type
      },
      subscription: user.subscription,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const payments = await Payment.find({ userId })
      .populate('planId', 'name type price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update subscription status
    user.subscription.status = 'cancelled';
    user.subscription.cancelledAt = new Date();
    user.subscription.cancellationReason = reason;
    user.subscription.autoRenew = false;
    
    await user.save();

    logger.info('Subscription cancelled', { userId, reason });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: user.subscription
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

// Razorpay webhook handler
router.post('/webhook/razorpay', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = req.body;

    // Verify webhook signature (implement based on Razorpay documentation)
    // For now, we'll process the webhook

    if (webhookBody.event === 'payment.captured') {
      const payment = webhookBody.payload.payment.entity;
      
      // Find and update payment record
      const paymentRecord = await Payment.findOne({
        gatewayOrderId: payment.order_id
      });

      if (paymentRecord && paymentRecord.status === 'pending') {
        paymentRecord.status = 'completed';
        paymentRecord.gatewayPaymentId = payment.id;
        paymentRecord.gatewayResponse = payment;
        paymentRecord.completedAt = new Date();
        await paymentRecord.save();

        logger.info('Payment captured via webhook', {
          paymentId: payment.id,
          orderId: payment.order_id
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==================== RAZORPAY PAYMENT ROUTES ====================

// Create Razorpay order for subscription
router.post('/razorpay/create-order', auth, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    // Validate plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Get amount based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan amount'
      });
    }

    // Create Razorpay order
    const orderResult = await razorpay.createOrder(
      amount,
      'INR',
      `subscription_${req.user.id}_${planId}_${Date.now()}`
    );

    if (!orderResult.success) {
      logger.error('Failed to create Razorpay order:', orderResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order'
      });
    }

    // Create payment record in database
    const payment = new Payment({
      user: req.user.id,
      plan: planId,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      gateway: 'razorpay',
      gatewayOrderId: orderResult.order.id,
      gatewayPaymentId: '', // Will be filled after payment
      description: `Subscription to ${plan.name} - ${billingCycle}`,
      metadata: {
        billingCycle,
        planName: plan.name,
        orderCreatedAt: new Date()
      }
    });

    await payment.save();

    res.json({
      success: true,
      order: {
        id: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        receipt: orderResult.order.receipt
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email
      },
      plan: {
        name: plan.name,
        description: plan.description
      }
    });

  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify Razorpay payment and update subscription
router.post('/razorpay/verify-payment', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_id // Our internal payment ID
    } = req.body;

    // Verify payment signature
    const isValidSignature = razorpay.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Find payment record
    const payment = await Payment.findById(payment_id).populate('plan');
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to payment'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpay.getPayment(razorpay_payment_id);
    
    if (!paymentDetails.success) {
      logger.error('Failed to fetch payment details:', paymentDetails.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify payment'
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.paymentMethod = paymentDetails.payment.method;
    payment.completedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      razorpayPaymentDetails: paymentDetails.payment,
      verifiedAt: new Date()
    };

    await payment.save();

    // Update user subscription
    const user = await User.findById(req.user.id);
    const billingCycle = payment.metadata.billingCycle || 'monthly';
    
    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update user subscription
    user.subscription = {
      plan: payment.plan._id,
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      billingCycle: billingCycle,
      autoRenew: true,
      paymentMethod: 'razorpay'
    };

    await user.save();

    logger.info(`Payment completed for user ${user.email}:`, {
      paymentId: razorpay_payment_id,
      amount: payment.amount,
      plan: payment.plan.name
    });

    res.json({
      success: true,
      message: 'Payment verified and subscription updated successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      },
      subscription: user.subscription
    });

  } catch (error) {
    logger.error('Error verifying Razorpay payment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Handle Razorpay webhooks
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing webhook signature or secret' });
    }

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);
    const eventType = event.event;

    logger.info(`Received Razorpay webhook: ${eventType}`, { event: event.payload });

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      default:
        logger.info(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    res.json({ status: 'ok' });

  } catch (error) {
    logger.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==================== WEBHOOK HANDLERS ====================

async function handlePaymentCaptured(paymentData) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentData.id
    }).populate('user plan');

    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        webhookData: paymentData,
        capturedAt: new Date()
      };
      await payment.save();

      logger.info(`Payment captured via webhook: ${paymentData.id}`);
    }
  } catch (error) {
    logger.error('Error handling payment captured webhook:', error);
  }
}

async function handlePaymentFailed(paymentData) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentData.id
    });

    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.errorCode = paymentData.error_code;
      payment.errorMessage = paymentData.error_description;
      payment.metadata = {
        ...payment.metadata,
        webhookData: paymentData,
        failedAt: new Date()
      };
      await payment.save();

      logger.info(`Payment failed via webhook: ${paymentData.id}`);
    }
  } catch (error) {
    logger.error('Error handling payment failed webhook:', error);
  }
}

async function handleSubscriptionActivated(subscriptionData) {
  try {
    logger.info(`Subscription activated via webhook: ${subscriptionData.id}`);
    // Handle subscription activation logic here
  } catch (error) {
    logger.error('Error handling subscription activated webhook:', error);
  }
}

async function handleSubscriptionCharged(subscriptionData) {
  try {
    logger.info(`Subscription charged via webhook: ${subscriptionData.id}`);
    // Handle subscription renewal logic here
  } catch (error) {
    logger.error('Error handling subscription charged webhook:', error);
  }
}

async function handleSubscriptionCancelled(subscriptionData) {
  try {
    logger.info(`Subscription cancelled via webhook: ${subscriptionData.id}`);
    // Handle subscription cancellation logic here
  } catch (error) {
    logger.error('Error handling subscription cancelled webhook:', error);
  }
}

// Admin routes
router.use('/admin', adminAuth);

// GET /api/payments/admin/overview - Get payment overview for admin
router.get('/admin/overview', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const User = require('../models/User');

    const [
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      pendingPayments
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ 'subscription.status': 'active' }),
      Payment.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      overview: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        activeSubscriptions,
        pendingPayments
      }
    });
  } catch (error) {
    console.error('Payment overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment overview'
    });
  }
});

// GET /api/payments/admin/transactions - Get all transactions for admin
router.get('/admin/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, gateway, startDate, endDate } = req.query;
    
    const Payment = require('../models/Payment');
    const query = {};
    
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('user', 'email name')
      .populate('plan', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    });
  }
});

module.exports = router; 
