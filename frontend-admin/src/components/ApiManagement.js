import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Tabs, Tab, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Alert, Snackbar, CircularProgress, LinearProgress, Tooltip
} from '@mui/material';
import {
  Api, Add, Edit, Delete, Visibility, VisibilityOff, Refresh, Copy, TrendingUp, 
  Security, Analytics, Assessment, Close, MoreVert, Warning, CheckCircle, Error, ContentCopy
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ApiService from '../services/api';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ApiManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '', description: '', permissions: [], rateLimit: 1000, ipWhitelist: []
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const loadData = useCallback(async () => {
    try {
      const [keysResponse, analyticsResponse] = await Promise.all([
        ApiService.getApiKeys(page + 1, rowsPerPage),
        ApiService.getApiAnalytics('30d')
      ]);
      setApiKeys(keysResponse.keys || []);
      setAnalytics(analyticsResponse || {});
    } catch (error) {
      console.error('Failed to load API data:', error);
      setApiKeys(generateMockKeys());
      setAnalytics(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateMockKeys = () => [
    {
      id: '1', name: 'Frontend App', key: 'ak_live_123...', status: 'active',
      permissions: ['read', 'write'], rateLimit: 1000, requests: 15420,
      createdAt: new Date(Date.now() - 86400000 * 30)
    },
    {
      id: '2', name: 'Mobile App', key: 'ak_live_456...', status: 'active',
      permissions: ['read'], rateLimit: 500, requests: 8230,
      createdAt: new Date(Date.now() - 86400000 * 15)
    }
  ];

  const generateMockAnalytics = () => ({
    totalRequests: 125000,
    successRate: 98.5,
    avgResponseTime: 145,
    topEndpoints: [
      { endpoint: '/api/users', requests: 45000 },
      { endpoint: '/api/leads', requests: 35000 },
      { endpoint: '/api/analytics', requests: 25000 }
    ],
    requestsOverTime: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 5000) + 2000
    }))
  });

  const handleCreateKey = async () => {
    try {
      await ApiService.createApiKey(newKeyData);
      setSnackbar({ open: true, message: 'API key created successfully', severity: 'success' });
      setDialogOpen(false);
      setNewKeyData({ name: '', description: '', permissions: [], rateLimit: 1000, ipWhitelist: [] });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create API key', severity: 'error' });
    }
  };

  const handleDeleteKey = async (keyId) => {
    try {
      await ApiService.deleteApiKey(keyId);
      setSnackbar({ open: true, message: 'API key deleted successfully', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete API key', severity: 'error' });
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      await ApiService.revokeApiKey(keyId);
      setSnackbar({ open: true, message: 'API key revoked successfully', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to revoke API key', severity: 'error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'info' });
  };

  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleDateString();

  const requestsChartData = {
    labels: analytics.requestsOverTime?.map(d => d.date) || [],
    datasets: [{
      label: 'API Requests',
      data: analytics.requestsOverTime?.map(d => d.requests) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const endpointsChartData = {
    labels: analytics.topEndpoints?.map(e => e.endpoint) || [],
    datasets: [{
      data: analytics.topEndpoints?.map(e => e.requests) || [],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">API Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Create API Key
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Api sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{apiKeys.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Keys</Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.totalRequests?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.successRate?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ fontSize: 40, mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.avgResponseTime || 0}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Avg Response</Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="API Keys" />
            <Tab label="Analytics" />
            <Tab label="Usage Logs" />
          </Tabs>
        </Box>

        {selectedTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Rate Limit</TableCell>
                  <TableCell>Requests</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {key.key}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(key.key)}>
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={key.status}
                        color={key.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {key.permissions.map((perm) => (
                        <Chip key={perm} label={perm} size="small" sx={{ mr: 1 }} />
                      ))}
                    </TableCell>
                    <TableCell>{key.rateLimit}/hour</TableCell>
                    <TableCell>{key.requests?.toLocaleString() || 0}</TableCell>
                    <TableCell>{formatTimestamp(key.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRevokeKey(key.id)}>
                        <Warning />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteKey(key.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={apiKeys.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </TableContainer>
        )}

        {selectedTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>API Requests Over Time</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={requestsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>Top Endpoints</Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={endpointsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {selectedTab === 2 && (
          <Alert severity="info">
            Usage logs functionality will be implemented based on your specific logging requirements.
          </Alert>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newKeyData.name}
            onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newKeyData.description}
            onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Rate Limit (per hour)"
            type="number"
            value={newKeyData.rateLimit}
            onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateKey}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApiManagement; 