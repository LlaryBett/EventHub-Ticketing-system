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
  // Extract token from URL if it's an API URL, and convert to frontend URL
  let frontendResetUrl = resetUrl;
  
  if (resetUrl.includes('/api/auth/resetpassword/')) {
    const token = resetUrl.split('/api/auth/resetpassword/')[1];
    frontendResetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log('🔄 Converted API URL to frontend URL:', frontendResetUrl);
  }

  const html = `
    <h2>Password Reset Request</h2>
    <p>You are receiving this email because you (or someone else) has requested a password reset for your EventHub account.</p>
    <p>Please click on the following link to reset your password:</p>
    <a href="${frontendResetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
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

// Send organizer welcome email (for admin-created organizers)
const sendOrganizerWelcomeEmail = async ({ to, name, organizationName, loginLink, completeProfileLink }) => {
  console.log('🔔 sendOrganizerWelcomeEmail triggered for:', to, organizationName);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5; margin-bottom: 20px;">Welcome to EventHub, ${name}!</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Your organizer account has been created by the EventHub admin team for <strong>${organizationName}</strong>.
      </p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
        <h3 style="margin-top: 0; color: #374151;">Next Steps:</h3>
        <ol style="line-height: 1.8; color: #4B5563;">
          <li><strong>Verify your email:</strong> Check your inbox for a verification email</li>
          <li><strong>Complete your profile:</strong> Fill out your business information</li>
          <li><strong>Get verified:</strong> Our team will review and verify your organizer account</li>
          <li><strong>Start creating events!</strong></li>
        </ol>
      </div>
      
      <div style="margin: 30px 0;">
        <a href="${loginLink}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;
                  font-weight: 600; margin-right: 10px;">
          Log In to EventHub
        </a>
        
        <a href="${completeProfileLink}" 
           style="background-color: #10B981; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;
                  font-weight: 600;">
          Complete Your Profile
        </a>
      </div>
      
      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6B7280; font-size: 14px;">
          <strong>Important:</strong> You must complete your business profile before creating events.
        </p>
        <p style="color: #9CA3AF; font-size: 13px; margin-top: 5px;">
          Organization: ${organizationName}
        </p>
      </div>
      
      <p style="color: #6B7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        This is an automated message from EventHub. Please do not reply to this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: 'Welcome as an Organizer on EventHub!',
    html
  });
};

// Send organizer verification email
const sendOrganizerVerificationEmail = async ({ to, name, organizationName, status, notes }) => {
  let subject, html;
  
  if (status === 'verified') {
    subject = 'Your Organizer Application Has Been Approved';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Congratulations, ${name}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Your organizer application for <strong>${organizationName}</strong> has been approved! 🎉
        </p>
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3 style="margin-top: 0; color: #065F46;">You're Ready to Go!</h3>
          <p style="color: #065F46;">
            You can now create and manage events on our platform. Log in to start organizing amazing events!
          </p>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <br>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `;
  } else if (status === 'rejected') {
    subject = 'Your Organizer Application Was Rejected';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Application Status Update</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          We regret to inform you that your organizer application for <strong>${organizationName}</strong> was rejected.
        </p>
        ${notes ? `
        <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
          <h4 style="margin-top: 0; color: #991B1B;">Reason:</h4>
          <p style="color: #991B1B; white-space: pre-wrap;">${notes}</p>
        </div>
        ` : ''}
        <p>If you have questions or would like to appeal this decision, please contact our support team.</p>
        <br>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `;
  } else if (status === 'suspended') {
    subject = 'Your Organizer Account Has Been Suspended';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Account Suspension Notice</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Your organizer account for <strong>${organizationName}</strong> has been suspended.
        </p>
        ${notes ? `
        <div style="background-color: #FFFBEB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h4 style="margin-top: 0; color: #92400E;">Reason:</h4>
          <p style="color: #92400E; white-space: pre-wrap;">${notes}</p>
        </div>
        ` : ''}
        <p>Please contact support for more information about this suspension.</p>
        <br>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `;
  } else {
    return;
  }
  
  return await sendEmail({
    to,
    subject,
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

module.exports = {
  sendEmail,
  sendAccountClaimEmail,
  sendPasswordResetEmail,
  sendOrganizerApplicationConfirmation,
  sendOrganizerApplicationNotification,
  sendOrganizerVerificationEmail,
  sendOrganizerWelcomeEmail, // NEW FUNCTION ADDED
  sendContactConfirmation,
  sendContactNotification,
  sendContactResponse
};