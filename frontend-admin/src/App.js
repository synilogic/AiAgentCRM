import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';

// Pages - Load with error boundaries
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Plans from './pages/Plans';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PaymentGateway from './pages/PaymentGateway';
import EmailSettings from './pages/EmailSettings';
import EmailTemplates from './pages/EmailTemplates';

// New SAAS Admin Pages
import StaffManagement from './pages/StaffManagement';
import Support from './pages/Support';
import AddonSystem from './pages/AddonSystem';

// Enhanced Components
import AdvancedAnalytics from './components/AdvancedAnalytics';
import UserCommunication from './components/UserCommunication';
import LeadManagement from './components/LeadManagement';
import WorkflowAutomation from './components/WorkflowAutomation';
import SystemMonitoring from './components/SystemMonitoring';
import SecurityCenter from './components/SecurityCenter';
import ApiManagement from './components/ApiManagement';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Create admin theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e40af',
      light: '#3b82f6',
      dark: '#1e3a8a',
    },
    secondary: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            p: 3
          }}
        >
          <h1>Something went wrong in Admin Panel</h1>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? <Navigate to="/admin/dashboard" replace /> : children;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/payment-gateway" element={<PaymentGateway />} />
                  <Route path="/email-settings" element={<EmailSettings />} />
                  <Route path="/email-templates" element={<EmailTemplates />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Enhanced Admin Features */}
                  <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                  <Route path="/user-communication" element={<UserCommunication />} />
                  <Route path="/lead-management" element={<LeadManagement />} />
                  <Route path="/workflow-automation" element={<WorkflowAutomation />} />
                  <Route path="/system-monitoring" element={<SystemMonitoring />} />
                  <Route path="/security-center" element={<SecurityCenter />} />
                  <Route path="/api-management" element={<ApiManagement />} />
                  
                  {/* New SAAS Admin Pages */}
                  <Route path="/staff-management" element={<StaffManagement />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/addon-system" element={<AddonSystem />} />

                  {/* Legacy route redirects */}
                  <Route path="/user-management" element={<Navigate to="/admin/users" replace />} />
                  <Route path="/pricing-plans" element={<Navigate to="/admin/plans" replace />} />
                  <Route path="/system-settings" element={<Navigate to="/admin/settings" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } 
        />
        
        {/* Catch all redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 