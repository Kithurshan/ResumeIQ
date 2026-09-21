import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiList,
  FiUser,
  FiMail,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiInfo,
  FiBriefcase,
  FiFileText,
  FiCpu,
  FiAward
} from 'react-icons/fi';
import axios from 'axios';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="py-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
    <span className="text-sm font-medium text-[#E1E1E1]">{value}</span>
  </div>
);

const Details = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/admins/activity-logs/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching log details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchLogDetails();
    }
  }, [id]);

  const getStatusBadge = (status) => {
    if (status === 'Success') return <span className="text-[#22C55E] bg-[#22C55E]/10 px-3 py-1.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"><FiCheckCircle className="w-4 h-4" /> Success</span>;
    if (status === 'Failed') return <span className="text-[#EF4444] bg-[#EF4444]/10 px-3 py-1.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"><FiXCircle className="w-4 h-4" /> Failed</span>;
    if (status === 'Warning') return <span className="text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"><FiAlertTriangle className="w-4 h-4" /> Warning</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BB86FC]"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading log details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64 items-center justify-center">
          <FiAlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Log Not Found</h2>
          <p className="text-gray-400 mb-6">The activity log you requested could not be found.</p>
          <button onClick={() => navigate('/admin/activity')} className="px-6 py-2 bg-[#BB86FC] text-black font-bold rounded-lg">Back to Logs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Activity Logs" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-12 space-y-6">


            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/activity')}
                  className="w-10 h-10 bg-[#1F1F1F] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <FiList className="text-[#BB86FC]" />
                    Activity Details
                  </h1>
                </div>
              </div>
              {getStatusBadge(data.status)}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiUser className="text-[#BB86FC]" /> User Information</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiUser} label="User" value={data.recruiter} />
                  <InfoRow icon={FiAward} label="Role" value={data.role} />
                  <InfoRow icon={FiMail} label="Email" value={data.email} />
                </div>
              </div>

              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiActivity className="text-[#BB86FC]" /> Action Information</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiFileText} label="Activity ID" value={data.id} />
                  <InfoRow icon={FiCalendar} label="Date & Time" value={data.date} />
                  <InfoRow icon={FiList} label="Module" value={data.module} />
                </div>
              </div>
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiInfo className="text-blue-500" /> Detailed Description</h3>
              </div>
              <div className="p-6">
                <p className="text-sm font-bold text-[#E1E1E1] mb-2">{data.activity}</p>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{data.description}</p>
              </div>
            </div>


            <div className="bg-gradient-to-br from-[#111111] to-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#BB86FC]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

              <div className="p-4 border-b border-gray-800 bg-[#111111]/80 relative z-10">
                <h3 className="font-bold flex items-center gap-2 text-[#E1E1E1]"><FiBriefcase className="text-emerald-500" /> Related Information</h3>
              </div>

              <div className="p-6 relative z-10">
                {data.related.type === 'upload' && (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <InfoRow icon={FiBriefcase} label="Target Job" value={data.related.job} />
                    <InfoRow icon={FiFileText} label="Total Files Attempted" value={data.related.totalFiles} />
                    <InfoRow icon={FiCheckCircle} label="Successfully Uploaded" value={<span className="text-emerald-500">{data.related.successfulFiles}</span>} />
                    <InfoRow icon={FiAlertTriangle} label="Failed / Rejected" value={<span className="text-amber-500">{data.related.failedFiles}</span>} />
                  </div>
                )}

                {data.related.type === 'decision' && (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <InfoRow icon={FiUser} label="Candidate" value={data.related.candidate} />
                    <InfoRow icon={FiBriefcase} label="Target Job" value={data.related.job} />
                    <InfoRow icon={FiCpu} label="AI Recommendation Score" value={<span className="text-[#BB86FC] font-bold">{data.related.aiScore}</span>} />
                    <InfoRow icon={FiCheckCircle} label="Final Decision" value={<span className="text-emerald-500">{data.related.decision}</span>} />
                  </div>
                )}

                {data.related.type === 'job' && (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <InfoRow icon={FiBriefcase} label="Job Title" value={data.related.jobTitle} />
                    <InfoRow icon={FiAward} label="Company" value={data.related.company} />
                    <div className="col-span-2">
                      <InfoRow icon={FiList} label="Extracted Required Skills" value={data.related.requiredSkills} />
                    </div>
                  </div>
                )}

                {data.related.type === 'auth' && (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">

                    <InfoRow icon={FiList} label="Device / Browser" value={data.related.device} />
                    <div className="col-span-2">
                      <InfoRow icon={FiAward} label="Location" value={data.related.location} />
                    </div>
                  </div>
                )}

                {data.related.type === 'generic' && (
                  <p className="text-[#A0A0A0] text-sm italic">{data.related.info}</p>
                )}
              </div>
            </div>


            <div className="flex justify-start pt-4">
              <button
                onClick={() => navigate('/admin/activity')}
                className="flex items-center gap-2 px-6 py-3 bg-[#1F1F1F] border border-gray-800 text-[#E1E1E1] rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
              >
                <FiArrowLeft className="w-4 h-4" /> Back to Activity Logs
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Details;
