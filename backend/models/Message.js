const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'system'],
    default: 'text',
    index: true
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // for audio/video
    thumbnail: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    contact: {
      name: String,
      phone: String,
      email: String
    },
    systemAction: String, // for system messages
    customFields: mongoose.Schema.Types.Mixed
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  readAt: {
    type: Date,
    default: null
  },
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'whatsapp', 'email', 'api', 'system'],
    default: 'web',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
MessageSchema.index({ roomId: 1, timestamp: -1 });
MessageSchema.index({ user: 1, timestamp: -1 });
MessageSchema.index({ type: 1, timestamp: -1 });
MessageSchema.index({ status: 1, timestamp: -1 });
MessageSchema.index({ priority: 1, timestamp: -1 });
MessageSchema.index({ 'readBy.user': 1, timestamp: -1 });
MessageSchema.index({ 'reactions.user': 1, timestamp: -1 });
MessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Virtual for message age
MessageSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Virtual for read count
MessageSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Virtual for reaction count
MessageSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for is read by specific user
MessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Virtual for has reaction from specific user
MessageSchema.methods.hasReactionFrom = function(userId) {
  return this.reactions.some(reaction => reaction.user.toString() === userId.toString());
};

// Pre-save middleware
MessageSchema.pre('save', function(next) {
  // Set readAt if message is read
  if (this.readBy.length > 0 && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Set deliveredAt if message is delivered
  if (this.deliveredTo.length > 0 && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  next();
});

// Instance methods
MessageSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.readAt = new Date();
  }
  return this.save();
};

MessageSchema.methods.markAsDelivered = function(userId) {
  const alreadyDelivered = this.deliveredTo.some(
    delivery => delivery.user.toString() === userId.toString()
  );
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
    this.deliveredAt = new Date();
  }
  return this.save();
};

MessageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    timestamp: new Date()
  });
  
  return this.save();
};

MessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  return this.save();
};

MessageSchema.methods.edit = function(newContent) {
  if (!this.edited.isEdited) {
    this.edited.originalContent = this.content;
  }
  
  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  
  return this.save();
};

MessageSchema.methods.delete = function(userId) {
  this.deleted.isDeleted = true;
  this.deleted.deletedAt = new Date();
  this.deleted.deletedBy = userId;
  
  return this.save();
};

// Static methods
MessageSchema.statics.findByRoom = function(roomId, options = {}) {
  const { page = 1, limit = 50, before, after, type } = options;
  const skip = (page - 1) * limit;
  
  const query = { roomId };
  
  if (before) {
    query.timestamp = { ...query.timestamp, $lt: new Date(before) };
  }
  
  if (after) {
    query.timestamp = { ...query.timestamp, $gt: new Date(after) };
  }
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email avatar')
    .populate('readBy.user', 'name email')
    .populate('reactions.user', 'name email')
    .populate('replyTo')
    .populate('forwardedFrom');
};

MessageSchema.statics.findUnreadByUser = function(userId, roomId = null) {
  const query = {
    'readBy.user': { $ne: userId }
  };
  
  if (roomId) {
    query.roomId = roomId;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('user', 'name email avatar');
};

MessageSchema.statics.getRoomStats = function(roomId) {
  return this.aggregate([
    {
      $match: { roomId }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalRead: { $sum: { $cond: [{ $gt: [{ $size: '$readBy' }, 0] }, 1, 0] } },
        totalReactions: { $sum: { $size: '$reactions' } },
        byType: { $push: '$type' },
        byUser: { $push: '$user' }
      }
    },
    {
      $project: {
        _id: 0,
        totalMessages: 1,
        totalRead: 1,
        totalReactions: 1,
        readRate: {
          $cond: [
            { $eq: ['$totalMessages', 0] },
            0,
            { $divide: ['$totalRead', '$totalMessages'] }
          ]
        },
        byType: {
          $reduce: {
            input: '$byType',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $literal: {
                    $concat: [
                      '$$this',
                      ': ',
                      { $toString: { $sum: { $cond: [{ $eq: ['$$this', '$$this'] }, 1, 0] } } }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

MessageSchema.statics.getUserMessageStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        count: { $sum: 1 },
        types: { $push: '$type' },
        reactions: { $sum: { $size: '$reactions' } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

MessageSchema.statics.searchMessages = function(query, options = {}) {
  const { userId, roomId, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const searchQuery = {
    content: { $regex: query, $options: 'i' },
    deleted: { $ne: { isDeleted: true } }
  };
  
  if (userId) {
    searchQuery.user = userId;
  }
  
  if (roomId) {
    searchQuery.roomId = roomId;
  }
  
  return this.find(searchQuery)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email avatar')
    .populate('replyTo');
};

MessageSchema.statics.cleanupOldMessages = function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    type: { $ne: 'system' } // Keep system messages
  });
};

MessageSchema.statics.getMessageAnalytics = function(roomId, period = '30d') {
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
        roomId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        messageCount: { $sum: 1 },
        readCount: { $sum: { $size: '$readBy' } },
        reactionCount: { $sum: { $size: '$reactions' } },
        byType: { $push: '$type' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Export model
module.exports = mongoose.model('Message', MessageSchema); 