import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiActivity,
  FiCpu,
  FiPieChart,
  FiList,
  FiDatabase,
  FiSettings,
  FiUser,
  FiLogOut,
  FiAlertTriangle
} from 'react-icons/fi';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const getLinkClass = ({ isActive }) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";
    if (isActive) {
      return `${baseClass} bg-[#1F1F1F] text-[#BB86FC] shadow-sm`;
    } else {
      return `${baseClass} text-[#E1E1E1] hover:bg-[#1F1F1F] hover:text-white`;
    }
  };

  const getSubLinkClass = ({ isActive }) => {
    const baseClass = "block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200";
    if (isActive) {
      return `${baseClass} bg-[#1F1F1F] text-[#BB86FC] shadow-sm`;
    } else {
      return `${baseClass} text-gray-400 hover:bg-[#1F1F1F] hover:text-[#E1E1E1]`;
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-black border-r border-[#1F1F1F] flex flex-col font-inter">

      <div className="h-16 flex items-center px-6 border-b border-[#1F1F1F]">
        <img
          src="/src/assets/images/admin-logo.png"
          alt="ResumeIQ"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden items-center">
          <div className="w-7 h-7 bg-[#BB86FC] rounded flex items-center justify-center text-black font-bold text-xs mr-2">
            RQ
          </div>
          <span className="text-lg font-bold text-[#E1E1E1]">ResumeIQ</span>
        </div>
      </div>


      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

        <NavLink to="/admin/dashboard" className={getLinkClass}>
          <FiHome className="w-5 h-5 flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/recruiters" className={getLinkClass}>
          <FiUsers className="w-5 h-5 flex-shrink-0" />
          <span>Recruiter Management</span>
        </NavLink>

        <NavLink to="/admin/monitoring" className={getLinkClass}>
          <FiActivity className="w-5 h-5 flex-shrink-0" />
          <span>Recruitment Monitoring</span>
        </NavLink>

        <NavLink to="/admin/ai/processing" className={getLinkClass}>
          <FiCpu className="w-5 h-5 flex-shrink-0" />
          <span>AI Monitoring</span>
        </NavLink>

        <NavLink to="/admin/reports" className={getLinkClass}>
          <FiPieChart className="w-5 h-5 flex-shrink-0" />
          <span>Analytics & Reports</span>
        </NavLink>

        <NavLink to="/admin/activity" className={getLinkClass}>
          <FiList className="w-5 h-5 flex-shrink-0" />
          <span>Activity Logs</span>
        </NavLink>

        <NavLink to="/admin/ai-model" className={getLinkClass}>
          <FiDatabase className="w-5 h-5 flex-shrink-0" />
          <span>AI Model Management</span>
        </NavLink>

      </nav>


      <div className="p-3 border-t border-[#1F1F1F] flex flex-col gap-1">
        <NavLink to="/admin/settings" className={getLinkClass}>
          <FiSettings className="w-5 h-5 flex-shrink-0" />
          <span>System Settings</span>
        </NavLink>

        <NavLink to="/admin/profile" className={getLinkClass}>
          <FiUser className="w-5 h-5 flex-shrink-0" />
          <span>Profile</span>
        </NavLink>

        <button
          onClick={() => setIsLogoutOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#E1E1E1] hover:bg-red-900/30 hover:text-red-400 transition-all duration-200 w-full mt-2"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>


      {isLogoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
    </aside>
  );
};

export default AdminSidebar;
