import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, CardHeader, IconButton,
  Tab, Tabs, Button, Chip, CircularProgress, Alert, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Tooltip, Divider,
  Skeleton, AlertTitle, Backdrop
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Assessment, Timeline, PieChart, BarChart,
  ShowChart, Insights, Download, Share, Refresh, FilterList, DateRange,
  People, Phone, WhatsApp, AttachMoney, Psychology, Speed, CheckCircle,
  Schedule, Campaign, Business, Analytics as AnalyticsIcon, Error, Warning
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import {
  LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Styled components
const MetricCard = styled(Card)(({ theme, trend }) => ({
  transition: 'all 0.3s ease',
  borderLeft: `4px solid ${trend === 'up' ? theme.palette.success.main : 
                           trend === 'down' ? theme.palette.error.main : 
                           theme.palette.info.main}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StatsChip = styled(Chip)(({ theme, trend }) => ({
  backgroundColor: trend === 'up' ? alpha(theme.palette.success.main, 0.1) :
                   trend === 'down' ? alpha(theme.palette.error.main, 0.1) :
                   alpha(theme.palette.info.main, 0.1),
  color: trend === 'up' ? theme.palette.success.main :
         trend === 'down' ? theme.palette.error.main :
         theme.palette.info.main,
  fontWeight: 'bold',
}));

const LoadingCard = ({ height = 200 }) => (
  <ChartContainer>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height} />
  </ChartContainer>
);

const ErrorCard = ({ message, onRetry }) => (
  <ChartContainer>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
      <Error sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
      <Typography variant="h6" color="error" gutterBottom>
        Failed to load data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {message || 'An error occurred while loading analytics data'}
      </Typography>
      <Button variant="outlined" onClick={onRetry} startIcon={<Refresh />}>
        Retry
      </Button>
    </Box>
  </ChartContainer>
);

const Analytics = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Get date range parameters
  const getDateRangeParams = useCallback(() => {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return {
      startDate: format(startOfDay(startDate), 'yyyy-MM-dd'),
      endDate: format(endOfDay(now), 'yyyy-MM-dd')
    };
  }, [timeRange]);

  // Enhanced API queries using React Query
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery(
    ['analytics', 'dashboard', dateRange],
    () => apiService.get('/analytics/dashboard', { params: dateRange }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load dashboard metrics');
      }
    }
  );
      
  const {
    data: leadAnalytics,
    isLoading: leadLoading,
    error: leadError,
    refetch: refetchLeads
  } = useQuery(
    ['analytics', 'leads', dateRange],
    () => apiService.get('/analytics/leads', { params: dateRange }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load lead analytics');
      }
    }
  );

  const {
    data: revenueAnalytics,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue
  } = useQuery(
    ['analytics', 'revenue', dateRange],
    () => apiService.get('/analytics/revenue', { params: { ...dateRange, groupBy: 'month' } }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load revenue analytics');
      }
    }
  );

  const {
    data: performanceAnalytics,
    isLoading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance
  } = useQuery(
    ['analytics', 'performance', dateRange],
    () => apiService.get('/analytics/performance', { params: dateRange }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load performance analytics');
      }
    }
  );

  const {
    data: realTimeData,
    isLoading: realTimeLoading,
    refetch: refetchRealTime
  } = useQuery(
    ['analytics', 'realtime'],
    () => apiService.get('/analytics/real-time'),
    {
      refetchInterval: autoRefresh ? 10000 : false,
      retry: 1
    }
  );

  // Update date range when timeRange changes
  useEffect(() => {
    const newDateRange = getDateRangeParams();
    setDateRange(newDateRange);
  }, [timeRange, getDateRangeParams]);

  // Handle refresh all data
  const handleRefreshAll = useCallback(() => {
    queryClient.invalidateQueries(['analytics']);
    toast.success('Data refreshed successfully');
  }, [queryClient]);

  // Handle export data
  const handleExport = useCallback(async () => {
    try {
      const response = await apiService.get('/analytics/export', {
        params: { ...dateRange, format: 'csv', type: 'leads' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  }, [dateRange]);

  // Format utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <TrendingUp /> : trend === 'down' ? <TrendingDown /> : <Timeline />;
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 'neutral';
    return current > previous ? 'up' : current < previous ? 'down' : 'neutral';
  };

  // Chart color schemes
  const chartColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6'
  };

  // Loading state
  if (dashboardLoading && leadLoading && revenueLoading && performanceLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 2 }} />
      </Box>
    );
  }

  // Extract data safely
  const dashboardStats = dashboardData?.data?.data || {};
  const leadStats = leadAnalytics?.data?.data || {};
  const revenueStats = revenueAnalytics?.data?.data || {};
  const performanceStats = performanceAnalytics?.data?.data || {};
  const realTimeStats = realTimeData?.data?.data || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              Business Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time insights into your business performance and growth metrics
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 3 Months</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
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

              <Tooltip title="Refresh All Data">
                <IconButton onClick={handleRefreshAll} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>

              <Button 
                variant="outlined" 
                startIcon={<Download />} 
                size="small"
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Real-time Status Bar */}
      {realTimeStats?.current && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <Typography variant="body2" color="text.secondary">
                  Live Data • Last updated: {format(new Date(), 'HH:mm:ss')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Active Workflows</Typography>
                  <Typography variant="h6" fontWeight="bold">{realTimeStats.current.activeWorkflows || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Pending Tasks</Typography>
                  <Typography variant="h6" fontWeight="bold">{realTimeStats.current.pendingTasks || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Online Leads</Typography>
                  <Typography variant="h6" fontWeight="bold">{realTimeStats.current.onlineLeads || 0}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Response Time</Typography>
                  <Typography variant="h6" fontWeight="bold">{realTimeStats.current.responseTime?.toFixed(0) || 0}ms</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={calculateTrend(dashboardStats.overview?.totalLeads, dashboardStats.overview?.totalLeads - dashboardStats.overview?.newLeadsToday)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(dashboardStats.overview?.totalLeads || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Leads
                  </Typography>
                  <StatsChip
                    label={`+${dashboardStats.overview?.newLeadsToday || 0} today`}
                    trend="up"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <People sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={calculateTrend(dashboardStats.overview?.conversionRate, 10)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.overview?.conversionRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conversion Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getTrendIcon(calculateTrend(dashboardStats.overview?.conversionRate, 10))}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      vs last period
                    </Typography>
                  </Box>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={calculateTrend(dashboardStats.overview?.totalRevenue, dashboardStats.overview?.totalRevenue * 0.8)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(dashboardStats.overview?.totalRevenue || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <StatsChip
                    label={`+${((dashboardStats.overview?.totalRevenue || 0) * 0.2 / (dashboardStats.overview?.totalRevenue || 1) * 100).toFixed(1)}% growth`}
                    trend="up"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={calculateTrend(5, dashboardStats.overview?.averageResponseTime || 8)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {(dashboardStats.overview?.averageResponseTime || 0).toFixed(1)}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getTrendIcon(calculateTrend(5, dashboardStats.overview?.averageResponseTime || 8))}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      faster responses
                    </Typography>
                  </Box>
                </Box>
                <Speed sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Error States */}
      {(dashboardError || leadError || revenueError || performanceError) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Some data may be unavailable</AlertTitle>
          There were issues loading some analytics data. Please try refreshing or check your connection.
        </Alert>
      )}

      {/* Detailed Analytics Tabs */}
      <Paper sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Lead Analytics" />
            <Tab label="Communication" />
            <Tab label="Revenue" />
            <Tab label="Performance" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Lead Analytics Tab */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {leadLoading ? (
                  <LoadingCard height={300} />
                ) : leadError ? (
                  <ErrorCard onRetry={refetchLeads} />
                ) : (
                <ChartContainer>
                  <Typography variant="h6" sx={{ mb: 2 }}>Lead Generation Trend</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={leadStats.timeline || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                          dataKey="count"
                          fill={chartColors.primary}
                          stroke={chartColors.primary}
                        fillOpacity={0.3}
                        name="New Leads"
                      />
                      <Line
                        type="monotone"
                        dataKey="converted"
                          stroke={chartColors.success}
                        strokeWidth={3}
                        name="Converted"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                {leadLoading ? (
                  <LoadingCard height={300} />
                ) : leadError ? (
                  <ErrorCard onRetry={refetchLeads} />
                ) : (
                <ChartContainer>
                  <Typography variant="h6" sx={{ mb: 2 }}>Lead Distribution</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                          data={leadStats.funnel || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                          dataKey="count"
                          label={({ _id, count }) => `${_id} (${count})`}
                      >
                          {leadStats.funnel?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>

              <Grid item xs={12}>
                {leadLoading ? (
                  <LoadingCard height={250} />
                ) : leadError ? (
                  <ErrorCard onRetry={refetchLeads} />
                ) : (
                <ChartContainer>
                  <Typography variant="h6" sx={{ mb: 2 }}>Lead Sources Performance</Typography>
                  <ResponsiveContainer width="100%" height={250}>
                      <RechartsBarChart data={leadStats.sources || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                      <RechartsTooltip />
                      <Legend />
                        <Bar dataKey="count" fill={chartColors.primary} name="Total Leads" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>
            </Grid>
          )}

          {/* Communication Tab */}
          {selectedTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {performanceLoading ? (
                  <LoadingCard height={300} />
                ) : performanceError ? (
                  <ErrorCard onRetry={refetchPerformance} />
                ) : (
                <ChartContainer>
                    <Typography variant="h6" sx={{ mb: 2 }}>Communication Activity</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={performanceStats.communication || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                          dataKey="count"
                        stackId="1"
                          stroke={chartColors.primary}
                          fill={chartColors.primary}
                        fillOpacity={0.6}
                        name="Messages Sent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <MetricCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h5" fontWeight="bold">
                              {formatNumber(dashboardStats.overview?.totalMessages || 0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Messages
                            </Typography>
                          </Box>
                          <WhatsApp sx={{ fontSize: 32, color: '#25D366' }} />
                        </Box>
                      </CardContent>
                    </MetricCard>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <MetricCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h5" fontWeight="bold">
                              {(dashboardStats.overview?.averageResponseTime || 0).toFixed(1)}h
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Avg Response Time
                            </Typography>
                          </Box>
                          <Schedule sx={{ fontSize: 32, color: 'info.main' }} />
                        </Box>
                      </CardContent>
                    </MetricCard>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Revenue Tab */}
          {selectedTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {revenueLoading ? (
                  <LoadingCard height={300} />
                ) : revenueError ? (
                  <ErrorCard onRetry={refetchRevenue} />
                ) : (
                <ChartContainer>
                  <Typography variant="h6" sx={{ mb: 2 }}>Revenue Trend</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={revenueStats.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                      <RechartsTooltip formatter={(value, name) => [
                          name === 'totalRevenue' ? formatCurrency(value) : value,
                          name === 'totalRevenue' ? 'Revenue' : name
                      ]} />
                      <Legend />
                        <Bar dataKey="totalRevenue" fill={chartColors.success} name="Revenue" />
                        <Line type="monotone" dataKey="transactionCount" stroke={chartColors.primary} strokeWidth={3} name="Transactions" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                {revenueLoading ? (
                  <LoadingCard height={300} />
                ) : revenueError ? (
                  <ErrorCard onRetry={refetchRevenue} />
                ) : (
                <ChartContainer>
                    <Typography variant="h6" sx={{ mb: 2 }}>Revenue Forecast</Typography>
                  <Box sx={{ mt: 2 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">Next Month Projection</Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          {formatCurrency(revenueStats.forecast?.projectedNextMonth || 0)}
                          </Typography>
                        </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">Quarterly Projection</Typography>
                        <Typography variant="h5" fontWeight="bold" color="info.main">
                          {formatCurrency(revenueStats.forecast?.projectedNextQuarter || 0)}
                        </Typography>
                        </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">Average Monthly</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {formatCurrency(revenueStats.forecast?.avgMonthlyRevenue || 0)}
                        </Typography>
                      </Box>
                  </Box>
                </ChartContainer>
                )}
              </Grid>
            </Grid>
          )}

          {/* Performance Tab */}
          {selectedTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {performanceLoading ? (
                  <LoadingCard height={300} />
                ) : performanceError ? (
                  <ErrorCard onRetry={refetchPerformance} />
                ) : (
                <ChartContainer>
                    <Typography variant="h6" sx={{ mb: 2 }}>Performance Overview</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                        { metric: 'Lead Generation', value: Math.min(85, (dashboardStats.overview?.totalLeads || 0) / 10), fullMark: 100 },
                        { metric: 'Conversion Rate', value: Math.min(100, (dashboardStats.overview?.conversionRate || 0) * 5), fullMark: 100 },
                        { metric: 'Response Time', value: Math.max(0, 100 - (dashboardStats.overview?.averageResponseTime || 0) * 10), fullMark: 100 },
                        { metric: 'Revenue Growth', value: Math.min(100, (dashboardStats.overview?.totalRevenue || 0) / 1000), fullMark: 100 },
                        { metric: 'Task Completion', value: Math.min(100, (dashboardStats.performance?.taskCompletion || 0)), fullMark: 100 },
                        { metric: 'Activity Level', value: Math.min(100, (dashboardStats.overview?.activeTasks || 0) * 2), fullMark: 100 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="value"
                          stroke={chartColors.primary}
                          fill={chartColors.primary}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ChartContainer>
                  <Typography variant="h6" sx={{ mb: 2 }}>Key Performance Indicators</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[
                      { 
                        label: 'Lead Conversion Rate', 
                        value: `${dashboardStats.overview?.conversionRate || 0}%`, 
                        target: '15%', 
                        progress: Math.min(100, (dashboardStats.overview?.conversionRate || 0) * 6.67) 
                      },
                      { 
                        label: 'Average Response Time', 
                        value: `${(dashboardStats.overview?.averageResponseTime || 0).toFixed(1)}h`, 
                        target: '2h', 
                        progress: Math.max(0, 100 - (dashboardStats.overview?.averageResponseTime || 0) * 25) 
                      },
                      { 
                        label: 'Task Completion Rate', 
                        value: `${dashboardStats.performance?.taskCompletion || 0}%`, 
                        target: '90%', 
                        progress: Math.min(100, (dashboardStats.performance?.taskCompletion || 0)) 
                      },
                      { 
                        label: 'Monthly Growth', 
                        value: `${((dashboardStats.overview?.totalRevenue || 0) / 10000).toFixed(1)}%`, 
                        target: '25%', 
                        progress: Math.min(100, (dashboardStats.overview?.totalRevenue || 0) / 250) 
                      },
                    ].map((kpi, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{kpi.label}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {kpi.value} / {kpi.target}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.300', borderRadius: 4 }}>
                          <Box
                            sx={{
                              width: `${kpi.progress}%`,
                              height: '100%',
                              bgcolor: kpi.progress >= 80 ? 'success.main' : 
                                      kpi.progress >= 60 ? 'warning.main' : 'error.main',
                              borderRadius: 4,
                              transition: 'width 0.5s ease-in-out',
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </ChartContainer>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Analytics; 