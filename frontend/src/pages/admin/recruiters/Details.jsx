import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiHash,
  FiCalendar,
  FiClock,
  FiFileText,
  FiUsers,
  FiStar,
  FiBarChart2
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-[#E1E1E1] font-medium">{value}</p>
    </div>
  </div>
);

const StatBox = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <div className="bg-[#111111] rounded-xl border border-gray-800 p-4 text-center">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${bgClass} ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-xl font-bold text-[#E1E1E1]">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const Details = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [recruiter, setRecruiter] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchRecruiterDetails = async () => {
      try {
        setLoading(true);
        // Using axios directly or import it if needed. We will use fetch here to avoid adding an import if we aren't sure axios is imported.
        // Wait, axios is NOT imported in this file. Let's use fetch.
        const response = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/profile/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const data = result.data;
          setRecruiter({
            id: data.recruiter_id,
            name: data.full_name || '',
            profileImage: data.profile_image || null,
            position: data.position || 'Recruiter',
            department: data.department || 'Human Resources',
            location: data.office_location || 'Not Specified',
            email: data.email || '',
            phone: data.phone || 'N/A',
            status: data.status || 'Inactive',
            joinedDate: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A',
            lastLogin: data.last_login ? new Date(data.last_login).toLocaleString() : 'Never',
            stats: {
              jobsCreated: data.activity?.jobs_created || 0,
              resumesUploaded: data.activity?.resumes_uploaded || 0,
              candidatesRanked: data.activity?.resumes_uploaded || 0, // Using same for now
              shortlisted: data.activity?.shortlisted_candidates || 0,
            },
            role: 'Recruiter'
          });
        } else {
          setError('Recruiter not found.');
        }
      } catch (err) {
        setError('Failed to fetch details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecruiterDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <p>Loading recruiter details...</p>
      </div>
    );
  }

  if (error || !recruiter) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/recruiters')} className="text-[#3B82F6] hover:underline">
            Back to Recruiter List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Recruiter Management" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-8">

            <button
              onClick={() => navigate('/admin/recruiters')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#E1E1E1] text-sm font-medium mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Recruiter List
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


              <div className="lg:col-span-1">
                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6 text-center">

                  <div className="w-24 h-24 rounded-full bg-[#BB86FC]/20 flex items-center justify-center mx-auto mb-4 text-[#BB86FC] text-3xl font-bold overflow-hidden">
                    {recruiter.profileImage && !recruiter.profileImage.startsWith('blob:') ? (
                        <img src={recruiter.profileImage} alt={recruiter.name} className="w-full h-full object-cover" />
                    ) : (
                        recruiter.name ? recruiter.name.split(' ').map(n => n[0]).join('') : ''
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#E1E1E1]">{recruiter.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{recruiter.position}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{recruiter.department} • {recruiter.location}</p>

                  <div className="mt-4">
                    {recruiter.status === 'Active' ? (
                      <span className="text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-lg text-xs font-medium">Active</span>
                    ) : (
                      <span className="text-gray-400 bg-gray-700/30 px-3 py-1 rounded-lg text-xs font-medium">Inactive</span>
                    )}
                  </div>


                  <button
                    onClick={() => navigate(`/admin/recruiters/${recruiter.id}/edit`)}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BB86FC] text-black font-semibold text-sm rounded-xl hover:bg-[#cfa4ff] transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" /> Edit Recruiter
                  </button>
                </div>
              </div>


              <div className="lg:col-span-2 space-y-6">


                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-800">
                    <h3 className="font-bold">Personal Information</h3>
                  </div>
                  <div className="p-5 divide-y divide-gray-800">
                    <InfoRow icon={FiUser} label="Full Name" value={recruiter.name} />
                    <InfoRow icon={FiMail} label="Email Address" value={recruiter.email} />
                    <InfoRow icon={FiPhone} label="Phone Number" value={recruiter.phone} />
                    <InfoRow icon={FiHash} label="Department" value={recruiter.department} />
                    <InfoRow icon={FiBriefcase} label="Position" value={recruiter.position} />
                    <InfoRow icon={FiUser} label="Office Location" value={recruiter.location} />
                  </div>
                </div>


                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-800">
                    <h3 className="font-bold">Recruitment Summary</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox icon={FiBriefcase} label="List Created" value={recruiter.stats.jobsCreated} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    <StatBox icon={FiFileText} label="Resumes Uploaded" value={recruiter.stats.resumesUploaded} colorClass="text-orange-500" bgClass="bg-orange-500/10" />
                    <StatBox icon={FiBarChart2} label="Candidates Ranked" value={recruiter.stats.candidatesRanked} colorClass="text-[#BB86FC]" bgClass="bg-[#BB86FC]/10" />
                    <StatBox icon={FiStar} label="Shortlisted" value={recruiter.stats.shortlisted} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                  </div>
                </div>


                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-800">
                    <h3 className="font-bold">Account Information</h3>
                  </div>
                  <div className="p-5 divide-y divide-gray-800">
                    <InfoRow icon={FiHash} label="Recruiter ID" value={recruiter.id} />
                    <InfoRow icon={FiUser} label="Role" value={recruiter.role} />
                    <InfoRow icon={FiCalendar} label="Joined Date" value={recruiter.joinedDate} />
                    <InfoRow icon={FiClock} label="Last Login" value={recruiter.lastLogin} />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Details;
