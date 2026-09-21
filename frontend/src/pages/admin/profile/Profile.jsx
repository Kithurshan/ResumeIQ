import React, { useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';
import api from '../../../api/axios';

import ProfileCard from './ProfileCard';
import ProfileInformation from './ProfileInformation';
import ChangePassword from './ChangePassword';
import ProfileImageUpload from './ProfileImageUpload';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    imageUrl: ''
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');

    if (!adminId) {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser?.admin_id) {
        loadProfile(savedUser.admin_id);
      }
      return;
    }

    loadProfile(adminId);
  }, []);

  const loadProfile = async (adminId) => {
    try {
      const response = await api.get(`/admins/profile/${adminId}`);
      const data = response?.data?.data || {};

      setProfileData({
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'admin',
        status: data.status || 'Active',
        imageUrl: data.profile_image || ''
      });
    } catch (error) {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

      if (savedUser?.admin_id && String(savedUser.admin_id) === String(adminId)) {
        setProfileData({
          fullName: savedUser.full_name || '',
          email: savedUser.email || '',
          phone: savedUser.phone || '',
          role: savedUser.role || 'admin',
          status: savedUser.status || 'Active',
          imageUrl: savedUser.profile_image || ''
        });
      }

      console.error('Failed to load admin profile:', error);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleImageUpload = (newImageUrl) => {
    setProfileData(prev => ({ ...prev, imageUrl: newImageUrl }));
    showSuccess('Profile picture updated successfully.');
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Admin Profile" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="max-w-5xl mx-auto pb-12">

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Admin Profile</h2>
              <p className="text-gray-400">Manage your personal account information.</p>
            </div>

            {successMessage && (
              <div className="mb-6 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
                <span className="font-medium">{successMessage}</span>
                <button onClick={() => setSuccessMessage('')} className="text-[#22C55E] hover:text-white transition-colors">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


              <div className="lg:col-span-1 space-y-8">
                <ProfileCard
                  profileData={profileData}
                  onImageUploadClick={() => setIsUploadModalOpen(true)}
                />
              </div>


              <div className="lg:col-span-2 space-y-8">


                <ProfileInformation
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onSaveSuccess={showSuccess}
                />


                <ChangePassword
                  onSaveSuccess={showSuccess}
                />

              </div>

            </div>

          </div>
        </main>
      </div>


      <ProfileImageUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleImageUpload}
      />

    </div>
  );
};

export default Profile;
