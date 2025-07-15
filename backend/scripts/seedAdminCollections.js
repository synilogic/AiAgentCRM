const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const EmailTemplate = require('../models/EmailTemplate');
const PaymentGateway = require('../models/PaymentGateway');

async function seedAdminCollections() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/AIAgentCRM',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ Connected to MongoDB');

    // Create EmailTemplate collection with sample templates
    const templateExists = await EmailTemplate.countDocuments();
    if (templateExists === 0) {
      const templates = [
        {
          name: 'user_registration',
          displayName: 'User Registration Welcome',
          subject: 'Welcome to AI Agent CRM!',
          htmlContent: '<h1>Welcome {{user_name}}!</h1><p>Your email: {{email}}</p><p><a href="{{activation_link}}">Activate Account</a></p>',
          textContent: 'Welcome {{user_name}}! Your email: {{email}}. Activate: {{activation_link}}',
          variables: [
            { name: 'user_name', description: 'User display name', required: true },
            { name: 'email', description: 'User email address', required: true },
            { name: 'activation_link', description: 'Account activation URL', required: true }
          ],
          category: 'user_management',
          isActive: true,
          isDefault: true
        },
        {
          name: 'payment_success',
          displayName: 'Payment Success Confirmation',
          subject: 'Payment Received - Thank You!',
          htmlContent: '<h2>Payment Confirmed!</h2><p>Amount: ₹{{amount}}</p><p>Transaction: {{transaction_id}}</p><p>Date: {{payment_date}}</p>',
          textContent: 'Payment Confirmed! Amount: ₹{{amount}}, Transaction: {{transaction_id}}, Date: {{payment_date}}',
          variables: [
            { name: 'amount', description: 'Payment amount', required: true },
            { name: 'transaction_id', description: 'Transaction ID', required: true },
            { name: 'payment_date', description: 'Payment date', required: true }
          ],
          category: 'billing',
          isActive: true,
          isDefault: true
        },
        {
          name: 'trial_expiration',
          displayName: 'Trial Expiration Notice',
          subject: 'Your Trial Expires in {{days_left}} Days',
          htmlContent: '<h2>Hi {{user_name}},</h2><p>Your trial expires in <strong>{{days_left}} days</strong>.</p><p><a href="{{upgrade_link}}">Upgrade Now</a></p>',
          textContent: 'Hi {{user_name}}, Your trial expires in {{days_left}} days. Upgrade: {{upgrade_link}}',
          variables: [
            { name: 'user_name', description: 'User display name', required: true },
            { name: 'days_left', description: 'Days left in trial', required: true },
            { name: 'upgrade_link', description: 'Upgrade URL', required: true }
          ],
          category: 'billing',
          isActive: true,
          isDefault: true
        },
        {
          name: 'password_reset',
          displayName: 'Password Reset Request',
          subject: 'Reset Your Password',
          htmlContent: '<h2>Password Reset</h2><p>Hi {{user_name}},</p><p><a href="{{reset_link}}">Reset Password</a></p><p>Expires in {{expiry_time}}.</p>',
          textContent: 'Hi {{user_name}}, Reset your password: {{reset_link}} (Expires in {{expiry_time}})',
          variables: [
            { name: 'user_name', description: 'User display name', required: true },
            { name: 'reset_link', description: 'Password reset URL', required: true },
            { name: 'expiry_time', description: 'Link expiry time', required: true }
          ],
          category: 'user_management',
          isActive: true,
          isDefault: true
        }
      ];
      
      for (const template of templates) {
        await EmailTemplate.create(template);
        console.log('✅ Created email template:', template.name);
      }
      console.log('✅ All email templates created');
    } else {
      console.log('✅ Email templates already exist');
    }

    // Create PaymentGateway collection with sample gateways
    const gatewayExists = await PaymentGateway.countDocuments();
    if (gatewayExists === 0) {
      const gateways = [
        {
          name: 'razorpay',
          displayName: 'Razorpay',
          description: 'Accept payments through Razorpay with UPI, Cards, NetBanking',
          isActive: true,
          isDefault: true,
          config: {
            supportedCurrencies: ['INR', 'USD'],
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
            totalTransactions: 0,
            totalVolume: 0,
            failureRate: 2.9
          },
          status: {
            connectionStatus: 'disconnected',
            healthCheckInterval: 300000
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
          name: 'cashfree',
          displayName: 'Cashfree',
          description: 'Accept payments through Cashfree with competitive rates',
          isActive: false,
          isDefault: false,
          config: {
            supportedCurrencies: ['INR'],
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
            healthCheckInterval: 300000
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
          name: 'phonepe',
          displayName: 'PhonePe',
          description: 'Accept payments through PhonePe - Popular in India',
          isActive: false,
          isDefault: false,
          config: {
            supportedCurrencies: ['INR'],
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
            healthCheckInterval: 300000
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
      ];
      
      for (const gateway of gateways) {
        await PaymentGateway.create(gateway);
        console.log('✅ Created payment gateway:', gateway.displayName);
      }
      console.log('✅ All payment gateways created');
    } else {
      console.log('✅ Payment gateways already exist');
    }

    console.log('✅ Admin collections seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin collections:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAdminCollections();
}

module.exports = seedAdminCollections; 