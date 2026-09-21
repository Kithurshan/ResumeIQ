import React from 'react';
import { FiBell } from 'react-icons/fi';

const NotificationToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
    <span className="text-gray-300 font-medium">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BB86FC]"></div>
      <span className="ml-3 text-sm font-bold text-white w-8">
        {checked ? 'ON' : 'OFF'}
      </span>
    </label>
  </div>
);

const NotificationSettingsTab = ({ notifications, setNotifications }) => {

  const handleToggle = (key, value) => {
    setNotifications({ ...notifications, [key]: value });
  };

  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FiBell className="text-[#BB86FC]" /> Administrator Notifications
        </h3>
        <p className="text-sm text-gray-400 mb-6">Select which system events trigger a notification for the administrator.</p>

        <div className="max-w-2xl bg-[#111111] rounded-xl border border-gray-800 px-6 py-2">
          <NotificationToggle
            label="Recruiter Created"
            checked={notifications.recruiterCreated}
            onChange={(val) => handleToggle('recruiterCreated', val)}
          />
          <NotificationToggle
            label="Resume Upload Completed"
            checked={notifications.resumeUploaded}
            onChange={(val) => handleToggle('resumeUploaded', val)}
          />
          <NotificationToggle
            label="AI Analysis Failed"
            checked={notifications.aiFailed}
            onChange={(val) => handleToggle('aiFailed', val)}
          />
          <NotificationToggle
            label="AI Model Retraining Completed"
            checked={notifications.aiRetrained}
            onChange={(val) => handleToggle('aiRetrained', val)}
          />
          <NotificationToggle
            label="Report Generated"
            checked={notifications.reportGenerated}
            onChange={(val) => handleToggle('reportGenerated', val)}
          />
          <NotificationToggle
            label="System Settings Updated"
            checked={notifications.settingsUpdated}
            onChange={(val) => handleToggle('settingsUpdated', val)}
          />
        </div>
      </div>

    </div>
  );
};

export default NotificationSettingsTab;
