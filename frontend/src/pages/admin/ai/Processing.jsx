import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCpu,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiLoader,
  FiXCircle,
  FiClock,
  FiFileText
} from 'react-icons/fi';

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

const Processing = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');
  const [recruiterFilter, setRecruiterFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const fetchAIProcessing = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/admins/ai-processing');
        const result = await response.json();
        if (result.success && result.data) {
          setRecords(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch AI processing records', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAIProcessing();
  }, []);

  const processedCount = records.filter(r => r.status === 'Completed').length;
  const queueCount = records.filter(r => r.status === 'Processing').length;
  const failedCount = records.filter(r => r.status === 'Failed').length;
  const avgTime = processedCount > 0 ? '1.2s' : '0s'; // Using mock avg time based on records

  const JOBS = [...new Set(records.map(r => r.job).filter(Boolean))].sort();
  const RECRUITERS = [...new Set(records.map(r => r.recruiter).filter(Boolean))].sort();
  // Companies are not clearly defined in the current mock data logic, skipping dynamically for now or could just use a static list if needed.

  const filteredRecords = records.filter(rec => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !rec.candidate?.toLowerCase().includes(q) &&
        !rec.resume?.toLowerCase().includes(q) &&
        !rec.job?.toLowerCase().includes(q) &&
        !rec.recruiter?.toLowerCase().includes(q)
      ) return false;
    }
    if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
    if (jobFilter !== 'All' && rec.job !== jobFilter) return false;
    if (recruiterFilter !== 'All' && rec.recruiter !== recruiterFilter) return false;
    // Company filtering ignored if no company prop exists
    return true;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="AI Monitoring" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">


            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">AI Processing</h2>
                <p className="text-gray-400">Monitor AI resume screening and processing activities across the platform.</p>
              </div>
              <ExportButtons data={filteredRecords} filename="ai_processing_records" />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatCard title="AI Processed" value={processedCount} icon={FiCheckCircle} colorClass="text-[#22C55E]" bgClass="bg-[#22C55E]/10" />
              <StatCard title="Processing Queue" value={queueCount} icon={FiLoader} colorClass="text-[#F59E0B]" bgClass="bg-[#F59E0B]/10" />
              <StatCard title="Failed Analysis" value={failedCount} icon={FiXCircle} colorClass="text-[#EF4444]" bgClass="bg-[#EF4444]/10" />
              <StatCard title="Avg Processing Time" value={avgTime} icon={FiClock} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
              <div className="flex flex-wrap items-center gap-4">

                <div className="relative flex-1 min-w-[220px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search candidate, resume, job..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
                  />
                </div>


                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC] text-[#E1E1E1]">
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing</option>
                  <option value="Failed">Failed</option>
                </select>


                <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC] text-[#E1E1E1]">
                  <option value="All">All List</option>
                  {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>


                <select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC] text-[#E1E1E1]">
                  <option value="All">All Recruiters</option>
                  {RECRUITERS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>


              </div>
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Resume</th>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Job</th>
                      <th className="px-6 py-4">Recruiter</th>
                      <th className="px-6 py-4 text-center">Processing Time</th>
                      <th className="px-6 py-4 text-center">AI Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {paginatedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                        <td className="px-6 py-4 font-medium text-[#E1E1E1]">
                          <div className="flex items-center gap-2">
                            <FiFileText className="text-gray-500 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{rec.resume}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#E1E1E1]">{rec.candidate}</td>
                        <td className="px-6 py-4 text-gray-400">{rec.job}</td>
                        <td className="px-6 py-4 text-gray-400">{rec.recruiter}</td>
                        <td className="px-6 py-4 text-center text-gray-400">{rec.processingTime}</td>
                        <td className="px-6 py-4 text-center">
                          {rec.aiScore ? (
                            <span className="font-bold text-[#BB86FC]">{rec.aiScore}%</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {rec.status === 'Completed' && (
                            <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
                              <FiCheckCircle className="w-3 h-3" /> Completed
                            </span>
                          )}
                          {rec.status === 'Processing' && (
                            <span className="text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" /> Processing
                            </span>
                          )}
                          {rec.status === 'Failed' && (
                            <span className="text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
                              <FiXCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => navigate(`/admin/ai/processing/${rec.id}`)}
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
                {filteredRecords.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <FiCpu className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No processing records found matching your criteria.</p>
                  </div>
                )}
              </div>


              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-800 text-gray-400 hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                          ? 'bg-[#BB86FC] text-black font-bold'
                          : 'text-gray-400 hover:bg-[#252525]'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-800 text-gray-400 hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
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

export default Processing;
