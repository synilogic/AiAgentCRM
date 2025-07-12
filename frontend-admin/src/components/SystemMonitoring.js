import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Avatar,
  Badge,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Memory,
  Storage,
  Speed,
  NetworkCheck,
  Database,
  Security,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  CheckCircle,
  Info,
  Refresh,
  Settings,
  Timeline,
  Computer,
  Cloud,
  Api,
  Backup,
  CleaningServices,
  HealthAndSafety,
  MonitorHeart,
  PlayArrow,
  Pause,
  Stop,
  ExpandMore,
  ExpandLess,
  FilterList,
  Download,
  Share,
  Close,
  Notifications,
  NotificationsActive,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Assessment,
  Dashboard,
  SignalWifi4Bar,
  SignalWifiOff,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../services/api';

// Enhanced styled components
const MetricCard = styled(Card)(({ theme, status }) => {
  const statusColors = {
    healthy: theme.palette.success.main,
    warning: theme.palette.warning.main,
    critical: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  return {
    transition: 'all 0.3s ease',
    borderLeft: `4px solid ${statusColors[status] || theme.palette.grey[400]}`,
    background: alpha(statusColors[status] || theme.palette.grey[400], 0.02),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  };
});

const RealTimeIndicator = styled(motion.div)(({ theme, connected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: connected 
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.error.main, 0.1),
  color: connected ? theme.palette.success.main : theme.palette.error.main,
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `2px solid ${connected ? theme.palette.success.main : theme.palette.error.main}`,
}));

const AlertCard = styled(Paper)(({ theme, severity }) => {
  const severityColors = {
    low: theme.palette.info.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
    critical: theme.palette.error.dark,
  };

  return {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderLeft: `4px solid ${severityColors[severity] || theme.palette.grey[400]}`,
    background: alpha(severityColors[severity] || theme.palette.grey[400], 0.03),
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateX(8px)',
      boxShadow: theme.shadows[4],
    },
  };
});

const MetricGauge = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  position: 'relative',
}));

const SystemMonitoring = () => {
  // State management
  const [systemMetrics, setSystemMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [cleanupStatus, setCleanupStatus] = useState({});
  const [backupStatus, setBackupStatus] = useState({});
  const [apiMetrics, setApiMetrics] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [expandedCards, setExpandedCards] = useState({});
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState('all');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, data: null });

  // Load system monitoring data
  const loadMonitoringData = useCallback(async () => {
    try {
      const [
        healthResponse,
        metricsResponse,
        performanceResponse,
        securityResponse,
        cleanupResponse,
        backupResponse,
        apiResponse
      ] = await Promise.all([
        ApiService.getSystemHealth(),
        ApiService.getSystemMetrics(selectedPeriod),
        ApiService.getPerformanceMetrics(selectedPeriod),
        ApiService.getSecurityAlerts(1, 50),
        ApiService.getCleanupStatus(),
        ApiService.getBackupJobs(1, 10),
        ApiService.getApiAnalytics(selectedPeriod)
      ]);

      setSystemHealth(healthResponse);
      setSystemMetrics(metricsResponse);
      setPerformanceData(performanceResponse);
      setSecurityAlerts(securityResponse.alerts || []);
      setCleanupStatus(cleanupResponse);
      setBackupStatus(backupResponse);
      setApiMetrics(apiResponse);

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      // Use mock data for development
      setSystemMetrics(generateMockSystemMetrics());
      setPerformanceData(generateMockPerformanceData());
      setSecurityAlerts(generateMockSecurityAlerts());
      setSystemHealth(generateMockSystemHealth());
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Initialize component
  useEffect(() => {
    loadMonitoringData();
    
    // Set up auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, refreshInterval);
    }

    // Set up real-time monitoring
    ApiService.addEventListener('system_metric_critical', handleCriticalMetric);
    ApiService.addEventListener('system_metric_warning', handleWarningMetric);
    ApiService.addEventListener('security_alert', handleSecurityAlert);
    ApiService.addEventListener('system_health_update', handleHealthUpdate);
    ApiService.subscribeToMonitoring();

    return () => {
      if (interval) clearInterval(interval);
      ApiService.removeEventListener('system_metric_critical', handleCriticalMetric);
      ApiService.removeEventListener('system_metric_warning', handleWarningMetric);
      ApiService.removeEventListener('security_alert', handleSecurityAlert);
      ApiService.removeEventListener('system_health_update', handleHealthUpdate);
      ApiService.unsubscribeFromMonitoring();
    };
  }, [loadMonitoringData, autoRefresh, refreshInterval]);

  // Real-time event handlers
  const handleCriticalMetric = (metric) => {
    if (alertsEnabled) {
      console.warn('Critical metric:', metric);
      if (soundEnabled) {
        // Play alert sound
        new Audio('/alert-critical.mp3').play().catch(() => {});
      }
    }
  };

  const handleWarningMetric = (metric) => {
    if (alertsEnabled) {
      console.warn('Warning metric:', metric);
    }
  };

  const handleSecurityAlert = (alert) => {
    if (alertsEnabled) {
      setSecurityAlerts(prev => [alert, ...prev]);
      if (soundEnabled && alert.severity === 'high') {
        new Audio('/alert-security.mp3').play().catch(() => {});
      }
    }
  };

  const handleHealthUpdate = (health) => {
    setSystemHealth(health);
  };

  // Filter alerts based on selection
  useEffect(() => {
    if (alertFilter === 'all') {
      setFilteredAlerts(securityAlerts);
    } else {
      setFilteredAlerts(securityAlerts.filter(alert => alert.severity === alertFilter));
    }
  }, [securityAlerts, alertFilter]);

  // Generate mock data for development
  const generateMockSystemMetrics = () => ({
    cpu_usage: { value: 45, unit: 'percentage', status: 'healthy', trend: 'up' },
    memory_usage: { value: 67, unit: 'percentage', status: 'warning', trend: 'up' },
    disk_usage: { value: 23, unit: 'percentage', status: 'healthy', trend: 'stable' },
    network_io: { value: 150, unit: 'mbps', status: 'healthy', trend: 'down' },
    database_connections: { value: 12, unit: 'count', status: 'healthy', trend: 'stable' },
    response_time: { value: 120, unit: 'ms', status: 'healthy', trend: 'down' },
    error_rate: { value: 0.02, unit: 'percentage', status: 'healthy', trend: 'stable' },
    uptime: { value: 99.95, unit: 'percentage', status: 'healthy', trend: 'stable' },
  });

  const generateMockPerformanceData = () => ({
    cpuHistory: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.floor(Math.random() * 50) + 30
    })),
    memoryHistory: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.floor(Math.random() * 40) + 50
    })),
    responseTimeHistory: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.floor(Math.random() * 100) + 80
    })),
    throughput: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.floor(Math.random() * 1000) + 500
    })),
  });

  const generateMockSecurityAlerts = () => [
    {
      id: '1',
      severity: 'medium',
      type: 'suspicious_activity',
      message: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 300000),
      resolved: false,
      source: '192.168.1.100'
    },
    {
      id: '2',
      severity: 'low',
      type: 'rate_limit_exceeded',
      message: 'API rate limit exceeded for key abc123',
      timestamp: new Date(Date.now() - 600000),
      resolved: true,
      source: 'api_key_abc123'
    },
    {
      id: '3',
      severity: 'high',
      type: 'data_breach_attempt',
      message: 'Unauthorized database access attempt',
      timestamp: new Date(Date.now() - 1200000),
      resolved: false,
      source: '10.0.0.50'
    },
  ];

  const generateMockSystemHealth = () => ({
    overall: 'healthy',
    components: {
      database: { status: 'healthy', message: 'All connections stable' },
      api: { status: 'healthy', message: 'Response times normal' },
      storage: { status: 'warning', message: 'Disk usage at 85%' },
      network: { status: 'healthy', message: 'Network latency normal' },
      security: { status: 'warning', message: '3 active alerts' },
    },
    uptime: 99.95,
    lastChecked: new Date(),
  });

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748b',
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <Info />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="error" />;
      case 'down': return <TrendingDown color="success" />;
      default: return <Timeline color="action" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleRunHealthCheck = async () => {
    try {
      setLoading(true);
      await ApiService.performHealthCheck();
      await loadMonitoringData();
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    try {
      await ApiService.runCleanup();
      await loadMonitoringData();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await ApiService.runBackup();
      await loadMonitoringData();
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleAlertClick = (alert) => {
    setDetailsDialog({ open: true, data: alert });
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              System Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Real-time system health, performance metrics, and security monitoring
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
              <RealTimeIndicator
                connected={isConnected}
                animate={{ scale: isConnected ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {isConnected ? <SignalWifi4Bar /> : <SignalWifiOff />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </RealTimeIndicator>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>

              <Tooltip title="Refresh Data">
                <IconButton onClick={loadMonitoringData} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Control Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Refresh"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="Sound"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HealthAndSafety />}
                onClick={handleRunHealthCheck}
              >
                Health Check
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CleaningServices />}
                onClick={handleRunCleanup}
              >
                Cleanup
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Backup />}
                onClick={handleCreateBackup}
              >
                Backup
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* System Health Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          System Health Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {Object.entries(systemHealth.components || {}).map(([component, data]) => (
                <Grid item xs={6} md={3} key={component}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ mb: 1 }}>
                        {getStatusIcon(data.status)}
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {component.toUpperCase()}
                      </Typography>
                      <Chip
                        label={data.status}
                        color={getStatusColor(data.status)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {data.message}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {systemHealth.uptime?.toFixed(2) || '99.95'}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Last checked: {formatTimestamp(systemHealth.lastChecked)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(systemMetrics).map(([metric, data]) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={metric}>
            <MetricCard status={data.status}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {data.value}
                      {data.unit === 'percentage' ? '%' : data.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {getTrendIcon(data.trend)}
                    <Chip
                      label={data.status}
                      color={getStatusColor(data.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data.unit === 'percentage' ? data.value : (data.value / 100) * 100}
                  color={getStatusColor(data.status)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </MetricCard>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Monitoring */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Performance" />
            <Tab label="Security" />
            <Tab label="Database" />
            <Tab label="API" />
          </Tabs>
        </Box>

        {/* Performance Tab */}
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>CPU Usage</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: performanceData.cpuHistory?.map(d => d.time) || [],
                    datasets: [
                      {
                        label: 'CPU Usage (%)',
                        data: performanceData.cpuHistory?.map(d => d.value) || [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Memory Usage</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: performanceData.memoryHistory?.map(d => d.time) || [],
                    datasets: [
                      {
                        label: 'Memory Usage (%)',
                        data: performanceData.memoryHistory?.map(d => d.value) || [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Response Time</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: performanceData.responseTimeHistory?.map(d => d.time) || [],
                    datasets: [
                      {
                        label: 'Response Time (ms)',
                        data: performanceData.responseTimeHistory?.map(d => d.value) || [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Throughput</Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: performanceData.throughput?.map(d => d.time) || [],
                    datasets: [
                      {
                        label: 'Requests/sec',
                        data: performanceData.throughput?.map(d => d.value) || [],
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderColor: '#8b5cf6',
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Security Tab */}
        {selectedTab === 1 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Security Alerts</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={alertFilter}
                  label="Filter"
                  onChange={(e) => setAlertFilter(e.target.value)}
                >
                  <MenuItem value="all">All Alerts</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Grid container spacing={2}>
              {filteredAlerts.map((alert) => (
                <Grid item xs={12} key={alert.id}>
                  <AlertCard
                    severity={alert.severity}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {alert.message}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {alert.type} • {formatTimestamp(alert.timestamp)} • {alert.source}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={alert.severity}
                          color={getStatusColor(alert.severity === 'high' ? 'critical' : alert.severity)}
                          size="small"
                        />
                        {alert.resolved && (
                          <Chip label="Resolved" color="success" size="small" />
                        )}
                      </Box>
                    </Box>
                  </AlertCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Database Tab */}
        {selectedTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Database Monitoring</Typography>
            <Alert severity="info">
              Database monitoring features will be implemented based on your specific database setup.
            </Alert>
          </Box>
        )}

        {/* API Tab */}
        {selectedTab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>API Monitoring</Typography>
            <Alert severity="info">
              API monitoring and analytics will be displayed here.
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Alert Details</Typography>
            <IconButton onClick={() => setDetailsDialog({ open: false, data: null })}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.data && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Message:</strong> {detailsDialog.data.message}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Severity:</strong> {detailsDialog.data.severity}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Type:</strong> {detailsDialog.data.type}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Source:</strong> {detailsDialog.data.source}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Time:</strong> {formatTimestamp(detailsDialog.data.timestamp)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Status:</strong> {detailsDialog.data.resolved ? 'Resolved' : 'Active'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, data: null })}>
            Close
          </Button>
          {detailsDialog.data && !detailsDialog.data.resolved && (
            <Button variant="contained" onClick={() => console.log('Resolve alert')}>
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemMonitoring; 