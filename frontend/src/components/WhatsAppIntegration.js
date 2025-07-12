import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WhatsAppIntegration.css';

const API_BASE_URL = 'http://localhost:5000/api';

const WhatsAppIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [autoReply, setAutoReply] = useState({ enabled: false, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    loadWhatsAppLeads();
    loadAutoReplySettings();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setConnectionStatus(response.data.status);
        if (response.data.status === 'connected') {
          setQrCode(null);
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const connectWhatsApp = async () => {
    setIsConnecting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/connect`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Start polling for QR code
        pollForQRCode();
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const pollForQRCode = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/whatsapp/qr`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          if (response.data.qr) {
            setQrCode(response.data.qr);
          }
          
          if (response.data.status === 'connected') {
            setQrCode(null);
            setConnectionStatus('connected');
            clearInterval(interval);
            loadWhatsAppLeads();
          }
        }
      } catch (error) {
        console.error('Error polling QR code:', error);
      }
    }, 2000);
  };

  const disconnectWhatsApp = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/disconnect`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setConnectionStatus('disconnected');
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  };

  const loadWhatsAppLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/leads`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setLeads(response.data.leads || []);
      }
    } catch (error) {
      console.error('Error loading WhatsApp leads:', error);
    }
  };

  const loadLeadMessages = async (phoneNumber) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/leads/${phoneNumber}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.messages || []);
        setSelectedLead(phoneNumber);
      }
    } catch (error) {
      console.error('Error loading lead messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/send`, {
        phoneNumber: selectedLead,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setNewMessage('');
        // Reload messages
        loadLeadMessages(selectedLead);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadAutoReplySettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/auto-reply`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setAutoReply(response.data.autoReply);
      }
    } catch (error) {
      console.error('Error loading auto-reply settings:', error);
    }
  };

  const updateAutoReply = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/whatsapp/auto-reply`, autoReply, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        alert('Auto-reply settings updated successfully!');
      }
    } catch (error) {
      console.error('Error updating auto-reply settings:', error);
    }
  };

  const formatPhoneNumber = (phoneNumber) => {
    return phoneNumber.replace('@c.us', '');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="whatsapp-integration">
      <div className="whatsapp-header">
        <h2>WhatsApp Integration</h2>
        <div className="connection-status">
          Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
        </div>
      </div>

      {/* Connection Section */}
      <div className="connection-section">
        {connectionStatus === 'disconnected' && (
          <div className="connect-panel">
            <h3>Connect WhatsApp</h3>
            <p>Scan the QR code with your WhatsApp mobile app to connect your account.</p>
            <button 
              onClick={connectWhatsApp} 
              disabled={isConnecting}
              className="btn btn-primary"
            >
              {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
            </button>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="connected-panel">
            <h3>WhatsApp Connected</h3>
            <p>Your WhatsApp account is connected and ready to receive messages.</p>
            <button onClick={disconnectWhatsApp} className="btn btn-danger">
              Disconnect
            </button>
          </div>
        )}

        {qrCode && (
          <div className="qr-section">
            <h3>Scan QR Code</h3>
            <p>Open WhatsApp on your phone and scan this QR code:</p>
            <div className="qr-container">
              <img src={qrCode} alt="WhatsApp QR Code" className="qr-code" />
            </div>
            <p className="qr-instructions">
              1. Open WhatsApp on your phone<br/>
              2. Go to Settings > Linked Devices<br/>
              3. Tap "Link a Device"<br/>
              4. Scan the QR code above
            </p>
          </div>
        )}
      </div>

      {/* Auto-Reply Settings */}
      <div className="auto-reply-section">
        <h3>Auto-Reply Settings</h3>
        <div className="auto-reply-form">
          <label>
            <input
              type="checkbox"
              checked={autoReply.enabled}
              onChange={(e) => setAutoReply({...autoReply, enabled: e.target.checked})}
            />
            Enable Auto-Reply
          </label>
          <textarea
            placeholder="Enter auto-reply message..."
            value={autoReply.message}
            onChange={(e) => setAutoReply({...autoReply, message: e.target.value})}
            disabled={!autoReply.enabled}
          />
          <button onClick={updateAutoReply} className="btn btn-secondary">
            Save Auto-Reply Settings
          </button>
        </div>
      </div>

      {/* Leads Section */}
      <div className="leads-section">
        <h3>WhatsApp Leads ({leads.length})</h3>
        <div className="leads-container">
          <div className="leads-list">
            {leads.map(lead => (
              <div 
                key={lead._id} 
                className={`lead-item ${selectedLead === lead.contact?.whatsapp ? 'active' : ''}`}
                onClick={() => loadLeadMessages(lead.contact?.whatsapp)}
              >
                <div className="lead-info">
                  <strong>{lead.name}</strong>
                  <span>{formatPhoneNumber(lead.contact?.whatsapp || '')}</span>
                  <small>{lead.status}</small>
                </div>
                <div className="lead-date">
                  {formatDate(lead.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Messages Section */}
          {selectedLead && (
            <div className="messages-section">
              <div className="messages-header">
                <h4>Messages with {formatPhoneNumber(selectedLead)}</h4>
                <button onClick={() => setSelectedLead(null)} className="btn-close">×</button>
              </div>
              
              <div className="messages-container">
                {isLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message._id} 
                      className={`message ${message.metadata?.messageType === 'outgoing' ? 'outgoing' : 'incoming'}`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">{formatDate(message.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="btn btn-primary">
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIntegration; 