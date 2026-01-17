const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }
  
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        attachments
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      
      return info;
    } catch (error) {
      logger.error('Email send error:', error);
      throw error;
    }
  }
  
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${config.appUrl}/auth/verify-email?token=${token}`;
    
    const html = `
      <h1>Verify Your Email</h1>
      <p>Welcome to Anga Systems ERP! Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>If you didn't create an account, you can ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `;
    
    return this.sendEmail(email, 'Verify Your Email - Anga Systems ERP', html);
  }
  
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${config.appUrl}/auth/reset-password?token=${token}`;
    
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;
    
    return this.sendEmail(email, 'Password Reset - Anga Systems ERP', html);
  }
  
  async sendInvoiceEmail(clientEmail, invoice) {
    const html = `
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>Dear ${invoice.client.companyName},</p>
      <p>Please find attached your invoice for services rendered.</p>
      
      <h3>Invoice Details:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Issue Date:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.issueDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${invoice.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
      
      <p>You can view and pay this invoice by logging into your client portal.</p>
      <p>Thank you for your business!</p>
    `;
    
    // In a real implementation, you would generate and attach a PDF invoice
    const attachments = []; // Add PDF attachment here
    
    return this.sendEmail(clientEmail, `Invoice ${invoice.invoiceNumber} - Anga Systems`, html, attachments);
  }
  
  async sendWelcomeEmail(email, username, password) {
    const html = `
      <h1>Welcome to Anga Systems ERP!</h1>
      <p>Your account has been created successfully.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately.</p>
      <a href="${config.appUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px;">
        Log In Now
      </a>
      <p>For security reasons, please do not share your credentials.</p>
    `;
    
    return this.sendEmail(email, 'Welcome to Anga Systems ERP', html);
  }
  
  async sendTicketUpdateEmail(email, ticket, update) {
    const html = `
      <h1>Ticket Update: ${ticket.title}</h1>
      <p>Ticket ID: ${ticket.ticketId}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Update:</strong> ${update.description}</p>
      <p>You can view the full ticket details in your client portal.</p>
      <p>Thank you,<br>Anga Systems Support Team</p>
    `;
    
    return this.sendEmail(email, `Update on Ticket ${ticket.ticketId}`, html);
  }
}

module.exports = new EmailService();