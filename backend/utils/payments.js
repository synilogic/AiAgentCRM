const crypto = require('crypto');
const logger = require('./logger');

// Payment gateway configurations
const GATEWAY_CONFIGS = {
  razorpay: {
    fee_percentage: 2.0,
    fixed_fee: 2.0,
    min_amount: 100, // ₹1.00
    max_amount: 1000000, // ₹10,000.00
    supported_methods: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'],
    api_url: 'https://api.razorpay.com/v1/',
    webhook_tolerance: 300 // 5 minutes
  },
  cashfree: {
    fee_percentage: 1.75,
    fixed_fee: 1.5,
    min_amount: 100,
    max_amount: 1000000,
    supported_methods: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'QR Code'],
    api_url: 'https://api.cashfree.com/pg/',
    webhook_tolerance: 300
  },
  phonepe: {
    fee_percentage: 1.99,
    fixed_fee: 2.0,
    min_amount: 100,
    max_amount: 1000000,
    supported_methods: ['UPI', 'Cards', 'Wallets', 'BBPS'],
    api_url: 'https://api.phonepe.com/apis/hermes/',
    webhook_tolerance: 300
  }
};

/**
 * Format amount in INR currency
 * @param {number} amount - Amount in rupees
 * @param {boolean} includeSymbol - Whether to include ₹ symbol
 * @returns {string} Formatted amount
 */
function formatINR(amount, includeSymbol = true) {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Calculate payment gateway fees
 * @param {string} gateway - Gateway identifier
 * @param {number} amount - Transaction amount in rupees
 * @returns {object} Fee breakdown
 */
function calculateFees(gateway, amount) {
  const config = GATEWAY_CONFIGS[gateway];
  if (!config) {
    throw new Error(`Unsupported gateway: ${gateway}`);
  }

  const percentageFee = (amount * config.fee_percentage) / 100;
  const totalFees = percentageFee + config.fixed_fee;
  
  return {
    percentage_fee: Math.round(percentageFee * 100) / 100,
    fixed_fee: config.fixed_fee,
    total_fees: Math.round(totalFees * 100) / 100,
    amount_after_fees: Math.round((amount - totalFees) * 100) / 100,
    gateway: gateway
  };
}

/**
 * Validate payment amount for gateway
 * @param {string} gateway - Gateway identifier
 * @param {number} amount - Amount in rupees
 * @returns {object} Validation result
 */
function validateAmount(gateway, amount) {
  const config = GATEWAY_CONFIGS[gateway];
  if (!config) {
    return { valid: false, error: `Unsupported gateway: ${gateway}` };
  }

  if (amount < config.min_amount) {
    return { 
      valid: false, 
      error: `Minimum amount for ${gateway} is ${formatINR(config.min_amount / 100)}` 
    };
  }

  if (amount > config.max_amount) {
    return { 
      valid: false, 
      error: `Maximum amount for ${gateway} is ${formatINR(config.max_amount / 100)}` 
    };
  }

  return { valid: true };
}

/**
 * Generate payment order ID
 * @param {string} gateway - Gateway identifier
 * @param {string} userId - User ID
 * @returns {string} Order ID
 */
function generateOrderId(gateway, userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${gateway}_${userId}_${timestamp}_${random}`;
}

/**
 * Generate transaction ID
 * @param {string} gateway - Gateway identifier
 * @returns {string} Transaction ID
 */
function generateTransactionId(gateway) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `txn_${gateway}_${timestamp}_${random}`;
}

/**
 * Verify webhook signature for Razorpay
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @param {string} secret - Webhook secret
 * @returns {boolean} Verification result
 */
function verifyRazorpaySignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature for Cashfree
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @param {string} timestamp - Webhook timestamp
 * @param {string} secret - Webhook secret
 * @returns {boolean} Verification result
 */
function verifyCashfreeSignature(payload, signature, timestamp, secret) {
  try {
    const signatureString = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureString)
      .digest('base64');
    
    return expectedSignature === signature;
  } catch (error) {
    logger.error('Error verifying Cashfree signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature for PhonePe
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @param {string} saltKey - Salt key
 * @param {string} saltIndex - Salt index
 * @returns {boolean} Verification result
 */
function verifyPhonePeSignature(payload, signature, saltKey, saltIndex) {
  try {
    const signatureString = payload + '/pg/v1/status' + saltKey;
    const expectedSignature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex') + '###' + saltIndex;
    
    return expectedSignature === signature;
  } catch (error) {
    logger.error('Error verifying PhonePe signature:', error);
    return false;
  }
}

/**
 * Convert amount between paise and rupees
 * @param {number} amount - Amount to convert
 * @param {string} direction - 'toRupees' or 'toPaise'
 * @returns {number} Converted amount
 */
function convertAmount(amount, direction) {
  if (direction === 'toRupees') {
    return amount / 100;
  } else if (direction === 'toPaise') {
    return Math.round(amount * 100);
  }
  throw new Error(`Invalid direction: ${direction}`);
}

/**
 * Get gateway configuration
 * @param {string} gateway - Gateway identifier
 * @returns {object} Gateway configuration
 */
function getGatewayConfig(gateway) {
  return GATEWAY_CONFIGS[gateway] || null;
}

/**
 * Check if payment method is supported by gateway
 * @param {string} gateway - Gateway identifier
 * @param {string} method - Payment method
 * @returns {boolean} Support status
 */
function isMethodSupported(gateway, method) {
  const config = GATEWAY_CONFIGS[gateway];
  if (!config) return false;
  
  return config.supported_methods.some(
    supportedMethod => supportedMethod.toLowerCase() === method.toLowerCase()
  );
}

/**
 * Generate payment analytics for dashboard
 * @param {Array} transactions - Transaction array
 * @param {string} period - Time period ('daily', 'weekly', 'monthly', 'yearly')
 * @returns {object} Analytics data
 */
function generatePaymentAnalytics(transactions, period = 'monthly') {
  const now = new Date();
  const startDate = getStartDateForPeriod(period, now);
  
  const filteredTransactions = transactions.filter(t => 
    new Date(t.created_at) >= startDate
  );

  const successfulTransactions = filteredTransactions.filter(t => t.status === 'success');
  
  // Revenue by gateway
  const revenueByGateway = {};
  successfulTransactions.forEach(t => {
    if (!revenueByGateway[t.gateway]) {
      revenueByGateway[t.gateway] = 0;
    }
    revenueByGateway[t.gateway] += t.amount;
  });

  // Payment method distribution
  const methodDistribution = {};
  filteredTransactions.forEach(t => {
    if (!methodDistribution[t.method]) {
      methodDistribution[t.method] = 0;
    }
    methodDistribution[t.method]++;
  });

  // Success rate by gateway
  const gatewayPerformance = {};
  Object.keys(GATEWAY_CONFIGS).forEach(gateway => {
    const gatewayTransactions = filteredTransactions.filter(t => t.gateway === gateway);
    const gatewaySuccessful = gatewayTransactions.filter(t => t.status === 'success');
    
    gatewayPerformance[gateway] = {
      total_transactions: gatewayTransactions.length,
      successful_transactions: gatewaySuccessful.length,
      success_rate: gatewayTransactions.length > 0 ? 
        (gatewaySuccessful.length / gatewayTransactions.length) * 100 : 0,
      revenue: gatewaySuccessful.reduce((sum, t) => sum + t.amount, 0)
    };
  });

  return {
    period,
    total_revenue: successfulTransactions.reduce((sum, t) => sum + t.amount, 0),
    total_transactions: filteredTransactions.length,
    successful_transactions: successfulTransactions.length,
    success_rate: filteredTransactions.length > 0 ? 
      (successfulTransactions.length / filteredTransactions.length) * 100 : 0,
    revenue_by_gateway: revenueByGateway,
    method_distribution: methodDistribution,
    gateway_performance: gatewayPerformance
  };
}

/**
 * Get start date for a given period
 * @param {string} period - Period identifier
 * @param {Date} now - Current date
 * @returns {Date} Start date
 */
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

/**
 * Validate INR amount format
 * @param {number} amount - Amount to validate
 * @returns {object} Validation result
 */
function validateINRAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  if (amount < 1) {
    return { valid: false, error: 'Minimum amount is ₹1.00' };
  }

  if (amount > 1000000) {
    return { valid: false, error: 'Maximum amount is ₹10,00,000.00' };
  }

  // Check for more than 2 decimal places
  if ((amount * 100) % 1 !== 0) {
    return { valid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  return { valid: true };
}

module.exports = {
  formatINR,
  calculateFees,
  validateAmount,
  validateINRAmount,
  generateOrderId,
  generateTransactionId,
  verifyRazorpaySignature,
  verifyCashfreeSignature,
  verifyPhonePeSignature,
  convertAmount,
  getGatewayConfig,
  isMethodSupported,
  generatePaymentAnalytics,
  getStartDateForPeriod,
  GATEWAY_CONFIGS
}; 