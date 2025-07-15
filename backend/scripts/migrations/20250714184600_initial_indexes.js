const mongoose = require('mongoose');

module.exports = {
  name: 'Initial Database Indexes',
  description: 'Create essential indexes for better query performance',
  
  async up() {
    console.log('Creating database indexes...');
    
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ role: 1 });
    await mongoose.connection.collection('users').createIndex({ 'subscription.status': 1 });
    await mongoose.connection.collection('users').createIndex({ plan: 1 });
    
    // Lead indexes
    await mongoose.connection.collection('leads').createIndex({ userId: 1, status: 1, createdAt: -1 });
    await mongoose.connection.collection('leads').createIndex({ userId: 1, score: -1 });
    await mongoose.connection.collection('leads').createIndex({ source: 1 });
    await mongoose.connection.collection('leads').createIndex({ priority: 1 });
    await mongoose.connection.collection('leads').createIndex({ nextFollowUp: 1 });
    
    // Message indexes
    await mongoose.connection.collection('messages').createIndex({ roomId: 1, timestamp: -1 });
    await mongoose.connection.collection('messages').createIndex({ user: 1, timestamp: -1 });
    
    // Activity indexes
    await mongoose.connection.collection('activities').createIndex({ userId: 1, leadId: 1, createdAt: -1 });
    await mongoose.connection.collection('activities').createIndex({ type: 1 });
    
    // Plan indexes
    await mongoose.connection.collection('plans').createIndex({ type: 1, status: 1, sortOrder: 1 });
    
    // Payment indexes
    await mongoose.connection.collection('payments').createIndex({ user: 1, createdAt: -1 });
    await mongoose.connection.collection('payments').createIndex({ gatewayPaymentId: 1 });
    
    // Task indexes
    await mongoose.connection.collection('tasks').createIndex({ userId: 1, status: 1, dueDate: 1 });
    await mongoose.connection.collection('tasks').createIndex({ assignee: 1, status: 1 });
    
    // Workflow indexes
    await mongoose.connection.collection('workflows').createIndex({ userId: 1, status: 1 });
    
    // Security Alert indexes
    await mongoose.connection.collection('securityalerts').createIndex({ type: 1, severity: 1 });
    await mongoose.connection.collection('securityalerts').createIndex({ sourceIP: 1 });
    
    console.log('✅ Database indexes created successfully');
  },
  
  async down() {
    console.log('Dropping database indexes...');
    
    const collections = [
      'users', 'leads', 'messages', 'activities', 'plans', 
      'payments', 'tasks', 'workflows', 'securityalerts'
    ];
    
    for (const collectionName of collections) {
      try {
        await mongoose.connection.collection(collectionName).dropIndexes();
      } catch (error) {
        console.log(`Note: Could not drop indexes for ${collectionName}:`, error.message);
      }
    }
    
    console.log('✅ Database indexes dropped');
  }
}; 