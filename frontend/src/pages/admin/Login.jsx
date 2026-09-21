import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';
import { authService } from '../../services/authService';
import { validateEmail } from '../../utils/validators';

const AdminLogin = () => {
    const REMEMBER_ME_KEY = 'adminRememberMe';
    const EMAIL_KEY = 'adminSavedEmail';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleLogin = async (e) => {
        e.preventDefault();

        const errors = {
            email: validateEmail(email),
            password: !password ? 'Password is required.' : ''
        };

        if (errors.email || errors.password) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        setIsLoading(true);
        setError('');

        try {
            await authService.login(email, password, rememberMe, 'admin');

            if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, 'true');
                localStorage.setItem(EMAIL_KEY, email);
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY);
                localStorage.removeItem(EMAIL_KEY);
            }

            setPassword('');
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password, please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0A0614] to-[#15082C] flex items-center justify-center p-4 md:p-8 
    font-inter relative overflow-hidden text-gray-300">

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7C3AED] rounded-full opacity-20 blur-[150px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#7C3AED] rounded-full opacity-10 blur-[150px]"></div>
            </div>
            <div
                className="absolute inset-0 z-0 opacity-25 pointer-events-none mix-blend-screen"
                style={{
                    backgroundImage: 'url(/src/assets/images/admin-doodle.png)',
                    backgroundSize: '400px',
                    backgroundRepeat: 'repeat'
                }}
            ></div>

            <div className="flex w-full z-10 flex-col items-center justify-center">


                <div className="w-full max-w-[480px] animate-fade-up relative">
                    <div className="bg-[rgba(17,17,23,0.75)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] rounded-[22px] 
          shadow-[0_20px_60px_rgba(124,58,237,0.25)] p-8 md:p-10">


                        <div className="mb-10">
                            <img
                                src="/src/assets/images/admin-logo.png"
                                alt="ResumeIQ Logo"
                                className="h-10 w-auto mb-1 object-contain"
                            />
                            <h2 className="text-sm font-poppins font-medium text-[#7C3AED] tracking-[0.2em] uppercase mt-1">
                                Administrator Portal
                            </h2>
                            <hr className="border-[#7C3AED] w-12 border-[1.5px] mt-6" />
                        </div>


                        <form onSubmit={handleLogin} className="space-y-5">

                            {error && (
                                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 p-3 rounded-lg text-sm flex items-start">
                                    <span>{error}</span>
                                </div>
                            )}


                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Administrator Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#7C3AED] 
                  transition-colors">
                                        <HiOutlineMail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                                        }}
                                        className={`w-full bg-[#1A1A22] border ${validationErrors.email ? 'border-red-500' : 'border-[#2E2E38]'} rounded-xl py-3 pl-11 pr-4
                     text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] focus:shadow-[0_0_15px_#7C3AED55] transition-all duration-300`}
                                        placeholder="admin@resumeiq.com"
                                    />
                                </div>
                                {validationErrors.email && <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>}
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#7C3AED]
                   transition-colors">
                                        <HiOutlineLockClosed className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                                        }}
                                        className={`w-full bg-[#1A1A22] border ${validationErrors.password ? 'border-red-500' : 'border-[#2E2E38]'} rounded-xl py-3 pl-11
                     pr-11 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] focus:shadow-[0_0_15px_#7C3AED55] transition-all duration-300`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {validationErrors.password && <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>}
                            </div>


                            <div className="flex items-center pt-2 pb-4">
                                <input
                                    id="remember-device"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => handleRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#2E2E38] bg-[#1A1A22] text-[#7C3AED] focus:ring-[#7C3AED] focus:ring-offset-0 
                  focus:ring-offset-transparent cursor-pointer"
                                />
                                <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-400 cursor-pointer select-none">
                                    Remember this device
                                </label>
                            </div>


                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#9333EA] hover:to-[#7C3AED] text-white 
                font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] 
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex justify-center items-center group relative 
                overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >

                                {!isLoading && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity 
                animate-glow-pulse pointer-events-none"></div>}

                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                    5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'LOGIN TO DASHBOARD'
                                )}
                            </button>
                        </form>

                        <hr className="border-[rgba(255,255,255,0.06)] my-8" />


                        <div className="flex items-start text-sm text-gray-500">
                            <HiOutlineShieldCheck className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-gray-400">Authorized Personnel Only</p>
                                <p className="text-xs mt-1 leading-relaxed">
                                    Administrator accounts are managed by the system owner.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminLogin;
