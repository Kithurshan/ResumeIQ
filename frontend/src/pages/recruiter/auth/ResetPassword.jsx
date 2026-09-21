import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import { authService } from '../../../services/authService';

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  const handleResetSubmit = async (newPassword) => {
    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, newPassword);
      navigate('/recruiter/reset-success');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h2>
          <p className="text-gray-600 text-sm">
            Please choose a strong password.
          </p>
        </div>

        <ResetPasswordForm
          onSubmit={handleResetSubmit}
          isLoading={isLoading}
          error={error}
        />

      </div>
    </div>
  );
};

export default ResetPassword;
