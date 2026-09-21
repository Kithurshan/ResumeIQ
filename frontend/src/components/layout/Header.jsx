import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import api from '../../api/axios';
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiImage,
  FiSettings,
  FiLogOut,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import ProfileImageUpload from '../../pages/admin/profile/ProfileImageUpload';
import { useUI } from '../../context/UIContext';

const Header = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const recruiterId = localStorage.getItem('recruiterId') || JSON.parse(localStorage.getItem('user') || '{}')?.recruiter_id;

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profile, setProfile] = useState(null);

  // Notification Settings State
  const [settings, setSettings] = useState({
    upload_notifs: true,
    analysis_completed: true,
    analysis_failed: true,
    ai_ready: true,
    shortlist_updates: true,
    deadline_reminder: true,
    system_announcements: true
  });

  // Fetch initial data
  useEffect(() => {
    if (!recruiterId) return;

    // Fetch Notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications', { headers: { 'x-recruiter-id': recruiterId } });
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    // Fetch Settings
    const fetchSettings = async () => {
      try {
        const res = await api.get('/notifications/settings', { headers: { 'x-recruiter-id': recruiterId } });
        if (res.data.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    // Fetch Profile
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/recruiters/profile/${recruiterId}`);
        if (res.data.success && res.data.data) {
          setProfile(res.data.data);
          setAvatarUrl(res.data.data.profile_image);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchNotifications();
    fetchSettings();
    fetchProfile();
  }, [recruiterId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const recruiterName = profile?.full_name || 'Recruiter';
  const recruiterDept = profile?.department || 'HR Office';
  const recruiterEmail = profile?.email || '';
  const initial = recruiterName.charAt(0).toUpperCase();

  // ─── Event Handlers ──────────────────────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {}, { headers: { 'x-recruiter-id': recruiterId } });
      setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`, {}, { headers: { 'x-recruiter-id': recruiterId } });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`, { headers: { 'x-recruiter-id': recruiterId } });
      setNotifications(notifications.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
    try {
      await api.put('/notifications/settings', settings, { headers: { 'x-recruiter-id': recruiterId } });
      setIsSettingsOpen(false);
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      console.error("Failed to save settings", err);
      showToast('Failed to save settings.', 'error');
    }
  };

  const handleLogout = async () => {
    const recruiterId = localStorage.getItem('recruiterId');
    await authService.logout(recruiterId);
    navigate('/recruiter/login');
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.notification_id);
    setIsNotifOpen(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">

        <h1 className="text-xl font-bold text-gray-900">{title}</h1>

        <div className="flex items-center gap-6">


          <div className="relative">
            <button
              onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
              className={`relative p-2 rounded-lg transition-colors ${isNotifOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>


            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      Mark All as Read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {notifications.map(notif => (
                        <div
                          key={notif.notification_id}
                          className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-500`}>
                            <FiBell className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                onClick={() => handleNotificationClick(notif)}
                                className={`text-sm cursor-pointer hover:underline ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}
                              >
                                {notif.title}
                              </p>
                              <button onClick={() => deleteNotification(notif.notification_id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-gray-400">{new Date(notif.created_at).toLocaleString()}</span>
                              {!notif.is_read && (
                                <button onClick={() => markAsRead(notif.notification_id)} className="text-xs font-medium text-blue-600 hover:underline">
                                  Mark as Read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiBell className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-gray-900 font-medium">No new notifications.</p>
                      <p className="text-gray-500 text-sm mt-1">You're all caught up.</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                    <button className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline">
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>


          <div className="relative">
            <div
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
            >
              <div className="w-9 h-9 bg-[#00c853] rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initial}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-900 leading-tight">{recruiterName}</p>
                <p className="text-xs text-gray-500 font-medium leading-tight mt-0.5">{recruiterDept}</p>
              </div>
              <FiChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </div>


            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  <div className="w-10 h-10 bg-[#00c853] rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{recruiterName}</p>
                    <p className="text-xs text-gray-500 truncate">{recruiterEmail}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate('/recruiter/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiUser className="w-4 h-4 text-gray-400" /> My Profile
                  </button>
                  <button onClick={() => { setIsUploadOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiImage className="w-4 h-4 text-gray-400" /> Change Profile Picture
                  </button>
                  <button onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiSettings className="w-4 h-4 text-gray-400" /> Notification Settings
                  </button>
                </div>
                <div className="p-2 border-t border-gray-100">
                  <button onClick={() => { setIsLogoutOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <FiLogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>




      <ProfileImageUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => setAvatarUrl(url)}
        uploadEndpoint="/recruiters/upload-profile-image"
        updateEndpoint={`/recruiters/update-profile-image/${recruiterId}`}
      />


      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive Resume Upload Notifications</span>
                <input type="checkbox" checked={settings.upload_notifs} onChange={() => setSettings({ ...settings, upload_notifs: !settings.upload_notifs })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive Resume Analysis Completed</span>
                <input type="checkbox" checked={settings.analysis_completed} onChange={() => setSettings({ ...settings, analysis_completed: !settings.analysis_completed })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive Resume Analysis Failed</span>
                <input type="checkbox" checked={settings.analysis_failed} onChange={() => setSettings({ ...settings, analysis_failed: !settings.analysis_failed })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive AI Recommendation Ready</span>
                <input type="checkbox" checked={settings.ai_ready} onChange={() => setSettings({ ...settings, ai_ready: !settings.ai_ready })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive Shortlist Updates</span>
                <input type="checkbox" checked={settings.shortlist_updates} onChange={() => setSettings({ ...settings, shortlist_updates: !settings.shortlist_updates })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive Job Deadline Reminder</span>
                <input type="checkbox" checked={settings.deadline_reminder} onChange={() => setSettings({ ...settings, deadline_reminder: !settings.deadline_reminder })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Receive System Announcements</span>
                <input type="checkbox" checked={settings.system_announcements} onChange={() => setSettings({ ...settings, system_announcements: !settings.system_announcements })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
              </label>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveSettings} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {isLogoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 pb-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle className="w-10 h-10 text-[#ff4b4b]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1f36] mb-3">Logout?</h3>
              <p className="text-[#697386] text-[15px] max-w-sm mx-auto mb-1">
                Are you sure you want to logout of your account?
              </p>
              <p className="text-[#697386] text-[15px] max-w-sm mx-auto mb-8">
                You will need to sign in again to access the dashboard.
              </p>
            </div>

            <div className="border-t border-gray-100 p-6 pt-5 bg-gray-50/50 flex items-center justify-center gap-4">
              <button onClick={() => setIsLogoutOpen(false)} className="px-6 py-2.5 text-[15px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={handleLogout} className="px-6 py-2.5 text-[15px] font-semibold text-white bg-[#ff4b4b] border border-[#ff4b4b] rounded-xl hover:bg-[#e03d3d] hover:border-[#e03d3d] transition-colors shadow-sm">
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
