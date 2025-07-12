import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Infinity as InfinityIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      // Use direct fetch without authentication for public plans endpoint
      const response = await fetch('http://localhost:5000/api/payments/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
      } else {
        setError('Failed to load plans');
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSelectedPlan(plan);
    setConfirmDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPlan) return;

    setPurchaseLoading(selectedPlan.id);
    setConfirmDialog(false);
    
    try {
      const billingCycle = isAnnual ? 'yearly' : 'monthly';
      const response = await api.post('/payments/purchase-plan', {
        planId: selectedPlan.id,
        billingCycle: billingCycle
      });

      if (response.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: response.data.razorpayKeyId,
          amount: response.data.amount * 100, // Convert to paise
          currency: response.data.currency,
          name: 'AI Agent CRM',
          description: `${response.data.plan.name} Plan Subscription`,
          order_id: response.data.orderId,
          prefill: {
            name: response.data.user.name,
            email: response.data.user.email,
            contact: response.data.user.phone
          },
          theme: {
            color: '#1976d2'
          },
          handler: async (paymentResponse) => {
            try {
              const verifyResponse = await api.post('/payments/verify-payment', {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              });

              if (verifyResponse.data.success) {
                alert('Payment successful! Your plan has been activated.');
                navigate('/dashboard');
              } else {
                setError('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              setPurchaseLoading(null);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setError(response.data.error || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to initiate payment');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'basic':
        return <PersonIcon />;
      case 'pro':
        return <BusinessIcon />;
      case 'enterprise':
        return <TrendingUpIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'basic':
        return '#10B981';
      case 'pro':
        return '#3B82F6';
      case 'enterprise':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const formatPrice = (price, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountedPrice = (monthlyPrice, annualPrice) => {
    if (isAnnual) {
      const annualSavings = (monthlyPrice * 12) - annualPrice;
      return {
        price: annualPrice,
        savings: annualSavings,
        savingsPercent: Math.round((annualSavings / (monthlyPrice * 12)) * 100)
      };
    }
    return { price: monthlyPrice, savings: 0, savingsPercent: 0 };
  };

  const formatLimit = (limit) => {
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'Not Available';
    return limit.toLocaleString();
  };

  const renderFeatureList = (features, limits) => {
    const featureList = [
      { key: 'leads', label: 'Leads', value: formatLimit(limits.leads) },
      { key: 'aiReplies', label: 'AI Replies', value: formatLimit(limits.aiReplies) },
      { key: 'messages', label: 'Messages', value: formatLimit(limits.messages) },
      { key: 'workflows', label: 'Workflows', value: formatLimit(limits.workflows) },
      { key: 'teamMembers', label: 'Team Members', value: formatLimit(limits.teamMembers) },
      { key: 'whatsappIntegration', label: 'WhatsApp Integration', enabled: features.whatsappIntegration },
      { key: 'aiAssistant', label: 'AI Assistant', enabled: features.aiAssistant },
      { key: 'advancedAnalytics', label: 'Advanced Analytics', enabled: features.advancedAnalytics },
      { key: 'customWorkflows', label: 'Custom Workflows', enabled: features.customWorkflows },
      { key: 'prioritySupport', label: 'Priority Support', enabled: features.prioritySupport },
      { key: 'apiAccess', label: 'API Access', enabled: features.apiAccess },
    ];

    return featureList.map((feature) => (
      <ListItem key={feature.key} sx={{ py: 0.5, px: 0 }}>
        <ListItemIcon sx={{ minWidth: 32 }}>
          {feature.enabled !== undefined ? (
            feature.enabled ? (
              <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <CloseIcon sx={{ color: 'error.main', fontSize: 20 }} />
            )
          ) : (
            <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2">
              {feature.label}: {feature.value || (feature.enabled ? 'Included' : 'Not Available')}
            </Typography>
          }
        />
      </ListItem>
    ));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Choose Your Plan
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Select the perfect plan for your business needs. All plans include 14-day free trial.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        {/* Billing Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Typography variant="body2">Monthly</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
              />
            }
            label=""
          />
          <Typography variant="body2">Annual</Typography>
          {isAnnual && (
            <Chip
              label="Save up to 20%"
              color="success"
              size="small"
              icon={<StarIcon />}
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {plans.map((plan) => {
          const pricing = getDiscountedPrice(plan.price.monthly, plan.price.yearly);
          const isCurrentPlan = user?.plan === plan.id;
          
          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: plan.isPopular ? 3 : 1,
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

                {isCurrentPlan && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: plan.isPopular ? 16 : -12,
                      right: -12,
                      bgcolor: 'success.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    Current Plan
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
                        bgcolor: getPlanColor(plan.type),
                        color: 'white',
                        mb: 2,
                      }}
                    >
                      {getPlanIcon(plan.type)}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {plan.description}
                    </Typography>

                    {/* Pricing */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: getPlanColor(plan.type) }}>
                        {formatPrice(pricing.price, plan.price.currency)}
                        <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>
                          /{isAnnual ? 'year' : 'month'}
                        </Typography>
                      </Typography>
                      {pricing.savings > 0 && (
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          Save {formatPrice(pricing.savings, plan.price.currency)} ({pricing.savingsPercent}% off)
                        </Typography>
                      )}
                    </Box>

                    {plan.trialDays > 0 && (
                      <Chip
                        label={`${plan.trialDays} days free trial`}
                        color="success"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Features */}
                  <List sx={{ p: 0 }}>
                    {renderFeatureList(plan.features, plan.limits)}
                  </List>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant={plan.isPopular ? "contained" : "outlined"}
                      size="large"
                      onClick={() => handlePurchase(plan)}
                      disabled={isCurrentPlan || purchaseLoading === plan.id}
                      sx={{
                        py: 1.5,
                        bgcolor: plan.isPopular ? getPlanColor(plan.type) : 'transparent',
                        borderColor: getPlanColor(plan.type),
                        color: plan.isPopular ? 'white' : getPlanColor(plan.type),
                        '&:hover': {
                          bgcolor: plan.isPopular ? getPlanColor(plan.type) : `${getPlanColor(plan.type)}10`,
                        },
                      }}
                    >
                      {purchaseLoading === plan.id ? (
                        <CircularProgress size={24} />
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        'Choose Plan'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Plan Purchase</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedPlan.name} Plan
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedPlan.description}
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', mt: 2 }}>
                {formatPrice(
                  isAnnual ? selectedPlan.price.yearly : selectedPlan.price.monthly,
                  selectedPlan.price.currency
                )}
                <Typography component="span" variant="body1">
                  /{isAnnual ? 'year' : 'month'}
                </Typography>
              </Typography>
              {selectedPlan.trialDays > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You'll get {selectedPlan.trialDays} days free trial before any charges.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmPurchase} variant="contained">
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pricing; 