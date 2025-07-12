const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const crypto = require('crypto');

// Create rate limiters for different time windows
const rateLimiters = {
  minute: new RateLimiterMemory({
    keyPrefix: 'api_minute',
    points: 100, // Default requests per minute
    duration: 60, // Per 60 seconds
  }),
  hour: new RateLimiterMemory({
    keyPrefix: 'api_hour',
    points: 1000, // Default requests per hour
    duration: 3600, // Per hour
  }),
  day: new RateLimiterMemory({
    keyPrefix: 'api_day',
    points: 10000, // Default requests per day
    duration: 86400, // Per day
  })
};

// Blocked IPs cache
const blockedIPsCache = new Map();
const suspiciousIPsCache = new Map();

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

// Helper function to get request size
function getRequestSize(req) {
  return parseInt(req.headers['content-length']) || 0;
}

// Helper function to validate API key format
function isValidApiKeyFormat(key) {
  return /^ak_[a-f0-9]{64}$/.test(key);
}

// Helper function to hash API key for rate limiting
function hashKey(apiKey, timeWindow) {
  return crypto.createHash('sha256').update(`${apiKey}_${timeWindow}`).digest('hex');
}

// Main API key authentication middleware
const apiKeyAuth = (options = {}) => {
  const {
    required = true,
    permissions = ['read'],
    logRequests = true,
    checkRateLimit = true,
    checkSecurity = true
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    
    let apiKey = null;
    let apiKeyDoc = null;
    let userId = null;
    let requestLog = null;

    // Extract API key from headers or query params
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];
    const apiKeyQuery = req.query.api_key;
    
    let apiKeyValue = null;
    
    if (apiKeyHeader) {
      if (apiKeyHeader.startsWith('Bearer ')) {
        apiKeyValue = apiKeyHeader.substring(7);
      } else if (apiKeyHeader.startsWith('ApiKey ')) {
        apiKeyValue = apiKeyHeader.substring(7);
      } else {
        apiKeyValue = apiKeyHeader;
      }
    } else if (apiKeyQuery) {
      apiKeyValue = apiKeyQuery;
    }

    // If API key is required but not provided
    if (required && !apiKeyValue) {
      const responseTime = Date.now() - startTime;
      
      if (logRequests) {
        await ApiRequestLog.logRequest({
          method: req.method,
          endpoint: req.route ? req.route.path : req.path,
          fullUrl: req.originalUrl,
          statusCode: 401,
          responseTime,
          requestSize: getRequestSize(req),
          responseSize: 0,
          ipAddress: clientIP,
          userAgent,
          referer,
          headers: req.headers,
          queryParams: req.query,
          errorMessage: 'API key required',
          isBlocked: true,
          blockReason: 'missing_api_key'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
    }

    // If API key is provided, validate it
    if (apiKeyValue) {
      try {
        // Validate API key format
        if (!isValidApiKeyFormat(apiKeyValue)) {
          throw new Error('Invalid API key format');
        }

        // Find API key in database
        apiKeyDoc = await ApiKey.findOne({ 
          key: apiKeyValue,
          status: 'active'
        }).populate('userId');

        if (!apiKeyDoc) {
          throw new Error('Invalid API key');
        }

        // Check if API key is expired
        if (apiKeyDoc.isExpired) {
          throw new Error('API key expired');
        }

        // Check IP restrictions
        if (!apiKeyDoc.isIPAllowed(clientIP)) {
          throw new Error('IP address not allowed');
        }

        // Check domain restrictions (if referer is provided)
        if (referer) {
          const domain = new URL(referer).hostname;
          if (!apiKeyDoc.isDomainAllowed(domain)) {
            throw new Error('Domain not allowed');
          }
        }

        // Check permissions
        const hasRequiredPermissions = permissions.every(perm => 
          apiKeyDoc.permissions.includes(perm) || apiKeyDoc.permissions.includes('admin')
        );
        
        if (!hasRequiredPermissions) {
          throw new Error('Insufficient permissions');
        }

        // Set request context
        apiKey = apiKeyValue;
        userId = apiKeyDoc.userId;
        req.apiKey = apiKeyDoc;
        req.apiKeyUser = apiKeyDoc.userId;

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (logRequests) {
          await ApiRequestLog.logRequest({
            apiKeyId: apiKeyDoc ? apiKeyDoc._id : null,
            userId: apiKeyDoc ? apiKeyDoc.userId : null,
            method: req.method,
            endpoint: req.route ? req.route.path : req.path,
            fullUrl: req.originalUrl,
            statusCode: 401,
            responseTime,
            requestSize: getRequestSize(req),
            responseSize: 0,
            ipAddress: clientIP,
            userAgent,
            referer,
            headers: req.headers,
            queryParams: req.query,
            errorMessage: error.message,
            isBlocked: true,
            blockReason: 'invalid_api_key'
          });
        }
        
        return res.status(401).json({
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        });
      }
    }

    // Security checks
    if (checkSecurity && apiKeyDoc) {
      // Check if IP is blocked
      if (blockedIPsCache.has(clientIP)) {
        const blockInfo = blockedIPsCache.get(clientIP);
        if (blockInfo.expiresAt > Date.now()) {
          const responseTime = Date.now() - startTime;
          
          if (logRequests) {
            await ApiRequestLog.logRequest({
              apiKeyId: apiKeyDoc._id,
              userId: apiKeyDoc.userId,
              method: req.method,
              endpoint: req.route ? req.route.path : req.path,
              fullUrl: req.originalUrl,
              statusCode: 429,
              responseTime,
              requestSize: getRequestSize(req),
              responseSize: 0,
              ipAddress: clientIP,
              userAgent,
              referer,
              headers: req.headers,
              queryParams: req.query,
              errorMessage: 'IP address blocked',
              isBlocked: true,
              blockReason: blockInfo.reason
            });
          }
          
          return res.status(429).json({
            success: false,
            error: 'IP address temporarily blocked',
            code: 'IP_BLOCKED',
            retryAfter: Math.ceil((blockInfo.expiresAt - Date.now()) / 1000)
          });
        } else {
          // Remove expired block
          blockedIPsCache.delete(clientIP);
        }
      }
    }

    // Rate limiting
    if (checkRateLimit && apiKeyDoc) {
      try {
        const keyHash = hashKey(apiKeyValue, 'global');
        
        // Check rate limits for different time windows
        const rateLimitChecks = [
          { limiter: rateLimiters.minute, limit: apiKeyDoc.rateLimit.requestsPerMinute, window: 'minute' },
          { limiter: rateLimiters.hour, limit: apiKeyDoc.rateLimit.requestsPerHour, window: 'hour' },
          { limiter: rateLimiters.day, limit: apiKeyDoc.rateLimit.requestsPerDay, window: 'day' }
        ];

        for (const check of rateLimitChecks) {
          // Update rate limiter with custom limit
          check.limiter.points = check.limit;
          
          const rateLimitKey = `${keyHash}_${check.window}`;
          const resRateLimit = await check.limiter.consume(rateLimitKey);
          
          // Add rate limit headers
          res.set({
            'X-RateLimit-Limit': check.limit,
            'X-RateLimit-Remaining': resRateLimit.remainingPoints,
            'X-RateLimit-Reset': new Date(Date.now() + resRateLimit.msBeforeNext)
          });
        }

      } catch (rateLimitError) {
        const responseTime = Date.now() - startTime;
        
        if (logRequests) {
          await ApiRequestLog.logRequest({
            apiKeyId: apiKeyDoc._id,
            userId: apiKeyDoc.userId,
            method: req.method,
            endpoint: req.route ? req.route.path : req.path,
            fullUrl: req.originalUrl,
            statusCode: 429,
            responseTime,
            requestSize: getRequestSize(req),
            responseSize: 0,
            ipAddress: clientIP,
            userAgent,
            referer,
            headers: req.headers,
            queryParams: req.query,
            errorMessage: 'Rate limit exceeded',
            isBlocked: true,
            blockReason: 'rate_limit_exceeded'
          });
        }
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000)
        });
      }
    }

    // Prepare logging data for response
    req.requestStartTime = startTime;
    req.logData = {
      apiKeyId: apiKeyDoc ? apiKeyDoc._id : null,
      userId: apiKeyDoc ? apiKeyDoc.userId : null,
      method: req.method,
      endpoint: req.route ? req.route.path : req.path,
      fullUrl: req.originalUrl,
      requestSize: getRequestSize(req),
      ipAddress: clientIP,
      userAgent,
      referer,
      headers: req.headers,
      queryParams: req.query
    };

    // Override res.end to log response
    if (logRequests) {
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        const responseSize = chunk ? Buffer.byteLength(chunk, encoding) : 0;
        
        // Prepare log data
        const logData = {
          ...req.logData,
          statusCode: res.statusCode,
          responseTime,
          responseSize,
          timestamp: new Date()
        };

        // Add performance metrics if available
        const memUsage = process.memoryUsage();
        logData.memoryUsage = memUsage.heapUsed;
        
        // Log the request asynchronously
        ApiRequestLog.logRequest(logData);
        
        // Update API key usage
        if (apiKeyDoc) {
          apiKeyDoc.incrementUsage().catch(err => 
            console.error('Failed to update API key usage:', err)
          );
        }
        
        originalEnd.call(this, chunk, encoding);
      };
    }

    next();
  };
};

// Middleware to check for suspicious activity
const checkSuspiciousActivity = async (req, res, next) => {
  try {
    const suspiciousIPs = await ApiRequestLog.detectSuspiciousActivity();
    
    for (const ipData of suspiciousIPs) {
      const ip = ipData._id;
      
      // Add to suspicious IPs cache
      suspiciousIPsCache.set(ip, {
        reasons: [],
        detectedAt: new Date()
      });
      
      // If very suspicious, temporarily block
      if (ipData.requestCount > 200 || ipData.errorRate > 0.8) {
        blockedIPsCache.set(ip, {
          reason: 'suspicious_activity',
          expiresAt: Date.now() + (15 * 60 * 1000) // Block for 15 minutes
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    next(); // Don't block requests if security check fails
  }
};

// Export middleware functions
module.exports = {
  apiKeyAuth,
  checkSuspiciousActivity,
  rateLimiters,
  blockedIPsCache,
  suspiciousIPsCache
}; 