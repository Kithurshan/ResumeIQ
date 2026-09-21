import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm';
import { authService } from '../../../services/authService';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgotSubmit = async (email) => {
    setIsLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      // Always redirect to success page
      navigate('/recruiter/forgot-password-success');
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600 text-sm">
            Enter your work email below to receive a secure password reset link.
          </p>
        </div>

        <ForgotPasswordForm
          onSubmit={handleForgotSubmit}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/recruiter/login')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
