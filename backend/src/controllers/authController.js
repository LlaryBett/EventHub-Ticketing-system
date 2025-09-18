const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Order = require('../models/Order'); // Assuming you have an Order model
const IssuedTicket = require('../models/IssuedTicket');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Send response with token
const sendTokenResponse = (user, statusCode, res, userType, migratedCount = 0) => {
  const token = generateToken(user._id, userType);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Remove sensitive data
  user.password = undefined;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    userType,
    migratedCount, // 🔄 how many guest orders were linked
    data: {
      ...user._doc,   // includes all mongoose fields
      id: user._id    // add plain `id` for frontend convenience
    }
  });
};


// @desc    Register attendee during checkout
// @route   POST /api/auth/register/checkout
// @access  Public
exports.registerAtCheckout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, they should login instead
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email. Please log in.'
      });
    }

    // Create user with minimal required fields
    const user = await User.create({
      email,
      password,
      userType: 'attendee',
      status: 'active'
    });

    // If there's a temporary order associated with this email, link it to the new user
    if (req.body.tempOrderId) {
      await Order.updateOne(
        { _id: req.body.tempOrderId, customerEmail: email },
        { userId: user._id, isGuestOrder: false }
      );
    }

    sendTokenResponse(user, 201, res, 'attendee');
  } catch (error) {
    console.error('Register at checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Login user during checkout
// @route   POST /api/auth/login/checkout
// @access  Public
exports.loginAtCheckout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, tempOrderId } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    // If there's a temporary order associated with this email, link it to the user
    if (tempOrderId) {
      await Order.updateOne(
        { _id: tempOrderId, customerEmail: email },
        { userId: user._id, isGuestOrder: false }
      );
    }

    sendTokenResponse(user, 200, res, user.userType);
  } catch (error) {
    console.error('Login at checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Convert guest order to registered account
// @route   POST /api/auth/claim-account
// @access  Public
exports.claimAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, orderId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email. Please log in.'
      });
    }

    // Find the guest order
    const order = await Order.findOne({ 
      _id: orderId, 
      customerEmail: email, 
      isGuestOrder: true 
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No guest order found with this email and order ID'
      });
    }

    // Create user account
    const user = await User.create({
      email,
      password,
      name: order.customerName, // If you collected name during checkout
      userType: 'attendee',
      status: 'active'
    });

    // Link the order to the new user account
    order.userId = user._id;
    order.isGuestOrder = false;
    await order.save();

    sendTokenResponse(user, 201, res, 'attendee');
  } catch (error) {
    console.error('Claim account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Register attendee
// @route   POST /api/auth/register/attendee
// @access  Public
exports.registerAttendee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, acceptTerms, marketingConsent } = req.body;

    console.log('➡️ Registering new attendee:', { name, email, phone });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists with this email:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      userType: 'attendee',
      acceptTerms,
      marketingConsent: marketingConsent || false,
      status: 'active'
    });
    console.log('✅ User created:', user._id);

    // Guest order migration
    let migratedCount = 0;
    const guestOrders = await Order.find({
      customerEmail: email,
      isGuestOrder: true,
      convertedToUser: false
    });

    console.log(`🔍 Found ${guestOrders.length} guest orders to migrate for ${email}`);

    if (guestOrders.length > 0) {
      await Promise.all(
        guestOrders.map(async (order) => {
          console.log('📝 Migrating guest order:', order._id);
          console.log('📦 Order items before migration:', JSON.stringify(order.items, null, 2));

          // Optional: skip orders with missing tickets
          order.items.forEach((item, index) => {
            if (!item.ticket) {
              console.warn(`⚠️ Order ${order._id} item[${index}] missing ticket:`, item);
            }
          });

          order.isGuestOrder = false;
          order.convertedToUser = true;
          order.userId = user._id;
          order.hasAccount = true;

          // Save with validation disabled to avoid errors on missing tickets
          await order.save({ validateBeforeSave: false });

          // Migrate issued tickets
          await IssuedTicket.updateMany(
            { orderId: order._id, userId: null },
            { $set: { userId: user._id } }
          );
        })
      );

      migratedCount = guestOrders.length;
      console.log(`✅ Migrated ${migratedCount} guest orders for ${email}`);

      // Create notification
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Guest Orders Migrated',
        message: `We successfully migrated ${migratedCount} of your guest orders to your new account.`,
        read: false
      });
    }

    // Send token response
    sendTokenResponse(user, 201, res, 'attendee', migratedCount);

  } catch (error) {
    console.error('🔥 Register attendee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};



// @desc    Send account claim email
// @route   POST /api/auth/send-claim-email
// @access  Public
exports.sendClaimEmail = async (req, res, next) => {
  try {
    const { email, orderId } = req.body;

    // Find the guest order
    const order = await Order.findOne({ 
      _id: orderId, 
      customerEmail: email, 
      isGuestOrder: true 
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No guest order found with this email and order ID'
      });
    }

    // Generate claim token
    const claimToken = crypto.randomBytes(20).toString('hex');
    
    // Set claim token and expiration (24 hours)
    order.accountClaimToken = claimToken;
    order.accountClaimExpires = Date.now() + 24 * 60 * 60 * 1000;
    await order.save();

    // Create claim URL
    const claimUrl = `${req.protocol}://${req.get('host')}/claim-account?token=${claimToken}&email=${email}`;

    // Email message
    const message = `
      <h2>Claim Your EventHub Account</h2>
      <p>Thank you for your purchase! To access your tickets and manage your orders, please create an account using the link below:</p>
      <a href="${claimUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Create Account</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not make this purchase, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'Claim Your EventHub Account',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Account claim email sent successfully'
      });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Send claim email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Validate account claim token
// @route   GET /api/auth/validate-claim-token
// @access  Public
exports.validateClaimToken = async (req, res, next) => {
  try {
    const { token, email } = req.query;

    const order = await Order.findOne({
      customerEmail: email,
      accountClaimToken: token,
      accountClaimExpires: { $gt: Date.now() }
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired claim token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { orderId: order._id, email }
    });
  } catch (error) {
    console.error('Validate claim token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};


// @desc    Register organizer (step 1 - personal info)
// @route   POST /api/auth/register/organizer/step1
// @access  Public
exports.registerOrganizerStep1 = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, isUpgrade = false } = req.body;

    // For new registrations, check if user already exists
    if (!isUpgrade) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }
    } else {
      // For upgrades, verify the user exists and is an attendee
      const existingUser = await User.findOne({ email, userType: 'attendee' });
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          message: 'No attendee account found with this email'
        });
      }
      
      // Check if user already has an organizer profile
      const existingOrganizer = await Organizer.findOne({ userId: existingUser._id });
      if (existingOrganizer) {
        return res.status(400).json({
          success: false,
          message: 'You already have an organizer account'
        });
      }
    }

    // Store step 1 data in session
    req.session.organizerStep1 = {
      name,
      email,
      password,
      phone,
      isUpgrade,
      timestamp: Date.now()
    };

    res.status(200).json({
      success: true,
      message: 'Step 1 completed successfully',
      data: { email, isUpgrade }
    });
  } catch (error) {
    console.error('Organizer step 1 error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Register organizer (step 2 - business info)
// @route   POST /api/auth/register/organizer/step2
// @access  Public
exports.registerOrganizerStep2 = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if step 1 data exists
    if (!req.session.organizerStep1) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 1 first'
      });
    }

    const {
      organizationName,
      businessType,
      businessAddress,
      city,
      state,
      zipCode,
      taxId,
      website,
      acceptTerms,
      marketingConsent
    } = req.body;

    const step1Data = req.session.organizerStep1;
    let user;

    if (step1Data.isUpgrade) {
      // Upgrade scenario: user already exists as attendee
      user = await User.findOne({ email: step1Data.email, userType: 'attendee' });
      
      if (!user) {
        delete req.session.organizerStep1;
        return res.status(400).json({
          success: false,
          message: 'Attendee account not found'
        });
      }

      // Update user to organizer type
      user.userType = 'organizer';
      user.acceptTerms = acceptTerms;
      user.marketingConsent = marketingConsent;
      user.status = 'pending_verification';
      await user.save();

    } else {
      // New registration scenario
      const existingUser = await User.findOne({ email: step1Data.email });
      if (existingUser) {
        delete req.session.organizerStep1;
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Create new user with organizer role
      user = await User.create({
        name: step1Data.name,
        email: step1Data.email,
        password: step1Data.password,
        phone: step1Data.phone,
        userType: 'organizer',
        acceptTerms,
        marketingConsent,
        status: 'pending_verification'
      });
    }

    // Create organizer profile
    const organizer = await Organizer.create({
      userId: user._id,
      organizationName,
      businessType,
      businessAddress,
      city,
      state,
      zipCode,
      taxId: taxId || null,
      website: website || null,
      verificationStatus: 'pending',
      approvalStatus: 'pending',
      upgradedFromAttendee: step1Data.isUpgrade
    });

    // Send approval notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: 'New Organizer Application',
        html: `
          <h2>New Organizer Application</h2>
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Contact:</strong> ${step1Data.name} (${step1Data.email})</p>
          <p><strong>Business Type:</strong> ${businessType}</p>
          <p><strong>Address:</strong> ${businessAddress}, ${city}, ${state} ${zipCode}</p>
          <p><strong>Type:</strong> ${step1Data.isUpgrade ? 'Upgrade from attendee' : 'New registration'}</p>
          <p>Please review this application in the admin panel.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    // Send confirmation email to user
    try {
      const subject = step1Data.isUpgrade 
        ? 'Organizer Upgrade Application Received'
        : 'Organizer Application Received';

      const message = step1Data.isUpgrade
        ? `<p>Dear ${step1Data.name},</p>
           <p>We've received your application to upgrade your EventHub account to an organizer account for <strong>${organizationName}</strong>.</p>`
        : `<p>Dear ${step1Data.name},</p>
           <p>We've received your application to become an EventHub organizer for <strong>${organizationName}</strong>.</p>`;

      await sendEmail({
        to: step1Data.email,
        subject: subject,
        html: `
          <h2>Thank you for your application!</h2>
          ${message}
          <p>Our team will review your application within 2-3 business days. You'll receive an email notification once your account has been approved.</p>
          <p>If you have any questions, please contact our support team.</p>
          <br>
          <p>Best regards,<br>The EventHub Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Clear session data
    delete req.session.organizerStep1;

    res.status(201).json({
      success: true,
      message: step1Data.isUpgrade 
        ? 'Organizer upgrade application submitted successfully. You will receive an email once your account is approved.'
        : 'Organizer application submitted successfully. You will receive an email once your account is approved.',
      data: {
        userId: user._id,
        organizerId: organizer._id,
        status: 'pending_verification',
        isUpgrade: step1Data.isUpgrade
      }
    });
  } catch (error) {
    console.error('Organizer step 2 error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // ✅ Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 🔍 Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 🔑 Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 👤 If organizer, check approval
    if (user.userType === 'organizer') {
      const organizer = await Organizer.findOne({ userId: user._id });
      if (organizer && organizer.approvalStatus !== 'approved') {
        return res.status(401).json({
          success: false,
          message:
            'Your organizer account is pending approval. Please wait for admin verification.'
        });
      }
    }

    // 🚫 Check account status
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    // 🔗 Guest order migration (safe for both attendees & organizers)
    let migratedCount = 0;
    const guestOrders = await Order.find({
      customerEmail: email,
      isGuestOrder: true,
      convertedToUser: false
    });

    if (guestOrders.length > 0) {
      await Promise.all(
        guestOrders.map(async (order) => {
          console.log(`➡️ Migrating guest order ${order.orderNumber} for ${email}`);

          order.isGuestOrder = false;
          order.convertedToUser = true;
          order.userId = user._id;
          order.hasAccount = true; // keep consistent

          const updated = await order.save();
          console.log(`✅ Migrated order ${updated.orderNumber}, now linked to user ${user._id}`);
          return updated;
        })
      );
      migratedCount = guestOrders.length;
    }

    // 🔍 Fetch ALL orders for this email or userId
    const allOrders = await Order.find({
      $or: [
        { customerEmail: email },
        { userId: user._id }
      ]
    });

    console.log(`📦 Orders for ${email}:`, allOrders);

    // 🎟️ Send token + include migrated orders info
    sendTokenResponse(user, 200, res, user.userType, migratedCount);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};






// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    // Email message
    const message = `
      <h2>Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested a password reset for your EventHub account.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This reset token is valid for 10 minutes.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Email sent with password reset instructions'
      });
    } catch (error) {
      console.error('Email send error:', error);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, user.userType);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, user.userType);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let userData = await User.findById(req.user.id);

    // If user is organizer, include organizer profile
    if (req.user.userType === 'organizer') {
      const organizerProfile = await Organizer.findOne({ userId: req.user.id });
      userData = userData.toObject();
      userData.organizerProfile = organizerProfile;
    }

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};