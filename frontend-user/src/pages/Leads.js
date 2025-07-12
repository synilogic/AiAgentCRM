import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Menu, MenuItem,
  Tooltip, Select, FormControl, InputLabel, Switch, FormControlLabel, Alert, Snackbar,
  Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Checkbox, ListItemText, OutlinedInput, Divider, Stack, Badge,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, ButtonGroup, Fab,
  Collapse, Autocomplete, DatePicker, ToggleButton, ToggleButtonGroup, Rating,
  Slider, FormGroup, FormLabel, RadioGroup, Radio, FormControlLabel as MuiFormControlLabel,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Popover, List, ListItem, ListItemIcon,
  ListItemSecondaryAction, CircularProgress, Skeleton, AlertTitle
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Filter as FilterIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  WhatsApp as WhatsAppIcon,
  Call as CallIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Segment as SegmentIcon,
  Flag as FlagIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  SavedSearch as SavedSearchIcon,
  ImportExport as ImportExportIcon,
  Label as LabelIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  BookmarkAdd as BookmarkAddIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import ConfirmDialog from '../components/ConfirmDialog';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import io from 'socket.io-client';

const statusOptions = [
  { value: 'new', label: 'New', color: 'primary' },
  { value: 'contacted', label: 'Contacted', color: 'warning' },
  { value: 'qualified', label: 'Qualified', color: 'info' },
  { value: 'converted', label: 'Converted', color: 'success' },
  { value: 'lost', label: 'Lost', color: 'error' },
];

const sourceOptions = [
  'Website', 'Facebook Ads', 'Google Sheets', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Other'
];

const StyledCard = styled(Card)(({ theme, status }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  borderLeft: `4px solid ${getStatusColor(status)}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: alpha(getStatusColor(status), 0.1),
  color: getStatusColor(status),
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: getStatusColor(status),
  },
}));

const MetricCard = styled(Card)(({ theme, trend }) => ({
  background: `linear-gradient(135deg, ${
    trend === 'up' ? 'rgba(34, 197, 94, 0.1)' :
    trend === 'down' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(59, 130, 246, 0.1)'
  } 0%, transparent 100%)`,
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
}));

const FilterSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ActionButton = styled(Button)(({ theme, variant = 'contained' }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 2),
  minWidth: 'auto',
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  },
}));

function getStatusColor(status) {
  const colors = {
    'new': '#FF9800',
    'qualified': '#2196F3',
    'in_conversation': '#9C27B0',
    'good': '#4CAF50',
    'won': '#4CAF50',
    'not_pickup': '#F44336',
    'deleted': '#757575',
    'hot': '#FF5722',
    'cold': '#607D8B',
    'warm': '#FF9800',
  };
  return colors[status] || colors.new;
}

const leadSources = [
  'Website',
  'WhatsApp',
  'Social Media',
  'Referral',
  'Advertisement',
  'Cold Call',
  'Email Campaign',
  'Event',
  'Other'
];

const leadPriorities = [
  { value: 'high', label: 'High Priority', color: '#F44336' },
  { value: 'medium', label: 'Medium Priority', color: '#FF9800' },
  { value: 'low', label: 'Low Priority', color: '#4CAF50' },
];

const leadStatuses = [
  { value: 'new', label: 'New Lead', color: '#FF9800' },
  { value: 'qualified', label: 'Qualified', color: '#2196F3' },
  { value: 'in_conversation', label: 'In Conversation', color: '#9C27B0' },
  { value: 'good', label: 'Good Lead', color: '#4CAF50' },
  { value: 'won', label: 'Won', color: '#4CAF50' },
  { value: 'not_pickup', label: 'Not Pickup', color: '#F44336' },
  { value: 'deleted', label: 'Deleted', color: '#757575' },
  { value: 'hot', label: 'Hot Lead', color: '#FF5722' },
  { value: 'cold', label: 'Cold Lead', color: '#607D8B' },
  { value: 'warm', label: 'Warm Lead', color: '#FF9800' },
];

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Enhanced state management
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSearches, setSavedSearches] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'kanban', 'cards'
  const [filters, setFilters] = useState({
    status: [],
    source: [],
    priority: [],
    dateRange: 'all',
    assignedTo: 'all',
    leadScore: [0, 100],
    tags: [],
    customFields: {},
    createdDate: null,
    updatedDate: null,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionMenu, setBulkActionMenu] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Enhanced API queries using React Query
  const {
    data: leadsData,
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useQuery(
    ['leads', page, rowsPerPage, searchQuery, filters, sortConfig],
    () => apiService.get('/leads', {
      params: {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        leadScore: filters.leadScore.join(','),
        tags: filters.tags.join(','),
      }
    }),
    {
      refetchInterval: realTimeEnabled ? 30000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load leads');
      }
    }
  );

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics
  } = useQuery(
    ['leads-analytics', filters],
    () => apiService.get('/analytics/leads', { params: filters }),
    {
      refetchInterval: realTimeEnabled ? 60000 : false,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to load analytics');
    }
    }
  );

  const {
    data: leadSuggestionsData,
    refetch: refetchSuggestions
  } = useQuery(
    ['lead-suggestions'],
    () => apiService.get('/analytics/lead-suggestions'),
    {
      enabled: false,
      retry: 1
    }
  );

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (realTimeEnabled) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        console.log('Connected to leads real-time updates');
        toast.success('Real-time updates connected');
      });

      newSocket.on('lead_update', (data) => {
        setLastUpdate(new Date());
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['leads-analytics']);
        toast.success(`Lead ${data.action}: ${data.lead.name}`);
      });

      newSocket.on('leads_bulk_update', (data) => {
        setLastUpdate(new Date());
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['leads-analytics']);
        toast.success(`Bulk ${data.action} completed: ${data.count} leads`);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from real-time updates');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [realTimeEnabled, queryClient]);

  // Process data safely
  const leads = leadsData?.data?.leads || [];
  const analytics = analyticsData?.data || {};
  const leadSuggestions = leadSuggestionsData?.data || [];
  const totalCount = leadsData?.data?.totalCount || 0;
  const totalPages = leadsData?.data?.totalPages || 0;
  
  // Enhanced analytics metrics
  const getAnalyticsMetrics = () => {
    return [
      {
        title: 'Total Leads',
        value: analytics.totalLeads || 0,
        icon: <PersonIcon />,
        color: '#3B82F6',
        trend: analytics.leadGrowth > 0 ? 'up' : analytics.leadGrowth < 0 ? 'down' : 'stable',
        trendValue: analytics.leadGrowth || 0,
        subtitle: `+${analytics.newLeadsToday || 0} today`,
      },
      {
        title: 'Conversion Rate',
        value: `${(analytics.conversionRate || 0).toFixed(1)}%`,
        icon: <TrendingUpIcon />,
        color: '#10B981',
        trend: analytics.conversionTrend || 'stable',
        trendValue: analytics.conversionChange || 0,
        subtitle: `${analytics.convertedThisMonth || 0} this month`,
      },
      {
        title: 'Active Conversations',
        value: analytics.activeConversations || 0,
        icon: <WhatsAppIcon />,
        color: '#25D366',
        trend: 'up',
        trendValue: analytics.conversationGrowth || 0,
        subtitle: `${analytics.responseRate || 0}% response rate`,
      },
      {
        title: 'Lead Score Avg',
        value: (analytics.averageLeadScore || 0).toFixed(1),
        icon: <InsightsIcon />,
        color: '#8B5CF6',
        trend: analytics.scoreImprovement > 0 ? 'up' : analytics.scoreImprovement < 0 ? 'down' : 'stable',
        trendValue: analytics.scoreImprovement || 0,
        subtitle: `${analytics.highQualityLeads || 0} high quality`,
      },
    ];
  };

  // Handle lead actions
  const handleAddLead = () => {
    setAddDialogOpen(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const response = await apiService.deleteLead(leadId);
      if (response.success) {
        setSnackbar({ open: true, message: 'Lead deleted successfully', severity: 'success' });
        loadLeads();
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete lead', severity: 'error' });
    }
    setDeleteDialogOpen(false);
  };

  // Enhanced bulk action handlers
  const handleBulkAction = async (action, options = {}) => {
    try {
      let response;
      switch (action) {
        case 'delete':
          response = await apiService.post('/leads/bulk-delete', {
            leadIds: selectedLeads
          });
          break;
        case 'update-status':
          response = await apiService.post('/leads/bulk-update', {
            leadIds: selectedLeads,
            updates: { status: options.status }
          });
          break;
        case 'update-priority':
          response = await apiService.post('/leads/bulk-update', {
            leadIds: selectedLeads,
            updates: { priority: options.priority }
          });
          break;
        case 'add-tags':
          response = await apiService.post('/leads/bulk-update', {
            leadIds: selectedLeads,
            updates: { $push: { tags: { $each: options.tags } } }
          });
          break;
        case 'remove-tags':
          response = await apiService.post('/leads/bulk-update', {
            leadIds: selectedLeads,
            updates: { $pull: { tags: { $in: options.tags } } }
          });
          break;
        case 'assign':
          response = await apiService.post('/leads/bulk-update', {
            leadIds: selectedLeads,
            updates: { assignedTo: options.assignedTo }
          });
          break;
        case 'export':
          response = await apiService.post('/leads/bulk-export', {
            leadIds: selectedLeads,
            format: options.format || 'csv'
          });
          if (response.data?.downloadUrl) {
            window.open(response.data.downloadUrl, '_blank');
          }
          break;
        default:
          return;
      }
      
      if (response.data?.success !== false) {
        toast.success(`${action.replace('-', ' ')} completed successfully`);
        setSelectedLeads([]);
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['leads-analytics']);
      }
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      toast.error(`Failed to ${action.replace('-', ' ')} leads`);
    }
    setBulkActionMenu(null);
  };

  // Enhanced individual lead actions
  const handleLeadAction = async (leadId, action, options = {}) => {
    try {
      let response;
      switch (action) {
        case 'update-status':
          response = await apiService.put(`/leads/${leadId}`, {
            status: options.status
          });
          break;
        case 'update-priority':
          response = await apiService.put(`/leads/${leadId}`, {
            priority: options.priority
          });
          break;
        case 'add-note':
          response = await apiService.post(`/leads/${leadId}/notes`, {
            note: options.note
          });
          break;
        case 'delete':
          response = await apiService.delete(`/leads/${leadId}`);
          break;
        default:
          return;
      }
      
      if (response.data?.success !== false) {
        toast.success(`Lead ${action.replace('-', ' ')} completed`);
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['leads-analytics']);
      }
    } catch (error) {
      console.error(`Error in lead ${action}:`, error);
      toast.error(`Failed to ${action.replace('-', ' ')} lead`);
    }
  };

  // Enhanced filtering and sorting (now handled by backend)
  const filteredLeads = leads; // Backend handles filtering
  const sortedLeads = filteredLeads; // Backend handles sorting
  const paginatedLeads = sortedLeads; // Backend handles pagination

  // Save and load search functionality
  const saveCurrentSearch = () => {
    const searchData = {
      id: Date.now(),
      name: searchQuery || 'Untitled Search',
      query: searchQuery,
      filters: filters,
      sortConfig: sortConfig,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedSearches, searchData];
    setSavedSearches(updated);
    localStorage.setItem('leadSavedSearches', JSON.stringify(updated));
    toast.success('Search saved successfully');
  };

  const loadSavedSearch = (searchData) => {
    setSearchQuery(searchData.query || '');
    setFilters(searchData.filters || {});
    setSortConfig(searchData.sortConfig || { key: 'createdAt', direction: 'desc' });
    setPage(0);
    toast.success('Search loaded successfully');
  };

  // Load saved searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('leadSavedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Enhanced refresh functionality
  const handleRefreshAll = useCallback(() => {
    queryClient.invalidateQueries(['leads']);
    queryClient.invalidateQueries(['leads-analytics']);
    setLastUpdate(new Date());
    toast.success('Data refreshed');
  }, [queryClient]);

  // Loading state
  if (leadsLoading && analyticsLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Lead Management
              {leadsLoading && <CircularProgress size={20} />}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Manage your leads, track conversations, and boost conversions
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {totalCount} total leads • Last updated: {format(lastUpdate, 'HH:mm:ss')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeEnabled}
                    onChange={(e) => setRealTimeEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="Real-time"
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="cards">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              {/* Action Buttons */}
              <ActionButton
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshAll}
                disabled={leadsLoading}
              >
                Refresh
              </ActionButton>
              <ActionButton
                variant="outlined"
                startIcon={<ImportExportIcon />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import
              </ActionButton>
              <ActionButton
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
              >
                Export
              </ActionButton>
              <ActionButton
                variant="outlined"
                startIcon={<PsychologyIcon />}
                onClick={() => {
                  setAiSuggestionsOpen(true);
                  refetchSuggestions();
                }}
              >
                AI Insights
              </ActionButton>
              <ActionButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddLead}
              >
                Add Lead
              </ActionButton>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Analytics Cards */}
      {analyticsLoading ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getAnalyticsMetrics().map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard trend={metric.trend}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                      {metric.value}
                    </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {metric.title}
                    </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metric.subtitle}
                    </Typography>
                    {metric.trendValue !== 0 && (
                      <Chip
                        label={`${metric.trendValue > 0 ? '+' : ''}${metric.trendValue}%`}
                        size="small"
                        sx={{
                          mt: 1,
                          backgroundColor: alpha(metric.color, 0.1),
                          color: metric.color,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    backgroundColor: alpha(metric.color, 0.1),
                    color: metric.color
                  }}>
                    {metric.icon}
                  </Box>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Error States */}
      {(leadsError || analyticsError) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Some data may be unavailable</AlertTitle>
          There were issues loading some lead data. Please try refreshing or check your connection.
        </Alert>
      )}

      {/* Filters */}
      <FilterSection>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Filters & Search</Typography>
          <Button
            variant="text"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search leads by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    multiple
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    input={<OutlinedInput label="Status" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {leadStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Checkbox checked={filters.status.indexOf(status.value) > -1} />
                        <ListItemText primary={status.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    multiple
                    value={filters.source}
                    onChange={(e) => setFilters({...filters, source: e.target.value})}
                    input={<OutlinedInput label="Source" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {leadSources.map((source) => (
                      <MenuItem key={source} value={source}>
                        <Checkbox checked={filters.source.indexOf(source) > -1} />
                        <ListItemText primary={source} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    multiple
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    input={<OutlinedInput label="Priority" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {leadPriorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Checkbox checked={filters.priority.indexOf(priority.value) > -1} />
                        <ListItemText primary={priority.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    label="Date Range"
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="quarter">This Quarter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>
      </FilterSection>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleBulkAction('assign')}
                  >
                    Assign
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleBulkAction('export')}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leads Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedLeads.length > 0 && selectedLeads.length < paginatedLeads.length}
                  checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(paginatedLeads.map(lead => lead.id));
                    } else {
                      setSelectedLeads([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>Lead</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLeads.map((lead) => (
              <TableRow key={lead.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads([...selectedLeads, lead.id]);
                      } else {
                        setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {lead.name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {lead.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.company || 'No company'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{lead.email || 'No email'}</Typography>
                    <Typography variant="body2">{lead.phone || 'No phone'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={lead.status}
                    status={lead.status}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip label={lead.source || 'Unknown'} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={lead.priority || 'medium'}
                    size="small"
                    sx={{
                      backgroundColor: alpha(
                        leadPriorities.find(p => p.value === lead.priority)?.color || '#FF9800',
                        0.1
                      ),
                      color: leadPriorities.find(p => p.value === lead.priority)?.color || '#FF9800',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => navigate(`/leads/${lead.id}`)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditLead(lead)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="WhatsApp">
                      <IconButton size="small" sx={{ color: '#25D366' }}>
                        <WhatsAppIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Call">
                      <IconButton size="small" sx={{ color: '#2196F3' }}>
                        <CallIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          showFirstButton
          showLastButton
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`}
        />
      </TableContainer>

      {/* Empty State */}
      {paginatedLeads.length === 0 && !leadsLoading && (
        <EmptyState
          icon={<PersonIcon />}
          title="No leads found"
          description="Try adjusting your filters or add some leads to get started"
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddLead}>
              Add First Lead
            </Button>
          }
        />
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleAddLead}
      >
        <AddIcon />
      </Fab>

      {/* AI Suggestions Popover */}
      <Popover
        open={aiSuggestionsOpen}
        onClose={() => setAiSuggestionsOpen(false)}
        anchorEl={document.body}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { minWidth: 400, maxWidth: 600, p: 2 }
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon />
            AI Lead Insights
          </Typography>
          
          {leadSuggestions.length > 0 ? (
            <List>
              {leadSuggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AutoAwesomeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.title}
                    secondary={suggestion.description}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No AI insights available at the moment. Try again later.
            </Typography>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default Leads; 