import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = apiService.getToken();
        if (token) {
          try {
            const response = await apiService.getCurrentUser();
            setUser(response.user || response);
            
            // Initialize socket connection after successful auth
            apiService.initializeSocket(token);
            
            console.log('🔓 User authenticated successfully');
          } catch (error) {
            console.warn('🔒 Authentication check failed:', error);
            
            // If auth fails, clear invalid token
            apiService.removeToken();
            apiService.disconnectSocket();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('🚨 Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Attempting login...');
      const response = await apiService.login(credentials);
      
      if (response.user) {
        setUser(response.user);
        console.log('✅ Login successful:', response.user.email);
        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Attempting registration...');
      const response = await apiService.register(userData);
      
      if (response.user) {
        setUser(response.user);
        console.log('✅ Registration successful:', response.user.email);
        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('🚪 Logging out...');
      
      await apiService.logout();
      setUser(null);
      setError(null);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.warn('⚠️ Logout request failed:', error);
      // Even if logout request fails, clear local state
      apiService.removeToken();
      apiService.disconnectSocket();
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      console.log('📧 Sending password reset email...');
      
      const response = await apiService.forgotPassword(email);
      console.log('✅ Password reset email sent');
      return response;
    } catch (error) {
      console.error('❌ Forgot password failed:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send password reset email.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setError(null);
      console.log('🔑 Resetting password...');
      
      const response = await apiService.resetPassword(token, password);
      console.log('✅ Password reset successful');
      return response;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to reset password.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
    console.log('👤 User data updated');
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.user || response);
      console.log('🔄 User data refreshed');
      return response.user || response;
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const checkAuthStatus = () => {
    const token = apiService.getToken();
    return !!token && !!user;
  };

  // Real-time event handlers
  useEffect(() => {
    if (user && apiService.socket) {
      // Listen for user-related real-time events
      const handleUserUpdate = (data) => {
        if (data.userId === user._id) {
          updateUser(data.updates);
        }
      };

      const handleAccountUpdate = (data) => {
        if (data.userId === user._id) {
          updateUser(data);
        }
      };

      apiService.addEventListener('user_updated', handleUserUpdate);
      apiService.addEventListener('account_updated', handleAccountUpdate);

      return () => {
        apiService.removeEventListener('user_updated', handleUserUpdate);
        apiService.removeEventListener('account_updated', handleAccountUpdate);
      };
    }
  }, [user]);

  const value = {
    // State
    user,
    loading,
    error,
    initialized,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    refreshUser,
    clearError,
    
    // Computed
    isAuthenticated: !!user,
    checkAuthStatus,
    
    // Utils
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    hasPermission: (permission) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return user.permissions?.includes(permission) || false;
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 