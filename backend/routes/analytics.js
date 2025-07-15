const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');
const ApiRequestLog = require('../models/ApiRequestLog');
const SecurityAlert = require('../models/SecurityAlert');
const SystemMetric = require('../models/SystemMetric');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
// Note: adminAuth will be applied selectively to admin-only routes

// ==================== ENHANCED ANALYTICS ENDPOINTS ====================

// GET /api/analytics/dashboard - Dashboard analytics (user-specific or admin-wide)
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getTimeframeStartDate(timeframe);
    const endDate = new Date();
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      // Admin gets system-wide analytics
      const [
        userMetrics,
        revenueMetrics,
        leadMetrics,
        systemMetrics,
        securityMetrics,
        performanceMetrics
      ] = await Promise.all([
        getUserDashboardMetrics(startDate, endDate),
        getRevenueDashboardMetrics(startDate, endDate),
        getLeadDashboardMetrics(startDate, endDate),
        getSystemDashboardMetrics(startDate, endDate),
        getSecurityDashboardMetrics(startDate, endDate),
        getPerformanceDashboardMetrics(startDate, endDate)
      ]);

      // Calculate key performance indicators
      const kpis = {
        userGrowthRate: calculateGrowthRate(userMetrics.new, userMetrics.previousPeriodNew),
        revenueGrowthRate: calculateGrowthRate(revenueMetrics.total, revenueMetrics.previousPeriodTotal),
        conversionRate: leadMetrics.totalLeads > 0 ? (leadMetrics.convertedLeads / leadMetrics.totalLeads * 100) : 0,
        customerAcquisitionCost: revenueMetrics.total > 0 ? (revenueMetrics.marketingSpend / userMetrics.new) : 0,
        averageRevenuePerUser: userMetrics.total > 0 ? (revenueMetrics.total / userMetrics.total) : 0
      };

      res.json({
        success: true,
        timeframe,
        startDate,
        endDate,
        analytics: {
          users: userMetrics,
          revenue: revenueMetrics,
          leads: leadMetrics,
          system: systemMetrics,
          security: securityMetrics,
          performance: performanceMetrics,
          kpis
        }
      });
    } else {
      // Regular user gets personal dashboard data
      const userId = req.user.id;
      
      const [
        userLeads,
        userMessages,
        userTasks,
        userActivities,
        userStats
      ] = await Promise.all([
        Lead.find({ user: userId, createdAt: { $gte: startDate } }).countDocuments(),
        require('../models/Message').find({ user: userId, createdAt: { $gte: startDate } }).countDocuments(),
        require('../models/Task').find({ user: userId, createdAt: { $gte: startDate } }).countDocuments(),
        Activity.find({ user: userId, createdAt: { $gte: startDate } }).countDocuments(),
        Lead.aggregate([
          { $match: { user: userId, createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
              activeLeads: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
              hotLeads: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
            }
          }
        ])
      ]);

      const stats = userStats[0] || { totalLeads: 0, convertedLeads: 0, activeLeads: 0, hotLeads: 0 };
      const conversionRate = stats.totalLeads > 0 ? (stats.convertedLeads / stats.totalLeads * 100) : 0;

      res.json({
        success: true,
        timeframe,
        startDate,
        endDate,
        analytics: {
          leads: {
            total: userLeads,
            converted: stats.convertedLeads,
            active: stats.activeLeads,
            hot: stats.hotLeads,
            conversionRate: conversionRate.toFixed(1)
          },
          messages: { total: userMessages },
          tasks: { total: userTasks },
          activities: { total: userActivities },
          summary: {
            totalLeads: userLeads,
            totalMessages: userMessages,
            totalTasks: userTasks,
            totalActivities: userActivities
          }
        }
      });
    }
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard analytics'
    });
  }
});

// GET /api/analytics/users - Detailed user analytics (Admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { timeframe = '30d', groupBy = 'day' } = req.query;
    const startDate = getTimeframeStartDate(timeframe);

    const analytics = await Promise.all([
      // User registration trends
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: getGroupByDate('$createdAt', groupBy),
            registrations: { $sum: 1 },
            premiumSignups: {
              $sum: { $cond: [{ $ne: ['$plan', null] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // User engagement patterns
      Activity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: getGroupByDate('$createdAt', groupBy),
            totalActivities: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            activityTypes: { $addToSet: '$type' }
          }
        },
        {
          $addFields: {
            uniqueUserCount: { $size: '$uniqueUsers' },
            activityTypeCount: { $size: '$activityTypes' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // User cohort analysis
      getUserCohortAnalysis(startDate),

      // Geographic distribution
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $ifNull: ['$profile.country', 'Unknown'] },
            count: { $sum: 1 },
            premiumUsers: {
              $sum: { $cond: [{ $ne: ['$plan', null] }, 1, 0] }
            },
            avgLifetimeValue: { $avg: '$metrics.lifetimeValue' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),

      // User lifecycle analysis
      User.aggregate([
        {
          $addFields: {
            accountAge: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            },
            daysSinceLastLogin: {
              $divide: [
                { $subtract: [new Date(), { $ifNull: ['$lastLoginAt', '$createdAt'] }] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$accountAge', 7] }, then: 'New (0-7 days)' },
                  { case: { $lt: ['$accountAge', 30] }, then: 'Growing (7-30 days)' },
                  { case: { $lt: ['$accountAge', 90] }, then: 'Established (30-90 days)' },
                  { case: { $gte: ['$accountAge', 90] }, then: 'Mature (90+ days)' }
                ],
                default: 'Unknown'
              }
            },
            count: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $lt: ['$daysSinceLastLogin', 7] }, 1, 0]
              }
            },
            avgAccountAge: { $avg: '$accountAge' },
            avgDaysSinceLastLogin: { $avg: '$daysSinceLastLogin' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        registrationTrends: analytics[0],
        engagementPatterns: analytics[1],
        cohortAnalysis: analytics[2],
        geographic: analytics[3],
        lifecycle: analytics[4]
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user analytics'
    });
  }
});

// GET /api/analytics/revenue - Revenue analytics and forecasting
router.get('/revenue', async (req, res) => {
  try {
    const { timeframe = '30d', groupBy = 'day', includeForecast = false } = req.query;
    const startDate = getTimeframeStartDate(timeframe);

    const analytics = await Promise.all([
      // Revenue trends over time
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startDate } 
          } 
        },
        {
          $group: {
            _id: getGroupByDate('$createdAt', groupBy),
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            refunds: {
              $sum: { $cond: [{ $eq: ['$type', 'refund'] }, '$amount', 0] }
            }
          }
        },
        {
          $addFields: {
            netRevenue: { $subtract: ['$revenue', '$refunds'] },
            averageOrderValue: { $divide: ['$revenue', '$transactions'] },
            uniqueUserCount: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Revenue by subscription plan
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startDate } 
          } 
        },
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
        {
          $group: {
            _id: { $arrayElemAt: ['$planInfo.name', 0] },
            revenue: { $sum: '$amount' },
            subscriptions: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            avgSubscriptionValue: { $avg: '$amount' }
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Monthly Recurring Revenue (MRR) analysis
      User.aggregate([
        {
          $match: {
            'subscription.status': 'active',
            plan: { $ne: null }
          }
        },
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
        {
          $group: {
            _id: { $arrayElemAt: ['$planInfo.name', 0] },
            subscribers: { $sum: 1 },
            mrr: {
              $sum: {
                $divide: [
                  { $arrayElemAt: ['$planInfo.price', 0] },
                  { $cond: [
                    { $eq: [{ $arrayElemAt: ['$planInfo.billingCycle', 0] }, 'monthly'] },
                    1,
                    12
                  ]}
                ]
              }
            }
          }
        }
      ]),

      // Churn analysis with cohorts
      getChurnAnalysis(startDate),

      // Customer lifetime value segments
      User.aggregate([
        { $lookup: { from: 'payments', localField: '_id', foreignField: 'user', as: 'payments' } },
        {
          $addFields: {
            totalSpent: {
              $sum: {
                $map: {
                  input: { $filter: { input: '$payments', cond: { $eq: ['$$this.status', 'completed'] } } },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            subscriptionMonths: {
              $cond: [
                { $and: ['$subscription.startDate', '$subscription.endDate'] },
                {
                  $divide: [
                    { $subtract: ['$subscription.endDate', '$subscription.startDate'] },
                    1000 * 60 * 60 * 24 * 30
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$totalSpent', 0] }, then: 'Free Users' },
                  { case: { $lt: ['$totalSpent', 8000] }, then: '₹1-₹7,999' },
                  { case: { $lt: ['$totalSpent', 40000] }, then: '₹8,000-₹39,999' },
                  { case: { $lt: ['$totalSpent', 80000] }, then: '₹40,000-₹79,999' },
                  { case: { $gte: ['$totalSpent', 80000] }, then: '₹80,000+' }
                ],
                default: 'Unknown'
              }
            },
            count: { $sum: 1 },
            avgLifetimeValue: { $avg: '$totalSpent' },
            avgSubscriptionLength: { $avg: '$subscriptionMonths' },
            totalRevenue: { $sum: '$totalSpent' }
          }
        },
        { $sort: { avgLifetimeValue: -1 } }
      ])
    ]);

    let forecast = null;
    if (includeForecast === 'true') {
      forecast = await generateRevenueForecast(analytics[0]);
    }

    res.json({
      success: true,
      analytics: {
        trends: analytics[0],
        byPlan: analytics[1],
        mrr: analytics[2],
        churn: analytics[3],
        lifetimeValue: analytics[4],
        forecast
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analytics'
    });
  }
});

// GET /api/analytics/performance - System performance analytics
router.get('/performance', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const startDate = getTimeframeStartDate(timeframe);

    const analytics = await Promise.all([
      // API performance metrics
      ApiRequestLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              endpoint: '$endpoint',
              hour: { $hour: '$createdAt' }
            },
            avgResponseTime: { $avg: '$responseTime' },
            totalRequests: { $sum: 1 },
            errors: {
              $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
            },
            p95ResponseTime: { $max: '$responseTime' },
            p50ResponseTime: { $avg: '$responseTime' }
          }
        },
        {
          $group: {
            _id: '$_id.endpoint',
            avgResponseTime: { $avg: '$avgResponseTime' },
            totalRequests: { $sum: '$totalRequests' },
            errors: { $sum: '$errors' },
            p95ResponseTime: { $max: '$p95ResponseTime' },
            hourlyData: {
              $push: {
                hour: '$_id.hour',
                responseTime: '$avgResponseTime',
                requests: '$totalRequests',
                errors: '$errors'
              }
            }
          }
        },
        { $sort: { totalRequests: -1 } },
        { $limit: 20 }
      ]),

      // System resource usage
      SystemMetric.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' },
              minute: { $minute: '$createdAt' }
            },
            avgCpuUsage: { $avg: '$metrics.cpu.usage' },
            avgMemoryUsage: { $avg: '$metrics.memory.usage' },
            avgDiskUsage: { $avg: '$metrics.disk.usage' },
            maxCpuUsage: { $max: '$metrics.cpu.usage' },
            maxMemoryUsage: { $max: '$metrics.memory.usage' }
          }
        },
        { $sort: { '_id.hour': 1, '_id.minute': 1 } }
      ]),

      // Error rate analysis
      ApiRequestLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              statusCategory: {
                $switch: {
                  branches: [
                    { case: { $lt: ['$statusCode', 300] }, then: '2xx-Success' },
                    { case: { $lt: ['$statusCode', 400] }, then: '3xx-Redirect' },
                    { case: { $lt: ['$statusCode', 500] }, then: '4xx-Client Error' },
                    { case: { $gte: ['$statusCode', 500] }, then: '5xx-Server Error' }
                  ],
                  default: 'Unknown'
                }
              }
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        apiPerformance: analytics[0],
        systemResources: analytics[1],
        errorRates: analytics[2]
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance analytics'
    });
  }
});

// Helper functions
function getTimeframeStartDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getGroupByDate(dateField, groupBy) {
  switch (groupBy) {
    case 'hour':
      return {
        year: { $year: dateField },
        month: { $month: dateField },
        day: { $dayOfMonth: dateField },
        hour: { $hour: dateField }
      };
    case 'day':
      return {
        year: { $year: dateField },
        month: { $month: dateField },
        day: { $dayOfMonth: dateField }
      };
    case 'week':
      return {
        year: { $year: dateField },
        week: { $week: dateField }
      };
    case 'month':
      return {
        year: { $year: dateField },
        month: { $month: dateField }
      };
    default:
      return {
        year: { $year: dateField },
        month: { $month: dateField },
        day: { $dayOfMonth: dateField }
      };
  }
}

function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

async function getUserDashboardMetrics(startDate, endDate) {
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  
  const [current, previous] = await Promise.all([
    User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          new: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $count: 'count' }
          ],
          active: [
            { 
              $match: { 
                lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
              } 
            },
            { $count: 'count' }
          ],
          premium: [
            { $match: { plan: { $ne: null } } },
            { $count: 'count' }
          ]
        }
      }
    ]),
    User.aggregate([
      {
        $facet: {
          new: [
            { $match: { createdAt: { $gte: previousStartDate, $lt: startDate } } },
            { $count: 'count' }
          ]
        }
      }
    ])
  ]);

  const currentMetrics = current[0];
  const previousMetrics = previous[0];

  return {
    total: currentMetrics.total[0]?.count || 0,
    new: currentMetrics.new[0]?.count || 0,
    active: currentMetrics.active[0]?.count || 0,
    premium: currentMetrics.premium[0]?.count || 0,
    previousPeriodNew: previousMetrics.new[0]?.count || 0
  };
}

async function getRevenueDashboardMetrics(startDate, endDate) {
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  
  const [current, previous] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }
      }
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: previousStartDate, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const currentMetrics = current[0] || { total: 0, count: 0, avgOrderValue: 0 };
  const previousMetrics = previous[0] || { total: 0 };

  return {
    total: currentMetrics.total,
    transactions: currentMetrics.count,
    averageOrderValue: currentMetrics.avgOrderValue,
    previousPeriodTotal: previousMetrics.total,
    marketingSpend: 5000 // Placeholder - implement actual marketing spend tracking
  };
}

async function getLeadDashboardMetrics(startDate, endDate) {
  const metrics = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        convertedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
        },
        totalValue: { $sum: { $ifNull: ['$value', 0] } },
        convertedValue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'converted'] },
              { $ifNull: ['$value', 0] },
              0
            ]
          }
        }
      }
    }
  ]);

  const result = metrics[0] || {
    totalLeads: 0,
    convertedLeads: 0,
    totalValue: 0,
    convertedValue: 0
  };

  return result;
}

module.exports = router; 
