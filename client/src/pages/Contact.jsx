import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Map } from 'lucide-react';

// Import actual services
import { 
  submitContactForm, 
  getContactPageData,
  getContactCategories,
  validateContactForm 
} from '../services/contactService';

// Mock components since we don't have the imports
const Button = ({ children, fullWidth, loading, disabled, type, ...props }) => {
  const baseClasses = "font-semibold rounded-lg transition-colors duration-200 text-base min-h-12";
  const widthClass = fullWidth ? "w-full" : "px-6 py-3";
  const stateClasses = disabled || loading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700";
  
  return (
    <button 
      type={type}
      className={`${baseClasses} ${widthClass} ${stateClasses}`}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, required, ...props }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Mock hooks
const useUI = () => ({
  showSuccess: (msg) => alert(`Success: ${msg}`),
  showError: (msg) => alert(`Error: ${msg}`)
});

const useAuth = () => ({
  user: null
});

const Contact = () => {
  const { showSuccess, showError } = useUI();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Dynamic data from backend
  const [pageData, setPageData] = useState({
    pageContent: {},
    contactInfo: {},
    formConfig: {},
    faqs: []
  });
  const [categories, setCategories] = useState([]);

  // Load all contact page data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        // Load all contact page data in parallel
        const [pageDataResponse, categoriesResponse] = await Promise.all([
          getContactPageData(),
          getContactCategories()
        ]);

        // Set page data
        if (pageDataResponse.success) {
          setPageData(pageDataResponse.data);
        }

        // Set categories
        setCategories(categoriesResponse);

        // Autofill form with user data if available
        if (user?.data) {
          setFormData(prev => ({
            ...prev,
            name: user.data.name || '',
            email: user.data.email || '',
            phone: user.data.phone || ''
          }));
        }

      } catch (error) {
        console.error('Error loading contact data:', error);
        showError('Failed to load contact page data. Please refresh the page.');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array since we only want to fetch once on mount

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    try {
      // Client-side validation using backend configuration
      const validation = await validateContactForm(formData);
      
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        showError('Please fix the form errors and try again.');
        return;
      }

      // Submit to backend
      const response = await submitContactForm(formData);
      
      if (response.success) {
        showSuccess(response.message);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          category: categories[0]?.value || 'general'
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      
      // Handle validation errors from backend
      if (error.errors && Array.isArray(error.errors)) {
        const backendErrors = {};
        error.errors.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setFormErrors(backendErrors);
        showError('Please fix the form errors and try again.');
      } else {
        showError(error.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get field requirements from form configuration
  const getFieldRequired = (fieldName) => {
    return pageData.formConfig?.fieldSettings?.[fieldName]?.required ?? true;
  };

  // Contact info items with dynamic data
  const contactInfoItems = [
    {
      icon: <Mail className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Email Us',
      content: pageData.contactInfo?.email || 'Loading...',
      description: pageData.contactInfo?.emailDescription || 'We typically respond within 24 hours'
    },
    {
      icon: <Phone className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Call Us',
      content: pageData.contactInfo?.phone || 'Loading...',
      description: pageData.contactInfo?.businessHours || 'Monday - Friday, 9 AM - 6 PM EST'
    },
    {
      icon: <MapPin className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Visit Us',
      content: pageData.contactInfo?.address || 'Loading...',
      description: pageData.contactInfo?.addressDescription || 'Our headquarters location'
    },
    {
      icon: <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Live Chat',
      content: pageData.contactInfo?.liveChat?.availability || 'Available 24/7',
      description: pageData.contactInfo?.liveChat?.description || 'Get instant help from our support team'
    }
  ];

  // Use dynamic page content or fallbacks
  const heroTitle = pageData.pageContent?.heroTitle || "Get in Touch";
  const heroDescription = pageData.pageContent?.heroDescription || "Have questions, feedback, or need help? We're here for you. Reach out and we'll respond as quickly as possible.";
  const formTitle = pageData.pageContent?.formTitle || "Send us a Message";
  const sidebarTitle = pageData.pageContent?.sidebarTitle || "Other Ways to Reach Us";
  const faqTitle = pageData.pageContent?.faqTitle || "Frequently Asked Questions";
  const mapTitle = pageData.pageContent?.mapTitle || "Visit Our Office";
  const mapDescription = pageData.pageContent?.mapDescription || "We're located in the heart of San Francisco. Drop by for a coffee and chat!";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-4">{heroTitle}</h1>
            <p className="text-base md:text-xl text-blue-100 max-w-3xl mx-auto">
              {heroDescription}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{formTitle}</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={formErrors.name}
                      required={getFieldRequired('name')}
                    />
                  </div>
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={formErrors.email}
                      required={getFieldRequired('email')}
                    />
                  </div>
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={formErrors.phone}
                  required={getFieldRequired('phone')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category {getFieldRequired('category') && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      formErrors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={getFieldRequired('category')}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                  )}
                </div>

                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  error={formErrors.subject}
                  required={getFieldRequired('subject')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message {getFieldRequired('message') && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      formErrors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={getFieldRequired('message')}
                  ></textarea>
                  {formErrors.message && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{sidebarTitle}</h2>
              {dataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-pulse">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {contactInfoItems.map((info, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                      <div className="text-blue-600 mb-3">{info.icon}</div>
                      <h3 className="font-semibold text-base text-gray-900 mb-2">{info.title}</h3>
                      <p className="text-sm md:text-base text-blue-600 font-medium mb-1">{info.content}</p>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{faqTitle}</h2>
              {dataLoading ? (
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="p-4 md:p-6 animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-3"></div>
                      <div className="h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {pageData.faqs.map((item, index) => (
                    <details
                      key={index}
                      className="group p-4 md:p-6 cursor-pointer"
                    >
                      <summary className="flex justify-between items-center font-semibold text-sm md:text-base text-gray-900 list-none">
                        {item.question}
                        <span className="ml-2 transition-transform group-open:rotate-180 text-lg">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">{mapTitle}</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              {mapDescription}
            </p>
          </div>
          
          <div className="bg-gray-200 rounded-lg h-48 md:h-64 flex items-center justify-center">
            <div className="text-gray-500 flex items-center gap-3">
              <Map className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-sm md:text-base">Interactive map would be displayed here</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;