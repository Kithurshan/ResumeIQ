import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCpu,
  FiBriefcase,
  FiUser,
  FiClock,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiPercent,
  FiAlertCircle,
  FiTrendingUp,
  FiPieChart,
  FiDatabase
} from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const InfoRow = ({ icon: Icon, label, value, valueClass = 'text-[#E1E1E1]' }) => (
  <div className="py-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
    <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
  </div>
);

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-400 font-medium mb-1">{title}</p>
      <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
    </div>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const AIDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admins/reports/ai/${id}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          console.error(result.error);
        }
      } catch (err) {
        console.error("Failed to fetch report details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64 overflow-hidden">
          <AdminHeader title="Analytics & Reports" />
          <div className="flex items-center justify-center flex-1">
            <p className="text-gray-400">Loading AI details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64 overflow-hidden">
          <AdminHeader title="Analytics & Reports" />
          <div className="flex flex-col items-center justify-center flex-1">
            <p className="text-gray-400 mb-4">Report not found.</p>
            <button onClick={() => navigate('/admin/reports')} className="text-[#BB86FC] hover:underline">Back to Reports</button>
          </div>
        </div>
      </div>
    );
  }

  const successRate = data.uploaded > 0 ? ((data.processed / data.uploaded) * 100).toFixed(0) : 0;
  
  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Analytics & Reports" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-12 space-y-6 animate-fade-in">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/reports')} className="w-10 h-10 bg-[#1F1F1F] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <FiCpu className="text-[#BB86FC]" />
                    AI Processing Report
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">{data.job}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#BB86FC] text-black rounded-xl hover:bg-[#A370F0] transition-colors font-bold text-sm shadow-[0_0_15px_rgba(187,134,252,0.3)]"
                >
                  <FiDownload className="w-4 h-4" /> Export Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiBriefcase className="text-[#BB86FC]" /> Job Information</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiBriefcase} label="Job Title" value={data.job} />
                  <InfoRow icon={FiUser} label="Recruiter" value={data.recruiter} />
                  <InfoRow icon={FiClock} label="Avg Processing Time" value={data.avgTime} />
                </div>
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden md:col-span-2">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiDatabase className="text-[#BB86FC]" /> Processing Metrics</h3>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  <StatCard title="Total Uploaded" value={data.uploaded} icon={FiDatabase} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
                  <StatCard title="Successfully Processed" value={data.processed} icon={FiCheckCircle} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                  <StatCard title="Failed to Parse" value={data.failed} icon={FiAlertCircle} colorClass="text-red-500" bgClass="bg-red-500/10" />
                </div>
                
                <div className="px-5 pb-5">
                   <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium text-gray-400">Processing Success Rate</span>
                       <span className="text-sm font-bold text-[#E1E1E1]">{successRate}%</span>
                     </div>
                     <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }}></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiTrendingUp className="text-blue-500" /> AI Score Metrics</h3>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Highest Score" value={data.highestScore} icon={FiTrendingUp} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                <StatCard title="Lowest Score" value={data.lowestScore} icon={FiTrendingUp} colorClass="text-red-500" bgClass="bg-red-500/10" />
                <StatCard title="Avg Match Score" value={data.avgScore} icon={FiCpu} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
                <StatCard title="Avg Semantic Sim" value={data.avgSemantic} icon={FiPercent} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AIDetails;
