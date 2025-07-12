import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Skeleton,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  Stack,
  alpha,
  Paper,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Task as TaskIcon,
  Refresh as RefreshIcon,
  FiberManualRecord as LiveIcon,
  Dashboard as DashboardIcon,
  Target as TargetIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { format, formatDistanceToNow } from 'date-fns';
import { styled, keyframes } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

// Live indicator animation
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
`;

const LiveIndicator = styled(LiveIcon)(({ theme }) => ({
  color: theme.palette.success.main,
  animation: `${pulse} 2s infinite`,
  fontSize: '0.8rem',
}));

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const MetricCard = styled(Card)(({ theme, trend }) => ({
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: trend === 'up' 
      ? theme.palette.success.main 
      : trend === 'down' 
        ? theme.palette.error.main 
        : theme.palette.primary.main,
  },
}));

// Helper function to ensure data is an array
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && data.data && Array.isArray(data.data)) return data.data;
  if (data && data.leads && Array.isArray(data.leads)) return data.leads;
  return [];
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState(0);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', type: 'leads' });
  const [goals, setGoals] = useState([
    { id: 1, title: 'Monthly Leads Target', target: 100, current: 67, deadline: '2025-01-31', type: 'leads', status: 'active' },
    { id: 2, title: 'Revenue Goal', target: 50000, current: 32000, deadline: '2025-01-31', type: 'revenue', status: 'active' },
    { id: 3, title: 'Customer Satisfaction', target: 95, current: 88, deadline: '2025-01-31', type: 'satisfaction', status: 'active' }
  ]);

  // API Queries
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery(
    ['dashboard-stats'],
    () => apiService.getDashboardStats(),
    {
      refetchInterval: realTimeEnabled ? 30000 : false, // Refetch every 30 seconds if real-time enabled
      onSuccess: () => setLastUpdate(new Date()),
      onError: (error) => {
        console.error('Dashboard data fetch failed:', error);
      }
    }
  );

  const {
    data: recentLeadsResponse,
    isLoading: leadsLoading
  } = useQuery(
    ['recent-leads'],
    () => apiService.getLeads({ limit: 5, sort: '-createdAt' }),
    {
      refetchInterval: realTimeEnabled ? 30000 : false,
    }
  );

  const {
    data: recentMessages,
    isLoading: messagesLoading
  } = useQuery(
    ['recent-messages'],
    () => apiService.getMessages({ limit: 5, sort: '-createdAt' }),
    {
      refetchInterval: realTimeEnabled ? 30000 : false,
    }
  );

  const {
    data: tasksResponse,
    isLoading: tasksLoading
  } = useQuery(
    ['recent-tasks'],
    () => apiService.getTasks({ limit: 5, status: 'pending' }),
    {
      refetchInterval: realTimeEnabled ? 30000 : false,
    }
  );

  const {
    data: notifications,
    isLoading: notificationsLoading
  } = useQuery(
    ['recent-notifications'],
    () => apiService.getNotifications({ limit: 5, unread: true }),
    {
      refetchInterval: realTimeEnabled ? 30000 : false,
    }
  );

  // Process data to ensure arrays
  const recentLeads = ensureArray(recentLeadsResponse);
  const tasks = ensureArray(tasksResponse);

  // Real-time socket events
  useEffect(() => {
    if (realTimeEnabled && apiService.socket) {
      const handleDashboardUpdate = (data) => {
        setLastUpdate(new Date());
        queryClient.invalidateQueries(['dashboard-stats']);
      };

      const handleLeadUpdate = () => {
        queryClient.invalidateQueries(['recent-leads']);
      };

      const handleMessageUpdate = () => {
        queryClient.invalidateQueries(['recent-messages']);
      };

      const handleTaskUpdate = () => {
        queryClient.invalidateQueries(['recent-tasks']);
      };

      const handleNotification = () => {
        queryClient.invalidateQueries(['recent-notifications']);
      };

      apiService.addEventListener('dashboard_update', handleDashboardUpdate);
      apiService.addEventListener('lead_created', handleLeadUpdate);
      apiService.addEventListener('lead_updated', handleLeadUpdate);
      apiService.addEventListener('message_received', handleMessageUpdate);
      apiService.addEventListener('task_created', handleTaskUpdate);
      apiService.addEventListener('task_updated', handleTaskUpdate);
      apiService.addEventListener('notification', handleNotification);

      return () => {
        apiService.removeEventListener('dashboard_update', handleDashboardUpdate);
        apiService.removeEventListener('lead_created', handleLeadUpdate);
        apiService.removeEventListener('lead_updated', handleLeadUpdate);
        apiService.removeEventListener('message_received', handleMessageUpdate);
        apiService.removeEventListener('task_created', handleTaskUpdate);
        apiService.removeEventListener('task_updated', handleTaskUpdate);
        apiService.removeEventListener('notification', handleNotification);
      };
    }
  }, [realTimeEnabled, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    setLastUpdate(new Date());
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpIcon color="success" />;
    if (trend < 0) return <TrendingDownIcon color="error" />;
    return <AnalyticsIcon color="primary" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'success';
    if (trend < 0) return 'error';
    return 'primary';
  };

  const formatTrend = (trend) => {
    if (!trend || trend === 0) return '0%';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Chart configurations
  const leadsChartData = {
    labels: dashboardData?.leadsChart?.labels || [],
    datasets: [
      {
        label: 'Leads',
        data: dashboardData?.leadsChart?.data || [],
        borderColor: '#2563eb',
        backgroundColor: alpha('#2563eb', 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const conversionChartData = {
    labels: ['Converted', 'In Progress', 'Lost'],
    datasets: [
      {
        data: [
          dashboardData?.conversion?.converted || 0,
          dashboardData?.conversion?.inProgress || 0,
          dashboardData?.conversion?.lost || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  if (dashboardError) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }>
          Failed to load dashboard data: {dashboardError.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome back, {user?.name || 'User'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your business today.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {realTimeEnabled && <LiveIndicator />}
                Real-time
              </Box>
            }
          />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={dashboardLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Last Update */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
        Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={dashboardData?.leads?.trend > 0 ? 'up' : dashboardData?.leads?.trend < 0 ? 'down' : 'stable'}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Leads
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardLoading ? <Skeleton width={60} /> : formatNumber(dashboardData?.leads?.total || 0)}
                  </Typography>
                  {!dashboardLoading && dashboardData?.leads?.trend !== undefined && (
                    <Chip
                      size="small"
                      icon={getTrendIcon(dashboardData.leads.trend)}
                      label={formatTrend(dashboardData.leads.trend)}
                      color={getTrendColor(dashboardData.leads.trend)}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={dashboardData?.messages?.trend > 0 ? 'up' : dashboardData?.messages?.trend < 0 ? 'down' : 'stable'}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Messages
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardLoading ? <Skeleton width={60} /> : formatNumber(dashboardData?.messages?.total || 0)}
                  </Typography>
                  {!dashboardLoading && dashboardData?.messages?.trend !== undefined && (
                    <Chip
                      size="small"
                      icon={getTrendIcon(dashboardData.messages.trend)}
                      label={formatTrend(dashboardData.messages.trend)}
                      color={getTrendColor(dashboardData.messages.trend)}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <MessageIcon />
                </Avatar>
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={dashboardData?.conversion?.trend > 0 ? 'up' : dashboardData?.conversion?.trend < 0 ? 'down' : 'stable'}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardLoading ? <Skeleton width={60} /> : `${dashboardData?.conversion?.rate || 0}%`}
                  </Typography>
                  {!dashboardLoading && dashboardData?.conversion?.trend !== undefined && (
                    <Chip
                      size="small"
                      icon={getTrendIcon(dashboardData.conversion.trend)}
                      label={formatTrend(dashboardData.conversion.trend)}
                      color={getTrendColor(dashboardData.conversion.trend)}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard trend={dashboardData?.revenue?.trend > 0 ? 'up' : dashboardData?.revenue?.trend < 0 ? 'down' : 'stable'}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardLoading ? <Skeleton width={60} /> : formatCurrency(dashboardData?.revenue?.total || 0)}
                  </Typography>
                  {!dashboardLoading && dashboardData?.revenue?.trend !== undefined && (
                    <Chip
                      size="small"
                      icon={getTrendIcon(dashboardData.revenue.trend)}
                      label={formatTrend(dashboardData.revenue.trend)}
                      color={getTrendColor(dashboardData.revenue.trend)}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AttachMoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Leads Trend
              </Typography>
              {dashboardLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box height={300}>
                  <Line data={leadsChartData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Status
              </Typography>
              {dashboardLoading ? (
                <Skeleton variant="circular" width={200} height={200} />
              ) : (
                <Box height={200}>
                  <Doughnut data={conversionChartData} />
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Leads</Typography>
                <Button size="small" onClick={() => navigate('/leads')}>
                  View All
                </Button>
              </Box>
              {leadsLoading ? (
                <Stack spacing={1}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {recentLeads.slice(0, 5).map((lead) => (
                    <Box key={lead._id} display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {lead.name?.charAt(0) || 'L'}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {lead.name || 'Unknown Lead'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lead.email} • {format(new Date(lead.createdAt), 'MMM dd')}
                        </Typography>
                      </Box>
                      <Chip size="small" label={lead.status} color="primary" variant="outlined" />
                    </Box>
                  ))}
                  {recentLeads.length === 0 && (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      No recent leads
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Tasks</Typography>
                <Button size="small" onClick={() => navigate('/tasks')}>
                  View All
                </Button>
              </Box>
              {tasksLoading ? (
                <Stack spacing={1}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {tasks.slice(0, 5).map((task) => (
                    <Box key={task._id} display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: task.priority === 'high' ? 'error.main' : 'info.main' }}>
                        <TaskIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small" 
                        label={task.priority} 
                        color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                        variant="outlined" 
                      />
                    </Box>
                  ))}
                  {tasks.length === 0 && (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      No pending tasks
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 