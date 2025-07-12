import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Tooltip,
  Menu,
  MenuItem as MenuOption,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Rating,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  Autorenew as AutorenewIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Note as NoteIcon,
  History as HistoryIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { styled, alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const LeadScoreCard = styled(Card)(({ theme, score }) => {
  const getScoreColor = () => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return {
    background: `linear-gradient(135deg, ${alpha(getScoreColor(), 0.1)}, ${alpha(getScoreColor(), 0.05)})`,
    border: `1px solid ${alpha(getScoreColor(), 0.2)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows[4],
    },
  };
});

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leads-tabpanel-${index}`}
      aria-labelledby={`leads-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const LeadsEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    priority: '',
    assignedTo: '',
    dateRange: '',
    scoreRange: [0, 100]
  });
  const [sortBy, setSortBy] = useState('-createdAt');
  const [viewMode, setViewMode] = useState('table'); // table, grid, kanban
  
  // Dialog states
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [leadDetailDialogOpen, setLeadDetailDialogOpen] = useState(false);
  
  // Form states
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    status: 'new',
    priority: 'medium',
    notes: '',
    tags: []
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Speed dial and menu states
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // API Queries
  const {
    data: leadsResponse,
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useQuery(
    ['leads', page, rowsPerPage, searchTerm, filters, sortBy],
    () => apiService.getLeads({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      ...filters,
      sort: sortBy
    }),
    {
      keepPreviousData: true,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  const {
    data: leadStats,
    isLoading: statsLoading
  } = useQuery(
    ['lead-stats'],
    () => apiService.getLeadStats(),
    {
      refetchInterval: 60000, // Refresh stats every minute
    }
  );

  const {
    data: workflows,
    isLoading: workflowsLoading
  } = useQuery(
    ['workflows'],
    () => apiService.getWorkflows(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mutations
  const createLeadMutation = useMutation(
    (data) => apiService.createLead(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['lead-stats']);
        setLeadDialogOpen(false);
        resetLeadForm();
        setSnackbar({ open: true, message: 'Lead created successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: 'Failed to create lead', severity: 'error' });
      }
    }
  );

  const updateLeadMutation = useMutation(
    ({ id, data }) => apiService.updateLead(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['lead-stats']);
        setLeadDialogOpen(false);
        resetLeadForm();
        setSnackbar({ open: true, message: 'Lead updated successfully!', severity: 'success' });
      }
    }
  );

  const bulkUpdateLeadsMutation = useMutation(
    ({ ids, data }) => apiService.bulkUpdateLeads(ids, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['lead-stats']);
        setBulkActionDialogOpen(false);
        setSelectedLeads([]);
        setSnackbar({ open: true, message: 'Bulk operation completed!', severity: 'success' });
      }
    }
  );

  const deleteLeadMutation = useMutation(
    (id) => apiService.deleteLead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['lead-stats']);
        setSnackbar({ open: true, message: 'Lead deleted successfully!', severity: 'success' });
      }
    }
  );

  // Process data
  const leads = leadsResponse?.data || [];
  const totalLeads = leadsResponse?.total || 0;

  // Helper functions
  const resetLeadForm = () => {
    setLeadFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: '',
      status: 'new',
      priority: 'medium',
      notes: '',
      tags: []
    });
    setSelectedLead(null);
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = (event) => {
    if (event.target.checked) {
      setSelectedLeads(leads.map(lead => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  const getLeadScore = (lead) => {
    // Simple lead scoring algorithm
    let score = 0;
    
    // Basic info completeness
    if (lead.email) score += 20;
    if (lead.phone) score += 20;
    if (lead.company) score += 15;
    if (lead.position) score += 10;
    
    // Engagement score
    if (lead.lastContactDate) {
      const daysSinceContact = Math.floor((new Date() - new Date(lead.lastContactDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact < 7) score += 20;
      else if (daysSinceContact < 30) score += 10;
    }
    
    // Status-based scoring
    const statusScores = { hot: 15, warm: 10, cold: 5, new: 0 };
    score += statusScores[lead.status] || 0;
    
    return Math.min(score, 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'info',
      contacted: 'warning',
      qualified: 'success',
      proposal: 'primary',
      negotiation: 'secondary',
      closed: 'success',
      lost: 'error'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  const handleLeadSubmit = () => {
    if (selectedLead) {
      updateLeadMutation.mutate({ id: selectedLead._id, data: leadFormData });
    } else {
      createLeadMutation.mutate(leadFormData);
    }
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setLeadFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      position: lead.position || '',
      source: lead.source || '',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      notes: lead.notes || '',
      tags: lead.tags || []
    });
    setLeadDialogOpen(true);
  };

  const handleDeleteLead = (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLeadMutation.mutate(leadId);
    }
  };

  const handleBulkAction = () => {
    if (selectedLeads.length === 0) {
      setSnackbar({ open: true, message: 'Please select leads first', severity: 'warning' });
      return;
    }
    setBulkActionDialogOpen(true);
  };

  const executeBulkAction = () => {
    const updateData = {};
    
    switch (bulkAction) {
      case 'delete':
        selectedLeads.forEach(id => deleteLeadMutation.mutate(id));
        break;
      case 'status-contacted':
        updateData.status = 'contacted';
        break;
      case 'status-qualified':
        updateData.status = 'qualified';
        break;
      case 'priority-high':
        updateData.priority = 'high';
        break;
      case 'priority-low':
        updateData.priority = 'low';
        break;
      case 'assign-me':
        updateData.assignedTo = user._id;
        break;
      default:
        break;
    }
    
    if (Object.keys(updateData).length > 0) {
      bulkUpdateLeadsMutation.mutate({ ids: selectedLeads, data: updateData });
    }
  };

  const handleExportLeads = () => {
    // Export functionality
    const csvData = leads.map(lead => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      Position: lead.position,
      Status: lead.status,
      Priority: lead.priority,
      Source: lead.source,
      Score: getLeadScore(lead),
      'Created Date': format(new Date(lead.createdAt), 'yyyy-MM-dd')
    }));
    
    // Convert to CSV and download
    const csv = convertToCSV(csvData);
    downloadCSV(csv, 'leads-export.csv');
    setSnackbar({ open: true, message: 'Leads exported successfully!', severity: 'success' });
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Speed dial actions
  const speedDialActions = [
    { icon: <AddIcon />, name: 'Add Lead', onClick: () => setLeadDialogOpen(true) },
    { icon: <UploadIcon />, name: 'Import Leads', onClick: () => setSnackbar({ open: true, message: 'Import feature coming soon!', severity: 'info' }) },
    { icon: <DownloadIcon />, name: 'Export Leads', onClick: handleExportLeads },
    { icon: <CampaignIcon />, name: 'Create Campaign', onClick: () => navigate('/campaigns') },
    { icon: <AutorenewIcon />, name: 'Automation', onClick: () => setWorkflowDialogOpen(true) }
  ];

  // Statistics cards data
  const statsCards = [
    {
      title: 'Total Leads',
      value: leadStats?.total || 0,
      change: leadStats?.totalChange || 0,
      icon: <GroupIcon />,
      color: 'primary'
    },
    {
      title: 'Hot Leads',
      value: leadStats?.hot || 0,
      change: leadStats?.hotChange || 0,
      icon: <TrendingUpIcon />,
      color: 'error'
    },
    {
      title: 'Conversion Rate',
      value: `${leadStats?.conversionRate || 0}%`,
      change: leadStats?.conversionChange || 0,
      icon: <SpeedIcon />,
      color: 'success'
    },
    {
      title: 'This Month',
      value: leadStats?.thisMonth || 0,
      change: leadStats?.monthlyChange || 0,
      icon: <CalendarIcon />,
      color: 'info'
    }
  ];

  if (leadsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading leads...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Lead Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your leads effectively
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportLeads}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setLeadDialogOpen(true)}
            >
              Add Lead
            </Button>
          </Stack>
        </Stack>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StyledCard>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <TrendingUpIcon 
                          fontSize="small" 
                          color={stat.change >= 0 ? 'success' : 'error'} 
                        />
                        <Typography 
                          variant="body2" 
                          color={stat.change >= 0 ? 'success.main' : 'error.main'}
                        >
                          {stat.change >= 0 ? '+' : ''}{stat.change}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs last month
                        </Typography>
                      </Stack>
                    </Box>
                    <Avatar sx={{ bgcolor: `${stat.color}.main` }}>
                      {stat.icon}
                    </Avatar>
                  </Stack>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <TextField
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                )
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="-createdAt">Newest First</MenuItem>
                <MenuItem value="createdAt">Oldest First</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="-name">Name Z-A</MenuItem>
                <MenuItem value="-score">Highest Score</MenuItem>
                <MenuItem value="score">Lowest Score</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={refetchLeads}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Stack>

          {/* Active Filters */}
          {Object.entries(filters).some(([key, value]) => value && value !== '' && !(Array.isArray(value) && value.length === 0)) && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                  return (
                    <FilterChip
                      key={key}
                      label={`${key}: ${Array.isArray(value) ? value.join('-') : value}`}
                      onDelete={() => setFilters({ ...filters, [key]: '' })}
                      size="small"
                    />
                  );
                })}
                <Button
                  size="small"
                  onClick={() => setFilters({
                    status: '',
                    source: '',
                    priority: '',
                    assignedTo: '',
                    dateRange: '',
                    scoreRange: [0, 100]
                  })}
                >
                  Clear All
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {selectedLeads.length} lead(s) selected
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleBulkAction}
                >
                  Bulk Actions
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSelectedLeads([])}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedLeads.length > 0 && selectedLeads.length < leads.length}
                    checked={leads.length > 0 && selectedLeads.length === leads.length}
                    onChange={handleSelectAllLeads}
                  />
                </TableCell>
                <TableCell>Lead Info</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead._id}
                  hover
                  selected={selectedLeads.includes(lead._id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedLeads.includes(lead._id)}
                      onChange={() => handleSelectLead(lead._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>
                        {lead.name?.charAt(0)?.toUpperCase() || 'L'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {lead.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.email}
                        </Typography>
                        {lead.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {lead.phone}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {lead.company || '-'}
                      </Typography>
                      {lead.position && (
                        <Typography variant="caption" color="text.secondary">
                          {lead.position}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.status}
                      color={getStatusColor(lead.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.priority}
                      color={getPriorityColor(lead.priority)}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getLeadScore(lead)}
                        sx={{ width: 60, height: 6 }}
                        color={getLeadScore(lead) >= 70 ? 'success' : getLeadScore(lead) >= 40 ? 'warning' : 'error'}
                      />
                      <Typography variant="caption">
                        {getLeadScore(lead)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.source || 'Unknown'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(lead.createdAt))} ago
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedLead(lead);
                            setLeadDetailDialogOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditLead(lead)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Call">
                        <IconButton size="small" color="primary">
                          <PhoneIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Email">
                        <IconButton size="small" color="secondary">
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <IconButton size="small" color="success">
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedLead(lead);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalLeads}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

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

      {/* Lead Dialog */}
      <Dialog open={leadDialogOpen} onClose={() => setLeadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedLead ? 'Edit Lead' : 'Add New Lead'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={leadFormData.name}
                onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={leadFormData.email}
                onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={leadFormData.phone}
                onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={leadFormData.company}
                onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={leadFormData.position}
                onChange={(e) => setLeadFormData({ ...leadFormData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={leadFormData.source}
                  onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                >
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="social-media">Social Media</MenuItem>
                  <MenuItem value="cold-call">Cold Call</MenuItem>
                  <MenuItem value="email">Email Campaign</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={leadFormData.status}
                  onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value })}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="proposal">Proposal</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={leadFormData.priority}
                  onChange={(e) => setLeadFormData({ ...leadFormData, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={leadFormData.notes}
                onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                placeholder="Add any additional notes about this lead..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLeadSubmit}
            disabled={createLeadMutation.isLoading || updateLeadMutation.isLoading}
          >
            {selectedLead ? 'Update' : 'Create'} Lead
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select an action to apply to {selectedLeads.length} selected leads:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <MenuItem value="status-contacted">Mark as Contacted</MenuItem>
              <MenuItem value="status-qualified">Mark as Qualified</MenuItem>
              <MenuItem value="priority-high">Set High Priority</MenuItem>
              <MenuItem value="priority-low">Set Low Priority</MenuItem>
              <MenuItem value="assign-me">Assign to Me</MenuItem>
              <MenuItem value="delete">Delete Leads</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={executeBulkAction}
            disabled={!bulkAction || bulkUpdateLeadsMutation.isLoading}
            color={bulkAction === 'delete' ? 'error' : 'primary'}
          >
            Execute Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuOption onClick={() => {
          handleEditLead(selectedLead);
          setAnchorEl(null);
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuOption>
        <MenuOption onClick={() => {
          // Create task for this lead
          setAnchorEl(null);
        }}>
          <ListItemIcon><TaskIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Create Task</ListItemText>
        </MenuOption>
        <MenuOption onClick={() => {
          // Schedule meeting
          setAnchorEl(null);
        }}>
          <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Schedule Meeting</ListItemText>
        </MenuOption>
        <MenuOption onClick={() => {
          // View timeline
          setAnchorEl(null);
        }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Timeline</ListItemText>
        </MenuOption>
        <Divider />
        <MenuOption 
          onClick={() => {
            handleDeleteLead(selectedLead._id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuOption>
      </Menu>

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
  );
};

export default LeadsEnhanced; 