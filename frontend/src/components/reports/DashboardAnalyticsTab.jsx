import React, { useRef, useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiUsers,
  FiCpu,
  FiPercent,
  FiTrendingUp,
  FiActivity,
  FiPieChart,
  FiBarChart
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
  cutout: '75%',
  borderWidth: 0,
};

const horizontalBarLabelsPlugin = {
  id: 'horizontalBarLabels',
  afterDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar, index) => {
      const label = chart.data.labels[index];
      const value = chart.data.datasets[0].data[index] + ' resumes';

      ctx.fillStyle = '#E1E1E1';
      ctx.font = '500 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, chart.chartArea.left, bar.y - 12);

      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'right';
      ctx.fillText(value, chart.chartArea.right, bar.y - 12);
    });
    ctx.restore();
  }
};

const horizontalBarBackgroundPlugin = {
  id: 'horizontalBarBackground',
  beforeDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar) => {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      const height = bar.height;
      const y = bar.y - height / 2;
      ctx.roundRect(chart.chartArea.left, y, chart.chartArea.right - chart.chartArea.left, height, height / 2);
      ctx.fill();
    });
    ctx.restore();
  }
};

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 30,
    }
  },
  indexAxis: 'y',
  scales: {
    x: { display: false },
    y: { display: false }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111111',
      titleColor: '#E1E1E1',
      bodyColor: '#A0A0A0',
      borderColor: '#333333',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => ` ${context.raw} resumes`
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  }
};

const DashboardAnalyticsTab = () => {
  const barChartRef = useRef(null);
  const horizontalBarRef = useRef(null);
  const [barGradient, setBarGradient] = useState(null);
  const [horizontalGradient, setHorizontalGradient] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (barChartRef.current) {
      const chart = barChartRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, chart.chartArea.bottom, 0, chart.chartArea.top);
      gradient.addColorStop(0, 'rgba(187, 134, 252, 0.2)');
      gradient.addColorStop(1, 'rgba(187, 134, 252, 1)');
      setBarGradient(gradient);
    }

    if (horizontalBarRef.current) {
      const chart = horizontalBarRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
      gradient.addColorStop(0, '#2563EB');
      gradient.addColorStop(1, '#60A5FA');
      setHorizontalGradient(gradient);
    }
  }, [loading]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admins/reports/dashboard-analytics');
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !dashboardData) {
    return <div className="text-gray-400 py-10">Loading analytics...</div>;
  }

  // 1. Recruitment Trend (List vs Candidates vs Shortlists)
  const recruitmentTrendData = {
    labels: dashboardData.recruitmentTrend.labels,
    datasets: [
      {
        label: 'List',
        data: dashboardData.recruitmentTrend.jobs,
        backgroundColor: '#BB86FC',
        borderRadius: 4,
      },
      {
        label: 'Candidates',
        data: dashboardData.recruitmentTrend.candidates,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
      {
        label: 'Shortlists',
        data: dashboardData.recruitmentTrend.shortlists,
        backgroundColor: '#10B981',
        borderRadius: 4,
      }
    ],
  };

  // 2. Resume Upload Trend
  const uploadTrendData = {
    labels: dashboardData.uploadTrend.labels,
    datasets: [
      {
        label: 'Resumes Uploaded',
        data: dashboardData.uploadTrend.data,
        backgroundColor: barGradient || '#BB86FC',
        borderRadius: 6,
      }
    ],
  };

  // 3. AI Recommendation Distribution (Pie Chart)
  const aiDistributionData = {
    labels: ['Highly Recommended', 'Recommended', 'Consider', 'Not Recommended'],
    datasets: [
      {
        data: dashboardData.aiDistribution,
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        hoverOffset: 4,
      }
    ],
  };

  // 4. Recruiter Performance (Horizontal Bar)
  const recruiterPerformanceData = {
    labels: dashboardData.recruiterPerformance.labels,
    datasets: [
      {
        label: 'Resumes Processed',
        data: dashboardData.recruiterPerformance.data,
        backgroundColor: horizontalGradient || '#3B82F6',
        borderRadius: 4,
        barThickness: 24,
      }
    ],
  };

  const renderPerfectLegend = () => (
    <div className="flex flex-col justify-center h-full space-y-4 w-full">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          Highly Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{dashboardData.aiDistribution[0] || 0}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
          Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{dashboardData.aiDistribution[1] || 0}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
          Consider
        </span>
        <span className="font-bold text-[#E1E1E1]">{dashboardData.aiDistribution[2] || 0}%</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-3 text-gray-300 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          Not Recommended
        </span>
        <span className="font-bold text-[#E1E1E1]">{dashboardData.aiDistribution[3] || 0}%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total List" value={dashboardData.stats.totalJobs.toLocaleString()} icon={FiBriefcase} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
        <StatCard title="Total Candidates" value={dashboardData.stats.totalCandidates.toLocaleString()} icon={FiUsers} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
        <StatCard title="Total AI Screenings" value={dashboardData.stats.totalAIScreenings.toLocaleString()} icon={FiCpu} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
        <StatCard title="Average AI Match Score" value={`${dashboardData.stats.averageAIMatchScore}%`} icon={FiPercent} colorClass="text-[#F59E0B]" bgClass="bg-[#F59E0B]/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiTrendingUp className="text-[#BB86FC]" /> Recruitment Trend</h3>
              <p className="text-xs text-gray-400 mt-1">Monthly progression of jobs and candidates</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-[#BB86FC]"></span> List</span>
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Candidates</span>
              <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Shortlists</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <Bar options={{ ...commonOptions, categoryPercentage: 0.7, barPercentage: 0.9 }} data={recruitmentTrendData} />
          </div>
        </div>

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiActivity className="text-[#BB86FC]" /> Resume Upload Trend</h3>
              <p className="text-xs text-gray-400 mt-1">Weekly volume of uploaded resumes</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <Bar ref={barChartRef} options={commonOptions} data={uploadTrendData} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiPieChart className="text-[#BB86FC]" /> AI Recommendation Distribution</h3>
              <p className="text-xs text-gray-400 mt-1">Breakdown of AI decisions</p>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-6 flex-1">
            <div className="flex-shrink-0 relative flex justify-center py-2">
              <div className="w-[160px] h-[160px] relative">
                <Doughnut options={pieOptions} data={aiDistributionData} />
                <div className="absolute inset-0 m-auto w-[110px] h-[110px] rounded-full bg-[#1F1F1F] flex items-center justify-center pointer-events-none shadow-inner border border-gray-800/50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">Total</p>
                    <p className="text-xl font-bold text-white">100%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full xl:pl-4 xl:border-l border-gray-800/50 mt-4 xl:mt-0">
              {renderPerfectLegend()}
            </div>
          </div>
        </div>

        <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiBarChart className="text-[#BB86FC]" /> Recruiter Performance</h3>
              <p className="text-xs text-gray-400 mt-1">Number of resumes processed by top recruiters</p>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] relative">
            {recruiterPerformanceData.labels.length > 0 ? (
              <Bar
                ref={horizontalBarRef}
                options={horizontalBarOptions}
                data={recruiterPerformanceData}
                plugins={[horizontalBarBackgroundPlugin, horizontalBarLabelsPlugin]}
              />
            ) : (
              <p className="text-gray-500 text-sm mt-10 text-center">No recruiter data available yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardAnalyticsTab;
