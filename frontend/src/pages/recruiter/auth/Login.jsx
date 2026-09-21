import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import { validateEmail } from '../../../utils/validators';

const RecruiterLogin = () => {
  const REMEMBER_ME_KEY = 'recruiterRememberMe';
  const EMAIL_KEY = 'recruiterSavedEmail';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── UI states ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const savedEmail = localStorage.getItem(EMAIL_KEY) || '';

    if (savedRememberMe) {
      setRememberMe(true);
      setEmail(savedEmail);
    }

    setPassword('');
  }, []);

  const handleRememberMe = (checked) => {
    setRememberMe(checked);

    if (checked) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      localStorage.setItem(EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(EMAIL_KEY);
    }

    setPassword('');
  };

  const handleForgotPassword = () => {
    navigate('/recruiter/forgot-password');
  };

  // ── Login Handler ──
  const handleLogin = async (e) => {
    e.preventDefault();

    // Client-side validation before calling the backend
    const errors = {
      email: validateEmail(email),
      password: !password ? 'Password is required.' : '',
    };

    if (errors.email || errors.password) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);
    setError('');

    try {
      await authService.login(email, password, rememberMe);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }

      setPassword('');
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/src/assets/images/login-bg.png')`,
        backgroundColor: '#e8f5e9',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl overflow-hidden min-h-[500px]">


        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">


          <div className="w-full h-10 flex mb-8">
            <img
              src="/src/assets/images/logo.png"
              alt="ResumeIQ Logo"
              className="h-10 w-auto object-contain"
              onError={(e) => {

                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />

            <div className="hidden items-center">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold mr-2 text-sm">
                RQ
              </div>
              <span className="text-xl font-bold text-gray-900">ResumeIQ</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-8">Login</h2>


          <form onSubmit={handleLogin} className="w-full">


            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg flex items-start">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}


            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                }}
                placeholder="username@gmail.com"
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  } bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-colors duration-200`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>


            <div className="mb-2 w-full relative">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                }}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-10 rounded-lg border ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  } bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-colors duration-200`}
              />

              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
              )}
            </div>


            <div className="flex items-center justify-between mb-6 mt-3">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#00c853] focus:ring-[#00c853] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                  Remember Me
                </label>
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-[#00c853] hover:text-[#00b048] transition-colors"
              >
                Forgot Password?
              </button>
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg font-semibold bg-[#00c853] hover:bg-[#00b048] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (

                <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In'}
            </button>

          </form>
        </div>


        <div className="hidden md:flex w-1/2 items-center justify-center p-12 z-0 relative">
          <img
            src="/src/assets/images/login.gif"
            alt="HR Illustration"
            className="w-full max-w-2xl h-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />

          <div className="hidden flex-col items-center justify-center text-center absolute inset-0 p-8">
            <h3 className="text-3xl font-bold text-[#33691e]">Welcome Back</h3>
            <p className="text-[#558b2f] mt-4 text-lg">Manage your recruitment pipeline efficiently.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecruiterLogin;
