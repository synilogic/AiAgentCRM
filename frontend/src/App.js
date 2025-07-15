import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import UserDashboard from './components/UserDashboard';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [socket, setSocket] = useState(null);
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        initializeSocket(token);
        loadData(token);
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const initializeSocket = (token) => {
    const newSocket = io('http://localhost:5000');
    newSocket.emit('authenticate', token);
    
    newSocket.on('authenticated', (data) => {
      console.log('WebSocket authenticated');
    });

    newSocket.on('lead_created', (data) => {
      setLeads(prev => [...(prev || []), data.lead]);
      setSuccess('New lead created!');
    });

    newSocket.on('new_message', (data) => {
      setMessages(prev => [...(prev || []), data.message]);
      setSuccess('New message received!');
    });

    setSocket(newSocket);
  };

  const loadData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Load leads
      try {
        const leadsResponse = await axios.get(`${API_BASE_URL}/leads`, { headers });
        if (leadsResponse.data.success) {
          setLeads(leadsResponse.data.leads || []);
        }
      } catch (error) {
        console.error('Error loading leads:', error);
        setLeads([]);
      }

      // Load messages
      try {
        const messagesResponse = await axios.get(`${API_BASE_URL}/messages`, { headers });
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages || []);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        initializeSocket(response.data.token);
        loadData(response.data.token);
        setSuccess('Login successful!');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setLeads([]);
    setMessages([]);
  };

  const createLead = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/leads`, {
        name: 'New Lead',
        email: 'lead@example.com',
        phone: '+1234567890',
        status: 'new'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setLeads(prev => [...(prev || []), response.data.lead]);
        setSuccess('Lead created successfully!');
      }
    } catch (error) {
      setError('Failed to create lead');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="header">
          <h1>Ai Agentic CRM</h1>
          <p>Intelligent Customer Relationship Management</p>
        </div>
        
        <div className="login-container">
          <h2>Login</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn">Login</button>
          </form>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p><strong>Demo Accounts:</strong></p>
            <p>User: demo@aiaagentcrm.com / demo123</p>
            <p>Admin: admin@aiaagentcrm.com / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user?.role === 'admin' ? (
        // Admin dashboard (keep existing simple dashboard for admin)
        <>
          <div className="header">
            <h1>Ai Agentic CRM Dashboard</h1>
            <p>Welcome, {user?.email} ({user?.role})</p>
            <button onClick={handleLogout} className="btn" style={{ width: 'auto', marginTop: '10px' }}>
              Logout
            </button>
          </div>
          
          <div className="container">
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            <div className="dashboard">
              <div className="card">
                <h2>Quick Actions</h2>
                <button onClick={createLead} className="btn" style={{ width: 'auto' }}>
                  Create New Lead
                </button>
              </div>
              
              <div className="card">
                <h2>Leads ({(leads || []).length})</h2>
                {!leads || leads.length === 0 ? (
                  <p>No leads found. Create your first lead!</p>
                ) : (
                  <div>
                    {leads.slice(0, 5).map(lead => (
                      <div key={lead._id} style={{ padding: '10px', border: '1px solid #ddd', margin: '5px 0', borderRadius: '5px' }}>
                        <strong>{lead.name}</strong> - {lead.email} ({lead.status})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="card">
                <h2>Recent Messages ({(messages || []).length})</h2>
                {!messages || messages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  <div>
                    {messages.slice(0, 5).map(message => (
                      <div key={message._id} style={{ padding: '10px', border: '1px solid #ddd', margin: '5px 0', borderRadius: '5px' }}>
                        <strong>{message.user?.name || message.user?.email || 'Unknown'}</strong>: {message.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="card">
                <h2>System Status</h2>
                <p>✅ Backend Server: Running</p>
                <p>✅ Database: Connected</p>
                <p>✅ WebSocket: {socket ? 'Connected' : 'Disconnected'}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Enhanced user dashboard
        <UserDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App; 