const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'broadcast'],
    default: 'direct'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date,
    isOnline: {
      type: Boolean,
      default: false
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    muted: {
      type: Boolean,
      default: false
    },
    pinned: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    description: String,
    avatar: String,
    tags: [String],
    customFields: Map
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1 });

// Virtual for chat ID
chatSchema.virtual('chatId').get(function() {
  return this._id.toString();
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to update last activity
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment unread count
chatSchema.methods.incrementUnreadCount = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Method to get participant role
chatSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  return participant ? participant.role : null;
};

// Static method to find or create direct chat
chatSchema.statics.findOrCreateDirectChat = async function(user1Id, user2Id) {
  // Look for existing direct chat between these users
  let chat = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    'participants.2': { $exists: false } // Only 2 participants
  }).populate('participants.user', 'email role');

  if (!chat) {
    // Create new direct chat
    chat = new this({
      name: 'Direct Chat',
      type: 'direct',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ],
      createdBy: user1Id
    });
    await chat.save();
    await chat.populate('participants.user', 'email role');
  }

  return chat;
};

// Static method to get user chats
chatSchema.statics.getUserChats = function(userId, limit = 20, offset = 0) {
  return this.find({
    'participants.user': userId,
    'settings.archived': false
  })
  .sort({ lastActivity: -1 })
  .skip(offset)
  .limit(limit)
  .populate('participants.user', 'email role')
  .populate('lastMessage')
  .lean();
};

module.exports = mongoose.model('Chat', chatSchema); 