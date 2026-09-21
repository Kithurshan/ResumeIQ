import React, { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { useUI } from '../../../context/UIContext';

const InputField = ({ label, value, onChange, readOnly = false, type = "text" }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full px-4 py-3 rounded-xl text-sm transition-colors ${
        readOnly
          ? 'bg-[#111111] border border-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-[#111111] border border-gray-800 text-white focus:outline-none focus:border-[#BB86FC]'
      }`}
    />
  </div>
);

const ProfileInformation = ({ profileData, setProfileData, onSaveSuccess }) => {
  const { confirm, showToast } = useUI();
  const [formData, setFormData] = useState({
    fullName: profileData.fullName || '',
    email: profileData.email || '',
    phone: profileData.phone || ''
  });

  useEffect(() => {
    setFormData({
      fullName: profileData.fullName || '',
      email: profileData.email || '',
      phone: profileData.phone || ''
    });
  }, [profileData.fullName, profileData.email, profileData.phone]);

  const handleSaveClick = async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast("Name and Email are required.", "error");
      return;
    }

    const isConfirmed = await confirm({
      title: 'Save profile changes?',
      message: 'Your profile information will be updated.',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!isConfirmed) return;

    try {
      const adminId = localStorage.getItem('adminId') || JSON.parse(localStorage.getItem('user') || '{}')?.admin_id;

      if (!adminId) {
        throw new Error('Admin session not found.');
      }

      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : ''
      };

      const response = await api.put(`/admins/profile/${adminId}`, payload);
      const data = response?.data?.data || {};

      const updatedProfile = {
        ...profileData,
        fullName: data.full_name || formData.fullName.trim(),
        email: data.email || formData.email.trim(),
        phone: data.phone || formData.phone.trim(),
      };

      setProfileData(updatedProfile);

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...savedUser,
        full_name: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role || savedUser.role || 'admin',
        status: updatedProfile.status || savedUser.status || 'Active',
        profile_image: updatedProfile.imageUrl || savedUser.profile_image || ''
      }));

      showToast('Profile updated successfully.', 'success');
      if (onSaveSuccess) onSaveSuccess('Profile updated successfully.');
    } catch (error) {
      console.error('Failed to update admin profile:', error);
      const message = error?.response?.data?.detail || 'Unable to update profile. Please try again.';
      showToast(message, 'error');
    }
  };

  return (
    <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8">
      <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Profile Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <InputField
          label="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
        <InputField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <InputField
          label="Role"
          value={profileData.role}
          readOnly={true}
        />
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-400 mb-2">Account Status</label>
          <div className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-gray-800 flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] mr-2"></span>
            <span className="text-gray-500 text-sm font-medium">{profileData.status}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4 border-t border-gray-800 pt-6">
        <button
          onClick={() => setFormData({
            fullName: profileData.fullName || '',
            email: profileData.email || '',
            phone: profileData.phone || ''
          })}
          className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveClick}
          className="bg-[#BB86FC] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#A370F0] transition-colors"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
};

export default ProfileInformation;
