import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      await forgotPassword(email);
      setEmailSent(true);
      showSuccess('Password reset instructions sent to your email');
    } catch (error) {
      // Handle different error formats from your backend
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('Failed to send reset email. Please try again.');
      }
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center py-12 sm:py-16 pb-24 sm:pb-32 lg:min-h-screen lg:py-0 lg:pb-0">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="flex items-center justify-center mb-4">
            <img 
              src="/vite1.png" 
              alt="EventHub Logo" 
              className="h-12 object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {emailSent ? 'Check Your Email' : 'Reset Your Password'}
          </h1>
          <p className="text-sm text-gray-600">
            {emailSent 
              ? `We've sent password reset instructions to ${email}`
              : 'Enter your email address and we\'ll send you instructions to reset your password.'
            }
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="py-2"
              inputClassName="text-sm"
              labelClassName="text-sm font-medium"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
              className="py-2"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="py-2 flex-1"
              >
                Return to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="py-2 flex-1"
              >
                Try Another Email
              </Button>
            </div>
          </div>
        )}

        {/* Back to login link */}
        {!emailSent && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Back to login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;