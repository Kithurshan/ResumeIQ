import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  FiHome,
  FiBriefcase,
  FiUpload,
  FiUsers,
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiAlertTriangle,
} from 'react-icons/fi';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const getLinkClass = ({ isActive }) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";
    if (isActive) {
      return `${baseClass} bg-[#e8f5e9] text-[#00c853] shadow-sm`;
    } else {
      return `${baseClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900`;
    }
  };

  const handleLogout = async () => {
    const recruiterId = localStorage.getItem('recruiterId');
    await authService.logout(recruiterId);
    navigate('/recruiter/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">

      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <img
          src="/src/assets/images/logo.png"
          alt="ResumeIQ"
          className="h-8 w-auto object-contain"
          onError={(e) => {

            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden items-center">
          <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs mr-2">
            RQ
          </div>
          <span className="text-lg font-bold text-gray-900">ResumeIQ</span>
        </div>
      </div>


      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">


        <NavLink to="/recruiter/dashboard" className={getLinkClass}>
          <FiHome className="w-5 h-5 flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>


        <NavLink to="/recruiter/jobs" className={getLinkClass}>
          <FiBriefcase className="w-5 h-5 flex-shrink-0" />
          <span>Job Postings</span>
        </NavLink>


        <NavLink to="/recruiter/resumes/upload" className={getLinkClass}>
          <FiUpload className="w-5 h-5 flex-shrink-0" />
          <span>Upload Resumes</span>
        </NavLink>


        <NavLink to="/recruiter/rankings" className={getLinkClass}>
          <FiBarChart2 className="w-5 h-5 flex-shrink-0" />
          <span>Rankings</span>
        </NavLink>


        <NavLink to="/recruiter/shortlisted" className={getLinkClass}>
          <FiUsers className="w-5 h-5 flex-shrink-0" />
          <span>Shortlisted Candidates</span>
        </NavLink>


        <NavLink to="/recruiter/profile" className={getLinkClass}>
          <FiUser className="w-5 h-5 flex-shrink-0" />
          <span>My Profile</span>
        </NavLink>

      </nav>


      <div className="p-3 border-t border-gray-100">
        <button onClick={() => setIsLogoutOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full">
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>


      {
        isLogoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
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
        )
      }
    </aside >
  );
};

export default Sidebar;
