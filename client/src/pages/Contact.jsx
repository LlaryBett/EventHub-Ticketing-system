import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Map } from 'lucide-react';

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

// Mock service functions
const submitContactForm = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: 'Message sent successfully!' };
};

const getAllFAQs = async () => ({ success: true, data: [] });
const getContactInfo = async () => ({ success: false });
const getContactCategories = () => [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'event', label: 'Event Organization' }
];
const validateContactForm = (data) => ({ isValid: true, errors: {} });

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
  const [faqs, setFaqs] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);

  // Load FAQs and contact info on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        // Load FAQs and contact info in parallel
        const [faqsResponse, contactInfoResponse] = await Promise.all([
          getAllFAQs({ isActive: true }),
          getContactInfo()
        ]);

        // Set FAQs and contact info
        if (faqsResponse.success) {
          setFaqs(faqsResponse.data);
        }

        if (contactInfoResponse.success) {
          setContactInfo(contactInfoResponse.data);
        }

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
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

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
      // Client-side validation
      const validation = validateContactForm(formData);
      
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        showError('Please fix the form errors and try again.');
        return;
      }

      // Submit to backend
      const response = await submitContactForm(formData);
      
      if (response.success) {
        showSuccess(response.message || 'Message sent successfully! We\'ll get back to you within 24 hours.');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          category: 'general'
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

  // Get contact categories from service
  const contactCategories = getContactCategories();

  // Default contact info if backend doesn't provide it
  const defaultContactInfo = {
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

  const displayContactInfo = contactInfo || defaultContactInfo;

  const contactInfoItems = [
    {
      icon: <Mail className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Email Us',
      content: displayContactInfo.email,
      description: 'We typically respond within 24 hours'
    },
    {
      icon: <Phone className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Call Us',
      content: displayContactInfo.phone,
      description: displayContactInfo.businessHours
    },
    {
      icon: <MapPin className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Visit Us',
      content: displayContactInfo.address,
      description: 'Our headquarters in the heart of SF'
    },
    {
      icon: <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Live Chat',
      content: 'Available 24/7',
      description: 'Get instant help from our support team'
    }
  ];

  // Default FAQs if none loaded from backend
  const defaultFAQs = [
    {
      question: 'How do I create an event?',
      answer: 'Simply sign up for an account, go to the "Create Event" page, fill out the event details, and publish. Our team will review and approve within 24 hours.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.'
    },
    {
      question: 'Can I get a refund for my ticket?',
      answer: 'Refund policies depend on the event organizer. You can check the refund policy on each event\'s detail page before purchasing.'
    },
    {
      question: 'How do I receive my tickets?',
      answer: 'After successful payment, you\'ll receive an email with your e-tickets. You can also access them from your dashboard.'
    }
  ];

  const displayFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* H1 - Mobile: 26px, Desktop: 48px */}
              <h1 className="text-2xl md:text-5xl font-bold mb-4">Get in Touch</h1>
              {/* Hero text - Mobile: 16px, Desktop: 20px */}
              <p className="text-base md:text-xl text-blue-100 leading-relaxed">
                Have questions, feedback, or need help? We're here for you. 
                Reach out and we'll respond as quickly as possible.
              </p>
            </div>
            
            {/* Right Vector Image */}
            <div className="hidden lg:flex justify-end">
              <svg
                width="280"
                height="200"
                viewBox="0 0 280 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full max-w-xs"
              >
                {/* Background Circle */}
                <circle cx="140" cy="100" r="80" fill="rgba(255,255,255,0.1)" />
                
                {/* Phone */}
                <rect x="110" y="50" width="60" height="100" rx="12" fill="white" opacity="0.9" />
                <rect x="118" y="58" width="44" height="70" rx="2" fill="#3B82F6" />
                <circle cx="140" cy="140" r="5" fill="#3B82F6" />
                
                {/* Message Bubbles */}
                <ellipse cx="80" cy="80" rx="25" ry="15" fill="rgba(255,255,255,0.8)" />
                <ellipse cx="200" cy="120" rx="30" ry="18" fill="rgba(255,255,255,0.8)" />
                
                {/* Email Icon */}
                <rect x="60" y="70" width="40" height="20" rx="3" fill="#3B82F6" opacity="0.8" />
                <path d="M65 75 L80 85 L95 75" stroke="white" strokeWidth="1.5" fill="none" />
                
                {/* Chat Dots */}
                <circle cx="190" cy="118" r="2.5" fill="#3B82F6" />
                <circle cx="200" cy="118" r="2.5" fill="#3B82F6" />
                <circle cx="210" cy="118" r="2.5" fill="#3B82F6" />
                
                {/* Connection Lines */}
                <path d="M80 95 Q140 60 200 105" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              {/* H2 - Mobile: 20px, Desktop: 24px */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={formErrors.name}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={formErrors.email}
                      required
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
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      formErrors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    {contactCategories.map(category => (
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
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      formErrors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
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
              {/* H2 - Mobile: 20px, Desktop: 24px */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Other Ways to Reach Us</h2>
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
                      {/* Card title - Mobile: 16px, Desktop: 16px */}
                      <h3 className="font-semibold text-base text-gray-900 mb-2">{info.title}</h3>
                      {/* Contact info - Mobile: 14px, Desktop: 16px */}
                      <p className="text-sm md:text-base text-blue-600 font-medium mb-1">{info.content}</p>
                      {/* Description - Mobile: 14px, Desktop: 14px */}
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div>
              {/* H2 - Mobile: 20px, Desktop: 24px */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
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
                  {displayFAQs.map((item, index) => (
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
                      {/* Answer text - Mobile: 14px, Desktop: 14px */}
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
            {/* H2 - Mobile: 22px, Desktop: 30px */}
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
            {/* Description - Mobile: 16px, Desktop: 16px */}
            <p className="text-base text-gray-600 leading-relaxed">
              We're located in the heart of San Francisco. Drop by for a coffee and chat!
            </p>
          </div>
          
          <div className="bg-gray-200 rounded-lg h-48 md:h-64 flex items-center justify-center">
            <div className="text-gray-500 flex items-center gap-3">
              <Map className="w-6 h-6 md:w-8 md:h-8" />
              {/* Map placeholder text - Mobile: 14px, Desktop: 16px */}
              <span className="text-sm md:text-base">Interactive map would be displayed here</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;