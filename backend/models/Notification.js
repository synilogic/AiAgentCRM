const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // User who receives the notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  
  // Notification message
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'system'],
    default: 'info',
    index: true
  },
  
  // Notification category
  category: {
    type: String,
    enum: [
      'leads',
      'messages',
      'payments',
      'subscription',
      'system',
      'security',
      'marketing',
      'support',
      'updates',
      'maintenance'
    ],
    default: 'system',
    index: true
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // System notification flag
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Created by (for system notifications)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Action data
  action: {
    type: {
      type: String,
      enum: ['link', 'button', 'modal', 'none'],
      default: 'none'
    },
    label: String,
    url: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Related resources
  relatedResources: [{
    type: {
      type: String,
      enum: ['user', 'lead', 'message', 'payment', 'plan', 'subscription']
    },
    id: mongoose.Schema.Types.ObjectId,
    action: String
  }],
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Delivery channels
  delivery: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },
  
  // Delivery status
  deliveryStatus: {
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      readAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    whatsapp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    }
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Tags for categorization
  tags: [String],
  
  // Timestamps
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

// Indexes for better query performance
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ isSystem: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
NotificationSchema.index({ tags: 1 });

// Virtual for formatted date
NotificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for notification summary
NotificationSchema.virtual('summary').get(function() {
  return `${this.type}: ${this.title}`;
});

// Virtual for isExpired
NotificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
NotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { page = 1, limit = 20, type, category, isRead, isSystem } = options;
  
  const filter = { user: userId };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (isRead !== undefined) filter.isRead = isRead;
  if (isSystem !== undefined) filter.isSystem = isSystem;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('user', 'name email')
    .populate('createdBy', 'name email');
};

NotificationSchema.statics.getSystemNotifications = function(options = {}) {
  const { page = 1, limit = 20, type, category } = options;
  
  const filter = { isSystem: true };
  if (type) filter.type = type;
  if (category) filter.category = category;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'name email');
};

NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

NotificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { 
      isRead: true,
      'deliveryStatus.inApp.readAt': new Date()
    },
    { new: true }
  );
};

NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true,
      'deliveryStatus.inApp.readAt': new Date()
    }
  );
};

NotificationSchema.statics.createSystemNotification = function(data) {
  return this.create({
    user: data.user,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    category: data.category || 'system',
    priority: data.priority || 'medium',
    isSystem: true,
    createdBy: data.createdBy,
    action: data.action,
    relatedResources: data.relatedResources || [],
    metadata: data.metadata || {},
    delivery: data.delivery || { inApp: true },
    expiresAt: data.expiresAt,
    tags: data.tags || []
  });
};

NotificationSchema.statics.createUserNotification = function(data) {
  return this.create({
    user: data.user,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    category: data.category || 'system',
    priority: data.priority || 'medium',
    isSystem: false,
    action: data.action,
    relatedResources: data.relatedResources || [],
    metadata: data.metadata || {},
    delivery: data.delivery || { inApp: true },
    expiresAt: data.expiresAt,
    tags: data.tags || []
  });
};

NotificationSchema.statics.getNotificationStats = function(options = {}) {
  const { startDate, endDate, userId } = options;
  
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  if (userId) match.user = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category',
          isRead: '$isRead'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          type: '$_id.type',
          category: '$_id.category'
        },
        totalCount: { $sum: '$count' },
        readCount: { $sum: { $cond: ['$_id.isRead', '$count', 0] } },
        unreadCount: { $sum: { $cond: ['$_id.isRead', 0, '$count'] } }
      }
    }
  ]);
};

NotificationSchema.statics.cleanupExpiredNotifications = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.deliveryStatus.inApp.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.deliveryStatus.inApp.readAt = undefined;
  return this.save();
};

NotificationSchema.methods.updateDeliveryStatus = function(channel, status) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = {
      ...this.deliveryStatus[channel],
      ...status
    };
  }
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema); 