const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager', 'agent'],
    default: 'user',
    index: true
  },
  
  // Business Information
  businessName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  industry: {
    type: String,
    trim: true,
    maxlength: 100
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
    default: '1-10'
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Subscription & Billing
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    index: true
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'trial', 'expired'],
      default: 'inactive',
      index: true
    },
    startDate: Date,
    endDate: Date,
    trialEndDate: Date,
    razorpaySubscriptionId: String,
    razorpayCustomerId: String,
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  
  // Usage Tracking
  usage: {
    leads: { type: Number, default: 0 },
    aiReplies: { type: Number, default: 0 },
    followUps: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // in MB
  },
  
  // Real-time Status
  status: {
    online: {
      type: Boolean,
      default: false,
      index: true
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true
    },
    currentSession: {
      sessionId: String,
      deviceInfo: {
        browser: String,
        os: String,
        device: String,
        ip: String
      },
      loginTime: Date
    }
  },
  
  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Preferences & Settings
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'hi', 'ar']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'AED']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    }
  },
  
  // Notification Settings
  notificationSettings: {
    email: {
      leads: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      leads: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      system: { type: Boolean, default: true }
    },
    sms: {
      leads: { type: Boolean, default: false },
      payments: { type: Boolean, default: false },
      security: { type: Boolean, default: true }
    },
    whatsapp: {
      leads: { type: Boolean, default: false },
      payments: { type: Boolean, default: false }
    }
  },
  
  // Security & Privacy
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    passwordHistory: [{
      password: String,
      changedAt: Date
    }]
  },
  
  // API & Integration
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  integrations: {
    whatsapp: {
      connected: { type: Boolean, default: false },
      phoneNumber: String,
      businessAccountId: String,
      accessToken: String,
      webhookUrl: String,
      lastSync: Date
    },
    googleSheets: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
      spreadsheetId: String,
      lastSync: Date
    },
    facebook: {
      connected: { type: Boolean, default: false },
      pageId: String,
      accessToken: String,
      lastSync: Date
    }
  },
  
  // Analytics & Tracking
  analytics: {
    totalLogins: { type: Number, default: 0 },
    lastLogin: Date,
    totalSessions: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 }, // in minutes
    devices: [{
      deviceId: String,
      deviceType: String,
      lastUsed: Date,
      loginCount: { type: Number, default: 0 }
    }]
  },
  
  // Metadata
  metadata: {
    signupSource: {
      type: String,
      enum: ['web', 'mobile', 'api', 'invitation', 'referral'],
      default: 'web'
    },
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ 'subscription.status': 1, 'subscription.endDate': 1 });
UserSchema.index({ 'status.online': 1, 'status.lastSeen': -1 });
UserSchema.index({ 'isEmailVerified': 1, createdAt: -1 });
UserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL for inactive users

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for subscription status
UserSchema.virtual('isSubscriptionActive').get(function() {
  if (!this.subscription) return false;
  return this.subscription.status === 'active' || 
         (this.subscription.status === 'trial' && this.subscription.trialEndDate > new Date());
});

// Virtual for usage percentage
UserSchema.virtual('usagePercentage').get(function() {
  if (!this.plan) return 0;
  const plan = this.plan;
  const totalUsage = this.usage.leads + this.usage.aiReplies + this.usage.followUps;
  const totalLimit = (plan.limits?.leads || 0) + (plan.limits?.aiReplies || 0) + (plan.limits?.followUps || 0);
  return totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;
});

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Add to password history
    this.security.passwordHistory.push({
      password: this.password,
      changedAt: new Date()
    });
    
    // Keep only last 5 passwords
    if (this.security.passwordHistory.length > 5) {
      this.security.passwordHistory = this.security.passwordHistory.slice(-5);
    }
    
    this.security.lastPasswordChange = new Date();
  }
  
  // Generate API key if not exists
  if (!this.apiKey) {
    this.apiKey = this.generateApiKey();
  }
  
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateApiKey = function() {
  return require('crypto').randomBytes(32).toString('hex');
};

UserSchema.methods.updateLastSeen = function() {
  this.status.lastSeen = new Date();
  return this.save();
};

UserSchema.methods.setOnlineStatus = function(isOnline, sessionInfo = {}) {
  this.status.online = isOnline;
  this.status.lastSeen = new Date();
  
  if (sessionInfo.sessionId) {
    this.status.currentSession = {
      sessionId: sessionInfo.sessionId,
      deviceInfo: sessionInfo.deviceInfo || {},
      loginTime: sessionInfo.loginTime || new Date()
    };
  }
  
  return this.save();
};

UserSchema.methods.incrementUsage = function(type, amount = 1) {
  if (this.usage[type] !== undefined) {
    this.usage[type] += amount;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findOnlineUsers = function() {
  return this.find({
    'status.online': true,
    'status.lastSeen': { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
  });
};

UserSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'leads',
        localField: '_id',
        foreignField: 'userId',
        as: 'leads'
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: '_id',
        foreignField: 'user',
        as: 'messages'
      }
    },
    {
      $project: {
        totalLeads: { $size: '$leads' },
        totalMessages: { $size: '$messages' },
        usage: 1,
        subscription: 1,
        createdAt: 1
      }
    }
  ]);
};

module.exports = mongoose.model('User', UserSchema); 