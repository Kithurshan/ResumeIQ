import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';

const AdminHeader = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const { showToast } = useUI();

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const [settings, setSettings] = useState({
    recruiterUpdates: true,
    aiAlerts: true,
    systemHealth: true,
    reports: true
  });

  const adminId = localStorage.getItem('adminId') || '1';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications', { headers: { 'x-admin-id': adminId } });
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch admin notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`, {}, { headers: { 'x-admin-id': adminId } });
      setNotifications(notifications.map(n =>
        n.notification_id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/admin/notifications/read-all', {}, { headers: { 'x-admin-id': adminId } });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRememberMe');
    localStorage.removeItem('adminSavedEmail');
    navigate('/admin/login');
  };

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-20 bg-black border-b border-[#1F1F1F] flex items-center justify-between px-8 sticky top-0 z-30 font-inter">


        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-[#E1E1E1]">{title}</h1>
        </div>


        <div className="flex items-center gap-6">


          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-gray-400 hover:text-[#BB86FC] hover:bg-[#1F1F1F] rounded-full transition-colors relative"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff4b4b] rounded-full ring-2 ring-black"></span>
              )}
            </button>


            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#1F1F1F] rounded-2xl shadow-xl border border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111111]">
                  <h3 className="font-bold text-[#E1E1E1]">Notifications</h3>
                  <span className="text-xs font-medium bg-[#BB86FC]/20 text-[#BB86FC] px-2 py-1 rounded-full">
                    {unreadCount} New
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.notification_id}
                        className={`p-4 border-b border-gray-800 hover:bg-[#252525] transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-[#1a1a1a]' : ''}`}
                        onClick={() => markAsRead(notif.notification_id)}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#BB86FC]/10 text-[#BB86FC]`}>
                          <FiBell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${!notif.is_read ? 'text-[#E1E1E1]' : 'text-gray-400'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-[#BB86FC] rounded-full mt-2"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FiBell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-800 bg-[#111111] flex justify-between items-center">
                  <button onClick={markAllAsRead} className="text-xs font-medium text-gray-400 hover:text-white">
                    Mark all as read
                  </button>
                  <button className="text-sm font-medium text-[#BB86FC] hover:text-[#cfa4ff]">
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>


          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-[#1F1F1F] rounded-full transition-colors border border-transparent hover:border-gray-800"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border border-gray-700">
                A
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-[#E1E1E1] leading-tight">Administrator</p>
                <p className="text-xs text-[#BB86FC] font-medium leading-tight mt-0.5">System Admin</p>
              </div>
              <FiChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1F1F1F] rounded-2xl shadow-xl border border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="p-4 border-b border-gray-800 bg-[#111111] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#E1E1E1]">Administrator</p>
                    <p className="text-xs text-gray-500 truncate">admin@resumeiq.com</p>
                  </div>
                </div>
                <div className="p-2">
                  <button onClick={() => { setIsProfileOpen(false); navigate('/admin/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#252525] hover:text-[#E1E1E1] rounded-xl transition-colors">
                    <FiUser className="w-4 h-4" /> My Profile
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); navigate('/admin/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#252525] hover:text-[#E1E1E1] rounded-xl transition-colors">
                    <FiSettings className="w-4 h-4" /> System Settings
                  </button>
                </div>
                <div className="p-2 border-t border-gray-800 bg-[#111111]">
                  <button onClick={() => { setIsProfileOpen(false); setIsLogoutOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ff4b4b] hover:bg-red-900/20 rounded-xl transition-colors">
                    <FiLogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>


      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1F1F1F] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#111111]">
              <h3 className="text-lg font-bold text-[#E1E1E1]">System Notifications</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-[#E1E1E1]"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Recruiter Account Alerts</span>
                <input type="checkbox" checked={settings.recruiterUpdates} onChange={() => setSettings({ ...settings, recruiterUpdates: !settings.recruiterUpdates })} className="w-4 h-4 text-[#BB86FC] rounded bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">AI Engine Alerts</span>
                <input type="checkbox" checked={settings.aiAlerts} onChange={() => setSettings({ ...settings, aiAlerts: !settings.aiAlerts })} className="w-4 h-4 text-[#BB86FC] rounded bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">System Health Alerts</span>
                <input type="checkbox" checked={settings.systemHealth} onChange={() => setSettings({ ...settings, systemHealth: !settings.systemHealth })} className="w-4 h-4 text-[#BB86FC] rounded bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black" />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Weekly Reports</span>
                <input type="checkbox" checked={settings.reports} onChange={() => setSettings({ ...settings, reports: !settings.reports })} className="w-4 h-4 text-[#BB86FC] rounded bg-[#111111] border-gray-600 focus:ring-[#BB86FC] focus:ring-offset-black" />
              </label>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-800">
                <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2.5 text-sm font-medium text-[#E1E1E1] bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={() => { setIsSettingsOpen(false); showToast('Settings saved successfully.', 'success'); }} className="px-5 py-2.5 text-sm font-bold text-black bg-[#BB86FC] rounded-lg hover:bg-[#cfa4ff] transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {isLogoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1F1F1F] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 pb-6 text-center">
              <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle className="w-10 h-10 text-[#ff4b4b]" />
              </div>
              <h3 className="text-2xl font-bold text-[#E1E1E1] mb-3">Logout?</h3>
              <p className="text-gray-400 text-[15px] max-w-sm mx-auto mb-1">
                Are you sure you want to logout of your admin account?
              </p>
              <p className="text-gray-400 text-[15px] max-w-sm mx-auto mb-8">
                You will need to sign in again to access the system.
              </p>
            </div>

            <div className="border-t border-gray-800 p-6 pt-5 bg-black/20 flex items-center justify-center gap-4">
              <button onClick={() => setIsLogoutOpen(false)} className="px-6 py-2.5 text-[15px] font-semibold text-[#E1E1E1] bg-transparent border border-gray-600 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
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

export default AdminHeader;
