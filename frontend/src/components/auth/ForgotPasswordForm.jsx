import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import { validateEmail } from '../../utils/validators';

const ForgotPasswordForm = ({ onSubmit, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    setValidationError('');
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <ErrorMessage message={error} />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="Enter your work email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (validationError) setValidationError('');
        }}
        error={validationError}
      />

      <div className="mt-6">
        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
        </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
