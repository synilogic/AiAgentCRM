import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Button,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Dashboard as DashboardIcon,
  Target as TargetIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
  Autorenew as AutorenewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { styled, alpha } from '@mui/material/styles';
import { useQuery } from 'react-query';
import apiService from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

// Styled components
const MetricCard = styled(Card)(({ theme, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        };
      case 'warning':
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        };
      case 'error':
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        };
      default:
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        };
    }
  };

  return {
    ...getVariantStyles(),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  };
});

const ChartCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const InsightCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  borderRadius: 16,
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedAnalytics = () => {
  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [filters, setFilters] = useState({
    period: '30d',
    source: 'all',
    status: 'all',
    segment: 'all'
  });
  const [customReportDialog, setCustomReportDialog] = useState(false);
  const [goalTrackingDialog, setGoalTrackingDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Sample goals data (in real app, this would come from API)
  const [goals, setGoals] = useState([
    {
      id: 1,
      name: 'Monthly Revenue',
      target: 100000,
      current: 75000,
      period: 'monthly',
      category: 'revenue',
      deadline: endOfMonth(new Date()),
      status: 'on-track'
    },
    {
      id: 2,
      name: 'New Leads',
      target: 200,
      current: 150,
      period: 'monthly',
      category: 'leads',
      deadline: endOfMonth(new Date()),
      status: 'behind'
    },
    {
      id: 3,
      name: 'Conversion Rate',
      target: 15,
      current: 12,
      period: 'monthly',
      category: 'conversion',
      deadline: endOfMonth(new Date()),
      status: 'on-track'
    }
  ]);

  // API Queries
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics
  } = useQuery(
    ['analytics', filters, dateRange],
    () => apiService.getAnalytics({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd'),
      ...filters
    }),
    {
      refetchInterval: autoRefresh ? 60000 : false,
      staleTime: 30000,
    }
  );

  const {
    data: performanceMetrics,
    isLoading: metricsLoading
  } = useQuery(
    ['performance-metrics', dateRange],
    () => apiService.getPerformanceMetrics({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd')
    }),
    {
      refetchInterval: autoRefresh ? 60000 : false,
    }
  );

  const {
    data: insights,
    isLoading: insightsLoading
  } = useQuery(
    ['insights'],
    () => apiService.getInsights(),
    {
      refetchInterval: autoRefresh ? 300000 : false, // 5 minutes
    }
  );

  // Chart configurations
  const revenueChartData = {
    labels: analyticsData?.revenue?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData?.revenue?.data || [],
        borderColor: '#3b82f6',
        backgroundColor: alpha('#3b82f6', 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Target',
        data: analyticsData?.revenue?.target || [],
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
      }
    ]
  };

  const leadsChartData = {
    labels: analyticsData?.leads?.sources?.labels || [],
    datasets: [{
      data: analyticsData?.leads?.sources?.data || [],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444',
        '#06b6d4',
        '#84cc16'
      ],
      borderWidth: 0,
    }]
  };

  const conversionFunnelData = {
    labels: ['Visitors', 'Leads', 'Qualified', 'Proposals', 'Closed'],
    datasets: [{
      label: 'Conversion Funnel',
      data: analyticsData?.funnel?.data || [1000, 200, 100, 50, 25],
      backgroundColor: [
        alpha('#3b82f6', 0.8),
        alpha('#3b82f6', 0.7),
        alpha('#3b82f6', 0.6),
        alpha('#3b82f6', 0.5),
        alpha('#3b82f6', 0.4)
      ],
    }]
  };

  const performanceRadarData = {
    labels: ['Lead Quality', 'Response Time', 'Conversion Rate', 'Customer Satisfaction', 'Revenue Growth'],
    datasets: [{
      label: 'Current Performance',
      data: performanceMetrics?.radar?.current || [65, 80, 70, 85, 75],
      borderColor: '#3b82f6',
      backgroundColor: alpha('#3b82f6', 0.2),
      borderWidth: 2,
    }, {
      label: 'Industry Average',
      data: performanceMetrics?.radar?.average || [60, 70, 65, 75, 70],
      borderColor: '#10b981',
      backgroundColor: alpha('#10b981', 0.2),
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha('#000', 0.1),
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      }
    }
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getGoalProgress = (goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getGoalVariant = (goal) => {
    const progress = getGoalProgress(goal);
    if (progress >= 90) return 'success';
    if (progress >= 70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend) => {
    return trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'success.main' : 'error.main';
  };

  // Generate insights from data
  const generateInsights = () => {
    const mockInsights = [
      {
        type: 'success',
        title: 'Revenue Growth',
        description: 'Revenue has increased by 15% compared to last month',
        action: 'Continue current marketing strategy',
        priority: 'high'
      },
      {
        type: 'warning',
        title: 'Lead Quality Decline',
        description: 'Lead conversion rate has dropped by 8% this week',
        action: 'Review lead qualification process',
        priority: 'medium'
      },
      {
        type: 'info',
        title: 'Peak Activity Hours',
        description: 'Most leads are generated between 2-4 PM',
        action: 'Schedule campaigns during peak hours',
        priority: 'low'
      },
      {
        type: 'error',
        title: 'Goal Behind Schedule',
        description: 'Monthly lead target is 25% behind schedule',
        action: 'Increase lead generation activities',
        priority: 'high'
      }
    ];

    return insights?.data || mockInsights;
  };

  const handleExportReport = (format) => {
    // Export functionality
    setSnackbar({
      open: true,
      message: `Report exported as ${format.toUpperCase()}!`,
      severity: 'success'
    });
  };

  const speedDialActions = [
    { icon: <AddIcon />, name: 'Custom Report', onClick: () => setCustomReportDialog(true) },
    { icon: <TargetIcon />, name: 'Set Goal', onClick: () => setGoalTrackingDialog(true) },
    { icon: <DownloadIcon />, name: 'Export PDF', onClick: () => handleExportReport('pdf') },
    { icon: <ShareIcon />, name: 'Share Report', onClick: () => handleExportReport('share') },
    { icon: <ScheduleIcon />, name: 'Schedule Report', onClick: () => setSnackbar({ open: true, message: 'Scheduling feature coming soon!', severity: 'info' }) }
  ];

  const keyMetrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analyticsData?.summary?.revenue || 0),
      change: analyticsData?.summary?.revenueChange || 0,
      icon: <MoneyIcon />,
      variant: analyticsData?.summary?.revenueChange >= 0 ? 'success' : 'error'
    },
    {
      title: 'Total Leads',
      value: formatNumber(analyticsData?.summary?.leads || 0),
      change: analyticsData?.summary?.leadsChange || 0,
      icon: <PeopleIcon />,
      variant: analyticsData?.summary?.leadsChange >= 0 ? 'success' : 'error'
    },
    {
      title: 'Conversion Rate',
      value: `${analyticsData?.summary?.conversionRate || 0}%`,
      change: analyticsData?.summary?.conversionChange || 0,
      icon: <SpeedIcon />,
      variant: analyticsData?.summary?.conversionChange >= 0 ? 'success' : 'error'
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(analyticsData?.summary?.avgDealSize || 0),
      change: analyticsData?.summary?.dealSizeChange || 0,
      icon: <StarIcon />,
      variant: analyticsData?.summary?.dealSizeChange >= 0 ? 'success' : 'error'
    }
  ];

  if (analyticsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Advanced Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive insights and performance metrics
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refetchAnalytics}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('pdf')}
              >
                Export
              </Button>
            </Stack>
          </Stack>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={filters.period}
                    onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  >
                    <MenuItem value="7d">Last 7 days</MenuItem>
                    <MenuItem value="30d">Last 30 days</MenuItem>
                    <MenuItem value="90d">Last 90 days</MenuItem>
                    <MenuItem value="1y">Last year</MenuItem>
                    <MenuItem value="custom">Custom range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  >
                    <MenuItem value="all">All Sources</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="referral">Referral</MenuItem>
                    <MenuItem value="social">Social Media</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Overview" icon={<DashboardIcon />} />
            <Tab label="Revenue" icon={<MoneyIcon />} />
            <Tab label="Leads" icon={<PeopleIcon />} />
            <Tab label="Performance" icon={<SpeedIcon />} />
            <Tab label="Goals" icon={<TargetIcon />} />
            <Tab label="Insights" icon={<InsightsIcon />} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={selectedTab} index={0}>
          {/* Key Metrics */}
          <Grid container spacing={3} mb={4}>
            {keyMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MetricCard variant={metric.variant}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                          {metric.title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {metric.value}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                          {getTrendIcon(metric.change)}
                          <Typography 
                            variant="body2" 
                            color={getTrendColor(metric.change)}
                          >
                            {metric.change >= 0 ? '+' : ''}{metric.change}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            vs last period
                          </Typography>
                        </Stack>
                      </Box>
                      <Avatar sx={{ bgcolor: `${metric.variant}.main` }}>
                        {metric.icon}
                      </Avatar>
                    </Stack>
                  </CardContent>
                </MetricCard>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={8}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Trend
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <Line data={revenueChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lead Sources
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <Doughnut data={leadsChartData} options={doughnutOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
          </Grid>

          {/* Conversion Funnel */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversion Funnel
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar data={conversionFunnelData} options={chartOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Radar
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Radar data={performanceRadarData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {/* Revenue Analytics */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Analysis
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line data={revenueChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {/* Lead Analytics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lead Sources Distribution
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <Doughnut data={leadsChartData} options={doughnutOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lead Quality Trends
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <Line data={revenueChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          {/* Performance Analytics */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Comparison
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Radar data={performanceRadarData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </ChartCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={4}>
          {/* Goals Tracking */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Goal Tracking
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setGoalTrackingDialog(true)}
              >
                Add Goal
              </Button>
            </Stack>

            <Grid container spacing={3}>
              {goals.map((goal) => (
                <Grid item xs={12} md={6} key={goal.id}>
                  <MetricCard variant={getGoalVariant(goal)}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {goal.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Target: {goal.category === 'revenue' ? formatCurrency(goal.target) : goal.target}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${Math.round(getGoalProgress(goal))}%`}
                          color={getGoalVariant(goal)}
                          variant="filled"
                        />
                      </Stack>

                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getGoalProgress(goal)}
                          sx={{ height: 8, borderRadius: 4 }}
                          color={getGoalVariant(goal)}
                        />
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {goal.category === 'revenue' ? formatCurrency(goal.current) : goal.current} / {goal.category === 'revenue' ? formatCurrency(goal.target) : goal.target}
                        </Typography>
                        <Chip
                          label={goal.status}
                          size="small"
                          color={goal.status === 'on-track' ? 'success' : 'warning'}
                        />
                      </Stack>
                    </CardContent>
                  </MetricCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={selectedTab} index={5}>
          {/* AI Insights */}
          <Typography variant="h6" gutterBottom>
            AI-Powered Insights
          </Typography>
          <Grid container spacing={3}>
            {generateInsights().map((insight, index) => (
              <Grid item xs={12} md={6} key={index}>
                <InsightCard>
                  <Stack direction="row" spacing={2}>
                    <Avatar sx={{ bgcolor: `${insight.type}.main` }}>
                      {insight.type === 'success' && <CheckCircleIcon />}
                      {insight.type === 'warning' && <WarningIcon />}
                      {insight.type === 'error' && <WarningIcon />}
                      {insight.type === 'info' && <InfoIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Chip
                          label={insight.priority}
                          size="small"
                          color={insight.priority === 'high' ? 'error' : insight.priority === 'medium' ? 'warning' : 'info'}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {insight.description}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Recommended Action: {insight.action}
                      </Typography>
                    </Box>
                  </Stack>
                </InsightCard>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Speed Dial */}
        <SpeedDial
          ariaLabel="Analytics Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>

        {/* Custom Report Dialog */}
        <Dialog open={customReportDialog} onClose={() => setCustomReportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Custom Report</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Report Name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
              <Typography variant="subtitle2">Select Metrics:</Typography>
              <Grid container spacing={1}>
                {['Revenue', 'Leads', 'Conversion Rate', 'Lead Quality', 'Customer Satisfaction'].map((metric) => (
                  <Grid item key={metric}>
                    <Chip
                      label={metric}
                      clickable
                      color={selectedMetrics.includes(metric) ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedMetrics(prev => 
                          prev.includes(metric) 
                            ? prev.filter(m => m !== metric)
                            : [...prev, metric]
                        );
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomReportDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                setSnackbar({ open: true, message: 'Custom report created!', severity: 'success' });
                setCustomReportDialog(false);
              }}
            >
              Create Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedAnalytics; 