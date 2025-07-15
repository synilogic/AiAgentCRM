import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  QrCode,
  Security,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Lock,
  Verified,
  Speed,
} from '@mui/icons-material';
import apiService from '../services/api';

const PaymentModal = ({ open, onClose, planData, onSuccess, onError }) => {
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [expandedFeatures, setExpandedFeatures] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Available payment gateways with INR support
  const paymentGateways = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      logo: '💳',
      description: 'Most popular with 97% success rate',
      fees: '2% + ₹2',
      processingTime: '2-3 seconds',
      features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'],
      trustScore: 9.7,
      recommended: true,
      methods: [
        { id: 'upi', name: 'UPI', icon: <QrCode />, time: 'Instant' },
        { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard />, time: '2-3 sec' },
        { id: 'netbanking', name: 'Net Banking', icon: <AccountBalance />, time: '30 sec' },
        { id: 'wallet', name: 'Wallets', icon: <PhoneAndroid />, time: 'Instant' }
      ]
    },
    {
      id: 'cashfree',
      name: 'Cashfree',
      logo: '💰',
      description: 'Lowest fees with fast processing',
      fees: '1.75% + ₹1.5',
      processingTime: '1-2 seconds',
      features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'QR Code'],
      trustScore: 9.4,
      recommended: false,
      methods: [
        { id: 'upi', name: 'UPI', icon: <QrCode />, time: 'Instant' },
        { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard />, time: '1-2 sec' },
        { id: 'netbanking', name: 'Net Banking', icon: <AccountBalance />, time: '20 sec' },
        { id: 'wallet', name: 'Wallets', icon: <PhoneAndroid />, time: 'Instant' }
      ]
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      logo: '📱',
      description: 'Popular UPI payments',
      fees: '1.99% + ₹2',
      processingTime: '2-4 seconds',
      features: ['UPI', 'Cards', 'Wallets', 'BBPS'],
      trustScore: 9.2,
      recommended: false,
      methods: [
        { id: 'upi', name: 'UPI', icon: <QrCode />, time: 'Instant' },
        { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard />, time: '2-4 sec' },
        { id: 'wallet', name: 'Wallets', icon: <PhoneAndroid />, time: 'Instant' }
      ]
    }
  ];

  useEffect(() => {
    if (open && planData) {
      // Set default payment method for selected gateway
      const gateway = paymentGateways.find(g => g.id === selectedGateway);
      if (gateway && gateway.methods.length > 0) {
        setSelectedMethod(gateway.methods[0].id);
      }
    }
  }, [selectedGateway, open, planData]);

  const handleGatewayChange = (gatewayId) => {
    setSelectedGateway(gatewayId);
    const gateway = paymentGateways.find(g => g.id === gatewayId);
    if (gateway && gateway.methods.length > 0) {
      setSelectedMethod(gateway.methods[0].id);
    }
  };

  const calculateTotal = () => {
    if (!planData) return { amount: 0, fees: 0, total: 0 };
    
    const gateway = paymentGateways.find(g => g.id === selectedGateway);
    const amount = planData.price;
    
    // Calculate fees based on gateway
    let fees = 0;
    if (gateway) {
      const feeStr = gateway.fees;
      const percentMatch = feeStr.match(/(\d+\.?\d*)%/);
      const fixedMatch = feeStr.match(/₹(\d+\.?\d*)/);
      
      if (percentMatch) {
        fees += (amount * parseFloat(percentMatch[1])) / 100;
      }
      if (fixedMatch) {
        fees += parseFloat(fixedMatch[1]);
      }
    }
    
    return {
      amount,
      fees: Math.round(fees * 100) / 100,
      total: Math.round((amount + fees) * 100) / 100
    };
  };

  const initiatePayment = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      onError?.('Please fill all required details');
      return;
    }

    try {
      setLoading(true);
      
      const { total } = calculateTotal();
      
      // Create order
      const orderResponse = await apiService.createPaymentOrder({
        amount: total,
        currency: 'INR',
        gateway: selectedGateway,
        method: selectedMethod,
        plan_id: planData.id,
        user_details: userDetails,
        description: `Payment for ${planData.name} plan`
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      setOrderData(orderResponse);

      // Initialize payment based on selected gateway
      let paymentResult;
      
      if (selectedGateway === 'razorpay') {
        paymentResult = await initializeRazorpayPayment(orderResponse, total);
      } else if (selectedGateway === 'cashfree') {
        paymentResult = await initializeCashfreePayment(orderResponse, total);
      } else if (selectedGateway === 'phonepe') {
        paymentResult = await initializePhonePePayment(orderResponse, total);
      }

      if (paymentResult.success) {
        onSuccess?.(paymentResult);
        onClose();
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpayPayment = async (orderData, amount) => {
    return new Promise((resolve) => {
      const options = {
        key: 'rzp_test_xxxxxxxx', // Replace with actual key
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Ai Agentic CRM',
        description: `Payment for ${planData.name} plan`,
        order_id: orderData.order_id,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        theme: { color: '#3399cc' },
        handler: function (response) {
          resolve({
            success: true,
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            gateway: 'razorpay'
          });
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              error: 'Payment cancelled by user'
            });
          }
        }
      };

      // In real implementation, load Razorpay SDK and open checkout
      // For demo, simulate successful payment
      setTimeout(() => {
        resolve({
          success: true,
          payment_id: `pay_${Date.now()}`,
          order_id: orderData.order_id,
          gateway: 'razorpay'
        });
      }, 2000);
    });
  };

  const initializeCashfreePayment = async (orderData, amount) => {
    return new Promise((resolve) => {
      // In real implementation, initialize Cashfree payment
      // For demo, simulate successful payment
      setTimeout(() => {
        resolve({
          success: true,
          payment_id: `cf_${Date.now()}`,
          order_id: orderData.order_id,
          gateway: 'cashfree'
        });
      }, 1500);
    });
  };

  const initializePhonePePayment = async (orderData, amount) => {
    return new Promise((resolve) => {
      // In real implementation, initialize PhonePe payment
      // For demo, simulate successful payment
      setTimeout(() => {
        resolve({
          success: true,
          payment_id: `pp_${Date.now()}`,
          order_id: orderData.order_id,
          gateway: 'phonepe'
        });
      }, 2500);
    });
  };

  const selectedGatewayData = paymentGateways.find(g => g.id === selectedGateway);
  const pricing = calculateTotal();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="between">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Complete Your Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure payment for {planData?.name} plan
            </Typography>
          </Box>
          <Chip
            icon={<Security />}
            label="256-bit SSL"
            color="success"
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Payment Gateway Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Choose Payment Gateway
            </Typography>
            <RadioGroup
              value={selectedGateway}
              onChange={(e) => handleGatewayChange(e.target.value)}
            >
              <Grid container spacing={2}>
                {paymentGateways.map((gateway) => (
                  <Grid item xs={12} md={4} key={gateway.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedGateway === gateway.id ? 2 : 1,
                        borderColor: selectedGateway === gateway.id ? 'primary.main' : 'divider',
                        position: 'relative'
                      }}
                      onClick={() => handleGatewayChange(gateway.id)}
                    >
                      <CardContent>
                        <FormControlLabel
                          value={gateway.id}
                          control={<Radio />}
                          label=""
                          sx={{ position: 'absolute', top: 8, right: 8, m: 0 }}
                        />
                        
                        {gateway.recommended && (
                          <Chip
                            label="Recommended"
                            color="primary"
                            size="small"
                            sx={{ position: 'absolute', top: 8, left: 8 }}
                          />
                        )}
                        
                        <Box display="flex" alignItems="center" mb={2} mt={1}>
                          <Typography variant="h4" sx={{ mr: 2 }}>
                            {gateway.logo}
                          </Typography>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {gateway.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {gateway.description}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" mb={1}>
                          <Verified color="success" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">
                            {gateway.trustScore}/10 Trust Score
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Fees: {gateway.fees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Speed: {gateway.processingTime}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </Grid>

          {/* Payment Method Selection */}
          {selectedGatewayData && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Payment Method
              </Typography>
              <RadioGroup
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <Grid container spacing={2}>
                  {selectedGatewayData.methods.map((method) => (
                    <Grid item xs={12} sm={6} md={3} key={method.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedMethod === method.id ? 2 : 1,
                          borderColor: selectedMethod === method.id ? 'primary.main' : 'divider'
                        }}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <FormControlLabel
                            value={method.id}
                            control={<Radio />}
                            label=""
                            sx={{ display: 'none' }}
                          />
                          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                            {method.icon}
                          </Avatar>
                          <Typography variant="body1" fontWeight="medium">
                            {method.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {method.time}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </Grid>
          )}

          {/* User Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={userDetails.name}
                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={userDetails.phone}
                  onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Security Features */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Security Features
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedFeatures(!expandedFeatures)}
                    sx={{ ml: 1 }}
                  >
                    {expandedFeatures ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center">
                      <Lock color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">256-bit SSL</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center">
                      <Security color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">PCI Compliant</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center">
                      <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">RBI Approved</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center">
                      <Speed color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Instant Refunds</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Collapse in={expandedFeatures}>
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Your payment information is encrypted and secure. We never store your card details.
                      All transactions are processed through RBI approved payment gateways with multi-layer security.
                    </Typography>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Box width="100%">
          {/* Pricing Summary */}
          <Card sx={{ mb: 2, bgcolor: 'primary.50' }}>
            <CardContent sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" fontWeight="medium">
                    {planData?.name} Plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Via {selectedGatewayData?.name} • {selectedMethod?.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Plan: ₹{pricing.amount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fees: ₹{pricing.fees}
                  </Typography>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    Total: ₹{pricing.total}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={initiatePayment}
              disabled={loading || !userDetails.name || !userDetails.email || !userDetails.phone}
              startIcon={loading ? <CircularProgress size={16} /> : <Security />}
              size="large"
            >
              {loading ? 'Processing...' : `Pay ₹${pricing.total}`}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal; 