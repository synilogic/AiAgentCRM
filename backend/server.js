const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import services
const realtimeDatabase = require('./services/RealtimeDatabase');
const monitoringService = require('./services/MonitoringService');
const cleanupService = require('./services/CleanupService');
const healthCheckService = require('./services/HealthCheckService');
const { logger } = require('./utils/logger');

// Import middleware
const { auth } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const workflowRoutes = require('./routes/workflows');
const taskRoutes = require('./routes/tasks');
const whatsappRoutes = require('./routes/whatsapp');
const paymentRoutes = require('./routes/payments');
const plansRoutes = require('./routes/plans');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const integrationsRoutes = require('./routes/integrations');
const followupsRoutes = require('./routes/followups');
const knowledgeRoutes = require('./routes/knowledge');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Connect to MongoDB with fallback to mock mode
if (process.env.MONGODB_URI || process.env.NODE_ENV === 'production') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    logger.info('✅ Connected to MongoDB');
    
    // Initialize real-time database service
    return realtimeDatabase.initialize();
  })
  .then(() => {
    logger.info('✅ RealtimeDatabase service initialized');
    
    // Start monitoring service
    return monitoringService.start();
  })
  .then(() => {
    logger.info('✅ Monitoring service started');
    
    // Start cleanup service
    return cleanupService.start();
  })
  .then(() => {
    logger.info('✅ Cleanup service started');
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    logger.warn('⚠️  Running in mock mode without database');
    
    // Initialize real-time database in mock mode
    realtimeDatabase.initializeMock();
  });
} else {
  logger.warn('⚠️  No MongoDB URI provided, running in mock mode');
  realtimeDatabase.initializeMock();
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agent CRM API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      leads: '/api/leads',
      messages: '/api/messages',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      workflows: '/api/workflows',
      tasks: '/api/tasks',
      whatsapp: '/api/whatsapp',
      payments: '/api/payments',
      plans: '/api/plans',
      admin: '/api/admin',
      ai: '/api/ai',
      integrations: '/api/integrations',
      followups: '/api/followups',
      knowledge: '/api/knowledge'
    },
    documentation: {
      health_check: 'GET /health',
      api_base: '/api',
      websocket: 'Socket.IO enabled for real-time features'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    realtime: realtimeDatabase.isInitialized ? 'active' : 'inactive'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/config', require('./routes/config'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('./models/User');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        socket.userId = user._id;
        socket.user = user;
        
        // Add to real-time database connections
        realtimeDatabase.addConnection(user._id, socket);
        
        // Update user online status
        await user.setOnlineStatus(true, {
          sessionId: socket.id,
          deviceInfo: {
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          }
        });
        
        socket.emit('authenticated', { userId: user._id });
        logger.info(`User ${user._id} authenticated via WebSocket`);
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authentication_error', { message: 'Authentication failed' });
      logger.error('WebSocket authentication error:', error);
    }
  });

  // Join chat room
  socket.on('join_room', (roomId) => {
    if (socket.userId) {
      socket.join(roomId);
      socket.emit('joined_room', { roomId });
      logger.debug(`User ${socket.userId} joined room ${roomId}`);
    }
  });

  // Leave chat room
  socket.on('leave_room', (roomId) => {
    if (socket.userId) {
      socket.leave(roomId);
      socket.emit('left_room', { roomId });
      logger.debug(`User ${socket.userId} left room ${roomId}`);
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    if (socket.userId) {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        roomId: data.roomId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    if (socket.userId) {
      socket.to(data.roomId).emit('user_stopped_typing', {
        userId: socket.userId,
        roomId: data.roomId
      });
    }
  });

  // Admin monitoring WebSocket handlers
  socket.on('admin:subscribe_monitoring', async () => {
    if (socket.userId && socket.user && socket.user.role === 'admin') {
      try {
        // Join admin monitoring room
        socket.join('admin_monitoring');
        
        // Send current system status
        const currentMetrics = await monitoringService.getCurrentMetrics();
        const recentAlerts = await monitoringService.getRecentAlerts();
        const systemHealth = await monitoringService.getSystemHealth();
        
        socket.emit('monitoring:initial_data', {
          metrics: currentMetrics,
          alerts: recentAlerts,
          health: systemHealth
        });
        
        logger.debug(`Admin ${socket.userId} subscribed to monitoring updates`);
      } catch (error) {
        logger.error('Error subscribing to monitoring:', error);
        socket.emit('monitoring:error', { message: 'Failed to subscribe to monitoring updates' });
      }
    }
  });

  socket.on('admin:unsubscribe_monitoring', () => {
    if (socket.userId && socket.user && socket.user.role === 'admin') {
      socket.leave('admin_monitoring');
      logger.debug(`Admin ${socket.userId} unsubscribed from monitoring updates`);
    }
  });

  socket.on('admin:request_system_status', async () => {
    if (socket.userId && socket.user && socket.user.role === 'admin') {
      try {
        const systemStatus = await monitoringService.getComprehensiveSystemStatus();
        socket.emit('monitoring:system_status', systemStatus);
      } catch (error) {
        logger.error('Error getting system status:', error);
        socket.emit('monitoring:error', { message: 'Failed to get system status' });
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Remove from real-time database connections
      realtimeDatabase.removeConnection(socket.userId, socket);
      
      // Update user offline status
      const User = require('./models/User');
      const user = await User.findById(socket.userId);
      if (user) {
        await user.setOnlineStatus(false);
      }
    }
  });
});

// Real-time database event handling
realtimeDatabase.on('lead:created', (data) => {
  // Send notification to user
  realtimeDatabase.sendToUser(data.userId, 'lead_created', data);
  
  // Broadcast to admin users
  realtimeDatabase.broadcast('lead_created', data, (userId) => {
    // Only send to admin users
    return socket.user && socket.user.role === 'admin';
  });
});

realtimeDatabase.on('message:created', (data) => {
  // Send to all users in the chat room
  io.to(data.roomId).emit('new_message', data);
});

realtimeDatabase.on('message:read', (data) => {
  // Send read receipt to message sender
  io.to(data.roomId).emit('message_read', data);
});

realtimeDatabase.on('user:status_changed', (data) => {
  // Broadcast user status change
  realtimeDatabase.broadcast('user_status_changed', data);
});

realtimeDatabase.on('notification:created', (data) => {
  // Send notification to specific user
  realtimeDatabase.sendToUser(data.userId, 'new_notification', data);
});

realtimeDatabase.on('workflow:execution_completed', (data) => {
  // Send workflow completion notification
  realtimeDatabase.sendToUser(data.userId, 'workflow_completed', data);
});

// Monitoring service WebSocket integration
monitoringService.on('metric:critical', (metric) => {
  // Send critical metrics to admin users
  realtimeDatabase.broadcast('system_metric_critical', metric, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

monitoringService.on('metric:warning', (metric) => {
  // Send warning metrics to admin users
  realtimeDatabase.broadcast('system_metric_warning', metric, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

monitoringService.on('security:alert', (alert) => {
  // Send security alerts to admin users immediately
  realtimeDatabase.broadcast('security_alert', alert, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

monitoringService.on('backup:completed', (backup) => {
  // Send backup completion notifications to admin users
  realtimeDatabase.broadcast('backup_completed', backup, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

monitoringService.on('backup:failed', (backup) => {
  // Send backup failure notifications to admin users
  realtimeDatabase.broadcast('backup_failed', backup, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

monitoringService.on('system:health_check', (health) => {
  // Send system health updates to admin users
  realtimeDatabase.broadcast('system_health_update', health, (socket) => {
    return socket.user && socket.user.role === 'admin';
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/build/index.html'));
  });
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    // Stop cleanup service
    await cleanupService.stop();
    
    // Stop monitoring service
    await monitoringService.stop();
    
    // Close real-time database service
    await realtimeDatabase.cleanup();
    
    // Close Socket.IO
    io.close();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    logger.info('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    // Stop cleanup service
    await cleanupService.stop();
    
    // Stop monitoring service
    await monitoringService.stop();
    
    // Close real-time database service
    await realtimeDatabase.cleanup();
    
    // Close Socket.IO
    io.close();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    logger.info('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`💾 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM'}`);
});

module.exports = { app, server, io }; 