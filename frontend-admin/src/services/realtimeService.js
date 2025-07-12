import io from 'socket.io-client';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.listeners = new Map();
    this.adminStats = {
      totalUsers: 0,
      activeUsers: 0,
      totalLeads: 0,
      todayLeads: 0,
      conversionRate: 0,
      revenue: 0,
    };
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Admin Real-time service connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Request initial admin data
      this.socket.emit('admin:subscribe', { type: 'dashboard' });
    });

    this.socket.on('disconnect', () => {
      console.log('Admin Real-time service disconnected');
      this.isConnected = false;
      this.emit('disconnected');
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('error', error);
      this.handleReconnection();
    });

    // Admin-specific events
    this.socket.on('admin:stats', (data) => {
      this.adminStats = { ...this.adminStats, ...data };
      this.emit('stats:updated', this.adminStats);
    });

    this.socket.on('admin:user_activity', (data) => {
      this.emit('user:activity', data);
    });

    this.socket.on('admin:new_lead', (data) => {
      this.emit('lead:new', data);
      this.updateStats('totalLeads', this.adminStats.totalLeads + 1);
      this.updateStats('todayLeads', this.adminStats.todayLeads + 1);
    });

    this.socket.on('admin:lead_updated', (data) => {
      this.emit('lead:updated', data);
      if (data.statusChanged) {
        this.calculateConversionRate();
      }
    });

    this.socket.on('admin:user_registered', (data) => {
      this.emit('user:registered', data);
      this.updateStats('totalUsers', this.adminStats.totalUsers + 1);
    });

    this.socket.on('admin:payment_received', (data) => {
      this.emit('payment:received', data);
      this.updateStats('revenue', this.adminStats.revenue + data.amount);
    });

    this.socket.on('admin:system_alert', (data) => {
      this.emit('system:alert', data);
    });

    this.socket.on('admin:live_chat', (data) => {
      this.emit('chat:message', data);
    });

    // Database change events
    this.socket.on('database:change', (data) => {
      this.handleDatabaseChange(data);
    });

    // Real-time notifications for admin
    this.socket.on('admin:notification', (data) => {
      this.emit('notification:new', data);
    });
  }

  handleDatabaseChange(change) {
    const { collection, operationType, data } = change;
    
    switch (collection) {
      case 'users':
        if (operationType === 'insert') {
          this.emit('user:new', data);
        } else if (operationType === 'update') {
          this.emit('user:updated', data);
        }
        break;
        
      case 'leads':
        if (operationType === 'insert') {
          this.emit('lead:new', data);
        } else if (operationType === 'update') {
          this.emit('lead:updated', data);
        }
        break;
        
      case 'messages':
        if (operationType === 'insert') {
          this.emit('message:new', data);
        }
        break;
        
      case 'activities':
        if (operationType === 'insert') {
          this.emit('activity:new', data);
        }
        break;
        
      default:
        this.emit('database:change', change);
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected && this.socket) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnects_reached');
    }
  }

  updateStats(key, value) {
    this.adminStats[key] = value;
    this.emit('stats:updated', this.adminStats);
  }

  calculateConversionRate() {
    // Request updated conversion rate from server
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:request_conversion_rate');
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Admin-specific methods
  subscribeToCollection(collection, filters = {}) {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:subscribe_collection', { collection, filters });
    }
  }

  unsubscribeFromCollection(collection) {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:unsubscribe_collection', { collection });
    }
  }

  sendAdminMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:broadcast_message', message);
    }
  }

  requestLiveData(type, params = {}) {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:request_data', { type, params });
    }
  }

  // Dashboard specific methods
  requestDashboardData() {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:request_dashboard_data');
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  getCurrentStats() {
    return { ...this.adminStats };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Mock data for development/testing
  startMockData() {
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        // Simulate new leads
        if (Math.random() > 0.8) {
          this.emit('lead:new', {
            id: Date.now(),
            name: `Lead ${Math.floor(Math.random() * 1000)}`,
            email: `lead${Math.floor(Math.random() * 1000)}@example.com`,
            status: 'new',
            source: 'website',
            createdAt: new Date(),
          });
        }

        // Simulate user activity
        if (Math.random() > 0.7) {
          this.emit('user:activity', {
            userId: `user_${Math.floor(Math.random() * 100)}`,
            action: ['login', 'create_lead', 'send_message', 'update_profile'][Math.floor(Math.random() * 4)],
            timestamp: new Date(),
          });
        }

        // Update active users count
        this.updateStats('activeUsers', Math.floor(Math.random() * 50) + 10);

      }, 5000); // Every 5 seconds
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService; 