const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

logger.info('Starting simplified server without MongoDB...');

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
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Agent CRM Backend API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      adminAuth: '/api/admin/login',
      users: '/api/users',
      leads: '/api/leads',
      analytics: '/api/analytics/dashboard',
      plans: '/api/plans',
      whatsapp: '/api/whatsapp/status'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'mock',
    realtime: 'active'
  });
});

// Mock data
const mockUsers = [
  {
    _id: 'admin123',
    email: 'admin@aiaagentcrm.com',
    password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // admin123
    name: 'Admin User',
    role: 'admin',
    isActive: true
  },
  {
    _id: 'user123',
    email: 'user@example.com',
    password: '$2a$10$rOvF5eO8MqJ8dLKj8qJ8qOr8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // password123
    name: 'Test User',
    role: 'user',
    isActive: true
  }
];

const mockLeads = [
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
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Simple password check (in real app, use bcrypt)
  if (password !== 'admin123' && password !== 'password123') {
    return res.status(401).json({ message: 'Invalid credentials' });
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
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email && u.role === 'admin');
  if (!user) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  
  if (password !== 'admin123') {
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
});

// User routes
app.get('/api/users/me', (req, res) => {
  res.json({
    _id: 'user123',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user'
  });
});

app.get('/api/users', (req, res) => {
  res.json(mockUsers.map(u => ({
    _id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive
  })));
});

// Lead routes
app.get('/api/leads', (req, res) => {
  res.json(mockLeads);
});

app.post('/api/leads', (req, res) => {
  const newLead = {
    _id: 'lead' + Date.now(),
    ...req.body,
    userId: 'user123',
    createdAt: new Date()
  };
  mockLeads.push(newLead);
  res.status(201).json(newLead);
});

// Analytics routes
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalLeads: mockLeads.length,
    newLeads: mockLeads.filter(l => l.status === 'new').length,
    qualifiedLeads: mockLeads.filter(l => l.status === 'qualified').length,
    convertedLeads: mockLeads.filter(l => l.status === 'converted').length,
    averageScore: mockLeads.reduce((sum, l) => sum + l.score, 0) / mockLeads.length
  });
});

// Plans routes
app.get('/api/plans', (req, res) => {
  res.json([
    {
      _id: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      features: ['Basic CRM', '100 contacts', 'Email support']
    },
    {
      _id: 'pro',
      name: 'Pro',
      price: 999,
      currency: 'INR',
      features: ['Advanced CRM', 'Unlimited contacts', 'WhatsApp integration', 'Priority support']
    },
    {
      _id: 'enterprise',
      name: 'Enterprise',
      price: 2999,
      currency: 'INR',
      features: ['Full CRM suite', 'Custom integrations', 'AI features', '24/7 support']
    }
  ]);
});

// WhatsApp routes
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: false,
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    phone: null
  });
});

// Catch all other routes
app.get('/api/*', (req, res) => {
  res.json({ message: 'Mock API endpoint', path: req.path });
});

// Socket.IO handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);
  
  socket.on('authenticate', (token) => {
    socket.emit('authenticated', { userId: 'user123' });
  });
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info(`✅ Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io }; 