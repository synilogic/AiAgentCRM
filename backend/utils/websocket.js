const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('./logger');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Activity = require('../models/Activity');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.adminConnections = new Map();
    this.isInitialized = false;
  }

  initialize(server) {
    try {
      this.io = socketIo(server, {
        cors: {
          origin: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventHandlers();
      this.isInitialized = true;
      logger.info('WebSocket service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`New socket connection: ${socket.id}`);

      // Authentication middleware
      socket.on('authenticate', async (data) => {
        try {
          await this.authenticateSocket(socket, data.token);
        } catch (error) {
          logger.error('Socket authentication failed:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Admin-specific events
      socket.on('admin:subscribe', async (data) => {
        await this.handleAdminSubscribe(socket, data);
      });

      socket.on('admin:request_dashboard_data', async () => {
        await this.sendAdminDashboardData(socket);
      });

      socket.on('admin:request_conversion_rate', async () => {
        await this.sendConversionRate(socket);
      });

      socket.on('admin:subscribe_collection', async (data) => {
        await this.handleCollectionSubscription(socket, data);
      });

      socket.on('admin:unsubscribe_collection', (data) => {
        this.handleCollectionUnsubscription(socket, data);
      });

      socket.on('admin:broadcast_message', (message) => {
        this.broadcastAdminMessage(socket, message);
      });

      socket.on('admin:request_data', async (data) => {
        await this.handleAdminDataRequest(socket, data);
      });

      // User events
      socket.on('user:subscribe', async (data) => {
        await this.handleUserSubscribe(socket, data);
      });

      socket.on('user:activity', (activity) => {
        this.handleUserActivity(socket, activity);
      });

      // Chat events
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room: ${roomId}`);
      });

      socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room: ${roomId}`);
      });

      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handler
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  async authenticateSocket(socket, token) {
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      socket.userId = user._id.toString();
      socket.user = user;
      socket.isAdmin = user.role === 'admin';

      // Store connection
      if (socket.isAdmin) {
        this.adminConnections.set(socket.id, {
          socket,
          userId: user._id.toString(),
          user,
          connectedAt: new Date()
        });
        socket.join('admin_room');
        logger.info(`Admin ${user.email} connected via WebSocket`);
      } else {
        this.connectedUsers.set(socket.id, {
          socket,
          userId: user._id.toString(),
          user,
          connectedAt: new Date()
        });
        socket.join(`user_${user._id}`);
        logger.info(`User ${user.email} connected via WebSocket`);
      }

      socket.emit('authenticated', { 
        user: { id: user._id, email: user.email, role: user.role } 
      });

      // Send initial data
      if (socket.isAdmin) {
        await this.sendAdminDashboardData(socket);
      }

    } catch (error) {
      logger.error('Authentication error:', error);
      throw error;
    }
  }

  async handleAdminSubscribe(socket, data) {
    if (!socket.isAdmin) {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }

    try {
      socket.join('admin_dashboard');
      
      // Send initial admin data
      await this.sendAdminDashboardData(socket);
      
      logger.info(`Admin subscribed to dashboard: ${socket.userId}`);
    } catch (error) {
      logger.error('Error in admin subscribe:', error);
      socket.emit('error', { message: 'Failed to subscribe to admin data' });
    }
  }

  async sendAdminDashboardData(socket) {
    try {
      const [userCount, leadCount, todayLeads, revenue, activities] = await Promise.all([
        User.countDocuments(),
        Lead.countDocuments(),
        Lead.countDocuments({ 
          createdAt: { 
            $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
          } 
        }),
        this.calculateRevenue(),
        Activity.find().sort({ createdAt: -1 }).limit(20).populate('userId', 'name email')
      ]);

      const activeUsers = this.connectedUsers.size;
      const conversionRate = await this.calculateConversionRate();

      const stats = {
        totalUsers: userCount,
        activeUsers,
        totalLeads: leadCount,
        todayLeads,
        conversionRate,
        revenue
      };

      socket.emit('admin:stats', stats);
      socket.emit('admin:activities', activities);

    } catch (error) {
      logger.error('Error sending admin dashboard data:', error);
    }
  }

  async calculateRevenue() {
    try {
      // This would integrate with your payment system
      // For now, returning a mock value
      return 125000;
    } catch (error) {
      logger.error('Error calculating revenue:', error);
      return 0;
    }
  }

  async calculateConversionRate() {
    try {
      const totalLeads = await Lead.countDocuments();
      const convertedLeads = await Lead.countDocuments({ status: 'converted' });
      
      if (totalLeads === 0) return 0;
      return Math.round((convertedLeads / totalLeads) * 100 * 10) / 10;
    } catch (error) {
      logger.error('Error calculating conversion rate:', error);
      return 0;
    }
  }

  async sendConversionRate(socket) {
    try {
      const conversionRate = await this.calculateConversionRate();
      socket.emit('admin:conversion_rate', { conversionRate });
    } catch (error) {
      logger.error('Error sending conversion rate:', error);
    }
  }

  async handleCollectionSubscription(socket, data) {
    if (!socket.isAdmin) {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }

    const { collection, filters } = data;
    const roomName = `admin_${collection}`;
    
    socket.join(roomName);
    logger.info(`Admin subscribed to collection ${collection}: ${socket.userId}`);
  }

  handleCollectionUnsubscription(socket, data) {
    if (!socket.isAdmin) return;

    const { collection } = data;
    const roomName = `admin_${collection}`;
    
    socket.leave(roomName);
    logger.info(`Admin unsubscribed from collection ${collection}: ${socket.userId}`);
  }

  broadcastAdminMessage(socket, message) {
    if (!socket.isAdmin) return;

    this.io.to('admin_room').emit('admin:broadcast', {
      from: socket.user.email,
      message,
      timestamp: new Date()
    });
  }

  async handleAdminDataRequest(socket, data) {
    if (!socket.isAdmin) {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }

    const { type, params } = data;

    try {
      let result;
      
      switch (type) {
        case 'users':
          result = await User.find(params.filters || {})
            .limit(params.limit || 50)
            .sort({ createdAt: -1 });
          break;
          
        case 'leads':
          result = await Lead.find(params.filters || {})
            .limit(params.limit || 50)
            .sort({ createdAt: -1 });
          break;
          
        case 'activities':
          result = await Activity.find(params.filters || {})
            .limit(params.limit || 50)
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');
          break;
          
        default:
          socket.emit('error', { message: 'Unknown data type requested' });
          return;
      }

      socket.emit('admin:data_response', { type, data: result });
    } catch (error) {
      logger.error(`Error handling admin data request for ${type}:`, error);
      socket.emit('error', { message: 'Failed to fetch requested data' });
    }
  }

  async handleUserSubscribe(socket, data) {
    if (socket.isAdmin) return;

    try {
      const roomName = `user_${socket.userId}`;
      socket.join(roomName);
      
      // Send user-specific data
      const userActivities = await Activity.find({ userId: socket.userId })
        .sort({ createdAt: -1 })
        .limit(10);
      
      socket.emit('user:activities', userActivities);
      
      logger.info(`User subscribed to personal data: ${socket.userId}`);
    } catch (error) {
      logger.error('Error in user subscribe:', error);
    }
  }

  handleUserActivity(socket, activity) {
    // Log user activity
    this.logActivity(socket.userId, activity);
    
    // Notify admins of user activity
    this.io.to('admin_room').emit('admin:user_activity', {
      userId: socket.userId,
      user: socket.user,
      ...activity,
      timestamp: new Date()
    });
  }

  async handleSendMessage(socket, data) {
    try {
      const { roomId, content, recipientId } = data;
      
      const message = new Message({
        senderId: socket.userId,
        recipientId,
        content,
        roomId,
        timestamp: new Date()
      });
      
      await message.save();
      await message.populate(['senderId', 'recipientId'], 'name email');
      
      // Send to room participants
      this.io.to(roomId).emit('new_message', message);
      
      // Notify admins
      this.io.to('admin_room').emit('admin:live_chat', {
        messageId: message._id,
        from: socket.user.email,
        content,
        roomId,
        timestamp: new Date()
      });
      
    } catch (error) {
      logger.error('Error handling send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleDisconnect(socket) {
    logger.info(`Socket disconnected: ${socket.id}`);
    
    if (socket.isAdmin) {
      this.adminConnections.delete(socket.id);
      logger.info(`Admin disconnected: ${socket.userId}`);
    } else {
      this.connectedUsers.delete(socket.id);
      logger.info(`User disconnected: ${socket.userId}`);
    }
  }

  // Public methods for triggering events from other parts of the application
  notifyNewLead(lead) {
    if (!this.io) return;
    
    this.io.to('admin_room').emit('admin:new_lead', {
      leadId: lead._id,
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt
    });
  }

  notifyLeadUpdated(lead, changes) {
    if (!this.io) return;
    
    this.io.to('admin_room').emit('admin:lead_updated', {
      leadId: lead._id,
      changes,
      statusChanged: changes.status !== undefined,
      timestamp: new Date()
    });
  }

  notifyUserRegistered(user) {
    if (!this.io) return;
    
    this.io.to('admin_room').emit('admin:user_registered', {
      userId: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  }

  notifyPaymentReceived(payment) {
    if (!this.io) return;
    
    this.io.to('admin_room').emit('admin:payment_received', {
      paymentId: payment._id,
      amount: payment.amount,
      userEmail: payment.userEmail,
      timestamp: payment.createdAt || new Date()
    });
  }

  sendSystemAlert(alert) {
    if (!this.io) return;
    
    this.io.to('admin_room').emit('admin:system_alert', {
      message: alert.message,
      severity: alert.severity || 'info',
      timestamp: new Date()
    });
  }

  async logActivity(userId, activity) {
    try {
      const activityDoc = new Activity({
        userId,
        type: activity.type || 'general',
        description: activity.description || activity.action,
        metadata: activity.metadata || {},
        timestamp: new Date()
      });
      
      await activityDoc.save();
    } catch (error) {
      logger.error('Error logging activity:', error);
    }
  }

  // Database change stream integration
  handleDatabaseChange(change) {
    if (!this.io) return;
    
    const { collection, operationType, data } = change;
    
    // Notify admins of database changes
    this.io.to('admin_room').emit('database:change', {
      collection,
      operationType,
      data,
      timestamp: new Date()
    });
    
    // Handle specific collections
    switch (collection) {
      case 'leads':
        if (operationType === 'insert') {
          this.notifyNewLead(data);
        } else if (operationType === 'update') {
          this.notifyLeadUpdated(data, change.updateDescription?.updatedFields || {});
        }
        break;
        
      case 'users':
        if (operationType === 'insert') {
          this.notifyUserRegistered(data);
        }
        break;
    }
  }

  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      connectedAdmins: this.adminConnections.size,
      totalConnections: this.connectedUsers.size + this.adminConnections.size,
      isInitialized: this.isInitialized
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService; 