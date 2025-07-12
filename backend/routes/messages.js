const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/messages - Get all messages for the current user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const Message = require('../models/Message');
    const messages = await Message.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .exec();

    res.json({
      success: true,
      messages: messages.reverse(),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// GET /api/messages/:roomId - Get messages for a specific chat room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const Message = require('../models/Message');
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .exec();

    res.json({
      success: true,
      messages: messages.reverse(),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// POST /api/messages - Send a new message
router.post('/', async (req, res) => {
  try {
    const { roomId, content, type = 'text', metadata = {} } = req.body;
    
    if (!roomId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and content are required'
      });
    }

    const Message = require('../models/Message');
    const message = new Message({
      user: req.user._id,
      roomId,
      content,
      type,
      metadata,
      timestamp: new Date()
    });

    await message.save();
    await message.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const Message = require('../models/Message');
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(read => 
      read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});

module.exports = router; 
