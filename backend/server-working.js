const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

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

// Real-time connections management
let realtimeConnections = new Map();
let activeUsers = new Map();

// In-memory data store with real-time capabilities
let dataStore = {
  users: [
    {
      _id: 'admin123',
      email: 'admin@aiaagentcrm.com',
      password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'user123',
      email: 'user@example.com',
      password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      name: 'Test User',
      role: 'user',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
      tags: ['hot-lead', 'enterprise'],
      notes: 'Interested in enterprise plan',
      lastContactDate: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 86400000)
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
      tags: ['qualified', 'tech'],
      notes: 'Ready to sign up',
      lastContactDate: new Date(Date.now() - 43200000),
      createdAt: new Date(Date.now() - 259200000),
      updatedAt: new Date(Date.now() - 43200000)
    },
    {
      _id: 'lead3',
      name: 'Bob Johnson',
      email: 'bob@startup.com',
      phone: '+1122334455',
      company: 'Startup Co',
      status: 'contacted',
      score: 78,
      source: 'social',
      userId: 'user123',
      tags: ['startup', 'follow-up'],
      notes: 'Needs demo call',
      lastContactDate: new Date(Date.now() - 21600000),
      createdAt: new Date(Date.now() - 345600000),
      updatedAt: new Date(Date.now() - 21600000)
    }
  ],
  messages: [
    {
      _id: 'msg1',
      content: 'Hello, I\'m interested in your CRM solution',
      sender: 'lead1',
      recipient: 'user123',
      leadId: 'lead1',
      type: 'text',
      platform: 'whatsapp',
      isRead: true,
      readAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 7200000)
    },
    {
      _id: 'msg2',
      content: 'Thank you for your interest! I\'ll send you more details.',
      sender: 'user123',
      recipient: 'lead1',
      leadId: 'lead1',
      type: 'text',
      platform: 'whatsapp',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000)
    }
  ],
  activities: [
    {
      _id: 'act1',
      type: 'lead_created',
      description: 'New lead John Doe was created',
      userId: 'user123',
      leadId: 'lead1',
      metadata: { source: 'website' },
      createdAt: new Date(Date.now() - 172800000)
    },
    {
      _id: 'act2',
      type: 'message_sent',
      description: 'Message sent to Jane Smith',
      userId: 'user123',
      leadId: 'lead2',
      metadata: { platform: 'whatsapp' },
      createdAt: new Date(Date.now() - 43200000)
    }
  ],
  notifications: [
    {
      _id: 'notif1',
      title: 'New Lead Created',
      message: 'A new lead "John Doe" has been added to your CRM',
      type: 'lead',
      userId: 'user123',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      _id: 'notif2',
      title: 'Message Received',
      message: 'You have a new WhatsApp message from Jane Smith',
      type: 'message',
      userId: 'user123',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000)
    }
  ]
};

// Real-time helper functions
function broadcastToClients(event, data) {
  io.emit(event, data);
  logger.debug(`📡 Broadcasted ${event} to ${realtimeConnections.size} clients`);
}

function broadcastToUser(userId, event, data) {
  const userConnections = realtimeConnections.get(userId);
  if (userConnections) {
    userConnections.forEach(socket => {
      socket.emit(event, data);
    });
    logger.debug(`📡 Sent ${event} to user ${userId}`);
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
    database: 'In-Memory Storage with Real-time Features',
    realtime: 'Active',
    timestamp: new Date().toISOString(),
    connections: realtimeConnections.size,
    activeUsers: activeUsers.size,
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      adminAuth: '/api/admin/login',
      users: '/api/users',
      leads: '/api/leads',
      messages: '/api/messages',
      analytics: '/api/analytics/dashboard',
      plans: '/api/plans',
      notifications: '/api/notifications',
      whatsapp: '/api/whatsapp/status'
    },
    features: {
      realTimeUpdates: true,
      webSocketConnections: true,
      liveNotifications: true,
      typingIndicators: true,
      roomBasedMessaging: true
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'memory',
    realtime: 'active',
    connections: realtimeConnections.size,
    activeUsers: activeUsers.size,
    memoryUsage: process.memoryUsage(),
    performance: {
      leads: dataStore.leads.length,
      messages: dataStore.messages.length,
      users: dataStore.users.length
    }
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = dataStore.users.find(u => u.email === email);
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
    user.lastLogin = new Date();
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
    
    logger.info(`✅ User logged in: ${email}`);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = dataStore.users.find(u => u.email === email && u.role === 'admin');
    if (!user || password !== 'admin123') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      'mock-jwt-secret',
      { expiresIn: '7d' }
    );
    
    user.lastLogin = new Date();
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
    
    logger.info(`✅ Admin logged in: ${email}`);
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User routes
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = dataStore.users.find(u => u._id === req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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
    
    const users = dataStore.users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lead routes
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let leads = req.user.role === 'admin' 
      ? dataStore.leads 
      : dataStore.leads.filter(l => l.userId === req.user.userId);
    
    // Add some computed fields
    leads = leads.map(lead => ({
      ...lead,
      daysOld: Math.floor((new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24)),
      lastActivity: Math.floor((new Date() - new Date(lead.updatedAt)) / (1000 * 60 * 60))
    }));
    
    res.json(leads);
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leadData = {
      _id: generateId(),
      ...req.body,
      userId: req.user.userId,
      score: req.body.score || Math.floor(Math.random() * 100),
      tags: req.body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    dataStore.leads.push(leadData);
    
    // Create activity
    const activity = {
      _id: generateId(),
      type: 'lead_created',
      description: `New lead ${leadData.name} was created`,
      userId: req.user.userId,
      leadId: leadData._id,
      metadata: { source: leadData.source },
      createdAt: new Date()
    };
    dataStore.activities.push(activity);
    
    // Real-time notification
    broadcastToClients('lead_created', leadData);
    broadcastToUser(req.user.userId, 'notification', {
      title: 'Lead Created',
      message: `New lead ${leadData.name} has been added`,
      type: 'success'
    });
    
    res.status(201).json(leadData);
    logger.info(`📝 New lead created: ${leadData.name} by ${req.user.email}`);
  } catch (error) {
    logger.error('Create lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const leadIndex = dataStore.leads.findIndex(l => l._id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const oldLead = { ...dataStore.leads[leadIndex] };
    const updateData = { ...req.body, updatedAt: new Date() };
    dataStore.leads[leadIndex] = { ...dataStore.leads[leadIndex], ...updateData };
    
    const updatedLead = dataStore.leads[leadIndex];
    
    // Create activity if status changed
    if (oldLead.status !== updatedLead.status) {
      const activity = {
        _id: generateId(),
        type: 'status_changed',
        description: `Lead status changed from ${oldLead.status} to ${updatedLead.status}`,
        userId: req.user.userId,
        leadId: updatedLead._id,
        metadata: { oldStatus: oldLead.status, newStatus: updatedLead.status },
        createdAt: new Date()
      };
      dataStore.activities.push(activity);
    }
    
    // Real-time notification
    broadcastToClients('lead_updated', updatedLead);
    
    res.json(updatedLead);
    logger.info(`📝 Lead updated: ${id} by ${req.user.email}`);
  } catch (error) {
    logger.error('Update lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const leadIndex = dataStore.leads.findIndex(l => l._id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const deletedLead = dataStore.leads.splice(leadIndex, 1)[0];
    
    // Real-time notification
    broadcastToClients('lead_deleted', { _id: id });
    
    res.json({ message: 'Lead deleted successfully' });
    logger.info(`🗑️ Lead deleted: ${id} by ${req.user.email}`);
  } catch (error) {
    logger.error('Delete lead error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Message routes
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.query;
    
    let messages = leadId 
      ? dataStore.messages.filter(m => m.leadId === leadId)
      : dataStore.messages;
    
    // Add sender info
    messages = messages.map(msg => {
      const sender = dataStore.users.find(u => u._id === msg.sender) || 
                    dataStore.leads.find(l => l._id === msg.sender);
      return {
        ...msg,
        senderInfo: sender ? { name: sender.name, email: sender.email } : null
      };
    });
    
    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messageData = {
      _id: generateId(),
      ...req.body,
      sender: req.user.userId,
      isRead: false,
      createdAt: new Date()
    };
    
    dataStore.messages.push(messageData);
    
    // Real-time notification
    broadcastToClients('message_created', messageData);
    if (messageData.recipient) {
      broadcastToUser(messageData.recipient, 'new_message', messageData);
    }
    
    res.status(201).json(messageData);
    logger.info(`💬 New message created by: ${req.user.email}`);
  } catch (error) {
    logger.error('Create message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analytics routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    let leads = req.user.role === 'admin' 
      ? dataStore.leads 
      : dataStore.leads.filter(l => l.userId === req.user.userId);
    
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const analytics = {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      contactedLeads: leads.filter(l => l.status === 'contacted').length,
      qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
      lostLeads: leads.filter(l => l.status === 'lost').length,
      averageScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length) : 0,
      conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100 * 10) / 10 : 0,
      weeklyGrowth: leads.filter(l => new Date(l.createdAt) >= lastWeek).length,
      monthlyGrowth: leads.filter(l => new Date(l.createdAt) >= lastMonth).length,
      topSources: getTopSources(leads),
      recentActivity: dataStore.activities.slice(-5).reverse().map(activity => ({
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt,
        leadId: activity.leadId
      })),
      pipeline: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length
      }
    };
    
    res.json(analytics);
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

function getTopSources(leads) {
  const sources = {};
  leads.forEach(lead => {
    sources[lead.source] = (sources[lead.source] || 0) + 1;
  });
  return Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

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
    connected: Math.random() > 0.5, // Random connection status for demo
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    phone: '+1234567890',
    lastConnected: new Date(Date.now() - Math.random() * 3600000),
    status: Math.random() > 0.5 ? 'connected' : 'disconnected'
  });
});

app.post('/api/whatsapp/connect', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp connection initiated',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  });
});

// Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userNotifications = dataStore.notifications.filter(n => n.userId === req.user.userId);
    res.json(userNotifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = dataStore.notifications.find(n => n._id === id);
    
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Socket.IO handling
io.on('connection', (socket) => {
  logger.info(`🔗 New WebSocket connection: ${socket.id}`);
  
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, 'mock-jwt-secret');
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;
      
      // Store connection
      if (!realtimeConnections.has(decoded.userId)) {
        realtimeConnections.set(decoded.userId, new Set());
      }
      realtimeConnections.get(decoded.userId).add(socket);
      
      // Track active user
      activeUsers.set(decoded.userId, {
        email: decoded.email,
        role: decoded.role,
        connectedAt: new Date(),
        socketId: socket.id
      });
      
      socket.emit('authenticated', { 
        userId: decoded.userId,
        timestamp: new Date().toISOString(),
        totalConnections: realtimeConnections.size
      });
      
      // Send welcome notification
      socket.emit('notification', {
        title: 'Connected',
        message: 'Real-time features are now active',
        type: 'success'
      });
      
      logger.info(`✅ User ${decoded.email} authenticated via WebSocket`);
    } catch (error) {
      socket.emit('authentication_error', { message: 'Authentication failed' });
      logger.error('❌ WebSocket authentication error:', error);
    }
  });
  
  socket.on('join_room', (roomId) => {
    if (socket.userId) {
      socket.join(roomId);
      socket.emit('joined_room', { roomId });
      logger.debug(`👥 User ${socket.userId} joined room ${roomId}`);
    }
  });
  
  socket.on('leave_room', (roomId) => {
    if (socket.userId) {
      socket.leave(roomId);
      socket.emit('left_room', { roomId });
      logger.debug(`👥 User ${socket.userId} left room ${roomId}`);
    }
  });
  
  socket.on('typing_start', (data) => {
    if (socket.userId) {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        roomId: data.roomId,
        timestamp: new Date()
      });
      logger.debug(`⌨️ User ${socket.userEmail} started typing in ${data.roomId}`);
    }
  });
  
  socket.on('typing_stop', (data) => {
    if (socket.userId) {
      socket.to(data.roomId).emit('user_stopped_typing', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        roomId: data.roomId,
        timestamp: new Date()
      });
      logger.debug(`⌨️ User ${socket.userEmail} stopped typing in ${data.roomId}`);
    }
  });
  
  // Custom real-time events
  socket.on('request_live_data', () => {
    if (socket.userId) {
      const userLeads = dataStore.leads.filter(l => l.userId === socket.userId);
      const userMessages = dataStore.messages.filter(m => m.sender === socket.userId || m.recipient === socket.userId);
      
      socket.emit('live_data_update', {
        leads: userLeads,
        messages: userMessages.slice(-10),
        stats: {
          totalLeads: userLeads.length,
          newLeads: userLeads.filter(l => l.status === 'new').length,
          lastActivity: new Date()
        }
      });
    }
  });
  
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  socket.on('disconnect', () => {
    logger.info(`🔌 WebSocket disconnected: ${socket.id}`);
    
    if (socket.userId) {
      const userConnections = realtimeConnections.get(socket.userId);
      if (userConnections) {
        userConnections.delete(socket);
        if (userConnections.size === 0) {
          realtimeConnections.delete(socket.userId);
          activeUsers.delete(socket.userId);
        }
      }
    }
  });
});

// Real-time data simulation (for demo purposes)
setInterval(() => {
  if (realtimeConnections.size > 0) {
    // Simulate random lead score updates
    const randomLead = dataStore.leads[Math.floor(Math.random() * dataStore.leads.length)];
    if (randomLead) {
      randomLead.score = Math.max(0, Math.min(100, randomLead.score + (Math.random() - 0.5) * 10));
      randomLead.updatedAt = new Date();
      
      broadcastToClients('lead_score_updated', {
        leadId: randomLead._id,
        newScore: Math.round(randomLead.score),
        timestamp: new Date()
      });
    }
  }
}, 30000); // Every 30 seconds

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/auth/login',
      'POST /api/admin/login',
      'GET /api/users/me',
      'GET /api/leads',
      'POST /api/leads',
      'GET /api/messages',
      'POST /api/messages',
      'GET /api/analytics/dashboard',
      'GET /api/plans',
      'GET /api/whatsapp/status',
      'GET /api/notifications'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info(`✅ Health check: http://localhost:${PORT}/health`);
  logger.info(`✅ API documentation: http://localhost:${PORT}/`);
  logger.info(`🎯 Real-time WebSocket features active`);
  logger.info(`📊 Demo data loaded: ${dataStore.leads.length} leads, ${dataStore.messages.length} messages`);
  logger.info(`🔑 Login credentials:`);
  logger.info(`   Admin: admin@aiaagentcrm.com / admin123`);
  logger.info(`   User:  user@example.com / password123`);
});

module.exports = { app, server, io }; 