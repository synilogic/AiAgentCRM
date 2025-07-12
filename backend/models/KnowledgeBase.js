const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  // User Association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Content Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  summary: {
    type: String,
    maxlength: 500
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['general', 'product', 'support', 'sales', 'technical', 'policy', 'faq', 'training', 'other'],
    default: 'general',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Content Type
  type: {
    type: String,
    enum: ['text', 'document', 'faq', 'conversation', 'script', 'template'],
    default: 'text',
    index: true
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['manual', 'upload', 'import', 'web_scrape', 'conversation'],
    default: 'manual'
  },
  originalFileName: String,
  fileType: String,
  fileSize: Number,
  
  // AI Processing
  embedding: {
    type: [Number],
    index: '2dsphere'
  },
  keywords: [String],
  entities: [{
    name: String,
    type: String,
    confidence: Number
  }],
  
  // Usage Statistics
  usage: {
    queries: { type: Number, default: 0 },
    matches: { type: Number, default: 0 },
    lastUsed: Date,
    avgRelevanceScore: { type: Number, default: 0 }
  },
  
  // Training Data
  trainingExamples: [{
    question: String,
    expectedAnswer: String,
    context: String,
    confidence: { type: Number, min: 0, max: 1 }
  }],
  
  // Validation & Quality
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Status & Control
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived', 'processing'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    content: String,
    updatedAt: Date,
    updatedBy: mongoose.Schema.Types.ObjectId
  }],
  
  // Relationships
  relatedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  }],
  parentItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  },
  
  // Language & Localization
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'hi', 'ar', 'zh', 'ja', 'ko']
  },
  
  // Access Control
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  sharedWith: [{
    userId: mongoose.Schema.Types.ObjectId,
    permissions: {
      type: [String],
      enum: ['read', 'edit', 'delete'],
      default: ['read']
    }
  }],
  
  // Metadata
  metadata: {
    author: String,
    department: String,
    lastReviewDate: Date,
    nextReviewDate: Date,
    reviewFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'as_needed'],
      default: 'as_needed'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
KnowledgeBaseSchema.index({ userId: 1, status: 1 });
KnowledgeBaseSchema.index({ userId: 1, category: 1 });
KnowledgeBaseSchema.index({ userId: 1, type: 1 });
KnowledgeBaseSchema.index({ tags: 1 });
KnowledgeBaseSchema.index({ keywords: 1 });
KnowledgeBaseSchema.index({ 'usage.lastUsed': -1 });
KnowledgeBaseSchema.index({ createdAt: -1 });
KnowledgeBaseSchema.index({ updatedAt: -1 });

// Text search index
KnowledgeBaseSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  tags: 'text',
  keywords: 'text'
});

// Virtual for content preview
KnowledgeBaseSchema.virtual('contentPreview').get(function() {
  if (this.content && this.content.length > 100) {
    return this.content.substring(0, 100) + '...';
  }
  return this.content;
});

// Virtual for usage rate
KnowledgeBaseSchema.virtual('usageRate').get(function() {
  if (this.usage.queries === 0) return 0;
  return Math.round((this.usage.matches / this.usage.queries) * 100);
});

// Methods
KnowledgeBaseSchema.methods.incrementUsage = function() {
  this.usage.queries += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

KnowledgeBaseSchema.methods.incrementMatches = function() {
  this.usage.matches += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

KnowledgeBaseSchema.methods.updateQuality = function(score) {
  if (score >= 0 && score <= 100) {
    this.qualityScore = score;
    return this.save();
  }
  throw new Error('Quality score must be between 0 and 100');
};

KnowledgeBaseSchema.methods.addTrainingExample = function(question, answer, context, confidence = 0.8) {
  this.trainingExamples.push({
    question,
    expectedAnswer: answer,
    context,
    confidence
  });
  return this.save();
};

KnowledgeBaseSchema.methods.createVersion = function() {
  this.previousVersions.push({
    version: this.version,
    content: this.content,
    updatedAt: new Date(),
    updatedBy: this.userId
  });
  this.version += 1;
  return this.save();
};

// Static methods
KnowledgeBaseSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.category) query.category = options.category;
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  
  return this.find(query).sort({ updatedAt: -1 });
};

KnowledgeBaseSchema.statics.searchContent = function(userId, searchTerm, options = {}) {
  const query = {
    userId,
    isActive: true,
    $text: { $search: searchTerm }
  };
  
  if (options.category) query.category = options.category;
  if (options.type) query.type = options.type;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
    .limit(options.limit || 20);
};

KnowledgeBaseSchema.statics.getPopularItems = function(userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .sort({ 'usage.queries': -1, 'usage.matches': -1 })
    .limit(limit);
};

KnowledgeBaseSchema.statics.getRecentItems = function(userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema); 