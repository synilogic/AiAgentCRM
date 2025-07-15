const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Simple logger replacement
const logger = {
  info: (message, ...args) => console.log('ℹ️ ', message, ...args),
  error: (message, ...args) => console.error('❌', message, ...args),
  warn: (message, ...args) => console.warn('⚠️ ', message, ...args)
};

// Migration tracking model
const MigrationSchema = new mongoose.Schema({
  migrationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  batch: { type: Number, required: true },
  executedAt: { type: Date, default: Date.now },
  rollbackScript: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'rolled_back'], default: 'pending' },
  executionTime: Number,
  error: String
});

const Migration = mongoose.model('Migration', MigrationSchema);

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.currentBatch = 0;
  }

  async connectDB() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM';
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info('✅ Connected to MongoDB for migrations');
    } catch (error) {
      logger.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async ensureMigrationsDirectory() {
    try {
      await fs.access(this.migrationsPath);
    } catch {
      await fs.mkdir(this.migrationsPath, { recursive: true });
      logger.info('📁 Created migrations directory');
    }
  }

  async getCurrentBatch() {
    const lastMigration = await Migration.findOne().sort({ batch: -1 });
    this.currentBatch = lastMigration ? lastMigration.batch : 0;
    return this.currentBatch;
  }

  async getAvailableMigrations() {
    await this.ensureMigrationsDirectory();
    const files = await fs.readdir(this.migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.js'))
      .sort();
    
    const migrations = [];
    for (const file of migrationFiles) {
      const migration = require(path.join(this.migrationsPath, file));
      migrations.push({
        id: file.replace('.js', ''),
        file: file,
        ...migration
      });
    }
    
    return migrations;
  }

  async getPendingMigrations() {
    const availableMigrations = await this.getAvailableMigrations();
    const executedMigrations = await Migration.find({ status: 'completed' });
    const executedIds = new Set(executedMigrations.map(m => m.migrationId));
    
    return availableMigrations.filter(m => !executedIds.has(m.id));
  }

  async runMigration(migration) {
    logger.info(`🔄 Running migration: ${migration.name}`);
    const startTime = Date.now();
    
    try {
      const migrationRecord = new Migration({
        migrationId: migration.id,
        name: migration.name,
        batch: this.currentBatch + 1,
        status: 'pending'
      });
      await migrationRecord.save();

      // Execute the migration
      await migration.up();
      
      const executionTime = Date.now() - startTime;
      migrationRecord.status = 'completed';
      migrationRecord.executionTime = executionTime;
      await migrationRecord.save();
      
      logger.info(`✅ Migration completed: ${migration.name} (${executionTime}ms)`);
      return true;
    } catch (error) {
      logger.error(`❌ Migration failed: ${migration.name}`, error);
      
      await Migration.updateOne(
        { migrationId: migration.id },
        { 
          status: 'failed', 
          error: error.message,
          executionTime: Date.now() - startTime
        }
      );
      
      throw error;
    }
  }

  async rollbackMigration(migration) {
    logger.info(`⏪ Rolling back migration: ${migration.name}`);
    
    try {
      if (migration.down) {
        await migration.down();
      }
      
      await Migration.updateOne(
        { migrationId: migration.id },
        { status: 'rolled_back' }
      );
      
      logger.info(`✅ Rollback completed: ${migration.name}`);
      return true;
    } catch (error) {
      logger.error(`❌ Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  async runAllPending() {
    await this.getCurrentBatch();
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }
    
    logger.info(`📋 Found ${pendingMigrations.length} pending migrations`);
    this.currentBatch++;
    
    let successCount = 0;
    for (const migration of pendingMigrations) {
      try {
        await this.runMigration(migration);
        successCount++;
      } catch (error) {
        logger.error(`❌ Stopping migration process due to error in: ${migration.name}`);
        break;
      }
    }
    
    logger.info(`🎉 Completed ${successCount}/${pendingMigrations.length} migrations`);
  }

  async rollbackLast(count = 1) {
    const lastMigrations = await Migration
      .find({ status: 'completed' })
      .sort({ batch: -1, executedAt: -1 })
      .limit(count);
    
    if (lastMigrations.length === 0) {
      logger.info('❌ No migrations to rollback');
      return;
    }
    
    logger.info(`⏪ Rolling back ${lastMigrations.length} migrations`);
    
    const availableMigrations = await this.getAvailableMigrations();
    const migrationMap = new Map(availableMigrations.map(m => [m.id, m]));
    
    for (const migrationRecord of lastMigrations) {
      const migration = migrationMap.get(migrationRecord.migrationId);
      if (migration) {
        await this.rollbackMigration(migration);
      }
    }
  }

  async status() {
    const executed = await Migration.find().sort({ batch: 1, executedAt: 1 });
    const pending = await this.getPendingMigrations();
    
    console.log('\n📊 Migration Status:');
    console.log('==================');
    
    if (executed.length > 0) {
      console.log('\n✅ Executed Migrations:');
      executed.forEach(m => {
        const status = m.status === 'completed' ? '✅' : 
                     m.status === 'failed' ? '❌' : 
                     m.status === 'rolled_back' ? '⏪' : '⏸️';
        console.log(`  ${status} ${m.migrationId} - ${m.name} (Batch ${m.batch})`);
      });
    }
    
    if (pending.length > 0) {
      console.log('\n⏳ Pending Migrations:');
      pending.forEach(m => {
        console.log(`  ⏳ ${m.id} - ${m.name}`);
      });
    }
    
    console.log(`\n📈 Total: ${executed.length} executed, ${pending.length} pending\n`);
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.js`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `module.exports = {
  name: '${name}',
  description: 'Description for ${name}',
  
  async up() {
    // Migration logic here
    console.log('Running migration: ${name}');
  },
  
  async down() {
    // Rollback logic here
    console.log('Rolling back migration: ${name}');
  }
};`;
    
    await fs.writeFile(filepath, template);
    logger.info(`📝 Created migration: ${filename}`);
    return filename;
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const manager = new MigrationManager();
  
  try {
    await manager.connectDB();
    
    switch (command) {
      case 'run':
        await manager.runAllPending();
        break;
        
      case 'rollback':
        const count = parseInt(process.argv[3]) || 1;
        await manager.rollbackLast(count);
        break;
        
      case 'status':
        await manager.status();
        break;
        
      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.log('❌ Please provide a migration name');
          process.exit(1);
        }
        await manager.createMigration(name);
        break;
        
      default:
        console.log(`
🗄️  AI Agent CRM - Enhanced Migration Tool

Usage:
  node migrate-enhanced.js <command> [options]

Commands:
  run                 Run all pending migrations
  rollback [count]    Rollback last [count] migrations (default: 1)
  status              Show migration status
  create <name>       Create a new migration file

Examples:
  node migrate-enhanced.js run
  node migrate-enhanced.js rollback 2
  node migrate-enhanced.js status
  node migrate-enhanced.js create "add user preferences"
        `);
        break;
    }
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager; 