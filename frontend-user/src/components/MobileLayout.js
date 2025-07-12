import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SwipeableDrawer,
  Collapse,
  Divider,
  Stack,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
  Slide,
  Zoom,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  CloudSync as SyncIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

// Styled components
const MobileAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MobileDrawer = styled(SwipeableDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    backgroundColor: theme.palette.background.default,
  },
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(10),
  right: theme.spacing(2),
  zIndex: theme.zIndex.speedDial,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const SwipeableCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:active': {
    transform: 'scale(0.98)',
    boxShadow: theme.shadows[8],
  },
}));

const PullToRefresh = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  borderRadius: theme.spacing(2),
  margin: theme.spacing(1),
}));

const TouchRipple = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    backgroundColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.6s, height 0.6s',
  },
  '&:active::after': {
    width: '100%',
    height: '100%',
  },
}));

const MobileLayout = ({ children, title, onRefresh, showBottomNav = true, showFab = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Navigation items
  const navigationItems = [
    { 
      label: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      children: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/reports' }
      ]
    },
    { 
      label: 'Leads', 
      icon: <PeopleIcon />, 
      path: '/leads',
      children: [
        { label: 'All Leads', path: '/leads' },
        { label: 'Add Lead', path: '/leads/add' },
        { label: 'Import', path: '/leads/import' }
      ]
    },
    { 
      label: 'Messages', 
      icon: <ChatIcon />, 
      path: '/chat',
      badge: 3
    },
    { 
      label: 'Tasks', 
      icon: <TaskIcon />, 
      path: '/tasks',
      badge: 5
    },
    { 
      label: 'WhatsApp', 
      icon: <WhatsAppIcon />, 
      path: '/whatsapp'
    },
    { 
      label: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/analytics'
    },
    { 
      label: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings'
    }
  ];

  const bottomNavItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/dashboard' },
    { label: 'Leads', icon: <PeopleIcon />, path: '/leads' },
    { label: 'Chat', icon: <ChatIcon />, path: '/chat' },
    { label: 'Tasks', icon: <TaskIcon />, path: '/tasks' },
    { label: 'More', icon: <MoreIcon />, action: () => setDrawerOpen(true) }
  ];

  const quickActions = [
    { icon: <PersonIcon />, name: 'Add Lead', onClick: () => navigate('/leads/add') },
    { icon: <ChatIcon />, name: 'New Message', onClick: () => navigate('/chat/new') },
    { icon: <TaskIcon />, name: 'Create Task', onClick: () => navigate('/tasks/add') },
    { icon: <PhoneIcon />, name: 'Make Call', onClick: () => setSnackbar({ open: true, message: 'Call feature coming soon!', severity: 'info' }) }
  ];

  // Effects
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbar({ open: true, message: 'Back online!', severity: 'success' });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSnackbar({ open: true, message: 'You are offline', severity: 'warning' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Update bottom navigation based on current path
    const currentIndex = bottomNavItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setBottomNavValue(currentIndex);
    }
  }, [location.pathname]);

  // Swipe handlers for navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (drawerOpen) setDrawerOpen(false);
    },
    onSwipedRight: () => {
      if (!drawerOpen && !fullscreen) setDrawerOpen(true);
    },
    onSwipedDown: () => {
      if (onRefresh && !isRefreshing) {
        handlePullToRefresh();
      }
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setSnackbar({ open: true, message: 'Content refreshed!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to refresh', severity: 'error' });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Navigation handlers
  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
      setDrawerOpen(false);
    }
  };

  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    const item = bottomNavItems[newValue];
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  const toggleExpandedMenu = (index) => {
    setExpandedMenu(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Touch feedback for better mobile UX
  const addTouchFeedback = (element) => {
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 100);
  };

  if (!isMobile) {
    return children; // Return original layout for desktop
  }

  return (
    <Box {...swipeHandlers} sx={{ pb: showBottomNav ? 7 : 0 }}>
      {/* Mobile App Bar */}
      <MobileAppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
            {title || 'AI Agent CRM'}
          </Typography>

          {/* Connection Status */}
          <IconButton size="small" sx={{ mr: 1 }}>
            {isOnline ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
          </IconButton>

          {/* Sync Status */}
          {isRefreshing && (
            <IconButton size="small" sx={{ mr: 1 }}>
              <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} />
            </IconButton>
          )}

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={() => setNotificationOpen(true)}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* More Options */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={toggleFullscreen}
          >
            {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Toolbar>
      </MobileAppBar>

      {/* Pull to Refresh Indicator */}
      <Slide direction="down" in={isRefreshing} mountOnEnter unmountOnExit>
        <PullToRefresh>
          <SyncIcon sx={{ animation: 'spin 1s linear infinite', mr: 1 }} />
          <Typography variant="body2">Refreshing...</Typography>
        </PullToRefresh>
      </Slide>

      {/* Mobile Drawer */}
      <MobileDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen={false}
      >
        {/* User Profile Section */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={user?.avatar}
              sx={{ width: 56, height: 56 }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {user?.name || 'User'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <List sx={{ flexGrow: 1 }}>
          {navigationItems.map((item, index) => (
            <Box key={index}>
              <ListItemButton
                onClick={() => {
                  if (item.children) {
                    toggleExpandedMenu(index);
                  } else {
                    handleNavigation(item.path);
                  }
                }}
                sx={{
                  bgcolor: location.pathname === item.path ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                }}
              >
                <ListItemIcon>
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.children && (
                  expandedMenu[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />
                )}
              </ListItemButton>
              
              {item.children && (
                <Collapse in={expandedMenu[index]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child, childIndex) => (
                      <ListItemButton
                        key={childIndex}
                        sx={{ pl: 4 }}
                        onClick={() => handleNavigation(child.path)}
                      >
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>

        <Divider />
        
        {/* Quick Settings */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" startIcon={<RefreshIcon />} onClick={handlePullToRefresh}>
              Refresh
            </Button>
            <Button size="small" startIcon={<SettingsIcon />} onClick={() => navigate('/settings')}>
              Settings
            </Button>
          </Stack>
        </Box>
      </MobileDrawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          pt: theme.spacing(8), // Account for app bar
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>

      {/* Floating Action Button */}
      {showFab && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          icon={<SpeedDialIcon />}
          direction="up"
        >
          {quickActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <MobileBottomNav
          value={bottomNavValue}
          onChange={handleBottomNavChange}
          showLabels
        >
          {bottomNavItems.map((item, index) => (
            <BottomNavigationAction
              key={index}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </MobileBottomNav>
      )}

      {/* Notification Center */}
      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

// Higher-order component for mobile optimization
export const withMobileOptimization = (WrappedComponent) => {
  return function MobileOptimizedComponent(props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!isMobile) {
      return <WrappedComponent {...props} />;
    }

    return (
      <MobileLayout {...props}>
        <WrappedComponent {...props} />
      </MobileLayout>
    );
  };
};

// Hook for mobile-specific functionality
export const useMobileFeatures = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [orientation, setOrientation] = useState(window.screen?.orientation?.type || 'portrait-primary');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleOrientationChange = () => {
      setOrientation(window.screen?.orientation?.type || 'portrait-primary');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const vibrate = (pattern = 100) => {
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(pattern);
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && isMobile) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        return wakeLock;
      } catch (err) {
        console.error('Wake lock failed:', err);
      }
    }
  };

  const shareContent = async (data) => {
    if (navigator.share && isMobile) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        console.error('Share failed:', err);
        return false;
      }
    }
    return false;
  };

  return {
    isMobile,
    isOnline,
    orientation,
    vibrate,
    requestWakeLock,
    shareContent,
    isPortrait: orientation.includes('portrait'),
    isLandscape: orientation.includes('landscape')
  };
};

export default MobileLayout; 