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

// Import models
const User = require('./models/User');
const Lead = require('./models/Lead');
const Message = require('./models/Message');
const Activity = require('./models/Activity');
const Notification = require('./models/Notification');
const Plan = require('./models/Plan');
const Workflow = require('./models/Workflow');
const Task = require('./models/Task');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const workflowRoutes = require('./routes/workflows');
const taskRoutes = require('./routes/tasks');

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

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
  app.use(morgan('combined'));
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        socket.userId = user._id;
        socket.user = user;
        
        // Update user online status
        await user.setOnlineStatus(true, {
          sessionId: socket.id,
          deviceInfo: {
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          }
        });
        
        socket.emit('authenticated', { userId: user._id });
        console.log(`User ${user._id} authenticated via WebSocket`);
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authentication_error', { message: 'Authentication failed' });
      console.error('WebSocket authentication error:', error);
    }
  });

  // Join chat room
  socket.on('join_room', (roomId) => {
    if (socket.userId) {
      socket.join(roomId);
      socket.emit('joined_room', { roomId });
      console.log(`User ${socket.userId} joined room ${roomId}`);
    }
  });

  // Leave chat room
  socket.on('leave_room', (roomId) => {
    if (socket.userId) {
      socket.leave(roomId);
      socket.emit('left_room', { roomId });
      console.log(`User ${socket.userId} left room ${roomId}`);
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

  // Disconnect handling
  socket.on('disconnect', async () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Update user offline status
      const user = await User.findById(socket.userId);
      if (user) {
        await user.setOnlineStatus(false);
      }
    }
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
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  try {
    // Close Socket.IO
    io.close();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    console.log('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  try {
    // Close Socket.IO
    io.close();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    console.log('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM'}`);
  console.log('✅ WebSocket server ready');
});

module.exports = { app, server, io }; 