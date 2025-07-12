const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import middleware and utilities
const {
  corsOptions,
  securityHeaders,
  sanitizeInput,
  requestLogger,
  apiLimiter,
  authLimiter,
  whatsappLimiter,
  paymentLimiter,
  uploadLimiter,
  requestTimeout,
  sqlInjectionProtection
} = require('./middleware/security');

const { cacheManager } = require('./utils/cache');
const { queueManager } = require('./utils/queue');
const { notificationManager } = require('./utils/notifications');
const { emailService } = require('./utils/email');
const { analyticsService } = require('./utils/analytics');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const whatsappRoutes = require('./routes/whatsapp');
const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payments');
const planRoutes = require('./routes/plans');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const paymentsRoutes = require('./routes/payments');
const emailRoutes = require('./routes/email');
const knowledgeRoutes = require('./routes/knowledge');
const followupsRoutes = require('./routes/followups');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize cache manager
    await cacheManager.connect();
    logger.info('Cache manager initialized');

    // Initialize queue manager
    await queueManager.initialize();
    queueManager.setupAllProcessors();
    logger.info('Queue manager initialized');

    // Initialize notification manager
    await notificationManager.initialize();
    logger.info('Notification manager initialized');

    // Initialize email service
    await emailService.initialize();
    logger.info('Email service initialized');

    // Initialize analytics service
    await analyticsService.initialize();
    logger.info('Analytics service initialized');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Initialize services on startup
initializeServices();

// Security middleware
app.use(helmet(securityHeaders));
app.use(cors(corsOptions));
app.use(sqlInjectionProtection);
app.use(sanitizeInput);
app.use(requestLogger);
app.use(requestTimeout(30000)); // 30 second timeout

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/whatsapp', whatsappLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api', apiLimiter);

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

// Health check route (no rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/followups', followupsRoutes);

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
  
  // Log error details
  logger.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Track error in analytics
  if (req.user) {
    analyticsService.trackUserActivity(req.user.id, 'error_occurred', {
      error: err.message,
      url: req.url,
      method: req.method
    });
  }

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
    // Close queue manager
    await queueManager.cleanup();
    logger.info('Queue manager cleaned up');

    // Close cache manager
    await cacheManager.disconnect();
    logger.info('Cache manager disconnected');

    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    // Close queue manager
    await queueManager.cleanup();
    logger.info('Queue manager cleaned up');

    // Close cache manager
    await cacheManager.disconnect();
    logger.info('Cache manager disconnected');

    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  logger.info(`JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
  logger.info(`WhatsApp API: ${process.env.WHATSAPP_API_KEY ? 'Configured' : 'Not configured'}`);
  logger.info(`OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
  logger.info(`