const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['basic', 'pro', 'enterprise', 'custom'],
    required: true,
    index: true
  },
  
  // Pricing
  price: {
    monthly: {
      type: Number,
      required: true,
      min: 0
    },
    yearly: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'AED']
    }
  },
  
  // Usage Limits
  limits: {
    leads: {
      type: Number,
      default: 0
    },
    aiReplies: {
      type: Number,
      default: 0
    },
    followUps: {
      type: Number,
      default: 0
    },
    messages: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number,
      default: 0 // in MB
    },
    teamMembers: {
      type: Number,
      default: 1
    },
    workflows: {
      type: Number,
      default: 0
    },
    integrations: {
      type: Number,
      default: 0
    }
  },
  
  // Feature Flags
  features: {
    aiAssistant: { type: Boolean, default: false },
    whatsappIntegration: { type: Boolean, default: false },
    googleSheetsIntegration: { type: Boolean, default: false },
    facebookAdsIntegration: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    customWorkflows: { type: Boolean, default: false },
    teamCollaboration: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false },
    dataExport: { type: Boolean, default: false },
    advancedReporting: { type: Boolean, default: false },
    mobileApp: { type: Boolean, default: false },
    sso: { type: Boolean, default: false } // Single Sign-On
  },
  
  // Status & Availability
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated', 'beta'],
    default: 'active',
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  
  // Trial & Promotional
  trialDays: {
    type: Number,
    default: 0,
    min: 0
  },
  promotionalPrice: {
    monthly: Number,
    yearly: Number,
    validUntil: Date,
    code: String
  },
  
  // Billing & Payment
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  setupFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Usage & Analytics
  usage: {
    totalSubscribers: { type: Number, default: 0 },
    activeSubscribers: { type: Number, default: 0 },
    averageUsage: {
      leads: { type: Number, default: 0 },
      aiReplies: { type: Number, default: 0 },
      followUps: { type: Number, default: 0 },
      messages: { type: Number, default: 0 }
    },
    churnRate: { type: Number, default: 0 },
    averageRevenue: { type: Number, default: 0 }
  },
  
  // Metadata
  sortOrder: {
    type: Number,
    default: 0
  },
  tags: [String],
  category: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'custom'],
    default: 'starter'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PlanSchema.index({ type: 1, status: 1, sortOrder: 1 });
PlanSchema.index({ isPublic: 1, status: 1 });
PlanSchema.index({ 'price.monthly': 1 });
PlanSchema.index({ 'price.yearly': 1 });

// Virtual for current price
PlanSchema.virtual('currentPrice').get(function() {
  if (this.promotionalPrice && this.promotionalPrice.validUntil > new Date()) {
    return this.billingCycle === 'yearly' ? this.promotionalPrice.yearly : this.promotionalPrice.monthly;
  }
  return this.billingCycle === 'yearly' ? this.price.yearly : this.price.monthly;
});

// Virtual for savings percentage
PlanSchema.virtual('yearlySavings').get(function() {
  if (this.price.monthly === 0) return 0;
  const yearlyCost = this.price.monthly * 12;
  const savings = yearlyCost - this.price.yearly;
  return yearlyCost > 0 ? (savings / yearlyCost) * 100 : 0;
});

// Virtual for feature count
PlanSchema.virtual('featureCount').get(function() {
  return Object.values(this.features).filter(feature => feature === true).length;
});

// Pre-save middleware
PlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure yearly price is less than monthly * 12
  if (this.price.yearly >= this.price.monthly * 12) {
    this.price.yearly = this.price.monthly * 12 * 0.8; // 20% discount
  }
  
  next();
});

// Instance methods
PlanSchema.methods.isFeatureEnabled = function(featureName) {
  return this.features[featureName] === true;
};

PlanSchema.methods.getLimit = function(limitType) {
  return this.limits[limitType] || 0;
};

PlanSchema.methods.canUpgrade = function(currentPlan) {
  return this.price.monthly > currentPlan.price.monthly;
};

PlanSchema.methods.canDowngrade = function(currentPlan) {
  return this.price.monthly < currentPlan.price.monthly;
};

PlanSchema.methods.getPriceForBillingCycle = function(billingCycle) {
  if (this.promotionalPrice && this.promotionalPrice.validUntil > new Date()) {
    return billingCycle === 'yearly' ? this.promotionalPrice.yearly : this.promotionalPrice.monthly;
  }
  return billingCycle === 'yearly' ? this.price.yearly : this.price.monthly;
};

// Static methods
PlanSchema.statics.findPublicPlans = function() {
  return this.find({
    isPublic: true,
    status: 'active'
  })
  .sort({ sortOrder: 1, 'price.monthly': 1 })
  .select('-usage');
};

PlanSchema.statics.findByType = function(type) {
  return this.find({
    type,
    status: 'active'
  }).sort({ 'price.monthly': 1 });
};

PlanSchema.statics.getPopularPlans = function() {
  return this.find({
    isPopular: true,
    isPublic: true,
    status: 'active'
  })
  .sort({ sortOrder: 1 })
  .limit(3);
};

PlanSchema.statics.updateUsageStats = async function(planId) {
  const User = require('./User');
  
  const stats = await User.aggregate([
    { $match: { plan: mongoose.Types.ObjectId(planId) } },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 },
        activeSubscribers: { $sum: { $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0] } },
        averageLeads: { $avg: '$usage.leads' },
        averageAiReplies: { $avg: '$usage.aiReplies' },
        averageFollowUps: { $avg: '$usage.followUps' },
        averageMessages: { $avg: '$usage.messages' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    await this.findByIdAndUpdate(planId, {
      'usage.totalSubscribers': stat.totalSubscribers,
      'usage.activeSubscribers': stat.activeSubscribers,
      'usage.averageUsage.leads': Math.round(stat.averageLeads || 0),
      'usage.averageUsage.aiReplies': Math.round(stat.averageAiReplies || 0),
      'usage.averageUsage.followUps': Math.round(stat.averageFollowUps || 0),
      'usage.averageUsage.messages': Math.round(stat.averageMessages || 0)
    });
  }
};

PlanSchema.statics.getPlanComparison = function() {
  return this.find({
    isPublic: true,
    status: 'active'
  })
  .sort({ 'price.monthly': 1 })
  .select('name type price features limits trialDays');
};

module.exports = mongoose.model('Plan', PlanSchema); 