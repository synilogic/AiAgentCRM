import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@aiagentcrm.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                mx: 'auto',
                mb: 2,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                width: 64,
                height: 64,
              }}
            >
              <AdminPanelSettings fontSize="large" />
            </Avatar>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Admin Login
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Access the Ai Agentic CRM admin panel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                Email *
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& input': { color: 'white' },
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                Password *
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& input': { color: 'white' },
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Secure admin access only
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 