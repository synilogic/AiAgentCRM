const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { setupTestDB, clearTestDB, createTestUser, generateAuthToken, mockWhatsAppClient } = require('./testUtils');

// Mock WhatsApp client
jest.mock('../utils/whatsapp', () => ({
  getWhatsAppClient: jest.fn(),
  initializeWhatsApp: jest.fn(),
  sendWhatsAppMessage: jest.fn(),
  getChatHistory: jest.fn(),
  extractContacts: jest.fn()
}));

const whatsappUtils = require('../utils/whatsapp');

describe('WhatsApp Integration Endpoints', () => {
  let token;
  let user;
  let mockClient;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await clearTestDB();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    user = await createTestUser();
    token = await generateAuthToken(user);
    mockClient = mockWhatsAppClient();
    whatsappUtils.getWhatsAppClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/initialize', () => {
    it('should initialize WhatsApp connection', async () => {
      whatsappUtils.initializeWhatsApp.mockResolvedValue({
        success: true,
        qrCode: 'data:image/png;base64,test-qr-code',
        status: 'qr_ready'
      });

      const response = await request(app)
        .post('/api/whatsapp/initialize')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.status).toBe('qr_ready');
      expect(whatsappUtils.initializeWhatsApp).toHaveBeenCalledWith(user._id);
    });

    it('should handle already connected status', async () => {
      whatsappUtils.initializeWhatsApp.mockResolvedValue({
        success: true,
        status: 'connected'
      });

      const response = await request(app)
        .post('/api/whatsapp/initialize')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('connected');
      expect(response.body.qrCode).toBeUndefined();
    });

    it('should handle initialization failure', async () => {
      whatsappUtils.initializeWhatsApp.mockRejectedValue(new Error('Initialization failed'));

      const response = await request(app)
        .post('/api/whatsapp/initialize')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to initialize WhatsApp');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/whatsapp/initialize')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/status', () => {
    it('should get WhatsApp connection status', async () => {
      mockClient.isConnected = true;

      const response = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('connected');
      expect(response.body.isConnected).toBe(true);
    });

    it('should return disconnected status', async () => {
      mockClient.isConnected = false;

      const response = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('disconnected');
      expect(response.body.isConnected).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/whatsapp/status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/whatsapp/send', () => {
    it('should send WhatsApp message', async () => {
      const messageData = {
        to: '+919876543210',
        message: 'Hello, this is a test message',
        type: 'text'
      };

      whatsappUtils.sendWhatsAppMessage.mockResolvedValue({
        success: true,
        messageId: 'msg_test123',
        timestamp: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBe('msg_test123');
      expect(whatsappUtils.sendWhatsAppMessage).toHaveBeenCalledWith(
        user._id,
        messageData.to,
        messageData.message,
        messageData.type
      );
    });

    it('should send message with media', async () => {
      const messageData = {
        to: '+919876543210',
        message: 'Check out this image',
        type: 'image',
        mediaUrl: 'https://example.com/image.jpg'
      };

      whatsappUtils.sendWhatsAppMessage.mockResolvedValue({
        success: true,
        messageId: 'msg_test123'
      });

      const response = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappUtils.sendWhatsAppMessage).toHaveBeenCalledWith(
        user._id,
        messageData.to,
        messageData.message,
        messageData.type,
        messageData.mediaUrl
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate phone number format', async () => {
      const messageData = {
        to: 'invalid-phone',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle sending failure', async () => {
      const messageData = {
        to: '+919876543210',
        message: 'Test message'
      };

      whatsappUtils.sendWhatsAppMessage.mockRejectedValue(new Error('Sending failed'));

      const response = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to send message');
    });
  });

  describe('GET /api/whatsapp/chats', () => {
    it('should get WhatsApp chats', async () => {
      const mockChats = [
        {
          id: 'chat1',
          name: 'John Doe',
          phone: '+919876543210',
          lastMessage: 'Hello there',
          timestamp: new Date().toISOString()
        }
      ];

      mockClient.getChats.mockResolvedValue(mockChats);

      const response = await request(app)
        .get('/api/whatsapp/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.chats).toEqual(mockChats);
    });

    it('should handle empty chats', async () => {
      mockClient.getChats.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/whatsapp/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.chats).toEqual([]);
    });

    it('should handle chat retrieval failure', async () => {
      mockClient.getChats.mockRejectedValue(new Error('Failed to get chats'));

      const response = await request(app)
        .get('/api/whatsapp/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to get chats');
    });
  });

  describe('GET /api/whatsapp/chats/:chatId', () => {
    it('should get chat history', async () => {
      const chatId = 'chat123';
      const mockMessages = [
        {
          id: 'msg1',
          from: '+919876543210',
          to: user.phone,
          content: 'Hello',
          timestamp: new Date().toISOString(),
          type: 'text'
        }
      ];

      whatsappUtils.getChatHistory.mockResolvedValue({
        success: true,
        messages: mockMessages
      });

      const response = await request(app)
        .get(`/api/whatsapp/chats/${chatId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toEqual(mockMessages);
      expect(whatsappUtils.getChatHistory).toHaveBeenCalledWith(user._id, chatId);
    });

    it('should handle chat history failure', async () => {
      const chatId = 'chat123';

      whatsappUtils.getChatHistory.mockRejectedValue(new Error('Failed to get chat history'));

      const response = await request(app)
        .get(`/api/whatsapp/chats/${chatId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to get chat history');
    });
  });

  describe('POST /api/whatsapp/extract-contacts', () => {
    it('should extract contacts from conversation', async () => {
      const conversationData = {
        conversation: [
          { role: 'user', content: 'Hi, my name is John and my number is +919876543210' },
          { role: 'assistant', content: 'Hello John! How can I help you?' }
        ]
      };

      const mockContacts = [
        {
          name: 'John',
          phone: '+919876543210',
          confidence: 0.95
        }
      ];

      whatsappUtils.extractContacts.mockResolvedValue({
        success: true,
        contacts: mockContacts
      });

      const response = await request(app)
        .post('/api/whatsapp/extract-contacts')
        .set('Authorization', `Bearer ${token}`)
        .send(conversationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.contacts).toEqual(mockContacts);
      expect(whatsappUtils.extractContacts).toHaveBeenCalledWith(conversationData.conversation);
    });

    it('should handle contact extraction failure', async () => {
      const conversationData = {
        conversation: []
      };

      whatsappUtils.extractContacts.mockRejectedValue(new Error('Extraction failed'));

      const response = await request(app)
        .post('/api/whatsapp/extract-contacts')
        .set('Authorization', `Bearer ${token}`)
        .send(conversationData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to extract contacts');
    });

    it('should validate conversation format', async () => {
      const response = await request(app)
        .post('/api/whatsapp/extract-contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ conversation: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/whatsapp/webhook', () => {
    it('should handle incoming message webhook', async () => {
      const webhookData = {
        type: 'message',
        data: {
          from: '+919876543210',
          to: user.phone,
          content: 'Hello from webhook',
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook processed');
    });

    it('should handle connection status webhook', async () => {
      const webhookData = {
        type: 'connection_status',
        data: {
          status: 'connected',
          userId: user._id.toString()
        }
      };

      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle unknown webhook type', async () => {
      const webhookData = {
        type: 'unknown_type',
        data: {}
      };

      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unknown webhook type');
    });

    it('should validate webhook data', async () => {
      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/whatsapp/disconnect', () => {
    it('should disconnect WhatsApp', async () => {
      mockClient.disconnect = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/whatsapp/disconnect')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('WhatsApp disconnected');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect failure', async () => {
      mockClient.disconnect = jest.fn().mockRejectedValue(new Error('Disconnect failed'));

      const response = await request(app)
        .post('/api/whatsapp/disconnect')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to disconnect');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/whatsapp/disconnect')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/analytics', () => {
    it('should get WhatsApp analytics', async () => {
      const response = await request(app)
        .get('/api/whatsapp/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.totalMessages).toBeDefined();
      expect(response.body.analytics.byDate).toBeDefined();
      expect(response.body.analytics.responseTime).toBeDefined();
    });

    it('should filter analytics by date range', async () => {
      const response = await request(app)
        .get('/api/whatsapp/analytics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/whatsapp/analytics')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 