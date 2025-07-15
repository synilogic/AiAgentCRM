import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Upgrade as UpgradeIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import { styled } from '@mui/material/styles';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const StyledCard = styled(Card)(({ theme, popular }) => ({
  position: 'relative',
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  border: popular ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(0,0,0,0.12)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  ...(popular && {
    '&::before': {
      content: '"Most Popular"',
      position: 'absolute',
      top: -12,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      padding: '4px 16px',
      borderRadius: 12,
      fontSize: '0.75rem',
      fontWeight: 'bold',
    },
  }),
}));

const Subscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch plans
  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError
  } = useQuery(
    ['plans'],
    () => apiService.getPlans(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch user subscription
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError
  } = useQuery(
    ['user-subscription'],
    () => apiService.getSubscription(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch payment history
  const {
    data: paymentHistory,
    isLoading: historyLoading
  } = useQuery(
    ['payment-history'],
    () => apiService.getPaymentHistory(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Subscribe to plan mutation (updated to handle Razorpay)
  const subscribeMutation = useMutation(
    ({ planId, billingCycle }) => apiService.updateSubscription(planId, billingCycle),
    {
      onSuccess: () => {
        showNotification('Successfully subscribed to plan!');
        queryClient.invalidateQueries(['user-subscription']);
        setUpgradeDialog(false);
        setSelectedPlan(null);
      },
      onError: (error) => {
        showNotification('Failed to subscribe to plan', 'error');
      }
    }
  );

  const showNotification = (message, type = 'success') => {
    setNotification({ open: true, message, type });
    setTimeout(() => {
      setNotification({ open: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    
    setPaymentLoading(true);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showNotification('Failed to load payment system. Please try again.', 'error');
        setPaymentLoading(false);
        return;
      }

      // Create payment order
      const orderResponse = await apiService.post('/payments/razorpay/create-order', {
        planId: selectedPlan._id,
        billingCycle: billingCycle
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create payment order');
      }

      const { order, payment, razorpayKeyId, plan } = orderResponse;

      // Configure Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Agent CRM',
        description: `Subscription to ${plan.name} - ${billingCycle}`,
        order_id: order.id,
        receipt: order.receipt,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#1976d2' // Material-UI primary color
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiService.post('/payments/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: payment.id
            });

            if (verifyResponse.success) {
              showNotification('Payment successful! Your subscription has been updated.', 'success');
              queryClient.invalidateQueries(['user-subscription']);
              queryClient.invalidateQueries(['payment-history']);
              setUpgradeDialog(false);
              setSelectedPlan(null);
            } else {
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            showNotification('Payment verification failed. Please contact support.', 'error');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
            showNotification('Payment cancelled', 'info');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initialization error:', error);
      showNotification(error.message || 'Failed to initialize payment. Please try again.', 'error');
      setPaymentLoading(false);
    }
  };

  const getCurrentPlan = () => {
    return subscriptionData?.subscription?.plan;
  };

  const getUsagePercentage = (current, limit) => {
    if (!limit || limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Assuming amounts are in paise/cents
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const plans = plansData?.plans || [];
  const currentPlan = getCurrentPlan();
  const usage = subscriptionData?.usage || {};

  if (plansError || subscriptionError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load subscription data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Subscription & Billing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription plan and billing preferences
        </Typography>
      </Box>

      {/* Notification */}
      {notification.open && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 3 }}
          onClose={() => setNotification({ open: false, message: '', type: 'success' })}
        >
          {notification.message}
        </Alert>
      )}

      {/* Current Plan & Usage */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Current Plan
                  </Typography>
                  {subscriptionLoading ? (
                    <Skeleton width={150} height={32} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {currentPlan?.name || 'No Plan'}
                    </Typography>
                  )}
                  {subscriptionData?.subscription?.status && (
                    <Chip 
                      label={subscriptionData.subscription.status} 
                      color={subscriptionData.subscription.status === 'active' ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<UpgradeIcon />}
                  onClick={() => setUpgradeDialog(true)}
                  disabled={subscriptionLoading}
                >
                  Change Plan
                </Button>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom>
                Usage Overview
              </Typography>
              
              {subscriptionLoading ? (
                <Box>
                  {[1, 2, 3, 4].map((i) => (
                    <Box key={i} mb={2}>
                      <Skeleton width="100%" height={20} />
                      <Skeleton width="100%" height={10} sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {[
                    { key: 'leads', label: 'Leads', limit: currentPlan?.limits?.leads },
                    { key: 'aiReplies', label: 'AI Replies', limit: currentPlan?.limits?.aiReplies },
                    { key: 'messages', label: 'Messages', limit: currentPlan?.limits?.messages },
                    { key: 'followUps', label: 'Follow-ups', limit: currentPlan?.limits?.followUps }
                  ].map((item) => {
                    const current = usage[item.key] || 0;
                    const limit = item.limit;
                    const percentage = getUsagePercentage(current, limit);
                    
                    return (
                      <Grid item xs={12} sm={6} key={item.key}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {item.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {(current || 0).toLocaleString()} / {limit === -1 ? '∞' : limit !== undefined ? limit.toLocaleString() : '∞'}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            color={getUsageColor(percentage)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing Information
              </Typography>
              
              {subscriptionLoading ? (
                <Box>
                  <Skeleton width="100%" height={20} />
                  <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
                  <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Box>
                  {subscriptionData?.subscription?.endDate && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Next Billing Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(subscriptionData.subscription.endDate)}
                      </Typography>
                    </Box>
                  )}
                  
                  {currentPlan && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Cost
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(currentPlan.price?.monthly || 0)}
                      </Typography>
                    </Box>
                  )}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={subscriptionData?.subscription?.autoRenew || false}
                        onChange={(e) => {
                          // Handle auto-renew toggle
                        }}
                      />
                    }
                    label="Auto-renew"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Plans */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Available Plans
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={billingCycle === 'yearly'}
                onChange={(e) => setBillingCycle(e.target.checked ? 'yearly' : 'monthly')}
              />
            }
            label="Annual Billing (Save 20%)"
          />
        </Box>

        <Grid container spacing={3}>
          {plansLoading ? (
            [1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton width="100%" height={60} />
                    <Skeleton width="60%" height={40} sx={{ mt: 2 }} />
                    <Skeleton width="100%" height={100} sx={{ mt: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan._id}>
                <StyledCard popular={plan.isPopular}>
                  <CardContent sx={{ p: 3 }}>
                    <Box textAlign="center" mb={3}>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {plan.description}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {formatCurrency(plan.price?.[billingCycle] || 0)}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </Typography>
                      </Typography>
                    </Box>

                    <List dense>
                      {plan.features && Object.entries(plan.features)
                        .filter(([key, value]) => value === true)
                        .map(([key, value], index) => {
                          // Convert camelCase to readable text
                          const featureName = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace(/Ai /g, 'AI ')
                            .replace(/Api /g, 'API ')
                            .replace(/Sso/g, 'SSO');
                          
                          return (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={featureName} 
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          );
                        })}
                    </List>

                    <Box mt={3}>
                      <Button
                        fullWidth
                        variant={currentPlan?._id === plan._id ? "outlined" : "contained"}
                        color="primary"
                        size="large"
                        disabled={currentPlan?._id === plan._id || subscribeMutation.isLoading}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setUpgradeDialog(true);
                        }}
                      >
                        {currentPlan?._id === plan._id ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Payment History */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Payment History
            </Typography>
            <IconButton size="small">
              <DownloadIcon />
            </IconButton>
          </Box>

          {historyLoading ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <Box key={i} display="flex" justifyContent="space-between" py={2}>
                  <Skeleton width="30%" height={20} />
                  <Skeleton width="20%" height={20} />
                  <Skeleton width="15%" height={20} />
                  <Skeleton width="10%" height={20} />
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory?.payments?.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status} 
                          color={payment.status === 'paid' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ReceiptIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!paymentHistory?.payments || paymentHistory.payments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No payment history available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog 
        open={upgradeDialog} 
        onClose={() => setUpgradeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Plan Change
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to change your plan to:
              </Typography>
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1} border="1px solid" borderColor="divider">
                <Typography variant="h6" fontWeight="bold">
                  {selectedPlan.name}
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatCurrency(selectedPlan.price?.[billingCycle] || 0)}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </Typography>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={2}>
                Your new plan will be effective immediately and you'll be charged accordingly.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            variant="contained"
            disabled={subscribeMutation.isLoading || paymentLoading}
          >
            {paymentLoading ? 'Initializing Payment...' : subscribeMutation.isLoading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscription; 