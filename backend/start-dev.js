#!/usr/bin/env node

// Development startup script for AI Agent CRM Backend
console.log('🚀 Starting AI Agent CRM Backend in Development Mode...');

// Set development environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';
process.env.JWT_SECRET = 'super-secret-jwt-key-for-development-only';
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
process.env.DEBUG = 'true';
process.env.LOG_LEVEL = 'info';

// MongoDB Configuration
// Uncomment the line below if you have MongoDB installed locally
// process.env.MONGODB_URI = 'mongodb://localhost:27017/AIAgentCRM';

// For MongoDB Atlas, use:
// process.env.MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/AIAgentCRM';

// Leave MONGODB_URI undefined to use in-memory storage
console.log('📝 Database: ' + (process.env.MONGODB_URI ? 'MongoDB' : 'In-Memory Storage'));

// Feature flags
process.env.FEATURE_REALTIME = 'true';
process.env.FEATURE_WEBSOCKETS = 'true';
process.env.FEATURE_ANALYTICS = 'true';

console.log('⚙️  Environment configured for development');
console.log('🔗 Frontend URLs: http://localhost:3000 (User), http://localhost:3001 (Admin)');
console.log('🔗 Backend API: http://localhost:5000');
console.log('📊 Health Check: http://localhost:5000/health');
console.log('');

// Start the enhanced server
require('./server-enhanced.js'); 