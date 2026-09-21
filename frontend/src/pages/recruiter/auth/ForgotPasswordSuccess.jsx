import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ForgotPasswordSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 text-center">

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>

        <div className="text-gray-600 mb-8 space-y-4">
          <p>If this email exists in our system, a password reset link has been sent.</p>
          <p>Please check your inbox and spam folder.</p>
        </div>

        <Button onClick={() => navigate('/recruiter/login')} fullWidth>
          Back to Login
        </Button>

      </div>
    </div>
  );
};

export default ForgotPasswordSuccess;
