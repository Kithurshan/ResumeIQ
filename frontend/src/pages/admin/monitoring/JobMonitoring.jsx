import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiEdit,
  FiFolderMinus
} from 'react-icons/fi';

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

const JobMonitoring = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [recruiterFilter, setRecruiterFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/admins/jobs');
        const result = await response.json();
        if (result.success && result.data) {
          setJobs(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'Active').length;
  const closedJobs = jobs.filter(j => j.status === 'Closed').length;
  const draftJobs = jobs.filter(j => j.status === 'Draft').length;
  const totalJobs = jobs.length;

  const COMPANIES = [...new Set(jobs.map(j => j.company).filter(Boolean))].sort();
  const RECRUITERS = [...new Set(jobs.map(j => j.recruiter).filter(Boolean))].sort();

  let filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!job.title?.toLowerCase().includes(q) &&
        !job.company?.toLowerCase().includes(q) &&
        !job.recruiter?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'All' && job.status !== statusFilter) return false;
    if (companyFilter !== 'All' && job.company !== companyFilter) return false;
    if (recruiterFilter !== 'All' && job.recruiter !== recruiterFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Job Descriptions</h2>
          <p className="text-gray-400 text-sm">Monitor all job descriptions created by recruiters.</p>
        </div>
        <ExportButtons data={filteredJobs} filename="job_monitoring_report" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Active List" value={activeJobs} icon={FiCheckCircle} colorClass="text-[#22C55E]" bgClass="bg-[#22C55E]/10" />
        <StatCard title="Closed List" value={closedJobs} icon={FiFolderMinus} colorClass="text-[#F59E0B]" bgClass="bg-[#F59E0B]/10" />
        <StatCard title="Draft List" value={draftJobs} icon={FiEdit} colorClass="text-gray-400" bgClass="bg-gray-800" />
        <StatCard title="Total List" value={totalJobs} icon={FiBriefcase} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
      </div>


      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
        <div className="flex flex-wrap items-center gap-4">

          <div className="relative flex-1 min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Job Title, Company, Recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
            />
          </div>


          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
          </select>


          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Companies</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>


          <select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
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
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4 text-center">Candidates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 font-medium text-[#E1E1E1]">{job.title}</td>
                  <td className="px-6 py-4">{job.company}</td>
                  <td className="px-6 py-4">{job.recruiter}</td>
                  <td className="px-6 py-4 text-center font-bold text-[#E1E1E1]">{job.candidates}</td>
                  <td className="px-6 py-4">
                    {job.status === 'Active' && <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Active</span>}
                    {job.status === 'Closed' && <span className="text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Closed</span>}
                    {job.status === 'Draft' && <span className="text-gray-400 bg-gray-700/30 px-2.5 py-1 rounded-lg text-xs font-medium">Draft</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{job.created}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/monitoring/jobs/${job.id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors border border-transparent hover:border-[#3B82F6]/20"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredJobs.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FiBriefcase className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No jobs found matching your criteria.</p>
            </div>
          )}
        </div>


        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} records
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
  );
};

export default JobMonitoring;
