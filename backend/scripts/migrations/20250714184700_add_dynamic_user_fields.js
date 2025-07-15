const mongoose = require('mongoose');

module.exports = {
  name: 'Add Dynamic User Fields',
  description: 'Add goals, socialLinks, and teamMembers fields to existing users',
  
  async up() {
    console.log('Adding dynamic user fields...');
    
    // Add goals, socialLinks, and teamMembers arrays to all existing users
    const result = await mongoose.connection.collection('users').updateMany(
      {
        $or: [
          { goals: { $exists: false } },
          { socialLinks: { $exists: false } },
          { teamMembers: { $exists: false } }
        ]
      },
      {
        $set: {
          goals: [],
          socialLinks: [],
          teamMembers: []
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with dynamic fields`);
    
    // Add default sample goals for admin users
    await mongoose.connection.collection('users').updateMany(
      { role: 'admin', 'goals.0': { $exists: false } },
      {
        $push: {
          goals: {
            $each: [
              {
                id: 'goal_' + Date.now() + '_1',
                title: 'Acquire 100 New Leads',
                target: 100,
                current: 0,
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
                type: 'leads',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: 'goal_' + Date.now() + '_2',
                title: 'Generate ₹50,000 Revenue',
                target: 50000,
                current: 0,
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
                type: 'revenue',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ]
          }
        }
      }
    );
    
    console.log('✅ Added default goals for admin users');
  },
  
  async down() {
    console.log('Removing dynamic user fields...');
    
    const result = await mongoose.connection.collection('users').updateMany(
      {},
      {
        $unset: {
          goals: 1,
          socialLinks: 1,
          teamMembers: 1
        }
      }
    );
    
    console.log(`✅ Removed dynamic fields from ${result.modifiedCount} users`);
  }
}; 