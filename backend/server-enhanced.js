const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Enhanced logger
const logger = {
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`, ...args)
};

logger.info('🚀 Starting AI Agent CRM Backend with Real-time Features...');

// Database connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM';
let isDbConnected = false;
let realtimeConnections = new Map();

// MongoDB Connection with fallback
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isDbConnected = true;
    logger.info('✅ Connected to MongoDB');
    
    // Set up change streams for real-time updates
    setupChangeStreams();
    
    return true;
  } catch (error) {
    logger.warn('⚠️  MongoDB connection failed, using in-memory storage:', error.message);
    isDbConnected = false;
    return false;
  }
}

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' },
  score: { type: Number, default: 0 },
  source: { type: String, enum: ['website', 'social', 'referral', 'email', 'phone', 'other'], default: 'other' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String],
  notes: String,
  lastContactDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  type: { type: String, enum: ['text', 'image', 'file', 'audio'], default: 'text' },
  platform: { type: String, enum: ['whatsapp', 'email', 'sms', 'internal'], default: 'internal' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// Models
let User, Lead, Message, Activity;

// Always define models, they'll work with or without MongoDB
User = mongoose.model('User', userSchema);
Lead = mongoose.model('Lead', leadSchema);
Message = mongoose.model('Message', messageSchema);
Activity = mongoose.model('Activity', activitySchema);

// In-memory storage for when MongoDB is not available
let memoryStore = {
  users: [
    {
      _id: 'admin123',
      email: 'admin@aiaagentcrm.com',
      password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'user123',
      email: 'user@example.com',
      password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      name: 'Test User',
      role: 'user',
      isActive: true,
      createdAt: new Date()
    }
  ],
  leads: [
    {
      _id: 'lead1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      status: 'new',
      score: 85,
      source: 'website',
      userId: 'user123',
      createdAt: new Date()
    },
    {
      _id: 'lead2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      company: 'Tech Inc',
      status: 'qualified',
      score: 92,
      source: 'referral',
      userId: 'user123',
      createdAt: new Date()
    }
  ],
  messages: [],
  activities: []
};

// Change Streams Setup
function setupChangeStreams() {
  if (!isDbConnected) return;
  
  try {
    // Monitor Lead changes
    const leadChangeStream = mongoose.connection.collection('leads').watch();
    leadChangeStream.on('change', (change) => {
      logger.debug('Lead change detected:', change.operationType);
      broadcastToClients('lead_updated', {
        type: change.operationType,
        data: change.fullDocument || change.documentKey
      });
    });

    // Monitor Message changes
    const messageChangeStream = mongoose.connection.collection('messages').watch();
    messageChangeStream.on('change', (change) => {
      logger.debug('Message change detected:', change.operationType);
      broadcastToClients('message_updated', {
        type: change.operationType,
        data: change.fullDocument || change.documentKey
      });
    });

    logger.info('✅ Change streams initialized for real-time updates');
  } catch (error) {
    logger.error('Failed to setup change streams:', error);
  }
}

// Real-time helper functions
function broadcastToClients(event, data) {
  io.emit(event, data);
  logger.debug(`Broadcasted ${event} to ${realtimeConnections.size} clients`);
}

function broadcastToUser(userId, event, data) {
  const userConnections = realtimeConnections.get(userId);
  if (userConnections) {
    userConnections.forEach(socket => {
      socket.emit(event, data);
    });
  }
}

// Middleware
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
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('combined'));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, 'mock-jwt-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Agent CRM Backend API',
    version: '1.0.0',
    status: 'Running',
    database: isDbConnected ? 'MongoDB Connected' : 'In-Memory Storage',
    realtime: 'Active',
    timestamp: new Date().toISOString(),
    connections: realtimeConnections.size,
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      adminAuth: '/api/admin/login',
      users: '/api/users',
      leads: '/api/leads',
      messages: '/api/messages',
      analytics: '/api/analytics/dashboard',
      plans: '/api/plans',
      whatsapp: '/api/whatsapp/status'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'memory',
    realtime: 'active',
    connections: realtimeConnections.size
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = memoryStore.users.find(u => u.email === email);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Simple password check for demo
    const isValidPassword = password === 'admin123' || password === 'password123';
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      'mock-jwt-secret',
      { expiresIn: '7d' }
    );
    
    // Update last login
    if (isDbConnected) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
    logger.info(`User logged in: ${email}`);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    if (isDbConnected) {
      user = await User.findOne({ email, role: 'admin' });
    } else {
      user = memoryStore.users.find(u => u.email === email && u.role === 'admin');
    }
    
    if (!user || password !== 'admin123') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      'mock-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
    logger.info(`Admin logged in: ${email}`);
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User routes
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    let user;
    if (isDbConnected) {
      user = await User.findById(req.user.userId).select('-password');
    } else {
      user = memoryStore.users.find(u => u._id === req.user.userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    let users;
    if (isDbConnected) {
      users = await User.find().select('-password');
    } else {
      users = memoryStore.users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
    }
    
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lead routes
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let leads;
    if (isDbConnected) {
      const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
      leads = await Lead.find(query).sort({ createdAt: -1 });
    } else {
      leads = req.user.role === 'admin' 
        ? memoryStore.leads 
        : memoryStore.leads.filter(l => l.userId === req.user.userId);
    }
    
    res.json(leads);
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      userId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let newLead;
    if (isDbConnected) {
      newLead = new Lead(leadData);
      await newLead.save();
    } else {
      newLead = {
        _id: 'lead' + Date.now(),
        ...leadData
      };
      memoryStore.leads.push(newLead);
    }
    
    // Real-time notification
    broadcastToClients('lead_created', newLead);
    
    res.status(201).json(newLead);
    logger.info(`New lead created: ${newLead.name}`);
  } catch (error) {
    logger.error('Create lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    
    let updatedLead;
    if (isDbConnected) {
      updatedLead = await Lead.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const leadIndex = memoryStore.leads.findIndex(l => l._id === id);
      if (leadIndex !== -1) {
        memoryStore.leads[leadIndex] = { ...memoryStore.leads[leadIndex], ...updateData };
        updatedLead = memoryStore.leads[leadIndex];
      }
    }
    
    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Real-time notification
    broadcastToClients('lead_updated', updatedLead);
    
    res.json(updatedLead);
    logger.info(`Lead updated: ${id}`);
  } catch (error) {
    logger.error('Update lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Message routes
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.query;
    
    let messages;
    if (isDbConnected) {
      const query = leadId ? { leadId } : {};
      messages = await Message.find(query).populate('sender', 'name email').sort({ createdAt: -1 });
    } else {
      messages = leadId 
        ? memoryStore.messages.filter(m => m.leadId === leadId)
        : memoryStore.messages;
    }
    
    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      sender: req.user.userId,
      createdAt: new Date()
    };
    
    let newMessage;
    if (isDbConnected) {
      newMessage = new Message(messageData);
      await newMessage.save();
      await newMessage.populate('sender', 'name email');
    } else {
      newMessage = {
        _id: 'msg' + Date.now(),
        ...messageData
      };
      memoryStore.messages.push(newMessage);
    }
    
    // Real-time notification
    broadcastToClients('message_created', newMessage);
    if (messageData.recipient) {
      broadcastToUser(messageData.recipient, 'new_message', newMessage);
    }
    
    res.status(201).json(newMessage);
    logger.info(`New message created by: ${req.user.email}`);
  } catch (error) {
    logger.error('Create message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analytics routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    let leads;
    if (isDbConnected) {
      const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
      leads = await Lead.find(query);
    } else {
      leads = req.user.role === 'admin' 
        ? memoryStore.leads 
        : memoryStore.leads.filter(l => l.userId === req.user.userId);
    }
    
    const analytics = {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      contactedLeads: leads.filter(l => l.status === 'contacted').length,
      qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
      lostLeads: leads.filter(l => l.status === 'lost').length,
      averageScore: leads.length > 0 ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length : 0,
      conversionRate: leads.length > 0 ? (leads.filter(l => l.status === 'converted').length / leads.length) * 100 : 0,
      recentActivity: leads.slice(0, 5).map(lead => ({
        type: 'lead_created',
        description: `New lead: ${lead.name}`,
        timestamp: lead.createdAt
      }))
    };
    
    res.json(analytics);
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Plans routes
app.get('/api/plans', (req, res) => {
  res.json([
    {
      _id: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      features: ['Basic CRM', '100 contacts', 'Email support', 'Basic analytics'],
      limits: { leads: 100, users: 1, storage: '1GB' }
    },
    {
      _id: 'pro',
      name: 'Pro',
      price: 999,
      currency: 'INR',
      features: ['Advanced CRM', 'Unlimited contacts', 'WhatsApp integration', 'Priority support', 'Advanced analytics', 'Team collaboration'],
      limits: { leads: 10000, users: 5, storage: '10GB' }
    },
    {
      _id: 'enterprise',
      name: 'Enterprise',
      price: 2999,
      currency: 'INR',
      features: ['Full CRM suite', 'Custom integrations', 'AI features', '24/7 support', 'Advanced automation', 'Custom reports', 'API access'],
      limits: { leads: -1, users: -1, storage: '100GB' }
    }
  ]);
});

// WhatsApp routes
app.get('/api/whatsapp/status', authenticateToken, (req, res) => {
  res.json({
    connected: false,
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    phone: null,
    lastConnected: null,
    status: 'disconnected'
  });
});

app.post('/api/whatsapp/connect', authenticateToken, (req, res) => {
  // Mock WhatsApp connection
  res.json({
    success: true,
    message: 'WhatsApp connection initiated',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  });
});

// Real-time notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // Mock notifications
    const notifications = [
      {
        _id: 'notif1',
        title: 'New Lead Created',
        message: 'A new lead "John Doe" has been added to your CRM',
        type: 'lead',
        isRead: false,
        createdAt: new Date()
      },
      {
        _id: 'notif2',
        title: 'Message Received',
        message: 'You have a new message from a lead',
        type: 'message',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000)
      }
    ];
    
    res.json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Socket.IO handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);
  
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, 'mock-jwt-secret');
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      
      // Store connection
      if (!realtimeConnections.has(decoded.userId)) {
        realtimeConnections.set(decoded.userId, new Set());
      }
      realtimeConnections.get(decoded.userId).add(socket);
      
      socket.emit('authenticated', { 
        userId: decoded.userId,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`User ${decoded.email} authenticated via WebSocket`);
    } catch (error) {
      socket.emit('authentication_error', { message: 'Authentication failed' });
      logger.error('WebSocket authentication error:', error);
    }
  });
  
  socket.on('join_room', (roomId) => {
    if (socket.userId) {
      socket.join(roomId);
      socket.emit('joined_room', { roomId });
      logger.debug(`User ${socket.userId} joined room ${roomId}`);
    }
  });
  
  socket.on('leave_room', (roomId) => {
    if (socket.userId) {
      socket.leave(roomId);
      socket.emit('left_room', { roomId });
      logger.debug(`User ${socket.userId} left room ${roomId}`);
    }
  });
  
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
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      const userConnections = realtimeConnections.get(socket.userId);
      if (userConnections) {
        userConnections.delete(socket);
        if (userConnections.size === 0) {
          realtimeConnections.delete(socket.userId);
        }
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  const PORT = process.env.PORT || 5000;
  
  // Try to connect to database
  await connectToDatabase();
  
  // Start server
  server.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    logger.info(`✅ Health check: http://localhost:${PORT}/health`);
    logger.info(`✅ WebSocket ready for real-time connections`);
    
    if (isDbConnected) {
      logger.info('🎯 Real-time database features active');
    } else {
      logger.info('📝 Using in-memory storage for demo');
    }
    
    // Initialize some demo data for MongoDB
    if (isDbConnected) {
      initializeDemoData();
    }
  });
}

// Initialize demo data in MongoDB
async function initializeDemoData() {
  if (!isDbConnected) {
    logger.info('📝 Skipping demo data initialization - using in-memory storage');
    return;
  }
  
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@aiaagentcrm.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@aiaagentcrm.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });
      logger.info('✅ Demo admin user created');
    }
    
    // Check if test user exists
    const userExists = await User.findOne({ email: 'user@example.com' });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = await User.create({
        email: 'user@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'user'
      });
      
      // Create demo leads
      await Lead.create([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          status: 'new',
          score: 85,
          source: 'website',
          userId: testUser._id
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          company: 'Tech Inc',
          status: 'qualified',
          score: 92,
          source: 'referral',
          userId: testUser._id
        }
      ]);
      
      logger.info('✅ Demo data initialized');
    }
  } catch (error) {
    logger.error('Failed to initialize demo data:', error);
  }
}

// Start the server
startServer();

module.exports = { app, server, io }; 