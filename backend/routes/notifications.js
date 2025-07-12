const express = require('express');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// WebSocket notification emitter
const emitNotification = (req, notification) => {
  if (req.app.get('io')) {
    req.app.get('io').to(`user_${req.user._id}`).emit('notification', notification);
  }
};

// GET /api/notifications - Get user notifications with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = '', 
      priority = '', 
      status = 'unread',
      startDate,
      endDate
    } = req.query;

    const filter = { user: req.user._id };
    
    // Type filter
    if (type) {
      filter.type = type;
    }
    
    // Priority filter
    if (priority) {
      filter.priority = priority;
    }
    
    // Status filter
    if (status && status !== 'all') {
      filter.read = status === 'read';
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedLead', 'name email')
        .populate('relatedTask', 'title')
        .populate('relatedWorkflow', 'name'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, read: false })
    ]);
    
    // Group notifications by type for summary
    const notificationSummary = await Notification.aggregate([
      { $match: { user: req.user._id, read: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          latestNotification: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
      notifications,
      pagination: {
        currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        },
        summary: {
          unreadCount,
          notificationSummary
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      relatedLead,
      relatedTask,
      relatedWorkflow,
      actionUrl,
      expiresAt
    } = req.body;
    
    const notification = new Notification({
      user: req.user._id,
      title,
      message,
      type,
      priority,
      relatedLead,
      relatedTask,
      relatedWorkflow,
      actionUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    await notification.save();
    
    // Populate related fields for response
    await notification.populate([
      { path: 'relatedLead', select: 'name email' },
      { path: 'relatedTask', select: 'title' },
      { path: 'relatedWorkflow', select: 'name' }
    ]);
    
    // Emit real-time notification
    emitNotification(req, notification);
    
    // Log notification creation
    logger.info(`Notification created for user ${req.user._id}:`, {
      notificationId: notification._id,
      type: notification.type,
      priority: notification.priority
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    ).populate([
      { path: 'relatedLead', select: 'name email' },
      { path: 'relatedTask', select: 'title' },
      { path: 'relatedWorkflow', select: 'name' }
    ]);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Emit real-time update
    emitNotification(req, { ...notification.toObject(), action: 'read' });

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    // Emit real-time update
    emitNotification(req, { 
      action: 'mark_all_read', 
      modifiedCount: result.modifiedCount 
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Emit real-time update
    emitNotification(req, { 
      action: 'delete', 
      notificationId: req.params.id 
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user._id
    });
    
    // Emit real-time update
    emitNotification(req, { 
      action: 'clear_all', 
      deletedCount: result.deletedCount 
    });
    
    res.json({
      success: true,
      message: `${result.deletedCount} notifications cleared`
    });
  } catch (error) {
    logger.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all notifications'
    });
  }
});

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      preferences: user.notificationSettings || {
        email: {
          newLead: true,
          taskReminder: true,
          workflowComplete: true,
          paymentReceived: true
        },
        push: {
          newLead: true,
          taskReminder: true,
          workflowComplete: false,
          paymentReceived: true
        },
        sms: {
          newLead: false,
          taskReminder: false,
          workflowComplete: false,
          paymentReceived: true
        }
      }
    });
  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const { email, push, sms, whatsapp } = req.body;
    
    const updateData = {};
    
    if (email) {
      Object.keys(email).forEach(key => {
        updateData[`notificationSettings.email.${key}`] = email[key];
      });
    }
    
    if (push) {
      Object.keys(push).forEach(key => {
        updateData[`notificationSettings.push.${key}`] = push[key];
      });
    }
    
    if (sms) {
      Object.keys(sms).forEach(key => {
        updateData[`notificationSettings.sms.${key}`] = sms[key];
      });
    }
    
    if (whatsapp) {
      Object.keys(whatsapp).forEach(key => {
        updateData[`notificationSettings.whatsapp.${key}`] = whatsapp[key];
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('notificationSettings');
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationSettings
    });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = { user: req.user._id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      dailyNotifications
    ] = await Promise.all([
      Notification.countDocuments(dateFilter),
      Notification.countDocuments({ ...dateFilter, read: false }),
      Notification.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          total: totalNotifications,
          unread: unreadNotifications,
          readRate: totalNotifications > 0 ? 
            ((totalNotifications - unreadNotifications) / totalNotifications * 100).toFixed(2) : 0
        },
        breakdown: {
          byType: notificationsByType,
          byPriority: notificationsByPriority
        },
        trends: {
          daily: dailyNotifications
        }
      }
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
});

// POST /api/notifications/test - Send test notification (for testing)
router.post('/test', async (req, res) => {
  try {
    const { type = 'info', priority = 'medium' } = req.body;
    
    const testNotification = new Notification({
      user: req.user._id,
      title: 'Test Notification',
      message: `This is a test notification of type ${type} with priority ${priority}`,
      type,
      priority
    });

    await testNotification.save();
    
    // Emit real-time notification
    emitNotification(req, testNotification);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      notification: testNotification
    });
  } catch (error) {
    logger.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// Utility function to create and emit notification
const createNotification = async (io, userId, notificationData) => {
  try {
    const notification = new Notification({
      user: userId,
      ...notificationData
    });
    
    await notification.save();
    
    // Populate related fields
    await notification.populate([
      { path: 'relatedLead', select: 'name email' },
      { path: 'relatedTask', select: 'title' },
      { path: 'relatedWorkflow', select: 'name' }
    ]);
    
    // Emit real-time notification
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    logger.error('Create notification error:', error);
    throw error;
  }
};

// Export utility function for use in other modules
router.createNotification = createNotification;

module.exports = router; 
