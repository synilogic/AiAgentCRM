const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: false
  },

  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Gateway information
  gateway: {
    type: String,
    required: true,
    enum: ['razorpay', 'paypal'],
    index: true
  },
  
  gatewayPaymentId: {
    type: String,
    required: true,
    index: true
  },
  
  gatewaySubscriptionId: {
    type: String,
    index: true
  },
  
  gatewayOrderId: {
    type: String,
    index: true
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'upi', 'wallet', 'paypal', 'bank_transfer'],
    required: false
  },
  
  // Description and metadata
  description: {
    type: String,
    required: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Error information
  errorCode: {
    type: String
  },
  
  errorMessage: {
    type: String
  },
  
  // Refund information
  refundedAmount: {
    type: Number,
    default: 0
  },
  
  refundedAt: {
    type: Date
  },
  
  refundReason: {
    type: String
  },
  
  // Timestamps
  processedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ gateway: 1, status: 1 });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for payment age
paymentSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is refundable
paymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'completed' && 
         this.refundedAmount < this.amount &&
         this.completedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Set processed timestamp when status changes to processing
  if (this.isModified('status') && this.status === 'processing' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Set completed timestamp when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set failed timestamp when status changes to failed
  if (this.isModified('status') && this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  
  next();
});

// Static methods
paymentSchema.statics.getPaymentStats = async function(userId, period = '30d') {
  const startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  const stats = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedAmount: { $sum: '$refundedAmount' }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    failedPayments: 0,
    refundedAmount: 0
  };
};

paymentSchema.statics.getGatewayStats = async function(userId) {
  return await this.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$gateway',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        }
      }
    }
  ]);
};

paymentSchema.statics.getMonthlyStats = async function(userId, year) {
  const startDate = new Date(year || new Date().getFullYear(), 0, 1);
  const endDate = new Date(year || new Date().getFullYear(), 11, 31, 23, 59, 59);

  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Instance methods
paymentSchema.methods.markAsCompleted = function(gatewayPaymentId = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (gatewayPaymentId) {
    this.gatewayPaymentId = gatewayPaymentId;
  }
  return this.save();
};

paymentSchema.methods.markAsFailed = function(errorCode = null, errorMessage = null) {
  this.status = 'failed';
  this.failedAt = new Date();
  if (errorCode) this.errorCode = errorCode;
  if (errorMessage) this.errorMessage = errorMessage;
  return this.save();
};

paymentSchema.methods.refund = function(amount, reason = 'User requested refund') {
  if (!this.isRefundable) {
    throw new Error('Payment is not refundable');
  }
  
  const refundAmount = Math.min(amount, this.amount - this.refundedAmount);
  this.refundedAmount += refundAmount;
  this.refundedAt = new Date();
  this.refundReason = reason;
  
  if (this.refundedAmount >= this.amount) {
    this.status = 'refunded';
  }
  
  return this.save();
};

// Export the model
module.exports = mongoose.model('Payment', paymentSchema); 