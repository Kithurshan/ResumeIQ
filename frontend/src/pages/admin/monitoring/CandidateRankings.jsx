import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiEye,
  FiAward,
  FiThumbsUp,
  FiThumbsDown,
  FiBarChart2
} from 'react-icons/fi';

import ExportButtons from '../../../components/ui/ExportButtons';

const JOBS = [];
const RECRUITERS = [];
const RECOMMENDATIONS = ['Highly Recommended', 'Recommended', 'Not Recommended'];

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

const CandidateRankings = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [recFilter, setRecFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');
  const [recruiterFilter, setRecruiterFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Highest Score');
  const [currentPage, setCurrentPage] = useState(1);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/admins/rankings');
        const result = await response.json();
        if (result.success && result.data) {
          setRankings(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch rankings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const totalRanked = rankings.length;
  const highlyRecommended = rankings.filter(r => r.recommendation === 'Highly Recommended').length;
  const recommended = rankings.filter(r => r.recommendation === 'Recommended').length;
  const notRecommended = rankings.filter(r => r.recommendation === 'Not Recommended').length;

  const JOBS = [...new Set(rankings.map(r => r.job).filter(Boolean))].sort();
  const RECRUITERS = [...new Set(rankings.map(r => r.recruiter).filter(Boolean))].sort();

  let filteredRankings = rankings.filter(res => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!res.candidate?.toLowerCase().includes(q) &&
        !res.job?.toLowerCase().includes(q) &&
        !res.recruiter?.toLowerCase().includes(q)) return false;
    }
    if (recFilter !== 'All' && res.recommendation !== recFilter) return false;
    if (jobFilter !== 'All' && res.job !== jobFilter) return false;
    if (recruiterFilter !== 'All' && res.recruiter !== recruiterFilter) return false;
    return true;
  });

  if (sortBy === 'Highest Score') {
    filteredRankings.sort((a, b) => b.score - a.score);
  } else if (sortBy === 'Lowest Score') {
    filteredRankings.sort((a, b) => a.score - b.score);
  }

  const totalPages = Math.ceil(filteredRankings.length / itemsPerPage);
  const paginatedRankings = filteredRankings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <p>Loading candidate rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Candidate Rankings</h2>
          <p className="text-gray-400 text-sm">Monitor AI-generated candidate rankings and recommendations.</p>
        </div>
        <ExportButtons data={filteredRankings} filename="candidate_rankings_report" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Ranked Candidates" value={totalRanked} icon={FiBarChart2} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
        <StatCard title="Highly Recommended" value={highlyRecommended} icon={FiAward} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
        <StatCard title="Recommended" value={recommended} icon={FiThumbsUp} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
        <StatCard title="Not Recommended" value={notRecommended} icon={FiThumbsDown} colorClass="text-[#EF4444]" bgClass="bg-[#EF4444]/10" />
      </div>


      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">

            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidate, job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
              />
            </div>


            <select value={recFilter} onChange={(e) => setRecFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
              <option value="All">All Recommendations</option>
              {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>


            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
              <option value="All">All List</option>
              {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>


            <select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
              <option value="All">All Recruiters</option>
              {RECRUITERS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>


          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 bg-[#1F1F1F] border border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:border-[#BB86FC]">
            <option value="Highest Score">Sort by Highest Score</option>
            <option value="Lowest Score">Sort by Lowest Score</option>
          </select>
        </div>
      </div>


      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-center w-20">Rank</th>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4 text-center">AI Score</th>
                <th className="px-6 py-4">Recommendation</th>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedRankings.map((res) => (
                <tr key={res.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${res.rank === 1 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' :
                        res.rank === 2 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50' :
                          res.rank === 3 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' :
                            'bg-gray-800 text-gray-500'
                      }`}>
                      #{res.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#E1E1E1]">{res.candidate}</td>
                  <td className="px-6 py-4 text-gray-400">{res.job}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg text-white">{res.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {res.recommendation === 'Highly Recommended' && <span className="text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs font-medium">Highly Recommended</span>}
                    {res.recommendation === 'Recommended' && <span className="text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-lg text-xs font-medium">Recommended</span>}
                    {res.recommendation === 'Not Recommended' && <span className="text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Not Recommended</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{res.recruiter}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/monitoring/candidates/${res.id}`)}
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
          {filteredRankings.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FiUsers className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No candidates found matching your criteria.</p>
            </div>
          )}
        </div>


        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRankings.length)} of {filteredRankings.length} records
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

export default CandidateRankings;
