const redis = require('redis');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  // Initialize Redis connection
  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis ready for commands');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  // Disconnect from Redis
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set');
        return false;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Failed to set cache for key ${key}:`, error);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        logger.debug(`Cache miss: ${key}`);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache delete');
        return false;
      }

      const result = await this.client.del(key);
      logger.debug(`Cache deleted: ${key} (${result} keys removed)`);
      return result > 0;
    } catch (error) {
      logger.error(`Failed to delete cache for key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping pattern delete');
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        logger.debug(`Cache pattern deleted: ${pattern} (${result} keys removed)`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error(`Failed to delete cache pattern ${pattern}:`, error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence for key ${key}:`, error);
      return false;
    }
  }

  // Get TTL for key
  async getTTL(key) {
    try {
      if (!this.isConnected) {
        return -1;
      }

      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Set TTL for existing key
  async setTTL(key, ttl) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, ttl);
      logger.debug(`TTL set for ${key}: ${ttl}s`);
      return result;
    } catch (error) {
      logger.error(`Failed to set TTL for key ${key}:`, error);
      return false;
    }
  }

  // Increment counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const result = await this.client.incr(key);
      await this.setTTL(key, ttl);
      return result;
    } catch (error) {
      logger.error(`Failed to increment key ${key}:`, error);
      return null;
    }
  }

  // Set hash field
  async hset(key, field, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
      await this.setTTL(key, ttl);
      
      logger.debug(`Hash set: ${key}.${field}`);
      return true;
    } catch (error) {
      logger.error(`Failed to set hash field ${key}.${field}:`, error);
      return false;
    }
  }

  // Get hash field
  async hget(key, field) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.hGet(key, field);
      
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Failed to get hash field ${key}.${field}:`, error);
      return null;
    }
  }

  // Get all hash fields
  async hgetall(key) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const hash = await this.client.hGetAll(key);
      
      // Parse JSON values
      for (let field in hash) {
        try {
          hash[field] = JSON.parse(hash[field]);
        } catch {
          // Keep as string if not JSON
        }
      }

      return hash;
    } catch (error) {
      logger.error(`Failed to get all hash fields for ${key}:`, error);
      return null;
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      const cacheKey = keyGenerator ? keyGenerator(req) : `api:${req.method}:${req.originalUrl}`;
      
      try {
        const cachedData = await this.get(cacheKey);
        if (cachedData !== null) {
          return res.json(cachedData);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
          this.set(cacheKey, data, ttl);
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Cache with fallback function
  async cacheWithFallback(key, fallbackFn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      let data = await this.get(key);
      
      if (data !== null) {
        return data;
      }

      // If not in cache, execute fallback function
      data = await fallbackFn();
      
      // Cache the result
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      logger.error(`Cache with fallback error for key ${key}:`, error);
      // Try fallback function even if cache fails
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        logger.error(`Fallback function also failed for key ${key}:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  // Cache invalidation patterns
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}:*`,
      `leads:user:${userId}:*`,
      `messages:user:${userId}:*`,
      `analytics:user:${userId}:*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  async invalidateLeadCache(leadId) {
    const patterns = [
      `lead:${leadId}:*`,
      `leads:*`,
      `analytics:leads:*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  async invalidateWhatsAppCache(userId) {
    const patterns = [
      `whatsapp:${userId}:*`,
      `chats:${userId}:*`,
      `messages:whatsapp:${userId}:*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  // Cache statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.client.info();
      const keys = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keys,
        info: info.split('\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  // Clear all cache
  async clearAll() {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.flushDb();
      logger.info('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Export singleton and class
module.exports = {
  cacheManager,
  CacheManager
}; 