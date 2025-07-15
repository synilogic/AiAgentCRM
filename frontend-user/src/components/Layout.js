import React, { useState, useEffect } from 'react';
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
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  WhatsApp as WhatsAppIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  QrCode2 as QrCodeIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  Link as LinkIcon,
  Star as StarIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navigationLoading, setNavigationLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Icon mapping for navigation items
  const getMenuIcon = (iconName) => {
    const iconMap = {
      'Dashboard': <DashboardIcon />,
      'People': <PeopleIcon />,
      'WhatsApp': <WhatsAppIcon />,
      'QrCode': <QrCodeIcon />,
      'Schedule': <ScheduleIcon />,
      'Psychology': <PsychologyIcon />,
      'Link': <LinkIcon />,
      'Analytics': <AnalyticsIcon />,
      'Payment': <PaymentIcon />,
      'Star': <StarIcon />,
      'Help': <HelpIcon />,
      'Settings': <SettingsIcon />,
    };
    return iconMap[iconName] || <DashboardIcon />;
  };

  // Fetch navigation items from API
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await apiService.getNavigation();
        if (response.success) {
          setMenuItems(response.navigation.filter(item => item.enabled));
        } else {
          // Fallback to default navigation if API fails
          setMenuItems([
            { text: 'Dashboard', icon: 'Dashboard', path: '/dashboard', enabled: true },
            { text: 'Leads', icon: 'People', path: '/leads', enabled: true },
            { text: 'WhatsApp', icon: 'WhatsApp', path: '/whatsapp', enabled: true },
            { text: 'Auto Follow-up', icon: 'Schedule', path: '/auto-followup', enabled: true },
            { text: 'AI Knowledge', icon: 'Psychology', path: '/ai-knowledge', enabled: true },
            { text: 'Integrations', icon: 'Link', path: '/integrations', enabled: true },
            { text: 'Analytics', icon: 'Analytics', path: '/analytics', enabled: true },
            { text: 'Subscription', icon: 'Payment', path: '/subscription', enabled: true },
            { text: 'Pricing', icon: 'Star', path: '/pricing', enabled: true },
            { text: 'Help & Support', icon: 'Help', path: '/help-support', enabled: true },
            { text: 'Settings', icon: 'Settings', path: '/settings', enabled: true },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error);
        // Fallback to default navigation
        setMenuItems([
          { text: 'Dashboard', icon: 'Dashboard', path: '/dashboard', enabled: true },
          { text: 'Leads', icon: 'People', path: '/leads', enabled: true },
          { text: 'WhatsApp', icon: 'WhatsApp', path: '/whatsapp', enabled: true },
          { text: 'Auto Follow-up', icon: 'Schedule', path: '/auto-followup', enabled: true },
          { text: 'AI Knowledge', icon: 'Psychology', path: '/ai-knowledge', enabled: true },
          { text: 'Integrations', icon: 'Link', path: '/integrations', enabled: true },
          { text: 'Analytics', icon: 'Analytics', path: '/analytics', enabled: true },
          { text: 'Subscription', icon: 'Payment', path: '/subscription', enabled: true },
          { text: 'Pricing', icon: 'Star', path: '/pricing', enabled: true },
          { text: 'Help & Support', icon: 'Help', path: '/help-support', enabled: true },
          { text: 'Settings', icon: 'Settings', path: '/settings', enabled: true },
        ]);
      } finally {
        setNavigationLoading(false);
      }
    };

    if (user) {
      fetchNavigation();
    }
  }, [user]);

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
          <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            Ai Agentic CRM
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Powered by AI
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {navigationLoading ? (
            // Loading skeletons
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ListItem key={i} disablePadding>
                <Box sx={{ width: '100%', px: 1, mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={120} height={20} />
                  </Box>
                </Box>
              </ListItem>
            ))
          ) : (
            menuItems.map((item) => (
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
                    {getMenuIcon(item.icon)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
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
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
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
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
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