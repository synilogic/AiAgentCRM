import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Fade,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  WhatsApp as WhatsAppIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/config/features`);
        const data = await response.json();
        
        if (data.success) {
          setFeatures(data.features.filter(feature => feature.enabled));
        } else {
          // Fallback to default features if API fails
          setFeatures([
            { icon: 'WhatsApp', text: 'WhatsApp Integration', color: '#25D366' },
            { icon: 'AutoAwesome', text: 'AI-Powered Responses', color: '#6366f1' },
            { icon: 'TrendingUp', text: 'Advanced Analytics', color: '#10b981' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch features:', error);
        // Fallback to default features
        setFeatures([
          { icon: 'WhatsApp', text: 'WhatsApp Integration', color: '#25D366' },
          { icon: 'AutoAwesome', text: 'AI-Powered Responses', color: '#6366f1' },
          { icon: 'TrendingUp', text: 'Advanced Analytics', color: '#10b981' },
        ]);
      } finally {
        setFeaturesLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (iconName) => {
    const iconMap = {
      'WhatsApp': <WhatsAppIcon />,
      'AutoAwesome': <AutoAwesomeIcon />,
      'TrendingUp': <TrendingUpIcon />,
      'Psychology': <PsychologyIcon />,
      'Timeline': <TimelineIcon />,
      'Notifications': <NotificationsIcon />,
    };
    return iconMap[iconName] || <AutoAwesomeIcon />;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1200,
          minHeight: 600,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Left Side - Features */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'primary.main',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 6,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                AI Agent CRM
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  mb: 6,
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Transform your business with AI-powered WhatsApp CRM
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {featuresLoading ? (
                  // Loading skeletons
                  [1, 2, 3].map((i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton variant="text" width={200} height={24} />
                    </Box>
                  ))
                ) : (
                  features.map((feature, index) => (
                    <Fade in timeout={1000 + index * 200} key={feature.text}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Box
                          sx={{
                            color: feature.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {getFeatureIcon(feature.icon)}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {feature.text}
                          </Typography>
                          {feature.description && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {feature.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Fade>
                  ))
                )}
              </Box>
            </Box>
          </Fade>
        </Box>

        {/* Right Side - Login Form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Fade in timeout={800}>
              <Box>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary',
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    Sign in to your AI Agent CRM account
                  </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Box>

                {/* Links */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot your password?
                  </Link>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Chip label="OR" size="small" />
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Don't have an account?
                  </Typography>
                  <Link
                    component={RouterLink}
                    to="/register"
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Create an account
                  </Link>
                </Box>
              </Box>
            </Fade>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 