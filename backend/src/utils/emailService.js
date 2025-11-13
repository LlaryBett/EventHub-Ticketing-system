const nodemailer = require('nodemailer');

// Create transporter for Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email server connection error:', error);
  } else {
    console.log('✅ Email server is ready to take our messages');
  }
});

// Generic send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'llarykiplangat@gmail.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
};

// Send account claim email
const sendAccountClaimEmail = async (email, claimUrl) => {
  const html = `
    <h2>Claim Your EventHub Account</h2>
    <p>Thank you for your purchase! To access your tickets and manage your orders, please create an account using the link below:</p>
    <a href="${claimUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Create Account</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not make this purchase, please ignore this email.</p>
  `;

  return await sendEmail({
    to: email,
    subject: 'Claim Your EventHub Account',
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>You are receiving this email because you (or someone else) has requested a password reset for your EventHub account.</p>
    <p>Please click on the following link to reset your password:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>This reset token is valid for 10 minutes.</p>
  `;

  return await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html
  });
};

// Send organizer application confirmation
const sendOrganizerApplicationConfirmation = async (email, name, organizationName, isUpgrade = false) => {
  const subject = isUpgrade 
    ? 'Organizer Upgrade Application Received'
    : 'Organizer Application Received';

  const message = isUpgrade
    ? `<p>Dear ${name},</p>
       <p>We've received your application to upgrade your EventHub account to an organizer account for <strong>${organizationName}</strong>.</p>`
    : `<p>Dear ${name},</p>
       <p>We've received your application to become an EventHub organizer for <strong>${organizationName}</strong>.</p>`;

  const html = `
    <h2>Thank you for your application!</h2>
    ${message}
    <p>Our team will review your application within 2-3 business days. You'll receive an email notification once your account has been approved.</p>
    <p>If you have any questions, please contact our support team.</p>
    <br>
    <p>Best regards,<br>The EventHub Team</p>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
};

// Send organizer application notification to admin
const sendOrganizerApplicationNotification = async (adminEmail, applicationData) => {
  const { name, email, organizationName, businessType, businessAddress, city, state, zipCode, isUpgrade } = applicationData;

  const html = `
    <h2>New Organizer Application</h2>
    <p><strong>Organization:</strong> ${organizationName}</p>
    <p><strong>Contact:</strong> ${name} (${email})</p>
    <p><strong>Business Type:</strong> ${businessType}</p>
    <p><strong>Address:</strong> ${businessAddress}, ${city}, ${state} ${zipCode}</p>
    <p><strong>Type:</strong> ${isUpgrade ? 'Upgrade from attendee' : 'New registration'}</p>
    <p>Please review this application in the admin panel.</p>
  `;

  return await sendEmail({
    to: adminEmail,
    subject: 'New Organizer Application',
    html
  });
};

// Send contact form confirmation email to user
const sendContactConfirmation = async (email, { name, subject, category, referenceId }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for contacting us!</h2>
      <p>Dear ${name},</p>
      <p>We have received your message and will get back to you within 24 hours.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Message Details:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
      </div>
      
      <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
      
      <p>Best regards,<br>The EventHub Team</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'Message Received - We\'ll be in touch soon!',
    html
  });
};

// Send contact form notification to admin
const sendContactNotification = async ({ name, email, phone, subject, message, category, referenceId }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Contact Details:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
      </div>
      
      <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Subject:</h3>
        <p>${subject}</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <p><small>This is an automated notification from your EventHub contact form.</small></p>
    </div>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'llarykiplangat@gmail.com';

  return await sendEmail({
    to: adminEmail,
    subject: `New Contact Form: ${subject}`,
    html
  });
};

// Send response email to user when admin resolves their inquiry
const sendContactResponse = async (email, { name, subject, response, referenceId }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Response to Your Inquiry</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your patience. We have reviewed your inquiry and here is our response:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Original Subject:</h3>
        <p>${subject}</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
      </div>
      
      <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Our Response:</h3>
        <p style="white-space: pre-wrap;">${response}</p>
      </div>
      
      <p>If you have any follow-up questions, please don't hesitate to contact us again.</p>
      
      <p>Best regards,<br>The EventHub Team</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Re: ${subject}`,
    html
  });
};

// Send organizer verification email
const sendOrganizerVerificationEmail = async ({ to, name, organizationName, status, notes }) => {
  let subject, text;
  if (status === 'verified') {
    subject = 'Your Organizer Application Has Been Approved';
    text = `Hello ${name},\n\nCongratulations! Your organizer application for "${organizationName}" has been approved. You can now create and manage events on our platform.\n\nBest regards,\nE-Ticket Team`;
  } else if (status === 'rejected') {
    subject = 'Your Organizer Application Was Rejected';
    text = `Hello ${name},\n\nWe regret to inform you that your organizer application for "${organizationName}" was rejected.${notes ? `\n\nReason: ${notes}` : ''}\n\nIf you have questions, please contact support.\n\nBest regards,\nE-Ticket Team`;
  } else if (status === 'suspended') {
    subject = 'Your Organizer Account Has Been Suspended';
    text = `Hello ${name},\n\nYour organizer account for "${organizationName}" has been suspended.${notes ? `\n\nReason: ${notes}` : ''}\n\nPlease contact support for more information.\n\nBest regards,\nE-Ticket Team`;
  } else {
    return;
  }
  
  return await sendEmail({ to, subject, text });
};

module.exports = {
  sendEmail,
  sendAccountClaimEmail,
  sendPasswordResetEmail,
  sendOrganizerApplicationConfirmation,
  sendOrganizerApplicationNotification,
  sendOrganizerVerificationEmail,
  sendContactConfirmation,
  sendContactNotification,
  sendContactResponse
};