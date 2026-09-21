import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye, FiUsers } from 'react-icons/fi';

const RecruiterReportsTab = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [companyFilter, setCompanyFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admins/reports/recruiters');
        const data = await res.json();
        if (data.success) {
          setReports(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch recruiter reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const COMPANIES = ['ResumeIQ']; // Static for now, or derive if needed

  let filteredReports = reports.filter(rep => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!rep.recruiter.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="text-gray-400 py-10">Loading reports...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recruiter name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
            />
          </div>

          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>

          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Companies</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4 text-center">List Created</th>
                <th className="px-6 py-4 text-center">Uploaded Resumes</th>
                <th className="px-6 py-4 text-center">AI Processed</th>
                <th className="px-6 py-4 text-center">Shortlisted</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 font-bold text-[#E1E1E1]">{rep.recruiter}</td>
                  <td className="px-6 py-4 text-center font-medium">{rep.jobs}</td>
                  <td className="px-6 py-4 text-center font-medium">{rep.uploaded}</td>
                  <td className="px-6 py-4 text-center font-medium text-[#BB86FC]">{rep.ai_processed}</td>
                  <td className="px-6 py-4 text-center font-medium text-emerald-500">{rep.shortlisted}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/reports/recruiter/${rep.id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#BB86FC] hover:bg-[#BB86FC]/10 rounded-lg transition-colors border border-transparent hover:border-[#BB86FC]/20"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FiUsers className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No recruiter reports found matching your criteria.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} records
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

export default RecruiterReportsTab;
