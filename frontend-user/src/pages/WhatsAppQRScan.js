import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Wifi as WifiIcon,
  LinkOff as LinkOffIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const WhatsAppQRScan = () => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getWhatsAppQRCode();
      
      if (response.success) {
        setQrCode(response.qrCode);
        setConnectionStatus('waiting');
        setSuccess('QR Code generated successfully. Please scan with your WhatsApp mobile app.');
      } else {
        setError(response.error || 'Failed to generate QR code');
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await apiService.checkWhatsAppConnection();
      
      if (response.success) {
        const { connected, status, details } = response;
        setIsConnected(connected);
        setConnectionStatus(status || 'disconnected');
        setConnectionDetails(details);
        
        if (connected) {
          setQrCode(null);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
      // Don't show error for status checks to avoid spam
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await apiService.disconnectWhatsApp();
      
      if (response.success) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setConnectionDetails(null);
        setQrCode(null);
        setSuccess('WhatsApp disconnected successfully');
        setDisconnectDialogOpen(false);
      } else {
        setError(response.error || 'Failed to disconnect WhatsApp');
      }
    } catch (err) {
      console.error('Failed to disconnect WhatsApp:', err);
      setError('Failed to disconnect WhatsApp. Please try again.');
    }
  };

  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'waiting':
        return 'warning';
      case 'error':
        return 'error';
      case 'connecting':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'waiting':
        return 'Waiting for QR Scan';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon />;
      case 'waiting':
      case 'connecting':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        WhatsApp QR Scan
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main QR Code Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WhatsAppIcon sx={{ mr: 2, color: '#25D366', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Connect WhatsApp Web
                  </Typography>
                </Box>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={checkConnectionStatus}
                  size="small"
                  variant="outlined"
                >
                  Refresh
                </Button>
              </Box>

              {/* Connection Status */}
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={getStatusIcon()}
                  label={getStatusText()}
                  color={getStatusColor()}
                  sx={{ fontSize: '1rem', py: 1, mr: 2 }}
                />
                {isConnected && connectionDetails && (
                  <Button
                    startIcon={<LinkOffIcon />}
                    onClick={() => setDisconnectDialogOpen(true)}
                    color="error"
                    variant="outlined"
                    size="small"
                  >
                    Disconnect
                  </Button>
                )}
              </Box>

              {/* QR Code Display */}
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Generating QR Code...
                  </Typography>
                </Box>
              ) : qrCode ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      display: 'inline-block',
                      p: 3,
                      borderRadius: 3,
                      bgcolor: 'white',
                    }}
                  >
                    <img
                      src={qrCode}
                      alt="WhatsApp QR Code"
                      style={{
                        width: 300,
                        height: 300,
                        maxWidth: '100%',
                      }}
                    />
                  </Paper>
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Scan this QR code with your WhatsApp mobile app
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>
                    The QR code will refresh automatically every 30 seconds
                  </Typography>
                </Box>
              ) : isConnected ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1, color: 'success.main' }}>
                    WhatsApp Connected Successfully!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    You can now send and receive messages through the platform.
                  </Typography>
                  {connectionDetails && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Connection Details:
                      </Typography>
                      {connectionDetails.deviceName && (
                        <Typography variant="body2" color="text.secondary">
                          Device: {connectionDetails.deviceName}
                        </Typography>
                      )}
                      {connectionDetails.phoneNumber && (
                        <Typography variant="body2" color="text.secondary">
                          Phone: {connectionDetails.phoneNumber}
                        </Typography>
                      )}
                      {connectionDetails.connectedAt && (
                        <Typography variant="body2" color="text.secondary">
                          Connected: {new Date(connectionDetails.connectedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <QrCodeIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Generate QR Code
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    Click the button below to generate a QR code for WhatsApp Web connection.
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                {!isConnected && (
                  <Button
                    variant="contained"
                    startIcon={<QrCodeIcon />}
                    onClick={generateQRCode}
                    disabled={isLoading}
                    size="large"
                  >
                    {isLoading ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions & Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                How to Connect
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      1
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Generate QR Code"
                    secondary="Click the 'Generate QR Code' button above"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      2
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Open WhatsApp on Your Phone"
                    secondary="Open WhatsApp on your mobile device"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      3
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Scan QR Code"
                    secondary="Go to Settings > Linked Devices > Link a Device"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      4
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Start Messaging"
                    secondary="Once connected, you can send and receive messages"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Send Messages"
                    secondary="Send text messages to your leads"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Receive Messages"
                    secondary="Get notified of incoming messages"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto Responses"
                    secondary="Set up automated responses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Lead Management"
                    secondary="Automatically create leads from messages"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={() => setDisconnectDialogOpen(false)}
      >
        <DialogTitle>Disconnect WhatsApp</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again to reconnect.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDisconnect} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppQRScan; 