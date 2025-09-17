const nodemailer = require('nodemailer');

// Create transporter for Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // Use TLS
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
  sendContactConfirmation,
  sendContactNotification,
  sendContactResponse
};