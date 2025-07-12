import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import apiService from '../services/api';

const SubscriptionManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Plan Management
  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    type: 'basic',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'INR'
    },
    limits: {
      leads: 0,
      aiReplies: 0,
      followUps: 0,
      messages: 0,
      apiCalls: 0,
      storage: 0,
      teamMembers: 1,
      workflows: 0,
      integrations: 0
    },
    features: {
      aiAssistant: false,
      whatsappIntegration: false,
      googleSheetsIntegration: false,
      facebookAdsIntegration: false,
      advancedAnalytics: false,
      customWorkflows: false,
      teamCollaboration: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false,
      customDomain: false,
      dataExport: false,
      advancedReporting: false,
      mobileApp: false,
      sso: false
    },
    trialDays: 0,
    isPublic: true,
    isPopular: false,
    status: 'active'
  });

  // Subscription Management
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [manualSubscription, setManualSubscription] = useState({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active',
    paymentMethod: 'manual',
    notes: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalSubscribers: 0,
    monthlyGrowth: 0,
    planDistribution: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionsData, statsData] = await Promise.all([
        apiService.getPlans(),
        apiService.getSubscriptions(),
        apiService.getSubscriptionStats()
      ]);
      
      setPlans(plansData);
      setSubscriptions(subscriptionsData.subscriptions || []);
      setStats(statsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSubmit = async () => {
    try {
      if (editingPlan) {
        await apiService.updatePlan(editingPlan._id, planForm);
        setSuccess('Plan updated successfully!');
      } else {
        await apiService.createPlan(planForm);
        setSuccess('Plan created successfully!');
      }
      setPlanDialog(false);
      resetPlanForm();
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleManualSubscription = async () => {
    try {
      await apiService.createManualSubscription(selectedUser._id, manualSubscription);
      setSuccess('Subscription activated manually!');
      setSubscriptionDialog(false);
      resetManualSubscription();
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      type: 'basic',
      price: { monthly: 0, yearly: 0, currency: 'INR' },
      limits: {
        leads: 0, aiReplies: 0, followUps: 0, messages: 0,
        apiCalls: 0, storage: 0, teamMembers: 1, workflows: 0, integrations: 0
      },
      features: {
        aiAssistant: false, whatsappIntegration: false, googleSheetsIntegration: false,
        facebookAdsIntegration: false, advancedAnalytics: false, customWorkflows: false,
        teamCollaboration: false, apiAccess: false, prioritySupport: false,
        whiteLabel: false, customDomain: false, dataExport: false,
        advancedReporting: false, mobileApp: false, sso: false
      },
      trialDays: 0,
      isPublic: true,
      isPopular: false,
      status: 'active'
    });
    setEditingPlan(null);
  };

  const resetManualSubscription = () => {
    setManualSubscription({
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      paymentMethod: 'manual',
      notes: ''
    });
    setSelectedUser(null);
  };

  const handlePlanEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: plan.price,
      limits: plan.limits,
      features: plan.features,
      trialDays: plan.trialDays,
      isPublic: plan.isPublic,
      isPopular: plan.isPopular,
      status: plan.status
    });
    setPlanDialog(true);
  };

  const handlePlanDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await apiService.deletePlan(planId);
        setSuccess('Plan deleted successfully!');
        fetchData();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'trial': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading subscription data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Subscriptions
                  </Typography>
                  <Typography variant="h5">
                    {stats.activeSubscriptions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Monthly Growth
                  </Typography>
                  <Typography variant="h5">
                    {stats.monthlyGrowth}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Subscribers
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalSubscribers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Plans & Pricing" />
          <Tab label="Subscriptions" />
          <Tab label="Manual Activation" />
        </Tabs>
      </Box>

      {/* Plans & Pricing Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Subscription Plans</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetPlanForm();
                setPlanDialog(true);
              }}
            >
              Create New Plan
            </Button>
          </Box>

          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={6} lg={4} key={plan._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6">{plan.name}</Typography>
                        <Typography color="textSecondary" variant="body2">
                          {plan.description}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip 
                          label={plan.status} 
                          color={plan.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="h5" color="primary" gutterBottom>
                      {formatCurrency(plan.price.monthly)}/month
                    </Typography>

                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Limits:
                      </Typography>
                      <Typography variant="body2">
                        • Leads: {plan.limits.leads || 'Unlimited'}
                      </Typography>
                      <Typography variant="body2">
                        • AI Replies: {plan.limits.aiReplies || 'Unlimited'}
                      </Typography>
                      <Typography variant="body2">
                        • Messages: {plan.limits.messages || 'Unlimited'}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => handlePlanEdit(plan)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handlePlanDelete(plan._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Active Subscriptions
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {subscription.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {subscription.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={subscription.plan?.name || 'No Plan'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={subscription.subscription?.status || 'inactive'}
                        color={getStatusColor(subscription.subscription?.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {subscription.subscription?.startDate 
                        ? new Date(subscription.subscription.startDate).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {subscription.subscription?.endDate 
                        ? new Date(subscription.subscription.endDate).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {formatCurrency(subscription.plan?.price?.monthly || 0)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedUser(subscription);
                          setManualSubscription({
                            ...manualSubscription,
                            planId: subscription.plan?._id || ''
                          });
                          setSubscriptionDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Manual Activation Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Manual Subscription Activation
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Activate subscriptions manually for users who pay offline or need special arrangements.
          </Typography>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Quick Activation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="User Email"
                    placeholder="Enter user email to find"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Plan</InputLabel>
                    <Select
                      value={manualSubscription.planId}
                      onChange={(e) => setManualSubscription({
                        ...manualSubscription,
                        planId: e.target.value
                      })}
                    >
                      {plans.map((plan) => (
                        <MenuItem key={plan._id} value={plan._id}>
                          {plan.name} - {formatCurrency(plan.price.monthly)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary">
                    Activate Subscription
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Plan Dialog */}
      <Dialog open={planDialog} onClose={() => setPlanDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Name"
                value={planForm.name}
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Plan Type</InputLabel>
                <Select
                  value={planForm.type}
                  onChange={(e) => setPlanForm({...planForm, type: e.target.value})}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={planForm.description}
                onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Price"
                value={planForm.price.monthly}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  price: {...planForm.price, monthly: parseFloat(e.target.value)}
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Yearly Price"
                value={planForm.price.yearly}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  price: {...planForm.price, yearly: parseFloat(e.target.value)}
                })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Limits
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Leads Limit"
                value={planForm.limits.leads}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  limits: {...planForm.limits, leads: parseInt(e.target.value)}
                })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="AI Replies Limit"
                value={planForm.limits.aiReplies}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  limits: {...planForm.limits, aiReplies: parseInt(e.target.value)}
                })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Messages Limit"
                value={planForm.limits.messages}
                onChange={(e) => setPlanForm({
                  ...planForm,
                  limits: {...planForm.limits, messages: parseInt(e.target.value)}
                })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.aiAssistant}
                    onChange={(e) => setPlanForm({
                      ...planForm,
                      features: {...planForm.features, aiAssistant: e.target.checked}
                    })}
                  />
                }
                label="AI Assistant"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.whatsappIntegration}
                    onChange={(e) => setPlanForm({
                      ...planForm,
                      features: {...planForm.features, whatsappIntegration: e.target.checked}
                    })}
                  />
                }
                label="WhatsApp Integration"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.advancedAnalytics}
                    onChange={(e) => setPlanForm({
                      ...planForm,
                      features: {...planForm.features, advancedAnalytics: e.target.checked}
                    })}
                  />
                }
                label="Advanced Analytics"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.prioritySupport}
                    onChange={(e) => setPlanForm({
                      ...planForm,
                      features: {...planForm.features, prioritySupport: e.target.checked}
                    })}
                  />
                }
                label="Priority Support"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialog(false)}>Cancel</Button>
          <Button onClick={handlePlanSubmit} variant="contained">
            {editingPlan ? 'Update Plan' : 'Create Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Subscription Dialog */}
      <Dialog open={subscriptionDialog} onClose={() => setSubscriptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manual Subscription Activation
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                User: {selectedUser.name} ({selectedUser.email})
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Plan</InputLabel>
                <Select
                  value={manualSubscription.planId}
                  onChange={(e) => setManualSubscription({
                    ...manualSubscription,
                    planId: e.target.value
                  })}
                >
                  {plans.map((plan) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name} - {formatCurrency(plan.price.monthly)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={manualSubscription.startDate}
                onChange={(e) => setManualSubscription({
                  ...manualSubscription,
                  startDate: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={manualSubscription.endDate}
                onChange={(e) => setManualSubscription({
                  ...manualSubscription,
                  endDate: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={manualSubscription.status}
                  onChange={(e) => setManualSubscription({
                    ...manualSubscription,
                    status: e.target.value
                  })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="trial">Trial</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                placeholder="Add any notes about this manual activation..."
                value={manualSubscription.notes}
                onChange={(e) => setManualSubscription({
                  ...manualSubscription,
                  notes: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscriptionDialog(false)}>Cancel</Button>
          <Button onClick={handleManualSubscription} variant="contained" color="primary">
            Activate Subscription
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionManager; 