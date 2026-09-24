import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiMail,
  FiTrendingUp,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiCpu,
  FiFileText
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

// ─── Info Row ──────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, valueClass = 'text-[#E1E1E1]' }) => (
  <div className="py-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
    <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
  </div>
);

// ─── Stat Pill ─────────────────────────────────────────────────────────────
const StatPill = ({ label, value, colorClass = 'text-[#E1E1E1]', bgClass = 'bg-gray-800' }) => (
  <div className={`${bgClass} rounded-xl p-4 text-center`}>
    <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
    <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const DecisionFunnel = ({ uploaded, shortlisted, waitlisted, rejected }) => {
  const max = Math.max(uploaded, 1);
  return (
    <div className="space-y-4">
      {[
        { label: 'Total Candidates', value: uploaded, pct: '100%', color: 'bg-blue-500' },
        { label: 'Shortlisted', value: shortlisted, pct: `${((shortlisted / max) * 100).toFixed(0)}%`, color: 'bg-emerald-500' },
        { label: 'Waitlisted', value: waitlisted, pct: `${((waitlisted / max) * 100).toFixed(0)}%`, color: 'bg-amber-500' },
        { label: 'Rejected', value: rejected, pct: `${((rejected / max) * 100).toFixed(0)}%`, color: 'bg-red-500' },
      ].map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300 font-medium">{item.label}</span>
            <span className="text-gray-400">{item.value} ({item.pct})</span>
          </div>
          <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden">
            <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: item.pct }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecruiterDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/admins/reports/recruiters/${id}`);
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
            <p className="text-gray-400">Loading recruiter details...</p>
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
                    <FiUser className="text-[#BB86FC]" />
                    Recruiter Report
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">{data.recruiter} — {data.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] border border-gray-800 text-[#E1E1E1] rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm">
                  <FiPrinter className="w-4 h-4" /> Print
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#BB86FC]/10 text-[#BB86FC] rounded-xl hover:bg-[#BB86FC]/20 transition-colors font-bold text-sm">
                  <FiDownload className="w-4 h-4" /> Export Excel
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#BB86FC] text-black rounded-xl hover:bg-[#A370F0] transition-colors font-bold text-sm shadow-[0_0_15px_rgba(187,134,252,0.3)]">
                  <FiDownload className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiUser className="text-[#BB86FC]" /> Profile</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiUser} label="Name" value={data.recruiter} />
                  <InfoRow icon={FiMail} label="Email" value={data.email} />
                  <InfoRow icon={FiBriefcase} label="Company" value={data.company} />
                </div>
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden md:col-span-2">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiTrendingUp className="text-[#BB86FC]" /> Activity Statistics</h3>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  <StatPill label="List Managed" value={data.jobs} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
                  <StatPill label="Total Uploaded" value={data.uploaded} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                  <StatPill label="AI Processed" value={data.aiProcessed} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
                  <StatPill label="Shortlisted" value={data.shortlisted} colorClass="text-emerald-400" bgClass="bg-emerald-400/10" />
                  <StatPill label="Waitlisted" value={data.waitlisted} colorClass="text-amber-500" bgClass="bg-amber-500/10" />
                  <StatPill label="Rejected" value={data.rejected} colorClass="text-red-400" bgClass="bg-red-400/10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiCheckCircle className="text-[#BB86FC]" /> Decision Funnel</h3>
                  <p className="text-xs text-gray-400 mt-1">Recruiter's candidate conversion rates</p>
                </div>
                <DecisionFunnel uploaded={data.uploaded} shortlisted={data.shortlisted} waitlisted={data.waitlisted} rejected={data.rejected} />
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiCpu className="text-blue-500" /> AI Agreement Metrics</h3>
                  <p className="text-xs text-gray-400 mt-1">Average scores of candidates processed by this recruiter</p>
                </div>
                <div className="space-y-6 mt-4">
                  <div className="bg-[#111111] p-5 rounded-xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Avg AI Match Score</p>
                      <p className="text-2xl font-bold text-[#BB86FC] mt-1">{data.avgScore}</p>
                    </div>
                    <FiTrendingUp className="w-8 h-8 text-[#BB86FC] opacity-20" />
                  </div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Avg Semantic Similarity</p>
                      <p className="text-2xl font-bold text-blue-500 mt-1">{data.avgSemantic}</p>
                    </div>
                    <FiFileText className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start pt-4">
              <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 px-6 py-3 bg-[#1F1F1F] border border-gray-800 text-[#E1E1E1] rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm">
                <FiArrowLeft className="w-4 h-4" /> Back to Analytics & Reports
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default RecruiterDetails;
