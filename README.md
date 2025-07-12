# WhatsApp CRM Platform with AI Integration

A comprehensive SaaS platform that combines WhatsApp Business integration with AI-powered lead management, automated follow-ups, and advanced analytics. Built with Node.js, React, and MongoDB.

## 🚀 Features

### Core Features
- **WhatsApp Business Integration** - Real-time messaging with WhatsApp Web API
- **AI-Powered Responses** - GPT-4 integration for intelligent customer interactions
- **Lead Management** - Complete lead lifecycle management with scoring
- **Automated Follow-ups** - Smart follow-up scheduling and execution
- **Payment Integration** - Razorpay subscription management
- **Analytics Dashboard** - Comprehensive reporting and insights

### Advanced Features
- **Lead Scoring** - AI-powered lead quality assessment
- **Sentiment Analysis** - Real-time conversation sentiment tracking
- **Bulk Messaging** - Campaign management with rate limiting
- **Google Sheets Integration** - Import/export lead data
- **Email Integration** - Automated email campaigns
- **Admin Panel** - Complete SaaS management interface

## 🏗️ Architecture

```
├── backend/                 # Node.js/Express API
│   ├── routes/             # API endpoints
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Authentication & validation
│   ├── utils/              # Service integrations
│   └── seeder.js           # Database seeding
├── frontend-user/          # React user dashboard
├── frontend-admin/         # React admin panel
└── docker-compose.yml      # Development environment
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Context API** - State management
- **Axios** - HTTP client

### Integrations
- **WhatsApp Web.js** - WhatsApp Business API
- **OpenAI GPT-4** - AI responses and analysis
- **Razorpay** - Payment processing
- **Google Sheets API** - Data import/export
- **Redis** - Caching and queues

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- Redis (optional, for caching)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/whatsapp-crm-platform.git
cd whatsapp-crm-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
# User Frontend
cd frontend-user
npm install
npm start

# Admin Frontend (in new terminal)
cd frontend-admin
npm install
npm start
```

### 4. Database Setup
```bash
cd backend
npm run seed
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_crm

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# WhatsApp
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_API_SECRET=your-whatsapp-api-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### API Keys Setup

#### 1. WhatsApp Business API
1. Create a Meta Developer account
2. Set up WhatsApp Business API
3. Get your API credentials
4. Configure webhooks

#### 2. OpenAI API
1. Sign up at [OpenAI](https://openai.com)
2. Get your API key
3. Add to environment variables

#### 3. Razorpay
1. Create Razorpay account
2. Get test/live credentials
3. Configure webhooks

## 🚀 Usage

### 1. User Registration
- Visit the user frontend
- Register with email and password
- Verify email address
- Complete profile setup

### 2. WhatsApp Connection
- Go to WhatsApp Connect page
- Scan QR code with your phone
- Start receiving messages

### 3. Lead Management
- Import leads from various sources
- Use AI to analyze and score leads
- Set up automated follow-ups
- Track conversion metrics

### 4. Admin Panel
- Access admin dashboard
- Manage users and subscriptions
- View analytics and reports
- Configure system settings

## 📊 API Documentation

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/me
```

### WhatsApp
```bash
POST /api/whatsapp/initialize
GET /api/whatsapp/status
POST /api/whatsapp/send
POST /api/whatsapp/send-bulk
POST /api/whatsapp/generate-ai-response
```

### Leads
```bash
GET /api/leads
POST /api/leads
GET /api/leads/:id
PUT /api/leads/:id
DELETE /api/leads/:id
POST /api/leads/import
GET /api/leads/export
```

### Analytics
```bash
GET /api/analytics/performance
GET /api/analytics/engagement
GET /api/analytics/followups
GET /api/analytics/export
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - API request throttling
- **Input Validation** - Request sanitization
- **CORS Protection** - Cross-origin security
- **Helmet.js** - Security headers
- **MongoDB Sanitization** - NoSQL injection prevention

## 📈 Analytics & Reporting

### Key Metrics
- Lead conversion rates
- Response times
- Message engagement
- Revenue tracking
- User activity

### Reports
- Daily/weekly/monthly summaries
- Lead quality analysis
- Performance comparisons
- Export capabilities

## 🤖 AI Features

### Smart Responses
- Context-aware replies
- Multi-language support
- Tone customization
- Fallback handling

### Lead Analysis
- Intent detection
- Urgency assessment
- Budget estimation
- Timeline prediction

### Sentiment Analysis
- Real-time mood tracking
- Conversation quality scoring
- Escalation triggers
- Customer satisfaction

## 🔄 Automation

### Follow-up Sequences
- Time-based triggers
- Condition-based actions
- Multi-channel delivery
- Performance tracking

### Lead Nurturing
- Personalized content
- Progressive profiling
- Engagement scoring
- Conversion optimization

## 💳 Payment Integration

### Subscription Plans
- Basic: ₹999/month
- Premium: ₹1999/month
- Enterprise: ₹4999/month

### Features
- Secure payment processing
- Subscription management
- Invoice generation
- Refund handling

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker build -t whatsapp-crm .
docker run -p 5000:5000 whatsapp-crm
```

## 📝 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "auth"

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

### AWS
```bash
# Use AWS Elastic Beanstalk or ECS
# Configure environment variables
# Set up MongoDB Atlas
```

### VPS
```bash
# Install Node.js, MongoDB, Redis
# Set up PM2 for process management
# Configure Nginx reverse proxy
# Set up SSL certificates
```

## 📊 Monitoring

### Health Checks
- API endpoint monitoring
- Database connectivity
- External service status
- Performance metrics

### Logging
- Winston logging
- Error tracking
- Performance monitoring
- Audit trails

## 🔧 Development

### Code Style
```bash
npm run lint
npm run lint:fix
```

### Database Migrations
```bash
npm run migrate
npm run migrate:rollback
```

### API Documentation
```bash
# Swagger UI available at /api-docs
npm run docs:generate
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/whatsapp-crm-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/whatsapp-crm-platform/issues)
- **Email**: support@yourcompany.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core WhatsApp integration
- ✅ AI-powered responses
- ✅ Basic lead management
- ✅ Payment processing

### Phase 2 (Next)
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 Mobile app
- 🔄 API marketplace

### Phase 3 (Future)
- 📋 Enterprise features
- 📋 White-label solution
- 📋 Advanced AI models
- 📋 Global expansion

## 🙏 Acknowledgments

- WhatsApp Business API
- OpenAI GPT-4
- Razorpay
- React community
- Node.js ecosystem

---

**Built with ❤️ for modern businesses** 