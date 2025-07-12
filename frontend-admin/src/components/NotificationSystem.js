import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Paper,
  Slide,
  Fade,
  Collapse,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  PersonAdd as UserIcon,
  Payment as PaymentIcon,
  TrendingUp as MetricIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import apiService from '../services/api';

// Create notification context
const NotificationContext = createContext();

// Enhanced styled components
const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
        opacity: 1,
      },
      '50%': {
        transform: 'scale(1.1)',
        opacity: 0.8,
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
  },
}));

const NotificationPanel = styled(Paper)(({ theme }) => ({
  width: 400,
  maxHeight: 600,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.shadows[8],
  borderRadius: theme.spacing(2),
}));

const NotificationItem = styled(ListItem)(({ theme, priority, isRead }) => ({
  borderLeft: `4px solid ${getPriorityColor(priority, theme)}`,
  backgroundColor: isRead 
    ? 'transparent' 
    : alpha(theme.palette.primary.main, 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateX(4px)',
  },
  opacity: isRead ? 0.7 : 1,
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => ({
  backgroundColor: getPriorityColor(priority, theme),
  color: theme.palette.getContrastText(getPriorityColor(priority, theme)),
  fontWeight: 600,
  fontSize: '0.75rem',
}));

// Helper function to get priority colors
function getPriorityColor(priority, theme) {
  switch (priority) {
    case 'critical':
      return theme.palette.error.main;
    case 'high':
      return theme.palette.warning.main;
    case 'medium':
      return theme.palette.info.main;
    case 'low':
      return theme.palette.success.main;
    default:
      return theme.palette.grey[400];
  }
}

// Notification types configuration
const NOTIFICATION_TYPES = {
  security_alert: {
    icon: SecurityIcon,
    title: 'Security Alert',
    color: 'error',
    sound: true,
    priority: 'critical'
  },
  system_warning: {
    icon: WarningIcon,
    title: 'System Warning',
    color: 'warning',
    sound: true,
    priority: 'high'
  },
  user_registered: {
    icon: UserIcon,
    title: 'New User',
    color: 'success',
    sound: false,
    priority: 'low'
  },
  payment_received: {
    icon: PaymentIcon,
    title: 'Payment Received',
    color: 'success',
    sound: false,
    priority: 'medium'
  },
  payment_failed: {
    icon: ErrorIcon,
    title: 'Payment Failed',
    color: 'error',
    sound: true,
    priority: 'high'
  },
  metric_threshold: {
    icon: MetricIcon,
    title: 'Metric Alert',
    color: 'warning',
    sound: true,
    priority: 'medium'
  },
  system_info: {
    icon: InfoIcon,
    title: 'System Info',
    color: 'info',
    sound: false,
    priority: 'low'
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    filters: {
      security: true,
      system: true,
      users: true,
      payments: true,
      metrics: true
    },
    priority: 'medium' // minimum priority to show
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHide: true
  });

  // Load notifications and settings on mount
  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
    
    // Set up real-time notifications
    const eventSource = new EventSource('/api/admin/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      handleNewNotification(notification);
    };

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close();
        // Recreate connection
      }, 5000);
    };

    // Request desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      eventSource.close();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiService.get('/admin/notifications', {
        limit: 50,
        includeRead: true
      });
      
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await apiService.get('/admin/notifications/settings');
      if (response.success) {
        setSettings(prev => ({ ...prev, ...response.settings }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const handleNewNotification = useCallback((notification) => {
    const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system_info;
    
    // Check if notification should be shown based on settings
    if (!shouldShowNotification(notification)) {
      return;
    }

    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show snackbar for high priority notifications
    if (config.priority === 'critical' || config.priority === 'high') {
      showSnackbar(notification.message, config.color, false);
    }

    // Play sound if enabled
    if (settings.sound && config.sound) {
      playNotificationSound(config.priority);
    }

    // Show desktop notification if enabled and permission granted
    if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      showDesktopNotification(notification, config);
    }
  }, [settings]);

  const shouldShowNotification = (notification) => {
    if (!settings.enabled) return false;
    
    const config = NOTIFICATION_TYPES[notification.type];
    if (!config) return true;

    // Check priority filter
    const priorityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const notificationLevel = priorityLevels[config.priority] || 1;
    const settingsLevel = priorityLevels[settings.priority] || 1;
    
    if (notificationLevel < settingsLevel) return false;

    // Check category filters
    const category = getCategoryFromType(notification.type);
    return settings.filters[category] !== false;
  };

  const getCategoryFromType = (type) => {
    if (type.includes('security')) return 'security';
    if (type.includes('system')) return 'system';
    if (type.includes('user')) return 'users';
    if (type.includes('payment')) return 'payments';
    if (type.includes('metric')) return 'metrics';
    return 'system';
  };

  const playNotificationSound = (priority) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const frequency = priority === 'critical' ? 800 : priority === 'high' ? 600 : 400;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const showDesktopNotification = (notification, config) => {
    const desktopNotification = new Notification(config.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: config.priority === 'critical'
    });

    desktopNotification.onclick = () => {
      window.focus();
      markAsRead(notification.id);
      desktopNotification.close();
    };

    // Auto-close after 10 seconds for non-critical notifications
    if (config.priority !== 'critical') {
      setTimeout(() => {
        desktopNotification.close();
      }, 10000);
    }
  };

  const showSnackbar = (message, severity = 'info', autoHide = true) => {
    setSnackbar({
      open: true,
      message,
      severity,
      autoHide
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.put(`/admin/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/admin/notifications/read-all');
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiService.delete(`/admin/notifications/${notificationId}`);
      
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
      
      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await apiService.put('/admin/notifications/settings', newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    showSnackbar,
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Global snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 6000 : null}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={hideSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system_info;
    const IconComponent = config.icon;
    return <IconComponent />;
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          size="large"
          color="inherit"
        >
          <NotificationBadge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </NotificationBadge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          component: NotificationPanel,
          elevation: 8
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<MarkReadIcon />}
              >
                Mark All Read
              </Button>
            )}
          </Box>
          
          {/* Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['all', 'unread', 'read'].map((filterType) => (
              <Chip
                key={filterType}
                label={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                size="small"
                variant={filter === filterType ? 'filled' : 'outlined'}
                onClick={() => setFilter(filterType)}
                color={filter === filterType ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications found
              </Typography>
            </Box>
          ) : (
            <List dense>
              {filteredNotifications.map((notification, index) => {
                const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system_info;
                
                return (
                  <React.Fragment key={notification.id}>
                    <NotificationItem
                      priority={config.priority}
                      isRead={notification.isRead}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{ 
                            bgcolor: getPriorityColor(config.priority, { palette: { error: { main: '#f44336' }, warning: { main: '#ff9800' }, info: { main: '#2196f3' }, success: { main: '#4caf50' }, grey: { 400: '#bdbdbd' } } }),
                            width: 32,
                            height: 32
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                              {config.title}
                            </Typography>
                            <PriorityChip
                              label={config.priority}
                              priority={config.priority}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </NotificationItem>
                    
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => {
              handleClose();
              // Open notification settings dialog
            }}
          >
            Notification Settings
          </Button>
        </Box>
      </Menu>
    </>
  );
};

// Notification Settings Component
export const NotificationSettings = ({ open, onClose }) => {
  const { settings, updateSettings } = useContext(NotificationContext);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notification Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, space: 2 }}>
          {/* General Settings */}
          <Typography variant="h6" gutterBottom>
            General
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enabled}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              />
            }
            label="Enable notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.sound}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, sound: e.target.checked }))}
              />
            }
            label="Sound notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.desktop}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, desktop: e.target.checked }))}
              />
            }
            label="Desktop notifications"
          />

          {/* Priority Filter */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Minimum Priority</InputLabel>
            <Select
              value={localSettings.priority}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, priority: e.target.value }))}
              label="Minimum Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical Only</MenuItem>
            </Select>
          </FormControl>

          {/* Category Filters */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Categories
          </Typography>
          
          {Object.entries(localSettings.filters).map(([category, enabled]) => (
            <FormControlLabel
              key={category}
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      [category]: e.target.checked
                    }
                  }))}
                />
              }
              label={category.charAt(0).toUpperCase() + category.slice(1)}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 