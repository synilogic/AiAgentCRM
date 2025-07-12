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
  Tabs,
  Tab,
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
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Email as EmailIcon,
  Settings as SettingsIcon,
  Send as SendIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Template as TemplateIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  Server as ServerIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNotifications } from '../components/NotificationSystem';

const EmailSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [emailData, setEmailData] = useState({
    // SMTP Configuration
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: 'noreply@aiagentcrm.com',
      fromName: 'AI Agent CRM',
      enableSSL: true,
      enableTLS: true,
    },

    // Email Templates
    templates: [
      {
        id: 1,
        name: 'Welcome Email',
        subject: 'Welcome to AI Agent CRM!',
        type: 'welcome',
        isActive: true,
        content: `
          <h2>Welcome to AI Agent CRM!</h2>
          <p>Dear {{user.name}},</p>
          <p>Thank you for joining AI Agent CRM. We're excited to help you transform your business with AI-powered automation.</p>
          <p>Here's what you can do to get started:</p>
          <ul>
            <li>Connect your WhatsApp account</li>
            <li>Import your first leads</li>
            <li>Set up automated follow-ups</li>
            <li>Explore our AI features</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The AI Agent CRM Team</p>
        `,
      },
      {
        id: 2,
        name: 'Password Reset',
        subject: 'Reset Your Password',
        type: 'password_reset',
        isActive: true,
        content: `
          <h2>Password Reset Request</h2>
          <p>Dear {{user.name}},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p><a href="{{resetLink}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The AI Agent CRM Team</p>
        `,
      },
      {
        id: 3,
        name: 'Plan Upgrade',
        subject: 'Upgrade Your Plan',
        type: 'plan_upgrade',
        isActive: true,
        content: `
          <h2>Upgrade Your Plan</h2>
          <p>Dear {{user.name}},</p>
          <p>You're currently on the {{currentPlan}} plan. Upgrade to unlock more features and increase your limits!</p>
          <p>Benefits of upgrading:</p>
          <ul>
            <li>More leads and messages</li>
            <li>Advanced AI features</li>
            <li>Priority support</li>
            <li>Custom integrations</li>
          </ul>
          <p><a href="{{upgradeLink}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Upgrade Now</a></p>
          <p>Best regards,<br>The AI Agent CRM Team</p>
        `,
      },
      {
        id: 4,
        name: 'Trial Expiry',
        subject: 'Your Trial is Ending Soon',
        type: 'trial_expiry',
        isActive: true,
        content: `
          <h2>Trial Ending Soon</h2>
          <p>Dear {{user.name}},</p>
          <p>Your free trial will expire in {{daysLeft}} days. Don't lose access to your data and automation!</p>
          <p>Choose a plan that fits your needs:</p>
          <ul>
            <li>Starter: $29/month</li>
            <li>Professional: $79/month</li>
            <li>Enterprise: $199/month</li>
          </ul>
          <p><a href="{{billingLink}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Choose Plan</a></p>
          <p>Best regards,<br>The AI Agent CRM Team</p>
        `,
      },
    ],

    // Email Settings
    settings: {
      enableEmailNotifications: true,
      enableMarketingEmails: false,
      enableSystemEmails: true,
      emailFooter: '© 2024 AI Agent CRM. All rights reserved.',
      replyToEmail: 'support@aiagentcrm.com',
      maxEmailsPerHour: 100,
      enableEmailTracking: true,
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    type: 'custom',
    content: '',
    isActive: true,
  });

  const templateTypes = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'plan_upgrade', label: 'Plan Upgrade' },
    { value: 'trial_expiry', label: 'Trial Expiry' },
    { value: 'notification', label: 'System Notification' },
    { value: 'custom', label: 'Custom Template' },
  ];

  const smtpProviders = [
    { value: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: 587 },
    { value: 'outlook', label: 'Outlook', host: 'smtp-mail.outlook.com', port: 587 },
    { value: 'yahoo', label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587 },
    { value: 'custom', label: 'Custom SMTP', host: '', port: 587 },
  ];

  const { success, error, info } = useNotifications();

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/email-settings');
      setEmailData(response.data);
    } catch (err) {
      console.error('Error loading email settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/admin/email-settings', emailData);
      success('Email settings saved successfully');
    } catch (err) {
      error('Failed to save email settings');
    }
  };

  const handleTestEmail = async () => {
    try {
      await api.post('/admin/email-settings/test', {
        to: user.email,
        subject: 'Test Email from AI Agent CRM',
        content: 'This is a test email to verify your SMTP configuration.',
      });
      success('Test email sent successfully');
    } catch (err) {
      error('Failed to send test email');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await api.put(`/admin/email-settings/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/admin/email-settings/templates', formData);
      }
      setOpenDialog(false);
      setEditingTemplate(null);
      resetForm();
      loadEmailSettings();
    } catch (err) {
      error('Failed to save email template');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      type: template.type,
      content: template.content,
      isActive: template.isActive,
    });
    setOpenDialog(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/admin/email-settings/templates/${templateId}`);
        loadEmailSettings();
      } catch (err) {
        console.error('Error deleting template:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      type: 'custom',
      content: '',
      isActive: true,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleSMTPProviderChange = (provider) => {
    const selectedProvider = smtpProviders.find(p => p.value === provider);
    if (selectedProvider && selectedProvider.value !== 'custom') {
      setEmailData({
        ...emailData,
        smtp: {
          ...emailData.smtp,
          host: selectedProvider.host,
          port: selectedProvider.port,
        },
      });
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Email Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TestIcon />}
            onClick={handleTestEmail}
          >
            Test Email
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="SMTP Configuration" />
            <Tab label="Email Templates" />
            <Tab label="Email Settings" />
            <Tab label="Email Logs" />
          </Tabs>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {selectedTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      SMTP Configuration
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>SMTP Provider</InputLabel>
                      <Select
                        value={smtpProviders.find(p => p.host === emailData.smtp.host)?.value || 'custom'}
                        onChange={(e) => handleSMTPProviderChange(e.target.value)}
                        label="SMTP Provider"
                      >
                        {smtpProviders.map((provider) => (
                          <MenuItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      value={emailData.smtp.host}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, host: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="SMTP Port"
                      value={emailData.smtp.port}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, port: parseInt(e.target.value) }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Username"
                      value={emailData.smtp.username}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, username: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={emailData.smtp.password}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, password: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Email Configuration
                    </Typography>
                    <TextField
                      fullWidth
                      label="From Email"
                      type="email"
                      value={emailData.smtp.fromEmail}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, fromEmail: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="From Name"
                      value={emailData.smtp.fromName}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        smtp: { ...emailData.smtp, fromName: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Reply-To Email"
                      type="email"
                      value={emailData.settings.replyToEmail}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        settings: { ...emailData.settings, replyToEmail: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.smtp.enableSSL}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            smtp: { ...emailData.smtp, enableSSL: e.target.checked }
                          })}
                        />
                      }
                      label="Enable SSL"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.smtp.enableTLS}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            smtp: { ...emailData.smtp, enableTLS: e.target.checked }
                          })}
                        />
                      }
                      label="Enable TLS"
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Email Templates
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDialog(true)}
                    >
                      Add Template
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {emailData.templates.map((template) => (
                      <Grid item xs={12} md={6} key={template.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {template.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                  {template.subject}
                                </Typography>
                                <Chip
                                  label={template.type}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                  label={template.isActive ? 'Active' : 'Inactive'}
                                  color={template.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {template.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {selectedTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Email Preferences
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.settings.enableEmailNotifications}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            settings: { ...emailData.settings, enableEmailNotifications: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Email Notifications"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.settings.enableMarketingEmails}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            settings: { ...emailData.settings, enableMarketingEmails: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Marketing Emails"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.settings.enableSystemEmails}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            settings: { ...emailData.settings, enableSystemEmails: e.target.checked }
                          })}
                        />
                      }
                      label="Enable System Emails"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailData.settings.enableEmailTracking}
                          onChange={(e) => setEmailData({
                            ...emailData,
                            settings: { ...emailData.settings, enableEmailTracking: e.target.checked }
                          })}
                        />
                      }
                      label="Enable Email Tracking"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Email Limits & Footer
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Emails Per Hour"
                      value={emailData.settings.maxEmailsPerHour}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        settings: { ...emailData.settings, maxEmailsPerHour: parseInt(e.target.value) }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Email Footer"
                      multiline
                      rows={3}
                      value={emailData.settings.emailFooter}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        settings: { ...emailData.settings, emailFooter: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>
              )}

              {selectedTab === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Email Logs
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Email logs show the delivery status of sent emails. This helps track delivery issues and monitor email performance.
                  </Alert>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Email logs feature will be available in the next update. It will include:
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Delivery status tracking" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Bounce and spam reports" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Open and click tracking" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Email performance analytics" />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Template Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Email Template' : 'Add Email Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Template Type"
                >
                  {templateTypes.map((type) => (
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
                label="Email Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Content (HTML)"
                multiline
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your email template content in HTML format..."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Template"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {editingTemplate ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailSettings; 