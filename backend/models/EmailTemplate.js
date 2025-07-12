const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    required: true
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: String
  }],
  category: {
    type: String,
    enum: ['user_management', 'billing', 'notifications', 'marketing', 'system'],
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Usage Statistics
  usage: {
    totalSent: {
      type: Number,
      default: 0
    },
    lastSent: Date,
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Metadata
  tags: [String],
  notes: String,
  version: {
    type: Number,
    default: 1
  },
  
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
EmailTemplateSchema.index({ name: 1 });
EmailTemplateSchema.index({ category: 1, isActive: 1 });
EmailTemplateSchema.index({ createdAt: -1 });

// Virtual for template preview URL
EmailTemplateSchema.virtual('previewUrl').get(function() {
  return `/api/email/templates/${this._id}/preview`;
});

// Pre-save middleware to update timestamps
EmailTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Instance method to render template with variables
EmailTemplateSchema.methods.render = function(variables = {}) {
  let htmlContent = this.htmlContent;
  let textContent = this.textContent;
  let subject = this.subject;
  
  // Replace template variables
  this.variables.forEach(variable => {
    const value = variables[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    
    htmlContent = htmlContent.replace(regex, value);
    textContent = textContent.replace(regex, value);
    subject = subject.replace(regex, value);
  });
  
  return {
    subject,
    htmlContent,
    textContent
  };
};

// Instance method to validate variables
EmailTemplateSchema.methods.validateVariables = function(variables = {}) {
  const errors = [];
  
  this.variables.forEach(variable => {
    if (variable.required && !variables[variable.name]) {
      errors.push(`Required variable '${variable.name}' is missing`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Static method to get default templates
EmailTemplateSchema.statics.getDefaultTemplates = function() {
  return this.find({ isDefault: true, isActive: true });
};

// Static method to get templates by category
EmailTemplateSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

// Static method to increment usage statistics
EmailTemplateSchema.methods.incrementUsage = async function(success = true) {
  this.usage.totalSent += 1;
  this.usage.lastSent = new Date();
  
  if (success) {
    // Recalculate success rate
    const successCount = Math.floor(this.usage.totalSent * (this.usage.successRate / 100)) + 1;
    this.usage.successRate = (successCount / this.usage.totalSent) * 100;
  }
  
  await this.save();
};

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema); 