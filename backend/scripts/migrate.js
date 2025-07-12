const mongoose = require('mongoose');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// Migration configuration
const MIGRATIONS = [
  {
    id: '001_initial_schema',
    description: 'Create initial database schema',
    up: async () => {
      // This migration is handled by Mongoose models
      logger.info('Migration 001: Initial schema already exists');
    },
    down: async () => {
      // Drop all collections
      await mongoose.connection.dropDatabase();
      logger.info('Migration 001: Dropped all collections');
    }
  },
  {
    id: '002_add_user_fields',
    description: 'Add additional user fields',
    up: async () => {
      await User.updateMany(
        { businessName: { $exists: false } },
        { $set: { businessName: '', industry: '', companySize: '' } }
      );
      logger.info('Migration 002: Added user fields');
    },
    down: async () => {
      await User.updateMany(
        {},
        { $unset: { businessName: 1, industry: 1, companySize: 1 } }
      );
      logger.info('Migration 002: Removed user fields');
    }
  },
  {
    id: '003_add_lead_scoring',
    description: 'Add lead scoring fields',
    up: async () => {
      await Lead.updateMany(
        { score: { $exists: false } },
        { $set: { score: 50, scoreFactors: {} } }
      );
      logger.info('Migration 003: Added lead scoring fields');
    },
    down: async () => {
      await Lead.updateMany(
        {},
        { $unset: { score: 1, scoreFactors: 1 } }
      );
      logger.info('Migration 003: Removed lead scoring fields');
    }
  },
  {
    id: '004_add_message_metadata',
    description: 'Add message metadata fields',
    up: async () => {
      await Message.updateMany(
        { metadata: { $exists: false } },
        { $set: { metadata: {}, aiGenerated: false, sentiment: 'neutral' } }
      );
      logger.info('Migration 004: Added message metadata fields');
    },
    down: async () => {
      await Message.updateMany(
        {},
        { $unset: { metadata: 1, aiGenerated: 1, sentiment: 1 } }
      );
      logger.info('Migration 004: Removed message metadata fields');
    }
  },
  {
    id: '005_add_subscription_features',
    description: 'Add subscription feature tracking',
    up: async () => {
      await Subscription.updateMany(
        { features: { $exists: false } },
        { $set: { features: [], usage: {} } }
      );
      logger.info('Migration 005: Added subscription features');
    },
    down: async () => {
      await Subscription.updateMany(
        {},
        { $unset: { features: 1, usage: 1 } }
      );
      logger.info('Migration 005: Removed subscription features');
    }
  },
  {
    id: '006_add_plan_limits',
    description: 'Add plan usage limits',
    up: async () => {
      await Plan.updateMany(
        { maxLeads: { $exists: false } },
        { $set: { maxLeads: 1000, maxMessages: 5000, maxUsers: 1 } }
      );
      logger.info('Migration 006: Added plan limits');
    },
    down: async () => {
      await Plan.updateMany(
        {},
        { $unset: { maxLeads: 1, maxMessages: 1, maxUsers: 1 } }
      );
      logger.info('Migration 006: Removed plan limits');
    }
  },
  {
    id: '007_add_lead_tags',
    description: 'Add lead tagging system',
    up: async () => {
      await Lead.updateMany(
        { tags: { $exists: false } },
        { $set: { tags: [], customFields: {} } }
      );
      logger.info('Migration 007: Added lead tags');
    },
    down: async () => {
      await Lead.updateMany(
        {},
        { $unset: { tags: 1, customFields: 1 } }
      );
      logger.info('Migration 007: Removed lead tags');
    }
  },
  {
    id: '008_add_user_preferences',
    description: 'Add user preferences and settings',
    up: async () => {
      await User.updateMany(
        { preferences: { $exists: false } },
        { $set: { preferences: {}, settings: {} } }
      );
      logger.info('Migration 008: Added user preferences');
    },
    down: async () => {
      await User.updateMany(
        {},
        { $unset: { preferences: 1, settings: 1 } }
      );
      logger.info('Migration 008: Removed user preferences');
    }
  },
  {
    id: '009_add_automation_workflows',
    description: 'Add automation workflow fields',
    up: async () => {
      // This would add automation-related fields to leads
      await Lead.updateMany(
        { automationStatus: { $exists: false } },
        { $set: { automationStatus: 'none', workflowId: null, lastAutomationRun: null } }
      );
      logger.info('Migration 009: Added automation workflows');
    },
    down: async () => {
      await Lead.updateMany(
        {},
        { $unset: { automationStatus: 1, workflowId: 1, lastAutomationRun: 1 } }
      );
      logger.info('Migration 009: Removed automation workflows');
    }
  },
  {
    id: '010_add_analytics_tracking',
    description: 'Add analytics tracking fields',
    up: async () => {
      await Lead.updateMany(
        { analytics: { $exists: false } },
        { $set: { analytics: { views: 0, interactions: 0, lastActivity: null } } }
      );
      logger.info('Migration 010: Added analytics tracking');
    },
    down: async () => {
      await Lead.updateMany(
        {},
        { $unset: { analytics: 1 } }
      );
      logger.info('Migration 010: Removed analytics tracking');
    }
  }
];

// Migration tracking collection
const MigrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  appliedBy: { type: String, default: 'system' }
});

const Migration = mongoose.model('Migration', MigrationSchema);

// Get applied migrations
const getAppliedMigrations = async () => {
  const applied = await Migration.find().sort({ appliedAt: 1 });
  return applied.map(m => m.id);
};

// Apply migration
const applyMigration = async (migration) => {
  try {
    logger.info(`Applying migration: ${migration.id} - ${migration.description}`);
    
    await migration.up();
    
    await Migration.create({
      id: migration.id,
      description: migration.description,
      appliedBy: 'system'
    });
    
    logger.info(`Migration ${migration.id} applied successfully`);
  } catch (error) {
    logger.error(`Migration ${migration.id} failed:`, error);
    throw error;
  }
};

// Rollback migration
const rollbackMigration = async (migration) => {
  try {
    logger.info(`Rolling back migration: ${migration.id}`);
    
    await migration.down();
    
    await Migration.deleteOne({ id: migration.id });
    
    logger.info(`Migration ${migration.id} rolled back successfully`);
  } catch (error) {
    logger.error(`Rollback of migration ${migration.id} failed:`, error);
    throw error;
  }
};

// Run migrations
const runMigrations = async (targetVersion = null) => {
  try {
    logger.info('Starting database migrations...');
    
    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = MIGRATIONS.filter(m => !appliedMigrations.includes(m.id));
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      if (targetVersion && migration.id > targetVersion) {
        break;
      }
      
      await applyMigration(migration);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

// Rollback migrations
const rollbackMigrations = async (count = 1) => {
  try {
    logger.info(`Rolling back ${count} migrations...`);
    
    const appliedMigrations = await getAppliedMigrations();
    const migrationsToRollback = appliedMigrations.slice(-count).reverse();
    
    for (const migrationId of migrationsToRollback) {
      const migration = MIGRATIONS.find(m => m.id === migrationId);
      if (migration) {
        await rollbackMigration(migration);
      }
    }
    
    logger.info('Rollback completed successfully');
  } catch (error) {
    logger.error('Rollback failed:', error);
    throw error;
  }
};

// Show migration status
const showMigrationStatus = async () => {
  const appliedMigrations = await getAppliedMigrations();
  
  console.log('\nMigration Status:');
  console.log('==================');
  
  for (const migration of MIGRATIONS) {
    const status = appliedMigrations.includes(migration.id) ? '✓ Applied' : '⏳ Pending';
    console.log(`${migration.id}: ${migration.description} - ${status}`);
  }
  
  console.log(`\nTotal: ${MIGRATIONS.length} migrations, ${appliedMigrations.length} applied`);
};

// Main function
const main = async () => {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagentcrm');
    logger.info('Connected to database');
    
    switch (command) {
      case 'up':
        await runMigrations(arg);
        break;
      case 'down':
        await rollbackMigrations(parseInt(arg) || 1);
        break;
      case 'status':
        await showMigrationStatus();
        break;
      case 'reset':
        await mongoose.connection.dropDatabase();
        logger.info('Database reset completed');
        break;
      default:
        console.log('Usage: node migrate.js [up|down|status|reset] [version|count]');
        console.log('  up [version]     - Run pending migrations up to version');
        console.log('  down [count]     - Rollback last N migrations');
        console.log('  status           - Show migration status');
        console.log('  reset            - Drop all collections');
    }
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  rollbackMigrations,
  showMigrationStatus,
  MIGRATIONS
}; 