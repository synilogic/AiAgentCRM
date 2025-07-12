import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const PrivateRoute = ({ children, requiredPermission = null }) => {
  const { user, loading, initialized } = useAuth();
  
  // Show loading screen while auth is being initialized
  if (!initialized || loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check permissions if required
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render the protected component
  return children;
};

export default PrivateRoute; 