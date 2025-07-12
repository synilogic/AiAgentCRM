const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  secret: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked'],
    default: 'active',
    index: true
  },
  permissions: {
    type: [String],
    default: ['read'],
    validate: {
      validator: function(permissions) {
        const validPermissions = ['read', 'write', 'delete', 'admin'];
        return permissions.every(perm => validPermissions.includes(perm));
      },
      message: 'Invalid permission specified'
    }
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 100,
      min: 1,
      max: 10000
    },
    requestsPerHour: {
      type: Number,
      default: 1000,
      min: 1,
      max: 100000
    },
    requestsPerDay: {
      type: Number,
      default: 10000,
      min: 1,
      max: 1000000
    }
  },
  allowedIPs: {
    type: [String],
    default: [],
    validate: {
      validator: function(ips) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^(\*|\d{1,3}\.){3}(\*|\d{1,3})$/;
        return ips.every(ip => ipRegex.test(ip) || ip === '*');
      },
      message: 'Invalid IP address format'
    }
  },
  allowedDomains: {
    type: [String],
    default: [],
    validate: {
      validator: function(domains) {
        const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        return domains.every(domain => domainRegex.test(domain) || domain === '*');
      },
      message: 'Invalid domain format'
    }
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  monthlyRequests: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
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

// Indexes for performance
apiKeySchema.index({ userId: 1, status: 1 });
apiKeySchema.index({ key: 1, status: 1 });
apiKeySchema.index({ expiresAt: 1 }, { sparse: true });
apiKeySchema.index({ createdAt: -1 });

// Virtual for checking if key is expired
apiKeySchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if key is active and not expired
apiKeySchema.virtual('isValid').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Pre-save middleware to update timestamps
apiKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to generate unique API key
apiKeySchema.statics.generateKey = function() {
  const crypto = require('crypto');
  return 'ak_' + crypto.randomBytes(32).toString('hex');
};

// Static method to generate secret
apiKeySchema.statics.generateSecret = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
};

// Method to check if IP is allowed
apiKeySchema.methods.isIPAllowed = function(ip) {
  if (this.allowedIPs.length === 0 || this.allowedIPs.includes('*')) {
    return true;
  }
  
  return this.allowedIPs.some(allowedIP => {
    if (allowedIP === ip) return true;
    if (allowedIP.includes('*')) {
      const pattern = allowedIP.replace(/\*/g, '\\d+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(ip);
    }
    if (allowedIP.includes('/')) {
      // CIDR notation support would go here
      return false;
    }
    return false;
  });
};

// Method to check if domain is allowed
apiKeySchema.methods.isDomainAllowed = function(domain) {
  if (this.allowedDomains.length === 0 || this.allowedDomains.includes('*')) {
    return true;
  }
  
  return this.allowedDomains.some(allowedDomain => {
    if (allowedDomain === domain) return true;
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      return domain.endsWith(baseDomain);
    }
    return false;
  });
};

// Method to increment usage counters
apiKeySchema.methods.incrementUsage = async function() {
  this.totalRequests += 1;
  this.monthlyRequests += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema); 