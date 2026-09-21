import React, { useState, useEffect } from 'react';
import { FiSettings, FiCpu, FiBell, FiSave } from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';
import { useUI } from '../../../context/UIContext';

import ResumeSettingsTab from './ResumeSettingsTab';
import AISettingsTab from './AISettingsTab';
import NotificationSettingsTab from './NotificationSettingsTab';

const System = () => {
  const { confirm, showToast } = useUI();
  const [activeTab, setActiveTab] = useState('resume');
  const [isLoading, setIsLoading] = useState(true);

  const [maxFileSize, setMaxFileSize] = useState(5);
  const [allowedTypes, setAllowedTypes] = useState({ pdf: true, docx: true });
  const [maxBulkUpload, setMaxBulkUpload] = useState(500);
  const [duplicateDetection, setDuplicateDetection] = useState(true);

  const [minScore, setMinScore] = useState(70);

  const [notifications, setNotifications] = useState({
    recruiterCreated: true,
    resumeUploaded: true,
    aiFailed: true,
    aiRetrained: true,
    reportGenerated: true,
    settingsUpdated: true
  });

  const tabs = [
    { id: 'resume', label: 'Resume Settings', icon: FiSettings },
    { id: 'ai', label: 'AI Settings', icon: FiCpu },
    { id: 'notifications', label: 'Notification Settings', icon: FiBell }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/settings/');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            const { resume_settings, ai_settings, notification_settings } = data.data;
            if (resume_settings) {
              setMaxFileSize(resume_settings.maxFileSize || 5);
              setAllowedTypes(resume_settings.allowedTypes || { pdf: true, docx: true });
              setMaxBulkUpload(resume_settings.maxBulkUpload || 500);
              setDuplicateDetection(resume_settings.duplicateDetection !== undefined ? resume_settings.duplicateDetection : true);
            }
            if (ai_settings) {
              setMinScore(ai_settings.minScore || 70);
            }
            if (notification_settings) {
              setNotifications(notification_settings);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        showToast("Failed to load system settings from backend.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const validateSettings = () => {
    if (maxFileSize <= 0) return "Maximum upload size must be greater than 0 MB.";
    if (maxBulkUpload <= 0) return "Bulk upload count must be greater than 0.";
    if (!allowedTypes.pdf && !allowedTypes.docx) return "Please select at least one allowed file type.";
    if (minScore < 0 || minScore > 100) return "Minimum AI score must be between 0% and 100%.";
    return null;
  };

  const handleSaveClick = async () => {
    const error = validateSettings();
    if (error) {
      showToast(error, 'error');
      return;
    }
    
    const isConfirmed = await confirm({
      title: 'Save system settings?',
      message: 'The changes will be applied globally across the ResumeIQ platform.',
      confirmText: 'Save Settings',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (isConfirmed) {
      try {
        const payload = {
          resume_settings: {
            maxFileSize,
            allowedTypes,
            maxBulkUpload,
            duplicateDetection
          },
          ai_settings: {
            minScore
          },
          notification_settings: notifications
        };

        const adminId = localStorage.getItem('adminId') || '1';
        const response = await fetch('http://127.0.0.1:5000/api/settings/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-id': adminId,
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          showToast('System settings updated successfully.', 'success');
        } else {
          const errData = await response.json();
          showToast(`Failed to update settings: ${errData.detail || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        console.error("Save settings error:", error);
        showToast("An error occurred while saving settings.", 'error');
      }
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="System Settings" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">


            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">System Settings</h2>
                <p className="text-gray-400">Configure ResumeIQ system preferences.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="text-gray-400 animate-pulse mt-8">Loading settings...</div>
            ) : (
              <>
                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-2 flex overflow-x-auto custom-scrollbar mt-4">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${isActive
                        ? 'bg-[#2A2A2A] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#BB86FC]' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>


            <div className="mt-6 bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8">
              {activeTab === 'resume' && (
                <ResumeSettingsTab
                  maxFileSize={maxFileSize} setMaxFileSize={setMaxFileSize}
                  allowedTypes={allowedTypes} setAllowedTypes={setAllowedTypes}
                  maxBulkUpload={maxBulkUpload} setMaxBulkUpload={setMaxBulkUpload}
                  duplicateDetection={duplicateDetection} setDuplicateDetection={setDuplicateDetection}
                />
              )}
              {activeTab === 'ai' && (
                <AISettingsTab minScore={minScore} setMinScore={setMinScore} />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettingsTab notifications={notifications} setNotifications={setNotifications} />
              )}


              <div className="mt-10 pt-6 border-t border-gray-800 flex justify-end gap-4">
                <button className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-[#252525] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  className="bg-[#BB86FC] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#A370F0] transition-colors flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" /> Save Settings
                </button>
              </div>
            </div>
          </>
        )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default System;
