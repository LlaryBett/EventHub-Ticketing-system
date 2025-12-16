import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await login(formData.email, formData.password);
      showSuccess(response?.message || 'Welcome back!');
      console.log('User object from login response:', response.user);
      const userType = response?.user?.data?.userType;
      
      if (userType === 'organizer') {
        navigate('/organizer-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      // Show backend error messages
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.isAuthError) {
        showError(error.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('An unexpected error occurred');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center py-12 sm:py-16 pb-24 sm:pb-32 lg:min-h-screen lg:py-0 lg:pb-0">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden mx-4">
        {/* Left Column - Description/Images */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 bg-gray-100 rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-gray-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-100 rounded-full"></div>
          </div>
          <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-10">
            <div className="max-w-lg w-full">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Welcome Back to EventHub
              </h2>
              <p className="text-xl mb-8 text-gray-700">
                Discover amazing events, connect with like-minded people, and create unforgettable memories.
              </p>
              {/* Features */}
              <div className="p-4 bg-primary-50 rounded-lg border-l-4 border-primary-600 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">Access to thousands of events</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">Personalized recommendations</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">Easy ticket management</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">Connect with your community</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="max-w-xs w-full">
            {/* Header (logo/name removed — app header provides branding) */}
            <div className="text-center mb-4">
              <h1 className="text-base font-bold text-gray-900 mb-1">Welcome Back</h1>
              <p className="text-xs text-gray-600">Sign in to your account to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="py-1 px-2 text-xs"
                inputClassName="text-xs"
                labelClassName="text-xs font-medium"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="py-1 px-2 text-xs"
                inputClassName="text-xs"
                labelClassName="text-xs font-medium"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
                  />
                  <span className="ml-2 text-xs text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                size="small"
                loading={loading}
                disabled={loading}
                className="text-xs py-1"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;