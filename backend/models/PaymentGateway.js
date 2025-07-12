const mongoose = require('mongoose');

const PaymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    enum: ['razorpay', 'cashfree', 'phonepe', 'stripe', 'paypal']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: String,
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Configuration settings
  config: {
    // API Credentials
    keyId: String,
    keySecret: String,
    merchantId: String,
    webhookSecret: String,
    
    // Environment settings
    testMode: {
      type: Boolean,
      default: true
    },
    apiUrl: String,
    webhookUrl: String,
    
    // Currency and region
    supportedCurrencies: [{
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD']
    }],
    defaultCurrency: {
      type: String,
      default: 'INR',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD']
    },
    supportedCountries: [String],
    
    // Fee structure
    fees: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      fixed: {
        type: Number,
        default: 0,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    
    // Limits
    limits: {
      minAmount: {
        type: Number,
        default: 1
      },
      maxAmount: {
        type: Number,
        default: 1000000
      },
      dailyLimit: Number,
      monthlyLimit: Number
    }
  },
  
  // Supported features
  features: {
    instantRefunds: {
      type: Boolean,
      default: false
    },
    recurringPayments: {
      type: Boolean,
      default: false
    },
    internationalPayments: {
      type: Boolean,
      default: false
    },
    upiPayments: {
      type: Boolean,
      default: false
    },
    cardPayments: {
      type: Boolean,
      default: true
    },
    netBanking: {
      type: Boolean,
      default: false
    },
    walletPayments: {
      type: Boolean,
      default: false
    },
    qrCodePayments: {
      type: Boolean,
      default: false
    },
    linkPayments: {
      type: Boolean,
      default: false
    },
    subscriptions: {
      type: Boolean,
      default: false
    }
  },
  
  // Performance statistics
  statistics: {
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageProcessingTime: {
      type: Number,
      default: 0 // in seconds
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalVolume: {
      type: Number,
      default: 0 // in currency units
    },
    failureRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // Monthly statistics
    monthlyStats: [{
      month: String, // YYYY-MM format
      transactions: {
        type: Number,
        default: 0
      },
      volume: {
        type: Number,
        default: 0
      },
      successRate: {
        type: Number,
        default: 0
      },
      averageAmount: {
        type: Number,
        default: 0
      }
    }],
    
    // Last updated
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Status tracking
  status: {
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'error', 'testing'],
      default: 'disconnected'
    },
    lastHealthCheck: Date,
    healthCheckInterval: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    },
    errorMessage: String,
    errorCount: {
      type: Number,
      default: 0
    }
  },
  
  // Integration settings
  integration: {
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fallbackGateway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentGateway'
    },
    loadBalancing: {
      enabled: {
        type: Boolean,
        default: false
      },
      weight: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      }
    }
  },
  
  // Metadata
  logo: String,
  brandColor: String,
  supportUrl: String,
  documentationUrl: String,
  tags: [String],
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentGatewaySchema.index({ name: 1 });
PaymentGatewaySchema.index({ isActive: 1, isDefault: 1 });
PaymentGatewaySchema.index({ 'statistics.successRate': -1 });
PaymentGatewaySchema.index({ 'integration.priority': -1 });

// Ensure only one default gateway
PaymentGatewaySchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for configuration status
PaymentGatewaySchema.virtual('isConfigured').get(function() {
  return !!(this.config.keyId && this.config.keySecret);
});

// Virtual for formatted fees
PaymentGatewaySchema.virtual('formattedFees').get(function() {
  const { percentage, fixed, currency } = this.config.fees;
  return `${percentage}% + ${currency} ${fixed}`;
});

// Instance method to test connection
PaymentGatewaySchema.methods.testConnection = async function() {
  // This would implement actual connection testing based on gateway type
  try {
    // Simulate connection test
    this.status.connectionStatus = 'connected';
    this.status.lastHealthCheck = new Date();
    this.status.errorMessage = null;
    this.status.errorCount = 0;
    
    await this.save();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    this.status.connectionStatus = 'error';
    this.status.errorMessage = error.message;
    this.status.errorCount += 1;
    
    await this.save();
    return { success: false, message: error.message };
  }
};

// Instance method to update statistics
PaymentGatewaySchema.methods.updateStatistics = async function(transactionData) {
  const { amount, success, processingTime } = transactionData;
  
  // Update total statistics
  this.statistics.totalTransactions += 1;
  this.statistics.totalVolume += amount;
  
  // Update success rate
  const successCount = Math.floor(this.statistics.totalTransactions * (this.statistics.successRate / 100));
  const newSuccessCount = success ? successCount + 1 : successCount;
  this.statistics.successRate = (newSuccessCount / this.statistics.totalTransactions) * 100;
  
  // Update failure rate
  this.statistics.failureRate = 100 - this.statistics.successRate;
  
  // Update average processing time
  const currentAvg = this.statistics.averageProcessingTime;
  const totalTime = currentAvg * (this.statistics.totalTransactions - 1) + processingTime;
  this.statistics.averageProcessingTime = totalTime / this.statistics.totalTransactions;
  
  // Update monthly statistics
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  let monthlyRecord = this.statistics.monthlyStats.find(stat => stat.month === currentMonth);
  
  if (!monthlyRecord) {
    monthlyRecord = {
      month: currentMonth,
      transactions: 0,
      volume: 0,
      successRate: 0,
      averageAmount: 0
    };
    this.statistics.monthlyStats.push(monthlyRecord);
  }
  
  monthlyRecord.transactions += 1;
  monthlyRecord.volume += amount;
  monthlyRecord.averageAmount = monthlyRecord.volume / monthlyRecord.transactions;
  
  // Calculate monthly success rate
  const monthlySuccessCount = Math.floor(monthlyRecord.transactions * (monthlyRecord.successRate / 100));
  const newMonthlySuccessCount = success ? monthlySuccessCount + 1 : monthlySuccessCount;
  monthlyRecord.successRate = (newMonthlySuccessCount / monthlyRecord.transactions) * 100;
  
  this.statistics.lastUpdated = new Date();
  
  await this.save();
};

// Static method to get active gateways
PaymentGatewaySchema.statics.getActiveGateways = function() {
  return this.find({ isActive: true }).sort({ 'integration.priority': -1 });
};

// Static method to get default gateway
PaymentGatewaySchema.statics.getDefaultGateway = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Static method to get best performing gateway
PaymentGatewaySchema.statics.getBestPerforming = function(criteria = 'successRate') {
  const sortField = `statistics.${criteria}`;
  return this.findOne({ isActive: true }).sort({ [sortField]: -1 });
};

module.exports = mongoose.model('PaymentGateway', PaymentGatewaySchema); 