const mongoose = require('mongoose');

const PluginSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  version: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  author: {
    type: String,
    trim: true,
    maxlength: 200
  },
  homepage: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  
  // Plugin Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'installing', 'error', 'updating'],
    default: 'inactive',
    index: true
  },
  isEnabled: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // File System
  path: {
    type: String,
    required: true
  },
  main: {
    type: String,
    required: true
  },
  frontend: {
    type: String
  },
  
  // Plugin Configuration
  permissions: [{
    type: String,
    trim: true
  }],
  dependencies: {
    type: Map,
    of: String
  },
  compatibility: {
    coreVersion: String,
    nodeVersion: String
  },
  
  // Routes and Models
  routes: [{
    path: String,
    method: String,
    handler: String,
    middleware: [String],
    permissions: [String]
  }],
  models: [{
    name: String,
    file: String
  }],
  
  // UI Components
  menu: [{
    title: String,
    path: String,
    icon: String,
    permissions: [String],
    order: { type: Number, default: 0 }
  }],
  
  // Settings and Configuration
  settings: {
    configurable: { type: Boolean, default: false },
    schema: mongoose.Schema.Types.Mixed,
    values: mongoose.Schema.Types.Mixed
  },
  
  // Runtime Information
  runtime: {
    loaded: { type: Boolean, default: false },
    loadedAt: Date,
    lastError: String,
    errorCount: { type: Number, default: 0 },
    lastErrorAt: Date
  },
  
  // Installation Info
  installation: {
    installedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    installedAt: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['upload', 'store', 'git', 'npm'],
      default: 'upload'
    },
    sourceUrl: String,
    checksum: String,
    size: Number // in bytes
  },
  
  // Usage Analytics
  analytics: {
    activations: { type: Number, default: 0 },
    lastActivated: Date,
    apiCalls: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  },
  
  // Security
  security: {
    verified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    sandbox: {
      enabled: { type: Boolean, default: true },
      restrictions: [String]
    }
  },
  
  // Metadata
  manifest: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  tags: [String],
  category: {
    type: String,
    enum: ['automation', 'integration', 'analytics', 'ui', 'utility', 'communication', 'other'],
    default: 'other'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual properties
PluginSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.isEnabled;
});

PluginSchema.virtual('fullPath').get(function() {
  return require('path').join(process.cwd(), 'plugins', this.path);
});

// Indexes for performance
PluginSchema.index({ name: 1, version: 1 });
PluginSchema.index({ status: 1, isEnabled: 1 });
PluginSchema.index({ 'installation.installedBy': 1 });
PluginSchema.index({ createdAt: -1 });

// Pre-save middleware
PluginSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active') {
    this.runtime.loadedAt = new Date();
    this.analytics.activations += 1;
    this.analytics.lastActivated = new Date();
  }
  next();
});

// Methods
PluginSchema.methods.activate = function() {
  this.status = 'active';
  this.isEnabled = true;
  this.runtime.loaded = true;
  return this.save();
};

PluginSchema.methods.deactivate = function() {
  this.status = 'inactive';
  this.isEnabled = false;
  this.runtime.loaded = false;
  return this.save();
};

PluginSchema.methods.recordError = function(error) {
  this.runtime.lastError = error.message;
  this.runtime.errorCount += 1;
  this.runtime.lastErrorAt = new Date();
  this.status = 'error';
  return this.save();
};

PluginSchema.methods.updateSettings = function(settings) {
  this.settings.values = { ...this.settings.values, ...settings };
  return this.save();
};

PluginSchema.methods.incrementApiCalls = function() {
  this.analytics.apiCalls += 1;
  return this.save();
};

// Static methods
PluginSchema.statics.findActive = function() {
  return this.find({ status: 'active', isEnabled: true });
};

PluginSchema.statics.findByPermission = function(permission) {
  return this.find({ 
    permissions: permission,
    status: 'active',
    isEnabled: true 
  });
};

PluginSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalApiCalls: { $sum: '$analytics.apiCalls' },
        avgResponseTime: { $avg: '$analytics.averageResponseTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('Plugin', PluginSchema); 