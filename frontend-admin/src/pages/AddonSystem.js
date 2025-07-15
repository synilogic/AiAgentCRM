import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Extension as ExtensionIcon,
  AutoAwesome as AutoAwesomeIcon,
  Chat as ChatIcon,
  Assessment as AnalyticsIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  CampaignOutlined as CampaignIcon,
  AttachMoney as PaymentIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Link as IntegrationIcon,
  Sync as CloudSyncIcon,
  CloudDownload as BackupIcon,
  Code as ApiIcon,
  PhoneIphone as MobileIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AddonSystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [modules, setModules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: 'automation',
    icon: 'extension',
    isCore: false,
    isEnabled: true,
    planAvailability: [],
    globallyEnabled: true,
    dependencies: [],
    settings: {},
    pricing: {
      type: 'free',
      price: 0,
      currency: 'INR',
    },
    metadata: {
      author: '',
      website: '',
      documentation: '',
      supportEmail: '',
    },
  });

  // Core modules with predefined configurations
  const coreModules = [
    {
      id: 'auto-followup',
      name: 'Auto Follow-up',
      description: 'Automated follow-up sequences for leads and customers',
      icon: <ScheduleIcon />,
      category: 'Automation',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 85,
      activeUsers: 1247,
      planAvailability: ['starter', 'professional', 'enterprise'],
      dependencies: [],
      version: '2.1.0',
      settings: {
        maxFollowups: 10,
        defaultDelay: 24,
        enableSmartTiming: true,
      },
    },
    {
      id: 'ai-bot',
      name: 'AI Chat Bot',
      description: 'AI-powered chatbot for customer interactions',
      icon: <AutoAwesomeIcon />,
      category: 'AI',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 92,
      activeUsers: 1456,
      planAvailability: ['professional', 'enterprise'],
      dependencies: ['chat-interface'],
      version: '3.0.1',
      settings: {
        responseTime: 'instant',
        personality: 'professional',
        learningEnabled: true,
      },
    },
    {
      id: 'chat-summary',
      name: 'Chat Summary',
      description: 'AI-generated summaries of customer conversations',
      icon: <ChatIcon />,
      category: 'AI',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 76,
      activeUsers: 892,
      planAvailability: ['professional', 'enterprise'],
      dependencies: ['ai-bot'],
      version: '1.5.2',
      settings: {
        summaryLength: 'medium',
        includeActionItems: true,
        autoGenerate: true,
      },
    },
    {
      id: 'whatsapp-integration',
      name: 'WhatsApp Integration',
      description: 'WhatsApp Business API integration for messaging',
      icon: <WhatsAppIcon />,
      category: 'Communication',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 94,
      activeUsers: 1789,
      planAvailability: ['starter', 'professional', 'enterprise'],
      dependencies: [],
      version: '2.3.0',
      settings: {
        webhookUrl: '',
        verifyToken: '',
        accessToken: '',
      },
    },
    {
      id: 'email-campaigns',
      name: 'Email Campaigns',
      description: 'Email marketing and campaign management',
      icon: <EmailIcon />,
      category: 'Marketing',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 68,
      activeUsers: 634,
      planAvailability: ['professional', 'enterprise'],
      dependencies: [],
      version: '1.8.0',
      settings: {
        defaultSender: '',
        trackingEnabled: true,
        templateEngine: 'advanced',
      },
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Detailed analytics and reporting dashboard',
      icon: <AnalyticsIcon />,
      category: 'Analytics',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 58,
      activeUsers: 423,
      planAvailability: ['professional', 'enterprise'],
      dependencies: [],
      version: '2.2.1',
      settings: {
        retentionPeriod: 365,
        realTimeUpdates: true,
        exportFormats: ['pdf', 'excel'],
      },
    },
    {
      id: 'payment-integration',
      name: 'Payment Integration',
      description: 'Razorpay and Stripe payment processing',
      icon: <PaymentIcon />,
      category: 'Finance',
      isCore: true,
      isEnabled: true,
      globallyEnabled: true,
      usage: 89,
      activeUsers: 1567,
      planAvailability: ['starter', 'professional', 'enterprise'],
      dependencies: [],
      version: '2.0.0',
      settings: {
        primaryGateway: 'razorpay',
        currency: 'INR',
        webhooksEnabled: true,
      },
    },
    {
      id: 'mobile-app',
      name: 'Mobile App Support',
      description: 'Mobile application APIs and functionality',
      icon: <MobileIcon />,
      category: 'Platform',
      isCore: false,
      isEnabled: true,
      globallyEnabled: true,
      usage: 45,
      activeUsers: 234,
      planAvailability: ['enterprise'],
      dependencies: ['api-access'],
      version: '1.2.0',
      settings: {
        pushNotifications: true,
        offlineSync: true,
        biometricAuth: false,
      },
    },
  ];

  const moduleCategories = [
    { value: 'automation', label: 'Automation', icon: <ScheduleIcon />, color: '#10B981' },
    { value: 'ai', label: 'Artificial Intelligence', icon: <AutoAwesomeIcon />, color: '#8B5CF6' },
    { value: 'communication', label: 'Communication', icon: <ChatIcon />, color: '#3B82F6' },
    { value: 'marketing', label: 'Marketing', icon: <CampaignIcon />, color: '#F59E0B' },
    { value: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, color: '#EF4444' },
    { value: 'finance', label: 'Finance', icon: <PaymentIcon />, color: '#06B6D4' },
    { value: 'platform', label: 'Platform', icon: <ExtensionIcon />, color: '#6B7280' },
    { value: 'security', label: 'Security', icon: <SecurityIcon />, color: '#DC2626' },
  ];

  const planTiers = [
    { value: 'free', label: 'Free', color: '#6B7280' },
    { value: 'starter', label: 'Starter', color: '#10B981' },
    { value: 'professional', label: 'Professional', color: '#3B82F6' },
    { value: 'enterprise', label: 'Enterprise', color: '#8B5CF6' },
  ];

  useEffect(() => {
    loadModules();
    loadPlans();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/addon-modules');
      setModules(response.data.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      setModules([]);
      setSnackbar({
        open: true,
        message: 'Failed to load addon modules',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await api.get('/admin/plans');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleModuleToggle = async (moduleId, field, value) => {
    try {
      await api.patch(`/admin/addon-modules/${moduleId}`, { [field]: value });
      
      setModules(prev => prev.map(module =>
        module.id === moduleId ? { ...module, [field]: value } : module
      ));
      
      setSnackbar({
        open: true,
        message: `Module ${value ? 'enabled' : 'disabled'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating module',
        severity: 'error'
      });
    }
  };

  const handlePlanAvailabilityChange = async (moduleId, planId, isEnabled) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      let newPlanAvailability = [...module.planAvailability];
      
      if (isEnabled && !newPlanAvailability.includes(planId)) {
        newPlanAvailability.push(planId);
      } else if (!isEnabled) {
        newPlanAvailability = newPlanAvailability.filter(p => p !== planId);
      }
      
      await api.patch(`/admin/addon-modules/${moduleId}`, { 
        planAvailability: newPlanAvailability 
      });
      
      setModules(prev => prev.map(module =>
        module.id === moduleId 
          ? { ...module, planAvailability: newPlanAvailability }
          : module
      ));
      
      setSnackbar({
        open: true,
        message: 'Plan availability updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating plan availability',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingModule) {
        await api.put(`/admin/addon-modules/${editingModule.id}`, formData);
        setSnackbar({ open: true, message: 'Module updated successfully', severity: 'success' });
      } else {
        await api.post('/admin/addon-modules', formData);
        setSnackbar({ open: true, message: 'Module created successfully', severity: 'success' });
      }
      
      setDialogOpen(false);
      resetForm();
      loadModules();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving module', severity: 'error' });
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      description: module.description,
      version: module.version,
      category: module.category.toLowerCase(),
      icon: 'extension',
      isCore: module.isCore,
      isEnabled: module.isEnabled,
      planAvailability: module.planAvailability,
      globallyEnabled: module.globallyEnabled,
      dependencies: module.dependencies || [],
      settings: module.settings || {},
      pricing: module.pricing || { type: 'free', price: 0, currency: 'INR' },
      metadata: module.metadata || {},
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      version: '1.0.0',
      category: 'automation',
      icon: 'extension',
      isCore: false,
      isEnabled: true,
      planAvailability: [],
      globallyEnabled: true,
      dependencies: [],
      settings: {},
      pricing: { type: 'free', price: 0, currency: 'INR' },
      metadata: {},
    });
    setEditingModule(null);
  };

  const getCategoryInfo = (category) => {
    return moduleCategories.find(c => c.value === category.toLowerCase()) || moduleCategories[0];
  };

  const getUsageColor = (usage) => {
    if (usage >= 80) return '#10B981';
    if (usage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Addon System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage core modules, plan availability, and system addons
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Add Module
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExtensionIcon />
              Core Modules
              <Chip label={modules.filter(m => m.isCore).length} size="small" />
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              Plan Availability
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon />
              Module Analytics
            </Box>
          } 
        />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {modules.map((module) => {
            const categoryInfo = getCategoryInfo(module.category);
            return (
              <Grid item xs={12} md={6} lg={4} key={module.id}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: categoryInfo.color,
                          width: 48,
                          height: 48,
                          mr: 2,
                        }}
                      >
                        {module.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {module.name}
                          </Typography>
                          {module.isCore && (
                            <Chip label="Core" size="small" color="primary" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {module.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Chip
                            label={module.category}
                            size="small"
                            sx={{ bgcolor: categoryInfo.color, color: 'white' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            v{module.version}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedModuleId(module.id);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Usage</Typography>
                        <Typography variant="body2" color={getUsageColor(module.usage)}>
                          {module.usage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={module.usage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getUsageColor(module.usage),
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {module.activeUsers} active users
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {module.planAvailability.slice(0, 2).map(plan => (
                          <Chip
                            key={plan}
                            label={planTiers.find(p => p.value === plan)?.label || plan}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {module.planAvailability.length > 2 && (
                          <Chip label={`+${module.planAvailability.length - 2}`} size="small" />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={module.globallyEnabled}
                            onChange={(e) => handleModuleToggle(module.id, 'globallyEnabled', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Globally Enabled"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={module.isEnabled}
                            onChange={(e) => handleModuleToggle(module.id, 'isEnabled', e.target.checked)}
                            size="small"
                          />
                        }
                        label="Active"
                      />
                    </Box>

                    {module.dependencies && module.dependencies.length > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Depends on: {module.dependencies.join(', ')}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Module Availability by Plan
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    {planTiers.map(plan => (
                      <TableCell key={plan.value} align="center">
                        <Chip
                          label={plan.label}
                          size="small"
                          sx={{ bgcolor: plan.color, color: 'white' }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: getCategoryInfo(module.category).color }}>
                            {module.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{module.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {module.category}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      {planTiers.map(plan => (
                        <TableCell key={plan.value} align="center">
                          <Switch
                            checked={module.planAvailability.includes(plan.value)}
                            onChange={(e) => handlePlanAvailabilityChange(
                              module.id,
                              plan.value,
                              e.target.checked
                            )}
                            size="small"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Module Statistics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ExtensionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Modules"
                      secondary={modules.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Active Modules"
                      secondary={modules.filter(m => m.isEnabled).length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Core Modules"
                      secondary={modules.filter(m => m.isCore).length}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Usage Analytics
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Module</TableCell>
                        <TableCell align="center">Usage</TableCell>
                        <TableCell align="center">Active Users</TableCell>
                        <TableCell align="center">Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modules
                        .sort((a, b) => b.usage - a.usage)
                        .map((module) => (
                          <TableRow key={module.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {module.icon}
                                <Typography variant="body2">
                                  {module.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body2"
                                  color={getUsageColor(module.usage)}
                                  fontWeight="medium"
                                >
                                  {module.usage}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={module.usage}
                                  sx={{
                                    width: 60,
                                    height: 4,
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getUsageColor(module.usage),
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {module.activeUsers.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={module.usage >= 80 ? 'Excellent' : module.usage >= 60 ? 'Good' : 'Needs Attention'}
                                size="small"
                                color={module.usage >= 80 ? 'success' : module.usage >= 60 ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            const module = modules.find(m => m.id === selectedModuleId);
            if (module) handleEdit(module);
            setMenuAnchor(null);
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit Module
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle settings
            setMenuAnchor(null);
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Module Settings
        </MenuItem>
      </Menu>

      {/* Add/Edit Module Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingModule ? 'Edit Module' : 'Add New Module'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Module Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {moduleCategories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Plan Availability</InputLabel>
                <Select
                  multiple
                  value={formData.planAvailability}
                  label="Plan Availability"
                  onChange={(e) => setFormData({ ...formData, planAvailability: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={planTiers.find(p => p.value === value)?.label || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {planTiers.map(plan => (
                    <MenuItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isCore}
                    onChange={(e) => setFormData({ ...formData, isCore: e.target.checked })}
                  />
                }
                label="Core Module"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.globallyEnabled}
                    onChange={(e) => setFormData({ ...formData, globallyEnabled: e.target.checked })}
                  />
                }
                label="Globally Available"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingModule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddonSystem; 