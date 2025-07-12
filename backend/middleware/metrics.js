const promClient = require('prom-client');
const promBundle = require('express-prom-bundle');

// Create Prometheus metrics
const metrics = {
  // HTTP request metrics
  httpRequestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),

  httpRequestTotal: new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  // Database metrics
  dbQueryDuration: new promClient.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  }),

  dbQueryTotal: new promClient.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'collection', 'status']
  }),

  // WhatsApp metrics
  whatsappMessageTotal: new promClient.Counter({
    name: 'whatsapp_messages_total',
    help: 'Total number of WhatsApp messages',
    labelNames: ['direction', 'status']
  }),

  whatsappConnectionStatus: new promClient.Gauge({
    name: 'whatsapp_connection_status',
    help: 'WhatsApp connection status (1 = connected, 0 = disconnected)',
    labelNames: ['user_id']
  }),

  // AI metrics
  aiRequestDuration: new promClient.Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duration of AI requests in seconds',
    labelNames: ['service', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
  }),

  aiRequestTotal: new promClient.Counter({
    name: 'ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['service', 'operation', 'status']
  }),

  // Payment metrics
  paymentTotal: new promClient.Counter({
    name: 'payments_total',
    help: 'Total number of payments',
    labelNames: ['status', 'amount_range']
  }),

  paymentAmount: new promClient.Histogram({
    name: 'payment_amount',
    help: 'Payment amounts',
    labelNames: ['currency'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
  }),

  // Lead metrics
  leadTotal: new promClient.Counter({
    name: 'leads_total',
    help: 'Total number of leads',
    labelNames: ['source', 'status']
  }),

  leadScore: new promClient.Histogram({
    name: 'lead_score',
    help: 'Lead scores',
    labelNames: ['source'],
    buckets: [0, 25, 50, 75, 100]
  }),

  // User metrics
  userTotal: new promClient.Gauge({
    name: 'users_total',
    help: 'Total number of users',
    labelNames: ['plan_type', 'status']
  }),

  userRegistrationTotal: new promClient.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['source']
  }),

  // System metrics
  memoryUsage: new promClient.Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type']
  }),

  cpuUsage: new promClient.Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage'
  }),

  // Error metrics
  errorTotal: new promClient.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route']
  })
};

// Prometheus bundle middleware
const promMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: 'aiagentcrm' },
  promClient: {
    collectDefaultMetrics: {
      timeout: 5000
    }
  }
});

// Custom metrics middleware
const customMetricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Record request metrics
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };

    metrics.httpRequestDuration.observe(labels, duration);
    metrics.httpRequestTotal.inc(labels);

    // Record error metrics
    if (res.statusCode >= 400) {
      metrics.errorTotal.inc({
        type: res.statusCode >= 500 ? 'server_error' : 'client_error',
        route: req.route?.path || req.path
      });
    }
  });

  next();
};

// Database metrics middleware
const dbMetricsMiddleware = (operation, collection) => {
  return (req, res, next) => {
    const start = Date.now();

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = (Date.now() - start) / 1000;
      const status = res.statusCode < 400 ? 'success' : 'error';

      metrics.dbQueryDuration.observe({
        operation,
        collection
      }, duration);

      metrics.dbQueryTotal.inc({
        operation,
        collection,
        status
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

// WhatsApp metrics helper
const recordWhatsAppMetrics = (direction, status, userId = null) => {
  metrics.whatsappMessageTotal.inc({ direction, status });
  
  if (userId) {
    metrics.whatsappConnectionStatus.set({ user_id: userId }, status === 'connected' ? 1 : 0);
  }
};

// AI metrics helper
const recordAIMetrics = (service, operation, duration, status) => {
  metrics.aiRequestDuration.observe({ service, operation }, duration);
  metrics.aiRequestTotal.inc({ service, operation, status });
};

// Payment metrics helper
const recordPaymentMetrics = (status, amount, currency) => {
  const amountRange = amount < 1000 ? 'low' : amount < 10000 ? 'medium' : 'high';
  
  metrics.paymentTotal.inc({ status, amount_range: amountRange });
  metrics.paymentAmount.observe({ currency }, amount);
};

// Lead metrics helper
const recordLeadMetrics = (source, status, score = null) => {
  metrics.leadTotal.inc({ source, status });
  
  if (score !== null) {
    metrics.leadScore.observe({ source }, score);
  }
};

// User metrics helper
const recordUserMetrics = (planType, status) => {
  metrics.userTotal.inc({ plan_type: planType, status });
};

// System metrics collection
const collectSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  metrics.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
  metrics.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
  metrics.memoryUsage.set({ type: 'external' }, memUsage.external);
  metrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
};

// Start system metrics collection
setInterval(collectSystemMetrics, 30000); // Every 30 seconds

// Export metrics
module.exports = {
  metrics,
  promMiddleware,
  customMetricsMiddleware,
  dbMetricsMiddleware,
  recordWhatsAppMetrics,
  recordAIMetrics,
  recordPaymentMetrics,
  recordLeadMetrics,
  recordUserMetrics,
  collectSystemMetrics
}; 