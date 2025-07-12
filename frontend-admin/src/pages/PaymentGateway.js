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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Key as KeyIcon,
  Webhook as WebhookIcon,
  Add,
  Edit,
  Delete,
  AttachMoney,
  PhoneAndroid,
  QrCode,
  WifiProtectedSetup,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNotifications } from '../components/NotificationSystem';

const PaymentGateway = () => {
  const { user } = useAuth();
  const [gateways, setGateways] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: 'razorpay',
    isActive: false,
    config: {
      apiKey: '',
      secretKey: '',
      webhookUrl: '',
      currency: 'USD',
      testMode: true,
    },
  });

  const { success, error, info } = useNotifications();

  const gatewayTypes = [
    {
      value: 'razorpay',
      label: 'Razorpay',
      icon: <PaymentIcon />,
      color: '#6366F1',
      description: 'Popular payment gateway for Indian businesses',
    },
    {
      value: 'paypal',
      label: 'PayPal',
      icon: <CreditCardIcon />,
      color: '#1E40AF',
      description: 'Global payment solution',
    },
    {
      value: 'stripe',
      label: 'Stripe',
      icon: <PaymentIcon />,
      color: '#6772E5',
      description: 'Developer-friendly payment platform',
    },
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
  ];

  useEffect(() => {
    loadGateways();
    loadInvoices();
  }, []);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/payment-gateways');
      setGateways(response.data);
    } catch (err) {
      console.error('Error loading gateways:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await api.get('/admin/invoices');
      setInvoices(response.data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingGateway) {
        await api.put(`/admin/payment-gateways/${editingGateway._id}`, formData);
      } else {
        await api.post('/admin/payment-gateways', formData);
      }
      setOpenDialog(false);
      setEditingGateway(null);
      resetForm();
      loadGateways();
    } catch (err) {
      console.error('Error saving gateway:', err);
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name || '',
      type: gateway.type || 'razorpay',
      isActive: gateway.isActive || false,
      config: gateway.config || {
        apiKey: '',
        secretKey: '',
        webhookUrl: '',
        currency: 'USD',
        testMode: true,
      },
    });
    setOpenDialog(true);
  };

  const toggleGatewayStatus = async (gatewayId, isActive) => {
    try {
      await api.patch(`/admin/payment-gateways/${gatewayId}`, { isActive: !isActive });
      loadGateways();
    } catch (err) {
      console.error('Error toggling gateway status:', err);
    }
  };

  const testGateway = async (gatewayId) => {
    try {
      await api.post(`/admin/payment-gateways/${gatewayId}/test`);
      // Show success message
    } catch (err) {
      console.error('Error testing gateway:', err);
    }
  };

  const generateInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/admin/invoices/${invoiceId}/generate`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error generating invoice:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'razorpay',
      isActive: false,
      config: {
        apiKey: '',
        secretKey: '',
        webhookUrl: '',
        currency: 'USD',
        testMode: true,
      },
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGateway(null);
    resetForm();
  };

  const getGatewayIcon = (type) => {
    const gateway = gatewayTypes.find(g => g.value === type);
    return gateway ? gateway.icon : <PaymentIcon />;
  };

  const getGatewayColor = (type) => {
    const gateway = gatewayTypes.find(g => g.value === type);
    return gateway ? gateway.color : '#6B7280';
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payment Gateway Integration
        </Typography>
        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Gateway
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Payment Gateways" />
            <Tab label="Invoices" />
            <Tab label="Payment Analytics" />
          </Tabs>

          {selectedTab === 0 && (
            <>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {gateways.map((gateway) => (
                    <Grid item xs={12} md={6} lg={4} key={gateway._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                bgcolor: getGatewayColor(gateway.type),
                                color: 'white',
                              }}
                            >
                              {getGatewayIcon(gateway.type)}
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {gateway.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {gatewayTypes.find(g => g.value === gateway.type)?.label}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={gateway.isActive ? 'Active' : 'Inactive'}
                              color={gateway.isActive ? 'success' : 'default'}
                              size="small"
                            />
                            {gateway.config.testMode && (
                              <Chip
                                label="Test Mode"
                                color="warning"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              Currency: {gateway.config.currency}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Webhook: {gateway.config.webhookUrl ? 'Configured' : 'Not configured'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => testGateway(gateway._id)}
                            >
                              Test
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEdit(gateway)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant={gateway.isActive ? 'outlined' : 'contained'}
                              color={gateway.isActive ? 'warning' : 'success'}
                              onClick={() => toggleGatewayStatus(gateway._id, gateway.isActive)}
                            >
                              {gateway.isActive ? 'Disable' : 'Enable'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {gateways.length === 0 && !isLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PaymentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No Payment Gateways
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Add your first payment gateway to start accepting payments.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Add Gateway
                  </Button>
                </Box>
              )}
            </>
          )}

          {selectedTab === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Invoice Management
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadInvoices}
                >
                  Refresh
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            #{invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {invoice.customer.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {invoice.customer.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${invoice.amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={getPaymentStatusColor(invoice.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Invoice">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                onClick={() => generateInvoice(invoice._id)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Payment Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Total Revenue
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        $12,450
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        +15% from last month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Successful Payments
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        1,234
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        98.5% success rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Pending Payments
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        23
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        $1,250 pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Gateway Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gateway Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gateway Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Gateway Type"
                >
                  {gatewayTypes.map((gateway) => (
                    <MenuItem key={gateway.value} value={gateway.value}>
                      {gateway.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                value={formData.config.apiKey}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, apiKey: e.target.value }
                })}
                type="password"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secret Key"
                value={formData.config.secretKey}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, secretKey: e.target.value }
                })}
                type="password"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={formData.config.webhookUrl}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, webhookUrl: e.target.value }
                })}
                placeholder="https://your-domain.com/webhook/payment"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.config.currency}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, currency: e.target.value }
                  })}
                  label="Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.config.testMode}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, testMode: e.target.checked }
                    })}
                  />
                }
                label="Test Mode"
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
                label="Active Gateway"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingGateway ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentGateway; 