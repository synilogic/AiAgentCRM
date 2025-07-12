const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'aiagentcrm-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // API logs
    new winston.transports.File({
      filename: path.join(logsDir, 'api.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // WhatsApp logs
    new winston.transports.File({
      filename: path.join(logsDir, 'whatsapp.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Payment logs
    new winston.transports.File({
      filename: path.join(logsDir, 'payments.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // AI logs
    new winston.transports.File({
      filename: path.join(logsDir, 'ai.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create specialized loggers
const apiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'api.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

const whatsappLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'whatsapp' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'whatsapp.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

const paymentLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'payments.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

const aiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'ai' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'ai.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Logging utility functions
const logAPI = (level, message, meta = {}) => {
  apiLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
};

const logWhatsApp = (level, message, meta = {}) => {
  whatsappLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
};

const logPayment = (level, message, meta = {}) => {
  paymentLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
};

const logAI = (level, message, meta = {}) => {
  aiLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logAPI('info', 'Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logAPI('info', 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('User-Agent')
  });

  next(error);
};

// Performance logging
const logPerformance = (operation, duration, meta = {}) => {
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...meta
  });
};

// Security logging
const logSecurity = (event, details, meta = {}) => {
  logger.warn('Security event', {
    event,
    details,
    ...meta
  });
};

// Business logic logging
const logBusiness = (event, details, meta = {}) => {
  logger.info('Business event', {
    event,
    details,
    ...meta
  });
};

// Database logging
const logDatabase = (operation, collection, duration, meta = {}) => {
  logger.info('Database operation', {
    operation,
    collection,
    duration: `${duration}ms`,
    ...meta
  });
};

// Export logger and utilities
module.exports = {
  logger,
  apiLogger,
  whatsappLogger,
  paymentLogger,
  aiLogger,
  logAPI,
  logWhatsApp,
  logPayment,
  logAI,
  requestLogger,
  errorLogger,
  logPerformance,
  logSecurity,
  logBusiness,
  logDatabase
}; 