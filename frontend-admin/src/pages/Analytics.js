import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Assessment,
  Timeline,
  PieChart,
  BarChart,
  Refresh,
  Download,
  DateRange,
  FilterList,
  Visibility,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend,
} from 'recharts';
import { useNotifications } from '../components/NotificationSystem';
import apiService from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [liveData, setLiveData] = useState({});
  
  const { success, error, info } = useNotifications();

  useEffect(() => {
    fetchAnalyticsData();
    
    // Setup real-time event listeners
    apiService.addEventListener('payment_received', handlePaymentReceived);
    apiService.addEventListener('user_registered', handleUserRegistered);
    apiService.addEventListener('lead_score_updated', handleLeadUpdate);
    
    // Live data updates
    const interval = setInterval(updateLiveMetrics, 10000);
    
    return () => {
      clearInterval(interval);
      apiService.removeEventListener('payment_received', handlePaymentReceived);
      apiService.removeEventListener('user_registered', handleUserRegistered);
      apiService.removeEventListener('lead_score_updated', handleLeadUpdate);
    };
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, plans] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getPlans()
      ]);
      
      const analytics = {
        overview: dashboardStats.overview,
        chartData: dashboardStats.chartData,
        plans: plans,
        revenueByPlan: calculateRevenueByPlan(plans),
        userGrowth: dashboardStats.chartData?.users || [],
        conversionFunnel: generateConversionFunnel(),
        topMetrics: generateTopMetrics(dashboardStats.overview),
        realTimeStats: dashboardStats.liveMetrics || {}
      };
      
      setAnalyticsData(analytics);
      setLiveData(analytics.realTimeStats);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const updateLiveMetrics = async () => {
    try {
      const data = await apiService.getDashboardStats();
      setLiveData(data.liveMetrics || {});
    } catch (err) {
      console.error('Failed to update live metrics:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    success('Analytics data refreshed');
  };

  // Real-time event handlers
  const handlePaymentReceived = (data) => {
    setLiveData(prev => ({
      ...prev,
      todayRevenue: (prev.todayRevenue || 0) + data.amount
    }));
    info(`New payment: ₹${data.amount}`);
  };

  const handleUserRegistered = (data) => {
    setLiveData(prev => ({
      ...prev,
      todaySignups: (prev.todaySignups || 0) + 1,
      currentOnlineUsers: (prev.currentOnlineUsers || 0) + 1
    }));
  };

  const handleLeadUpdate = (data) => {
    setLiveData(prev => ({
      ...prev,
      activeLeads: (prev.activeLeads || 0) + 1
    }));
  };

  const calculateRevenueByPlan = (plans) => {
    return plans.map(plan => ({
      name: plan.name,
      value: plan.price * plan.subscribers,
      subscribers: plan.subscribers,
      color: plan.name === 'Pro' ? '#00C49F' : plan.name === 'Enterprise' ? '#FF8042' : '#0088FE'
    }));
  };

  const generateConversionFunnel = () => {
    return [
      { stage: 'Visitors', count: 10000, percentage: 100 },
      { stage: 'Signups', count: 1500, percentage: 15 },
      { stage: 'Free Trial', count: 800, percentage: 8 },
      { stage: 'Paid Users', count: 200, percentage: 2 },
      { stage: 'Premium', count: 50, percentage: 0.5 }
    ];
  };

  const generateTopMetrics = (overview) => {
    return [
      {
        title: 'Revenue Growth',
        value: '+23.5%',
        change: '+5.2%',
        trend: 'up',
        color: 'success',
        icon: <TrendingUp />
      },
      {
        title: 'User Acquisition',
        value: '+156',
        change: '+12.3%',
        trend: 'up',
        color: 'primary',
        icon: <People />
      },
      {
        title: 'Conversion Rate',
        value: '26.8%',
        change: '+2.1%',
        trend: 'up',
        color: 'warning',
        icon: <Assessment />
      },
      {
        title: 'Churn Rate',
        value: '2.3%',
        change: '-0.5%',
        trend: 'down',
        color: 'error',
        icon: <TrendingDown />
      }
    ];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Real-time Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced reporting and insights with live updates
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => success('Export feature coming soon!')}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Live Metrics Banner */}
      <Alert 
        severity="info" 
        sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        icon={<Timeline sx={{ color: 'white' }} />}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Live Metrics (Updates every 10 seconds)
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Online Users: <strong>{liveData.currentOnlineUsers || 0}</strong>
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Today's Revenue: <strong>₹{(liveData.todayRevenue || 0).toLocaleString()}</strong>
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              New Signups: <strong>{liveData.todaySignups || 0}</strong>
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Active Leads: <strong>{liveData.activeLeads || 0}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Alert>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        {analyticsData?.topMetrics?.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {metric.value}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {metric.trend === 'up' ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography 
                        variant="body2" 
                        color={metric.trend === 'up' ? 'success.main' : 'error.main'}
                        ml={0.5}
                      >
                        {metric.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: `${metric.color}.main` }}>
                    {metric.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Revenue Trend Analysis
                </Typography>
                <FormControl size="small">
                  <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="users">Users</MenuItem>
                    <MenuItem value="leads">Leads</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData?.chartData?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="#8884d8"
                    stroke="#8884d8"
                    fillOpacity={0.3}
                  />
                  <Bar yAxisId="right" dataKey="subscriptions" fill="#82ca9d" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Plan */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Plan
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData?.revenueByPlan || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                  >
                    {analyticsData?.revenueByPlan?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Growth and Conversion Funnel */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Funnel
              </Typography>
              <Box sx={{ mt: 2 }}>
                {analyticsData?.conversionFunnel?.map((stage, index) => (
                  <Box key={stage.stage} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        {stage.stage}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stage.count.toLocaleString()} ({stage.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stage.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: COLORS[index % COLORS.length],
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Plan Subscription Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Plan Performance Analysis
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Subscribers</TableCell>
                  <TableCell align="right">Monthly Revenue</TableCell>
                  <TableCell align="right">Growth Rate</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData?.plans?.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {plan.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {plan.name}
                          </Typography>
                          {plan.isPopular && (
                            <Chip label="Popular" size="small" color="success" />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        ₹{plan.price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        {plan.subscribers.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        ₹{(plan.price * plan.subscribers).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <TrendingUp color="success" fontSize="small" />
                        <Typography variant="body2" color="success.main" ml={0.5}>
                          +{Math.floor(Math.random() * 20 + 5)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={plan.isActive ? 'Active' : 'Inactive'}
                        color={plan.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics; 