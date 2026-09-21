import React from 'react';
import Loader from './Loader';

const Button = ({ children, type = 'button', onClick, variant = 'primary', className = '', isLoading = false, disabled = false, fullWidth = false }) => {
  const baseStyles = 'px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center';
  const variants = {
    primary: 'bg-[#00c853] hover:bg-[#00b048] text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border-2 border-[#00c853] text-[#00c853] hover:bg-green-50',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || isLoading) ? 'opacity-70 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${disabledClass} ${className}`}
    >
      {isLoading ? <Loader size="small" color={variant === 'outline' ? 'green' : 'white'} /> : children}
    </button>
  );
};

export default Button;
