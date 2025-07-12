import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Badge,
  Avatar,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  TextField,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Alert,
  Snackbar,
  Checkbox,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Task as TaskIcon,
  Message as MessageIcon,
  Event as EventIcon,
  Campaign as CampaignIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  MarkAsRead as MarkAsReadIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Archive as ArchiveIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Schedule as ScheduleIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { styled, alpha } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

// Styled components
const NotificationCard = styled(Card)(({ theme, isRead, priority }) => ({
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  borderLeft: `4px solid ${
    priority === 'high' ? theme.palette.error.main :
    priority === 'medium' ? theme.palette.warning.main :
    theme.palette.info.main
  }`,
  backgroundColor: isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
  '&:hover': {
    transform: 'translateX(4px)',
    boxShadow: theme.shadows[4],
  },
}));

const NotificationBell = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    animation: 'pulse 2s infinite',
  },
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
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => {
  const getColors = () => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
        };
      case 'medium':
        return {
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        };
      default:
        return {
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.main,
          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
        };
    }
  };

  return {
    ...getColors(),
    fontWeight: 600,
    fontSize: '0.75rem',
  };
});

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const NotificationCenter = ({ open, onClose, anchorEl }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState({ open: false, anchorEl: null, notification: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Notification preferences
  const [preferences, setPreferences] = useState({
    sound: true,
    desktop: true,
    email: {
      leads: true,
      tasks: true,
      messages: true,
      system: false
    },
    priority: {
      high: true,
      medium: true,
      low: false
    },
    autoMarkRead: false,
    groupSimilar: true
  });

  // API Queries
  const {
    data: notificationsResponse,
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useQuery(
    ['notifications', filters, searchTerm, sortBy],
    () => apiService.getNotifications({
      ...filters,
      search: searchTerm,
      sort: sortBy,
      limit: 50
    }),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      onSuccess: (data) => {
        // Play sound for new notifications if enabled
        if (preferences.sound && data?.hasNew) {
          playNotificationSound();
        }
        
        // Show desktop notification if enabled
        if (preferences.desktop && data?.latest && !document.hidden) {
          showDesktopNotification(data.latest);
        }
      }
    }
  );

  const {
    data: notificationStats,
    isLoading: statsLoading
  } = useQuery(
    ['notification-stats'],
    () => apiService.getNotificationStats(),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  // Mutations
  const markAsReadMutation = useMutation(
    (notificationIds) => apiService.markNotificationsAsRead(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notification-stats']);
      }
    }
  );

  const markAllAsReadMutation = useMutation(
    () => apiService.markAllNotificationsAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notification-stats']);
        setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
      }
    }
  );

  const deleteNotificationMutation = useMutation(
    (notificationIds) => apiService.deleteNotifications(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notification-stats']);
        setSnackbar({ open: true, message: 'Notifications deleted', severity: 'success' });
      }
    }
  );

  const archiveNotificationMutation = useMutation(
    (notificationIds) => apiService.archiveNotifications(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notification-stats']);
        setSnackbar({ open: true, message: 'Notifications archived', severity: 'success' });
      }
    }
  );

  const updatePreferencesMutation = useMutation(
    (newPreferences) => apiService.updateNotificationPreferences(newPreferences),
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Preferences updated', severity: 'success' });
      }
    }
  );

  // Process data
  const notifications = notificationsResponse?.data || [];
  const unreadCount = notificationStats?.unread || 0;
  const totalCount = notificationStats?.total || 0;

  // Helper functions
  const playNotificationSound = () => {
    if (preferences.sound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {
        // Ignore errors (e.g., user interaction required)
      });
    }
  };

  const showDesktopNotification = (notification) => {
    if (preferences.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            showDesktopNotification(notification);
          }
        });
      }
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      lead: <PersonIcon />,
      task: <TaskIcon />,
      message: <MessageIcon />,
      payment: <MoneyIcon />,
      event: <EventIcon />,
      campaign: <CampaignIcon />,
      security: <SecurityIcon />,
      system: <UpdateIcon />,
      business: <BusinessIcon />
    };
    return iconMap[type] || <InfoIcon />;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    
    const colorMap = {
      lead: 'primary',
      task: 'info',
      message: 'success',
      payment: 'secondary',
      event: 'info',
      campaign: 'primary',
      security: 'error',
      system: 'info'
    };
    return colorMap[type] || 'default';
  };

  const formatNotificationDate = (date) => {
    const notificationDate = new Date(date);
    if (isToday(notificationDate)) {
      return `Today ${format(notificationDate, 'HH:mm')}`;
    } else if (isYesterday(notificationDate)) {
      return `Yesterday ${format(notificationDate, 'HH:mm')}`;
    } else {
      return format(notificationDate, 'MMM dd, HH:mm');
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleNotificationAction = (notification, action) => {
    switch (action) {
      case 'markRead':
        markAsReadMutation.mutate([notification.id]);
        break;
      case 'archive':
        archiveNotificationMutation.mutate([notification.id]);
        break;
      case 'delete':
        deleteNotificationMutation.mutate([notification.id]);
        break;
      case 'star':
        // Toggle star status
        break;
      default:
        break;
    }
    setActionMenu({ open: false, anchorEl: null, notification: null });
  };

  const handleBulkAction = (action) => {
    if (selectedNotifications.length === 0) {
      setSnackbar({ open: true, message: 'Please select notifications first', severity: 'warning' });
      return;
    }

    switch (action) {
      case 'markRead':
        markAsReadMutation.mutate(selectedNotifications);
        break;
      case 'archive':
        archiveNotificationMutation.mutate(selectedNotifications);
        break;
      case 'delete':
        deleteNotificationMutation.mutate(selectedNotifications);
        break;
      default:
        break;
    }
    setSelectedNotifications([]);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
    if (filters.status !== 'all') {
      if (filters.status === 'read' && !notification.isRead) return false;
      if (filters.status === 'unread' && notification.isRead) return false;
    }
    
    return true;
  });

  // Group notifications by type if enabled
  const groupedNotifications = preferences.groupSimilar 
    ? filteredNotifications.reduce((groups, notification) => {
        const key = notification.type;
        if (!groups[key]) groups[key] = [];
        groups[key].push(notification);
        return groups;
      }, {})
    : { all: filteredNotifications };

  const tabCounts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    starred: notifications.filter(n => n.isStarred).length,
    archived: notifications.filter(n => n.isArchived).length
  };

  if (notificationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Notification Bell (for header) */}
      <NotificationBell badgeContent={unreadCount} max={99}>
        <IconButton
          color="inherit"
          onClick={onClose}
          sx={{ 
            color: unreadCount > 0 ? 'error.main' : 'inherit',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
          }}
        >
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </IconButton>
      </NotificationBell>

      {/* Notification Panel */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: 600 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {unreadCount} unread, {totalCount} total
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Settings">
                <IconButton onClick={() => setSettingsDialog(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={refetchNotifications}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Search and Filters */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <TextField
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialog(true)}
                size="small"
              >
                Filter
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="contained"
                  startIcon={<MarkAsReadIcon />}
                  onClick={() => markAllAsReadMutation.mutate()}
                  size="small"
                >
                  Mark All Read
                </Button>
              )}
            </Stack>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    {selectedNotifications.length} selected
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => handleBulkAction('markRead')}
                      color="inherit"
                    >
                      Mark Read
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleBulkAction('archive')}
                      color="inherit"
                    >
                      Archive
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleBulkAction('delete')}
                      color="inherit"
                    >
                      Delete
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedNotifications([])}
                      color="inherit"
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab 
              label={
                <Badge badgeContent={tabCounts.all} color="primary" max={99}>
                  All
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.unread} color="error" max={99}>
                  Unread
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.starred} color="warning" max={99}>
                  Starred
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts.archived} color="info" max={99}>
                  Archived
                </Badge>
              } 
            />
          </Tabs>

          {/* Notifications List */}
          <Box sx={{ height: 400, overflow: 'auto', p: 1 }}>
            {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
              <Box key={type}>
                {preferences.groupSimilar && type !== 'all' && (
                  <Typography variant="subtitle2" sx={{ p: 1, color: 'text.secondary' }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({typeNotifications.length})
                  </Typography>
                )}
                
                {typeNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    isRead={notification.isRead}
                    priority={notification.priority}
                  >
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Checkbox
                          size="small"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                        />
                        
                        <Avatar 
                          sx={{ 
                            bgcolor: `${getNotificationColor(notification.type, notification.priority)}.main`,
                            width: 36,
                            height: 36
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={notification.isRead ? 'normal' : 'bold'}
                              noWrap
                            >
                              {notification.title}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <PriorityChip 
                                label={notification.priority} 
                                size="small" 
                                priority={notification.priority}
                              />
                              {notification.isStarred && (
                                <StarIcon color="warning" fontSize="small" />
                              )}
                            </Stack>
                          </Stack>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {notification.message}
                          </Typography>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              {formatNotificationDate(notification.createdAt)}
                            </Typography>
                            
                            <Stack direction="row" spacing={0.5}>
                              {notification.actionable && (
                                <Button size="small" variant="outlined">
                                  View
                                </Button>
                              )}
                              
                              <IconButton
                                size="small"
                                onClick={(e) => setActionMenu({
                                  open: true,
                                  anchorEl: e.currentTarget,
                                  notification
                                })}
                              >
                                <MoreIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </NotificationCard>
                ))}
              </Box>
            ))}

            {filteredNotifications.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No notifications found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={actionMenu.open}
        onClose={() => setActionMenu({ open: false, anchorEl: null, notification: null })}
      >
        <MenuItem onClick={() => handleNotificationAction(actionMenu.notification, 'markRead')}>
          <ListItemIcon><MarkAsReadIcon fontSize="small" /></ListItemIcon>
          Mark as Read
        </MenuItem>
        <MenuItem onClick={() => handleNotificationAction(actionMenu.notification, 'star')}>
          <ListItemIcon>
            {actionMenu.notification?.isStarred ? 
              <StarIcon fontSize="small" /> : 
              <StarBorderIcon fontSize="small" />
            }
          </ListItemIcon>
          {actionMenu.notification?.isStarred ? 'Unstar' : 'Star'}
        </MenuItem>
        <MenuItem onClick={() => handleNotificationAction(actionMenu.notification, 'archive')}>
          <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
          Archive
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleNotificationAction(actionMenu.notification, 'delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                General
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.sound}
                    onChange={(e) => setPreferences({ ...preferences, sound: e.target.checked })}
                  />
                }
                label="Sound notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.desktop}
                    onChange={(e) => setPreferences({ ...preferences, desktop: e.target.checked })}
                  />
                }
                label="Desktop notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoMarkRead}
                    onChange={(e) => setPreferences({ ...preferences, autoMarkRead: e.target.checked })}
                  />
                }
                label="Auto-mark as read when viewed"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.groupSimilar}
                    onChange={(e) => setPreferences({ ...preferences, groupSimilar: e.target.checked })}
                  />
                }
                label="Group similar notifications"
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Email Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email.leads}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, leads: e.target.checked }
                    })}
                  />
                }
                label="New leads"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email.tasks}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, tasks: e.target.checked }
                    })}
                  />
                }
                label="Task reminders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email.messages}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, messages: e.target.checked }
                    })}
                  />
                }
                label="New messages"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email.system}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, system: e.target.checked }
                    })}
                  />
                }
                label="System updates"
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Priority Filtering
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.priority.high}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      priority: { ...preferences.priority, high: e.target.checked }
                    })}
                  />
                }
                label="High priority notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.priority.medium}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      priority: { ...preferences.priority, medium: e.target.checked }
                    })}
                  />
                }
                label="Medium priority notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.priority.low}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      priority: { ...preferences.priority, low: e.target.checked }
                    })}
                  />
                }
                label="Low priority notifications"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              updatePreferencesMutation.mutate(preferences);
              setSettingsDialog(false);
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
        <DialogTitle>Filter Notifications</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="lead">Leads</MenuItem>
                <MenuItem value="task">Tasks</MenuItem>
                <MenuItem value="message">Messages</MenuItem>
                <MenuItem value="payment">Payments</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFilters({ type: 'all', priority: 'all', status: 'all', dateRange: 'all' })}
          >
            Clear Filters
          </Button>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setFilterDialog(false)}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationCenter; 