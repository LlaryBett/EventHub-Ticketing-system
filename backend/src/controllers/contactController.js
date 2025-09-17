const Contact = require('../models/Contact');
const FAQ = require('../models/FAQ');
const ContactInfo = require('../models/ContactInfo');
const User = require('../models/User');
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

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmation(email, {
        name,
        subject,
        category,
        referenceId: contact._id
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send notification to admin
    try {
      await emailService.sendContactNotification({
        name,
        email,
        phone,
        subject,
        message,
        category,
        referenceId: contact._id
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you within 24 hours.',
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
    if (!req.user.isAdmin) {
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
    const filter = {};
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
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const categoryCounts = await Contact.aggregate([
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

    if (!contact) {
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
    if (!req.user.isAdmin) {
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

    if (!contact) {
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

    // Send status update email to user if resolved
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

// Delete contact submission (Admin only)
exports.deleteContactSubmission = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
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

    await contact.deleteOne();

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

    const contacts = await Contact.find({ user: userId })
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

// Get all FAQs
exports.getAllFAQs = async (req, res, next) => {
  try {
    const { category, isActive = true } = req.query;

    const filter = { isActive };
    if (category) filter.category = category;

    const faqs = await FAQ.find(filter)
      .sort({ order: 1, createdAt: -1 });

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

// Create FAQ (Admin only)
exports.createFAQ = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
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

    const faq = await FAQ.create({
      question,
      answer,
      category,
      order,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });

  } catch (error) {
    next(error);
  }
};

// Update FAQ (Admin only)
exports.updateFAQ = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
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

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const { question, answer, category, order, isActive } = req.body;

    faq.question = question || faq.question;
    faq.answer = answer || faq.answer;
    faq.category = category || faq.category;
    faq.order = order !== undefined ? order : faq.order;
    faq.isActive = isActive !== undefined ? isActive : faq.isActive;
    faq.updatedAt = new Date();

    await faq.save();

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });

  } catch (error) {
    next(error);
  }
};

// Delete FAQ (Admin only)
exports.deleteFAQ = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await faq.deleteOne();

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

// Get contact information
exports.getContactInfo = async (req, res, next) => {
  try {
    const contactInfo = await ContactInfo.findOne({ isActive: true })
      .sort({ updatedAt: -1 });

    if (!contactInfo) {
      // Return default contact info if none exists
      const defaultInfo = {
        email: 'hello@eventhub.com',
        phone: '+1 (555) 123-4567',
        address: '123 Event Street, San Francisco, CA 94102',
        businessHours: 'Monday - Friday, 9 AM - 6 PM EST',
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        }
      };

      return res.status(200).json({
        success: true,
        data: defaultInfo
      });
    }

    res.status(200).json({
      success: true,
      data: contactInfo
    });

  } catch (error) {
    next(error);
  }
};

// Update contact information (Admin only)
exports.updateContactInfo = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
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

    let contactInfo = await ContactInfo.findOne({ isActive: true });

    if (!contactInfo) {
      // Create new contact info
      contactInfo = await ContactInfo.create({
        ...req.body,
        updatedBy: req.user.id
      });
    } else {
      // Update existing
      Object.assign(contactInfo, req.body);
      contactInfo.updatedBy = req.user.id;
      contactInfo.updatedAt = new Date();
      await contactInfo.save();
    }

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully',
      data: contactInfo
    });

  } catch (error) {
    next(error);
  }
};