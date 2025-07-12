import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastActivity, setLastActivity] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [eventListeners, setEventListeners] = useState(new Map());

  useEffect(() => {
    if (isAuthenticated && user && apiService.socket) {
      handleSocketConnection();
    } else if (!isAuthenticated && apiService.socket) {
      handleSocketDisconnection();
    }

    return () => {
      if (apiService.socket) {
        handleSocketDisconnection();
      }
    };
  }, [isAuthenticated, user]);

  const handleSocketConnection = () => {
    if (!apiService.socket) return;

    const socket = apiService.socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔗 WebSocket connected:', socket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastActivity(new Date());
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setLastActivity(new Date());
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error);
      setConnectionStatus('error');
      setReconnectAttempts(prev => prev + 1);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('reconnected');
      setReconnectAttempts(0);
      setLastActivity(new Date());
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 WebSocket reconnect attempt:', attemptNumber);
      setConnectionStatus('reconnecting');
      setReconnectAttempts(attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.warn('❌ WebSocket reconnect error:', error);
      setConnectionStatus('reconnect_error');
    });

    socket.on('reconnect_failed', () => {
      console.error('💥 WebSocket reconnect failed');
      setConnectionStatus('reconnect_failed');
    });

    // Generic activity tracker
    const originalOn = socket.on.bind(socket);
    socket.on = (event, callback) => {
      return originalOn(event, (...args) => {
        setLastActivity(new Date());
        callback(...args);
      });
    };

    // Set initial connection status
    if (socket.connected) {
      setIsConnected(true);
      setConnectionStatus('connected');
    }
  };

  const handleSocketDisconnection = () => {
    if (apiService.socket) {
      apiService.disconnectSocket();
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setEventListeners(new Map());
  };

  const addEventListener = (event, callback, identifier = null) => {
    if (!apiService.socket) {
      console.warn('Cannot add event listener: Socket not connected');
      return null;
    }

    const listenerKey = identifier || `${event}_${Date.now()}_${Math.random()}`;
    
    // Add to our tracking
    setEventListeners(prev => {
      const newListeners = new Map(prev);
      if (!newListeners.has(event)) {
        newListeners.set(event, []);
      }
      newListeners.get(event).push({ callback, identifier: listenerKey });
      return newListeners;
    });

    // Add to apiService
    apiService.addEventListener(event, callback);

    return listenerKey;
  };

  const removeEventListener = (event, identifier) => {
    if (!apiService.socket) return;

    setEventListeners(prev => {
      const newListeners = new Map(prev);
      if (newListeners.has(event)) {
        const listeners = newListeners.get(event).filter(
          listener => listener.identifier !== identifier
        );
        if (listeners.length === 0) {
          newListeners.delete(event);
        } else {
          newListeners.set(event, listeners);
        }
      }
      return newListeners;
    });

    // This is a simplified approach - in reality you'd need to track the actual callback
    // apiService.removeEventListener(event, callback);
  };

  const emit = (event, data) => {
    if (apiService.socket && isConnected) {
      apiService.socket.emit(event, data);
      setLastActivity(new Date());
      return true;
    }
    console.warn('Cannot emit event: Socket not connected');
    return false;
  };

  const forceReconnect = () => {
    if (apiService.socket) {
      apiService.socket.disconnect();
      setTimeout(() => {
        if (isAuthenticated && user) {
          const token = apiService.getToken();
          if (token) {
            apiService.initializeSocket(token);
          }
        }
      }, 1000);
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connectionStatus,
    lastActivity,
    reconnectAttempts,
    socketId: apiService.socket?.id || null,
    activeListeners: Array.from(eventListeners.keys()),
    listenerCount: Array.from(eventListeners.values()).reduce(
      (total, listeners) => total + listeners.length, 
      0
    )
  });

  const value = {
    // Connection state
    isConnected,
    connectionStatus,
    lastActivity,
    reconnectAttempts,

    // Socket operations
    addEventListener,
    removeEventListener,
    emit,
    forceReconnect,

    // Utilities
    getConnectionInfo,
    
    // Status helpers
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    hasError: connectionStatus === 'error' || connectionStatus === 'reconnect_error',
    isHealthy: isConnected && connectionStatus === 'connected',
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider; 