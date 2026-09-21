import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { FiCheckCircle } from 'react-icons/fi';

const ResetSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 text-center">

        <div className="flex justify-center mb-6">
          <FiCheckCircle className="w-16 h-16 text-[#00c853]" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Updated Successfully!</h2>

        <p className="text-gray-600 mb-8">
          You can now log back into the office portal.
        </p>

        <Button onClick={() => navigate('/recruiter/login')} fullWidth>
          Go to Login
        </Button>

      </div>
    </div>
  );
};

export default ResetSuccess;
