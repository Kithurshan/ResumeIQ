import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import StatisticCard from '../../../components/ui/StatisticCard';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Shortlisted': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#00c853] text-white shadow-sm">{status}</span>;
    case 'Waitlisted': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500 text-white shadow-sm">{status}</span>;
    case 'Rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm">{status}</span>;
    default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">{status}</span>;
  }
};

const getRecommendationBadge = (rec) => {
  switch (rec) {
    case 'Strongly Recommended': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#e8f5e9] text-[#00c853] border border-green-200">{rec}</span>;
    case 'Recommended': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">{rec}</span>;
    case 'Consider': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">{rec}</span>;
    default: return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{rec || 'Not Recommended'}</span>;
  }
};

const ShortlistedCandidates = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const recruiterId = localStorage.getItem('recruiterId') || '';
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rankings/decisions`, {
          headers: { 'x-recruiter-id': recruiterId }
        });
        if (response.data.success) {
          setCandidates(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch decided candidates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, []);

  // Filter candidates by search term
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.job.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Shortlisted Candidates" />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 pb-8">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shortlisted Candidates</h1>
              <p className="text-gray-500 mt-1">Review recruitment decisions across all job vacancies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatisticCard title="Total Reviewed" value={candidates.length} icon={FiUsers} colorClass="text-blue-600" bgClass="bg-blue-50" />
              <StatisticCard title="Shortlisted" value={candidates.filter(c => c.status === 'Shortlisted').length} icon={FiCheckCircle} colorClass="text-[#00c853]" bgClass="bg-[#e8f5e9]" />
              <StatisticCard title="Waitlisted" value={candidates.filter(c => c.status === 'Waitlisted').length} icon={FiClock} colorClass="text-amber-500" bgClass="bg-amber-50" />
              <StatisticCard title="Rejected" value={candidates.filter(c => c.status === 'Rejected').length} icon={FiXCircle} colorClass="text-red-500" bgClass="bg-red-50" />
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
                  <select className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer">
                    <option>All List</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>QA Engineer</option>
                    <option>AI Engineer</option>
                  </select>
                </div>

                <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer">
                  <option>All Statuses</option>
                  <option>Shortlisted</option>
                  <option>Waitlisted</option>
                  <option>Rejected</option>
                </select>

                <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer">
                  <option>All Recommendations</option>
                  <option>Strongly Recommended</option>
                  <option>Recommended</option>
                  <option>Consider</option>
                  <option>Not Recommended</option>
                </select>

                <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer">
                  <option>Sort By: Newest</option>
                  <option>Sort By: Highest Score</option>
                  <option>Sort By: Name</option>
                  <option>Sort By: Decision Date</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Job</th>
                      <th className="px-6 py-4">AI Score</th>
                      <th className="px-6 py-4">Recommendation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Decision Date</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-medium">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-[#00c853] border-t-transparent rounded-full animate-spin"></div>
                            Loading decisions...
                          </div>
                        </td>
                      </tr>
                    ) : filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-medium">
                          No candidates found.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                              {candidate.name.charAt(0)}
                            </div>
                            {candidate.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{candidate.job}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${candidate.score >= 90 ? 'bg-[#00c853]' : candidate.score >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                  style={{ width: `${candidate.score}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-gray-900">{candidate.score.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getRecommendationBadge(candidate.recommendation)}</td>
                          <td className="px-6 py-4">{getStatusBadge(candidate.status)}</td>
                          <td className="px-6 py-4 text-gray-500">{candidate.decisionDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">

                              {candidate.status !== 'Rejected' ? (
                                <button
                                  onClick={() => navigate(`/recruiter/candidates/${candidate.id}?job_id=${candidate.job_id}&from=shortlisted&status=${candidate.status}`)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-xs shadow-sm"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                  View Details
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No actions</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>


              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/30">
                <span>Showing {filteredCandidates.length} results</span>
                <div className="flex gap-1">
                  <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <button className="px-3 py-1 border border-[#00c853] bg-[#e8f5e9] text-[#00c853] rounded font-medium">1</button>
                  <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ShortlistedCandidates;
