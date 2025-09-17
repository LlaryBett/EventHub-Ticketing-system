import { api } from './api';

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

// Admin only functions
// Get all contact submissions with filtering and pagination (admin)
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

// Update contact submission status (admin)
export const updateContactStatus = async (id, statusData) => {
  try {
    const response = await api.put(`/contact/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete contact submission (admin)
export const deleteContactSubmission = async (id) => {
  try {
    const response = await api.delete(`/contact/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// FAQ Management (Admin only)
// Create FAQ (admin)
export const createFAQ = async (faqData) => {
  try {
    const response = await api.post('/contact/faqs', faqData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update FAQ (admin)
export const updateFAQ = async (id, faqData) => {
  try {
    const response = await api.put(`/contact/faqs/${id}`, faqData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete FAQ (admin)
export const deleteFAQ = async (id) => {
  try {
    const response = await api.delete(`/contact/faqs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Contact Information Management (Admin only)
// Update contact information (admin)
export const updateContactInfo = async (contactInfoData) => {
  try {
    const response = await api.put('/contact/info', contactInfoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Helper functions for contact form categories
export const getContactCategories = () => {
  return [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'feedback', label: 'Feedback' }
  ];
};

// Helper functions for contact status
export const getContactStatuses = () => {
  return [
    { value: 'pending', label: 'Pending', color: 'orange' },
    { value: 'in-progress', label: 'In Progress', color: 'blue' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' }
  ];
};

// Validation helpers (client-side validation that matches backend)
export const validateContactForm = (data) => {
  const errors = {};

  // Name validation
  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim() && !/^\+?[\d\s\-()]+$/.test(data.phone)) {
    errors.phone = 'Please provide a valid phone number';
  }

  // Subject validation
  if (!data.subject || data.subject.trim().length < 5 || data.subject.trim().length > 100) {
    errors.subject = 'Subject must be between 5 and 100 characters';
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10 || data.message.trim().length > 1000) {
    errors.message = 'Message must be between 10 and 1000 characters';
  }

  // Category validation
  const validCategories = ['general', 'support', 'billing', 'partnership', 'feedback'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = 'Please select a valid category';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// FAQ validation
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