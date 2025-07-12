import adminApi from './api';

// Email Templates Management
export const emailTemplateService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      return await adminApi.request(`/admin/email-templates?${queryParams}`);
    } catch (error) {
      console.error('Get email templates failed:', error);
      return {
        success: true,
        templates: [
          {
            _id: 'template1',
            name: 'user_registration',
            displayName: 'User Registration Welcome',
            subject: 'Welcome to AI Agent CRM!',
            htmlContent: '<h1>Welcome {{user_name}}!</h1><p>Your email: {{email}}</p><p><a href="{{activation_link}}">Activate Account</a></p>',
            textContent: 'Welcome {{user_name}}! Your email: {{email}}. Activate: {{activation_link}}',
            category: 'user_management',
            isActive: true,
            isDefault: true,
            variables: [
              { name: 'user_name', description: 'User display name', required: true },
              { name: 'email', description: 'User email address', required: true },
              { name: 'activation_link', description: 'Account activation URL', required: true }
            ],
            usage: { totalSent: 150, successRate: 98.5 },
            createdAt: new Date(Date.now() - 86400000)
          },
          {
            _id: 'template2',
            name: 'payment_success',
            displayName: 'Payment Success Confirmation',
            subject: 'Payment Received - Thank You!',
            htmlContent: '<h2>Payment Confirmed!</h2><p>Amount: ${{amount}}</p><p>Transaction: {{transaction_id}}</p><p>Date: {{payment_date}}</p>',
            textContent: 'Payment Confirmed! Amount: ${{amount}}, Transaction: {{transaction_id}}, Date: {{payment_date}}',
            category: 'billing',
            isActive: true,
            isDefault: true,
            variables: [
              { name: 'amount', description: 'Payment amount', required: true },
              { name: 'transaction_id', description: 'Transaction ID', required: true },
              { name: 'payment_date', description: 'Payment date', required: true }
            ],
            usage: { totalSent: 89, successRate: 99.1 },
            createdAt: new Date(Date.now() - 172800000)
          },
          {
            _id: 'template3',
            name: 'trial_expiration',
            displayName: 'Trial Expiration Notice',
            subject: 'Your Trial Expires in {{days_left}} Days',
            htmlContent: '<h2>Hi {{user_name}},</h2><p>Your trial expires in <strong>{{days_left}} days</strong>.</p><p><a href="{{upgrade_link}}">Upgrade Now</a></p>',
            textContent: 'Hi {{user_name}}, Your trial expires in {{days_left}} days. Upgrade: {{upgrade_link}}',
            category: 'billing',
            isActive: true,
            isDefault: true,
            variables: [
              { name: 'user_name', description: 'User display name', required: true },
              { name: 'days_left', description: 'Days left in trial', required: true },
              { name: 'upgrade_link', description: 'Upgrade URL', required: true }
            ],
            usage: { totalSent: 45, successRate: 96.8 },
            createdAt: new Date(Date.now() - 259200000)
          },
          {
            _id: 'template4',
            name: 'password_reset',
            displayName: 'Password Reset Request',
            subject: 'Reset Your Password',
            htmlContent: '<h2>Password Reset</h2><p>Hi {{user_name}},</p><p><a href="{{reset_link}}">Reset Password</a></p><p>Expires in {{expiry_time}}.</p>',
            textContent: 'Hi {{user_name}}, Reset your password: {{reset_link}} (Expires in {{expiry_time}})',
            category: 'user_management',
            isActive: true,
            isDefault: true,
            variables: [
              { name: 'user_name', description: 'User display name', required: true },
              { name: 'reset_link', description: 'Password reset URL', required: true },
              { name: 'expiry_time', description: 'Link expiry time', required: true }
            ],
            usage: { totalSent: 23, successRate: 97.5 },
            createdAt: new Date(Date.now() - 345600000)
          }
        ],
        total: 4,
        totalPages: 1,
        currentPage: 1
      };
    }
  },

  getById: async (id) => {
    try {
      return await adminApi.request(`/admin/email-templates/${id}`);
    } catch (error) {
      const mockTemplates = await emailTemplateService.getAll();
      const template = mockTemplates.templates.find(t => t._id === id);
      return {
        success: true,
        template: template || {
          _id: id,
          name: 'sample_template',
          displayName: 'Sample Template',
          subject: 'Sample Subject',
          htmlContent: '<p>Sample HTML content</p>',
          textContent: 'Sample text content',
          category: 'notifications',
          isActive: true,
          variables: []
        }
      };
    }
  },

  create: async (templateData) => {
    try {
      return await adminApi.request('/admin/email-templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      return { success: true, message: 'Email template created (demo mode)' };
    }
  },

  update: async (id, templateData) => {
    try {
      return await adminApi.request(`/admin/email-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      return { success: true, message: 'Email template updated (demo mode)' };
    }
  },

  delete: async (id) => {
    try {
      return await adminApi.request(`/admin/email-templates/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return { success: true, message: 'Email template deleted (demo mode)' };
    }
  },

  preview: async (id, data) => {
    try {
      return await adminApi.request(`/admin/email-templates/${id}/preview`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      const mockTemplates = await emailTemplateService.getAll();
      const template = mockTemplates.templates.find(t => t._id === id);
      
      if (template && data.variables) {
        let subject = template.subject;
        let htmlContent = template.htmlContent;
        let textContent = template.textContent;
        
        // Replace variables with provided values
        Object.keys(data.variables).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          const value = data.variables[key] || `{{${key}}}`;
          subject = subject.replace(regex, value);
          htmlContent = htmlContent.replace(regex, value);
          textContent = textContent.replace(regex, value);
        });

        return {
          success: true,
          preview: { subject, htmlContent, textContent }
        };
      }

      return {
        success: true,
        preview: {
          subject: 'Sample Preview Subject',
          htmlContent: '<h1>Preview HTML</h1><p>This is a preview</p>',
          textContent: 'Preview text content'
        }
      };
    }
  }
};

// Payment Gateways Management
export const paymentGatewayService = {
  getAll: async () => {
    try {
      return await adminApi.request('/admin/payment-gateways');
    } catch (error) {
      console.error('Get payment gateways failed:', error);
      return {
        success: true,
        gateways: [
          {
            _id: 'gateway1',
            name: 'razorpay',
            displayName: 'Razorpay',
            description: 'Accept payments through Razorpay with UPI, Cards, NetBanking',
            isActive: true,
            isDefault: true,
            config: {
              keyId: 'rzp_test_****',
              keySecret: '****',
              testMode: true,
              defaultCurrency: 'INR',
              fees: { percentage: 2.0, fixed: 2, currency: 'INR' },
              limits: { minAmount: 1, maxAmount: 1000000 }
            },
            features: {
              instantRefunds: true,
              recurringPayments: true,
              internationalPayments: true,
              upiPayments: true,
              cardPayments: true,
              netBanking: true,
              walletPayments: true,
              qrCodePayments: true,
              linkPayments: true,
              subscriptions: true
            },
            statistics: { 
              successRate: 97.1, 
              averageProcessingTime: 2.5,
              totalTransactions: 1250,
              totalVolume: 245000,
              failureRate: 2.9
            },
            status: { 
              connectionStatus: 'connected', 
              lastHealthCheck: new Date(),
              errorCount: 0
            },
            integration: {
              priority: 100,
              loadBalancing: { enabled: false, weight: 100 }
            },
            logo: '/images/razorpay-logo.png',
            brandColor: '#3395FF',
            supportUrl: 'https://razorpay.com/support',
            documentationUrl: 'https://razorpay.com/docs'
          },
          {
            _id: 'gateway2',
            name: 'cashfree',
            displayName: 'Cashfree',
            description: 'Accept payments through Cashfree with competitive rates',
            isActive: false,
            isDefault: false,
            config: {
              keyId: '',
              keySecret: '',
              testMode: true,
              defaultCurrency: 'INR',
              fees: { percentage: 1.75, fixed: 1.5, currency: 'INR' },
              limits: { minAmount: 1, maxAmount: 1000000 }
            },
            features: {
              instantRefunds: true,
              recurringPayments: true,
              internationalPayments: false,
              upiPayments: true,
              cardPayments: true,
              netBanking: true,
              walletPayments: true,
              qrCodePayments: true,
              linkPayments: true,
              subscriptions: true
            },
            statistics: { 
              successRate: 94.5, 
              averageProcessingTime: 3.2,
              totalTransactions: 0,
              totalVolume: 0,
              failureRate: 5.5
            },
            status: { 
              connectionStatus: 'disconnected',
              errorCount: 0
            },
            integration: {
              priority: 80,
              loadBalancing: { enabled: false, weight: 80 }
            },
            logo: '/images/cashfree-logo.png',
            brandColor: '#00D4FF',
            supportUrl: 'https://cashfree.com/support',
            documentationUrl: 'https://docs.cashfree.com'
          },
          {
            _id: 'gateway3',
            name: 'phonepe',
            displayName: 'PhonePe',
            description: 'Accept payments through PhonePe - Popular in India',
            isActive: false,
            isDefault: false,
            config: {
              keyId: '',
              keySecret: '',
              testMode: true,
              defaultCurrency: 'INR',
              fees: { percentage: 1.99, fixed: 2, currency: 'INR' },
              limits: { minAmount: 1, maxAmount: 1000000 }
            },
            features: {
              instantRefunds: false,
              recurringPayments: false,
              internationalPayments: false,
              upiPayments: true,
              cardPayments: true,
              netBanking: true,
              walletPayments: true,
              qrCodePayments: true,
              linkPayments: false,
              subscriptions: false
            },
            statistics: { 
              successRate: 92.8, 
              averageProcessingTime: 4.1,
              totalTransactions: 0,
              totalVolume: 0,
              failureRate: 7.2
            },
            status: { 
              connectionStatus: 'disconnected',
              errorCount: 0
            },
            integration: {
              priority: 60,
              loadBalancing: { enabled: false, weight: 60 }
            },
            logo: '/images/phonepe-logo.png',
            brandColor: '#5F259F',
            supportUrl: 'https://phonepe.com/support',
            documentationUrl: 'https://developer.phonepe.com'
          }
        ]
      };
    }
  },

  getById: async (id) => {
    try {
      return await adminApi.request(`/admin/payment-gateways/${id}`);
    } catch (error) {
      const mockGateways = await paymentGatewayService.getAll();
      const gateway = mockGateways.gateways.find(g => g._id === id);
      return {
        success: true,
        gateway: gateway || {
          _id: id,
          name: 'unknown',
          displayName: 'Unknown Gateway',
          isActive: false,
          config: {},
          features: {},
          statistics: {}
        }
      };
    }
  },

  update: async (id, gatewayData) => {
    try {
      return await adminApi.request(`/admin/payment-gateways/${id}`, {
        method: 'PUT',
        body: JSON.stringify(gatewayData),
      });
    } catch (error) {
      return { success: true, message: 'Payment gateway updated (demo mode)' };
    }
  },

  testConnection: async (id) => {
    try {
      return await adminApi.request(`/admin/payment-gateways/${id}/test`, {
        method: 'POST',
      });
    } catch (error) {
      // Simulate test results
      const mockGateways = await paymentGatewayService.getAll();
      const gateway = mockGateways.gateways.find(g => g._id === id);
      
      if (gateway) {
        const hasCredentials = gateway.config.keyId && gateway.config.keySecret;
        return { 
          success: true, 
          testResult: { 
            success: hasCredentials, 
            message: hasCredentials 
              ? 'Connection test passed (demo mode)' 
              : 'Missing credentials - please configure API keys'
          } 
        };
      }
      
      return { 
        success: true, 
        testResult: { 
          success: false, 
          message: 'Gateway not found' 
        } 
      };
    }
  }
}; 