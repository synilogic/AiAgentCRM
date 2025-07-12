import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function WhatsAppConnect() {
  const [qrCode, setQrCode] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await apiService.connectWhatsApp();
      if (response.qrCode) {
        setQrCode(response.qrCode);
        setIsConnected(false);
      } else {
        setIsConnected(true);
        setQrCode(null);
      }
    } catch (error) {
      console.error('Failed to check WhatsApp connection:', error);
      setError('Failed to check WhatsApp connection');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.connectWhatsApp();
      setQrCode(response.qrCode);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
      setError('Failed to connect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const phoneNumber = prompt('Enter phone number (with country code):');
    const message = prompt('Enter message:');
    
    if (phoneNumber && message) {
      try {
        await apiService.sendWhatsAppMessage(phoneNumber, message);
        alert('Message sent successfully!');
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message');
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await apiService.getWhatsAppMessages();
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading WhatsApp connection...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>WhatsApp Connection</h2>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: 12, 
          borderRadius: 4,
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 24
      }}>
        <h3 style={{ marginBottom: 16, color: '#333' }}>Connection Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#28a745' : '#dc3545'
          }}></div>
          <span style={{ color: '#333' }}>
            {isConnected ? 'Connected to WhatsApp' : 'Not connected to WhatsApp'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Connecting...' : 'Connect WhatsApp'}
          </button>
          
          {isConnected && (
            <button
              onClick={handleSendMessage}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Send Test Message
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      {qrCode && (
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: 16, color: '#333' }}>Scan QR Code</h3>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Open WhatsApp on your phone and scan this QR code to connect
          </p>
          <img 
            src={qrCode} 
            alt="WhatsApp QR Code" 
            style={{ 
              maxWidth: '300px', 
              border: '1px solid #ddd',
              borderRadius: 4
            }} 
          />
          <p style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
            The QR code will automatically refresh when scanned successfully
          </p>
        </div>
      )}

      {/* Messages */}
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#333' }}>Recent Messages</h3>
          <button
            onClick={fetchMessages}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
        
        {messages.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
            No messages found. Connect WhatsApp to start receiving messages.
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {message.from}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>
                    {message.message}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(message.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsAppConnect; 