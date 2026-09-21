import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import { validateStrongPassword, validateConfirmPassword } from '../../utils/validators';

const ResetPasswordForm = ({ onSubmit, isLoading, error }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = {
      password: validateStrongPassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword)
    };

    if (errors.password || errors.confirmPassword) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <ErrorMessage message={error} />

      <div className="relative mb-2">
        <Input
          label="New Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
          }}
          error={validationErrors.password}
        />
        <button
          type="button"
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      <div className="relative mb-6">
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (validationErrors.confirmPassword) setValidationErrors({ ...validationErrors, confirmPassword: '' });
          }}
          error={validationErrors.confirmPassword}
        />
        <button
          type="button"
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        Update Password
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
