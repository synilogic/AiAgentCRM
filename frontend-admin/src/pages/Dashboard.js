import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Fade,
  Slide,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  AttachMoney,
  Notifications,
  Refresh,
  Circle,
  Security,
  Warning,
  CheckCircle,
  Error,
  Speed,
  Storage,
  Memory,
  Api,
  Cloud,
  Timeline,
  Assessment,
  Shield,
  Backup,
  Settings,
  Info,
  ExpandMore,
  ExpandLess,
  Fullscreen,
  Close,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  FilterList,
  Search,
  Download,
  Share,
  MoreVert,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { Line, Bar, Doughnut, Area } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Enhanced styled components
const StatsCard = styled(Card)(({ theme, variant = 'primary' }) => {
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    success: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
    warning: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
    error: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
    info: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
  };

  return {
    background: gradients[variant],
    color: 'white',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, transparent 30%, ${alpha(theme.palette.common.white, 0.1)} 50%, transparent 70%)`,
      transform: 'translateX(-100%)',
      transition: 'transform 0.6s ease',
    },
    '&:hover::before': {
      transform: 'translateX(100%)',
    },
  };
});

const SystemHealthCard = styled(Paper)(({ theme, status }) => {
  const statusColors = {
    healthy: theme.palette.success.main,
    warning: theme.palette.warning.main,
    critical: theme.palette.error.main,
    degraded: theme.palette.info.main,
  };

  return {
    padding: theme.spacing(3),
    borderLeft: `6px solid ${statusColors[status] || theme.palette.grey[400]}`,
    background: alpha(statusColors[status] || theme.palette.grey[400], 0.02),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: theme.shadows[8],
    },
  };
});

const RealTimeIndicator = styled(Box)(({ theme, connected }) => ({
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
  animation: connected ? 'pulse 2s infinite' : 'none',
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.7 },
    '100%': { opacity: 1 },
  },
}));

const SecurityAlertCard = styled(Paper)(({ theme, severity }) => {
  const severityColors = {
    low: theme.palette.info.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
    critical: theme.palette.error.dark,
  };

  return {
    padding: theme.spacing(2),
    borderLeft: `4px solid ${severityColors[severity] || theme.palette.grey[400]}`,
    marginBottom: theme.spacing(1),
    background: alpha(severityColors[severity] || theme.palette.grey[400], 0.03),
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateX(6px)',
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

const Dashboard = () => {
  const { user } = useAuth();
  
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [apiMetrics, setApiMetrics] = useState({});
  const [backupStatus, setBackupStatus] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);

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

  // Load comprehensive dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch(`/api/admin/dashboard/comprehensive?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
        setSystemHealth(data.data.system.health);
        setSecurityAlerts(data.data.security.alerts.breakdown || []);
        setApiMetrics(data.data.api);
        setBackupStatus(data.data.data.backups);
        setPerformanceMetrics(data.data.metrics.performance);
      } else {
        // Use mock data for development
        setDashboardData(generateMockDashboardData());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(generateMockDashboardData());
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  // Initialize real-time connections
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDashboardData, autoRefresh, refreshInterval]);

  // Handle time frame change
  const handleTimeframeChange = (newTimeframe) => {
    setSelectedTimeframe(newTimeframe);
    setLoading(true);
  };

  // Handle card expansion
  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Handle alert click
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setAlertDialogOpen(true);
  };

  // Generate mock data for development
  const generateMockDashboardData = () => ({
    timestamp: new Date(),
    timeframe: selectedTimeframe,
    system: {
      health: {
        overall: 'healthy',
        uptime: 99.9,
        environment: 'production',
        version: '1.0.0'
      }
    },
    metrics: {
      current: {
        cpu_usage: { value: 45, unit: 'percentage', status: 'healthy' },
        memory_usage: { value: 67, unit: 'percentage', status: 'warning' },
        disk_usage: { value: 23, unit: 'percentage', status: 'healthy' },
        database_connections: { value: 12, unit: 'count', status: 'healthy' },
        response_time: { value: 120, unit: 'ms', status: 'healthy' }
      },
      performance: {
        averageResponseTime: 145,
        throughput: 1250,
        errorRate: 0.02,
        uptime: 99.95
      }
    },
    security: {
      alerts: {
        active: 3,
        breakdown: {
          low: { count: 1, types: ['failed_login'] },
          medium: { count: 2, types: ['suspicious_activity'] },
          high: { count: 0, types: [] },
          critical: { count: 0, types: [] }
        },
        criticalThreats: 0
      },
      threatIntelligence: []
    },
    api: {
      keys: {
        total: 25,
        active: 22,
        suspended: 3,
        totalRequests: 125000,
        totalBandwidth: 2500000
      },
      requests: {
        totalInPeriod: 8500,
        averageResponseTime: 145,
        errorRate: 0.02
      }
    },
    users: {
      total: 1250,
      active: 890,
      newUsers: 45,
      growth: 12.5
    },
    business: {
      totalRevenue: 125000,
      totalSubscribers: 850,
      plans: [
        { name: 'Free', subscribers: 400, revenue: 0 },
        { name: 'Pro', subscribers: 350, revenue: 87500 },
        { name: 'Enterprise', subscribers: 100, revenue: 37500 }
      ]
    },
    data: {
      backups: {
        recent: [
          { status: 'completed', createdAt: new Date(Date.now() - 3600000) },
          { status: 'completed', createdAt: new Date(Date.now() - 86400000) },
          { status: 'failed', createdAt: new Date(Date.now() - 172800000) }
        ],
        successful: 2,
        failed: 1,
        inProgress: 0
      }
    }
  });

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[...Array(12)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Welcome back, {user?.name}! Here's your system overview.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
              <RealTimeIndicator connected={isConnected}>
                <Circle sx={{ fontSize: 8 }} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </RealTimeIndicator>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={selectedTimeframe}
                  label="Timeframe"
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>

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

              <Tooltip title="Refresh Data">
                <IconButton onClick={() => loadDashboardData()} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="primary">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData?.users?.total?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Users
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  +{dashboardData?.users?.growth || 0}% this month
                </Typography>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="success">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${dashboardData?.business?.totalRevenue?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  +15.2% from last month
                </Typography>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="warning">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData?.security?.alerts?.active || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Security Alerts
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {dashboardData?.security?.alerts?.criticalThreats || 0} critical
                </Typography>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="info">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Api sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData?.api?.keys?.total || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    API Keys
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {dashboardData?.api?.keys?.active || 0} active
                </Typography>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <SystemHealthCard status={dashboardData?.system?.health?.overall || 'healthy'}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                System Health Overview
              </Typography>
              <Chip
                label={dashboardData?.system?.health?.overall || 'healthy'}
                color={getHealthColor(dashboardData?.system?.health?.overall)}
                icon={getHealthIcon(dashboardData?.system?.health?.overall)}
              />
            </Box>
            
            <Grid container spacing={2}>
              {Object.entries(dashboardData?.metrics?.current || {}).map(([key, metric]) => (
                <Grid item xs={6} md={3} key={key}>
                  <MetricGauge>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={metric.value}
                        size={80}
                        thickness={4}
                        sx={{
                          color: getMetricColor(metric.status),
                          '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {metric.value}{metric.unit === 'percentage' ? '%' : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                      {formatMetricName(key)}
                    </Typography>
                  </MetricGauge>
                </Grid>
              ))}
            </Grid>
          </SystemHealthCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Recent Security Alerts
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {Object.entries(dashboardData?.security?.alerts?.breakdown || {}).map(([severity, data]) => (
                <SecurityAlertCard
                  key={severity}
                  severity={severity}
                  onClick={() => handleAlertClick({ severity, ...data })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {severity.toUpperCase()} ({data.count || 0})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.types?.join(', ') || 'No specific types'}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                </SecurityAlertCard>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                <Tab label="Performance" />
                <Tab label="User Activity" />
                <Tab label="API Usage" />
                <Tab label="Revenue" />
              </Tabs>
            </Box>
            
            <Box sx={{ height: 400 }}>
              {selectedTab === 0 && (
                <Line
                  data={generatePerformanceChartData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          display: true,
                          text: 'Response Time (ms)',
                        },
                      },
                    },
                  }}
                />
              )}
              {selectedTab === 1 && (
                <Bar
                  data={generateUserActivityChartData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          display: true,
                          text: 'Active Users',
                        },
                      },
                    },
                  }}
                />
              )}
              {selectedTab === 2 && (
                <Line
                  data={generateApiUsageChartData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          display: true,
                          text: 'API Requests',
                        },
                      },
                    },
                  }}
                />
              )}
              {selectedTab === 3 && (
                <Line
                  data={generateRevenueChartData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          display: true,
                          text: 'Revenue ($)',
                        },
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Plan Distribution
            </Typography>
            <Box sx={{ height: 200 }}>
              <Doughnut
                data={generatePlanDistributionData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Backup />}
                onClick={() => triggerBackup()}
                fullWidth
              >
                Create Backup
              </Button>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => runSecurityScan()}
                fullWidth
              >
                Security Scan
              </Button>
              <Button
                variant="outlined"
                startIcon={<Speed />}
                onClick={() => runHealthCheck()}
                fullWidth
              >
                Health Check
              </Button>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => openSystemSettings()}
                fullWidth
              >
                System Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Alert Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Security Alert Details
            </Typography>
            <IconButton onClick={() => setAlertDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Severity:</strong> {selectedAlert.severity}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Count:</strong> {selectedAlert.count}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Types:</strong> {selectedAlert.types?.join(', ') || 'None'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> Multiple security events detected. Please review and take appropriate action.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleResolveAlert()}>
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Helper functions
  function getHealthColor(status) {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      case 'degraded': return 'info';
      default: return 'default';
    }
  }

  function getHealthIcon(status) {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      case 'degraded': return <Info />;
      default: return <Circle />;
    }
  }

  function getMetricColor(status) {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  function formatMetricName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function generatePerformanceChartData() {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    return {
      labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data: labels.map(() => Math.floor(Math.random() * 200) + 100),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
      ],
    };
  }

  function generateUserActivityChartData() {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      labels,
      datasets: [
        {
          label: 'Active Users',
          data: labels.map(() => Math.floor(Math.random() * 500) + 200),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
        },
      ],
    };
  }

  function generateApiUsageChartData() {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    return {
      labels,
      datasets: [
        {
          label: 'API Requests',
          data: labels.map(() => Math.floor(Math.random() * 1000) + 500),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
      ],
    };
  }

  function generateRevenueChartData() {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels,
      datasets: [
        {
          label: 'Revenue ($)',
          data: labels.map(() => Math.floor(Math.random() * 50000) + 20000),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
        },
      ],
    };
  }

  function generatePlanDistributionData() {
    return {
      labels: ['Free', 'Pro', 'Enterprise'],
      datasets: [
        {
          data: [400, 350, 100],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 0,
        },
      ],
    };
  }

  function triggerBackup() {
    // Implementation for backup
    console.log('Triggering backup...');
  }

  function runSecurityScan() {
    // Implementation for security scan
    console.log('Running security scan...');
  }

  function runHealthCheck() {
    // Implementation for health check
    console.log('Running health check...');
  }

  function openSystemSettings() {
    // Implementation for system settings
    console.log('Opening system settings...');
  }

  function handleResolveAlert() {
    // Implementation for resolving alert
    console.log('Resolving alert...');
    setAlertDialogOpen(false);
  }
};

export default Dashboard; 