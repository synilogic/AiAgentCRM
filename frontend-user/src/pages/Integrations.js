import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Integrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'google_sheets',
    config: {},
    isActive: false,
  });

  const integrationTypes = [
    {
      value: 'google_sheets',
      label: 'Google Sheets',
      icon: <GoogleIcon />,
      description: 'Sync leads and data with Google Sheets',
      color: '#4285F4',
    },
    {
      value: 'facebook_leads',
      label: 'Facebook Leads',
      icon: <FacebookIcon />,
      description: 'Import leads from Facebook Lead Ads',
      color: '#1877F2',
    },
    {
      value: 'webhook',
      label: 'Webhook',
      icon: <LinkIcon />,
      description: 'Send data to external systems via webhooks',
      color: '#6366F1',
    },
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data);
    } catch (err) {
      console.error('Error loading integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingIntegration) {
        await api.put(`/integrations/${editingIntegration._id}`, formData);
      } else {
        await api.post('/integrations', formData);
      }
      setOpenDialog(false);
      setEditingIntegration(null);
      resetForm();
      loadIntegrations();
    } catch (err) {
      console.error('Error saving integration:', err);
    }
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      config: integration.config || {},
      isActive: integration.isActive,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (integrationId) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        await api.delete(`/integrations/${integrationId}`);
        loadIntegrations();
      } catch (err) {
        console.error('Error deleting integration:', err);
      }
    }
  };

  const toggleIntegration = async (integrationId, isActive) => {
    try {
      await api.patch(`/integrations/${integrationId}`, { isActive: !isActive });
      loadIntegrations();
    } catch (err) {
      console.error('Error toggling integration:', err);
    }
  };

  const testIntegration = async (integrationId) => {
    try {
      await api.post(`/integrations/${integrationId}/test`);
      // Show success message
    } catch (err) {
      console.error('Error testing integration:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'google_sheets',
      config: {},
      isActive: false,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingIntegration(null);
    resetForm();
  };

  const getIntegrationStatus = (integration) => {
    if (!integration.isActive) return { status: 'inactive', color: 'default', text: 'Inactive' };
    if (integration.lastSync && integration.lastSync.success) {
      return { status: 'active', color: 'success', text: 'Connected' };
    }
    return { status: 'error', color: 'error', text: 'Error' };
  };

  const getIntegrationIcon = (integration) => {
    const type = integrationTypes.find(t => t.value === integration.type);
    return type ? type.icon : <LinkIcon />;
  };

  const getIntegrationColor = (integration) => {
    const type = integrationTypes.find(t => t.value === integration.type);
    return type ? type.color : '#666';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Integrations
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Available Integrations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Available Integrations
                </Typography>
                
                <List>
                  {integrationTypes.map((type) => (
                    <ListItem key={type.value} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: type.color }}>
                        {type.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={type.label}
                        secondary={type.description}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setFormData({ ...formData, type: type.value });
                            setOpenDialog(true);
                          }}
                        >
                          Connect
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Connected Integrations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Connected Integrations
                </Typography>
                
                {integrations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <LinkIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No integrations connected yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {integrations.map((integration) => {
                      const status = getIntegrationStatus(integration);
                      return (
                        <ListItem key={integration._id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ color: getIntegrationColor(integration) }}>
                            {getIntegrationIcon(integration)}
                          </ListItemIcon>
                          <ListItemText
                            primary={integration.name}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={status.text}
                                  size="small"
                                  color={status.color}
                                />
                                {integration.lastSync && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Last sync: {new Date(integration.lastSync.timestamp).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => testIntegration(integration._id)}
                              >
                                <RefreshIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(integration)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(integration._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Integration Details */}
          {integrations.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Integration Details
                  </Typography>
                  
                  {integrations.map((integration) => (
                    <Accordion key={integration._id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: getIntegrationColor(integration) }}>
                            {getIntegrationIcon(integration)}
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {integration.name}
                          </Typography>
                          <Chip
                            label={getIntegrationStatus(integration).text}
                            size="small"
                            color={getIntegrationStatus(integration).color}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Configuration
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                                {JSON.stringify(integration.config, null, 2)}
                              </pre>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Status
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={integration.isActive}
                                    onChange={() => toggleIntegration(integration._id, integration.isActive)}
                                  />
                                }
                                label="Active"
                              />
                              {integration.lastSync && (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  Last sync: {new Date(integration.lastSync.timestamp).toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIntegration ? 'Edit Integration' : 'Connect Integration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Integration Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter a name for this integration"
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
                label="Active"
              />
            </Grid>

            {/* Configuration fields based on type */}
            {formData.type === 'google_sheets' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Google Sheets URL"
                  value={formData.config.sheetUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, sheetUrl: e.target.value }
                  })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </Grid>
            )}

            {formData.type === 'facebook_leads' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Facebook Page ID"
                  value={formData.config.pageId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, pageId: e.target.value }
                  })}
                  placeholder="Enter your Facebook Page ID"
                />
              </Grid>
            )}

            {formData.type === 'webhook' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={formData.config.webhookUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, webhookUrl: e.target.value }
                  })}
                  placeholder="https://your-domain.com/webhook"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingIntegration ? 'Update' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Integrations; 