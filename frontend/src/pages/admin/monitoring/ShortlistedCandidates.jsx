import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiXCircle
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

const ShortlistedCandidates = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const fetchShortlisted = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admins/shortlisted`);
        const result = await response.json();
        if (result.success && result.data) {
          setCandidates(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch shortlisted candidates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShortlisted();
  }, []);

  const shortlisted = candidates.filter(c => c.status === 'Shortlisted').length;
  const waitlisted = candidates.filter(c => c.status === 'Waitlisted').length;
  const rejected = candidates.filter(c => c.status === 'Rejected').length;

  let filteredCandidates = candidates.filter(res => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!res.candidate?.toLowerCase().includes(q) &&
        !res.job?.toLowerCase().includes(q) &&
        !res.recruiter?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'All' && res.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <p>Loading candidate decisions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Shortlisted Candidates</h2>
          <p className="text-gray-400 text-sm">Monitor recruiter decisions on candidate progression.</p>
        </div>
        <ExportButtons data={filteredCandidates} filename="shortlisted_candidates_report" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Shortlisted" value={shortlisted} icon={FiCheckCircle} colorClass="text-[#22C55E]" bgClass="bg-[#22C55E]/10" />
        <StatCard title="Waitlisted" value={waitlisted} icon={FiClock} colorClass="text-amber-500" bgClass="bg-amber-500/10" />
        <StatCard title="Rejected" value={rejected} icon={FiXCircle} colorClass="text-[#EF4444]" bgClass="bg-[#EF4444]/10" />
      </div>


      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
        <div className="flex flex-wrap items-center gap-4">

          <div className="relative flex-1 min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidate, job, recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
            />
          </div>


          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Decisions</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>


      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4 text-center">AI Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Decision Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedCandidates.map((res) => (
                <tr key={res.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 font-bold text-[#E1E1E1]">{res.candidate}</td>
                  <td className="px-6 py-4 text-gray-400">{res.job}</td>
                  <td className="px-6 py-4 text-gray-400">{res.recruiter}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-[#BB86FC]">{res.score}%</span>
                  </td>
                  <td className="px-6 py-4">
                    {res.status === 'Shortlisted' && <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Shortlisted</span>}
                    {res.status === 'Waitlisted' && <span className="text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg text-xs font-medium">Waitlisted</span>}
                    {res.status === 'Rejected' && <span className="text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Rejected</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{res.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/monitoring/candidates/${res.id}?from=shortlisted`)}
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
          {filteredCandidates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FiUsers className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No candidates found matching your criteria.</p>
            </div>
          )}
        </div>


        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} records
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

export default ShortlistedCandidates;
