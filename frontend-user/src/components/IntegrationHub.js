import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  IconButton,
  Switch,
  Chip,
  Avatar,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Integration as IntegrationIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Connect as ConnectIcon,
  Disconnect as DisconnectIcon,
  Sync as SyncIcon,
  Code as CodeIcon,
  Webhook as WebhookIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  CloudSync as CloudSyncIcon,
  Storage as StorageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Task as TaskIcon,
  Cloud as CloudIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { styled, alpha } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

// Styled components
const IntegrationCard = styled(Card)(({ theme, connected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: connected ? `2px solid ${theme.palette.success.main}` : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusIndicator = styled(Box)(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.grey[400];
    }
  };

  return {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: getStatusColor(),
    animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
  };
});

const WebhookCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateX(4px)',
  },
}));

const ApiKeyCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.info.main, 0.05),
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const IntegrationHub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [integrationDialog, setIntegrationDialog] = useState(false);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showApiKey, setShowApiKey] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    webhookUrl: '',
    settings: {}
  });

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: [],
    secret: '',
    active: true
  });

  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    trigger: '',
    actions: [],
    conditions: [],
    active: true
  });

  // Available integrations
  const availableIntegrations = [
    {
      id: 'whatsapp-business',
      name: 'WhatsApp Business',
      description: 'Send messages and manage conversations',
      category: 'communication',
      icon: '📱',
      color: '#25D366',
      features: ['Send Messages', 'Receive Messages', 'Media Support', 'Templates'],
      pricing: 'Free',
      difficulty: 'Easy'
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Payment processing and invoicing',
      category: 'payment',
      icon: '💳',
      color: '#3395FF',
      features: ['Payment Processing', 'Invoicing', 'Subscriptions', 'Refunds'],
      pricing: 'Pay per transaction',
      difficulty: 'Medium'
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Gmail, Calendar, Drive integration',
      category: 'productivity',
      icon: '🔷',
      color: '#4285F4',
      features: ['Gmail Sync', 'Calendar Events', 'Drive Storage', 'Contacts'],
      pricing: 'Free',
      difficulty: 'Easy'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and notifications',
      category: 'communication',
      icon: '💬',
      color: '#4A154B',
      features: ['Notifications', 'Channel Updates', 'Bot Commands', 'File Sharing'],
      pricing: 'Free',
      difficulty: 'Easy'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Advanced CRM integration',
      category: 'crm',
      icon: '🎯',
      color: '#FF7A59',
      features: ['Contact Sync', 'Deal Pipeline', 'Email Tracking', 'Analytics'],
      pricing: 'Subscription',
      difficulty: 'Hard'
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing campaigns',
      category: 'marketing',
      icon: '📧',
      color: '#FFE01B',
      features: ['Email Campaigns', 'List Management', 'Analytics', 'Automation'],
      pricing: 'Freemium',
      difficulty: 'Medium'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Workflow automation platform',
      category: 'automation',
      icon: '⚡',
      color: '#FF4A00',
      features: ['Multi-app Workflows', 'Triggers', 'Actions', 'Filters'],
      pricing: 'Freemium',
      difficulty: 'Medium'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS and voice communication',
      category: 'communication',
      icon: '📞',
      color: '#F22F46',
      features: ['SMS Sending', 'Voice Calls', 'Phone Numbers', 'Verification'],
      pricing: 'Pay per use',
      difficulty: 'Hard'
    }
  ];

  // API Queries
  const {
    data: connectedIntegrations,
    isLoading: integrationsLoading,
    refetch: refetchIntegrations
  } = useQuery(
    ['connected-integrations'],
    () => apiService.getConnectedIntegrations(),
    {
      refetchInterval: 60000,
    }
  );

  const {
    data: webhooks,
    isLoading: webhooksLoading
  } = useQuery(
    ['webhooks'],
    () => apiService.getWebhooks(),
    {
      refetchInterval: 60000,
    }
  );

  const {
    data: apiKeys,
    isLoading: apiKeysLoading
  } = useQuery(
    ['api-keys'],
    () => apiService.getApiKeys(),
    {
      refetchInterval: 60000,
    }
  );

  const {
    data: workflows,
    isLoading: workflowsLoading
  } = useQuery(
    ['automation-workflows'],
    () => apiService.getAutomationWorkflows(),
    {
      refetchInterval: 60000,
    }
  );

  const {
    data: integrationLogs,
    isLoading: logsLoading
  } = useQuery(
    ['integration-logs'],
    () => apiService.getIntegrationLogs({ limit: 50 }),
    {
      refetchInterval: 30000,
    }
  );

  // Mutations
  const connectIntegrationMutation = useMutation(
    (data) => apiService.connectIntegration(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['connected-integrations']);
        setIntegrationDialog(false);
        setSnackbar({ open: true, message: 'Integration connected successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.message || 'Failed to connect integration', severity: 'error' });
      }
    }
  );

  const disconnectIntegrationMutation = useMutation(
    (integrationId) => apiService.disconnectIntegration(integrationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['connected-integrations']);
        setSnackbar({ open: true, message: 'Integration disconnected', severity: 'info' });
      }
    }
  );

  const createWebhookMutation = useMutation(
    (data) => apiService.createWebhook(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['webhooks']);
        setWebhookDialog(false);
        setSnackbar({ open: true, message: 'Webhook created successfully!', severity: 'success' });
      }
    }
  );

  const createApiKeyMutation = useMutation(
    (data) => apiService.createApiKey(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['api-keys']);
        setApiKeyDialog(false);
        setSnackbar({ open: true, message: 'API key created successfully!', severity: 'success' });
      }
    }
  );

  const createWorkflowMutation = useMutation(
    (data) => apiService.createAutomationWorkflow(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['automation-workflows']);
        setWorkflowDialog(false);
        setSnackbar({ open: true, message: 'Workflow created successfully!', severity: 'success' });
      }
    }
  );

  const syncIntegrationMutation = useMutation(
    (integrationId) => apiService.syncIntegration(integrationId),
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Sync completed successfully!', severity: 'success' });
      }
    }
  );

  // Helper functions
  const getIntegrationStatus = (integrationId) => {
    const connected = connectedIntegrations?.find(ci => ci.integrationId === integrationId);
    if (!connected) return 'disconnected';
    if (connected.status === 'active') return 'connected';
    if (connected.lastSyncError) return 'error';
    return 'warning';
  };

  const getConnectedIntegration = (integrationId) => {
    return connectedIntegrations?.find(ci => ci.integrationId === integrationId);
  };

  const filteredIntegrations = availableIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || integration.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(availableIntegrations.map(i => i.category))];

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': 'success',
      'Medium': 'warning',
      'Hard': 'error'
    };
    return colors[difficulty] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <CancelIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const handleConnectIntegration = (integration) => {
    setSelectedIntegration(integration);
    setIntegrationForm({
      name: integration.name,
      apiKey: '',
      apiSecret: '',
      baseUrl: '',
      webhookUrl: '',
      settings: {}
    });
    setIntegrationDialog(true);
  };

  const handleSubmitIntegration = () => {
    connectIntegrationMutation.mutate({
      integrationId: selectedIntegration.id,
      ...integrationForm
    });
  };

  const handleDisconnectIntegration = (integrationId) => {
    if (window.confirm('Are you sure you want to disconnect this integration?')) {
      disconnectIntegrationMutation.mutate(integrationId);
    }
  };

  const handleSyncIntegration = (integrationId) => {
    syncIntegrationMutation.mutate(integrationId);
  };

  const toggleApiKeyVisibility = (keyId) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'info' });
  };

  const speedDialActions = [
    { icon: <AddIcon />, name: 'Add Integration', onClick: () => setSelectedTab(0) },
    { icon: <WebhookIcon />, name: 'Create Webhook', onClick: () => setWebhookDialog(true) },
    { icon: <KeyIcon />, name: 'Generate API Key', onClick: () => setApiKeyDialog(true) },
    { icon: <CloudSyncIcon />, name: 'Create Workflow', onClick: () => setWorkflowDialog(true) }
  ];

  if (integrationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Integration Hub
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect your favorite tools and automate workflows
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetchIntegrations}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSelectedTab(0)}
            >
              Add Integration
            </Button>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Available" icon={<IntegrationIcon />} />
          <Tab label="Connected" icon={<ConnectIcon />} />
          <Tab label="Webhooks" icon={<WebhookIcon />} />
          <Tab label="API Keys" icon={<KeyIcon />} />
          <Tab label="Workflows" icon={<CloudSyncIcon />} />
          <Tab label="Logs" icon={<AnalyticsIcon />} />
        </Tabs>
      </Box>

      {/* Available Integrations Tab */}
      <TabPanel value={selectedTab} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Grid container spacing={3}>
          {filteredIntegrations.map((integration) => {
            const status = getIntegrationStatus(integration.id);
            const connected = getConnectedIntegration(integration.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={integration.id}>
                <IntegrationCard connected={status === 'connected'}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ fontSize: '2rem' }}>
                          {integration.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {integration.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {integration.description}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack alignItems="center" spacing={1}>
                        <StatusIndicator status={status} />
                        {getStatusIcon(status)}
                      </Stack>
                    </Stack>

                    <Stack spacing={1} mb={2}>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          label={integration.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={integration.pricing}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip
                          label={integration.difficulty}
                          size="small"
                          color={getDifficultyColor(integration.difficulty)}
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Features: {integration.features.join(', ')}
                    </Typography>

                    {connected && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Connected • Last sync: {formatDistanceToNow(new Date(connected.lastSync))} ago
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions>
                    {status === 'connected' ? (
                      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        <Button
                          size="small"
                          startIcon={<SyncIcon />}
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={syncIntegrationMutation.isLoading}
                        >
                          Sync
                        </Button>
                        <Button
                          size="small"
                          startIcon={<SettingsIcon />}
                          onClick={() => handleConnectIntegration(integration)}
                        >
                          Configure
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DisconnectIcon />}
                          onClick={() => handleDisconnectIntegration(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ConnectIcon />}
                        onClick={() => handleConnectIntegration(integration)}
                      >
                        Connect
                      </Button>
                    )}
                  </CardActions>
                </IntegrationCard>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      {/* Connected Integrations Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {connectedIntegrations?.map((integration) => {
            const details = availableIntegrations.find(ai => ai.id === integration.integrationId);
            if (!details) return null;

            return (
              <Grid item xs={12} sm={6} md={4} key={integration.id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ fontSize: '2rem' }}>
                          {details.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {details.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {integration.status}
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton
                        onClick={() => handleSyncIntegration(integration.integrationId)}
                        disabled={syncIntegrationMutation.isLoading}
                      >
                        <SyncIcon />
                      </IconButton>
                    </Stack>

                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Connected:</strong> {format(new Date(integration.connectedAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Sync:</strong> {formatDistanceToNow(new Date(integration.lastSync))} ago
                      </Typography>
                      <Typography variant="body2">
                        <strong>Sync Count:</strong> {integration.syncCount || 0}
                      </Typography>
                      {integration.lastSyncError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {integration.lastSyncError}
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      {/* Webhooks Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Webhooks ({webhooks?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setWebhookDialog(true)}
            >
              Create Webhook
            </Button>
          </Stack>
        </Box>

        <Stack spacing={2}>
          {webhooks?.map((webhook) => (
            <WebhookCard key={webhook.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {webhook.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {webhook.url}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    {webhook.events.map(event => (
                      <Chip key={event} label={event} size="small" />
                    ))}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Switch checked={webhook.active} />
                  <Chip
                    label={webhook.active ? 'Active' : 'Inactive'}
                    color={webhook.active ? 'success' : 'default'}
                    size="small"
                  />
                  <IconButton>
                    <MoreIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </WebhookCard>
          ))}
        </Stack>
      </TabPanel>

      {/* API Keys Tab */}
      <TabPanel value={selectedTab} index={3}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              API Keys ({apiKeys?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setApiKeyDialog(true)}
            >
              Generate Key
            </Button>
          </Stack>
        </Box>

        <Stack spacing={2}>
          {apiKeys?.map((apiKey) => (
            <ApiKeyCard key={apiKey.id}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {apiKey.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {format(new Date(apiKey.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={apiKey.status}
                      color={apiKey.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                    <IconButton onClick={() => toggleApiKeyVisibility(apiKey.id)}>
                      {showApiKey[apiKey.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton onClick={() => copyToClipboard(apiKey.key)}>
                      <CopyIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    API Key:
                  </Typography>
                  <TextField
                    fullWidth
                    value={showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <IconButton onClick={() => copyToClipboard(apiKey.key)}>
                          <CopyIcon />
                        </IconButton>
                      )
                    }}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Permissions:</strong> {apiKey.permissions?.join(', ') || 'Read-only'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Used:</strong> {apiKey.lastUsed ? formatDistanceToNow(new Date(apiKey.lastUsed)) + ' ago' : 'Never'}
                  </Typography>
                </Box>
              </Stack>
            </ApiKeyCard>
          ))}
        </Stack>
      </TabPanel>

      {/* Workflows Tab */}
      <TabPanel value={selectedTab} index={4}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Automation Workflows ({workflows?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setWorkflowDialog(true)}
            >
              Create Workflow
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {workflows?.map((workflow) => (
            <Grid item xs={12} sm={6} md={4} key={workflow.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {workflow.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {workflow.description}
                      </Typography>
                    </Box>
                    <Switch checked={workflow.active} />
                  </Stack>

                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Trigger:</strong> {workflow.trigger}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Actions:</strong> {workflow.actions?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Executions:</strong> {workflow.executionCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Run:</strong> {workflow.lastRun ? formatDistanceToNow(new Date(workflow.lastRun)) + ' ago' : 'Never'}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EditIcon />}>
                    Edit
                  </Button>
                  <Button size="small" startIcon={<LaunchIcon />}>
                    Run
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={selectedTab} index={5}>
        <Typography variant="h6" gutterBottom>
          Integration Logs
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Integration</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {integrationLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                  </TableCell>
                  <TableCell>{log.integration}</TableCell>
                  <TableCell>{log.event}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Integration Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Integration Connection Dialog */}
      <Dialog open={integrationDialog} onClose={() => setIntegrationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Connect {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Follow the setup instructions to connect {selectedIntegration?.name} to your CRM.
            </Alert>
            
            <TextField
              fullWidth
              label="API Key"
              value={integrationForm.apiKey}
              onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
              helperText="Enter your API key from the integration provider"
            />
            
            <TextField
              fullWidth
              label="API Secret (if required)"
              type="password"
              value={integrationForm.apiSecret}
              onChange={(e) => setIntegrationForm({ ...integrationForm, apiSecret: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Base URL (if custom)"
              value={integrationForm.baseUrl}
              onChange={(e) => setIntegrationForm({ ...integrationForm, baseUrl: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Webhook URL"
              value={integrationForm.webhookUrl}
              onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
              helperText="This URL will receive webhook notifications"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntegrationDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitIntegration}
            disabled={connectIntegrationMutation.isLoading}
          >
            Connect Integration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog open={webhookDialog} onClose={() => setWebhookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Webhook</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Webhook Name"
              value={webhookForm.name}
              onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Webhook URL"
              value={webhookForm.url}
              onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
              helperText="The URL that will receive webhook notifications"
            />
            
            <FormControl fullWidth>
              <InputLabel>Events</InputLabel>
              <Select
                multiple
                value={webhookForm.events}
                onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.value })}
              >
                <MenuItem value="lead.created">Lead Created</MenuItem>
                <MenuItem value="lead.updated">Lead Updated</MenuItem>
                <MenuItem value="task.created">Task Created</MenuItem>
                <MenuItem value="task.completed">Task Completed</MenuItem>
                <MenuItem value="payment.received">Payment Received</MenuItem>
                <MenuItem value="message.sent">Message Sent</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Secret (optional)"
              value={webhookForm.secret}
              onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
              helperText="Used to verify webhook authenticity"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={webhookForm.active}
                  onChange={(e) => setWebhookForm({ ...webhookForm, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createWebhookMutation.mutate(webhookForm)}
            disabled={createWebhookMutation.isLoading}
          >
            Create Webhook
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate API Key</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Key Name"
              helperText="A descriptive name for this API key"
            />
            
            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select multiple>
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="warning">
              API keys provide access to your account. Keep them secure and don't share them publicly.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createApiKeyMutation.mutate({})}
            disabled={createApiKeyMutation.isLoading}
          >
            Generate Key
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

export default IntegrationHub; 