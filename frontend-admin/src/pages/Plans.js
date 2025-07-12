import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    features: [],
    limits: {
      leads: '',
      messages: '',
      followups: ''
    }
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPlans();
      setPlans(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('limits.')) {
      const limitField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        limits: {
          ...prev.limits,
          [limitField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '30',
      features: [],
      limits: {
        leads: '',
        messages: '',
        followups: ''
      }
    });
    setEditingPlan(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await apiService.updatePlan(editingPlan._id, formData);
      } else {
        await apiService.createPlan(formData);
      }
      resetForm();
      fetchPlans();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: (plan.price ?? '').toString(),
      duration: (plan.duration ?? '').toString(),
      features: plan.features || [],
      limits: {
        leads: plan.limits?.leads !== undefined && plan.limits?.leads !== null ? plan.limits.leads.toString() : '',
        messages: plan.limits?.messages !== undefined && plan.limits?.messages !== null ? plan.limits.messages.toString() : '',
        followups: plan.limits?.followups !== undefined && plan.limits?.followups !== null ? plan.limits.followups.toString() : ''
      }
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await apiService.deletePlan(planId);
        fetchPlans();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading plans...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          Plan Management
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Create New Plan
        </button>
      </div>

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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                  Plan Name:
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                  Price (₹):
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                Description:
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                  Duration (days):
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                  Lead Limit:
                </label>
                <input
                  type="number"
                  name="limits.leads"
                  value={formData.limits.leads}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                  Message Limit:
                </label>
                <input
                  type="number"
                  name="limits.messages"
                  value={formData.limits.messages}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                Features:
              </label>
              {formData.features.map((feature, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter feature"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    style={{
                      padding: '10px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Feature
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
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
            Available Plans ({plans.length})
          </h3>
        </div>

        <div style={{ padding: '20px' }}>
          {plans.length === 0 ? (
            <p style={{ color: '#7f8c8d', textAlign: 'center' }}>
              No plans available
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {plans.map((plan) => (
                <div key={plan._id} style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '20px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                        {plan.name}
                      </h4>
                      <p style={{ margin: 0, color: '#7f8c8d' }}>
                        {plan.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                        ₹{plan.price}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        per {plan.duration} days
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#2c3e50' }}>Limits:</strong>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                      <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        Leads: {plan.limits?.leads || 'Unlimited'}
                      </span>
                      <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        Messages: {plan.limits?.messages || 'Unlimited'}
                      </span>
                      <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        Followups: {plan.limits?.followups || 'Unlimited'}
                      </span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#2c3e50' }}>Features:</strong>
                      <ul style={{ margin: '5px 0 0 20px', color: '#7f8c8d' }}>
                        {plan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEdit(plan)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Plans; 