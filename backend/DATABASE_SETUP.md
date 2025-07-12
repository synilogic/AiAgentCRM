# Database Setup Guide - AI Agent CRM

This guide will help you set up MongoDB collections and real-time connectivity for the AI Agent CRM system.

## Prerequisites

- MongoDB 4.4+ installed and running
- Node.js 16+ installed
- npm or yarn package manager

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/AIAgentCRM

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp Configuration (Optional)
WHATSAPP_SESSION_PATH=./sessions
```

### 3. Initialize Database

Run the database initialization script to create all collections, indexes, and sample data:

```bash
npm run init-db
```

This will:
- Create all MongoDB collections
- Set up proper indexes for performance
- Create sample subscription plans
- Create admin and demo users
- Create sample leads and workflows

### 4. Start the Server

```bash
npm run dev
```

The server will start with real-time database connectivity enabled.

## Database Collections

### Core Collections

#### 1. Users Collection
- **Purpose**: Store user accounts and authentication data
- **Key Fields**: email, password, role, subscription, preferences
- **Indexes**: email (unique), role, subscription status, online status
- **Real-time Events**: user status changes, subscription updates

#### 2. Leads Collection
- **Purpose**: Store customer leads and prospect information
- **Key Fields**: name, email, phone, company, status, score, source
- **Indexes**: userId + status, userId + source, score, priority
- **Real-time Events**: lead creation, status changes, score updates

#### 3. Messages Collection
- **Purpose**: Store chat messages and communication history
- **Key Fields**: roomId, user, content, type, status, readBy, reactions
- **Indexes**: roomId + timestamp, user + timestamp, type
- **Real-time Events**: new messages, read receipts, reactions

#### 4. Activities Collection
- **Purpose**: Track user activities and system events
- **Key Fields**: user, action, data, timestamp, status
- **Indexes**: user + action + timestamp, action + timestamp
- **Real-time Events**: activity logging, audit trails

#### 5. Notifications Collection
- **Purpose**: Store system notifications and alerts
- **Key Fields**: user, type, title, message, read, priority
- **Indexes**: user + read + createdAt, user + type
- **Real-time Events**: new notifications, read status

### Business Logic Collections

#### 6. Plans Collection
- **Purpose**: Store subscription plans and pricing
- **Key Fields**: name, type, price, features, limits
- **Indexes**: type + status, price, isPublic
- **Real-time Events**: plan updates, pricing changes

#### 7. Workflows Collection
- **Purpose**: Store automation workflows and triggers
- **Key Fields**: userId, name, trigger, actions, status
- **Indexes**: userId + status, trigger type + isActive
- **Real-time Events**: workflow execution, status changes

#### 8. WorkflowExecutions Collection
- **Purpose**: Track workflow execution history
- **Key Fields**: workflowId, userId, leadId, status, actionsExecuted
- **Indexes**: workflowId + status, userId + status
- **Real-time Events**: execution start/completion, errors

#### 9. Tasks Collection
- **Purpose**: Store tasks and to-do items
- **Key Fields**: userId, leadId, title, dueDate, status, assignee
- **Indexes**: userId + status + dueDate, assignee + status
- **Real-time Events**: task creation, status updates, reminders

#### 10. CrashReports Collection
- **Purpose**: Store application crash reports
- **Key Fields**: user, deviceId, error, stackTrace, severity
- **Indexes**: user + timestamp, platform + severity
- **Real-time Events**: crash reporting, resolution updates

## Real-time Connectivity

### WebSocket Events

The system uses Socket.IO for real-time communication:

#### Connection Events
- `authenticate`: Authenticate WebSocket connection
- `join_room`: Join a chat room
- `leave_room`: Leave a chat room
- `typing_start`: User started typing
- `typing_stop`: User stopped typing

#### Real-time Updates
- `lead_created`: New lead created
- `lead_status_changed`: Lead status updated
- `lead_score_changed`: Lead score updated
- `new_message`: New message received
- `message_read`: Message read receipt
- `message_reaction`: Message reaction added
- `user_status_changed`: User online/offline status
- `new_notification`: New notification received
- `workflow_completed`: Workflow execution completed

### Change Streams

MongoDB change streams are used to detect database changes in real-time:

```javascript
// Example: Listen for lead changes
realtimeDatabase.on('lead:created', (data) => {
  // Send notification to user
  realtimeDatabase.sendToUser(data.userId, 'lead_created', data);
});

realtimeDatabase.on('message:created', (data) => {
  // Send to all users in chat room
  io.to(data.roomId).emit('new_message', data);
});
```

## Database Indexes

### Performance Indexes

The system creates optimized indexes for:

1. **Query Performance**: Fast lookups by user, status, date ranges
2. **Real-time Updates**: Efficient change stream processing
3. **Search Operations**: Text search and filtering
4. **Aggregation Pipelines**: Analytics and reporting queries

### TTL Indexes

Automatic cleanup indexes for:
- Messages: 90 days
- Activities: 90 days
- Notifications: 90 days
- WorkflowExecutions: 90 days
- CrashReports: 90 days

## Sample Data

### Default Users
- **Admin**: admin@aiaagentcrm.com (password: admin123)
- **Demo**: demo@aiaagentcrm.com (password: demo123)

### Subscription Plans
- **Starter**: $29/month - Basic features for small businesses
- **Professional**: $79/month - Advanced features for growing businesses
- **Enterprise**: $199/month - Complete solution for large organizations

### Sample Leads
- 3 sample leads with different statuses and priorities
- Includes contact information, company details, and notes

### Sample Workflows
- **New Lead Welcome**: Automatically welcome new leads
- **Follow-up Reminder**: Daily reminders for pending follow-ups

## Database Maintenance

### Regular Maintenance Tasks

1. **Index Optimization**
   ```bash
   # Check index usage
   db.collection.getIndexes()
   
   # Analyze query performance
   db.collection.explain("find()")
   ```

2. **Data Cleanup**
   ```bash
   # Clean up old data (handled by TTL indexes)
   # Manual cleanup if needed
   db.messages.deleteMany({ createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) } })
   ```

3. **Backup Strategy**
   ```bash
   # Create backup
   mongodump --db AIAgentCRM --out ./backups/$(date +%Y%m%d)
   
   # Restore backup
   mongorestore --db AIAgentCRM ./backups/20231201/AIAgentCRM/
   ```

### Monitoring

Monitor database performance with:

```javascript
// Check connection status
mongoose.connection.readyState

// Monitor query performance
mongoose.set('debug', true);

// Check real-time service status
realtimeDatabase.getStats()
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify MongoDB is running
   - Check MONGODB_URI in .env
   - Ensure network connectivity

2. **Index Creation Failures**
   - Check MongoDB version compatibility
   - Verify sufficient disk space
   - Check user permissions

3. **Real-time Issues**
   - Verify WebSocket connections
   - Check change stream permissions
   - Monitor memory usage

4. **Performance Issues**
   - Review query patterns
   - Check index usage
   - Monitor connection pool size

### Reset Database

To completely reset the database:

```bash
npm run reset-db
```

This will:
- Drop all collections
- Recreate indexes
- Reinitialize sample data

## Security Considerations

1. **Authentication**: JWT-based authentication for API access
2. **Authorization**: Role-based access control (user/admin)
3. **Data Validation**: Input validation and sanitization
4. **Rate Limiting**: API rate limiting to prevent abuse
5. **Encryption**: Password hashing with bcrypt
6. **Audit Logging**: Activity tracking for security monitoring

## Production Deployment

### Environment Variables

```env
# Production Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/AIAgentCRM

# Security
JWT_SECRET=very-long-random-secret-key
NODE_ENV=production

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Performance Optimization

1. **Connection Pooling**: Configure optimal pool size
2. **Index Strategy**: Monitor and optimize indexes
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Load Balancing**: Use MongoDB replica sets for read scaling

### Backup Strategy

1. **Automated Backups**: Daily automated backups
2. **Point-in-Time Recovery**: Enable oplog for point-in-time recovery
3. **Cross-Region Replication**: Replicate data across regions
4. **Testing**: Regularly test backup restoration

## Support

For database-related issues:

1. Check the logs: `npm run dev`
2. Review MongoDB logs
3. Check real-time service status
4. Verify environment configuration

For additional help, refer to the main README.md file or create an issue in the repository. 