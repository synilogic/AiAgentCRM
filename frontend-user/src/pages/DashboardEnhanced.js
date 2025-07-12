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
  AccordionDetails,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab
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
  Star as StarIcon,
  PersonAdd as PersonAddIcon,
  Campaign as CampaignIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
  Filler,
  BarElement
} from 'chart.js';
import { format, formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
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
  Filler,
  BarElement
);

// Animations
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Styled components
const LiveIndicator = styled(LiveIcon)(({ theme }) => ({
  color: theme.palette.success.main,
  animation: `${pulse} 2s infinite`,
  fontSize: '0.8rem',
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  animation: `${slideUp} 0.5s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[12],
  },
}));

const MetricCard = styled(Card)(({ theme, trend }) => ({
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[12],
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

const GoalProgressCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
  border: `1px solid ${theme.palette.primary.main}20`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  },
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState(0);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
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
      refetchInterval: realTimeEnabled ? 30000 : false,
      onSuccess: () => setLastUpdate(new Date()),
      onError: (error) => {
        console.error('Dashboard data fetch failed:', error);
      }
    }
  );

  const {
    data: recentLeadsResponse,
    isLoading: leadsLoading
  } = useQuery(['recent-leads'], () => apiService.getLeads({ limit: 8, sort: '-createdAt' }), {
    refetchInterval: realTimeEnabled ? 30000 : false,
  });

  const {
    data: recentMessages,
    isLoading: messagesLoading
  } = useQuery(['recent-messages'], () => apiService.getMessages({ limit: 8, sort: '-createdAt' }), {
    refetchInterval: realTimeEnabled ? 30000 : false,
  });

  const {
    data: tasksResponse,
    isLoading: tasksLoading
  } = useQuery(['recent-tasks'], () => apiService.getTasks({ limit: 8, status: 'pending' }), {
    refetchInterval: realTimeEnabled ? 30000 : false,
  });

  const {
    data: notifications,
    isLoading: notificationsLoading
  } = useQuery(['recent-notifications'], () => apiService.getNotifications({ limit: 8, unread: true }), {
    refetchInterval: realTimeEnabled ? 30000 : false,
  });

  // Process data
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    if (data && data.leads && Array.isArray(data.leads)) return data.leads;
    return [];
  };

  const recentLeads = ensureArray(recentLeadsResponse);
  const tasks = ensureArray(tasksResponse);

  // Helper functions
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'success.main' : 'error.main';
  };

  const getGoalProgress = (goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getGoalColor = (progress) => {
    if (progress >= 90) return 'success';
    if (progress >= 70) return 'warning';
    return 'error';
  };

  // Quick actions
  const quickActions = [
    { title: 'Add Lead', icon: <PersonAddIcon />, action: () => navigate('/leads'), color: 'primary' },
    { title: 'New Campaign', icon: <CampaignIcon />, action: () => navigate('/campaigns'), color: 'secondary' },
    { title: 'Schedule Call', icon: <PhoneIcon />, action: () => navigate('/schedule'), color: 'info' },
    { title: 'Send Message', icon: <MessageIcon />, action: () => navigate('/chat'), color: 'success' },
    { title: 'View Analytics', icon: <AnalyticsIcon />, action: () => navigate('/analytics'), color: 'warning' },
    { title: 'Manage Tasks', icon: <TaskIcon />, action: () => navigate('/tasks'), color: 'error' }
  ];

  // Speed dial actions
  const speedDialActions = [
    { icon: <PersonAddIcon />, name: 'Add Lead', onClick: () => navigate('/leads') },
    { icon: <MessageIcon />, name: 'Send Message', onClick: () => navigate('/chat') },
    { icon: <TaskIcon />, name: 'Create Task', onClick: () => navigate('/tasks') },
    { icon: <TargetIcon />, name: 'Set Goal', onClick: () => setGoalDialogOpen(true) }
  ];

  // Chart configurations
  const performanceChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Leads',
        data: [12, 19, 15, 25, 22, 18, 24],
        borderColor: '#3b82f6',
        backgroundColor: alpha('#3b82f6', 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Conversions',
        data: [3, 5, 4, 7, 6, 4, 8],
        borderColor: '#10b981',
        backgroundColor: alpha('#10b981', 0.1),
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const leadSourceData = {
    labels: ['Website', 'WhatsApp', 'Referral', 'Social Media', 'Direct'],
    datasets: [{
      data: [35, 25, 20, 15, 5],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
      borderWidth: 0,
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

  if (dashboardLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={16} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={refetchDashboard}>
            Retry
          </Button>
        }>
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome back, {user?.name || 'User'}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your business today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip 
              icon={<LiveIndicator />} 
              label={`Last updated: ${formatDistanceToNow(lastUpdate)} ago`}
              variant="outlined"
              size="small"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Real-time"
            />
            <IconButton onClick={refetchDashboard} color="primary">
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Overview" icon={<DashboardIcon />} />
          <Tab label="Goals" icon={<TargetIcon />} />
          <Tab label="Performance" icon={<SpeedIcon />} />
          <Tab label="Quick Actions" icon={<ScheduleIcon />} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        {/* Metrics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend={dashboardData?.metrics?.leads?.trend}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Leads
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatNumber(dashboardData?.metrics?.leads?.total || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PeopleIcon />
                  </Avatar>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                  {getTrendIcon(dashboardData?.metrics?.leads?.trend)}
                  <Typography variant="body2" color={getTrendColor(dashboardData?.metrics?.leads?.trend)}>
                    {dashboardData?.metrics?.leads?.change || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs last month
                  </Typography>
                </Stack>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend={dashboardData?.metrics?.revenue?.trend}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(dashboardData?.metrics?.revenue?.total || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <AttachMoneyIcon />
                  </Avatar>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                  {getTrendIcon(dashboardData?.metrics?.revenue?.trend)}
                  <Typography variant="body2" color={getTrendColor(dashboardData?.metrics?.revenue?.trend)}>
                    {dashboardData?.metrics?.revenue?.change || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs last month
                  </Typography>
                </Stack>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend={dashboardData?.metrics?.messages?.trend}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Messages
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatNumber(dashboardData?.metrics?.messages?.total || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <MessageIcon />
                  </Avatar>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                  {getTrendIcon(dashboardData?.metrics?.messages?.trend)}
                  <Typography variant="body2" color={getTrendColor(dashboardData?.metrics?.messages?.trend)}>
                    {dashboardData?.metrics?.messages?.change || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs last month
                  </Typography>
                </Stack>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard trend={dashboardData?.metrics?.tasks?.trend}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Pending Tasks
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatNumber(dashboardData?.metrics?.tasks?.pending || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TaskIcon />
                  </Avatar>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    {dashboardData?.metrics?.tasks?.completed || 0} completed
                  </Typography>
                </Stack>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>

        {/* Charts and Activity */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={performanceChartData} options={chartOptions} />
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lead Sources
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={leadSourceData} options={doughnutOptions} />
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Leads
                </Typography>
                <List>
                  {recentLeads.slice(0, 5).map((lead, index) => (
                    <ListItemButton key={lead._id || index} onClick={() => navigate('/leads')}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {lead.name?.charAt(0) || 'L'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={lead.name || 'Unknown Lead'}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={lead.status || 'new'} />
                            <Typography variant="caption">
                              {lead.createdAt ? formatDistanceToNow(new Date(lead.createdAt)) + ' ago' : 'Recently'}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
                <Button fullWidth onClick={() => navigate('/leads')} sx={{ mt: 1 }}>
                  View All Leads
                </Button>
              </CardContent>
            </AnimatedCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Tasks
                </Typography>
                <List>
                  {tasks.slice(0, 5).map((task, index) => (
                    <ListItem key={task._id || index}>
                      <ListItemIcon>
                        <CheckCircleIcon color={task.priority === 'high' ? 'error' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title || 'Untitled Task'}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={task.priority || 'medium'} />
                            <Typography variant="caption">
                              {task.dueDate ? `Due ${formatDistanceToNow(new Date(task.dueDate))}` : 'No due date'}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Button fullWidth onClick={() => navigate('/tasks')} sx={{ mt: 1 }}>
                  View All Tasks
                </Button>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {/* Goals Section */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              Your Goals
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setGoalDialogOpen(true)}
            >
              Add Goal
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {goals.map((goal) => (
              <Grid item xs={12} md={6} key={goal.id}>
                <GoalProgressCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {goal.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${Math.round(getGoalProgress(goal))}%`}
                        color={getGoalColor(getGoalProgress(goal))}
                        variant="filled"
                      />
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getGoalProgress(goal)}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={getGoalColor(getGoalProgress(goal))}
                      />
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        {goal.current} / {goal.target}
                        {goal.type === 'revenue' ? ' INR' : goal.type === 'satisfaction' ? '%' : ' leads'}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </GoalProgressCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        {/* Performance Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Performance Comparison
                </Typography>
                <Box sx={{ height: 400 }}>
                  <Line data={performanceChartData} options={chartOptions} />
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <QuickActionCard onClick={action.action}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ bgcolor: `${action.color}.main`, mx: 'auto', mb: 2, width: 56, height: 56 }}>
                      {action.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {action.title}
                    </Typography>
                  </CardContent>
                </QuickActionCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </TabPanel>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick();
              setSpeedDialOpen(false);
            }}
          />
        ))}
      </SpeedDial>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Goal</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Goal Title"
              fullWidth
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            />
            <TextField
              label="Target"
              type="number"
              fullWidth
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
            />
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Goal Type</InputLabel>
              <Select
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
              >
                <MenuItem value="leads">Leads</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="satisfaction">Satisfaction</MenuItem>
                <MenuItem value="tasks">Tasks</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const newGoalWithId = { ...newGoal, id: Date.now(), current: 0, status: 'active' };
              setGoals([...goals, newGoalWithId]);
              setNewGoal({ title: '', target: '', deadline: '', type: 'leads' });
              setGoalDialogOpen(false);
            }}
          >
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardEnhanced; 