const mongoose = require('mongoose');
const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

class RealtimeDatabase extends EventEmitter {
  constructor() {
    super();
    this.changeStreams = new Map();
    this.connections = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Ensure we're connected to MongoDB
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected');
      }

      // Try to set up change streams for different collections
      try {
        await this.setupChangeStreams();
        logger.info('Change streams initialized successfully');
      } catch (error) {
        // If change streams fail (e.g., standalone MongoDB), continue without them
        logger.warn('Change streams not available, continuing without real-time updates:', error.message);
      }
      
      this.isInitialized = true;
      logger.info('RealtimeDatabase service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RealtimeDatabase:', error);
      // Fall back to mock mode
      this.initializeMock();
    }
  }

  initializeMock() {
    try {
      // Initialize in mock mode without MongoDB
      this.isInitialized = true;
      logger.info('RealtimeDatabase service initialized in mock mode');
      
      // Emit mock events periodically for testing
      setInterval(() => {
        this.emit('mock:heartbeat', {
          timestamp: new Date(),
          connections: this.connections.size
        });
      }, 30000);
      
    } catch (error) {
      logger.error('Failed to initialize RealtimeDatabase in mock mode:', error);
    }
  }

  async setupChangeStreams() {
    const collections = [
      'users',
      'leads', 
      'messages',
      'activities',
      'notifications',
      'workflows',
      'workflowexecutions'
    ];

    for (const collectionName of collections) {
      await this.createChangeStream(collectionName);
    }
  }

  async createChangeStream(collectionName) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      
      const changeStream = collection.watch([
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'off'
      });

      changeStream.on('change', (change) => {
        this.handleChange(collectionName, change);
      });

      changeStream.on('error', (error) => {
        // If change streams are not supported (standalone MongoDB), fall back to mock mode
        if (error.message.includes('only supported on replica sets') || 
            error.codeName === 'Location40573') {
          logger.warn(`Change streams not supported for ${collectionName}, falling back to mock mode`);
          this.setupMockEvents(collectionName);
          return;
        }
        logger.error(`Change stream error for ${collectionName}:`, error);
        this.recreateChangeStream(collectionName);
      });

      this.changeStreams.set(collectionName, changeStream);
      logger.info(`Change stream created for ${collectionName}`);
    } catch (error) {
      // If change streams are not supported, log warning and setup mock events
      if (error.message.includes('only supported on replica sets') || 
          error.codeName === 'Location40573' ||
          error.code === 40573) {
        logger.warn(`Change streams not supported for ${collectionName}, falling back to mock mode`);
        this.setupMockEvents(collectionName);
        return;
      }
      logger.error(`Failed to create change stream for ${collectionName}:`, error);
    }
  }

  setupMockEvents(collectionName) {
    // For development with single MongoDB instance, create mock events
    const mockInterval = setInterval(() => {
      // Emit periodic mock updates to simulate real-time activity
      if (Math.random() < 0.1) { // 10% chance every interval
        const mockChange = {
          operationType: 'update',
          documentKey: { _id: 'mock_' + Date.now() },
          fullDocument: { 
            _id: 'mock_' + Date.now(),
            updatedAt: new Date(),
            mockData: true 
          }
        };
        
        // Don't spam logs with mock events
        if (Math.random() < 0.01) { // Only log 1% of mock events
          logger.debug(`Mock change event for ${collectionName}`);
        }
        
        this.handleChange(collectionName, mockChange);
      }
    }, 10000); // Every 10 seconds

    // Store the interval for cleanup
    if (!this.mockIntervals) {
      this.mockIntervals = new Map();
    }
    this.mockIntervals.set(collectionName, mockInterval);
    
    logger.info(`Mock events setup for ${collectionName} (development mode)`);
  }

  async recreateChangeStream(collectionName) {
    try {
      const existingStream = this.changeStreams.get(collectionName);
      if (existingStream) {
        await existingStream.close();
      }
      
      await this.createChangeStream(collectionName);
      logger.info(`Change stream recreated for ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to recreate change stream for ${collectionName}:`, error);
    }
  }

  handleChange(collectionName, change) {
    try {
      const eventData = {
        collection: collectionName,
        operationType: change.operationType,
        documentId: change.documentKey._id,
        timestamp: new Date(),
        data: change.fullDocument || change.documentKey
      };

      // Emit collection-specific events
      this.emit(`${collectionName}:${change.operationType}`, eventData);
      this.emit(`${collectionName}:change`, eventData);
      
      // Emit general change event
      this.emit('change', eventData);

      // Handle specific collection logic
      this.handleCollectionSpecificChange(collectionName, change);

      logger.debug(`Change detected in ${collectionName}:`, {
        operationType: change.operationType,
        documentId: change.documentKey._id
      });
    } catch (error) {
      logger.error(`Error handling change for ${collectionName}:`, error);
    }
  }

  handleCollectionSpecificChange(collectionName, change) {
    switch (collectionName) {
      case 'leads':
        this.handleLeadChange(change);
        break;
      case 'messages':
        this.handleMessageChange(change);
        break;
      case 'users':
        this.handleUserChange(change);
        break;
      case 'notifications':
        this.handleNotificationChange(change);
        break;
      case 'workflowexecutions':
        this.handleWorkflowExecutionChange(change);
        break;
    }
  }

  handleLeadChange(change) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'insert' && fullDocument) {
      // New lead created - trigger notifications
      this.emit('lead:created', {
        leadId: fullDocument._id,
        userId: fullDocument.userId,
        lead: fullDocument
      });
    } else if (operationType === 'update' && fullDocument) {
      // Lead updated - check for status changes
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields.status) {
        this.emit('lead:status_changed', {
          leadId: fullDocument._id,
          userId: fullDocument.userId,
          oldStatus: change.updateDescription?.removedFields?.status,
          newStatus: updatedFields.status,
          lead: fullDocument
        });
      }
      
      if (updatedFields.score) {
        this.emit('lead:score_changed', {
          leadId: fullDocument._id,
          userId: fullDocument.userId,
          oldScore: change.updateDescription?.removedFields?.score,
          newScore: updatedFields.score,
          lead: fullDocument
        });
      }
    }
  }

  handleMessageChange(change) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'insert' && fullDocument) {
      // New message - notify users in the chat
      this.emit('message:created', {
        messageId: fullDocument._id,
        roomId: fullDocument.roomId,
        userId: fullDocument.user,
        message: fullDocument
      });
    } else if (operationType === 'update' && fullDocument) {
      // Message updated - check for read receipts, reactions
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields.readBy) {
        this.emit('message:read', {
          messageId: fullDocument._id,
          roomId: fullDocument.roomId,
          readBy: updatedFields.readBy,
          message: fullDocument
        });
      }
      
      if (updatedFields.reactions) {
        this.emit('message:reaction', {
          messageId: fullDocument._id,
          roomId: fullDocument.roomId,
          reactions: updatedFields.reactions,
          message: fullDocument
        });
      }
    }
  }

  handleUserChange(change) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'update' && fullDocument) {
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields['status.online'] !== undefined) {
        this.emit('user:status_changed', {
          userId: fullDocument._id,
          online: updatedFields['status.online'],
          user: fullDocument
        });
      }
      
      if (updatedFields['subscription.status']) {
        this.emit('user:subscription_changed', {
          userId: fullDocument._id,
          oldStatus: change.updateDescription?.removedFields?.['subscription.status'],
          newStatus: updatedFields['subscription.status'],
          user: fullDocument
        });
      }
    }
  }

  handleNotificationChange(change) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'insert' && fullDocument) {
      // New notification - send real-time notification
      this.emit('notification:created', {
        notificationId: fullDocument._id,
        userId: fullDocument.user,
        notification: fullDocument
      });
    } else if (operationType === 'update' && fullDocument) {
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields.read !== undefined) {
        this.emit('notification:read', {
          notificationId: fullDocument._id,
          userId: fullDocument.user,
          read: updatedFields.read,
          notification: fullDocument
        });
      }
    }
  }

  handleWorkflowExecutionChange(change) {
    const { operationType, fullDocument } = change;
    
    if (operationType === 'insert' && fullDocument) {
      this.emit('workflow:execution_started', {
        executionId: fullDocument._id,
        workflowId: fullDocument.workflowId,
        userId: fullDocument.userId,
        execution: fullDocument
      });
    } else if (operationType === 'update' && fullDocument) {
      const updatedFields = change.updateDescription?.updatedFields || {};
      
      if (updatedFields.status) {
        this.emit('workflow:execution_completed', {
          executionId: fullDocument._id,
          workflowId: fullDocument.workflowId,
          userId: fullDocument.userId,
          status: updatedFields.status,
          execution: fullDocument
        });
      }
    }
  }

  // WebSocket connection management
  addConnection(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socket);
    
    logger.debug(`WebSocket connection added for user ${userId}`);
  }

  removeConnection(userId, socket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socket);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    
    logger.debug(`WebSocket connection removed for user ${userId}`);
  }

  // Send real-time updates to specific users
  sendToUser(userId, event, data) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const message = JSON.stringify({ event, data });
      userConnections.forEach(socket => {
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(message);
        }
      });
    }
  }

  // Send real-time updates to all connected users
  broadcast(event, data, filter = null) {
    const message = JSON.stringify({ event, data });
    this.connections.forEach((userConnections, userId) => {
      if (!filter || filter(userId)) {
        userConnections.forEach(socket => {
          if (socket.readyState === 1) { // WebSocket.OPEN
            socket.send(message);
          }
        });
      }
    });
  }

  // Get real-time statistics
  getStats() {
    return {
      totalConnections: Array.from(this.connections.values()).reduce((sum, connections) => sum + connections.size, 0),
      uniqueUsers: this.connections.size,
      changeStreams: this.changeStreams.size,
      isInitialized: this.isInitialized
    };
  }

  // Cleanup
  async cleanup() {
    try {
      // Close all change streams
      for (const [collectionName, changeStream] of this.changeStreams) {
        await changeStream.close();
        logger.info(`Change stream closed for ${collectionName}`);
      }
      this.changeStreams.clear();

      // Clear mock intervals
      if (this.mockIntervals) {
        for (const [collectionName, interval] of this.mockIntervals) {
          clearInterval(interval);
          logger.debug(`Mock interval cleared for ${collectionName}`);
        }
        this.mockIntervals.clear();
      }

      // Close all WebSocket connections
      this.connections.clear();

      this.isInitialized = false;
      logger.info('RealtimeDatabase service cleaned up');
    } catch (error) {
      logger.error('Error during RealtimeDatabase cleanup:', error);
    }
  }
}

// Create singleton instance
const realtimeDatabase = new RealtimeDatabase();

module.exports = realtimeDatabase; 