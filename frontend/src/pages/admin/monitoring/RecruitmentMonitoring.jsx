import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiFileText,
  FiStar,
  FiUserCheck
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

import JobMonitoring from './JobMonitoring';
import ResumeMonitoring from './ResumeMonitoring';
import CandidateRankingsAdmin from './CandidateRankings';
import ShortlistedCandidatesAdmin from './ShortlistedCandidates';

const RecruitmentMonitoring = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam || 'jobs');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/admin/monitoring?tab=${tabId}`, { replace: true });
  };

  const tabs = [
    { id: 'jobs', label: 'Job Monitoring', icon: FiBriefcase },
    { id: 'resumes', label: 'Resume Monitoring', icon: FiFileText },
    { id: 'rankings', label: 'Candidate Rankings', icon: FiStar },
    { id: 'shortlisted', label: 'Shortlisted Candidates', icon: FiUserCheck }
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Recruitment Monitoring" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">

            
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Recruitment Monitoring</h2>
                <p className="text-gray-400">Monitor all recruitment activities, jobs, resumes, and candidates across the system.</p>
              </div>
            </div>

            
            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-2 flex overflow-x-auto custom-scrollbar">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                      isActive
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
              {activeTab === 'jobs' && <JobMonitoring />}
              {activeTab === 'resumes' && <ResumeMonitoring />}
              {activeTab === 'rankings' && <CandidateRankingsAdmin />}
              {activeTab === 'shortlisted' && <ShortlistedCandidatesAdmin />}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default RecruitmentMonitoring;
