import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiSearch,
  FiEye,
  FiFilter
} from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import StatisticCard from '../../../components/ui/StatisticCard';
import { useUI } from '../../../context/UIContext';

const getRecruiterId = () => {
  const storageUser = localStorage.getItem('user');
  const storedRecruiterId = localStorage.getItem('recruiterId');

  if (storageUser) {
    try {
      const parsedUser = JSON.parse(storageUser);
      const userId = parsedUser?.recruiter_id ?? parsedUser?.recruiterId;
      if (userId != null && userId !== '') return String(userId);
    } catch {
      // Ignore malformed local storage and continue below.
    }
  }

  if (storedRecruiterId != null && storedRecruiterId !== '') {
    return String(storedRecruiterId);
  }

  throw new Error('No recruiter is logged in. Please sign in again.');
};

const getRankBadge = (rank) => {
  if (rank === 1) return <span className="flex items-center gap-1 font-bold text-yellow-600"><span className="text-lg">🥇</span> 1</span>;
  if (rank === 2) return <span className="flex items-center gap-1 font-bold text-gray-400"><span className="text-lg">🥈</span> 2</span>;
  if (rank === 3) return <span className="flex items-center gap-1 font-bold text-amber-700"><span className="text-lg">🥉</span> 3</span>;
  return <span className="font-semibold text-gray-500 pl-2">{rank}</span>;
};

const getRecommendationBadge = (rec) => {
  switch (rec) {
    case 'Highly Suitable': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#e8f5e9] text-[#00c853] border border-green-200">{rec}</span>;
    case 'Suitable': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">{rec}</span>;
    case 'Moderately Suitable': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">{rec}</span>;
    default: return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{rec}</span>;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Shortlisted': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#00c853] text-white shadow-sm">{status}</span>;
    case 'Waitlisted': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500 text-white shadow-sm">{status}</span>;
    case 'Pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">{status}</span>;
    default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm">{status}</span>;
  }
};

const Rankings = () => {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [candidates, setCandidates] = useState([]); 
  const [pagination, setPagination] = useState(null);

  const [filterRecommendation, setFilterRecommendation] = useState('All Recommendations');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterSort, setFilterSort] = useState('Sort By: Highest Score');

  // Fetch jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const recruiterId = getRecruiterId();

        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs`, {
          headers: { "X-Recruiter-ID": recruiterId }
        });

        const fetchedJobs = res.data.items || [];
        setJobs(fetchedJobs);
        if (fetchedJobs.length > 0) {
          setSelectedJob(fetchedJobs[0].id.toString());
        } else {
          setSelectedJob('');
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        showToast("Please sign in with a valid recruiter account before viewing rankings.", "error");
      }
    };
    fetchJobs();
  }, []);

  // Fetch rankings when selectedJob changes
  useEffect(() => {
    const fetchRankings = async () => {
      if (!selectedJob) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rankings/jobs/${selectedJob}?page=1&page_size=10`);
        setCandidates(res.data.data || []);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
        setCandidates([]);
      }
    };
    fetchRankings();
  }, [selectedJob]);

  const selectedJobTitle = jobs.find(j => String(j.id) === String(selectedJob))?.title || 'Unknown Job';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="AI Candidate Rankings" />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 pb-8">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Candidate Rankings</h1>
              <p className="text-gray-500 mt-1">View AI-ranked candidates for each job vacancy based on match scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatisticCard title="Total Ranked" value={pagination ? pagination.total_items : 0} icon={FiAward} colorClass="text-[#7C3AED]" bgClass="bg-[#7C3AED]/10" />
              <StatisticCard title="Shortlisted" value={candidates.filter(c => c.selection_status === "Shortlisted").length} icon={FiCheckCircle} colorClass="text-[#00c853]" bgClass="bg-[#e8f5e9]" />
              <StatisticCard title="Waitlisted" value={candidates.filter(c => c.selection_status === "Waitlisted").length} icon={FiClock} colorClass="text-amber-500" bgClass="bg-amber-50" />
              <StatisticCard title="Pending" value={candidates.filter(c => c.selection_status === "Pending").length} icon={FiUsers} colorClass="text-gray-500" bgClass="bg-gray-100" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">

              <div className="relative w-full xl:w-72 flex-shrink-0">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Candidate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full justify-start xl:justify-end">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <FiFilter className="text-gray-400" />
                  <select 
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                  >
                    {jobs.map(job => {
                      const formattedDate = new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      const jobIdStr = `JOB-${String(job.id).padStart(4, '0')}`;
                      return (
                        <option key={job.id} value={job.id}>
                          {`${job.title} — ${jobIdStr} • ${job.department || 'N/A'} • Deadline: ${formattedDate}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <select 
                  value={filterRecommendation}
                  onChange={(e) => setFilterRecommendation(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  <option>All Recommendations</option>
                  <option>Highly Suitable</option>
                  <option>Suitable</option>
                  <option>Moderately Suitable</option>
                  <option>Not Recommended</option>
                </select>

                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Shortlisted</option>
                  <option>Waitlisted</option>
                </select>

                <select 
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  <option>Sort By: Highest Score</option>
                  <option>Sort By: Lowest Score</option>
                  <option>Sort By: Newest</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 w-24">Rank</th>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Job</th>
                      <th className="px-6 py-4">AI Score</th>
                      <th className="px-6 py-4">Recommendation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {candidates
                      .filter(c => c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .filter(c => filterRecommendation === 'All Recommendations' || c.recommendation === filterRecommendation)
                      .filter(c => filterStatus === 'All Statuses' || c.selection_status === filterStatus)
                      .sort((a, b) => {
                        if (filterSort === 'Sort By: Highest Score') return b.scores.overall_score - a.scores.overall_score;
                        if (filterSort === 'Sort By: Lowest Score') return a.scores.overall_score - b.scores.overall_score;
                        if (filterSort === 'Sort By: Newest') return new Date(b.created_at) - new Date(a.created_at);
                        return 0;
                      })
                      .map((candidate) => (
                      <tr key={candidate.ranking_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRankBadge(candidate.rank_position)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {candidate.candidate_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {selectedJobTitle}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${candidate.scores.overall_score >= 90 ? 'bg-[#7C3AED]' : candidate.scores.overall_score >= 80 ? 'bg-[#00c853]' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(candidate.scores.overall_score, 100)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900">{candidate.scores.overall_score.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRecommendationBadge(candidate.recommendation)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(candidate.selection_status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => navigate(`/recruiter/candidates/${candidate.candidate_id}?job_id=${selectedJob}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-xs shadow-sm"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/30">
                <span>
                  Showing {pagination && pagination.total_items > 0 ? (pagination.current_page - 1) * pagination.page_size + 1 : 0} to{' '}
                  {pagination ? Math.min(pagination.current_page * pagination.page_size, pagination.total_items) : 0} of {pagination ? pagination.total_items : 0} results
                </span>
                <div className="flex gap-1">
                  <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <button className="px-3 py-1 border border-[#00c853] bg-[#e8f5e9] text-[#00c853] rounded font-medium">1</button>
                  <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Rankings;
