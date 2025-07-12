import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  FormControlLabel,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Switch,
} from '@mui/material';
import {
  Email,
  Sms,
  WhatsApp,
  Send,
  People,
  Schedule,
  Preview,
  Upload,
  Download,
  FilterList,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const CommunicationCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
}));

const UserCommunication = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Message form state
  const [messageData, setMessageData] = useState({
    type: 'email', // email, sms, whatsapp
    subject: '',
    content: '',
    template: '',
    scheduleDate: null,
    isScheduled: false,
  });

  // Filters
  const [filters, setFilters] = useState({
    plan: '',
    status: '',
    lastActivity: '',
    tags: [],
  });

  // Templates
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Welcome Message', type: 'email', subject: 'Welcome to our platform!', content: 'Welcome to our amazing CRM platform...' },
    { id: 2, name: 'Payment Reminder', type: 'email', subject: 'Payment Due Reminder', content: 'Your subscription payment is due...' },
    { id: 3, name: 'Feature Announcement', type: 'email', subject: 'New Features Available!', content: 'We are excited to announce new features...' },
    { id: 4, name: 'SMS Welcome', type: 'sms', content: 'Welcome to our CRM! Start managing your leads today.' },
    { id: 5, name: 'WhatsApp Onboarding', type: 'whatsapp', content: 'Hi! Welcome to our WhatsApp CRM integration. Reply HELP for assistance.' },
  ]);

  // Campaign history
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Monthly Newsletter', type: 'email', sent: 1250, opened: 756, clicked: 189, date: '2024-01-15' },
    { id: 2, name: 'Product Update', type: 'email', sent: 890, opened: 534, clicked: 156, date: '2024-01-10' },
    { id: 3, name: 'Payment Reminders', type: 'sms', sent: 45, delivered: 43, replied: 12, date: '2024-01-08' },
  ]);

  useEffect(() => {
    loadUsers();
    loadTemplates();
    loadCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allUsers, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      // Mock data for development
      setAllUsers([
        { _id: '1', name: 'John Smith', email: 'john@example.com', phone: '+1234567890', plan: { name: 'Pro' }, subscription: { status: 'active' } },
        { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567891', plan: { name: 'Basic' }, subscription: { status: 'active' } },
        { _id: '3', name: 'Mike Davis', email: 'mike@example.com', phone: '+1234567892', plan: { name: 'Enterprise' }, subscription: { status: 'active' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/communication/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/communication/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || campaigns);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allUsers];

    if (filters.plan) {
      filtered = filtered.filter(user => user.plan?.name === filters.plan);
    }

    if (filters.status) {
      filtered = filtered.filter(user => user.subscription?.status === filters.status);
    }

    setFilteredUsers(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessageData({ ...messageData, type: ['email', 'sms', 'whatsapp'][newValue] });
  };

  const handleUserSelection = (userId, selected) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const handleTemplateSelect = (template) => {
    setMessageData({
      ...messageData,
      subject: template.subject || '',
      content: template.content || '',
      template: template.id,
    });
  };

  const handleSendMessage = async () => {
    if (!messageData.content || selectedUsers.length === 0) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/communication/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: messageData.type,
          subject: messageData.subject,
          content: messageData.content,
          recipients: selectedUsers,
          scheduleDate: messageData.isScheduled ? messageData.scheduleDate : null,
        }),
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setMessageData({ ...messageData, subject: '', content: '', template: '' });
        setSelectedUsers([]);
        loadCampaigns();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'email': return <Email />;
      case 'sms': return <Sms />;
      case 'whatsapp': return <WhatsApp />;
      default: return <Email />;
    }
  };

  const renderUserList = () => (
    <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Recipients ({selectedUsers.length} / {filteredUsers.length})
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
              onChange={handleSelectAll}
            />
          }
          label="Select All"
        />
      </Box>
      
      <List dense>
        {filteredUsers.map((user) => (
          <ListItem key={user._id}>
            <Checkbox
              checked={selectedUsers.includes(user._id)}
              onChange={(e) => handleUserSelection(user._id, e.target.checked)}
            />
            <ListItemAvatar>
              <Avatar>{user.name?.[0] || '?'}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.name}
              secondary={
                <Box>
                  <Typography variant="body2">{user.email}</Typography>
                  <Chip
                    size="small"
                    label={user.plan?.name || 'Free'}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={user.subscription?.status || 'inactive'}
                    color={user.subscription?.status === 'active' ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  const renderMessageComposer = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Compose Message
      </Typography>
      
      {/* Template Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Template (Optional)</InputLabel>
        <Select
          value={messageData.template}
          label="Select Template (Optional)"
          onChange={(e) => {
            const template = templates.find(t => t.id === e.target.value);
            if (template) handleTemplateSelect(template);
          }}
        >
          <MenuItem value="">Custom Message</MenuItem>
          {templates
            .filter(template => template.type === messageData.type)
            .map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* Subject (Email only) */}
      {messageData.type === 'email' && (
        <TextField
          fullWidth
          label="Subject"
          value={messageData.subject}
          onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
          sx={{ mb: 2 }}
        />
      )}

      {/* Message Content */}
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Message Content"
        value={messageData.content}
        onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
        placeholder={`Enter your ${messageData.type} message here...`}
        sx={{ mb: 2 }}
      />

      {/* Scheduling */}
      <FormControlLabel
        control={
          <Switch
            checked={messageData.isScheduled}
            onChange={(e) => setMessageData({ ...messageData, isScheduled: e.target.checked })}
          />
        }
        label="Schedule Message"
        sx={{ mb: 2 }}
      />

      {messageData.isScheduled && (
        <DateTimePicker
          label="Schedule Date & Time"
          value={messageData.scheduleDate}
          onChange={(newDate) => setMessageData({ ...messageData, scheduleDate: newDate })}
          sx={{ mb: 2, width: '100%' }}
        />
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Preview />}
          onClick={() => setPreviewOpen(true)}
          disabled={!messageData.content}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleSendMessage}
          disabled={!messageData.content || selectedUsers.length === 0 || sending}
        >
          {sending ? 'Sending...' : messageData.isScheduled ? 'Schedule' : 'Send Now'}
        </Button>
      </Box>

      {sending && <LinearProgress sx={{ mt: 2 }} />}
    </Paper>
  );

  const renderCampaignHistory = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Campaign History
      </Typography>
      <List>
        {campaigns.map((campaign) => (
          <ListItem key={campaign.id} divider>
            <ListItemAvatar>
              <Avatar>{getCommunicationIcon(campaign.type)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={campaign.name}
              secondary={
                <Box>
                  <Typography variant="body2">
                    Sent: {campaign.sent} | 
                    {campaign.opened && ` Opened: ${campaign.opened} |`}
                    {campaign.clicked && ` Clicked: ${campaign.clicked} |`}
                    {campaign.delivered && ` Delivered: ${campaign.delivered} |`}
                    {campaign.replied && ` Replied: ${campaign.replied} |`}
                    Date: {campaign.date}
                  </Typography>
                </Box>
              }
            />
            <Chip
              label={campaign.type.toUpperCase()}
              size="small"
              color="primary"
              variant="outlined"
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        User Communication
      </Typography>

      {/* Communication Type Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <StyledTab
            icon={<Email />}
            label="Email"
            iconPosition="start"
          />
          <StyledTab
            icon={<Sms />}
            label="SMS"
            iconPosition="start"
          />
          <StyledTab
            icon={<WhatsApp />}
            label="WhatsApp"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* User Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          User Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={filters.plan}
                label="Plan"
                onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              >
                <MenuItem value="">All Plans</MenuItem>
                <MenuItem value="Free">Free</MenuItem>
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilters({ plan: '', status: '', lastActivity: '', tags: [] })}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* User Selection */}
        <Grid item xs={12} md={4}>
          {renderUserList()}
        </Grid>

        {/* Message Composer */}
        <Grid item xs={12} md={8}>
          {renderMessageComposer()}
        </Grid>

        {/* Campaign History */}
        <Grid item xs={12}>
          {renderCampaignHistory()}
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Message Preview</DialogTitle>
        <DialogContent>
          {messageData.type === 'email' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Subject:</Typography>
              <Typography>{messageData.subject}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Content:</Typography>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {messageData.content}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Recipients:</Typography>
            <Typography>{selectedUsers.length} users selected</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserCommunication; 