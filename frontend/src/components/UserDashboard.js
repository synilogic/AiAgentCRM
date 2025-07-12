import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WhatsAppIntegration from './WhatsAppIntegration';
import './UserDashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

const UserDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      // Load leads
      const leadsResponse = await axios.get(`${API_BASE_URL}/leads`, { headers });
      if (leadsResponse.data.success) {
        setLeads(leadsResponse.data.leads || []);
      }

      // Load messages
      const messagesResponse = await axios.get(`${API_BASE_URL}/messages`, { headers });
      if (messagesResponse.data.success) {
        setMessages(messagesResponse.data.messages || []);
      }

      // Load tasks
      const tasksResponse = await axios.get(`${API_BASE_URL}/tasks`, { headers });
      if (tasksResponse.data.success) {
        setTasks(tasksResponse.data.tasks || []);
      }

      // Load analytics
      const analyticsResponse = await axios.get(`${API_BASE_URL}/analytics`, { headers });
      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics || {});
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLead = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/leads`, newLead, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setLeads(prev => [...prev, response.data.lead]);
        setNewLead({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'new'
        });
        alert('Lead created successfully!');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/leads/${leadId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setLeads(prev => prev.map(lead => 
          lead._id === leadId ? { ...lead, status: newStatus } : lead
        ));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setTasks(prev => [...prev, response.data.task]);
        alert('Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#007bff',
      contacted: '#ffc107',
      qualified: '#28a745',
      converted: '#6f42c1',
      lost: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Leads</h3>
          <div className="stat-number">{leads.length}</div>
          <div className="stat-change">+12% this month</div>
        </div>
        <div className="stat-card">
          <h3>Active Conversations</h3>
          <div className="stat-number">{messages.length}</div>
          <div className="stat-change">+5% this week</div>
        </div>
        <div className="stat-card">
          <h3>Pending Tasks</h3>
          <div className="stat-number">{tasks.filter(t => t.status === 'pending').length}</div>
          <div className="stat-change">-3% this week</div>
        </div>
        <div className="stat-card">
          <h3>Conversion Rate</h3>
          <div className="stat-number">24%</div>
          <div className="stat-change">+2% this month</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button onClick={() => setActiveTab('leads')} className="btn btn-primary">
            Add New Lead
          </button>
          <button onClick={() => setActiveTab('whatsapp')} className="btn btn-success">
            Connect WhatsApp
          </button>
          <button onClick={() => setActiveTab('tasks')} className="btn btn-warning">
            Create Task
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {leads.slice(0, 5).map(lead => (
            <div key={lead._id} className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <strong>New lead added:</strong> {lead.name}
                <small>{formatDate(lead.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="leads-section">
      <div className="section-header">
        <h3>Lead Management</h3>
        <button onClick={() => setActiveTab('overview')} className="btn btn-secondary">
          Back to Overview
        </button>
      </div>

      <div className="leads-container">
        <div className="leads-list">
          <h4>All Leads ({leads.length})</h4>
          {leads.map(lead => (
            <div key={lead._id} className="lead-card">
              <div className="lead-header">
                <h5>{lead.name}</h5>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(lead.status) }}
                >
                  {lead.status}
                </span>
              </div>
              <div className="lead-details">
                <p><strong>Email:</strong> {lead.email}</p>
                <p><strong>Phone:</strong> {lead.phone}</p>
                <p><strong>Company:</strong> {lead.company}</p>
                <p><strong>Added:</strong> {formatDate(lead.createdAt)}</p>
              </div>
              <div className="lead-actions">
                <select 
                  value={lead.status}
                  onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                  className="status-select"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <button className="btn btn-sm btn-primary">View Details</button>
              </div>
            </div>
          ))}
        </div>

        <div className="add-lead-form">
          <h4>Add New Lead</h4>
          <form onSubmit={createLead}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({...newLead, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={newLead.company}
                onChange={(e) => setNewLead({...newLead, company: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create Lead
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-section">
      <div className="section-header">
        <h3>Task Management</h3>
        <button onClick={() => setActiveTab('overview')} className="btn btn-secondary">
          Back to Overview
        </button>
      </div>

      <div className="tasks-container">
        <div className="tasks-list">
          <h4>All Tasks ({tasks.length})</h4>
          {tasks.map(task => (
            <div key={task._id} className="task-card">
              <div className="task-header">
                <h5>{task.title}</h5>
                <span className={`priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <p>{task.description}</p>
              <div className="task-meta">
                <span>Due: {formatDate(task.dueDate)}</span>
                <span>Status: {task.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="add-task-form">
          <h4>Create New Task</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            createTask({
              title: formData.get('title'),
              description: formData.get('description'),
              priority: formData.get('priority'),
              dueDate: formData.get('dueDate')
            });
            e.target.reset();
          }}>
            <div className="form-group">
              <label>Title *</label>
              <input name="title" type="text" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows="3"></textarea>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input name="dueDate" type="date" />
            </div>
            <button type="submit" className="btn btn-primary">
              Create Task
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h3>Analytics & Reports</h3>
        <button onClick={() => setActiveTab('overview')} className="btn btn-secondary">
          Back to Overview
        </button>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h4>Lead Conversion Funnel</h4>
          <div className="funnel-chart">
            <div className="funnel-stage">
              <span>New Leads</span>
              <div className="funnel-bar" style={{width: '100%'}}>100</div>
            </div>
            <div className="funnel-stage">
              <span>Contacted</span>
              <div className="funnel-bar" style={{width: '75%'}}>75</div>
            </div>
            <div className="funnel-stage">
              <span>Qualified</span>
              <div className="funnel-bar" style={{width: '50%'}}>50</div>
            </div>
            <div className="funnel-stage">
              <span>Converted</span>
              <div className="funnel-bar" style={{width: '25%'}}>25</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h4>Monthly Performance</h4>
          <div className="performance-chart">
            <div className="chart-bar">
              <div className="bar" style={{height: '60%'}}></div>
              <span>Jan</span>
            </div>
            <div className="chart-bar">
              <div className="bar" style={{height: '80%'}}></div>
              <span>Feb</span>
            </div>
            <div className="chart-bar">
              <div className="bar" style={{height: '45%'}}></div>
              <span>Mar</span>
            </div>
            <div className="chart-bar">
              <div className="bar" style={{height: '90%'}}></div>
              <span>Apr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <h2>Welcome back, {user?.name || user?.email}!</h2>
          <p>Here's what's happening with your leads today.</p>
        </div>
        <div className="user-actions">
          <button onClick={onLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          Leads
        </button>
        <button 
          className={`nav-tab ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setActiveTab('whatsapp')}
        >
          WhatsApp
        </button>
        <button 
          className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'leads' && renderLeads()}
            {activeTab === 'whatsapp' && <WhatsAppIntegration />}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'analytics' && renderAnalytics()}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 