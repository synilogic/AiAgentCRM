const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 200,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20,
    index: true
  },
  
  // Company Information
  company: {
    type: String,
    trim: true,
    maxlength: 200
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  industry: {
    type: String,
    trim: true,
    maxlength: 100
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
  },
  
  // Lead Classification
  source: {
    type: String,
    enum: ['facebook', 'google_sheets', 'manual', 'whatsapp', 'website', 'referral', 'cold_call', 'email_campaign', 'social_media', 'other'],
    default: 'manual',
    index: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'unqualified'],
    default: 'new',
    index: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Lead Scoring Details
  scoreFactors: {
    engagement: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    authority: { type: Number, default: 0 },
    need: { type: Number, default: 0 },
    timeline: { type: Number, default: 0 },
    fit: { type: Number, default: 0 }
  },
  
  // Contact Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  
  // Lead Details
  notes: {
    type: String,
    maxlength: 2000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Timeline & Follow-up
  lastContact: {
    type: Date,
    default: Date.now,
    index: true
  },
  nextFollowUp: {
    type: Date,
    index: true
  },
  followUpHistory: [{
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['email', 'phone', 'whatsapp', 'meeting', 'other'] },
    notes: String,
    outcome: { type: String, enum: ['positive', 'neutral', 'negative', 'no_response'] },
    nextAction: String,
    scheduledDate: Date
  }],
  
  // Deal Information
  dealValue: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AED']
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expectedCloseDate: {
    type: Date
  },
  
  // Integration Data
  facebookData: {
    adId: String,
    campaignId: String,
    cost: Number,
    clickCount: Number,
    impressionCount: Number
  },
  googleSheetsData: {
    spreadsheetId: String,
    rowId: String,
    lastSync: Date
  },
  whatsappData: {
    conversationId: String,
    lastMessageDate: Date,
    messageCount: { type: Number, default: 0 },
    responseTime: Number // average response time in minutes
  },
  
  // AI & Automation
  aiAnalysis: {
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    intent: { type: String, enum: ['buying', 'researching', 'complaining', 'inquiry'] },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
    confidence: { type: Number, min: 0, max: 100 },
    lastAnalyzed: Date,
    keywords: [String],
    suggestedActions: [String]
  },
  
  // Automation & Workflow
  automationStatus: {
    type: String,
    enum: ['none', 'active', 'paused', 'completed'],
    default: 'none'
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  lastAutomationRun: Date,
  automationHistory: [{
    workflowId: mongoose.Schema.Types.ObjectId,
    action: String,
    executedAt: Date,
    status: { type: String, enum: ['success', 'failed', 'pending'] },
    result: String
  }],
  
  // Analytics & Tracking
  analytics: {
    views: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
    lastActivity: Date,
    timeSpent: { type: Number, default: 0 }, // in minutes
    touchpoints: [{
      type: { type: String, enum: ['email', 'call', 'meeting', 'whatsapp', 'website'] },
      date: Date,
      duration: Number,
      outcome: String
    }],
    conversionPath: [{
      step: String,
      date: Date,
      value: Number
    }]
  },
  
  // Custom Fields
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    gclid: String, // Google Click ID
    fbclid: String, // Facebook Click ID
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
LeadSchema.index({ userId: 1, status: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, source: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, score: -1, createdAt: -1 });
LeadSchema.index({ userId: 1, priority: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, nextFollowUp: 1 });
LeadSchema.index({ userId: 1, lastContact: -1 });
LeadSchema.index({ email: 1, userId: 1 });
LeadSchema.index({ phone: 1, userId: 1 });
LeadSchema.index({ 'tags': 1, userId: 1 });
LeadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Virtual for lead age
LeadSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for days since last contact
LeadSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContact) return null;
  return Math.floor((Date.now() - this.lastContact.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for estimated value
LeadSchema.virtual('estimatedValue').get(function() {
  if (!this.dealValue || !this.probability) return 0;
  return (this.dealValue * this.probability) / 100;
});

// Virtual for lead score category
LeadSchema.virtual('scoreCategory').get(function() {
  if (this.score >= 80) return 'hot';
  if (this.score >= 60) return 'warm';
  if (this.score >= 40) return 'lukewarm';
  return 'cold';
});

// Pre-save middleware
LeadSchema.pre('save', function(next) {
  // Update lastContact if followUpHistory is modified
  if (this.isModified('followUpHistory') && this.followUpHistory.length > 0) {
    this.lastContact = this.followUpHistory[this.followUpHistory.length - 1].date;
  }
  
  // Calculate score based on factors
  if (this.isModified('scoreFactors')) {
    const factors = this.scoreFactors;
    this.score = Math.round(
      (factors.engagement + factors.budget + factors.authority + 
       factors.need + factors.timeline + factors.fit) / 6
    );
  }
  
  next();
});

// Instance methods
LeadSchema.methods.addFollowUp = function(method, notes, outcome, nextAction, scheduledDate) {
  this.followUpHistory.push({
    method,
    notes,
    outcome,
    nextAction,
    scheduledDate
  });
  
  if (scheduledDate) {
    this.nextFollowUp = scheduledDate;
  }
  
  return this.save();
};

LeadSchema.methods.updateScore = function(factor, value) {
  if (this.scoreFactors[factor] !== undefined) {
    this.scoreFactors[factor] = Math.max(0, Math.min(100, value));
    return this.save();
  }
  return Promise.resolve(this);
};

LeadSchema.methods.markAsContacted = function(method, notes, outcome) {
  return this.addFollowUp(method, notes, outcome);
};

LeadSchema.methods.scheduleFollowUp = function(date, method, notes) {
  this.nextFollowUp = date;
  return this.addFollowUp(method, notes, 'scheduled');
};

// Static methods
LeadSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 20, status, source, score, priority, search } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  
  if (status) query.status = status;
  if (source) query.source = source;
  if (score) {
    if (score === 'hot') query.score = { $gte: 80 };
    else if (score === 'warm') query.score = { $gte: 60, $lt: 80 };
    else if (score === 'cold') query.score = { $lt: 40 };
  }
  if (priority) query.priority = priority;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email');
};

LeadSchema.statics.getLeadStats = function(userId, period = '30d') {
  const periods = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const days = periods[period] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
        closedWon: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } },
        totalValue: { $sum: '$dealValue' },
        avgScore: { $avg: '$score' },
        bySource: { $push: '$source' },
        byStatus: { $push: '$status' }
      }
    }
  ]);
};

LeadSchema.statics.getFollowUpReminders = function(userId, days = 7) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    userId,
    nextFollowUp: { $lte: targetDate, $gte: new Date() },
    status: { $nin: ['closed_won', 'closed_lost', 'unqualified'] }
  }).sort({ nextFollowUp: 1 });
};

module.exports = mongoose.model('Lead', LeadSchema); 