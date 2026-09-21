import React, { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiUploadCloud,
  FiList,
  FiUsers,
  FiBell,
  FiStar
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import StatisticCard from '../../../components/ui/StatisticCard';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── Chart default options ──────────────────────────────────
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, padding: 20 }
    }
  }
};

const barOptions = {
  ...chartOptions,
  indexAxis: 'y',
  scales: {
    x: { grid: { display: false } },
    y: { grid: { display: false } }
  }
};

const lineOptions = {
  ...chartOptions,
  scales: {
    x: { grid: { display: false } },
    y: { border: { dash: [4, 4] } }
  }
};

// ── Status badge helper ────────────────────────────────────
const getStatusBadge = (status) => {
  const styles = {
    'Shortlisted': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Waitlisted': 'bg-amber-100 text-amber-700',
    'Pending': 'bg-gray-100 text-gray-600',
  };
  const cls = styles[status] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${cls}`}>{status || 'Pending'}</span>;
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_jobs: 0, active_jobs: 0, shortlisted_count: 0, pending_reviews: 0 });
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [appsPerJob, setAppsPerJob] = useState([]);
  const [recentRankings, setRecentRankings] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);

  // ── Fetch dashboard data on page load ─────────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const recruiterId = localStorage.getItem('recruiterId') || '';
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: { 'x-recruiter-id': recruiterId }
        });

        if (response.data.success) {
          const data = response.data;
          setStats(data.stats);
          setStatusBreakdown(data.status_breakdown);
          setMonthlyTrend(data.monthly_trend);
          setAppsPerJob(data.apps_per_job);
          setRecentRankings(data.recent_rankings);
          setActiveJobs(data.active_jobs);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ── Build chart data from API results ─────────────────
  // Helper to map status to specific pastel colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Shortlisted': return '#d1fae5'; // Pastel green
      case 'Rejected': return '#ffe4e6'; // Pastel red
      case 'Pending': return '#fef3c7'; // Pastel yellow
      case 'Waitlisted': return '#dbeafe'; // Pastel blue
      default: return '#f3f4f6'; // Light gray
    }
  };

  const candidateStatusData = {
    labels: statusBreakdown.map(item => item.status),
    datasets: [{
      data: statusBreakdown.map(item => item.count),
      backgroundColor: statusBreakdown.map(item => getStatusColor(item.status)),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const monthlyTrendData = {
    labels: monthlyTrend.map(item => item.month),
    datasets: [{
      label: 'Applications',
      data: monthlyTrend.map(item => item.count),
      borderColor: '#00c853',
      backgroundColor: 'rgba(0, 200, 83, 0.05)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#00c853',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const appsPerJobData = {
    labels: appsPerJob.map(item => item.job_title),
    datasets: [{
      label: 'Applicants',
      data: appsPerJob.map(item => item.count),
      backgroundColor: '#3b82f6', // Soft blue
      borderRadius: 4,
      barThickness: 24,
    }]
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Dashboard" />

        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-medium">Loading Dashboard...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 pb-8">

              {/* ── Stat Cards ───────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatisticCard title="Total Job Posts" value={stats.total_jobs} icon={FiBriefcase} colorClass="text-blue-600" bgClass="bg-blue-50" />
                <StatisticCard title="Active List" value={stats.active_jobs} icon={FiFileText} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
                <StatisticCard title="Shortlisted Candidates" value={stats.shortlisted_count} icon={FiCheckCircle} colorClass="text-[#00c853]" bgClass="bg-[#e8f5e9]" />
                <StatisticCard title="Pending Reviews" value={stats.pending_reviews} icon={FiClock} colorClass="text-amber-500" bgClass="bg-amber-50" />
              </div>

              {/* ── Charts Row 1 ─────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Candidate Status</h3>
                  <div className="h-64 relative">
                    {statusBreakdown.length > 0
                      ? <Doughnut data={candidateStatusData} options={chartOptions} />
                      : <p className="text-gray-400 text-sm text-center mt-20">No data yet</p>
                    }
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Applications Trend</h3>
                  <div className="h-64">
                    {monthlyTrend.length > 0
                      ? <Line data={monthlyTrendData} options={lineOptions} />
                      : <p className="text-gray-400 text-sm text-center mt-20">No data yet</p>
                    }
                  </div>
                </div>
              </div>

              {/* ── Charts Row 2 ─────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Applications per Job</h3>
                  <div className="h-64">
                    {appsPerJob.length > 0
                      ? <Bar data={appsPerJobData} options={barOptions} />
                      : <p className="text-gray-400 text-sm text-center mt-20">No data yet</p>
                    }
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/recruiter/jobs/new')} className="w-full flex items-center gap-3 px-4 py-3 bg-[#00c853] hover:bg-[#00b048] text-white rounded-xl transition-colors font-medium">     <FiPlus />        Create New Job </button>
                    <button onClick={() => navigate('/recruiter/resumes/upload')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium border border-gray-200"> <FiUploadCloud /> Upload Resumes </button>
                    <button onClick={() => navigate('/recruiter/jobs')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium border border-gray-200"> <FiList />        Manage List    </button>
                    <button onClick={() => navigate('/recruiter/rankings')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-medium border border-gray-200"> <FiUsers />       View Candidates</button>
                  </div>
                </div>
              </div>

              {/* ── Recent AI Rankings Table ──────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Recent AI Rankings <FiStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </h3>
                  <button onClick={() => navigate('/recruiter/rankings')} className="text-sm font-medium text-[#00c853] hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Job</th>
                        <th className="px-6 py-4 text-center">AI Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {recentRankings.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No rankings yet</td></tr>
                      ) : recentRankings.map((r) => (
                        <tr key={`${r.candidate_id}-${r.job_title}`} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-700">#{r.rank_position}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{r.candidate_name}</td>
                          <td className="px-6 py-4 text-gray-500">{r.job_title}</td>
                          <td className="px-6 py-4 text-center font-bold text-[#00c853]">{r.overall_score.toFixed(1)}%</td>
                          <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Bottom Row: Active List + Notifications ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Active Job Listings (2/3 width) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Active Job Listings</h3>
                    <button onClick={() => navigate('/recruiter/jobs')} className="text-sm font-medium text-[#00c853] hover:underline">Manage List</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-6 py-4">Job Title</th>
                          <th className="px-6 py-4 text-center">Applicants</th>
                          <th className="px-6 py-4">Closing Date</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {activeJobs.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No active jobs</td></tr>
                        ) : activeJobs.map((job) => (
                          <tr key={job.job_id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-900">{job.job_title}</td>
                            <td className="px-6 py-4 text-center font-bold text-gray-700">{job.applicant_count}</td>
                            <td className="px-6 py-4 text-gray-500">{job.application_deadline || 'N/A'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">{job.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Notifications (1/3 width) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                    <button className="text-gray-400 hover:text-gray-600"><FiBell /></button>
                  </div>
                  <div className="space-y-4">
                    {recentRankings.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No notifications yet</p>
                    ) : (
                      <>
                        {recentRankings.slice(0, 3).map((r, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.status === 'Shortlisted' ? 'bg-green-100 text-green-600' :
                                r.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                              {r.status === 'Shortlisted' ? <FiCheckCircle className="w-4 h-4" /> : <FiFileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {r.status === 'Shortlisted' ? 'Candidate shortlisted' :
                                  r.status === 'Pending' ? 'New ranking available' : `Status: ${r.status}`}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{r.candidate_name} – {r.job_title}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
