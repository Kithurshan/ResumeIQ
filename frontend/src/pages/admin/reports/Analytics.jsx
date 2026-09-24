import React, { useState } from 'react';
import {
  FiBarChart2,
  FiBriefcase,
  FiUsers,
  FiCpu,
  FiDownload,
  FiPrinter
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

import DashboardAnalyticsTab from '../../../components/reports/DashboardAnalyticsTab';
import RecruitmentReportsTab from '../../../components/reports/RecruitmentReportsTab';
import RecruiterReportsTab from '../../../components/reports/RecruiterReportsTab';
import AIReportsTab from '../../../components/reports/AIReportsTab';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard Analytics', icon: FiBarChart2 },
    { id: 'recruitment', label: 'Recruitment Reports', icon: FiBriefcase },
    { id: 'recruiter', label: 'Recruiter Reports', icon: FiUsers },
    { id: 'ai', label: 'AI Reports', icon: FiCpu }
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Analytics & Reports" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">


            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Analytics & Reports</h2>
                <p className="text-gray-400">Monitor recruitment statistics, recruiter performance, AI performance and generate reports.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] border border-gray-800 text-[#E1E1E1] rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
                >
                  <FiPrinter className="w-4 h-4" /> Print
                </button>
                <div className="h-8 w-px bg-gray-800"></div>
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admins/reports/export/excel`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#BB86FC]/10 text-[#BB86FC] rounded-xl hover:bg-[#BB86FC]/20 transition-colors font-bold text-sm"
                >
                  <FiDownload className="w-4 h-4" /> Export Excel
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#BB86FC] text-black rounded-xl hover:bg-[#A370F0] transition-colors font-bold text-sm shadow-[0_0_15px_rgba(187,134,252,0.3)]"
                >
                  <FiDownload className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-2 flex overflow-x-auto custom-scrollbar">
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


            <div className="mt-6">
              {activeTab === 'dashboard' && <DashboardAnalyticsTab />}
              {activeTab === 'recruitment' && <RecruitmentReportsTab />}
              {activeTab === 'recruiter' && <RecruiterReportsTab />}
              {activeTab === 'ai' && <AIReportsTab />}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
