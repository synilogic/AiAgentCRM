import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalSubscribers: 0,
    planRevenue: []
  });

  // Bulk operations
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Plans for filtering
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchPaymentStats();
  }, [currentPage, filters, sortBy, sortOrder]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubscriptions(currentPage, 10, {
        ...filters,
        sortBy,
        sortOrder
      });
      setSubscriptions(response.subscriptions);
      setTotalPages(response.totalPages);
      setTotalSubscriptions(response.total);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await apiService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const data = await apiService.getPaymentStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await apiService.updateUser(userId, { 'subscription.status': newStatus });
      fetchSubscriptions();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSubscriptions.length === 0) return;

    try {
      const promises = selectedSubscriptions.map(userId => {
        switch (bulkAction) {
          case 'activate':
            return apiService.updateUser(userId, { 'subscription.status': 'active' });
          case 'deactivate':
            return apiService.updateUser(userId, { 'subscription.status': 'inactive' });
          case 'suspend':
            return apiService.updateUser(userId, { 'subscription.status': 'suspended' });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedSubscriptions([]);
      setShowBulkModal(false);
      setBulkAction('');
      fetchSubscriptions();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSubscriptions(subscriptions.map(sub => sub._id));
    } else {
      setSelectedSubscriptions([]);
    }
  };

  const handleSelectSubscription = (userId, checked) => {
    if (checked) {
      setSelectedSubscriptions(prev => [...prev, userId]);
    } else {
      setSelectedSubscriptions(prev => prev.filter(id => id !== userId));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'inactive': return '#95a5a6';
      case 'suspended': return '#e74c3c';
      case 'trial': return '#f39c12';
      case 'expired': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'Basic Plan': return '#95a5a6';
      case 'Pro Plan': return '#3498db';
      case 'Enterprise Plan': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading subscriptions...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>
        Subscription Management ({totalSubscriptions} total subscriptions)
      </h1>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #27ae60'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Total Revenue</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
            {formatCurrency(stats.stats?.totalRevenue || 0)}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3498db'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Active Subscriptions</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
            {stats.stats?.activeSubscriptions || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f39c12'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Total Subscribers</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
            {stats.stats?.totalSubscribers || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #9b59b6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Conversion Rate</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
            {stats.stats?.totalSubscribers > 0 
              ? ((stats.stats?.activeSubscriptions / stats.stats?.totalSubscribers) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      {/* Plan Revenue Chart */}
      {stats.planRevenue && stats.planRevenue.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Revenue by Plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {stats.planRevenue.map((plan, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                borderLeft: '4px solid #3498db'
              }}>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{plan.planName || 'Unknown Plan'}</div>
                <div style={{ fontSize: '18px', color: '#27ae60', marginTop: '5px' }}>
                  {formatCurrency(plan.revenue || 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                  {plan.subscribers || 0} subscribers
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#2c3e50', margin: 0 }}>Filters & Search</h3>
          {selectedSubscriptions.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Bulk Actions ({selectedSubscriptions.length})
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <input
            type="text"
            name="search"
            placeholder="Search by name or email"
            value={filters.search}
            onChange={handleFilterChange}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
          </select>
          <select
            name="plan"
            value={filters.plan}
            onChange={handleFilterChange}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">All Plans</option>
            {plans.map(plan => (
              <option key={plan._id} value={plan._id}>{plan.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>
            Subscriptions ({subscriptions.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <input
                    type="checkbox"
                    checked={selectedSubscriptions.length === subscriptions.length && subscriptions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Select
                </th>
                <th 
                  style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => handleSortChange('name')}
                >
                  Subscriber {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Plan</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Revenue</th>
                <th 
                  style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => handleSortChange('createdAt')}
                >
                  Start Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>
                    <input
                      type="checkbox"
                      checked={selectedSubscriptions.includes(subscription._id)}
                      onChange={(e) => handleSelectSubscription(subscription._id, e.target.checked)}
                    />
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div>
                      <strong>{subscription.name}</strong>
                      <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                        {subscription.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: getPlanColor(subscription.plan?.name),
                      color: 'white'
                    }}>
                      {subscription.plan?.name || 'No Plan'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <select
                      value={subscription.subscription?.status || 'inactive'}
                      onChange={(e) => handleStatusChange(subscription._id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(subscription.subscription?.status || 'inactive'),
                        color: 'white'
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                  <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold' }}>
                    {formatCurrency(subscription.plan?.price?.monthly || 0)}
                  </td>
                  <td style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>
                    {subscription.subscription?.startDate 
                      ? new Date(subscription.subscription.startDate).toLocaleDateString()
                      : new Date(subscription.createdAt).toLocaleDateString()
                    }
                  </td>
                  <td style={{ padding: '15px' }}>
                    <button
                      onClick={() => handleStatusChange(subscription._id, 'suspended')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subscriptions.length === 0 && !loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
            No subscriptions found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            Previous
          </button>
          
          <span style={{ color: '#7f8c8d' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>Bulk Actions</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p>Selected {selectedSubscriptions.length} subscription(s)</p>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                Action:
              </label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose an action...</option>
                <option value="activate">Activate All</option>
                <option value="deactivate">Deactivate All</option>
                <option value="suspend">Suspend All</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                style={{
                  padding: '10px 20px',
                  backgroundColor: bulkAction ? '#e74c3c' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: bulkAction ? 'pointer' : 'not-allowed'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions; 