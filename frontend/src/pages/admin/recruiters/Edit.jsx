import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiCheck,
  FiAlertCircle,
  FiCamera,
  FiMapPin,
  FiHash
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const FormField = ({ label, field, type = 'text', icon: Icon, placeholder, children, form, handleChange, errors }) => (
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
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-[#111111] border rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${errors[field]
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

const Edit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Human Resources',
    position: '',
    location: '',
    status: 'Active'
  });

  const [profileImage, setProfileImage] = useState(null);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  // ─── Load recruiter data ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchRecruiter = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/profile/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const data = result.data;
          setForm({
            fullName: data.full_name || '',
            email: data.email || '',
            phone: data.phone || '',
            department: data.department || 'Human Resources',
            position: data.position || '',
            location: data.office_location || '',
            status: data.status || 'Active'
          });
          if (data.profile_image && !data.profile_image.startsWith('blob:')) {
            setProfileImage(data.profile_image);
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter data", err);
      } finally {
        setLoaded(true);
      }
    };
    fetchRecruiter();
  }, [id]);

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }

    if (!form.position.trim()) {
      newErrors.position = 'Position is required.';
    }

    if (!form.location.trim()) {
      newErrors.location = 'Office location is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/update/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form)
        });

        const result = await response.json();

        if (result.success) {
          setSuccessMessage('Recruiter updated successfully.');
          setTimeout(() => {
            navigate('/admin/recruiters');
          }, 1500);
        } else {
          setErrors({ form: result.detail || 'Failed to update recruiter.' });
        }
      } catch (err) {
        setErrors({ form: 'A network error occurred while updating.' });
      }
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recruiters/upload-profile-image`, {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success && uploadResult.imageUrl) {
          setProfileImage(uploadResult.imageUrl);
          await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/update-profile-image/${id}?image_url=${encodeURIComponent(uploadResult.imageUrl)}`, {
            method: 'PUT'
          });
        }
      } catch (err) {
        console.error('Failed to upload profile image:', err);
      }
    }
  };

  const fieldProps = { form, handleChange, errors };

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
                <h2 className="text-xl font-bold">Edit Recruiter</h2>
                <p className="text-gray-400 text-sm mt-1">Update recruiter information for <span className="text-[#BB86FC] font-medium">{id}</span>.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">


                {successMessage && (
                  <div className="flex items-center gap-3 p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl text-[#22C55E] text-sm font-medium">
                    <FiCheck className="w-5 h-5 flex-shrink-0" />
                    {successMessage}
                  </div>
                )}
                
                {errors.form && (
                  <div className="flex items-center gap-3 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm font-medium">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    {errors.form}
                  </div>
                )}


                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recruiter ID</label>
                  <div className="px-4 py-3 bg-[#111111] border border-gray-800 rounded-xl text-sm text-gray-500 cursor-not-allowed">
                    {id}
                  </div>
                </div>


                <div className="flex flex-col items-center justify-center mb-6 pt-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-[#111111] border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#BB86FC]">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-[#BB86FC]/20 text-[#BB86FC] text-3xl font-bold">
                          {form.fullName ? form.fullName.split(' ').map(n => n[0]).join('') : <FiUser />}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer">
                      <FiCamera className="w-6 h-6 text-white mb-1" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Change Profile Picture</p>
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
                    type="button"
                    onClick={() => navigate('/admin/recruiters')}
                    className="px-6 py-2.5 text-sm font-semibold text-[#E1E1E1] bg-transparent border border-gray-600 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-black bg-[#BB86FC] rounded-xl hover:bg-[#cfa4ff] transition-colors"
                  >
                    Save Changes
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

export default Edit;
