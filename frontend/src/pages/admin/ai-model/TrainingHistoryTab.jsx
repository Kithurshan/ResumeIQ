import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye, FiActivity } from 'react-icons/fi';

const TrainingHistoryTab = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
        const res = await fetch('http://localhost:5000/api/ml/retrain/history');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            setHistory(data.data);
        }
    } catch (error) {
        console.error("Failed to fetch training history", error);
    }
  };

  let filteredHistory = history.filter(res => {
    if (searchQuery && !res.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'All' && res.status !== statusFilter) return false;

    // Optional: date filtering logic could be improved, but for now simple checking
    if (dateFilter !== 'All') {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (dateFilter === 'Today' && res.date !== dateString) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search training history ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Training">Training</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
          </select>
        </div>
      </div>

      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Training ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedHistory.map((res) => (
                <tr key={res.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 font-bold text-[#E1E1E1] flex items-center gap-2">
                    <FiActivity className="text-gray-500" />
                    {res.id}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{res.date}</td>
                  <td className="px-6 py-4 text-gray-400">{res.duration}</td>
                  <td className="px-6 py-4">
                    {res.status === 'Completed' && <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Completed</span>}
                    {res.status === 'Training' && <span className="text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Training</span>}
                    {res.status === 'Failed' && <span className="text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Failed</span>}
                    {res.status === 'Cancelled' && <span className="text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg text-xs font-medium">Cancelled</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/ai-model/history/${res.id}`)}
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
          {filteredHistory.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FiActivity className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No training history found matching your criteria.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
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

export default TrainingHistoryTab;
