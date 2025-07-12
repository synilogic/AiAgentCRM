const axios = require('axios');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

class WhatsAppService {
  constructor() {
    this.clients = new Map(); // Store WhatsApp clients for each user
    this.sessions = new Map(); // Store session data
  }

  // Initialize WhatsApp client for a user
  async initializeClient(userId, phoneNumber) {
    try {
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // Store client reference
      this.clients.set(userId, client);

      // Set up event handlers
      client.on('qr', async (qr) => {
        // Generate QR code for scanning
        const qrCode = await qrcode.toDataURL(qr);
        this.sessions.set(userId, {
          status: 'qr_ready',
          qrCode,
          phoneNumber
        });
      });

      client.on('ready', () => {
        this.sessions.set(userId, {
          status: 'connected',
          phoneNumber: client.info.wid.user
        });
        console.log(`WhatsApp client ready for user ${userId}`);
      });

      client.on('disconnected', () => {
        this.sessions.set(userId, {
          status: 'disconnected',
          phoneNumber
        });
        console.log(`WhatsApp client disconnected for user ${userId}`);
      });

      client.on('message', async (message) => {
        await this.handleIncomingMessage(userId, message);
      });

      // Initialize the client
      await client.initialize();

      return { success: true, message: 'WhatsApp client initialized' };
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
      throw new Error('Failed to initialize WhatsApp client');
    }
  }

  // Get session status for a user
  getSessionStatus(userId) {
    return this.sessions.get(userId) || { status: 'not_initialized' };
  }

  // Send message to a contact
  async sendMessage(userId, to, message, type = 'text') {
    try {
      const client = this.clients.get(userId);
      if (!client) {
        throw new Error('WhatsApp client not initialized');
      }

      const session = this.sessions.get(userId);
      if (session.status !== 'connected') {
        throw new Error('WhatsApp not connected');
      }

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);
      
      let response;
      switch (type) {
        case 'text':
          response = await client.sendMessage(`${formattedNumber}@c.us`, message);
          break;
        case 'image':
          response = await client.sendMessage(`${formattedNumber}@c.us`, {
            image: message,
            caption: message.caption || ''
          });
          break;
        case 'document':
          response = await client.sendMessage(`${formattedNumber}@c.us`, {
            document: message.url,
            filename: message.filename,
            mimetype: message.mimetype
          });
          break;
        default:
          throw new Error('Unsupported message type');
      }

      return {
        success: true,
        messageId: response.id._serialized,
        timestamp: response.timestamp
      };
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Send bulk messages
  async sendBulkMessages(userId, contacts, message, delay = 1000) {
    const results = [];
    
    for (const contact of contacts) {
      try {
        const result = await this.sendMessage(userId, contact.phone, message);
        results.push({
          contact,
          success: true,
          messageId: result.messageId
        });
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        results.push({
          contact,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Handle incoming messages
  async handleIncomingMessage(userId, message) {
    try {
      // Extract message data
      const messageData = {
        from: message.from,
        to: message.to,
        body: message.body,
        type: message.type,
        timestamp: message.timestamp,
        userId: userId
      };

      // Store message in database (you'll need to implement this)
      // await Message.create(messageData);

      // Auto-reply logic (if enabled)
      await this.handleAutoReply(userId, messageData);

      console.log(`Incoming message from ${message.from}: ${message.body}`);
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Handle auto-reply
  async handleAutoReply(userId, messageData) {
    try {
      // Get user's auto-reply settings
      // const user = await User.findById(userId);
      // if (!user.autoReplyEnabled) return;

      // Generate AI response using OpenAI
      const aiResponse = await this.generateAIResponse(messageData.body);
      
      if (aiResponse) {
        await this.sendMessage(userId, messageData.from, aiResponse);
      }
    } catch (error) {
      console.error('Auto-reply error:', error);
    }
  }

  // Generate AI response using OpenAI
  async generateAIResponse(message) {
    try {
      // This will be implemented in the OpenAI service
      // For now, return a simple response
      return `Thank you for your message: "${message}". We'll get back to you soon!`;
    } catch (error) {
      console.error('AI response generation error:', error);
      return null;
    }
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  // Disconnect client
  async disconnectClient(userId) {
    try {
      const client = this.clients.get(userId);
      if (client) {
        await client.destroy();
        this.clients.delete(userId);
        this.sessions.delete(userId);
      }
      return { success: true, message: 'WhatsApp client disconnected' };
    } catch (error) {
      console.error('Disconnect error:', error);
      throw new Error('Failed to disconnect WhatsApp client');
    }
  }

  // Get client info
  async getClientInfo(userId) {
    try {
      const client = this.clients.get(userId);
      if (!client) {
        throw new Error('WhatsApp client not found');
      }

      const session = this.sessions.get(userId);
      return {
        status: session.status,
        phoneNumber: session.phoneNumber,
        qrCode: session.qrCode
      };
    } catch (error) {
      console.error('Get client info error:', error);
      throw new Error('Failed to get client info');
    }
  }

  // Check if client is connected
  isConnected(userId) {
    const session = this.sessions.get(userId);
    return session && session.status === 'connected';
  }

  // Get all active sessions
  getActiveSessions() {
    const activeSessions = [];
    for (const [userId, session] of this.sessions) {
      if (session.status === 'connected') {
        activeSessions.push({
          userId,
          phoneNumber: session.phoneNumber
        });
      }
    }
    return activeSessions;
  }
}

module.exports = new WhatsAppService(); 