const express = require('express');
const { auth } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET /api/whatsapp/status - Get WhatsApp connection status
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getConnectionStatus(req.user._id);
    res.json(status);
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp status'
    });
  }
});

// POST /api/whatsapp/connect - Initialize WhatsApp connection
router.post('/connect', async (req, res) => {
  try {
    const result = await whatsappService.initializeClient(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect WhatsApp'
    });
  }
});

// GET /api/whatsapp/qr - Get QR code for WhatsApp login
router.get('/qr', async (req, res) => {
  try {
    const qrData = whatsappService.getQRCode(req.user._id);
    res.json(qrData);
  } catch (error) {
    console.error('WhatsApp QR error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get QR code'
    });
  }
});

// POST /api/whatsapp/disconnect - Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    const result = await whatsappService.disconnectClient(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect WhatsApp'
    });
  }
});

// POST /api/whatsapp/send - Send WhatsApp message
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await whatsappService.sendMessage(req.user._id, phoneNumber, message);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// GET /api/whatsapp/leads - Get WhatsApp leads
router.get('/leads', async (req, res) => {
  try {
    const result = await whatsappService.getWhatsAppLeads(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp leads'
    });
  }
});

// GET /api/whatsapp/leads/:phoneNumber/messages - Get messages for a specific lead
router.get('/leads/:phoneNumber/messages', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const result = await whatsappService.getLeadMessages(req.user._id, phoneNumber);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp lead messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lead messages'
    });
  }
});

// PUT /api/whatsapp/auto-reply - Update auto-reply settings
router.put('/auto-reply', async (req, res) => {
  try {
    const { enabled, message } = req.body;
    
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      'preferences.whatsappAutoReply.enabled': enabled,
      'preferences.whatsappAutoReply.message': message
    });

    res.json({
      success: true,
      message: 'Auto-reply settings updated'
    });
  } catch (error) {
    console.error('WhatsApp auto-reply error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update auto-reply settings'
    });
  }
});

// GET /api/whatsapp/auto-reply - Get auto-reply settings
router.get('/auto-reply', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      autoReply: user.preferences?.whatsappAutoReply || {
        enabled: false,
        message: ''
      }
    });
  } catch (error) {
    console.error('WhatsApp auto-reply get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-reply settings'
    });
  }
});

module.exports = router; 
