import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Assessment,
  DateRange,
  GetApp,
  Refresh,
  BarChart,
  PieChart,
  Timeline,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MetricCard = styled(Card)(({ theme, trend }) => ({
  background: trend === 'up' 
    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
    : trend === 'down'
    ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  height: '120px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
}));

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 125000,
      previous: 98000,
      trend: 'up',
      change: 27.55,
    },
    users: {
      current: 1250,
      previous: 1180,
      trend: 'up',
      change: 5.93,
    },
    leads: {
      current: 3840,
      previous: 3520,
      trend: 'up',
      change: 9.09,
    },
    conversion: {
      current: 24.5,
      previous: 22.1,
      trend: 'up',
      change: 10.86,
    },
  });

  const [chartData, setChartData] = useState({
    revenue: [
      { date: '2024-01-01', revenue: 12000, users: 100 },
      { date: '2024-01-02', revenue: 15000, users: 120 },
      { date: '2024-01-03', revenue: 18000, users: 140 },
      { date: '2024-01-04', revenue: 22000, users: 160 },
      { date: '2024-01-05', revenue: 25000, users: 180 },
      { date: '2024-01-06', revenue: 28000, users: 200 },
      { date: '2024-01-07', revenue: 32000, users: 220 },
    ],
    userAcquisition: [
      { name: 'Organic', value: 45, color: '#0088FE' },
      { name: 'Social Media', value: 25, color: '#00C49F' },
      { name: 'Referral', value: 20, color: '#FFBB28' },
      { name: 'Paid Ads', value: 10, color: '#FF8042' },
    ],
    planDistribution: [
      { plan: 'Free', users: 500, revenue: 0 },
      { plan: 'Basic', users: 400, revenue: 20000 },
      { plan: 'Pro', users: 250, revenue: 50000 },
      { plan: 'Enterprise', users: 100, revenue: 55000 },
    ],
    leadSources: [
      { source: 'Website', leads: 1200, conversion: 25 },
      { source: 'WhatsApp', leads: 800, conversion: 35 },
      { source: 'Email Campaign', leads: 600, conversion: 20 },
      { source: 'Social Media', leads: 400, conversion: 15 },
      { source: 'Referral', leads: 300, conversion: 40 },
    ],
  });

  const [topPerformers, setTopPerformers] = useState([
    { user: 'John Smith', email: 'john@example.com', revenue: 15000, leads: 45 },
    { user: 'Sarah Johnson', email: 'sarah@example.com', revenue: 12000, leads: 38 },
    { user: 'Mike Davis', email: 'mike@example.com', revenue: 10000, leads: 32 },
    { user: 'Emily Brown', email: 'emily@example.com', revenue: 8500, leads: 28 },
    { user: 'David Wilson', email: 'david@example.com', revenue: 7200, leads: 24 },
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/advanced?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || analytics);
        setChartData(data.chartData || chartData);
        setTopPerformers(data.topPerformers || topPerformers);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const renderTrendIcon = (trend) => {
    return trend === 'up' ? (
      <TrendingUp sx={{ fontSize: 20, ml: 1 }} />
    ) : (
      <TrendingDown sx={{ fontSize: 20, ml: 1 }} />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Advanced Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last Day</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportData}
          >
            Export
          </Button>
          <IconButton onClick={loadAnalytics} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={analytics.revenue.trend}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(analytics.revenue.current)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">
                      {analytics.revenue.change > 0 ? '+' : ''}{analytics.revenue.change}%
                    </Typography>
                    {renderTrendIcon(analytics.revenue.trend)}
                  </Box>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={analytics.users.trend}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {analytics.users.current.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">
                      {analytics.users.change > 0 ? '+' : ''}{analytics.users.change}%
                    </Typography>
                    {renderTrendIcon(analytics.users.trend)}
                  </Box>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={analytics.leads.trend}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    Total Leads
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {analytics.leads.current.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">
                      {analytics.leads.change > 0 ? '+' : ''}{analytics.leads.change}%
                    </Typography>
                    {renderTrendIcon(analytics.leads.trend)}
                  </Box>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={analytics.conversion.trend}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {analytics.conversion.current}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2">
                      {analytics.conversion.change > 0 ? '+' : ''}{analytics.conversion.change}%
                    </Typography>
                    {renderTrendIcon(analytics.conversion.trend)}
                  </Box>
                </Box>
                <Timeline sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom>
              Revenue & User Growth Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.revenue}>
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
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  stroke="#82ca9d"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom>
              User Acquisition Sources
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsTooltip />
                <Legend />
                <RechartsPieChart
                  data={chartData.userAcquisition}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.userAcquisition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom>
              Plan Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData.planDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="users" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom>
              Lead Sources Performance
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData.leadSources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="leads" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="conversion" fill="#82ca9d" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
      </Grid>

      {/* Top Performers Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Performing Users
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Revenue Generated</TableCell>
                <TableCell align="right">Leads Converted</TableCell>
                <TableCell align="center">Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topPerformers.map((performer, index) => (
                <TableRow key={performer.email}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        color={index < 3 ? 'primary' : 'default'}
                        sx={{ mr: 2, minWidth: 32 }}
                      />
                      {performer.user}
                    </Box>
                  </TableCell>
                  <TableCell>{performer.email}</TableCell>
                  <TableCell align="right">{formatCurrency(performer.revenue)}</TableCell>
                  <TableCell align="right">{performer.leads}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={index < 3 ? 'Excellent' : 'Good'}
                      color={index < 3 ? 'success' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdvancedAnalytics; 