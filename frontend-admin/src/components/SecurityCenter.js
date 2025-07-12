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
  ListItemSecondaryAction,
  Chip,
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
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  Error,
  CheckCircle,
  Info,
  Block,
  Visibility,
  VisibilityOff,
  Refresh,
  Settings,
  Search,
  FilterList,
  Download,
  Share,
  Close,
  Add,
  Edit,
  Delete,
  MoreVert,
  Gavel,
  Policy,
  Assessment,
  Timeline as TimelineIcon,
  TrendingUp,
  TrendingDown,
  LocationOn,
  Computer,
  Phone,
  Language,
  VpnKey,
  Fingerprint,
  AccountCircle,
  AdminPanelSettings,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  NotificationsActive,
  NotificationImportant,
  ReportProblem,
  BugReport,
  Lock,
  LockOpen,
  Public,
  PrivateConnectivity,
  NetworkCheck,
  DeviceHub,
  Storage,
  DataUsage,
  MonitorHeart,
  Psychology,
  AutoFixHigh,
  CrisisAlert,
  Emergency,
  SupportAgent,
  ContactSupport,
  Help,
  QuestionMark,
  Psychology as AiIcon,
  SmartToy,
  AutoAwesome,
  Memory,
  Speed,
  DashboardCustomize,
  Analytics,
  Insights,
  TrendingFlat,
  ShowChart,
  PieChart,
  BarChart,
  ScatterPlot,
  BubbleChart,
  CandlestickChart,
  PentagonOutlined,
  HexagonOutlined,
  PentagonSharp,
  LensOutlined,
  AdjustOutlined,
  FilterVintageOutlined,
  BlurCircularOutlined,
  BlurLinearOutlined,
  BlurOnOutlined,
  BlurOffOutlined,
  TuneOutlined,
  ControlPointOutlined,
  ControlPointDuplicateOutlined,
  ControlCameraOutlined,
  ControlPointSharp,
  ControlPointDuplicateSharp,
  ControlCameraSharp,
  ControlPointRounded,
  ControlPointDuplicateRounded,
  ControlCameraRounded,
  ControlPointTwoTone,
  ControlPointDuplicateTwoTone,
  ControlCameraTwoTone,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../services/api';

// Enhanced styled components
const SecurityCard = styled(Card)(({ theme, severity = 'info' }) => {
  const severityColors = {
    low: theme.palette.info.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
    critical: theme.palette.error.dark,
  };

  return {
    transition: 'all 0.3s ease',
    borderLeft: `4px solid ${severityColors[severity]}`,
    background: alpha(severityColors[severity], 0.02),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  };
});

const ThreatCard = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateX(8px)',
    boxShadow: theme.shadows[4],
  },
}));

const SecurityMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  textAlign: 'center',
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

const RiskGauge = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: `conic-gradient(
    ${theme.palette.success.main} 0deg 108deg,
    ${theme.palette.warning.main} 108deg 216deg,
    ${theme.palette.error.main} 216deg 360deg
  )`,
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: theme.palette.background.paper,
  },
}));

const SecurityCenter = () => {
  // State management
  const [securityData, setSecurityData] = useState({});
  const [threats, setThreats] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [threatDialogOpen, setThreatDialogOpen] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [blockIpDialogOpen, setBlockIpDialogOpen] = useState(false);
  const [newBlockData, setNewBlockData] = useState({ ip: '', reason: '', duration: 24 });
  const [scanInProgress, setScanInProgress] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load security data
  const loadSecurityData = useCallback(async () => {
    try {
      const [
        dashboardResponse,
        alertsResponse,
        blockedIPsResponse,
        threatsResponse
      ] = await Promise.all([
        ApiService.getSecurityDashboard(),
        ApiService.getSecurityAlerts(page + 1, rowsPerPage, { severity: filterSeverity === 'all' ? undefined : filterSeverity }),
        ApiService.getBlockedIPs(),
        // Mock threats data - replace with actual API call
        Promise.resolve(generateMockThreats())
      ]);

      setSecurityData(dashboardResponse);
      setSecurityAlerts(alertsResponse.alerts || []);
      setBlockedIPs(blockedIPsResponse || []);
      setThreats(threatsResponse);

    } catch (error) {
      console.error('Failed to load security data:', error);
      // Use mock data for development
      setSecurityData(generateMockSecurityData());
      setSecurityAlerts(generateMockSecurityAlerts());
      setBlockedIPs(generateMockBlockedIPs());
      setThreats(generateMockThreats());
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterSeverity]);

  // Initialize component
  useEffect(() => {
    loadSecurityData();
    
    // Set up auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000); // 30 seconds
    }

    // Set up real-time security alerts
    ApiService.addEventListener('security_alert', handleSecurityAlert);

    return () => {
      if (interval) clearInterval(interval);
      ApiService.removeEventListener('security_alert', handleSecurityAlert);
    };
  }, [loadSecurityData, autoRefresh]);

  // Real-time event handlers
  const handleSecurityAlert = (alert) => {
    setSecurityAlerts(prev => [alert, ...prev]);
    setSnackbar({
      open: true,
      message: `New ${alert.severity} security alert: ${alert.message}`,
      severity: alert.severity === 'high' ? 'error' : 'warning'
    });
  };

  // Generate mock data for development
  const generateMockSecurityData = () => ({
    summary: {
      totalAlerts: 45,
      criticalAlerts: 3,
      resolvedAlerts: 32,
      activeIncidents: 8,
      blockedIPs: 12,
      threatLevel: 'medium',
      riskScore: 65,
    },
    recentAlerts: [],
    threatIntelligence: [],
    securityMetrics: {
      authenticationsToday: 1250,
      failedLogins: 23,
      suspiciousActivity: 8,
      blockedRequests: 156,
      malwareDetected: 0,
      vulnerabilitiesFound: 2,
    }
  });

  const generateMockSecurityAlerts = () => [
    {
      id: '1',
      severity: 'high',
      type: 'brute_force',
      message: 'Brute force attack detected from 192.168.1.100',
      timestamp: new Date(Date.now() - 300000),
      resolved: false,
      source: '192.168.1.100',
      affectedResource: 'login_endpoint',
      actions: ['blocked_ip', 'rate_limited'],
      metadata: {
        attemptCount: 50,
        timespan: '5 minutes',
        targetUser: 'admin@example.com'
      }
    },
    {
      id: '2',
      severity: 'medium',
      type: 'suspicious_activity',
      message: 'Unusual access pattern detected',
      timestamp: new Date(Date.now() - 600000),
      resolved: false,
      source: '10.0.0.25',
      affectedResource: 'api_endpoint',
      actions: ['monitoring'],
      metadata: {
        pattern: 'Multiple API endpoints accessed rapidly',
        duration: '10 minutes'
      }
    },
    {
      id: '3',
      severity: 'critical',
      type: 'data_breach_attempt',
      message: 'Unauthorized database access attempt',
      timestamp: new Date(Date.now() - 1200000),
      resolved: false,
      source: '203.0.113.50',
      affectedResource: 'database',
      actions: ['blocked_ip', 'admin_notified'],
      metadata: {
        queryType: 'SELECT * FROM users',
        blocked: true
      }
    },
    {
      id: '4',
      severity: 'low',
      type: 'rate_limit_exceeded',
      message: 'API rate limit exceeded',
      timestamp: new Date(Date.now() - 1800000),
      resolved: true,
      source: 'api_key_abc123',
      affectedResource: 'api_gateway',
      actions: ['rate_limited'],
      metadata: {
        requestCount: 1500,
        limit: 1000,
        timeWindow: '1 hour'
      }
    }
  ];

  const generateMockBlockedIPs = () => [
    {
      id: '1',
      ipAddress: '192.168.1.100',
      reason: 'Brute force attack',
      blockedAt: new Date(Date.now() - 300000),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
      country: 'Unknown',
      threatLevel: 'high',
      requestCount: 50,
      status: 'active'
    },
    {
      id: '2',
      ipAddress: '203.0.113.50',
      reason: 'SQL injection attempt',
      blockedAt: new Date(Date.now() - 1200000),
      expiresAt: new Date(Date.now() + 71 * 60 * 60 * 1000),
      country: 'US',
      threatLevel: 'critical',
      requestCount: 15,
      status: 'active'
    },
    {
      id: '3',
      ipAddress: '198.51.100.25',
      reason: 'Suspicious scanning',
      blockedAt: new Date(Date.now() - 7200000),
      expiresAt: new Date(Date.now() - 3600000),
      country: 'CN',
      threatLevel: 'medium',
      requestCount: 200,
      status: 'expired'
    }
  ];

  const generateMockThreats = () => [
    {
      id: '1',
      ip: '192.168.1.100',
      threatTypes: ['brute_force', 'suspicious_activity'],
      severity: 'high',
      incidentCount: 15,
      riskScore: 85,
      timespan: { first: new Date(Date.now() - 86400000), last: new Date(Date.now() - 300000) },
      location: 'Unknown',
      userAgent: 'curl/7.68.0',
      blocked: true
    },
    {
      id: '2',
      ip: '203.0.113.50',
      threatTypes: ['data_breach_attempt', 'sql_injection'],
      severity: 'critical',
      incidentCount: 8,
      riskScore: 95,
      timespan: { first: new Date(Date.now() - 3600000), last: new Date(Date.now() - 1200000) },
      location: 'United States',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      blocked: true
    },
    {
      id: '3',
      ip: '198.51.100.25',
      threatTypes: ['port_scanning', 'vulnerability_probe'],
      severity: 'medium',
      incidentCount: 25,
      riskScore: 60,
      timespan: { first: new Date(Date.now() - 172800000), last: new Date(Date.now() - 7200000) },
      location: 'China',
      userAgent: 'Nmap NSE',
      blocked: false
    }
  ];

  // Event handlers
  const handleRunSecurityScan = async () => {
    setScanInProgress(true);
    try {
      await ApiService.runSecurityScan();
      setSnackbar({ open: true, message: 'Security scan completed successfully', severity: 'success' });
      await loadSecurityData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Security scan failed', severity: 'error' });
    } finally {
      setScanInProgress(false);
    }
  };

  const handleBlockIP = async () => {
    try {
      await ApiService.blockIpAddress(newBlockData.ip, newBlockData.reason, newBlockData.duration);
      setSnackbar({ open: true, message: 'IP address blocked successfully', severity: 'success' });
      setBlockIpDialogOpen(false);
      setNewBlockData({ ip: '', reason: '', duration: 24 });
      await loadSecurityData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to block IP address', severity: 'error' });
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    try {
      await ApiService.unblockIpAddress(ipAddress);
      setSnackbar({ open: true, message: 'IP address unblocked successfully', severity: 'success' });
      await loadSecurityData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to unblock IP address', severity: 'error' });
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await ApiService.resolveSecurityAlert(alertId, 'Resolved by administrator');
      setSnackbar({ open: true, message: 'Alert resolved successfully', severity: 'success' });
      await loadSecurityData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to resolve alert', severity: 'error' });
    }
  };

  const handleThreatClick = (threat) => {
    setSelectedThreat(threat);
    setThreatDialogOpen(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'success';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start, end) => {
    const duration = end - start;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Chart data
  const threatDistributionData = {
    labels: ['Brute Force', 'SQL Injection', 'XSS', 'CSRF', 'Data Breach'],
    datasets: [
      {
        data: [35, 25, 15, 10, 15],
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#3b82f6',
          '#8b5cf6'
        ],
        borderWidth: 0,
      },
    ],
  };

  const alertsTrendData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Security Alerts',
        data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 10) + 1),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Filtered alerts based on search and severity
  const filteredAlerts = securityAlerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

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
              Security Center
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Comprehensive security monitoring, threat detection, and incident response
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={handleRunSecurityScan}
                disabled={scanInProgress}
              >
                {scanInProgress ? 'Scanning...' : 'Run Scan'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Block />}
                onClick={() => setBlockIpDialogOpen(true)}
              >
                Block IP
              </Button>
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
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Security Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SecurityCard severity="high">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Error sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {securityData.summary?.criticalAlerts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </SecurityCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityCard severity="medium">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {securityData.summary?.activeIncidents || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Incidents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </SecurityCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityCard severity="low">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Block sx={{ fontSize: 40, mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {securityData.summary?.blockedIPs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocked IPs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </SecurityCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RiskGauge>
                  <Typography variant="h5" fontWeight="bold" sx={{ position: 'relative', zIndex: 1 }}>
                    {securityData.summary?.riskScore || 0}
                  </Typography>
                </RiskGauge>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Risk Score
                  </Typography>
                  <Chip
                    label={securityData.summary?.threatLevel || 'low'}
                    color={getSeverityColor(securityData.summary?.threatLevel)}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </SecurityCard>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Threats" />
            <Tab label="Alerts" />
            <Tab label="Blocked IPs" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Threats Tab */}
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>Threat Intelligence</Typography>
              <Box>
                {threats.map((threat) => (
                  <ThreatCard
                    key={threat.id}
                    onClick={() => handleThreatClick(threat)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1" fontWeight="bold">
                          {threat.ip}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {threat.location} • {threat.incidentCount} incidents
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {threat.threatTypes.map((type) => (
                            <Chip
                              key={type}
                              label={type.replace('_', ' ')}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color={getRiskScoreColor(threat.riskScore)}>
                            {threat.riskScore}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Risk Score
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Chip
                            label={threat.severity}
                            color={getSeverityColor(threat.severity)}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {threat.blocked ? 'Blocked' : 'Monitoring'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </ThreatCard>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>Threat Distribution</Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={threatDistributionData}
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
            </Grid>
          </Grid>
        )}

        {/* Alerts Tab */}
        {selectedTab === 1 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search alerts..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  label="Severity"
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Chip
                          label={alert.severity}
                          color={getSeverityColor(alert.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>{alert.source}</TableCell>
                      <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                      <TableCell>
                        <Chip
                          label={alert.resolved ? 'Resolved' : 'Active'}
                          color={alert.resolved ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {!alert.resolved && (
                          <Button
                            size="small"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredAlerts.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </Box>
        )}

        {/* Blocked IPs Tab */}
        {selectedTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Blocked IP Addresses</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Blocked At</TableCell>
                    <TableCell>Expires At</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Threat Level</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blockedIPs.map((blockedIP) => (
                    <TableRow key={blockedIP.id}>
                      <TableCell>{blockedIP.ipAddress}</TableCell>
                      <TableCell>{blockedIP.reason}</TableCell>
                      <TableCell>{formatTimestamp(blockedIP.blockedAt)}</TableCell>
                      <TableCell>{formatTimestamp(blockedIP.expiresAt)}</TableCell>
                      <TableCell>{blockedIP.country}</TableCell>
                      <TableCell>
                        <Chip
                          label={blockedIP.threatLevel}
                          color={getSeverityColor(blockedIP.threatLevel)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {blockedIP.status === 'active' && (
                          <Button
                            size="small"
                            onClick={() => handleUnblockIP(blockedIP.ipAddress)}
                          >
                            Unblock
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Analytics Tab */}
        {selectedTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>Security Alerts Trend</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={alertsTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>Security Metrics</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SecurityMetric>
                  <Typography variant="h4" fontWeight="bold">
                    {securityData.securityMetrics?.authenticationsToday || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Authentications Today
                  </Typography>
                </SecurityMetric>
                <SecurityMetric>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {securityData.securityMetrics?.failedLogins || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed Logins
                  </Typography>
                </SecurityMetric>
                <SecurityMetric>
                  <Typography variant="h4" fontWeight="bold" color="warning">
                    {securityData.securityMetrics?.blockedRequests || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocked Requests
                  </Typography>
                </SecurityMetric>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Threat Details Dialog */}
      <Dialog
        open={threatDialogOpen}
        onClose={() => setThreatDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Threat Details</Typography>
            <IconButton onClick={() => setThreatDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedThreat && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>IP Address:</strong> {selectedThreat.ip}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Location:</strong> {selectedThreat.location}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Threat Types:</strong> {selectedThreat.threatTypes.join(', ')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Severity:</strong> {selectedThreat.severity}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Risk Score:</strong> {selectedThreat.riskScore}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Incident Count:</strong> {selectedThreat.incidentCount}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>First Seen:</strong> {formatTimestamp(selectedThreat.timespan.first)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Last Seen:</strong> {formatTimestamp(selectedThreat.timespan.last)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>User Agent:</strong> {selectedThreat.userAgent}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Status:</strong> {selectedThreat.blocked ? 'Blocked' : 'Monitoring'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThreatDialogOpen(false)}>Close</Button>
          {selectedThreat && !selectedThreat.blocked && (
            <Button
              variant="contained"
              onClick={() => {
                setNewBlockData({ ip: selectedThreat.ip, reason: 'Threat detected', duration: 24 });
                setThreatDialogOpen(false);
                setBlockIpDialogOpen(true);
              }}
            >
              Block IP
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Block IP Dialog */}
      <Dialog
        open={blockIpDialogOpen}
        onClose={() => setBlockIpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="IP Address"
            variant="outlined"
            value={newBlockData.ip}
            onChange={(e) => setNewBlockData({ ...newBlockData, ip: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Reason"
            variant="outlined"
            value={newBlockData.reason}
            onChange={(e) => setNewBlockData({ ...newBlockData, reason: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Duration (hours)"
            type="number"
            variant="outlined"
            value={newBlockData.duration}
            onChange={(e) => setNewBlockData({ ...newBlockData, duration: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockIpDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBlockIP}>
            Block IP
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecurityCenter; 