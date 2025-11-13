import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetToken } = useParams();
  const { resetPassword } = useAuth();
  const { showSuccess, showError } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [tokenValid, setTokenValid] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      await resetPassword(resetToken, formData.password);
      showSuccess('Password reset successfully! You can now login with your new password.');
      navigate('/login');
    } catch (error) {
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message) {
        showError(error.message);
      } else {
        showError('Failed to reset password. Please try again.');
      }
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center py-12 sm:py-16 pb-24 sm:pb-32 lg:min-h-screen lg:py-0 lg:pb-0">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">E</span>
            </div>
            <span className="text-4xl font-bold text-gray-900">EventHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
            className="py-2"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>

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
      </div>
    </div>
  );
};

export default ResetPassword;