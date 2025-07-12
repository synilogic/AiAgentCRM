const express = require('express');
const router = express.Router();

// GET /api/whatsapp/connect
router.get('/connect', (req, res) => {
  // TODO: Return WhatsApp QR code for connection
  res.json({ qrCode: 'data:image/png;base64,placeholder' });
});

// POST /api/whatsapp/send
router.post('/send', (req, res) => {
  // TODO: Send WhatsApp message
  res.json({ message: 'Message sent (stub)' });
});

// GET /api/whatsapp/messages
router.get('/messages', (req, res) => {
  // TODO: Return message history
  res.json({ messages: [] });
});

module.exports = router; 