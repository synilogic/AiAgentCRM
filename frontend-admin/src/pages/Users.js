import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuListItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Email,
  Phone,
  Block,
  CheckCircle,
  Person,
  Business,
  TrendingUp,
  AttachMoney,
  Refresh,
  Download,
  Upload,
  FilterList,
  Visibility,
} from '@mui/icons-material';
import { useNotifications } from '../components/NotificationSystem';
import apiService from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const { success, error, info } = useNotifications();

  useEffect(() => {
    fetchUsers();
    
    // Setup real-time event listeners
    apiService.addEventListener('user_registered', handleUserRegistered);
    apiService.addEventListener('user_updated', handleUserUpdated);
    
    return () => {
      apiService.removeEventListener('user_registered', handleUserRegistered);
      apiService.removeEventListener('user_updated', handleUserUpdated);
    };
  }, [page, searchTerm, filterStatus, filterPlan]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterPlan !== 'all') filters.plan = filterPlan;
      if (searchTerm) filters.search = searchTerm;

      const response = await apiService.getUsers(page, 20, filters);
      
      if (Array.isArray(response)) {
        setUsers(response);
        setStats({
          total: response.length,
          active: response.filter(u => u.isActive).length,
          inactive: response.filter(u => !u.isActive).length,
        });
      } else {
        setUsers(response.users || []);
        setTotalPages(response.totalPages || 1);
        setStats({
          total: response.total || 0,
          active: response.users?.filter(u => u.isActive).length || 0,
          inactive: response.users?.filter(u => !u.isActive).length || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    success('Users list refreshed');
  };

  // Real-time event handlers
  const handleUserRegistered = (data) => {
    info(`New user registered: ${data.email}`);
    fetchUsers(); // Refresh the list
  };

  const handleUserUpdated = (data) => {
    setUsers(prev => prev.map(user => 
      user._id === data.userId 
        ? { ...user, ...data.data }
        : user
    ));
    success('User data updated in real-time');
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      let result;
      switch (action) {
        case 'edit':
          result = await apiService.updateUser(userId, data);
          break;
        case 'deactivate':
          result = await apiService.deactivateUser(userId);
          break;
        case 'delete':
          result = await apiService.deactivateUser(userId);
          break;
        default:
          return;
      }

      if (result.success !== false) {
        success(`User ${action} completed successfully`);
        fetchUsers();
      } else {
        error(result.message || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      error(`Failed to ${action} user`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      error('Please select users first');
      return;
    }

    try {
      const result = await apiService.bulkOperation(action, 'users', selectedUsers);
      if (result.success !== false) {
        success(`Bulk ${action} completed for ${selectedUsers.length} users`);
        setSelectedUsers([]);
        fetchUsers();
      } else {
        error(result.message || `Failed to perform bulk ${action}`);
      }
    } catch (err) {
      console.error(`Failed to perform bulk ${action}:`, err);
      error(`Failed to perform bulk ${action}`);
    }
  };

  const handleExport = async () => {
    try {
      const result = await apiService.exportData('users', 'csv', {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        plan: filterPlan !== 'all' ? filterPlan : undefined,
        search: searchTerm || undefined
      });
      
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        success('Users exported successfully');
      }
    } catch (err) {
      console.error('Failed to export users:', err);
      error('Failed to export users');
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free': return 'default';
      case 'pro': return 'primary';
      case 'enterprise': return 'secondary';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users with real-time updates
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedUser(null);
              setDialogOpen(true);
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.active || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Block />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.inactive || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Inactive Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  label="Plan"
                >
                  <MenuItem value="all">All Plans</MenuItem>
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              {selectedUsers.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleBulkAction('deactivate')}
                  fullWidth
                >
                  Bulk Action ({selectedUsers.length})
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    {/* <Checkbox /> */}
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stats</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell padding="checkbox">
                      {/* Checkbox for bulk selection */}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Badge
                          color={user.isActive ? 'success' : 'error'}
                          variant="dot"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar sx={{ mr: 2 }}>
                            {user.name?.charAt(0) || user.email?.charAt(0)}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {user.name || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.plan?.toUpperCase() || 'FREE'}
                        color={getPlanColor(user.plan)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={getStatusColor(user.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Leads: {user.totalLeads || 0}
                        </Typography>
                        <Typography variant="body2">
                          Revenue: ₹{(user.revenue || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email">
                          <IconButton
                            size="small"
                            onClick={() => window.open(`mailto:${user.email}`)}
                          >
                            <Email />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setMenuAnchor(e.currentTarget);
                              setSelectedUser(user);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsers.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuListItem onClick={() => {
          handleUserAction('edit', selectedUser?._id);
          setMenuAnchor(null);
        }}>
          <Edit sx={{ mr: 1 }} /> Edit User
        </MenuListItem>
        <MenuListItem onClick={() => {
          handleUserAction('deactivate', selectedUser?._id);
          setMenuAnchor(null);
        }}>
          <Block sx={{ mr: 1 }} /> Deactivate
        </MenuListItem>
        <MenuListItem onClick={() => {
          window.open(`mailto:${selectedUser?.email}`);
          setMenuAnchor(null);
        }}>
          <Email sx={{ mr: 1 }} /> Send Email
        </MenuListItem>
      </Menu>

      {/* User Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'User Details' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          {selectedUser ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Name:</strong> {selectedUser.name || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Email:</strong> {selectedUser.email}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Role:</strong> {selectedUser.role}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Plan:</strong> {selectedUser.plan?.toUpperCase() || 'FREE'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Statistics
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Leads:</strong> {selectedUser.totalLeads || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Converted Leads:</strong> {selectedUser.convertedLeads || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Revenue:</strong> ₹{(selectedUser.revenue || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Member Since:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Add new user functionality coming soon!
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          {selectedUser && (
            <Button
              variant="contained"
              onClick={() => {
                handleUserAction('edit', selectedUser._id);
                setDialogOpen(false);
              }}
            >
              Edit User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 