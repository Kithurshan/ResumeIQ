/**
 * Add Recruiter Page
 * 
 * This component allows admins to add new recruiters.
 * Beginner-friendly features:
 * - Clear form validation
 * - Loading state while saving
 * - Error messages for the user
 * - Success message confirmation
 * - Database integration
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
  FiCamera,
  FiMapPin,
  FiHash,
  FiBriefcase,
  FiLoader
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';
import { recruiterService } from '../../../services/recruiterService';

const FormField = ({ label, field, type = 'text', icon: Icon, placeholder, children, form, handleChange, errors, isLoading }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    {children || (
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />}
        <input
          type={type}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-[#111111] border rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errors[field]
            ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
            : 'border-gray-800 focus:border-[#BB86FC] focus:ring-[#BB86FC]'
            }`}
        />
      </div>
    )}
    {errors[field] && (
      <p className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
        <FiAlertCircle className="w-3 h-3" /> {errors[field]}
      </p>
    )}
  </div>
);

const Add = () => {
  const navigate = useNavigate();

  // ─── Form State ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Human Resources',
    position: '',
    location: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  const [profileImage, setProfileImage] = useState(null);

  // ─── UI State ────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Validation ──────────────────────────────────────────────────────────
  /**
   * Validate form data before submission
   * Returns true if all fields are valid, false otherwise
   */
  const validate = () => {
    const newErrors = {};

    // Full Name Validation
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    // Email Validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Phone Validation
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }

    // Position Validation
    if (!form.position.trim()) {
      newErrors.position = 'Position is required.';
    }

    // Location Validation
    if (!form.location.trim()) {
      newErrors.location = 'Office location is required.';
    }

    // Password Validation
    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
    }

    // Confirm Password Validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handle Submit ───────────────────────────────────────────────────────
  /**
   * Handle form submission
   * 1. Validate the form
   * 2. Call the recruiter service to save to database
   * 3. Handle success or error responses
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate form data
    if (!validate()) {
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Prepare the data to send to the backend
      const recruiterData = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        position: form.position.trim(),
        location: form.location.trim(),
        department: form.department,
        status: form.status,
        profileImage: profileImage, // Optional
      };

      // Call the recruiter service to save to database
      const response = await recruiterService.addRecruiter(recruiterData);

      // Success! Show message and redirect
      setSuccessMessage('✓ Recruiter account created successfully! Redirecting...');
      
      // Wait 2 seconds before redirecting
      setTimeout(() => {
        navigate('/admin/recruiters');
      }, 2000);

    } catch (error) {
      // Error occurred - show error message to user
      setErrorMessage(error.message || 'Failed to create recruiter. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Handle form field changes
   * Updates the form state and clears error for that field
   */
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear error message when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should not exceed 5MB.');
        return;
      }

      setProfileImage(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('http://localhost:5000/api/recruiters/upload-profile-image', {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success && uploadResult.imageUrl) {
          setProfileImage(uploadResult.imageUrl);
        }
      } catch (err) {
        console.error('Failed to upload profile image:', err);
      }
    }
  };

  const fieldProps = { form, handleChange, errors, isLoading };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Recruiter Management" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-2xl mx-auto pb-8">


            <button
              onClick={() => navigate('/admin/recruiters')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#E1E1E1] text-sm font-medium mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Recruiter List
            </button>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold">Add New Recruiter</h2>
                <p className="text-gray-400 text-sm mt-1">Create a new recruiter account for the ResumeIQ platform.</p>
                {/* ─── Error Message ─────────────────────────────────────────────────────────── */}
                {errorMessage && (
                  <div className="flex items-center gap-3 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm font-medium">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}

                {/* ─── Success Message ───────────────────────────────────────────────────────────── */}              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">


                {successMessage && (
                  <div className="flex items-center gap-3 p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl text-[#22C55E] text-sm font-medium">
                    <FiCheck className="w-5 h-5 flex-shrink-0" />
                    {successMessage}
                  </div>
                )}


                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-[#111111] border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#BB86FC]">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <FiCamera className="w-8 h-8 text-gray-600 group-hover:text-[#BB86FC] transition-colors" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Upload Profile Picture (Optional)</p>
                </div>


                <FormField label="Full Name" field="fullName" icon={FiUser} placeholder="Enter full name" {...fieldProps} />


                <FormField label="Email Address" field="email" type="email" icon={FiMail} placeholder="Enter email address" {...fieldProps} />


                <FormField label="Phone Number" field="phone" icon={FiPhone} placeholder="+94 77 000 0000" {...fieldProps} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <div className="relative">
                      <FiHash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input type="text" disabled value={form.department} className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-gray-800 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>


                  <FormField label="Position" field="position" icon={FiBriefcase} placeholder="e.g. Senior Recruiter" {...fieldProps} />
                </div>


                <FormField label="Office Location" field="location" icon={FiMapPin} placeholder="e.g. Colombo HQ" {...fieldProps} />


                <FormField label="Password" field="password" {...fieldProps}>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      disabled={isLoading}
                      className={`w-full pl-11 pr-11 py-3 bg-[#111111] border rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errors.password
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-gray-800 focus:border-[#BB86FC] focus:ring-[#BB86FC]'
                        }`}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 disabled:opacity-50"
                    >
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>


                <FormField label="Confirm Password" field="confirmPassword" {...fieldProps}>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      disabled={isLoading}
                      className={`w-full pl-11 pr-11 py-3 bg-[#111111] border rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errors.confirmPassword
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-gray-800 focus:border-[#BB86FC] focus:ring-[#BB86FC]'
                        }`}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>


                <FormField label="Status" field="status" {...fieldProps}>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={form.status === 'Active'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-4 h-4 text-[#BB86FC] bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black"
                      />
                      <span className="text-sm text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={form.status === 'Inactive'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-4 h-4 text-[#BB86FC] bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black"
                      />
                      <span className="text-sm text-gray-300">Inactive</span>
                    </label>
                  </div>
                </FormField>


                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-semibold text-[#E1E1E1] bg-transparent border border-gray-600 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#3B82F6] rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Save & Send Credentials
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Add;
