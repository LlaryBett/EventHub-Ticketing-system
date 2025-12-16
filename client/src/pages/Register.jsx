import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    registerAttendee, 
    registerOrganizerStep1, 
    registerOrganizerStep2 
  } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Response, setStep1Response] = useState(null);
  const [showOrganizerSuccessModal, setShowOrganizerSuccessModal] = useState(false);
  const [organizerSuccessMessage, setOrganizerSuccessMessage] = useState('');

  // Helper function to determine registration type from URL
  const getRegistrationTypeFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    return type === 'organizer' ? false : true; // false = organizer, true = attendee
  };

  // Initialize isAttendee based on URL parameters
  const [isAttendee, setIsAttendee] = useState(getRegistrationTypeFromURL);

  const prefill = location.state?.prefill || {};

  const [formData, setFormData] = useState({
    // Personal Info
    name: prefill.name || '',
    email: prefill.email || '',
    password: prefill.password || '',
    confirmPassword: prefill.confirmPassword || '',
    phone: prefill.phone || '',
    
    // Organization Info
    organizationName: '',
    businessType: 'individual',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: '',
    website: '',
    
    // Additional
    acceptTerms: false,
    marketingConsent: false
  });

  // Update isAttendee when URL changes
  useEffect(() => {
    const newIsAttendee = getRegistrationTypeFromURL();
    setIsAttendee(newIsAttendee);
    
    // Reset to step 1 when switching between registration types
    setCurrentStep(1);
    setStep1Response(null);
  }, [location.search]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      showError('Please fill in all required personal information');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.organizationName || !formData.businessAddress || !formData.city || !formData.state || !formData.zipCode) {
      showError('Please fill in all required business information');
      return false;
    }
    
    if (!formData.acceptTerms) {
      showError('Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleOrganizerStep1 = async () => {
    if (!validateStep1()) return;

    setLoading(true);

    try {
      const response = await registerOrganizerStep1({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });
      
      setStep1Response(response);
      setCurrentStep(2);
      showSuccess('Personal information saved successfully');
    } catch (error) {
      // Handle backend validation errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          showError(err.msg);
        });
      } else {
        showError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerStep2 = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const response = await registerOrganizerStep2({
        organizationName: formData.organizationName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        taxId: formData.taxId,
        website: formData.website,
        acceptTerms: formData.acceptTerms,
        marketingConsent: formData.marketingConsent
      });
      setShowOrganizerSuccessModal(true);
      setOrganizerSuccessMessage(response.message || "Organizer application submitted! You'll receive an email once your account is approved.");
      showSuccess(response.message || "Organizer application submitted! You'll receive an email once your account is approved.");
    } catch (error) {
      showError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendeeSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;
    
    setLoading(true);
    
    try {
      await registerAttendee({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        acceptTerms: formData.acceptTerms,
        marketingConsent: formData.marketingConsent
      });
      
      showSuccess('Account created successfully! Welcome to EventHub.');
      navigate('/');
    } catch (error) {
      // Handle backend validation errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          showError(err.msg);
        });
      } else {
        showError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Function to toggle registration type and update URL
  const toggleRegistrationType = () => {
    const newIsAttendee = !isAttendee;
    const newType = newIsAttendee ? 'attendee' : 'organizer';
    setIsAttendee(newIsAttendee);
    
    // Update URL without triggering navigation
    const searchParams = new URLSearchParams(location.search);
    if (newType === 'organizer') {
      searchParams.set('type', 'organizer');
    } else {
      searchParams.delete('type');
    }
    
    const newSearch = searchParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    window.history.replaceState(null, '', newUrl);
    
    // Reset to step 1 when toggling
    setCurrentStep(1);
    setStep1Response(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl flex overflow-hidden">
        {/* Left Column - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-2xl w-full">
            {/* Logo/name removed to avoid duplication with the app header */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {isAttendee ? 'Join EventHub' : 'Become an Event Organizer'}
            </h1>
            <p className="text-gray-600 mb-8">
              {isAttendee ? 'Discover and attend amazing events in your area' : 'Create amazing events and grow your audience'}
            </p>

            <div className="space-y-6">
              <div className={`p-6 ${isAttendee ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'} rounded-xl border`}>
                <h3 className={`font-semibold ${isAttendee ? 'text-blue-900' : 'text-purple-900'} mb-3`}>
                  {isAttendee ? 'What you get as an attendee:' : 'What you get as an organizer:'}
                </h3>
                <ul className={`text-sm ${isAttendee ? 'text-blue-700' : 'text-purple-700'} space-y-2`}>
                  {isAttendee ? (
                    <>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Browse and discover events by category
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Easy booking and secure payments
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Personalized event recommendations
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Save favorites and track your events
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Connect with like-minded people
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Create unlimited events and manage attendees
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Integrated payment processing and payouts
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Advanced analytics and reporting tools
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        Marketing and promotional features
                      </li>
                      <li className="flex items-center">
                        <span className={`${isAttendee ? 'text-blue-500' : 'text-purple-500'} mr-2`}>✓</span>
                        24/7 organizer support
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {!isAttendee && (
                <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                  <p className="text-sm font-medium text-amber-800 mb-1">Approval Process</p>
                  <p className="text-xs text-amber-700">
                    Your application will be reviewed within 2-3 business days. We'll verify your information and set up your account.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-8 px-6">
          <div className="max-w-md w-full">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{isAttendee ? 'Become an Attendee' : 'Become an Organizer'}</h1>
              <p className="text-sm text-gray-600">{isAttendee ? 'Register to attend amazing events' : 'Create and manage amazing events'}</p>
            </div>

            {/* Attendee Registration Form */}
            {isAttendee ? (
              <form onSubmit={handleAttendeeSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendee Registration</h2>
                <Input
                  label="Full Name *"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Create a strong password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      I'd like to receive marketing updates and event recommendations
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            ) : (
              // Organizer Registration Form (multi-step)
              <>
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-600">Step {currentStep} of 2</span>
                    <span className="text-xs text-gray-500">
                      {currentStep === 1 ? 'Personal Information' : 'Business Information'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(currentStep / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <form onSubmit={currentStep === 2 ? handleOrganizerStep2 : (e) => e.preventDefault()}>
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                      {/* Show summary if step1Response exists */}
                      {step1Response && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-green-700 text-sm font-medium mb-1">Personal info saved:</p>
                          <ul className="text-xs text-green-700 list-disc list-inside">
                            <li>Name: {step1Response.name || formData.name}</li>
                            <li>Email: {step1Response.email || formData.email}</li>
                            <li>Phone: {step1Response.phone || formData.phone}</li>
                          </ul>
                        </div>
                      )}
                      <Input
                        label="Full Name *"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />

                      <Input
                        label="Email Address *"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />

                      <Input
                        label="Phone Number *"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />

                      <Input
                        label="Password *"
                        type="password"
                        placeholder="Create a strong password (min 8 characters)"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />

                      <Input
                        label="Confirm Password *"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />

                      <Button
                        type="button"
                        onClick={handleOrganizerStep1}
                        fullWidth
                        loading={loading}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? 'Processing...' : 'Continue to Business Information'}
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Business Information */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          ← Back
                        </button>
                      </div>
                      
                      <Input
                        label="Organization Name *"
                        placeholder="Your organization or business name"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type *
                        </label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="individual">Individual/Sole Proprietor</option>
                          <option value="company">Company/Corporation</option>
                          <option value="nonprofit">Non-profit Organization</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <Input
                        label="Business Address *"
                        placeholder="Street address"
                        value={formData.businessAddress}
                        onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City *"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                        <Input
                          label="State *"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="ZIP Code *"
                          placeholder="ZIP Code"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          required
                        />
                        <Input
                          label="Tax ID (Optional)"
                          placeholder="Tax ID/EIN"
                          value={formData.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value)}
                        />
                      </div>

                      <Input
                        label="Website (Optional)"
                        placeholder="https://yourwebsite.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                            className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            required
                          />
                          <div className="ml-3">
                            <p className="text-sm text-gray-600">
                              I agree to the{' '}
                              <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                                Organizer Terms of Service
                              </a>{' '}
                              and{' '}
                              <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                                Privacy Policy
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={formData.marketingConsent}
                            onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                            className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="ml-3">
                            <p className="text-sm text-gray-600">
                              I'd like to receive marketing updates and tips for successful event organizing
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? 'Submitting Application...' : 'Submit Application'}
                      </Button>
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Organizer Success Modal */}
            {!isAttendee && showOrganizerSuccessModal && (
              <Modal onClose={() => setShowOrganizerSuccessModal(false)}>
                <div className="p-6 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-purple-700">Application Submitted!</h2>
                  <p className="mb-4 text-gray-700">
                    {organizerSuccessMessage}
                  </p>
                  <Button
                    onClick={() => setShowOrganizerSuccessModal(false)}
                    className="bg-purple-600 hover:bg-purple-700 w-full mt-2"
                  >
                    Close
                  </Button>
                </div>
              </Modal>
            )}

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isAttendee ? 'Already have an account?' : 'Already have an organizer account?'}{' '}
                <Link
                  to={isAttendee ? "/login" : "/organizer/login"}
                  className={`font-medium ${isAttendee ? 'text-blue-600 hover:text-blue-700' : 'text-purple-600 hover:text-purple-700'}`}
                >
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {isAttendee ? 'Want to organize events?' : 'Looking to attend events?'}{' '}
                <button
                  type="button"
                  className={`underline ${isAttendee ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'}`}
                  onClick={toggleRegistrationType}
                >
                  {isAttendee ? 'Switch to organizer registration' : 'Create an attendee account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;