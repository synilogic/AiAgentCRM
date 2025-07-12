const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get user's chats
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const chats = await Chat.getUserChats(req.user._id, parseInt(limit), offset);
    
    // Get unread counts for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.getUnreadCount(chat._id.toString(), req.user._id);
        return {
          ...chat,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      chats: chatsWithUnreadCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: chats.length
      }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
});

// Create new chat
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, type = 'direct', participants, metadata } = req.body;

    if (!participants || participants.length === 0) {
      return res.status(400).json({ success: false, error: 'Participants are required' });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([...participants, req.user._id.toString()])];

    const chat = new Chat({
      name,
      type,
      participants: allParticipants.map(userId => ({
        user: userId,
        role: userId === req.user._id.toString() ? 'admin' : 'member'
      })),
      createdBy: req.user._id,
      metadata
    });

    await chat.save();
    await chat.populate('participants.user', 'email role');

    // Log activity
    const activity = new Activity({
      userId: req.user._id,
      type: 'chat_created',
      description: `Created ${type} chat: ${name}`,
      metadata: { chatId: chat._id }
    });
    await activity.save();

    // Emit real-time event
    if (global.emitToUser) {
      allParticipants.forEach(userId => {
        global.emitToUser(userId, 'chat_created', {
          chat: chat.toObject(),
          createdBy: req.user._id
        });
      });
    }

    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
});

// Get chat messages
router.get('/:chatId/messages', authenticateUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const messages = await Message.getChatMessages(chatId, parseInt(limit), offset);
    
    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== req.user._id.toString() && 
      msg.status !== 'read'
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { status: 'read' } }
      );

      // Reset unread count for this chat
      await chat.resetUnreadCount(req.user._id);

      // Emit read receipt
      if (global.emitToChat) {
        global.emitToChat(chatId, 'messages_read', {
          messageIds,
          readBy: req.user._id,
          timestamp: new Date()
        });
      }
    }

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/:chatId/messages', authenticateUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', replyTo, metadata } = req.body;

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const message = new Message({
      chatId,
      sender: req.user._id,
      content,
      type,
      replyTo,
      metadata
    });

    await message.save();
    await message.populate('sender', 'email role');
    await message.populate('replyTo');

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    // Increment unread count for other participants
    chat.participants.forEach(participant => {
      if (participant.user.toString() !== req.user._id.toString()) {
        chat.incrementUnreadCount(participant.user);
      }
    });

    // Log activity
    const activity = new Activity({
      userId: req.user._id,
      type: 'message_sent',
      description: `Sent message in chat: ${chat.name}`,
      metadata: { chatId, messageId: message._id }
    });
    await activity.save();

    // Emit real-time event
    if (global.emitToChat) {
      global.emitToChat(chatId, 'new_message', {
        id: message._id,
        chatId,
        sender: {
          id: req.user._id,
          name: req.user.email,
          role: req.user.role
        },
        content,
        type,
        replyTo: message.replyTo,
        metadata,
        timestamp: message.createdAt,
        status: 'sent'
      });
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Update message
router.put('/:chatId/messages/:messageId', authenticateUser, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Can only edit your own messages' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    // Emit real-time event
    if (global.emitToChat) {
      global.emitToChat(chatId, 'message_updated', {
        messageId,
        content,
        editedAt: message.editedAt
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:chatId/messages/:messageId', authenticateUser, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Check if user is the sender or admin
    const chat = await Chat.findById(chatId);
    const userRole = chat.getParticipantRole(req.user._id);
    
    if (message.sender.toString() !== req.user._id.toString() && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete this message' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();

    // Emit real-time event
    if (global.emitToChat) {
      global.emitToChat(chatId, 'message_deleted', {
        messageId,
        deletedBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// Add reaction to message
router.post('/:chatId/messages/:messageId/reactions', authenticateUser, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await message.addReaction(req.user._id, emoji);
    await message.populate('reactions.user', 'email role');

    // Emit real-time event
    if (global.emitToChat) {
      global.emitToChat(chatId, 'message_reaction', {
        messageId,
        reaction: {
          user: req.user._id,
          emoji,
          timestamp: new Date()
        }
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/:chatId/messages/:messageId/reactions', authenticateUser, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await message.removeReaction(req.user._id);
    await message.populate('reactions.user', 'email role');

    // Emit real-time event
    if (global.emitToChat) {
      global.emitToChat(chatId, 'message_reaction_removed', {
        messageId,
        userId: req.user._id
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ success: false, error: 'Failed to remove reaction' });
  }
});

// Get chat info
router.get('/:chatId', authenticateUser, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'email role')
      .populate('lastMessage')
      .populate('createdBy', 'email role');

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat' });
  }
});

// Update chat settings
router.put('/:chatId/settings', authenticateUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { settings } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update settings
    Object.assign(chat.settings, settings);
    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update chat settings' });
  }
});

module.exports = router; 
