import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Drafts as DraftsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SystemNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetUsers: 'all',
    selectedUsers: [],
    sendEmail: true,
    sendInApp: true,
    scheduledFor: '',
    isScheduled: false,
  });

  const notificationTypes = [
    { value: 'info', label: 'Information', icon: <InfoIcon />, color: '#3B82F6' },
    { value: 'success', label: 'Success', icon: <CheckCircleIcon />, color: '#10B981' },
    { value: 'warning', label: 'Warning', icon: <WarningIcon />, color: '#F59E0B' },
    { value: 'error', label: 'Error', icon: <ErrorIcon />, color: '#EF4444' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users', icon: <PublicIcon /> },
    { value: 'specific', label: 'Specific Users', icon: <PersonIcon /> },
    { value: 'plan', label: 'By Plan', icon: <GroupIcon /> },
    { value: 'active', label: 'Active Users Only', icon: <CheckCircleIcon /> },
  ];

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingNotification) {
        await api.put(`/admin/notifications/${editingNotification._id}`, formData);
      } else {
        await api.post('/admin/notifications', formData);
      }
      setOpenDialog(false);
      setEditingNotification(null);
      resetForm();
      loadNotifications();
    } catch (err) {
      console.error('Error saving notification:', err);
    }
  };

  const handleSendNow = async (notificationId) => {
    try {
      await api.post(`/admin/notifications/${notificationId}/send`);
      loadNotifications();
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      priority: notification.priority || 'normal',
      targetUsers: notification.targetUsers || 'all',
      selectedUsers: notification.selectedUsers || [],
      sendEmail: notification.sendEmail !== false,
      sendInApp: notification.sendInApp !== false,
      scheduledFor: notification.scheduledFor || '',
      isScheduled: notification.isScheduled || false,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await api.delete(`/admin/notifications/${notificationId}`);
        loadNotifications();
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      targetUsers: 'all',
      selectedUsers: [],
      sendEmail: true,
      sendInApp: true,
      scheduledFor: '',
      isScheduled: false,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    resetForm();
  };

  const getNotificationIcon = (type) => {
    const notificationType = notificationTypes.find(t => t.value === type);
    return notificationType ? notificationType.icon : <InfoIcon />;
  };

  const getNotificationColor = (type) => {
    const notificationType = notificationTypes.find(t => t.value === type);
    return notificationType ? notificationType.color : '#6B7280';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'scheduled':
        return 'warning';
      case 'failed':
        return 'error';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          System Notifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Send Notification
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="All Notifications" />
            <Tab label="Scheduled" />
            <Tab label="Templates" />
            <Tab label="Analytics" />
          </Tabs>

          {selectedTab === 0 && (
            <>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Notification</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {notification.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {notification.message.length > 50
                                  ? `${notification.message.substring(0, 50)}...`
                                  : notification.message}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ color: getNotificationColor(notification.type) }}>
                                {getNotificationIcon(notification.type)}
                              </Box>
                              <Typography variant="body2">
                                {notificationTypes.find(t => t.value === notification.type)?.label}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={notification.targetUsers === 'all' ? 'All Users' : `${notification.selectedUsers?.length || 0} Users`}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={notification.priority}
                              color={getPriorityColor(notification.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={notification.status}
                              color={getStatusColor(notification.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              {notification.status === 'draft' && (
                                <>
                                  <Tooltip title="Send Now">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleSendNow(notification._id)}
                                    >
                                      <SendIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEdit(notification)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(notification._id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Scheduled Notifications
              </Typography>
              <List>
                {notifications.filter(n => n.status === 'scheduled').map((notification) => (
                  <ListItem key={notification._id}>
                    <ListItemIcon sx={{ color: getNotificationColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={`Scheduled for: ${new Date(notification.scheduledFor).toLocaleString()}`}
                    />
                    <Chip
                      label={notification.priority}
                      color={getPriorityColor(notification.priority)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notification Templates
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Welcome Message
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Welcome to Ai Agentic CRM! We're excited to help you grow your business.
                      </Typography>
                      <Button size="small" variant="outlined">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Plan Upgrade
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Upgrade your plan to unlock more features and increase your limits.
                      </Typography>
                      <Button size="small" variant="outlined">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notification Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Total Sent
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {notifications.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Read Rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        87%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Scheduled
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {notifications.filter(n => n.status === 'scheduled').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNotification ? 'Edit Notification' : 'Send Notification'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your notification message..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Users</InputLabel>
                <Select
                  value={formData.targetUsers}
                  onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                  label="Target Users"
                >
                  {targetOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.targetUsers === 'specific' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Users
                </Typography>
                <FormGroup row>
                  {users.map((user) => (
                    <FormControlLabel
                      key={user._id}
                      control={
                        <Checkbox
                          checked={formData.selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            const updatedUsers = e.target.checked
                              ? [...formData.selectedUsers, user._id]
                              : formData.selectedUsers.filter(id => id !== user._id);
                            setFormData({ ...formData, selectedUsers: updatedUsers });
                          }}
                        />
                      }
                      label={user.name || user.email}
                    />
                  ))}
                </FormGroup>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Schedule For"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!formData.isScheduled}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isScheduled}
                    onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                  />
                }
                label="Schedule Notification"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Delivery Options
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    />
                  }
                  label="Send Email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.sendInApp}
                      onChange={(e) => setFormData({ ...formData, sendInApp: e.target.checked })}
                    />
                  }
                  label="In-App Notification"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNotification ? 'Update' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemNotifications; 