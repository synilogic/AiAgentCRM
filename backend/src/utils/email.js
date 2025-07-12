const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (email) => ({
    subject: 'Welcome to WhatsApp CRM Platform',
    html: `
      <h2>Welcome to WhatsApp CRM Platform!</h2>
      <p>Hi there,</p>
      <p>Thank you for registering with our WhatsApp CRM Platform. We're excited to help you streamline your lead management and customer engagement.</p>
      <p>Get started by:</p>
      <ul>
        <li>Connecting your WhatsApp account</li>
        <li>Setting up your knowledge base for AI replies</li>
        <li>Configuring automated follow-ups</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The WhatsApp CRM Team</p>
    `
  }),
  
  forgotPassword: (email, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi there,</p>
      <p>You requested a password reset for your WhatsApp CRM Platform account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <p>Best regards,<br>The WhatsApp CRM Team</p>
    `
  }),
  
  verification: (email, verificationToken) => ({
    subject: 'Email Verification',
    html: `
      <h2>Verify Your Email</h2>
      <p>Hi there,</p>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>Best regards,<br>The WhatsApp CRM Team</p>
    `
  })
};

// Email sending functions
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail: async (to) => {
    const template = emailTemplates.welcome(to);
    return await sendEmail(to, template.subject, template.html);
  },
  
  sendForgotPasswordEmail: async (to, resetToken) => {
    const template = emailTemplates.forgotPassword(to, resetToken);
    return await sendEmail(to, template.subject, template.html);
  },
  
  sendVerificationEmail: async (to, verificationToken) => {
    const template = emailTemplates.verification(to, verificationToken);
    return await sendEmail(to, template.subject, template.html);
  }
}; 