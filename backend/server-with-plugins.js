const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Core middleware
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Plugin System
const PluginManager = require('./plugin-system/PluginManager');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const messageRoutes = require('./routes/messages');
const taskRoutes = require('./routes/tasks');
const workflowRoutes = require('./routes/workflows');
const analyticsRoutes = require('./routes/analytics');
const planRoutes = require('./routes/plans');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const pluginAdminRoutes = require('./routes/plugin-admin');
const healthRoutes = require('./routes/health');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Plugin static files
app.use('/plugins', express.static(path.join(__dirname, '../plugins')));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AiAgentCRM';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize Plugin System
const initializePluginSystem = async () => {
  try {
    const pluginManager = new PluginManager(app);
    
    // Store plugin manager in app for access in routes
    app.set('pluginManager', pluginManager);
    
    // Initialize plugin system
    await pluginManager.initialize();
    
    console.log('🔌 Plugin system initialized successfully');
    
    return pluginManager;
  } catch (error) {
    console.error('❌ Plugin system initialization failed:', error);
    throw error;
  }
};

// Plugin middleware to add plugin context to requests
const pluginMiddleware = (req, res, next) => {
  const pluginManager = app.get('pluginManager');
  if (pluginManager) {
    req.pluginManager = pluginManager;
    req.pluginMenus = pluginManager.getPluginMenus();
  }
  next();
};

// Apply plugin middleware globally
app.use(pluginMiddleware);

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plugin-admin', pluginAdminRoutes);
app.use('/api/health', healthRoutes);

// Plugin API routes will be dynamically registered by PluginManager
// They will be available at /api/plugins/:pluginName/*

// Enhanced configuration endpoint that includes plugin menus
app.get('/api/config/navigation', auth, async (req, res) => {
  try {
    const pluginManager = req.pluginManager;
    const pluginMenus = pluginManager ? pluginManager.getPluginMenus() : [];
    
    // Base navigation items
    const baseNavigation = [
      { title: 'Dashboard', path: '/dashboard', icon: 'home', permissions: [] },
      { title: 'Leads', path: '/leads', icon: 'users', permissions: ['leads:read'] },
      { title: 'Messages', path: '/messages', icon: 'chat', permissions: ['messages:read'] },
      { title: 'Tasks', path: '/tasks', icon: 'check-square', permissions: ['tasks:read'] },
      { title: 'Analytics', path: '/analytics', icon: 'bar-chart', permissions: ['analytics:read'] },
      { title: 'Workflows', path: '/workflows', icon: 'workflow', permissions: ['workflows:read'] },
      { title: 'Settings', path: '/settings', icon: 'settings', permissions: [] }
    ];
    
    // Add plugin menu items
    const navigation = [...baseNavigation, ...pluginMenus];
    
    res.json(navigation);
  } catch (error) {
    console.error('Error fetching navigation:', error);
    res.status(500).json({ error: 'Failed to fetch navigation' });
  }
});

// Plugin marketplace endpoint (future expansion)
app.get('/api/plugin-marketplace', auth, async (req, res) => {
  try {
    // This would integrate with a plugin marketplace
    const marketplace = {
      featured: [],
      categories: ['automation', 'integration', 'analytics', 'ui', 'utility'],
      popular: [],
      recent: []
    };
    
    res.json(marketplace);
  } catch (error) {
    console.error('Error fetching plugin marketplace:', error);
    res.status(500).json({ error: 'Failed to fetch plugin marketplace' });
  }
});

// Plugin development endpoints
app.get('/api/plugin-dev/template', auth, async (req, res) => {
  try {
    const template = {
      manifest: require('../plugins/sample-plugin/plugin.json'),
      backend: await require('fs').promises.readFile(
        path.join(__dirname, '../plugins/sample-plugin/backend/index.js'),
        'utf8'
      ),
      frontend: await require('fs').promises.readFile(
        path.join(__dirname, '../plugins/sample-plugin/frontend/index.js'),
        'utf8'
      )
    };
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching plugin template:', error);
    res.status(500).json({ error: 'Failed to fetch plugin template' });
  }
});

// Global error handler
app.use(errorHandler);

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  const pluginManager = app.get('pluginManager');
  if (pluginManager) {
    // Unload all plugins
    for (const [pluginName] of pluginManager.loadedPlugins) {
      try {
        await pluginManager.unloadPlugin(pluginName);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginName}:`, error);
      }
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  const pluginManager = app.get('pluginManager');
  if (pluginManager) {
    // Unload all plugins
    for (const [pluginName] of pluginManager.loadedPlugins) {
      try {
        await pluginManager.unloadPlugin(pluginName);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginName}:`, error);
      }
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize plugin system
    await initializePluginSystem();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
  🚀 Ai Agentic CRM Server with Plugin System running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔌 Plugin System: Active
📊 API Base URL: http://localhost:${PORT}/api
🔧 Admin Panel: http://localhost:${PORT}/api/plugin-admin
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; 