import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  CssBaseline,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  AdminPanelSettings as AdminIcon,
  Subscriptions as SubscriptionsIcon,
  Web as WebIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  AutoMode as AutoModeIcon,
  Memory as MemoryIcon,
  VpnKey as VpnKeyIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/admin/dashboard',
    category: 'main'
  },
  
  // Analytics & Reports Section
  { 
    text: 'Analytics', 
    icon: <AnalyticsIcon />, 
    path: '/admin/analytics',
    category: 'analytics'
  },
  { 
    text: 'Advanced Analytics', 
    icon: <AssessmentIcon />, 
    path: '/admin/advanced-analytics',
    category: 'analytics'
  },
  
  // User & Lead Management Section
  { 
    text: 'User Management', 
    icon: <PeopleIcon />, 
    path: '/admin/users',
    category: 'management'
  },
  { 
    text: 'Lead Management', 
    icon: <AssignmentIcon />, 
    path: '/admin/lead-management',
    category: 'management'
  },
  { 
    text: 'User Communication', 
    icon: <ChatIcon />, 
    path: '/admin/user-communication',
    category: 'management'
  },
  
  // Automation & Workflows
  { 
    text: 'Workflow Automation', 
    icon: <AutoModeIcon />, 
    path: '/admin/workflow-automation',
    category: 'automation'
  },
  
  // System & Security Section
  { 
    text: 'System Monitoring', 
    icon: <MemoryIcon />, 
    path: '/admin/system-monitoring',
    category: 'system'
  },
  { 
    text: 'Security Center', 
    icon: <SecurityIcon />, 
    path: '/admin/security-center',
    category: 'system'
  },
  { 
    text: 'API Management', 
    icon: <VpnKeyIcon />, 
    path: '/admin/api-management',
    category: 'system'
  },
  
  // Business Configuration
  { 
    text: 'Plans & Pricing', 
    icon: <BusinessIcon />, 
    path: '/admin/plans',
    category: 'business'
  },
  { 
    text: 'Payment Gateway', 
    icon: <PaymentIcon />, 
    path: '/admin/payment-gateway',
    category: 'business'
  },
  
  // Communication Settings
  { 
    text: 'Email Settings', 
    icon: <EmailIcon />, 
    path: '/admin/email-settings',
    category: 'communication'
  },
  { 
    text: 'Email Templates', 
    icon: <EmailIcon />, 
    path: '/admin/email-templates',
    category: 'communication'
  },
  
  // System Settings
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/admin/settings',
    category: 'settings'
  },
];

// Group menu items by category
const menuCategories = {
  main: { title: 'Dashboard', items: [] },
  analytics: { title: 'Analytics & Reports', items: [] },
  management: { title: 'User & Lead Management', items: [] },
  automation: { title: 'Automation', items: [] },
  system: { title: 'System & Security', items: [] },
  business: { title: 'Business', items: [] },
  communication: { title: 'Communication', items: [] },
  settings: { title: 'Settings', items: [] },
};

// Populate categories
menuItems.forEach(item => {
  if (menuCategories[item.category]) {
    menuCategories[item.category].items.push(item);
  }
});

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    main: true,
    analytics: true,
    management: true,
    automation: true,
    system: true,
    business: true,
    communication: false,
    settings: false,
  });
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AdminIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            AI Agent CRM
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {Object.entries(menuCategories).map(([categoryKey, category]) => {
            if (category.items.length === 0) return null;
            
            return (
              <Box key={categoryKey}>
                {/* Category Header */}
                {categoryKey !== 'main' && (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleCategoryToggle(categoryKey)}
                      sx={{
                        mx: 1,
                        borderRadius: 2,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={category.title}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      />
                      {expandedCategories[categoryKey] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                )}
                
                {/* Category Items */}
                <Collapse in={expandedCategories[categoryKey]} timeout="auto" unmountOnExit>
                  {category.items.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) setMobileOpen(false);
                        }}
                        selected={location.pathname === item.path}
                        sx={{
                          mx: 1,
                          borderRadius: 2,
                          mb: 0.5,
                          pl: categoryKey === 'main' ? 2 : 3,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: location.pathname === item.path ? 'white' : 'text.secondary',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 600 : 500,
                            fontSize: '0.875rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </Collapse>
                
                {/* Divider between categories */}
                {categoryKey !== 'settings' && category.items.length > 0 && (
                  <Divider sx={{ mx: 2, my: 1 }} />
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontSize: '1rem',
            }}
          >
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || 'Admin User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email || 'admin@example.com'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" sx={{ color: 'text.primary' }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => {
          navigate('/admin/settings');
          handleProfileMenuClose();
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout; 