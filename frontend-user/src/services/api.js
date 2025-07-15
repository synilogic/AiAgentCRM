import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class UserApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.socket = null;
    this.eventListeners = new Map();
  }

  // ==================== SOCKET.IO REAL-TIME CONNECTIVITY ====================

  initializeSocket(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.baseURL.replace('/api', ''), {
      auth: { token, role: 'user' },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔗 User socket connected:', this.socket.id);
      this.socket.emit('join_user_room');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ User socket connection error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 User socket disconnected');
    });

    // Real-time event handlers
    this.setupRealTimeEvents();

    return this.socket;
  }

  setupRealTimeEvents() {
    if (!this.socket) return;

    // Lead events
    this.socket.on('lead_created', (data) => {
      this.notifyListeners('lead_created', data);
    });

    this.socket.on('lead_updated', (data) => {
      this.notifyListeners('lead_updated', data);
    });

    this.socket.on('lead_score_updated', (data) => {
      this.notifyListeners('lead_score_updated', data);
    });

    // Message events
    this.socket.on('message_received', (data) => {
      this.notifyListeners('message_received', data);
    });

    this.socket.on('message_sent', (data) => {
      this.notifyListeners('message_sent', data);
    });

    // WhatsApp events
    this.socket.on('whatsapp_qr', (data) => {
      this.notifyListeners('whatsapp_qr', data);
    });

    this.socket.on('whatsapp_ready', (data) => {
      this.notifyListeners('whatsapp_ready', data);
    });

    this.socket.on('whatsapp_disconnected', (data) => {
      this.notifyListeners('whatsapp_disconnected', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.notifyListeners('notification', data);
    });

    // Task events
    this.socket.on('task_created', (data) => {
      this.notifyListeners('task_created', data);
    });

    this.socket.on('task_updated', (data) => {
      this.notifyListeners('task_updated', data);
    });

    // Follow-up events
    this.socket.on('followup_triggered', (data) => {
      this.notifyListeners('followup_triggered', data);
    });

    // Analytics events
    this.socket.on('analytics_update', (data) => {
      this.notifyListeners('analytics_update', data);
    });
  }

  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  // ==================== GENERIC REQUEST METHODS ====================

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // ==================== AUTH METHODS ====================

  getToken() {
    return localStorage.getItem('user_token');
  }

  setToken(token) {
    localStorage.setItem('user_token', token);
  }

  removeToken() {
    localStorage.removeItem('user_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        if (response.status === 401) {
          this.removeToken();
          this.disconnectSocket();
          window.location.href = '/login';
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.token) {
        this.setToken(response.token);
        this.initializeSocket(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.token) {
        this.setToken(response.token);
        this.initializeSocket(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.removeToken();
      this.disconnectSocket();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async forgotPassword(email) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // ==================== USER PROFILE ====================

  async getUserProfile() {
    return await this.request('/users/profile');
  }

  async updateUserProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return await this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async updateUserSettings(settings) {
    return await this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    return await this.request('/analytics/dashboard');
  }

  async getDashboardData() {
    return await this.request('/analytics/dashboard-comprehensive');
  }

  // ==================== LEADS MANAGEMENT ====================

  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/leads${queryString ? `?${queryString}` : ''}`);
  }

  async getLead(id) {
    return await this.request(`/leads/${id}`);
  }

  async createLead(leadData) {
    return await this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id, leadData) {
    return await this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id) {
    return await this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateLeads(leadIds, updateData) {
    return await this.request('/leads/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ leadIds, updateData }),
    });
  }

  async bulkDeleteLeads(leadIds) {
    return await this.request('/leads/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ leadIds }),
    });
  }

  async importLeads(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/leads/import`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Import failed');
    }

    return await response.json();
  }

  async exportLeads(leadIds = []) {
    return await this.request('/leads/export', {
      method: 'POST',
      body: JSON.stringify({ leadIds }),
    });
  }

  async getLeadAnalytics(timeRange = '30d') {
    return await this.request(`/analytics/leads?timeRange=${timeRange}`);
  }

  // ==================== MESSAGES ====================

  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/messages${queryString ? `?${queryString}` : ''}`);
  }

  async sendMessage(messageData) {
    return await this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessageAsRead(id) {
    return await this.request(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  async getMessageAnalytics(timeRange = '30d') {
    return await this.request(`/analytics/messages?timeRange=${timeRange}`);
  }

  // ==================== WHATSAPP INTEGRATION ====================

  async getWhatsAppStatus() {
    return await this.request('/whatsapp/status');
  }

  async connectWhatsApp() {
    return await this.request('/whatsapp/connect', {
      method: 'POST',
    });
  }

  async disconnectWhatsApp() {
    return await this.request('/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  async getWhatsAppQR() {
    return await this.request('/whatsapp/qr');
  }

  async getWhatsAppContacts() {
    return await this.request('/whatsapp/contacts');
  }

  async sendWhatsAppMessage(messageData) {
    return await this.request('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getWhatsAppMessages(contactId) {
    return await this.request(`/whatsapp/messages/${contactId}`);
  }

  async getWhatsAppTemplates() {
    return await this.request('/whatsapp/templates');
  }

  async createWhatsAppTemplate(templateData) {
    return await this.request('/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async sendBulkWhatsAppMessage(messageData) {
    return await this.request('/whatsapp/bulk-send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async syncWhatsAppContacts() {
    return await this.request('/whatsapp/sync-contacts', {
      method: 'POST',
    });
  }

  async getWhatsAppAnalytics() {
    return await this.request('/whatsapp/analytics');
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(timeRange = '30d', type = 'overview') {
    return await this.request(`/analytics?timeRange=${timeRange}&type=${type}`);
  }

  async getRevenueAnalytics(timeRange = '30d') {
    return await this.request(`/analytics/revenue?timeRange=${timeRange}`);
  }

  async getPerformanceMetrics() {
    return await this.request('/analytics/performance');
  }

  async getEngagementAnalytics(timeRange = '30d') {
    return await this.request(`/analytics/engagement?timeRange=${timeRange}`);
  }

  async getConversionAnalytics(timeRange = '30d') {
    return await this.request(`/analytics/conversion?timeRange=${timeRange}`);
  }

  // ==================== TASKS ====================

  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/tasks${queryString ? `?${queryString}` : ''}`);
  }

  async createTask(taskData) {
    return await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async completeTask(id) {
    return await this.request(`/tasks/${id}/complete`, {
      method: 'PUT',
    });
  }

  // ==================== FOLLOW-UPS ====================

  async getFollowUps(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/followups${queryString ? `?${queryString}` : ''}`);
  }

  async createFollowUp(followUpData) {
    return await this.request('/followups', {
      method: 'POST',
      body: JSON.stringify(followUpData),
    });
  }

  async updateFollowUp(id, followUpData) {
    return await this.request(`/followups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(followUpData),
    });
  }

  async deleteFollowUp(id) {
    return await this.request(`/followups/${id}`, {
      method: 'DELETE',
    });
  }

  async executeFollowUp(id) {
    return await this.request(`/followups/${id}/execute`, {
      method: 'POST',
    });
  }

  // ==================== AI ASSISTANT ====================

  async getChatHistory(sessionId) {
    return await this.request(`/ai/chat/history/${sessionId}`);
  }

  async sendChatMessage(sessionId, message) {
    return await this.request(`/ai/chat/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAIInsights() {
    return await this.request('/ai/insights');
  }

  async getAIRecommendations() {
    return await this.request('/ai/recommendations');
  }

  // ==================== KNOWLEDGE BASE ====================

  async getKnowledgeBase(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/knowledge${queryString ? `?${queryString}` : ''}`);
  }

  async searchKnowledge(query) {
    return await this.request(`/knowledge/search?q=${encodeURIComponent(query)}`);
  }

  async createKnowledgeItem(itemData) {
    return await this.request('/knowledge', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateKnowledgeItem(id, itemData) {
    return await this.request(`/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteKnowledgeItem(id) {
    return await this.request(`/knowledge/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== WORKFLOWS ====================

  async getWorkflows() {
    return await this.request('/workflows');
  }

  async createWorkflow(workflowData) {
    return await this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async updateWorkflow(id, workflowData) {
    return await this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData),
    });
  }

  async deleteWorkflow(id) {
    return await this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleWorkflow(id, active) {
    return await this.request(`/workflows/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationAsRead(id) {
    return await this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return await this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id) {
    return await this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return await this.request('/notifications/clear-all', {
      method: 'DELETE',
    });
  }

  // ==================== INTEGRATIONS ====================

  async getIntegrations() {
    return await this.request('/integrations');
  }

  async updateIntegration(integrationId, config) {
    return await this.request(`/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async testIntegration(integrationId) {
    return await this.request(`/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  }

  async connectGoogleSheets(config) {
    return await this.request('/integrations/google-sheets/connect', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async syncGoogleSheets() {
    return await this.request('/integrations/google-sheets/sync', {
      method: 'POST',
    });
  }

  // ==================== SUBSCRIPTION & BILLING ====================

  async getSubscription() {
    return await this.request('/plans/user/subscription');
  }

  async getPlans() {
    return await this.request('/plans');
  }

  async updateSubscription(planId, billingCycle = 'monthly') {
    return await this.request('/plans/user/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle }),
    });
  }

  async getPaymentHistory() {
    return await this.request('/payments/history');
  }

  async createPaymentOrder(orderData) {
    return await this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async verifyPayment(paymentData) {
    return await this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async cancelSubscription() {
    return await this.request('/payments/subscription/cancel', {
      method: 'POST',
    });
  }

  async updateAutoRenew(autoRenew) {
    return await this.request('/payments/subscription/auto-renew', {
      method: 'PUT',
      body: JSON.stringify({ autoRenew }),
    });
  }

  // ==================== CONFIGURATION ====================

  async getFeatures() {
    return await this.request('/config/features');
  }

  async getNavigation() {
    return await this.request('/config/navigation');
  }

  async getGoals() {
    return await this.request('/config/goals');
  }

  async updateGoals(goals) {
    return await this.request('/config/goals', {
      method: 'PUT',
      body: JSON.stringify({ goals }),
    });
  }

  async createGoal(goalData) {
    return await this.request('/config/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async getSocialLinks() {
    return await this.request('/config/social-links');
  }

  async updateSocialLinks(socialLinks) {
    return await this.request('/config/social-links', {
      method: 'PUT',
      body: JSON.stringify({ socialLinks }),
    });
  }

  async getTeamMembers() {
    return await this.request('/config/team-members');
  }

  async addTeamMember(memberData) {
    return await this.request('/config/team-members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateTeamMember(id, memberData) {
    return await this.request(`/config/team-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async removeTeamMember(id) {
    return await this.request(`/config/team-members/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== UTILITIES ====================

  async uploadFile(file, type = 'document') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  }

  async downloadFile(fileId) {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/files/${fileId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  async getSystemHealth() {
    return await this.request('/health');
  }

  async reportError(error) {
    return await this.request('/errors/report', {
      method: 'POST',
      body: JSON.stringify(error),
    });
  }

  // ==================== UTILITY METHODS ====================

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString();
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Create and export a singleton instance
const apiService = new UserApiService();
export default apiService; 