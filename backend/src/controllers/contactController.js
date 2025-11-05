const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');

// Submit contact form
exports.submitContactForm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message, category } = req.body;
    
    const contactData = {
      name,
      email,
      phone,
      subject,
      message,
      category,
      status: 'pending',
      submittedAt: new Date()
    };

    // Associate with user if logged in
    if (req.user) {
      contactData.user = req.user.id;
    }

    const contact = await Contact.create(contactData);

    // Get configuration for email templates
    const config = await Contact.getConfiguration();
    const businessRules = config?.businessRules || {};

    // Send confirmation email to user
    if (businessRules.autoResponder?.enabled) {
      try {
        await emailService.sendContactConfirmation(email, {
          name,
          subject,
          category,
          referenceId: contact._id,
          responseTime: businessRules.responseTime || '24 hours'
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    // Send notification to admin
    if (businessRules.notification?.enabled) {
      try {
        await emailService.sendContactNotification({
          name,
          email,
          phone,
          subject,
          message,
          category,
          referenceId: contact._id,
          adminEmail: businessRules.notification.adminEmail
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }
    }

    // Get success message from configuration
    const successMessage = config?.formConfig?.successMessage || 
      'Message sent successfully! We\'ll get back to you within 24 hours.';

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        referenceId: contact._id,
        status: contact.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get all contact submissions (Admin only)
exports.getAllContactSubmissions = async (req, res, next) => {
  try {
    // Add debug logging
    console.log('User data:', {
      user: req.user,
      userType: req.user.userType,
      headers: req.headers,
      token: req.headers.authorization
    });

    if (req.user.userType !== 'admin') {
      console.log('Access denied - User type is not admin:', req.user.userType);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      category,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const contacts = await Contact.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Contact.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const categoryCounts = await Contact.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      statusCounts,
      categoryCounts,
      data: contacts
    });

  } catch (error) {
    next(error);
  }
};

// Get single contact submission
exports.getContactSubmission = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    if (!contact || contact.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Check authorization - admin or user who submitted
    if (!req.user.isAdmin && (!contact.user || contact.user._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });

  } catch (error) {
    next(error);
  }
};

// Update contact submission status (Admin only)
exports.updateContactStatus = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, response, assignedTo } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact || contact.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Update contact
    contact.status = status;
    if (response) contact.adminResponse = response;
    if (assignedTo) contact.assignedTo = assignedTo;
    contact.updatedAt = new Date();

    await contact.save();

    // Send status update email to user if resolved and response provided
    if (status === 'resolved' && response) {
      try {
        await emailService.sendContactResponse(contact.email, {
          name: contact.name,
          subject: contact.subject,
          response,
          referenceId: contact._id
        });
      } catch (emailError) {
        console.error('Failed to send response email:', emailError);
      }
    }

    // Populate for response
    await contact.populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    next(error);
  }
};

// Delete contact submission (Admin only) - Soft delete
exports.deleteContactSubmission = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Soft delete
    contact.isDeleted = true;
    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

// Get user's own contact submissions
exports.getUserContactSubmissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these submissions'
      });
    }

    const contacts = await Contact.find({ 
      user: userId,
      isDeleted: { $ne: true }
    })
      .sort({ submittedAt: -1 })
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });

  } catch (error) {
    next(error);
  }
};

// Get all FAQs from configuration
exports.getAllFAQs = async (req, res, next) => {
  try {
    const { category } = req.query;

    const config = await Contact.getConfiguration();
    let faqs = config?.faqConfig?.faqs || [];

    // Filter active FAQs
    faqs = faqs.filter(faq => faq.isActive);

    // Filter by category if provided
    if (category) {
      faqs = faqs.filter(faq => faq.category === category);
    }

    // Sort by order
    faqs.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group FAQs by category
    const faqsByCategory = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
      groupedData: faqsByCategory
    });

  } catch (error) {
    next(error);
  }
};

// Create FAQ in configuration
exports.createFAQ = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { question, answer, category, order } = req.body;

    const config = await Contact.getConfiguration();
    const currentFaqs = config?.faqConfig?.faqs || [];

    const newFAQ = {
      question,
      answer,
      category: category || 'general',
      order: order || 0,
      isActive: true
    };

    const updatedConfig = await Contact.updateConfiguration({
      faqConfig: {
        faqs: [...currentFaqs, newFAQ]
      }
    }, req.user.id);

    // Find the newly created FAQ
    const createdFAQ = updatedConfig.faqConfig.faqs[updatedConfig.faqConfig.faqs.length - 1];

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: createdFAQ
    });

  } catch (error) {
    next(error);
  }
};

// Update FAQ in configuration
exports.updateFAQ = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { question, answer, category, order, isActive } = req.body;
    const faqIndex = parseInt(req.params.index);

    const config = await Contact.getConfiguration();
    const currentFaqs = config?.faqConfig?.faqs || [];

    if (faqIndex < 0 || faqIndex >= currentFaqs.length) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Update the FAQ
    const updatedFaqs = [...currentFaqs];
    if (question !== undefined) updatedFaqs[faqIndex].question = question;
    if (answer !== undefined) updatedFaqs[faqIndex].answer = answer;
    if (category !== undefined) updatedFaqs[faqIndex].category = category;
    if (order !== undefined) updatedFaqs[faqIndex].order = order;
    if (isActive !== undefined) updatedFaqs[faqIndex].isActive = isActive;

    const updatedConfig = await Contact.updateConfiguration({
      faqConfig: { faqs: updatedFaqs }
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: updatedConfig.faqConfig.faqs[faqIndex]
    });

  } catch (error) {
    next(error);
  }
};

// Delete FAQ from configuration
exports.deleteFAQ = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const faqIndex = parseInt(req.params.index);

    const config = await Contact.getConfiguration();
    const currentFaqs = config?.faqConfig?.faqs || [];

    if (faqIndex < 0 || faqIndex >= currentFaqs.length) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Remove the FAQ
    const updatedFaqs = currentFaqs.filter((_, index) => index !== faqIndex);

    await Contact.updateConfiguration({
      faqConfig: { faqs: updatedFaqs }
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

// Get contact information from configuration
exports.getContactInfo = async (req, res, next) => {
  try {
    const config = await Contact.getConfiguration();
    const contactInfo = config?.contactConfig || {};

    res.status(200).json({
      success: true,
      data: contactInfo
    });

  } catch (error) {
    next(error);
  }
};

// Update contact information in configuration
exports.updateContactInfo = async (req, res, next) => {
  try {
    // Add debug logging
    console.log('Update contact info request:', {
      user: req.user,
      isAdmin: req.user.isAdmin,
      body: req.body
    });

    if (req.user.userType !== 'admin') {
      console.log('Access denied - User is not admin:', req.user);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updatedConfig = await Contact.updateConfiguration({
      contactConfig: req.body
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully',
      data: updatedConfig.contactConfig
    });

  } catch (error) {
    next(error);
  }
};

// Get contact page content
exports.getContactPageContent = async (req, res, next) => {
  try {
    const config = await Contact.getConfiguration();
    const pageContent = config?.pageContent || {};

    res.status(200).json({
      success: true,
      data: pageContent
    });

  } catch (error) {
    next(error);
  }
};

// Update contact page content
exports.updateContactPageContent = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const updatedConfig = await Contact.updateConfiguration({
      pageContent: req.body
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Page content updated successfully',
      data: updatedConfig.pageContent
    });

  } catch (error) {
    next(error);
  }
};

// Get contact form configuration
exports.getContactFormConfig = async (req, res, next) => {
  try {
    const config = await Contact.getConfiguration();
    const formConfig = config?.formConfig || {};

    res.status(200).json({
      success: true,
      data: formConfig
    });

  } catch (error) {
    next(error);
  }
};

// Update contact form configuration
exports.updateContactFormConfig = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const updatedConfig = await Contact.updateConfiguration({
      formConfig: req.body
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Form configuration updated successfully',
      data: updatedConfig.formConfig
    });

  } catch (error) {
    next(error);
  }
};

// Get business rules configuration
exports.getBusinessRules = async (req, res, next) => {
  try {
    const config = await Contact.getConfiguration();
    const businessRules = config?.businessRules || {};

    res.status(200).json({
      success: true,
      data: businessRules
    });

  } catch (error) {
    next(error);
  }
};

// Update business rules configuration
exports.updateBusinessRules = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const updatedConfig = await Contact.updateConfiguration({
      businessRules: req.body
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Business rules updated successfully',
      data: updatedConfig.businessRules
    });

  } catch (error) {
    next(error);
  }
};

// Get complete contact configuration
exports.getCompleteConfiguration = async (req, res, next) => {
  try {
    const config = await Contact.getConfiguration();

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    next(error);
  }
};

// Initialize default configuration
exports.initializeConfiguration = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const config = await Contact.initializeDefaults(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Configuration initialized successfully',
      data: config
    });

  } catch (error) {
    next(error);
  }
};