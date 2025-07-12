import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import {
  Box, Badge, IconButton, Popover, Paper, Typography, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Divider, Button, Chip, Fade, Snackbar, Alert, Stack,
  Tab, Tabs, Switch, FormControlLabel, TextField, CircularProgress, Menu, MenuItem,
  Skeleton, Tooltip, LinearProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Campaign as CampaignIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  Celebration as CelebrationIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  NotificationsActive as NotificationsActiveIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Circle as CircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Enhanced styled components
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#ff4444',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const NotificationPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    maxWidth: 420,
    maxHeight: 600,
    background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  },
}));

const NotificationItem = styled(ListItem)(({ theme, unread, priority }) => ({
  borderRadius: 12,
  marginBottom: theme.spacing(1),
  backgroundColor: unread ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  border: unread ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : '1px solid transparent',
  borderLeft: priority === 'high' ? `4px solid ${theme.palette.error.main}` :
               priority === 'medium' ? `4px solid ${theme.palette.warning.main}` :
               `4px solid ${alpha(theme.palette.info.main, 0.3)}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    transform: 'translateX(4px)',
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  '&:last-child': {
    marginBottom: 0,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: priority === 'high' ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})` :
                priority === 'medium' ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})` :
                'transparent',
    opacity: unread ? 1 : 0,
  },
}));

function getNotificationIcon(type) {
  const icons = {
    message: <MessageIcon />,
    lead: <PersonIcon />,
    task: <AssignmentIcon />,
    campaign: <CampaignIcon />,
    payment: <PaymentIcon />,
    security: <SecurityIcon />,
    system: <UpdateIcon />,
    success: <CheckCircleIcon />,
    warning: <WarningIcon />,
    error: <ErrorIcon />,
    info: <InfoIcon />,
    whatsapp: <WhatsAppIcon />,
    email: <EmailIcon />,
    phone: <PhoneIcon />,
    analytics: <TrendingUpIcon />,
    celebration: <CelebrationIcon />,
    workflow: <AssignmentIcon />,
    followup: <ScheduleIcon />,
  };
  return icons[type] || <InfoIcon />;
}

function getNotificationColor(type) {
  const colors = {
    message: '#2196F3',
    lead: '#4CAF50',
    task: '#FF9800',
    campaign: '#9C27B0',
    payment: '#4CAF50',
    security: '#F44336',
    system: '#607D8B',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    whatsapp: '#25D366',
    email: '#EA4335',
    phone: '#2196F3',
    analytics: '#9C27B0',
    celebration: '#FFD700',
    workflow: '#795548',
    followup: '#FF5722',
  };
  return colors[type] || '#2196F3';
}

const LoadingSkeleton = () => (
  <Box sx={{ p: 2 }}>
    {[1, 2, 3].map((i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </Box>
      </Box>
    ))}
  </Box>
);

const NotificationSystem = ({ showToastNotifications = true }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessages, setToastMessages] = useState([]);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    autoMarkAsRead: false,
  });

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['notifications'],
    () => apiService.getNotifications({ limit: 50 }),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (error) => {
        console.error('Failed to fetch notifications:', error);
      }
    }
  );

  // Real-time notification handling
  useEffect(() => {
    if (isAuthenticated && apiService.socket) {
      const handleNotification = (notification) => {
        console.log('📢 New notification received:', notification);
        
        // Invalidate and refetch notifications
        queryClient.invalidateQueries(['notifications']);
        
        // Show toast if enabled
        if (showToastNotifications) {
          addToast(notification.title || notification.message, notification.type || 'info', {
            duration: 5000,
            action: notification.actionUrl ? () => window.location.href = notification.actionUrl : null
          });
        }

        // Desktop notification
        if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title || 'New Notification', {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification._id
          });
        }

        // Sound notification
        if (settings.soundEnabled) {
          playNotificationSound();
        }
      };

      apiService.addEventListener('notification', handleNotification);

      return () => {
        apiService.removeEventListener('notification', handleNotification);
      };
    }
  }, [isAuthenticated, showToastNotifications, settings, queryClient]);

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.desktopNotifications]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.warn('Could not play notification sound:', e));
    } catch (error) {
      console.warn('Notification sound not available:', error);
    }
  };

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 4000,
      action: options.action,
      ...options
    };

    setToastMessages(prev => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        setToastMessages(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToastMessages(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTabFilter = (tab) => {
    switch (tab) {
      case 0: return null; // All
      case 1: return { read: false }; // Unread
      case 2: return { type: 'message' }; // Messages
      case 3: return { type: 'task' }; // Tasks
      default: return null;
    }
  };

  const filteredNotifications = notifications?.data?.filter(notification => {
    const tabFilter = getTabFilter(tabValue);
    const matchesTab = !tabFilter || Object.entries(tabFilter).every(([key, value]) => notification[key] === value);
    const matchesSearch = !searchQuery || 
      notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  }) || [];

  const unreadCount = notifications?.data?.filter(n => !n.read).length || 0;

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      addToast('Failed to mark notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      queryClient.invalidateQueries(['notifications']);
      addToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      addToast('Failed to mark all notifications as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      queryClient.invalidateQueries(['notifications']);
      addToast('Notification deleted', 'success');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      addToast('Failed to delete notification', 'error');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await apiService.clearAllNotifications();
      queryClient.invalidateQueries(['notifications']);
      addToast('All notifications cleared', 'success');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      addToast('Failed to clear all notifications', 'error');
    }
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <Tooltip title="Notifications">
        <IconButton
          onClick={handlePopoverOpen}
          size="large"
          aria-label="show notifications"
          color="inherit"
        >
          <StyledBadge badgeContent={unreadCount} max={99}>
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
          </StyledBadge>
        </IconButton>
      </Tooltip>

      {/* Notification Popover */}
      <NotificationPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400 }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">
                Notifications
              </Typography>
              <Box display="flex" gap={1}>
                <Tooltip title="Settings">
                  <IconButton size="small" onClick={handleSettingsOpen}>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => refetch()}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                {unreadCount > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={markAllAsRead}>
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mt: 1 }}
            />

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="fullWidth"
              sx={{ mt: 1 }}
            >
              <Tab label="All" />
              <Tab label="Unread" />
              <Tab label="Messages" />
              <Tab label="Tasks" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {isLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">Failed to load notifications</Typography>
                <Button size="small" onClick={() => refetch()} sx={{ mt: 1 }}>
                  Retry
                </Button>
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  {searchQuery ? 'No matching notifications' : 'No notifications'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    unread={!notification.read}
                    priority={notification.priority}
                    button
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                            {notification.priority && (
                              <Chip
                                size="small"
                                label={notification.priority}
                                color={
                                  notification.priority === 'high' ? 'error' :
                                  notification.priority === 'medium' ? 'warning' : 'default'
                                }
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </NotificationItem>
                ))}
              </List>
            )}
          </Box>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Button
                size="small"
                color="error"
                onClick={clearAllNotifications}
                startIcon={<ClearIcon />}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Box>
      </NotificationPopover>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notification Settings
          </Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                />
              }
              label="Sound notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.desktopNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                />
              }
              label="Desktop notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoMarkAsRead}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoMarkAsRead: e.target.checked }))}
                />
              }
              label="Auto-mark as read"
            />
          </Stack>
        </Box>
      </Menu>

      {/* Toast Messages */}
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxWidth: 400,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toastMessages.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <Alert
                severity={toast.type}
                onClose={() => removeToast(toast.id)}
                action={
                  toast.action && (
                    <Button color="inherit" size="small" onClick={toast.action}>
                      View
                    </Button>
                  )
                }
                sx={{
                  pointerEvents: 'auto',
                  boxShadow: 3,
                  borderRadius: 2,
                }}
              >
                {toast.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </>
  );
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [toastMessages, setToastMessages] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 4000,
      action: options.action,
      ...options
    };

    setToastMessages(prev => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        setToastMessages(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToastMessages(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => addToast(message, 'success', options), [addToast]);
  const error = useCallback((message, options = {}) => addToast(message, 'error', options), [addToast]);
  const info = useCallback((message, options = {}) => addToast(message, 'info', options), [addToast]);
  const warning = useCallback((message, options = {}) => addToast(message, 'warning', options), [addToast]);

  const value = {
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    toastMessages,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 