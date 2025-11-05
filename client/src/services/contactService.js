import { api } from './api';

// ===== PUBLIC ROUTES =====

// Submit contact form (public - no auth required)
export const submitContactForm = async (contactData) => {
  try {
    const response = await api.post('/contact/submit', contactData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all FAQs (public)
export const getAllFAQs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/contact/faqs?${queryParams}` : '/contact/faqs';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get contact information (public)
export const getContactInfo = async () => {
  try {
    const response = await api.get('/contact/info');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get contact page content (public)
export const getContactPageContent = async () => {
  try {
    const response = await api.get('/contact/content');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get contact form configuration (public)
export const getContactFormConfig = async () => {
  try {
    const response = await api.get('/contact/form-config');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ===== PROTECTED ROUTES =====

// Get user's own contact submissions (protected)
export const getUserContactSubmissions = async (userId) => {
  try {
    const response = await api.get(`/contact/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single contact submission (protected)
export const getContactSubmission = async (id) => {
  try {
    const response = await api.get(`/contact/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ===== ADMIN ONLY ROUTES =====

// Contact submissions management
export const getAllContactSubmissions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/contact?${queryParams}` : '/contact';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateContactStatus = async (id, statusData) => {
  try {
    const response = await api.put(`/contact/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteContactSubmission = async (id) => {
  try {
    const response = await api.delete(`/contact/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// FAQ Management (Admin only)
export const createFAQ = async (faqData) => {
  try {
    const response = await api.post('/contact/faqs', faqData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateFAQ = async (index, faqData) => {
  try {
    const response = await api.put(`/contact/faqs/${index}`, faqData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteFAQ = async (index) => {
  try {
    const response = await api.delete(`/contact/faqs/${index}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Configuration Management (Admin only)
export const updateContactInfo = async (contactInfoData) => {
  try {
    const response = await api.put('/contact/info', contactInfoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateContactPageContent = async (pageContentData) => {
  try {
    const response = await api.put('/contact/content', pageContentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateContactFormConfig = async (formConfigData) => {
  try {
    const response = await api.put('/contact/form-config', formConfigData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getBusinessRules = async () => {
  try {
    const response = await api.get('/contact/business-rules');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateBusinessRules = async (businessRulesData) => {
  try {
    const response = await api.put('/contact/business-rules', businessRulesData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCompleteConfiguration = async () => {
  try {
    const response = await api.get('/contact/config/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const initializeConfiguration = async () => {
  try {
    const response = await api.post('/contact/config/initialize');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ===== HELPER FUNCTIONS =====

// Dynamic category helper - fetches from backend configuration
export const getContactCategories = async () => {
  try {
    const config = await getContactFormConfig();
    if (config.success && config.data.categories && config.data.categories.length > 0) {
      return config.data.categories.filter(cat => !cat.isActive === false);
    }
    
    // Fallback to default categories if none configured
    return [
      { value: 'general', label: 'General Inquiry' },
      { value: 'support', label: 'Technical Support' },
      { value: 'billing', label: 'Billing & Payments' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'feedback', label: 'Feedback' }
    ];
  } catch (error) {
    console.error('Failed to fetch categories, using defaults:', error);
    return [
      { value: 'general', label: 'General Inquiry' },
      { value: 'support', label: 'Technical Support' },
      { value: 'billing', label: 'Billing & Payments' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'feedback', label: 'Feedback' }
    ];
  }
};

// Dynamic status helper
export const getContactStatuses = () => {
  return [
    { value: 'pending', label: 'Pending', color: 'orange' },
    { value: 'in-progress', label: 'In Progress', color: 'blue' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' }
  ];
};

// Dynamic priority helper
export const getContactPriorities = () => {
  return [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];
};

// Validation helpers
export const validateContactForm = async (data) => {
  const errors = {};

  try {
    // Get dynamic configuration for validation
    const config = await getContactFormConfig();
    const fieldSettings = config.data?.fieldSettings || {};
    
    // Name validation
    if (fieldSettings.name?.required && (!data.name || data.name.trim().length === 0)) {
      errors.name = 'Name is required';
    } else if (data.name && (data.name.trim().length < 2 || data.name.trim().length > 50)) {
      errors.name = 'Name must be between 2 and 50 characters';
    }

    // Email validation
    if (fieldSettings.email?.required && (!data.email || data.email.trim().length === 0)) {
      errors.email = 'Email is required';
    } else if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = 'Please provide a valid email address';
      }
    }

    // Phone validation
    if (fieldSettings.phone?.required && (!data.phone || data.phone.trim().length === 0)) {
      errors.phone = 'Phone number is required';
    } else if (data.phone && data.phone.trim() && !/^\+?[\d\s\-()]{8,}$/.test(data.phone)) {
      errors.phone = 'Please provide a valid phone number';
    }

    // Subject validation
    if (fieldSettings.subject?.required && (!data.subject || data.subject.trim().length === 0)) {
      errors.subject = 'Subject is required';
    } else if (data.subject && (data.subject.trim().length < 5 || data.subject.trim().length > 100)) {
      errors.subject = 'Subject must be between 5 and 100 characters';
    }

    // Message validation
    if (fieldSettings.message?.required && (!data.message || data.message.trim().length === 0)) {
      errors.message = 'Message is required';
    } else if (data.message && (data.message.trim().length < 10 || data.message.trim().length > 1000)) {
      errors.message = 'Message must be between 10 and 1000 characters';
    }

    // Category validation
    if (fieldSettings.category?.required && (!data.category || data.category.trim().length === 0)) {
      errors.category = 'Category is required';
    } else if (data.category) {
      const categories = await getContactCategories();
      const validCategories = categories.map(cat => cat.value);
      if (!validCategories.includes(data.category)) {
        errors.category = 'Please select a valid category';
      }
    }

  } catch (error) {
    console.error('Failed to fetch form config for validation, using default validation:', error);
    // Fallback to default validation if config fetch fails
    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
      errors.name = 'Name must be between 2 and 50 characters';
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (data.phone && data.phone.trim() && !/^\+?[\d\s\-()]+$/.test(data.phone)) {
      errors.phone = 'Please provide a valid phone number';
    }
    if (!data.subject || data.subject.trim().length < 5 || data.subject.trim().length > 100) {
      errors.subject = 'Subject must be between 5 and 100 characters';
    }
    if (!data.message || data.message.trim().length < 10 || data.message.trim().length > 1000) {
      errors.message = 'Message must be between 10 and 1000 characters';
    }
    if (!data.category) {
      errors.category = 'Please select a category';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFAQ = (data) => {
  const errors = {};

  if (!data.question || data.question.trim().length < 10 || data.question.trim().length > 200) {
    errors.question = 'Question must be between 10 and 200 characters';
  }

  if (!data.answer || data.answer.trim().length < 10 || data.answer.trim().length > 1000) {
    errors.answer = 'Answer must be between 10 and 1000 characters';
  }

  if (!data.category || data.category.trim().length < 2 || data.category.trim().length > 50) {
    errors.category = 'Category must be between 2 and 50 characters';
  }

  if (data.order !== undefined && (isNaN(data.order) || data.order < 0)) {
    errors.order = 'Order must be a non-negative number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Bulk data fetcher for contact page
export const getContactPageData = async () => {
  try {
    const [pageContent, contactInfo, formConfig, faqs] = await Promise.all([
      getContactPageContent(),
      getContactInfo(),
      getContactFormConfig(),
      getAllFAQs()
    ]);

    return {
      success: true,
      data: {
        pageContent: pageContent.data,
        contactInfo: contactInfo.data,
        formConfig: formConfig.data,
        faqs: faqs.data
      }
    };
  } catch (error) {
    console.error('Failed to fetch contact page data:', error);
    throw error;
  }
};