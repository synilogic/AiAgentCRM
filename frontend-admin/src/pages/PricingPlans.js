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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PricingPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [],
    limits: {
      leads: 0,
      messages: 0,
      aiResponses: 0,
      integrations: 0,
      users: 1,
    },
    isActive: true,
    isPopular: false,
    trialDays: 0,
    billingCycle: 'monthly',
  });

  const planTypes = [
    { value: 'free', label: 'Free Trial', icon: <PersonIcon />, color: '#6B7280' },
    { value: 'starter', label: 'Starter', icon: <TrendingUpIcon />, color: '#10B981' },
    { value: 'professional', label: 'Professional', icon: <BusinessIcon />, color: '#3B82F6' },
    { value: 'enterprise', label: 'Enterprise', icon: <StarIcon />, color: '#8B5CF6' },
  ];

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
    { value: 'both', label: 'Both' },
  ];

  const defaultFeatures = [
    'WhatsApp Integration',
    'AI Assistant',
    'Lead Management',
    'Auto Follow-ups',
    'Analytics Dashboard',
    'Email Support',
    'Mobile App',
    'API Access',
    'Priority Support',
    'Custom Branding',
    'Advanced Analytics',
    'Team Management',
    'White-label Solution',
    'Dedicated Account Manager',
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/plans');
      setPlans(response.data);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan._id}`, formData);
      } else {
        await api.post('/admin/plans', formData);
      }
      setOpenDialog(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice || 0,
      annualPrice: plan.annualPrice || 0,
      features: plan.features || [],
      limits: plan.limits || {
        leads: 0,
        messages: 0,
        aiResponses: 0,
        integrations: 0,
        users: 1,
      },
      isActive: plan.isActive !== false,
      isPopular: plan.isPopular || false,
      trialDays: plan.trialDays || 0,
      billingCycle: plan.billingCycle || 'monthly',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await api.delete(`/admin/plans/${planId}`);
        loadPlans();
      } catch (err) {
        console.error('Error deleting plan:', err);
      }
    }
  };

  const togglePlanStatus = async (planId, isActive) => {
    try {
      await api.patch(`/admin/plans/${planId}`, { isActive: !isActive });
      loadPlans();
    } catch (err) {
      console.error('Error toggling plan status:', err);
    }
  };

  const toggleFeature = (feature) => {
    const updatedFeatures = formData.features.includes(feature)
      ? formData.features.filter(f => f !== feature)
      : [...formData.features, feature];
    setFormData({ ...formData, features: updatedFeatures });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [],
      limits: {
        leads: 0,
        messages: 0,
        aiResponses: 0,
        integrations: 0,
        users: 1,
      },
      isActive: true,
      isPopular: false,
      trialDays: 0,
      billingCycle: 'monthly',
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
    resetForm();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getPlanColor = (planName) => {
    const plan = planTypes.find(p => p.value === planName.toLowerCase());
    return plan ? plan.color : '#6B7280';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Pricing Plans
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Plan
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} lg={4} key={plan._id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: plan.isPopular ? 2 : 1,
                  borderColor: plan.isPopular ? 'primary.main' : 'divider',
                  transform: plan.isPopular ? 'scale(1.02)' : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: plan.isPopular ? 'scale(1.02)' : 'scale(1.01)',
                    boxShadow: 4,
                  },
                }}
              >
                {plan.isPopular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    Most Popular
                  </Box>
                )}

                <CardContent sx={{ p: 3 }}>
                  {/* Plan Header */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: getPlanColor(plan.name),
                        color: 'white',
                        mb: 2,
                      }}
                    >
                      {planTypes.find(p => p.value === plan.name.toLowerCase())?.icon || <PaymentIcon />}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {plan.description}
                    </Typography>
                  </Box>

                  {/* Pricing */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPrice(plan.monthlyPrice)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      per month
                    </Typography>
                    {plan.annualPrice > 0 && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                        {formatPrice(plan.annualPrice)} annually
                      </Typography>
                    )}
                  </Box>

                  {/* Features */}
                  <List sx={{ mb: 3 }}>
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: { fontWeight: 500 }
                          }}
                        />
                      </ListItem>
                    ))}
                    {plan.features.length > 5 && (
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary={`+${plan.features.length - 5} more features`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: { color: 'text.secondary', fontStyle: 'italic' }
                          }}
                        />
                      </ListItem>
                    )}
                  </List>

                  {/* Limits */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Limits
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Leads per month
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {plan.limits.leads.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Messages per month
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {plan.limits.messages.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          AI responses
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {plan.limits.aiResponses.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Status and Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={plan.isActive ? 'Active' : 'Inactive'}
                      color={plan.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(plan)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(plan._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Plan Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  label="Billing Cycle"
                >
                  {billingCycles.map((cycle) => (
                    <MenuItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Price ($)"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Annual Price ($)"
                value={formData.annualPrice}
                onChange={(e) => setFormData({ ...formData, annualPrice: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Trial Days"
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                }
                label="Mark as Popular"
              />
            </Grid>

            {/* Limits */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Plan Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Leads per month"
                    value={formData.limits.leads}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, leads: parseInt(e.target.value) || 0 }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Messages per month"
                    value={formData.limits.messages}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, messages: parseInt(e.target.value) || 0 }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="AI Responses per month"
                    value={formData.limits.aiResponses}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, aiResponses: parseInt(e.target.value) || 0 }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Users"
                    value={formData.limits.users}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, users: parseInt(e.target.value) || 1 }
                    })}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Features */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Plan Features
              </Typography>
              <Grid container spacing={2}>
                {defaultFeatures.map((feature) => (
                  <Grid item xs={12} md={6} key={feature}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                        />
                      }
                      label={feature}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Plan"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPlan ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PricingPlans; 