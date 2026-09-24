import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiList,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiUser,
  FiActivity,
  FiLock,
  FiFileText
} from 'react-icons/fi';
import axios from 'axios';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';
import ExportButtons from '../../../components/ui/ExportButtons';

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#1F1F1F] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#E1E1E1]">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const Logs = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');

  const [currentPage, setCurrentPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    loginEvents: 0,
    securityEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [recruitersList, setRecruitersList] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [statusesList, setStatusesList] = useState([]);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admins/activity-logs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          const logs = response.data.data.logs;
          setActivities(logs);
          setStats(response.data.data.stats);
          
          // Derive unique filter options
          const uniqueRecruiters = [...new Set(logs.map(l => l.recruiter))].filter(Boolean);
          const uniqueModules = [...new Set(logs.map(l => l.module))].filter(Boolean);
          const uniqueStatuses = [...new Set(logs.map(l => l.status))].filter(Boolean);
          
          setRecruitersList(uniqueRecruiters);
          setModulesList(uniqueModules);
          setStatusesList(uniqueStatuses);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  let filteredActivities = activities.filter(act => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!act.recruiter?.toLowerCase().includes(q) &&
        !act.activity?.toLowerCase().includes(q) &&
        !act.module?.toLowerCase().includes(q)) return false;
    }
    if (recruiterFilter !== 'All' && act.recruiter !== recruiterFilter) return false;
    if (moduleFilter !== 'All' && act.module !== moduleFilter) return false;
    if (statusFilter !== 'All' && act.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    if (status === 'Success') return <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> Success</span>;
    if (status === 'Failed') return <span className="text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1"><FiXCircle className="w-3 h-3" /> Failed</span>;
    if (status === 'Warning') return <span className="text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1"><FiAlertTriangle className="w-3 h-3" /> Warning</span>;
    return null;
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Activity Logs" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">


            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Recruiter Activity Logs</h2>
                <p className="text-gray-400">Monitor all important activities performed by recruiters within ResumeIQ.</p>
              </div>
              <ExportButtons />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatCard title="Total Activities" value={stats.totalActivities} icon={FiActivity} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
              <StatCard title="Today's Activities" value={stats.todayActivities} icon={FiList} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
              <StatCard title="Login Events" value={stats.loginEvents} icon={FiUser} colorClass="text-[#22C55E]" bgClass="bg-[#22C55E]/10" />
              <StatCard title="Security Events" value={stats.securityEvents} icon={FiLock} colorClass="text-amber-500" bgClass="bg-amber-500/10" />
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
              <div className="flex flex-wrap items-center gap-4">

                <div className="relative flex-1 min-w-[240px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search recruiter activity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
                  />
                </div>


                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>


                <select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
                  <option value="All">All Recruiters</option>
                  {recruitersList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>


                <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
                  <option value="All">All Modules</option>
                  {modulesList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>


                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
                  <option value="All">All Statuses</option>
                  {statusesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Recruiter</th>
                      <th className="px-6 py-4">Module</th>
                      <th className="px-6 py-4">Activity</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {paginatedActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{act.date}</td>
                        <td className="px-6 py-4 font-bold text-[#E1E1E1] whitespace-nowrap">{act.recruiter}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-800/50 text-gray-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-700">
                            {act.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#E1E1E1]">{act.activity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(act.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => navigate(`/admin/activity/${act.id}`)}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#BB86FC] hover:bg-[#BB86FC]/10 rounded-lg transition-colors border border-transparent hover:border-[#BB86FC]/20"
                            >
                              <FiEye className="w-3.5 h-3.5" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredActivities.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <FiList className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No activity logs found matching your criteria.</p>
                  </div>
                )}
              </div>


              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} records
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-800 text-gray-400 hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#BB86FC] text-black font-bold' : 'text-gray-400 hover:bg-[#252525]'}`}>{page}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-800 text-gray-400 hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Logs;
