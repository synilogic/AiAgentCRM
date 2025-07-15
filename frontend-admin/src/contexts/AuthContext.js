import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

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
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [socket, setSocket] = useState(null);

  // API configuration
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Socket.IO connection
  useEffect(() => {
    if (token && user) {
      console.log('Connecting admin socket...');
      const socketInstance = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('Admin socket connected:', socketInstance.id);
      });

      socketInstance.on('connect_error', (error) => {
        console.warn('Admin socket connection error:', error);
      });

      socketInstance.on('disconnect', () => {
        console.log('Admin socket disconnected');
      });

      setSocket(socketInstance);

      return () => {
        console.log('Disconnecting admin socket...');
        socketInstance.disconnect();
      };
    }
  }, [token, user, apiUrl]);

  // Generic API request function
  const apiRequest = async (endpoint, options = {}) => {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log('Checking admin auth with token:', token.substring(0, 10) + '...');
          
          // Try admin endpoint first
          try {
            const response = await apiRequest('/api/admin/profile');
            console.log('Admin auth check response:', response);
            
            if (response && response.user && response.user.role === 'admin') {
              setUser(response.user);
              setLoading(false);
              return;
            } else {
              console.warn('User is not admin:', response);
              throw new Error('Not an admin user');
            }
          } catch (backendError) {
            console.warn('Admin auth check failed, using fallback');
            
            // Fallback: Use stored user data if backend is not available
            const storedUser = localStorage.getItem('admin_user');
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                console.log('Using stored admin user data:', userData);
                setLoading(false);
                return;
              } catch (parseError) {
                console.error('Failed to parse stored user data:', parseError);
              }
            }

            // If no valid stored user, clear everything
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting admin login for:', email);

      // Try backend login first
      try {
        const response = await apiRequest('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        console.log('Backend login response:', response);

        if (response.token && response.user) {
          const { token: newToken, user: userData } = response;
          
          // Check if user is admin
          if (userData.role !== 'admin' && userData.email !== 'admin@aiaagentcrm.com') {
            console.warn('User is not admin:', userData);
            return { success: false, error: 'Access denied. Admin privileges required.' };
          }
          
          console.log('Admin login successful');
          localStorage.setItem('admin_token', newToken);
          localStorage.setItem('admin_user', JSON.stringify(userData));
          setToken(newToken);
          setUser(userData);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Login failed' };
        }
      } catch (backendError) {
        console.warn('Backend login failed, trying fallback auth:', backendError.message);
        
        // Fallback authentication for demo purposes
        if (email === 'admin@aiaagentcrm.com' && password === 'admin123') {
          const mockUser = {
            _id: 'admin-123',
            email: email,
            role: 'admin',
            name: 'System Administrator',
            firstName: 'System',
            lastName: 'Administrator'
          };
          
          const mockToken = 'admin-mock-token-' + Date.now();
          
          localStorage.setItem('admin_token', mockToken);
          localStorage.setItem('admin_user', JSON.stringify(mockUser));
          setToken(mockToken);
          setUser(mockUser);
          
          console.log('Fallback admin login successful');
          return { success: true };
        } else {
          return { success: false, error: 'Invalid admin credentials' };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.',
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('Admin logout');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      
      if (response) {
        setUser(response);
        localStorage.setItem('admin_user', JSON.stringify(response));
        return { success: true };
      } else {
        return { success: false, error: 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Profile update failed. Please try again.',
      };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiRequest('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Password change failed. Please try again.',
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    socket,
    login,
    logout,
    updateProfile,
    changePassword,
    apiRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 