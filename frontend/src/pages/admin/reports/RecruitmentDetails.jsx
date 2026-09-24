import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBriefcase,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiCpu,
  FiDownload,
  FiPrinter,
  FiTrendingUp,
  FiPieChart
} from 'react-icons/fi';

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

const DecisionPieChart = ({ shortlisted, waitlisted, rejected }) => {
  const total = shortlisted + waitlisted + rejected;
  const s = total > 0 ? ((shortlisted / total) * 100).toFixed(0) : 0;
  const w = total > 0 ? ((waitlisted / total) * 100).toFixed(0) : 0;
  const sEnd = parseFloat(s);
  const wEnd = sEnd + parseFloat(w);

  return (
    <div className="flex items-center gap-8">
      <div className="w-40 h-40 rounded-full relative overflow-hidden flex-shrink-0"
        style={{ background: total > 0 ? `conic-gradient(#10B981 0% ${sEnd}%, #F59E0B ${sEnd}% ${wEnd}%, #EF4444 ${wEnd}% 100%)` : '#333' }}>
        <div className="absolute inset-0 m-auto w-24 h-24 bg-[#1F1F1F] rounded-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold text-white">{total}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-300"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Shortlisted</span>
          <span className="font-bold text-emerald-500">{shortlisted} ({s}%)</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-300"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Waitlisted</span>
          <span className="font-bold text-amber-500">{waitlisted} ({w}%)</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-300"><span className="w-3 h-3 rounded-full bg-red-500"></span> Rejected</span>
          <span className="font-bold text-red-500">{rejected} ({(total > 0 ? 100 - sEnd - parseFloat(w) : 0).toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
};

const ProcessingTimeline = ({ uploaded, processed, failed }) => (
  <div className="space-y-4">
    {[
      { label: 'Uploaded Resumes', value: uploaded, pct: '100%', color: 'bg-blue-500' },
      { label: 'AI Processed', value: processed, pct: uploaded > 0 ? `${((processed / uploaded) * 100).toFixed(0)}%` : '0%', color: 'bg-[#BB86FC]' },
      { label: 'Failed Analysis', value: failed, pct: uploaded > 0 ? `${((failed / uploaded) * 100).toFixed(0)}%` : '0%', color: 'bg-red-500' },
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

const RecruitmentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/admins/reports/recruitment/${id}`);
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
            <p className="text-gray-400">Loading report details...</p>
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
                    <FiBriefcase className="text-[#BB86FC]" />
                    Recruitment Report
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">{data.job} - {data.company}</p>
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
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiBriefcase className="text-[#BB86FC]" /> Job Information</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiBriefcase} label="Job Title" value={data.job} />
                  <InfoRow icon={FiFileText} label="Company" value={data.company} />
                  <InfoRow icon={FiUser} label="Recruiter" value={data.recruiter} />
                </div>
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden md:col-span-2">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiTrendingUp className="text-[#BB86FC]" /> Recruitment Statistics</h3>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  <StatPill label="Total Uploaded" value={data.uploaded} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
                  <StatPill label="AI Processed" value={data.aiProcessed} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
                  <StatPill label="Failed Analysis" value={data.failed} colorClass="text-red-500" bgClass="bg-red-500/10" />
                  <StatPill label="Shortlisted" value={data.shortlisted} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                  <StatPill label="Waitlisted" value={data.waitlisted} colorClass="text-amber-500" bgClass="bg-amber-500/10" />
                  <StatPill label="Rejected" value={data.rejected} colorClass="text-red-400" bgClass="bg-red-400/10" />
                </div>
              </div>
            </div>

            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiCpu className="text-blue-500" /> AI Summary</h3>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatPill label="Highest AI Score" value={data.highestAI} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                <StatPill label="Lowest AI Score" value={data.lowestAI} colorClass="text-red-500" bgClass="bg-red-500/10" />
                <StatPill label="Average AI Score" value={data.avgAI} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
                <StatPill label="Avg Semantic Similarity" value={data.avgSemantic} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiPieChart className="text-[#BB86FC]" /> Candidate Decision Distribution</h3>
                  <p className="text-xs text-gray-400 mt-1">Breakdown of recruiter decisions for this job</p>
                </div>
                <DecisionPieChart shortlisted={data.shortlisted} waitlisted={data.waitlisted} rejected={data.rejected} />
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-[#E1E1E1] flex items-center gap-2"><FiTrendingUp className="text-[#BB86FC]" /> Resume Processing Timeline</h3>
                  <p className="text-xs text-gray-400 mt-1">End-to-end processing pipeline overview</p>
                </div>
                <ProcessingTimeline uploaded={data.uploaded} processed={data.aiProcessed} failed={data.failed} />
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

export default RecruitmentDetails;
