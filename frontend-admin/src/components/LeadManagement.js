import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Rating,
  Tooltip,
  Menu,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  Star,
  StarBorder,
  TrendingUp,
  TrendingDown,
  Assignment,
  Phone,
  Email,
  WhatsApp,
  MoreVert,
  FilterList,
  GetApp,
  Add,
  Timeline,
  Assessment,
  People,
  AttachMoney,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LeadCard = styled(Card)(({ theme, priority }) => ({
  borderLeft: `4px solid ${
    priority === 'hot' ? theme.palette.error.main :
    priority === 'warm' ? theme.palette.warning.main :
    priority === 'cold' ? theme.palette.info.main :
    theme.palette.grey[300]
  }`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: 'white',
  textAlign: 'center',
  padding: theme.spacing(2),
}));

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LeadManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuLeadId, setMenuLeadId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    source: '',
    status: '',
    priority: '',
    assignedTo: '',
    dateRange: '',
    searchTerm: '',
  });

  // Lead analytics data
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newToday: 0,
    converted: 0,
    conversionRate: 0,
    averageScore: 0,
    hotLeads: 0,
  });

  // Chart data
  const [chartData, setChartData] = useState({
    leadTrend: [],
    sourceDistribution: [],
    conversionFunnel: [],
    scoreDistribution: [],
  });

  // Mock data for development
  const mockLeads = [
    {
      _id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'TechCorp Inc',
      source: 'Website',
      status: 'new',
      priority: 'hot',
      score: 85,
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-01-15T10:30:00Z',
      lastActivity: '2024-01-15T14:20:00Z',
      notes: 'Interested in Enterprise plan',
      tags: ['enterprise', 'urgent'],
    },
    {
      _id: '2',
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '+1234567891',
      company: 'StartupXYZ',
      source: 'LinkedIn',
      status: 'contacted',
      priority: 'warm',
      score: 72,
      assignedTo: 'Mike Wilson',
      createdAt: '2024-01-14T09:15:00Z',
      lastActivity: '2024-01-15T11:45:00Z',
      notes: 'Scheduled demo for next week',
      tags: ['demo-scheduled'],
    },
    {
      _id: '3',
      name: 'Robert Brown',
      email: 'robert@example.com',
      phone: '+1234567892',
      company: 'Enterprise Solutions',
      source: 'WhatsApp',
      status: 'qualified',
      priority: 'hot',
      score: 92,
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-01-13T16:45:00Z',
      lastActivity: '2024-01-15T13:30:00Z',
      notes: 'Ready to purchase, waiting for approval',
      tags: ['ready-to-buy', 'high-value'],
    },
  ];

  useEffect(() => {
    loadLeads();
    loadAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, filters]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/leads/advanced', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || mockLeads);
      } else {
        setLeads(mockLeads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/leads/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || {
          totalLeads: 3840,
          newToday: 28,
          converted: 1152,
          conversionRate: 30.0,
          averageScore: 76.5,
          hotLeads: 156,
        });
        setChartData(data.chartData || {
          leadTrend: [
            { date: '2024-01-01', leads: 120, converted: 36 },
            { date: '2024-01-02', leads: 135, converted: 41 },
            { date: '2024-01-03', leads: 149, converted: 45 },
            { date: '2024-01-04', leads: 162, converted: 49 },
            { date: '2024-01-05', leads: 178, converted: 53 },
            { date: '2024-01-06', leads: 195, converted: 59 },
            { date: '2024-01-07', leads: 210, converted: 63 },
          ],
          sourceDistribution: [
            { name: 'Website', value: 45, color: '#0088FE' },
            { name: 'WhatsApp', value: 25, color: '#00C49F' },
            { name: 'LinkedIn', value: 15, color: '#FFBB28' },
            { name: 'Email Campaign', value: 10, color: '#FF8042' },
            { name: 'Referral', value: 5, color: '#8884D8' },
          ],
          conversionFunnel: [
            { stage: 'New Leads', count: 1000 },
            { stage: 'Contacted', count: 750 },
            { stage: 'Qualified', count: 500 },
            { stage: 'Proposal', count: 300 },
            { stage: 'Closed', count: 150 },
          ],
          scoreDistribution: [
            { range: '0-20', count: 120 },
            { range: '21-40', count: 280 },
            { range: '41-60', count: 450 },
            { range: '61-80', count: 320 },
            { range: '81-100', count: 180 },
          ],
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.company.toLowerCase().includes(term)
      );
    }

    if (filters.source) {
      filtered = filtered.filter(lead => lead.source === filters.source);
    }

    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(lead => lead.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(lead => lead.assignedTo === filters.assignedTo);
    }

    setFilteredLeads(filtered);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'primary';
      case 'contacted': return 'info';
      case 'qualified': return 'warning';
      case 'proposal': return 'secondary';
      case 'closed': return 'success';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'hot': return 'error';
      case 'warm': return 'warning';
      case 'cold': return 'info';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  const handleMenuOpen = (event, leadId) => {
    setMenuAnchor(event.currentTarget);
    setMenuLeadId(leadId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuLeadId(null);
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadLeads();
        loadAnalytics();
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
    handleMenuClose();
  };

  const renderLeadAnalytics = () => (
    <Box>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.totalLeads.toLocaleString()}
              </Typography>
              <Typography variant="body2">Total Leads</Typography>
              <Assignment sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.newToday}
              </Typography>
              <Typography variant="body2">New Today</Typography>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.converted.toLocaleString()}
              </Typography>
              <Typography variant="body2">Converted</Typography>
              <AttachMoney sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.conversionRate}%
              </Typography>
              <Typography variant="body2">Conversion Rate</Typography>
              <Timeline sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.averageScore}
              </Typography>
              <Typography variant="body2">Average Score</Typography>
              <Assessment sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {analytics.hotLeads}
              </Typography>
              <Typography variant="body2">Hot Leads</Typography>
              <Star sx={{ fontSize: 40, opacity: 0.8, mt: 1 }} />
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Lead Trend & Conversions</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.leadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Area type="monotone" dataKey="converted" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Lead Sources</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.sourceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>Conversion Funnel</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.conversionFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>Score Distribution</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderLeadList = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Name, email, company..."
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={filters.source}
                label="Source"
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              >
                <MenuItem value="">All Sources</MenuItem>
                <MenuItem value="Website">Website</MenuItem>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                <MenuItem value="Email Campaign">Email Campaign</MenuItem>
                <MenuItem value="Referral">Referral</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="hot">Hot</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="cold">Cold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilters({ source: '', status: '', priority: '', assignedTo: '', dateRange: '', searchTerm: '' })}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lead Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{lead.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <Chip label={lead.source} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status}
                        size="small"
                        color={getStatusColor(lead.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lead.priority}
                        size="small"
                        color={getPriorityColor(lead.priority)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {lead.score}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={lead.score}
                          color={getScoreColor(lead.score)}
                          sx={{ width: 60, height: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{lead.assignedTo}</TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewDetails(lead)}>
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={(e) => handleMenuOpen(e, lead._id)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLeads.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleUpdateLeadStatus(menuLeadId, 'contacted')}>
          Mark as Contacted
        </MenuItem>
        <MenuItem onClick={() => handleUpdateLeadStatus(menuLeadId, 'qualified')}>
          Mark as Qualified
        </MenuItem>
        <MenuItem onClick={() => handleUpdateLeadStatus(menuLeadId, 'closed')}>
          Mark as Closed
        </MenuItem>
        <MenuItem onClick={() => handleUpdateLeadStatus(menuLeadId, 'lost')}>
          Mark as Lost
        </MenuItem>
      </Menu>

      {/* Lead Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lead Details</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Name:</Typography>
                <Typography>{selectedLead.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Company:</Typography>
                <Typography>{selectedLead.company}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Email:</Typography>
                <Typography>{selectedLead.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Phone:</Typography>
                <Typography>{selectedLead.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Source:</Typography>
                <Typography>{selectedLead.source}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">Score:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 2 }}>{selectedLead.score}</Typography>
                  <Rating value={selectedLead.score / 20} readOnly precision={0.5} />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Notes:</Typography>
                <Typography>{selectedLead.notes}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Tags:</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {selectedLead.tags?.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained">Edit Lead</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Lead Management
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Lead
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Analytics" icon={<Assessment />} iconPosition="start" />
        <Tab label="Lead List" icon={<People />} iconPosition="start" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {activeTab === 0 && renderLeadAnalytics()}
      {activeTab === 1 && renderLeadList()}
    </Box>
  );
};

export default LeadManagement; 