import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiEye,
  FiCpu,
  FiClock,
  FiPercent,
  FiAlertCircle,
  FiActivity,
  FiPieChart,
  FiBarChart2
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

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

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111111',
      titleColor: '#E1E1E1',
      bodyColor: '#A0A0A0',
      borderColor: '#333333',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
    }
  },
  scales: {
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: '#6B7280',
        font: { size: 11 },
        maxTicksLimit: 5,
      },
      border: { display: false }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#6B7280',
        font: { size: 12 },
      },
      border: { display: false }
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111111',
      titleColor: '#E1E1E1',
      bodyColor: '#A0A0A0',
      borderColor: '#333333',
      borderWidth: 1,
      padding: 10,
    }
  },
  cutout: '80%',
  borderWidth: 0,
};

const AIReportsTab = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const barChartRef = useRef(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admins/reports/ai');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch AI reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="text-gray-400 py-10">Loading reports...</div>;
  }

  const reports = data?.jobs || [];
  const topLevel = data?.topLevel || { avgProcessingTime: '0s', avgScore: '0%', avgSemantic: '0%', failedAnalyses: 0 };
  const recs = data?.recommendations || {};

  let filteredReports = reports.filter(rep => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!rep.job.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalRecs = Object.values(recs).reduce((a, b) => a + b, 0) || 1;
  const getPct = (val) => ((val / totalRecs) * 100).toFixed(0);

  const recommendationData = {
    labels: ['Highly Recommended', 'Recommended', 'Consider', 'Not Recommended'],
    datasets: [{
      data: [
        recs['Highly Recommended'] || 0,
        recs['Recommended'] || 0,
        recs['Consider'] || 0,
        recs['Not Recommended'] || 0
      ],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }]
  };
  
  // Real data from backend for charts
  const trend = data?.processingTrend || { labels: [], processed: [], failed: [] };
  const processingTrendData = { 
    labels: trend.labels, 
    datasets: [
        { label: 'Processed', data: trend.processed, backgroundColor: '#BB86FC' },
        { label: 'Failed', data: trend.failed, backgroundColor: '#EF4444' }
    ] 
  };
  
  const semDist = data?.semanticDistribution || { labels: ['<40%', '40-60%', '60-80%', '80-100%'], data: [0, 0, 0, 0] };
  const semanticSimilarityData = { 
    labels: semDist.labels, 
    datasets: [
        { label: 'Candidates', data: semDist.data, backgroundColor: '#10B981' }
    ] 
  };

  const renderPerfectLegend = () => (
    <div className="flex flex-col justify-center h-full space-y-4 w-full">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          Highly Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{getPct(recs['Highly Recommended'] || 0)}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
          Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{getPct(recs['Recommended'] || 0)}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
          Consider
        </span>
        <span className="font-bold text-[#E1E1E1]">{getPct(recs['Consider'] || 0)}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          Not Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{getPct(recs['Not Recommended'] || 0)}%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Avg Processing Time" value={topLevel.avgProcessingTime} icon={FiClock} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
        <StatCard title="Avg AI Score" value={topLevel.avgScore} icon={FiCpu} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
        <StatCard title="Avg Semantic Similarity" value={topLevel.avgSemantic} icon={FiPercent} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
        <StatCard title="Failed Analyses" value={topLevel.failedAnalyses} icon={FiAlertCircle} colorClass="text-red-500" bgClass="bg-red-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiActivity className="text-[#BB86FC]" /> AI Processing Trend</h3>
              <p className="text-xs text-gray-400 mt-1">Monthly completed vs failed analyses</p>
            </div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-[#BB86FC]"></span> Processed</span>
              <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500"></span> Failed</span>
            </div>
          </div>
          <div className="flex-1 h-[220px] relative">
            <Bar options={{ ...commonOptions, categoryPercentage: 0.5, barPercentage: 1.0 }} data={processingTrendData} />
          </div>
        </div>

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiPieChart className="text-[#BB86FC]" /> Recommendations</h3>
              <p className="text-xs text-gray-400 mt-1">Breakdown of AI decisions</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 flex-1">
            <div className="flex-shrink-0 relative flex justify-center py-2">
              <div className="w-[180px] h-[180px] relative">
                <Doughnut options={{ ...pieOptions, cutout: '75%' }} data={recommendationData} />
                <div className="absolute inset-0 m-auto w-[120px] h-[120px] rounded-full bg-[#1F1F1F] flex items-center justify-center pointer-events-none shadow-inner border border-gray-800/50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">Total</p>
                    <p className="text-xl font-bold text-white">100%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full pt-4 border-t border-gray-800/50">
              {renderPerfectLegend()}
            </div>
          </div>
        </div>

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiBarChart2 className="text-[#BB86FC]" /> Semantic Similarity Distribution</h3>
              <p className="text-xs text-gray-400 mt-1">Score ranges across all parsed resumes</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <Bar ref={barChartRef} options={commonOptions} data={semanticSimilarityData} />
          </div>
        </div>
      </div>

      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search AI reports by job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] transition-all"
          />
        </div>

        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#BB86FC]">
          <option value="All Time">All Time</option>
          <option value="Today">Today</option>
          <option value="This Month">This Month</option>
        </select>
      </div>

      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4 text-center">Processed</th>
                <th className="px-6 py-4 text-center">Failed</th>
                <th className="px-6 py-4 text-center">Avg AI Score</th>
                <th className="px-6 py-4 text-center">Avg Similarity</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#252525] transition-colors text-gray-300">
                  <td className="px-6 py-4 font-bold text-[#E1E1E1]">{rep.job}</td>
                  <td className="px-6 py-4 text-center font-medium text-[#BB86FC]">{rep.processed}</td>
                  <td className="px-6 py-4 text-center font-medium text-red-500">{rep.failed}</td>
                  <td className="px-6 py-4 text-center font-bold">{rep.avgScore}</td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-500">{rep.avgSimilarity}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`/admin/reports/ai/${rep.id}`)}
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
              <FiCpu className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No AI reports found matching your criteria.</p>
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

export default AIReportsTab;
