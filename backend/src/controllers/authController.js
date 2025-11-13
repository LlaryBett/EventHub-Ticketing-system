const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Order = require('../models/Order');
const IssuedTicket = require('../models/IssuedTicket');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { 
  sendAccountClaimEmail, 
  sendPasswordResetEmail, 
  sendOrganizerApplicationConfirmation, 
  sendOrganizerApplicationNotification 
} = require('../utils/emailService');
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
    migratedCount,
    data: {
      ...user._doc,
      id: user._id
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
      name: order.customerName,
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

          order.isGuestOrder = false;
          order.convertedToUser = true;
          order.userId = user._id;
          order.hasAccount = true;

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

    try {
      await sendAccountClaimEmail(email, claimUrl);

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

    const { name, email, password, phone } = req.body;

    // Check if user exists with this email
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      if (existingUser.userType === 'organizer') {
        return res.status(400).json({
          success: false,
          message: 'You already have an organizer account'
        });
      }
      
      if (existingUser.userType === 'attendee') {
        if (existingUser.name !== name) {
          return res.status(400).json({
            success: false,
            message: 'Name does not match your attendee account'
          });
        }

        const existingOrganizer = await Organizer.findOne({ userId: existingUser._id });
        if (existingOrganizer) {
          return res.status(400).json({
            success: false,
            message: 'You already have an organizer account'
          });
        }

        req.session.organizerStep1 = {
          name,
          email,
          password: undefined,
          phone: phone || existingUser.phone,
          isUpgrade: true,
          existingUserId: existingUser._id,
          timestamp: Date.now()
        };

        return res.status(200).json({
          success: true,
          message: 'Step 1 completed successfully (upgrade from attendee)',
          data: { email, isUpgrade: true }
        });
      }
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for new registration'
      });
    }

    const tempToken = jwt.sign(
      { 
        email: email,
        timestamp: Date.now(),
        registrationType: 'organizer_step1'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    req.session.organizerStep1 = {
      name,
      email,
      password,
      phone,
      isUpgrade: false,
      existingUserId: undefined,
      timestamp: Date.now()
    };

    res.status(200).json({
      success: true,
      message: 'Step 1 completed successfully (new registration)',
      data: { 
        email, 
        isUpgrade: false 
      },
      token: tempToken
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

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.registrationType !== 'organizer_step1') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired registration session'
      });
    }

    if (!req.session.organizerStep1) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 1 first'
      });
    }

    const SESSION_TIMEOUT = 30 * 60 * 1000;
    if (Date.now() - req.session.organizerStep1.timestamp > SESSION_TIMEOUT) {
      delete req.session.organizerStep1;
      return res.status(400).json({
        success: false,
        message: 'Session expired. Please start over.'
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
      user = await User.findById(step1Data.existingUserId);
      
      if (!user || user.userType !== 'attendee') {
        delete req.session.organizerStep1;
        return res.status(400).json({
          success: false,
          message: 'Attendee account not found'
        });
      }

      user.userType = 'organizer';
      user.acceptTerms = acceptTerms;
      user.marketingConsent = marketingConsent;
      user.status = 'pending_verification';
      user.phone = step1Data.phone;
      await user.save();

    } else {
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

    // Send admin notification
    try {
      await sendOrganizerApplicationNotification(
        process.env.ADMIN_EMAIL || 'admin@example.com',
        {
          name: step1Data.name,
          email: step1Data.email,
          organizationName,
          businessType,
          businessAddress,
          city,
          state,
          zipCode,
          isUpgrade: step1Data.isUpgrade
        }
      );
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    // Send user confirmation
    try {
      await sendOrganizerApplicationConfirmation(
        step1Data.email,
        step1Data.name,
        organizationName,
        step1Data.isUpgrade
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

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
    console.log("📥 Incoming login request:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`❌ No user found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`❌ Invalid password for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      console.log(`🚫 Blocked login: user ${user._id} status is '${user.status}'`);
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    let isApprovedOrganizer = false;
    let organizerApprovalStatus = 'not-applicable';
    let canAccessOrganizerFeatures = false;

    if (user.userType === 'organizer') {
      console.log(`🔍 Checking organizer approval for user ${user._id}`);
      const organizer = await Organizer.findOne({ userId: user._id });
      
      if (organizer) {
        organizerApprovalStatus = organizer.approvalStatus;
        isApprovedOrganizer = organizer.approvalStatus === 'approved';
        
        user.isApprovedOrganizer = isApprovedOrganizer;
        await user.save({ validateBeforeSave: false });
        
        canAccessOrganizerFeatures = (user.status === 'active' && isApprovedOrganizer);
        
        console.log(`📌 Organizer ${user._id} - Status: ${user.status}, Approval: ${organizerApprovalStatus}, CanAccessFeatures: ${canAccessOrganizerFeatures}`);
      }
    }

    let migratedCount = 0;
    const guestOrders = await Order.find({
      customerEmail: email,
      isGuestOrder: true,
      convertedToUser: false
    });
    console.log(`📦 Found ${guestOrders.length} guest orders for ${email}`);

    if (guestOrders.length > 0) {
      await Promise.all(
        guestOrders.map(async (order) => {
          console.log(`➡️ Migrating guest order ${order.orderNumber} for ${email}`);

          order.isGuestOrder = false;
          order.convertedToUser = true;
          order.userId = user._id;
          order.hasAccount = true;

          const updated = await order.save();
          console.log(`✅ Migrated order ${updated.orderNumber}, now linked to user ${user._id}`);
          return updated;
        })
      );
      migratedCount = guestOrders.length;
    }

    const allOrders = await Order.find({
      $or: [
        { customerEmail: email },
        { userId: user._id }
      ]
    });
    console.log(`📦 Total orders for ${email}:`, allOrders.length);

    const token = user.getSignedJwtToken();
    console.log(`🔑 JWT generated for user ${user._id}`);

    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    await user.updateLoginStats();
    console.log(`📊 Updated login stats for user ${user._id}`);

    res
      .status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          status: user.status,
          isApprovedOrganizer,
          organizerApprovalStatus,
          canAccessOrganizerFeatures
        },
        migratedOrders: migratedCount,
        message: getLoginMessage(user, isApprovedOrganizer, canAccessOrganizerFeatures)
      });

  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Helper function for login messages
function getLoginMessage(user, isApprovedOrganizer, canAccessOrganizerFeatures) {
  if (user.userType === 'organizer') {
    if (isApprovedOrganizer) {
      return 'Login successful. Your organizer account is active.';
    }
    return 'Login successful. Your organizer application is under review.';
  }
  
  if (user.status === 'pending_verification') {
    return 'Login successful. Your account is pending verification.';
  }
  
  return 'Login successful';
}

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

    try {
      await sendPasswordResetEmail(user.email, resetUrl);

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