const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // Create a new order
  async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);
      
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status
        }
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a subscription
  async createSubscription(planId, customerId, startDate = null, totalCount = null) {
    try {
      const options = {
        plan_id: planId,
        customer_notify: 1,
        total_count: totalCount || 12, // Default to 12 months
        notes: {
          customer_id: customerId
        }
      };

      if (startDate) {
        options.start_at = Math.floor(new Date(startDate).getTime() / 1000);
      }

      const subscription = await this.razorpay.subscriptions.create(options);
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          plan_id: subscription.plan_id,
          status: subscription.status,
          current_start: subscription.current_start,
          current_end: subscription.current_end,
          total_count: subscription.total_count,
          paid_count: subscription.paid_count
        }
      };
    } catch (error) {
      console.error('Razorpay subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a customer
  async createCustomer(name, email, contact = null) {
    try {
      const options = {
        name: name,
        email: email
      };

      if (contact) {
        options.contact = contact;
      }

      const customer = await this.razorpay.customers.create(options);
      
      return {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          contact: customer.contact
        }
      };
    } catch (error) {
      console.error('Razorpay customer creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a plan
  async createPlan(name, amount, currency = 'INR', interval = 'monthly', intervalCount = 1) {
    try {
      const options = {
        period: interval,
        interval: intervalCount,
        item: {
          name: name,
          amount: amount * 100, // Convert to paise
          currency: currency
        },
        notes: {
          description: `${name} plan`
        }
      };

      const plan = await this.razorpay.plans.create(options);
      
      return {
        success: true,
        plan: {
          id: plan.id,
          name: plan.item.name,
          amount: plan.item.amount,
          currency: plan.item.currency,
          period: plan.period,
          interval: plan.interval
        }
      };
    } catch (error) {
      console.error('Razorpay plan creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return false;
    }
  }

  // Get payment details
  async getPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          order_id: payment.order_id,
          customer_id: payment.customer_id,
          created_at: payment.created_at
        }
      };
    } catch (error) {
      console.error('Razorpay payment fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          plan_id: subscription.plan_id,
          status: subscription.status,
          current_start: subscription.current_start,
          current_end: subscription.current_end,
          total_count: subscription.total_count,
          paid_count: subscription.paid_count,
          customer_id: subscription.customer_id
        }
      };
    } catch (error) {
      console.error('Razorpay subscription fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = false) {
    try {
      const options = {};
      if (cancelAtPeriodEnd) {
        options.cancel_at_period_end = true;
      }

      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId, options);
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          canceled_at: subscription.canceled_at
        }
      };
    } catch (error) {
      console.error('Razorpay subscription cancellation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Pause subscription
  async pauseSubscription(subscriptionId, pauseAt = null) {
    try {
      const options = {};
      if (pauseAt) {
        options.pause_at = Math.floor(new Date(pauseAt).getTime() / 1000);
      }

      const subscription = await this.razorpay.subscriptions.pause(subscriptionId, options);
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          paused_at: subscription.paused_at
        }
      };
    } catch (error) {
      console.error('Razorpay subscription pause error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId) {
    try {
      const subscription = await this.razorpay.subscriptions.resume(subscriptionId);
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status
        }
      };
    } catch (error) {
      console.error('Razorpay subscription resume error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all plans
  async getPlans() {
    try {
      const plans = await this.razorpay.plans.all();
      
      return {
        success: true,
        plans: plans.items.map(plan => ({
          id: plan.id,
          name: plan.item.name,
          amount: plan.item.amount,
          currency: plan.item.currency,
          period: plan.period,
          interval: plan.interval,
          created_at: plan.created_at
        }))
      };
    } catch (error) {
      console.error('Razorpay plans fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all customers
  async getCustomers() {
    try {
      const customers = await this.razorpay.customers.all();
      
      return {
        success: true,
        customers: customers.items.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          contact: customer.contact,
          created_at: customer.created_at
        }))
      };
    } catch (error) {
      console.error('Razorpay customers fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment link
  async createPaymentLink(amount, currency = 'INR', description = '', referenceId = null) {
    try {
      const options = {
        amount: amount * 100, // Convert to paise
        currency: currency,
        description: description,
        reference_id: referenceId || `ref_${Date.now()}`,
        callback_url: `${process.env.BASE_URL}/api/payments/webhook`,
        callback_method: 'get'
      };

      const paymentLink = await this.razorpay.paymentLink.create(options);
      
      return {
        success: true,
        paymentLink: {
          id: paymentLink.id,
          short_url: paymentLink.short_url,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          description: paymentLink.description,
          reference_id: paymentLink.reference_id
        }
      };
    } catch (error) {
      console.error('Razorpay payment link creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async processRefund(paymentId, amount = null, reason = null) {
    try {
      const options = {};
      if (amount) {
        options.amount = amount * 100; // Convert to paise
      }
      if (reason) {
        options.reason = reason;
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);
      
      return {
        success: true,
        refund: {
          id: refund.id,
          payment_id: refund.payment_id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason
        }
      };
    } catch (error) {
      console.error('Razorpay refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle webhook events
  async handleWebhook(event, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const eventType = event.event;
      const payload = event.payload;

      switch (eventType) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(payload.payment.entity);
        
        case 'subscription.activated':
          return await this.handleSubscriptionActivated(payload.subscription.entity);
        
        case 'subscription.charged':
          return await this.handleSubscriptionCharged(payload.subscription.entity);
        
        case 'subscription.cancelled':
          return await this.handleSubscriptionCancelled(payload.subscription.entity);
        
        case 'subscription.completed':
          return await this.handleSubscriptionCompleted(payload.subscription.entity);
        
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
          return { success: true, message: 'Event logged' };
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle payment captured event
  async handlePaymentCaptured(payment) {
    try {
      // Update payment status in database
      // await Payment.findOneAndUpdate(
      //   { razorpay_payment_id: payment.id },
      //   { 
      //     status: 'captured',
      //     captured_at: new Date(payment.captured_at * 1000)
      //   }
      // );

      return { success: true, message: 'Payment captured' };
    } catch (error) {
      console.error('Payment captured handling error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription activated event
  async handleSubscriptionActivated(subscription) {
    try {
      // Update subscription status in database
      // await Subscription.findOneAndUpdate(
      //   { razorpay_subscription_id: subscription.id },
      //   { 
      //     status: 'active',
      //     activated_at: new Date(subscription.start_at * 1000)
      //   }
      // );

      return { success: true, message: 'Subscription activated' };
    } catch (error) {
      console.error('Subscription activated handling error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription charged event
  async handleSubscriptionCharged(subscription) {
    try {
      // Create payment record for subscription charge
      // await Payment.create({
      //   subscription_id: subscription.id,
      //   amount: subscription.plan.amount,
      //   currency: subscription.plan.currency,
      //   status: 'captured'
      // });

      return { success: true, message: 'Subscription charged' };
    } catch (error) {
      console.error('Subscription charged handling error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription cancelled event
  async handleSubscriptionCancelled(subscription) {
    try {
      // Update subscription status in database
      // await Subscription.findOneAndUpdate(
      //   { razorpay_subscription_id: subscription.id },
      //   { 
      //     status: 'cancelled',
      //     cancelled_at: new Date(subscription.canceled_at * 1000)
      //   }
      // );

      return { success: true, message: 'Subscription cancelled' };
    } catch (error) {
      console.error('Subscription cancelled handling error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription completed event
  async handleSubscriptionCompleted(subscription) {
    try {
      // Update subscription status in database
      // await Subscription.findOneAndUpdate(
      //   { razorpay_subscription_id: subscription.id },
      //   { 
      //     status: 'completed',
      //     completed_at: new Date()
      //   }
      // );

      return { success: true, message: 'Subscription completed' };
    } catch (error) {
      console.error('Subscription completed handling error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get account details
  async getAccountDetails() {
    try {
      const account = await this.razorpay.accounts.fetch();
      
      return {
        success: true,
        account: {
          id: account.id,
          name: account.name,
          email: account.email,
          contact: account.contact,
          type: account.type
        }
      };
    } catch (error) {
      console.error('Razorpay account fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new RazorpayService(); 