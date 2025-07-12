import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Paper,
  Badge,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  LinearProgress,
  Tooltip,
  Menu,
  ListItemIcon,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  Sync as SyncIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNotifications } from '../components/NotificationSystem';
import { format } from 'date-fns';

const WhatsApp = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState('');
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openSettings, setOpenSettings] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoReply, setAutoReply] = useState(false);
  const [businessHours, setBusinessHours] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    message: '',
    category: 'general',
  });
  const [bulkMessage, setBulkMessage] = useState({
    message: '',
    selectedContacts: [],
    template: '',
  });

  const { success, error, info } = useNotifications();

  // Load data
  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load WhatsApp status
      const statusResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setConnectionStatus(statusData.status || 'disconnected');
        if (statusData.qrCode) setQrCode(statusData.qrCode);
      }

      // Load contacts
      const contactsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData.contacts || []);
      }

      // Load templates
      const templatesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Load analytics
      const analyticsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }

    } catch (err) {
      console.error('Error loading WhatsApp data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load messages for selected contact
  const loadMessages = useCallback(async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/messages/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  // Connect WhatsApp
  const handleConnect = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connecting');
        if (data.qrCode) setQrCode(data.qrCode);
        success('WhatsApp connection initiated. Scan the QR code.');
      } else {
        throw new Error('Failed to connect');
      }
    } catch (err) {
      error('Failed to connect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setConnectionStatus('disconnected');
        setQrCode('');
        setContacts([]);
        setMessages([]);
        setSelectedContact(null);
        info('WhatsApp disconnected');
      }
    } catch (err) {
      error('Failed to disconnect WhatsApp');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          message: newMessage,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        success('Message sent successfully');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      error('Failed to send message');
    }
  };

  // Create template
  const handleCreateTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => [...prev, data.template]);
        setNewTemplate({ name: '', message: '', category: 'general' });
        setOpenTemplateDialog(false);
        success('Template created successfully');
      } else {
        throw new Error('Failed to create template');
      }
    } catch (err) {
      error('Failed to create template');
    }
  };

  // Send bulk messages
  const handleSendBulkMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/bulk-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactIds: bulkMessage.selectedContacts,
          message: bulkMessage.message,
          template: bulkMessage.template,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkMessage({ message: '', selectedContacts: [], template: '' });
        setOpenBulkDialog(false);
        success(`Bulk message sent to ${data.sent} contacts`);
      } else {
        throw new Error('Failed to send bulk message');
      }
    } catch (err) {
      error('Failed to send bulk message');
    }
  };

  // Sync contacts
  const handleSyncContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/whatsapp/sync-contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
        success(`Synced ${data.contacts.length} contacts`);
      } else {
        throw new Error('Failed to sync contacts');
      }
    } catch (err) {
      error('Failed to sync contacts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon />;
      case 'connecting': return <CircularProgress size={16} />;
      case 'disconnected': return <ErrorIcon />;
      default: return <WarningIcon />;
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            WhatsApp Integration
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Connect and manage your WhatsApp Business account
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => setActiveTab(3)}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenSettings(true)}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: getStatusColor(connectionStatus) + '.main' }}>
                <WhatsAppIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  WhatsApp Business
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(connectionStatus)}
                  <Chip
                    label={connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    color={getStatusColor(connectionStatus)}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {connectionStatus === 'connected' && (
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={handleSyncContacts}
                  disabled={loading}
                >
                  Sync Contacts
                </Button>
              )}
              {connectionStatus === 'disconnected' ? (
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleConnect}
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LinkOffIcon />}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              )}
            </Box>
          </Box>

          {/* QR Code */}
          {connectionStatus === 'connecting' && qrCode && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Scan QR Code with WhatsApp
              </Typography>
              <Paper sx={{ p: 3, display: 'inline-block' }}>
                <QrCodeIcon sx={{ fontSize: 200 }} />
                {/* Replace with actual QR code component */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  QR Code: {qrCode}
                </Typography>
              </Paper>
              <Alert severity="info" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
                1. Open WhatsApp on your phone<br />
                2. Go to Settings → Linked Devices<br />
                3. Tap "Link a Device" and scan this QR code
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {connectionStatus === 'connected' && (
        <>
          {/* Analytics Cards */}
          {analytics && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{analytics.totalMessages}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Messages</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">{analytics.totalContacts}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Contacts</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">{analytics.todayMessages}</Typography>
                    <Typography variant="body2" color="text.secondary">Today's Messages</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">{analytics.responseRate}%</Typography>
                    <Typography variant="body2" color="text.secondary">Response Rate</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabs */}
          <Card>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Contacts" icon={<PersonIcon />} />
              <Tab label="Chat" icon={<MessageIcon />} />
              <Tab label="Templates" icon={<EditIcon />} />
              <Tab label="Bulk Message" icon={<GroupIcon />} />
            </Tabs>

            <CardContent>
              {/* Contacts Tab */}
              {activeTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Contacts ({filteredContacts.length})</Typography>
                    <TextField
                      size="small"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <List>
                    {filteredContacts.map((contact, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => {
                          setSelectedContact(contact);
                          setActiveTab(1);
                          loadMessages(contact.id);
                        }}
                        sx={{ borderRadius: 1, mb: 1 }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color={contact.isOnline ? 'success' : 'default'}
                            variant="dot"
                          >
                            <Avatar>{contact.name?.charAt(0) || contact.phone?.charAt(-2)}</Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={contact.name || contact.phone}
                          secondary={
                            <Box>
                              <Typography variant="body2">{contact.phone}</Typography>
                              {contact.lastMessage && (
                                <Typography variant="caption" color="text.secondary">
                                  Last: {contact.lastMessage}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {contact.unreadCount > 0 && (
                          <Chip
                            label={contact.unreadCount}
                            color="primary"
                            size="small"
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Chat Tab */}
              {activeTab === 1 && (
                <Box>
                  {selectedContact ? (
                    <Box>
                      {/* Chat Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Avatar>{selectedContact.name?.charAt(0) || selectedContact.phone?.charAt(-2)}</Avatar>
                        <Box>
                          <Typography variant="h6">{selectedContact.name || selectedContact.phone}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedContact.phone} • {selectedContact.isOnline ? 'Online' : 'Last seen recently'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Messages */}
                      <Box sx={{ height: 400, overflow: 'auto', mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        {messages.map((message, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '70%',
                                bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                                color: message.sender === 'user' ? 'white' : 'text.primary',
                              }}
                            >
                              <Typography variant="body2">{message.message}</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                                {message.timestamp}
                              </Typography>
                            </Paper>
                          </Box>
                        ))}
                      </Box>

                      {/* Message Input */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Template</InputLabel>
                          <Select
                            value={selectedTemplate}
                            label="Template"
                            onChange={(e) => {
                              setSelectedTemplate(e.target.value);
                              const template = templates.find(t => t.id === e.target.value);
                              if (template) setNewMessage(template.message);
                            }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {templates.map(template => (
                              <MenuItem key={template.id} value={template.id}>
                                {template.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          multiline
                          maxRows={3}
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Select a contact to start chatting
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Templates Tab */}
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Message Templates</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenTemplateDialog(true)}
                    >
                      Create Template
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {templates.map((template, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Typography variant="h6">{template.name}</Typography>
                              <IconButton size="small">
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                            <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {template.message}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Bulk Message Tab */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3 }}>Bulk Messaging</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Contacts</Typography>
                      <Paper sx={{ height: 300, overflow: 'auto', p: 1 }}>
                        {contacts.map((contact, index) => (
                          <FormControlLabel
                            key={index}
                            control={
                              <Switch
                                checked={bulkMessage.selectedContacts.includes(contact.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkMessage(prev => ({
                                      ...prev,
                                      selectedContacts: [...prev.selectedContacts, contact.id]
                                    }));
                                  } else {
                                    setBulkMessage(prev => ({
                                      ...prev,
                                      selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                                    }));
                                  }
                                }}
                              />
                            }
                            label={contact.name || contact.phone}
                            sx={{ display: 'block' }}
                          />
                        ))}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel>Template</InputLabel>
                          <Select
                            value={bulkMessage.template}
                            label="Template"
                            onChange={(e) => {
                              setBulkMessage(prev => ({ ...prev, template: e.target.value }));
                              const template = templates.find(t => t.id === e.target.value);
                              if (template) {
                                setBulkMessage(prev => ({ ...prev, message: template.message }));
                              }
                            }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {templates.map(template => (
                              <MenuItem key={template.id} value={template.id}>
                                {template.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          label="Message"
                          value={bulkMessage.message}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Selected: {bulkMessage.selectedContacts.length} contacts
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleSendBulkMessage}
                          disabled={!bulkMessage.message || bulkMessage.selectedContacts.length === 0}
                        >
                          Send to {bulkMessage.selectedContacts.length} contacts
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Template Dialog */}
      <Dialog open={openTemplateDialog} onClose={() => setOpenTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Message Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newTemplate.category}
                label="Category"
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="greeting">Greeting</MenuItem>
                <MenuItem value="followup">Follow-up</MenuItem>
                <MenuItem value="closing">Closing</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message"
              value={newTemplate.message}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={!newTemplate.name || !newTemplate.message}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>WhatsApp Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={autoReply} onChange={(e) => setAutoReply(e.target.checked)} />}
              label="Auto Reply"
            />
            <FormControlLabel
              control={<Switch checked={businessHours} onChange={(e) => setBusinessHours(e.target.checked)} />}
              label="Business Hours Only"
            />
            <TextField
              fullWidth
              label="Auto Reply Message"
              multiline
              rows={3}
              placeholder="Thank you for your message. We'll get back to you soon."
              disabled={!autoReply}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
          <Button variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsApp; 