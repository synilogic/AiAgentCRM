const axios = require('axios');

class PayPalService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      console.error('PayPal get access token error:', error);
      throw error;
    }
  }

  // Create a new subscription
  async createSubscription(user, plan) {
    try {
      const accessToken = await this.getAccessToken();

      // Create product if not exists
      const product = await this.createProduct(plan.name, plan.description);

      // Create billing plan
      const billingPlan = await this.createBillingPlan(product.id, plan);

      // Create subscription
      const subscriptionData = {
        plan_id: billingPlan.id,
        start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
        subscriber: {
          name: {
            given_name: user.name?.split(' ')[0] || user.email.split('@')[0],
            surname: user.name?.split(' ').slice(1).join(' ') || ''
          },
          email_address: user.email
        },
        application_context: {
          brand_name: 'AI Agent CRM',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v1/billing/subscriptions`,
        subscriptionData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        subscriptionId: response.data.id,
        approvalUrl: response.data.links.find(link => link.rel === 'approve').href,
        status: response.data.status
      };
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a one-time payment
  async createPayment(user, amount, currency, description) {
    try {
      const accessToken = await this.getAccessToken();

      const paymentData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toString()
          },
          description: description,
          custom_id: user._id.toString()
        }],
        application_context: {
          brand_name: 'AI Agent CRM',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        orderId: response.data.id,
        approvalUrl: response.data.links.find(link => link.rel === 'approve').href,
        status: response.data.status
      };
    } catch (error) {
      console.error('PayPal create payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update subscription (upgrade/downgrade)
  async updateSubscription(user, newPlan) {
    try {
      if (!user.subscription?.paypalSubscriptionId) {
        return {
          success: false,
          error: 'No active subscription found'
        };
      }

      const accessToken = await this.getAccessToken();

      // Create new billing plan
      const product = await this.createProduct(newPlan.name, newPlan.description);
      const billingPlan = await this.createBillingPlan(product.id, newPlan);

      // Revise subscription
      const revisionData = {
        plan_id: billingPlan.id,
        start_time: new Date(Date.now() + 60000).toISOString()
      };

      const response = await axios.post(
        `${this.baseURL}/v1/billing/subscriptions/${user.subscription.paypalSubscriptionId}/revise`,
        revisionData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        subscriptionId: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      console.error('PayPal update subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(user) {
    try {
      if (!user.subscription?.paypalSubscriptionId) {
        return {
          success: false,
          error: 'No active subscription found'
        };
      }

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v1/billing/subscriptions/${user.subscription.paypalSubscriptionId}/cancel`,
        {
          reason: 'User requested cancellation'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update user subscription in database
      const User = require('../models/User');
      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'canceled',
        'subscription.canceledAt': new Date()
      });

      return {
        success: true,
        subscriptionId: user.subscription.paypalSubscriptionId,
        status: 'canceled'
      };
    } catch (error) {
      console.error('PayPal cancel subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle webhook events
  async handleWebhook(payload, headers) {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(payload, headers);
      if (!isValid) {
        return { success: false, error: 'Invalid webhook signature' };
      }

      const event = payload;
      const User = require('../models/User');
      const Payment = require('../models/Payment');

      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(event.resource);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(event.resource);
          break;

        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(event.resource);
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentDenied(event.resource);
          break;

        default:
          console.log(`Unhandled PayPal event type: ${event.event_type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('PayPal webhook error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(payload, headers) {
    try {
      // In production, implement proper webhook signature verification
      // For now, return true for development
      return true;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Handle subscription activated
  async handleSubscriptionActivated(subscription) {
    try {
      const User = require('../models/User');
      const user = await User.findOne({ email: subscription.subscriber.email_address });
      if (!user) return;

      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'active',
        'subscription.paypalSubscriptionId': subscription.id,
        'subscription.currentPeriodEnd': new Date(subscription.billing_info.next_billing_time),
        'subscription.paypalCustomerId': subscription.subscriber.payer_id
      });
    } catch (error) {
      console.error('Handle subscription activated error:', error);
    }
  }

  // Handle subscription cancelled
  async handleSubscriptionCancelled(subscription) {
    try {
      const User = require('../models/User');
      const user = await User.findOne({ 'subscription.paypalSubscriptionId': subscription.id });
      if (!user) return;

      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'canceled',
        'subscription.canceledAt': new Date()
      });
    } catch (error) {
      console.error('Handle subscription cancelled error:', error);
    }
  }

  // Handle payment completed
  async handlePaymentCompleted(payment) {
    try {
      const User = require('../models/User');
      const Payment = require('../models/Payment');

      const user = await User.findOne({ 'subscription.paypalSubscriptionId': payment.supplementary_data.related_ids.subscription_id });
      if (!user) return;

      // Create payment record
      const paymentRecord = new Payment({
        user: user._id,
        gateway: 'paypal',
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency_code,
        status: 'completed',
        gatewayPaymentId: payment.id,
        gatewaySubscriptionId: payment.supplementary_data.related_ids.subscription_id,
        description: payment.description || 'PayPal payment',
        metadata: {
          paypalOrderId: payment.supplementary_data.related_ids.order_id,
          captureId: payment.id
        }
      });

      await paymentRecord.save();
    } catch (error) {
      console.error('Handle payment completed error:', error);
    }
  }

  // Handle payment denied
  async handlePaymentDenied(payment) {
    try {
      const User = require('../models/User');
      const Payment = require('../models/Payment');

      const user = await User.findOne({ 'subscription.paypalSubscriptionId': payment.supplementary_data.related_ids.subscription_id });
      if (!user) return;

      // Create payment record
      const paymentRecord = new Payment({
        user: user._id,
        gateway: 'paypal',
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency_code,
        status: 'failed',
        gatewayPaymentId: payment.id,
        gatewaySubscriptionId: payment.supplementary_data.related_ids.subscription_id,
        description: payment.description || 'PayPal payment',
        metadata: {
          failureReason: payment.status_details?.reason || 'Payment denied'
        }
      });

      await paymentRecord.save();

      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'past_due'
      });
    } catch (error) {
      console.error('Handle payment denied error:', error);
    }
  }

  // Create product
  async createProduct(name, description) {
    try {
      const accessToken = await this.getAccessToken();

      const productData = {
        name: name,
        description: description,
        type: 'SERVICE',
        category: 'SOFTWARE'
      };

      const response = await axios.post(
        `${this.baseURL}/v1/catalogs/products`,
        productData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  // Create billing plan
  async createBillingPlan(productId, plan) {
    try {
      const accessToken = await this.getAccessToken();

      const billingPlanData = {
        product_id: productId,
        name: plan.name,
        description: plan.description,
        type: 'FIXED',
        payment_definitions: [{
          name: 'Regular Payment',
          type: 'REGULAR',
          frequency: plan.interval === 'monthly' ? 'MONTH' : 'YEAR',
          frequency_interval: '1',
          amount: {
            currency: plan.currency.toUpperCase(),
            value: plan.price.toString()
          },
          cycles: '0'
        }],
        merchant_preferences: {
          setup_fee: {
            currency: plan.currency.toUpperCase(),
            value: '0'
          },
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          max_fail_attempts: '0',
          auto_bill_amount: 'YES',
          initial_fail_amount_action: 'CONTINUE',
          accepted_payment_type: 'INSTANT'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v1/payments/billing-plans`,
        billingPlanData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Activate the billing plan
      await axios.patch(
        `${this.baseURL}/v1/payments/billing-plans/${response.data.id}`,
        [{ op: 'replace', path: '/', value: { state: 'ACTIVE' } }],
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Create billing plan error:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        subscription: response.data
      };
    } catch (error) {
      console.error('Get subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture payment
  async capturePayment(orderId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        capture: response.data
      };
    } catch (error) {
      console.error('Capture payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayPalService(); 