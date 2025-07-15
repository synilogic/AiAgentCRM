import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Menu,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
  ContactSupport as SupportIcon,
  AttachMoney as FinanceIcon,
  Visibility as ViewIcon,
  VpnKey as KeyIcon,
  Assignment as TaskIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StaffManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [staff, setStaff] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'support',
    department: '',
    isActive: true,
    permissions: [],
    notes: '',
    emergencyContact: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  // Role definitions with permissions
  const roles = [
    {
      value: 'admin',
      label: 'Super Admin',
      icon: <AdminIcon />,
      color: '#EF4444',
      permissions: ['all'],
      description: 'Full system access and control'
    },
    {
      value: 'manager',
      label: 'Manager',
      icon: <SecurityIcon />,
      color: '#F59E0B',
      permissions: ['users.manage', 'leads.manage', 'reports.view', 'settings.view'],
      description: 'Manage users, leads, and view reports'
    },
    {
      value: 'support',
      label: 'Support Staff',
      icon: <SupportIcon />,
      color: '#10B981',
      permissions: ['users.view', 'leads.view', 'support.manage'],
      description: 'Handle customer support and basic user management'
    },
    {
      value: 'finance',
      label: 'Finance',
      icon: <FinanceIcon />,
      color: '#3B82F6',
      permissions: ['payments.manage', 'subscriptions.manage', 'reports.financial'],
      description: 'Manage payments, subscriptions, and financial reports'
    },
  ];

  // Available permissions
  const allPermissions = [
    { id: 'users.view', name: 'View Users', category: 'Users' },
    { id: 'users.manage', name: 'Manage Users', category: 'Users' },
    { id: 'leads.view', name: 'View Leads', category: 'Leads' },
    { id: 'leads.manage', name: 'Manage Leads', category: 'Leads' },
    { id: 'payments.view', name: 'View Payments', category: 'Finance' },
    { id: 'payments.manage', name: 'Manage Payments', category: 'Finance' },
    { id: 'subscriptions.view', name: 'View Subscriptions', category: 'Finance' },
    { id: 'subscriptions.manage', name: 'Manage Subscriptions', category: 'Finance' },
    { id: 'reports.view', name: 'View Reports', category: 'Reports' },
    { id: 'reports.financial', name: 'Financial Reports', category: 'Reports' },
    { id: 'settings.view', name: 'View Settings', category: 'System' },
    { id: 'settings.manage', name: 'Manage Settings', category: 'System' },
    { id: 'support.manage', name: 'Manage Support', category: 'Support' },
    { id: 'analytics.view', name: 'View Analytics', category: 'Analytics' },
  ];

  const departments = [
    'Engineering',
    'Product',
    'Marketing',
    'Sales',
    'Customer Success',
    'Finance',
    'HR',
    'Operations',
  ];

  useEffect(() => {
    loadStaff();
    loadAuditLogs();
  }, [page, rowsPerPage, searchQuery, filterRole, filterStatus]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/staff', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
          role: filterRole,
          status: filterStatus,
        }
      });
      setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
      setSnackbar({
        open: true,
        message: 'Failed to load staff data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.get('/admin/staff');
      setAuditLogs(response.data.auditLogs || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
    }
  };

  const generateMockStaff = () => [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@aiagentcrm.com',
      phone: '+1 (555) 123-4567',
      role: 'admin',
      department: 'Engineering',
      isActive: true,
      lastLogin: new Date(Date.now() - 86400000 * 2),
      joiningDate: new Date(Date.now() - 86400000 * 365),
      permissions: ['all'],
      avatar: '',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@aiagentcrm.com',
      phone: '+1 (555) 234-5678',
      role: 'manager',
      department: 'Customer Success',
      isActive: true,
      lastLogin: new Date(Date.now() - 86400000),
      joiningDate: new Date(Date.now() - 86400000 * 180),
      permissions: ['users.manage', 'leads.manage', 'reports.view'],
      avatar: '',
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@aiagentcrm.com',
      phone: '+1 (555) 345-6789',
      role: 'support',
      department: 'Customer Success',
      isActive: true,
      lastLogin: new Date(Date.now() - 3600000),
      joiningDate: new Date(Date.now() - 86400000 * 90),
      permissions: ['users.view', 'leads.view', 'support.manage'],
      avatar: '',
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@aiagentcrm.com',
      phone: '+1 (555) 456-7890',
      role: 'finance',
      department: 'Finance',
      isActive: false,
      lastLogin: new Date(Date.now() - 86400000 * 7),
      joiningDate: new Date(Date.now() - 86400000 * 45),
      permissions: ['payments.manage', 'subscriptions.manage'],
      avatar: '',
    },
  ];

  const generateMockAuditLogs = () => [
    {
      id: '1',
      action: 'User Created',
      performer: 'John Smith',
      target: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Created new staff member with Manager role',
      ip: '192.168.1.100',
      category: 'staff_management',
    },
    {
      id: '2',
      action: 'Role Updated',
      performer: 'John Smith',
      target: 'Mike Chen',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Changed role from Support to Senior Support',
      ip: '192.168.1.100',
      category: 'staff_management',
    },
    {
      id: '3',
      action: 'Permissions Modified',
      performer: 'Sarah Johnson',
      target: 'Emily Davis',
      timestamp: new Date(Date.now() - 10800000),
      details: 'Added financial reports permission',
      ip: '192.168.1.105',
      category: 'permissions',
    },
  ];

  const handleSubmit = async () => {
    try {
      if (editingStaff) {
        // Update existing staff
        await api.put(`/admin/staff/${editingStaff.id}`, formData);
        setSnackbar({ open: true, message: 'Staff member updated successfully', severity: 'success' });
      } else {
        // Create new staff
        await api.post('/admin/staff', formData);
        setSnackbar({ open: true, message: 'Staff member created successfully', severity: 'success' });
      }
      
      setDialogOpen(false);
      resetForm();
      loadStaff();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving staff member', severity: 'error' });
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      department: staffMember.department,
      isActive: staffMember.isActive,
      permissions: staffMember.permissions,
      notes: staffMember.notes || '',
      emergencyContact: staffMember.emergencyContact || '',
      address: staffMember.address || '',
      joiningDate: staffMember.joiningDate ? new Date(staffMember.joiningDate).toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await api.delete(`/admin/staff/${staffId}`);
        setSnackbar({ open: true, message: 'Staff member deleted successfully', severity: 'success' });
        loadStaff();
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting staff member', severity: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'support',
      department: '',
      isActive: true,
      permissions: [],
      notes: '',
      emergencyContact: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
    });
    setEditingStaff(null);
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles[2];
  };

  const getPermissionsByRole = (roleValue) => {
    const role = getRoleInfo(roleValue);
    if (role.permissions.includes('all')) {
      return allPermissions.map(p => p.id);
    }
    return role.permissions;
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Just now';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || member.role === filterRole;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && member.isActive) ||
                         (filterStatus === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Staff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage admin staff, roles, permissions, and audit logs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Add Staff Member
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon />
                  Staff Members
                  <Chip label={staff.length} size="small" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  Audit Logs
                  <Chip label={auditLogs.length} size="small" />
                </Box>
              } 
            />
          </Tabs>

          {activeTab === 0 && (
            <>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Search Staff"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={filterRole}
                      label="Role"
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      {roles.map(role => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Staff Table */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Staff Member</TableCell>
                      <TableCell>Role & Department</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStaff
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((member) => {
                        const roleInfo = getRoleInfo(member.role);
                        return (
                          <TableRow key={member.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: roleInfo.color }}>
                                  {member.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="medium">
                                    {member.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {member.email}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {member.phone}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {roleInfo.icon}
                                <Chip
                                  label={roleInfo.label}
                                  size="small"
                                  sx={{ bgcolor: roleInfo.color, color: 'white' }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {member.department}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {member.permissions.includes('all') ? (
                                  <Chip label="All Permissions" size="small" color="warning" />
                                ) : (
                                  member.permissions.slice(0, 2).map(permission => (
                                    <Chip
                                      key={permission}
                                      label={allPermissions.find(p => p.id === permission)?.name || permission}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))
                                )}
                                {member.permissions.length > 2 && !member.permissions.includes('all') && (
                                  <Chip label={`+${member.permissions.length - 2}`} size="small" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatLastLogin(member.lastLogin)}
                              </Typography>
                              {member.lastLogin && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(member.lastLogin).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={member.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={member.isActive ? 'success' : 'default'}
                                icon={member.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  setMenuAnchor(e.currentTarget);
                                  setSelectedStaffId(member.id);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredStaff.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Audit Logs
              </Typography>
              <List>
                {auditLogs.map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <HistoryIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {log.action}
                          </Typography>
                          <Chip label={log.category} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {log.performer} → {log.target}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {log.details}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleString()} • IP: {log.ip}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            const member = staff.find(s => s.id === selectedStaffId);
            if (member) handleEdit(member);
            setMenuAnchor(null);
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedStaffId) handleDelete(selectedStaffId);
            setMenuAnchor(null);
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      permissions: getPermissionsByRole(newRole)
                    });
                  }}
                >
                  {roles.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {role.icon}
                        {role.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  label="Department"
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Joining Date"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="Additional notes about this staff member..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Staff Member"
              />
            </Grid>

            {/* Permissions Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.permissions.includes('all') ? (
                  <Chip
                    label="All Permissions"
                    color="warning"
                    icon={<SecurityIcon />}
                  />
                ) : (
                  formData.permissions.map(permission => {
                    const permissionInfo = allPermissions.find(p => p.id === permission);
                    return (
                      <Chip
                        key={permission}
                        label={permissionInfo?.name || permission}
                        variant="outlined"
                        size="small"
                      />
                    );
                  })
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffManagement; 