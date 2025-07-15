# Ai Agentic CRM - Backend

A comprehensive, enterprise-grade AI-powered WhatsApp CRM platform built with Node.js, Express, and MongoDB. This platform provides advanced lead management, AI-powered automation, real-time communication, and extensive third-party integrations.

## 🚀 Features

### Core CRM Features
- **Lead Management**: Advanced lead capture, scoring, and lifecycle management
- **WhatsApp Integration**: Real-time messaging via WhatsApp Business API
- **AI-Powered Automation**: OpenAI GPT-4 integration for intelligent responses
- **Contact Management**: Comprehensive contact database with segmentation
- **Pipeline Management**: Visual sales pipeline with drag-and-drop interface

### Advanced AI Capabilities
- **Smart Lead Scoring**: AI-powered lead qualification and scoring
- **Automated Responses**: Intelligent message generation and routing
- **Sentiment Analysis**: Real-time conversation sentiment tracking
- **Lead Analysis**: AI insights and recommendations
- **Follow-up Automation**: Smart follow-up scheduling and execution

### Real-Time Communication
- **WebSocket Support**: Real-time chat, notifications, and updates
- **Live Chat**: In-app messaging system with read receipts
- **Push Notifications**: Mobile and web push notifications
- **Message Broadcasting**: Bulk messaging and campaign management

### Third-Party Integrations
- **Google Sheets**: Import/export lead data
- **Facebook Ads**: Lead capture from Facebook Lead Ads
- **HubSpot**: Two-way CRM synchronization
- **Salesforce**: Enterprise CRM integration
- **Zapier**: Connect with 5000+ apps
- **Custom Webhooks**: Flexible webhook system

### Mobile Support
- **Mobile App APIs**: Complete mobile app backend support
- **Push Notifications**: Firebase Cloud Messaging integration
- **Device Management**: Multi-device support and synchronization
- **Offline Support**: Data synchronization and conflict resolution
- **Crash Reporting**: Automated crash detection and reporting

### Enterprise Features
- **Multi-tenancy**: Isolated user environments
- **Role-based Access**: Admin and user role management
- **Audit Logging**: Comprehensive activity tracking
- **Data Export**: CSV, Excel, and API data export
- **Backup & Recovery**: Automated backup system with cloud storage

### Payment Integration
- **Razorpay Integration**: Complete payment processing
- **Subscription Management**: Plan management and billing
- **Payment Analytics**: Revenue tracking and reporting
- **Invoice Generation**: Automated invoice creation

### Security & Performance
- **Advanced Security**: Rate limiting, input validation, XSS protection
- **Performance Monitoring**: Real-time performance metrics
- **Caching**: Redis-based caching system
- **Queue Management**: Background job processing
- **Load Balancing**: Horizontal scaling support

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Queue**: Bull (Redis-based)
- **Real-time**: WebSocket (ws)
- **AI**: OpenAI GPT-4
- **WhatsApp**: whatsapp-web.js
- **Payments**: Razorpay
- **Notifications**: Firebase Admin, Twilio
- **Monitoring**: Prometheus, Winston

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │  Admin Panel    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │    (Express + Security)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Core Services        │
                    │  ┌─────────────────────┐  │
                    │  │   Authentication    │  │
                    │  │   Lead Management   │  │
                    │  │   WhatsApp Service  │  │
                    │  │   AI Service        │  │
                    │  │   Payment Service   │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    Infrastructure Layer   │
                    │  ┌─────────────────────┐  │
                    │  │   WebSocket Server  │  │
                    │  │   Queue Manager     │  │
                    │  │   Cache Manager     │  │
                    │  │   Backup Service    │  │
                    │  │   Analytics Service │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Data Layer           │
                    │  ┌─────────────────────┐  │
                    │  │      MongoDB        │  │
                    │  │       Redis         │  │
                    │  │   File Storage      │  │
                    │  └─────────────────────┘  │
                    └─────────────────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- Redis 6+
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/aiagentcrm/backend.git
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
npm run migrate
npm run seed
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/aiagentcrm

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@aiagentcrm.com

# WhatsApp
WHATSAPP_SESSION_PATH=./sessions

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# AWS S3 (Backup)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-backup-bucket

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
```

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with Mongoose for data modeling. Configure your MongoDB connection in the `.env` file.

### Redis Configuration
Redis is used for caching, session storage, and queue management. Ensure Redis is running and accessible.

### WhatsApp Setup
1. Install WhatsApp Web on your phone
2. Run the application and scan the QR code
3. The session will be saved for future use

### AI Configuration
1. Get an OpenAI API key from https://platform.openai.com
2. Add the key to your `.env` file
3. Configure the model and parameters as needed

## 📚 API Documentation

### Authentication
All API endpoints require authentication except `/auth/login` and `/auth/register`.

```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

### Lead Management
```bash
# Get leads
GET /api/leads?page=1&limit=20&status=active

# Create lead
POST /api/leads
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "website"
}

# Update lead
PUT /api/leads/:id
{
  "status": "qualified",
  "score": 85
}
```

### WhatsApp Integration
```bash
# Initialize WhatsApp
POST /api/whatsapp/init

# Send message
POST /api/whatsapp/send
{
  "to": "+1234567890",
  "message": "Hello from Ai Agentic CRM!"
}

# Get QR code
GET /api/whatsapp/qr
```

### AI Features
```bash
# Generate AI response
POST /api/ai/response
{
  "message": "Customer inquiry about pricing",
  "context": "Previous conversation history"
}

# Analyze lead
POST /api/ai/analyze-lead
{
  "leadId": "lead_id_here"
}
```

### Real-time Chat
```bash
# WebSocket connection
ws://localhost:5000/ws?token=your-jwt-token

# Send message
{
  "type": "chat_message",
  "payload": {
    "roomId": "room_123",
    "message": "Hello!",
    "type": "text"
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── auth.test.js
│   ├── leads.test.js
│   └── whatsapp.test.js
├── integration/
│   ├── api.test.js
│   └── database.test.js
└── fixtures/
    ├── users.json
    └── leads.json
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t aiagentcrm-backend .

# Run container
docker run -p 5000:5000 --env-file .env aiagentcrm-backend
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure load balancer
5. Set up monitoring and logging

## 📊 Monitoring & Analytics

### Performance Monitoring
- Real-time performance metrics
- Database query monitoring
- API response time tracking
- Memory and CPU usage

### Analytics Dashboard
- User activity tracking
- Lead conversion rates
- Revenue analytics
- System health metrics

### Logging
- Structured logging with Winston
- Log rotation and archiving
- Error tracking and alerting
- Audit trail maintenance

## 🔒 Security

### Security Features
- JWT-based authentication
- Rate limiting and throttling
- Input validation and sanitization
- XSS and CSRF protection
- SQL injection prevention
- API key validation
- Request size limiting

### Best Practices
- Regular security updates
- Environment variable protection
- Database connection security
- File upload validation
- Error message sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use ESLint for code linting
- Follow Airbnb JavaScript style guide
- Write meaningful commit messages
- Add JSDoc comments for functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](http://localhost:5000/api-docs)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)

### Community
- [GitHub Issues](https://github.com/aiagentcrm/backend/issues)
- [Discord Community](https://discord.gg/aiagentcrm)
- [Email Support](mailto:support@aiagentcrm.com)

### Roadmap
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Enterprise features

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- WhatsApp for messaging platform
- MongoDB for database
- Redis for caching
- Express.js community
- All contributors and users

---

**Built with ❤️ by the Ai Agentic CRM Team** 