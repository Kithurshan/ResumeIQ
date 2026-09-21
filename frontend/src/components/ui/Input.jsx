import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder, error, icon: Icon, required, ...props }) => {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
          } bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-colors duration-200 ${
            Icon ? 'pr-10' : ''
          }`}
          required={required}
          {...props}
        />
        {Icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <Icon />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
