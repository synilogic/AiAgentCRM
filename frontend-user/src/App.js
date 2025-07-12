import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import NotificationProvider from './components/NotificationSystem';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Analytics from './pages/Analytics';
import WhatsApp from './pages/WhatsApp';
import WhatsAppQRScan from './pages/WhatsAppQRScan';
import WhatsAppConnect from './pages/WhatsAppConnect';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Pricing from './pages/Pricing';
import AutoFollowup from './pages/AutoFollowup';
import AIKnowledgeBase from './pages/AIKnowledgeBase';
import Integrations from './pages/Integrations';
import HelpSupport from './pages/HelpSupport';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import PrivateRoute from './components/PrivateRoute';

// Enhanced theme matching admin panel
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
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
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Create QueryClient with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 User App Error Boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Report error to monitoring service
    if (window.reportError) {
      window.reportError(error, 'ErrorBoundary');
    }
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
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
            <h1 style={{ color: '#ef4444', marginBottom: 16 }}>Oops! Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <details style={{ marginBottom: 24, textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                Error Details
              </summary>
              <pre style={{ 
                fontSize: '0.875rem', 
                backgroundColor: '#f1f5f9', 
                padding: 16, 
                borderRadius: 8,
                overflow: 'auto'
              }}>
                {this.state.error?.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Reload Page
            </button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// App Content Component
function AppContent() {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/leads" 
            element={
              <PrivateRoute>
                <Layout>
                  <Leads />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <PrivateRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/whatsapp" 
            element={
              <PrivateRoute>
                <Layout>
                  <WhatsApp />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/whatsapp/qr-scan" 
            element={
              <PrivateRoute>
                <Layout>
                  <WhatsAppQRScan />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/whatsapp/connect" 
            element={
              <PrivateRoute>
                <Layout>
                  <WhatsAppConnect />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/auto-followup" 
            element={
              <PrivateRoute>
                <Layout>
                  <AutoFollowup />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/ai-knowledge" 
            element={
              <PrivateRoute>
                <Layout>
                  <AIKnowledgeBase />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/integrations" 
            element={
              <PrivateRoute>
                <Layout>
                  <Integrations />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/subscription" 
            element={
              <PrivateRoute>
                <Layout>
                  <Subscription />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pricing" 
            element={
              <PrivateRoute>
                <Layout>
                  <Pricing />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/help-support" 
            element={
              <PrivateRoute>
                <Layout>
                  <HelpSupport />
                </Layout>
              </PrivateRoute>
            } 
          />
          
          {/* Default redirects */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="*" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </Box>
    </Router>
  );
}

// Main App Component
function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // App initialization
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🚀 AI Agent CRM User App initialized');
        setIsAppReady(true);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setIsAppReady(true); // Still show app even if init fails
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <NotificationProvider>
              <WebSocketProvider>
                <AppContent />
              </WebSocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 