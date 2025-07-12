const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const AWS = require('aws-sdk');
const logger = require('./logger');

class BackupService {
  constructor() {
    this.isInitialized = false;
    this.s3 = null;
    this.backupDir = process.env.BACKUP_DIR || './backups';
  }

  // Initialize backup service
  async initialize() {
    try {
      // Create backup directory
      await fs.mkdir(this.backupDir, { recursive: true });

      // Initialize AWS S3 if configured
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        });
      }

      this.isInitialized = true;
      logger.info('Backup service initialized');
    } catch (error) {
      logger.error('Failed to initialize backup service:', error);
      throw error;
    }
  }

  // Create database backup
  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `db-backup-${timestamp}.gz`;
      const filepath = path.join(this.backupDir, filename);

      const mongoUri = process.env.MONGODB_URI;
      const dbName = mongoUri.split('/').pop().split('?')[0];

      return new Promise((resolve, reject) => {
        const command = `mongodump --uri="${mongoUri}" --archive="${filepath}" --gzip`;
        
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('Database backup failed:', error);
            reject(error);
            return;
          }

          logger.info(`Database backup created: ${filename}`);
          resolve({ filename, filepath, size: fs.statSync(filepath).size });
        });
      });
    } catch (error) {
      logger.error('Failed to create database backup:', error);
      throw error;
    }
  }

  // Create file system backup
  async createFileBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `files-backup-${timestamp}.zip`;
      const filepath = path.join(this.backupDir, filename);

      const output = fs.createWriteStream(filepath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          logger.info(`File backup created: ${filename} (${archive.pointer()} bytes)`);
          resolve({ filename, filepath, size: archive.pointer() });
        });

        archive.on('error', (err) => {
          logger.error('File backup failed:', err);
          reject(err);
        });

        archive.pipe(output);

        // Add important directories
        const dirsToBackup = [
          './uploads',
          './logs',
          './config'
        ];

        dirsToBackup.forEach(dir => {
          if (fs.existsSync(dir)) {
            archive.directory(dir, path.basename(dir));
          }
        });

        archive.finalize();
      });
    } catch (error) {
      logger.error('Failed to create file backup:', error);
      throw error;
    }
  }

  // Create configuration backup
  async createConfigBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `config-backup-${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      const config = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: {
          uri: process.env.MONGODB_URI ? '***' : null,
          name: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('/').pop().split('?')[0] : null
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
        },
        services: {
          openai: !!process.env.OPENAI_API_KEY,
          whatsapp: !!process.env.WHATSAPP_SESSION_PATH,
          razorpay: !!process.env.RAZORPAY_KEY_ID,
          firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        },
        features: {
          websocket: true,
          mobile: true,
          integrations: true,
          analytics: true
        }
      };

      await fs.writeFile(filepath, JSON.stringify(config, null, 2));
      
      logger.info(`Configuration backup created: ${filename}`);
      return { filename, filepath, size: fs.statSync(filepath).size };
    } catch (error) {
      logger.error('Failed to create config backup:', error);
      throw error;
    }
  }

  // Upload backup to cloud storage
  async uploadToCloud(backupInfo) {
    try {
      if (!this.s3) {
        logger.warn('S3 not configured, skipping cloud upload');
        return { success: false, error: 'S3 not configured' };
      }

      const { filename, filepath } = backupInfo;
      const fileContent = await fs.readFile(filepath);

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `backups/${filename}`,
        Body: fileContent,
        ContentType: filename.endsWith('.gz') ? 'application/gzip' : 'application/zip',
        Metadata: {
          'backup-type': filename.includes('db') ? 'database' : filename.includes('files') ? 'files' : 'config',
          'created-at': new Date().toISOString()
        }
      };

      const result = await this.s3.upload(params).promise();
      
      logger.info(`Backup uploaded to S3: ${result.Location}`);
      return { success: true, location: result.Location };
    } catch (error) {
      logger.error('Failed to upload backup to cloud:', error);
      return { success: false, error: error.message };
    }
  }

  // Create full system backup
  async createFullBackup() {
    try {
      logger.info('Starting full system backup...');
      
      const results = {
        database: null,
        files: null,
        config: null,
        cloud: null,
        timestamp: new Date().toISOString()
      };

      // Create database backup
      try {
        results.database = await this.createDatabaseBackup();
      } catch (error) {
        logger.error('Database backup failed:', error);
        results.database = { error: error.message };
      }

      // Create file backup
      try {
        results.files = await this.createFileBackup();
      } catch (error) {
        logger.error('File backup failed:', error);
        results.files = { error: error.message };
      }

      // Create config backup
      try {
        results.config = await this.createConfigBackup();
      } catch (error) {
        logger.error('Config backup failed:', error);
        results.config = { error: error.message };
      }

      // Upload to cloud if configured
      if (this.s3) {
        const backups = [results.database, results.files, results.config].filter(b => b && !b.error);
        for (const backup of backups) {
          try {
            const uploadResult = await this.uploadToCloud(backup);
            if (uploadResult.success) {
              backup.cloudLocation = uploadResult.location;
            }
          } catch (error) {
            logger.error(`Failed to upload ${backup.filename}:`, error);
          }
        }
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      logger.info('Full system backup completed');
      return results;
    } catch (error) {
      logger.error('Full backup failed:', error);
      throw error;
    }
  }

  // Clean up old backups
  async cleanupOldBackups() {
    try {
      const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const files = await fs.readdir(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`Deleted old backup: ${file}`);
        }
      }

      logger.info(`Cleaned up ${deletedCount} old backups`);
      return { deletedCount };
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupFile) {
    try {
      const filepath = path.join(this.backupDir, backupFile);
      
      if (!await fs.access(filepath).then(() => true).catch(() => false)) {
        throw new Error('Backup file not found');
      }

      const mongoUri = process.env.MONGODB_URI;

      return new Promise((resolve, reject) => {
        const command = `mongorestore --uri="${mongoUri}" --archive="${filepath}" --gzip`;
        
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('Database restore failed:', error);
            reject(error);
            return;
          }

          logger.info(`Database restored from: ${backupFile}`);
          resolve({ success: true });
        });
      });
    } catch (error) {
      logger.error('Failed to restore database:', error);
      throw error;
    }
  }

  // List available backups
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
          type: file.includes('db') ? 'database' : file.includes('files') ? 'files' : 'config'
        });
      }

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  // Get backup statistics
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total: backups.length,
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        last24h: backups.filter(b => b.created > last24h).length,
        last7d: backups.filter(b => b.created > last7d).length,
        byType: backups.reduce((acc, b) => {
          acc[b.type] = (acc[b.type] || 0) + 1;
          return acc;
        }, {}),
        latest: backups[0] || null
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      throw error;
    }
  }

  // Schedule automated backups
  scheduleBackups() {
    const interval = process.env.BACKUP_INTERVAL || '0 2 * * *'; // Daily at 2 AM
    
    const cron = require('node-cron');
    
    cron.schedule(interval, async () => {
      try {
        logger.info('Running scheduled backup...');
        await this.createFullBackup();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    });

    logger.info(`Scheduled backups with interval: ${interval}`);
  }
}

// Create singleton instance
const backupService = new BackupService();

// Export singleton and class
module.exports = {
  backupService,
  BackupService
}; 