const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    console.log('🔍 Checking MongoDB collections...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Collections in AIAgentCRM database:');
    console.log('=====================================');
    
    if (collections.length === 0) {
      console.log('❌ No collections found!');
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
      console.log(`\n✅ Total collections: ${collections.length}`);
    }
    
    // Check specific collections and their document counts
    console.log('\n📈 Collection Statistics:');
    console.log('========================');
    
    const collectionNames = ['users', 'leads', 'messages', 'activities', 'notifications', 'plans', 'workflows', 'tasks'];
    
    for (const collectionName of collectionNames) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`${collectionName}: Collection does not exist`);
      }
    }
    
    // Check if users collection exists and show sample users
    try {
      const usersCollection = db.collection('users');
      const userCount = await usersCollection.countDocuments();
      
      if (userCount > 0) {
        console.log('\n👥 Sample Users:');
        console.log('===============');
        const users = await usersCollection.find({}).limit(5).toArray();
        users.forEach(user => {
          console.log(`- ${user.email} (${user.role})`);
        });
      }
    } catch (error) {
      console.log('\n❌ Users collection does not exist');
    }
    
    // Check if leads collection exists and show sample leads
    try {
      const leadsCollection = db.collection('leads');
      const leadCount = await leadsCollection.countDocuments();
      
      if (leadCount > 0) {
        console.log('\n🎯 Sample Leads:');
        console.log('===============');
        const leads = await leadsCollection.find({}).limit(5).toArray();
        leads.forEach(lead => {
          console.log(`- ${lead.name} (${lead.email}) - ${lead.status}`);
        });
      }
    } catch (error) {
      console.log('\n❌ Leads collection does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
checkCollections(); 