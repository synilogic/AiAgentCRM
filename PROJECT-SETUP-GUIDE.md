# Ai Agentic CRM - Project Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ (recommended: v18 LTS)
- MongoDB 6.0+
- Redis 7+
- Git

### Automated Setup (Windows)
```bash
# Run the automated setup script
setup-project.bat
```

### Manual Setup

#### 1. Environment Configuration
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit the .env file with your actual values
# Important: Set strong passwords and API keys
```

#### 2. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend User App
cd ../frontend-user && npm install

# Frontend Admin App  
cd ../frontend-admin && npm install

# Original Frontend (legacy)
cd ../frontend && npm install
```

#### 3. Database Setup
```bash
# Start MongoDB and Redis
# MongoDB: mongodb://localhost:27017
# Redis: redis://localhost:6379

# Initialize database (optional)
cd backend && npm run init-db
```

#### 4. Build Applications
```bash
# Build all frontend apps
cd frontend-user && npm run build
cd ../frontend-admin && npm run build
cd ../frontend && npm run build
```

## 🏃‍♂️ Running the Applications

### Development Mode
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - User Frontend (http://localhost:3000)
cd frontend-user && npm start

# Terminal 3 - Admin Frontend (http://localhost:3001)
cd frontend-admin && npm start
```

### Production Mode
```bash
# Using Docker Compose
docker-compose up -d

# Or start all applications
start-all-apps.bat
```

## 📁 Project Structure

```
AIAgentCRM/
├── backend/                 # Node.js Express API server
├── frontend-user/          # React app for end users (port 3000)
├── frontend-admin/         # React app for administrators (port 3001)
├── frontend/               # Legacy React app (port 3000)
├── shared/                 # Shared types and utilities
├── nginx/                  # Nginx configuration
├── monitoring/             # Prometheus/Grafana configs
└── scripts/                # Deployment scripts
```

## 🔧 Configuration

### Environment Variables (backend/.env)

#### Required Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/AIAgentCRM
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=sk-your-openai-api-key
```

#### Optional Variables
```env
REDIS_URL=redis://localhost:6379
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RAZORPAY_KEY_ID=rzp_test_your-key
WHATSAPP_API_KEY=your-whatsapp-api-key
```

### Frontend Configuration

#### frontend-user/.env
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your-key
```

#### frontend-admin/.env
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ADMIN_SECRET=your-admin-secret
```

## 🔐 Security Fixes Applied

### Fixed Issues
✅ React-scripts version updated from 0.0.0 to 5.0.1
✅ Express-brute vulnerabilities removed (replaced with rate-limiter-flexible)
✅ WhatsApp-web.js updated to v1.31.0
✅ Docker paths corrected for proper builds
✅ API endpoint configurations standardized

### Remaining Security Notes
⚠️ Some vulnerabilities in whatsapp-web.js dependencies (puppeteer, tar-fs) are from nested dependencies
⚠️ Frontend apps have deprecated babel plugins warnings (not critical)

## 📱 Application URLs

- **User Frontend**: http://localhost:3000
- **Admin Frontend**: http://localhost:3001  
- **API Server**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs (when enabled)

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on specific ports
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### React-scripts Not Recognized
```bash
# Install react-scripts globally
npm install -g react-scripts@5.0.1

# Or delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### MongoDB Connection Failed
```bash
# Check MongoDB service
net start MongoDB

# Or start manually
mongod --dbpath="C:\data\db"
```

#### Build Errors in Frontend
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Performance Issues
```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096

# Or in package.json scripts
"start": "node --max-old-space-size=4096 server.js"
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# API tests
cd backend && npm run test:api

# Coverage report
cd backend && npm run test:coverage
```

## 📊 Monitoring

Access monitoring dashboards:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin123)

## 🔄 Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature
   # Make changes
   npm test
   git commit -m "Add: your feature"
   git push origin feature/your-feature
   ```

2. **Code Quality**
   ```bash
   # Lint backend code
   cd backend && npm run lint

   # Fix linting issues
   cd backend && npm run lint:fix
   ```

3. **Database Migrations**
   ```bash
   cd backend && npm run migrate
   ```

## 🚢 Deployment

### Using Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review logs in `backend/logs/`
3. Check GitHub issues
4. Contact the development team

## 📝 Changelog

### Latest Fixes (Current)
- Fixed react-scripts version issues
- Updated security vulnerabilities
- Corrected Docker configuration
- Enhanced error handling
- Added comprehensive setup scripts

---

**Note**: Always use strong passwords and API keys in production. Never commit `.env` files to version control. 