const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');

class WhatsAppService {
  constructor() {
    this.clients = new Map(); // Store active WhatsApp clients
    this.qrCodes = new Map(); // Store QR codes for each user
  }

  // Initialize WhatsApp client for a user
  async initializeClient(userId) {
    try {
      console.log(`Initializing WhatsApp client for user: ${userId}`);
      
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // Store client reference
      this.clients.set(userId, client);

      // Handle QR code generation
      client.on('qr', async (qr) => {
        console.log(`QR Code generated for user: ${userId}`);
        try {
          const qrCodeDataURL = await qrcode.toDataURL(qr);
          this.qrCodes.set(userId, {
            qr: qrCodeDataURL,
            timestamp: new Date(),
            status: 'pending'
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      });

      // Handle ready event
      client.on('ready', async () => {
        console.log(`WhatsApp client ready for user: ${userId}`);
        this.qrCodes.set(userId, {
          qr: null,
          timestamp: new Date(),
          status: 'connected'
        });

        // Update user's WhatsApp status in database
        await this.updateUserWhatsAppStatus(userId, true);
      });

      // Handle authentication failure
      client.on('auth_failure', async (msg) => {
        console.log(`WhatsApp auth failure for user: ${userId}:`, msg);
        this.qrCodes.set(userId, {
          qr: null,
          timestamp: new Date(),
          status: 'auth_failed'
        });
        await this.updateUserWhatsAppStatus(userId, false);
      });

      // Handle disconnection
      client.on('disconnected', async (reason) => {
        console.log(`WhatsApp disconnected for user: ${userId}:`, reason);
        this.qrCodes.set(userId, {
          qr: null,
          timestamp: new Date(),
          status: 'disconnected'
        });
        await this.updateUserWhatsAppStatus(userId, false);
      });

      // Handle incoming messages
      client.on('message', async (message) => {
        await this.handleIncomingMessage(userId, message);
      });

      // Initialize the client
      await client.initialize();

      return { success: true, message: 'WhatsApp client initialized' };
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      return { success: false, error: error.message };
    }
  }

  // Get QR code for a user
  getQRCode(userId) {
    const qrData = this.qrCodes.get(userId);
    if (!qrData) {
      return { success: false, error: 'No QR code available' };
    }
    return { success: true, ...qrData };
  }

  // Check connection status
  getConnectionStatus(userId) {
    const client = this.clients.get(userId);
    const qrData = this.qrCodes.get(userId);
    
    if (!client) {
      return { success: false, status: 'not_initialized' };
    }

    return {
      success: true,
      status: qrData?.status || 'unknown',
      isConnected: client.isConnected || false
    };
  }

  // Send message to a contact
  async sendMessage(userId, phoneNumber, message) {
    try {
      const client = this.clients.get(userId);
      if (!client || !client.isConnected) {
        return { success: false, error: 'WhatsApp not connected' };
      }

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Send message
      const result = await client.sendMessage(formattedNumber, message);
      
      // Save message to database
      await this.saveMessage(userId, phoneNumber, message, 'outgoing');
      
      return { success: true, messageId: result.id._serialized };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle incoming messages
  async handleIncomingMessage(userId, message) {
    try {
      console.log(`Incoming message for user ${userId}:`, message.body);
      
      // Save message to database
      await this.saveMessage(userId, message.from, message.body, 'incoming');
      
      // Check if this is a new lead
      await this.checkAndCreateLead(userId, message);
      
      // Auto-reply if configured
      await this.sendAutoReply(userId, message);
      
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Save message to database
  async saveMessage(userId, phoneNumber, content, type) {
    try {
      const Message = require('../models/Message');
      const message = new Message({
        user: userId,
        roomId: `whatsapp_${phoneNumber}`,
        content,
        type: 'whatsapp',
        metadata: {
          phoneNumber,
          messageType: type,
          platform: 'whatsapp'
        },
        timestamp: new Date()
      });
      
      await message.save();
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  // Check and create lead from incoming message
  async checkAndCreateLead(userId, message) {
    try {
      const Lead = require('../models/Lead');
      
      // Check if lead already exists
      const existingLead = await Lead.findOne({
        userId,
        'contact.whatsapp': message.from
      });

      if (!existingLead) {
        // Create new lead
        const lead = new Lead({
          userId,
          name: message.from.split('@')[0], // Use phone number as name initially
          contact: {
            whatsapp: message.from
          },
          source: 'whatsapp',
          status: 'new',
          metadata: {
            firstMessage: message.body,
            firstMessageTime: message.timestamp
          }
        });
        
        await lead.save();
        console.log(`New lead created from WhatsApp: ${lead._id}`);
      }
    } catch (error) {
      console.error('Error creating lead from WhatsApp:', error);
    }
  }

  // Send auto-reply
  async sendAutoReply(userId, message) {
    try {
      // Get user's auto-reply settings
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (user?.preferences?.whatsappAutoReply?.enabled) {
        const autoReply = user.preferences.whatsappAutoReply.message;
        if (autoReply) {
          await this.sendMessage(userId, message.from, autoReply);
        }
      }
    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  }

  // Update user's WhatsApp status in database
  async updateUserWhatsAppStatus(userId, isConnected) {
    try {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        'integrations.whatsapp.connected': isConnected,
        'integrations.whatsapp.lastSync': new Date()
      });
    } catch (error) {
      console.error('Error updating WhatsApp status:', error);
    }
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Add @c.us suffix for WhatsApp
    return cleaned + '@c.us';
  }

  // Disconnect WhatsApp client
  async disconnectClient(userId) {
    try {
      const client = this.clients.get(userId);
      if (client) {
        await client.destroy();
        this.clients.delete(userId);
        this.qrCodes.delete(userId);
        await this.updateUserWhatsAppStatus(userId, false);
        return { success: true, message: 'WhatsApp disconnected' };
      }
      return { success: false, error: 'No active connection' };
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all WhatsApp leads for a user
  async getWhatsAppLeads(userId) {
    try {
      const Lead = require('../models/Lead');
      const leads = await Lead.find({
        userId,
        source: 'whatsapp'
      }).sort({ createdAt: -1 });
      
      return { success: true, leads };
    } catch (error) {
      console.error('Error getting WhatsApp leads:', error);
      return { success: false, error: error.message };
    }
  }

  // Get WhatsApp messages for a lead
  async getLeadMessages(userId, phoneNumber) {
    try {
      const Message = require('../models/Message');
      const messages = await Message.find({
        user: userId,
        roomId: `whatsapp_${phoneNumber}`
      }).sort({ timestamp: 1 });
      
      return { success: true, messages };
    } catch (error) {
      console.error('Error getting lead messages:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService(); 