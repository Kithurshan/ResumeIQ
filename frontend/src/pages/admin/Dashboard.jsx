import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiCpu,
  FiStar,
  FiZap,
  FiArrowRight,
  FiActivity,
  FiDatabase,
  FiPieChart,
  FiList,
  FiSettings
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

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
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import api from '../../api/axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const darkChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: '#E1E1E1',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#E1E1E1',
        usePointStyle: true,
        padding: 20,
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#9CA3AF' },
      grid: { color: '#374151', display: false }
    },
    y: {
      ticks: { color: '#9CA3AF' },
      grid: { color: '#374151', borderDash: [4, 4] }
    }
  }
};

const darkBarOptions = {
  ...darkChartOptions,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
    y: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
  }
};

const darkPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: '#E1E1E1',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#E1E1E1', usePointStyle: true, padding: 20 }
    }
  }
};



const AdminStatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors cursor-pointer group">
    <div>
      <h3 className="text-gray-400 text-sm font-medium mb-1 group-hover:text-gray-300 transition-colors">{title}</h3>
      <p className="text-3xl font-bold text-[#E1E1E1]">{value}</p>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    total_recruiters: 0,
    active_jobs: 0,
    uploaded_resumes: 0,
    ai_processed: 0,
    shortlisted_candidates: 0,
    processing_queue: 0
  });
  const [aiStatusChart, setAiStatusChart] = useState({ labels: [], datasets: [] });
  const [decisionsChart, setDecisionsChart] = useState({ labels: [], datasets: [] });
  const [trendChart, setTrendChart] = useState({ labels: [], datasets: [] });
  const [activityChart, setActivityChart] = useState({ labels: [], datasets: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentRecruiters, setRecentRecruiters] = useState([]);
  const [recentAI, setRecentAI] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/admin/dashboard/');
        if (res.data.success) {
          setStats(res.data.data.stats);
          
          // Format AI Status for Doughnut Chart
          const aiData = res.data.data.ai_status;
          setAiStatusChart({
            labels: aiData.map(d => d.status || 'Pending'),
            datasets: [{
              data: aiData.map(d => d.count),
              backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#BB86FC'],
              borderWidth: 0,
            }]
          });

          // Format Decisions for Pie Chart
          const decData = res.data.data.decisions;
          setDecisionsChart({
            labels: decData.map(d => d.status || 'Pending'),
            datasets: [{
              data: decData.map(d => d.count),
              backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#BB86FC'],
              borderWidth: 0,
            }]
          });

          // Format Processing Trend for Line Chart
          const trendData = res.data.data.processing_trend || [];
          setTrendChart({
            labels: trendData.map(d => d.month),
            datasets: [{
              label: 'Resumes Processed',
              data: trendData.map(d => d.count),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }]
          });

          // Format Recruiter Activity for Bar Chart
          const actData = res.data.data.recruiter_activity || [];
          setActivityChart({
            labels: actData.map(d => d.name),
            datasets: [{
              label: 'Actions Performed',
              data: actData.map(d => d.count),
              backgroundColor: '#10B981',
              borderRadius: 4
            }]
          });

          setRecentActivity(res.data.data.recent_activity || []);
          setRecentRecruiters(res.data.data.recent_recruiters || []);
          setRecentAI(res.data.data.recent_ai_processing || []);
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);
  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Dashboard" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-8">

            
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, Administrator!</h2>
              <p className="text-gray-400">Monitor ResumeIQ platform performance and recruitment activities.</p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AdminStatCard
                title="Total Recruiters"
                value={stats.total_recruiters}
                icon={FiUsers}
                colorClass="text-blue-500"
                bgClass="bg-blue-500/10"
              />
              <AdminStatCard
                title="Active List"
                value={stats.active_jobs}
                icon={FiBriefcase}
                colorClass="text-green-500"
                bgClass="bg-green-500/10"
              />
              <AdminStatCard
                title="Uploaded Resumes"
                value={stats.uploaded_resumes}
                icon={FiFileText}
                colorClass="text-orange-500"
                bgClass="bg-orange-500/10"
              />
              <AdminStatCard
                title="AI Processed"
                value={stats.ai_processed}
                icon={FiCpu}
                colorClass="text-[#BB86FC]"
                bgClass="bg-[#BB86FC]/10"
              />
              <AdminStatCard
                title="Shortlisted Candidates"
                value={stats.shortlisted_candidates}
                icon={FiStar}
                colorClass="text-emerald-500"
                bgClass="bg-emerald-500/10"
              />
              <AdminStatCard
                title="Processing Queue"
                value={stats.processing_queue}
                icon={FiZap}
                colorClass="text-amber-500"
                bgClass="bg-amber-500/10"
              />
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800 lg:col-span-2">
                <h3 className="text-lg font-bold mb-6">Resume Processing Trend</h3>
                <div className="h-64 relative">
                  {trendChart.labels.length > 0 ? (
                    <Line data={trendChart} options={darkChartOptions} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800 lg:col-span-1">
                <h3 className="text-lg font-bold mb-6">Recruiter Activity</h3>
                <div className="h-64 relative">
                  {activityChart.labels.length > 0 ? (
                    <Bar data={activityChart} options={darkBarOptions} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
                  )}
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold mb-6">AI Processing Status</h3>
                <div className="h-64 relative">
                  {aiStatusChart.labels.length > 0 ? (
                    <Doughnut data={aiStatusChart} options={darkPieOptions} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold mb-6">Candidate Decisions</h3>
                <div className="h-64 relative">
                  {decisionsChart.labels.length > 0 ? (
                    <Pie data={decisionsChart} options={darkPieOptions} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
                  )}
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Recently Added Recruiters</h3>
                  <button className="text-sm font-medium text-[#BB86FC] hover:text-[#cfa4ff]">View All</button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Recruiter</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Joined Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      {recentRecruiters.length > 0 ? recentRecruiters.map((rec, i) => (
                        <tr key={i} className="hover:bg-[#252525]">
                          <td className="px-6 py-4">{rec.recruiter}</td>
                          <td className="px-6 py-4">{rec.company}</td>
                          <td className="px-6 py-4">{new Date(rec.joined_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No recruiters found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Recent Recruitment Activities</h3>
                  <button className="text-sm font-medium text-[#BB86FC] hover:text-[#cfa4ff]">View All</button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Activity</th>
                        <th className="px-6 py-4">Recruiter</th>
                        <th className="px-6 py-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                        <tr key={i} className="hover:bg-[#252525]">
                          <td className="px-6 py-4 font-medium">{act.action}</td>
                          <td className="px-6 py-4 text-gray-400">{act.user_name}</td>
                          <td className="px-6 py-4 text-gray-400">{new Date(act.created_at).toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No recent activity</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            
            <div>

              
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Latest AI Processing</h3>
                  <button className="text-sm font-medium text-[#BB86FC] hover:text-[#cfa4ff]">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Resume</th>
                        <th className="px-6 py-4">Recruiter</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">AI Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      {recentAI.length > 0 ? recentAI.map((item, i) => (
                        <tr key={i} className="hover:bg-[#252525]">
                          <td className="px-6 py-4 truncate max-w-[200px]">{item.resume}</td>
                          <td className="px-6 py-4 text-gray-400">{item.recruiter}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'Completed' ? 'bg-[#BB86FC]/10 text-[#BB86FC]' : 
                              item.status === 'Processing' ? 'bg-amber-500/10 text-amber-500' : 
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-[#E1E1E1]">
                            {item.status === 'Completed' ? item.ai_score : '-'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No AI processing data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            
            <div>
              <h3 className="text-lg font-bold mb-6 mt-4">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Recruiter Mgmt', icon: FiUsers, path: '/admin/recruiters' },
                  { name: 'Monitoring', icon: FiActivity, path: '/admin/monitoring' },
                  { name: 'AI Health', icon: FiCpu, path: '/admin/ai/processing' },
                  { name: 'Reports', icon: FiPieChart, path: '/admin/reports' },
                  { name: 'Activity Logs', icon: FiList, path: '/admin/activity' },
                  { name: 'Settings', icon: FiSettings, path: '/admin/settings' },
                ].map((item, idx) => (
                  <button key={idx} onClick={() => navigate(item.path)} className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 hover:border-[#BB86FC] hover:bg-[#252525] transition-all flex flex-col items-center justify-center gap-3 group">
                    <item.icon className="w-6 h-6 text-gray-400 group-hover:text-[#BB86FC] transition-colors" />
                    <span className="text-xs font-medium text-gray-300 text-center group-hover:text-white">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
