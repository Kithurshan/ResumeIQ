import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiStar,
  FiUserPlus
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';
import ExportButtons from '../../../components/ui/ExportButtons';

const JobDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/admins/jobs/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          
          let parsedReqSkills = [];
          if (typeof data.required_skills === 'string') {
             parsedReqSkills = data.required_skills.split(',').map(s => s.trim()).filter(Boolean);
          } else if (Array.isArray(data.required_skills)) {
             parsedReqSkills = data.required_skills;
          }

          let quals = data.qualifications || {};
          let parsedPrefSkills = quals.preferredSkills || [];
          let education = quals.education || 'Not specified';
          let responsibilitiesStr = quals.responsibilities || '';
          let responsibilities = responsibilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);

          setJob({
            id: data.job_id,
            title: data.job_title || '',
            department: data.department || '',
            location: data.location || '',
            type: data.employment_type || '',
            salaryMin: data.salary_range ? data.salary_range.split('-')[0] : '',
            salaryMax: data.salary_range && data.salary_range.includes('-') ? data.salary_range.split('-')[1] : '',
            deadline: data.application_deadline ? new Date(data.application_deadline).toLocaleDateString() : 'N/A',
            vacancies: data.vacancies || 0,
            status: data.status || '',
            recruiter: data.recruiter_name || 'Unknown',
            company: data.department || 'Internal',
            description: data.job_description || 'No description provided.',
            responsibilities: responsibilities,
            requiredSkills: parsedReqSkills,
            preferredSkills: parsedPrefSkills,
            experience: data.experience_required || '',
            education: education,
            stats: { 
              uploadedResumes: data.uploaded_resumes || 0, 
              candidatesRanked: data.candidates_ranked || 0, 
              shortlisted: data.shortlisted_count || 0, 
              waitlisted: data.waitlisted_count || 0 
            }
          });
        } else {
          setError('Job not found.');
        }
      } catch (err) {
        setError('Failed to fetch job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/monitoring?tab=jobs')} className="text-[#3B82F6] hover:underline">
            Back to Job Monitoring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Job Monitoring" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-12 space-y-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/monitoring?tab=jobs')}
                  className="w-10 h-10 bg-[#1F1F1F] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    ID: {job.id} • Company: {job.company} • Recruiter: {job.recruiter}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${job.status === 'Active' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                    job.status === 'Draft' ? 'bg-gray-800 text-gray-400' :
                      'bg-[#F59E0B]/10 text-[#F59E0B]'
                  }`}>
                  {job.status}
                </span>
                <ExportButtons data={[job]} filename={`job_${job.id}_details`} />
              </div>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiBriefcase className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Type</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">{job.type}</span>
              </div>
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiMapPin className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Location</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">{job.location || 'N/A'}</span>
              </div>
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiClock className="w-6 h-6 text-amber-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Experience</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">{job.experience || 'N/A'}</span>
              </div>
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiDollarSign className="w-6 h-6 text-green-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Salary</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">
                  {job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Not Disclosed'}
                </span>
              </div>
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiCalendar className="w-6 h-6 text-[#BB86FC] mb-2" />
                <span className="text-xs text-gray-500 font-medium">Deadline</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">{job.deadline}</span>
              </div>
              <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
                <FiUsers className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Vacancies</span>
                <span className="text-sm font-bold text-[#E1E1E1] mt-1">{job.vacancies}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1F1F1F] p-8 rounded-2xl border border-gray-800">
                  <h3 className="text-lg font-bold mb-4">Job Description</h3>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                <div className="bg-[#1F1F1F] p-8 rounded-2xl border border-gray-800">
                  <h3 className="text-lg font-bold mb-4">Responsibilities</h3>
                  <ul className="space-y-3">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-400">
                        <span className="text-[#BB86FC] mt-1">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>


              <div className="space-y-6">


                <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <FiBarChart2 className="text-[#BB86FC]" /> Recruitment Stats
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#111111] rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><FiFileText className="w-4 h-4" /></div>
                        <span className="text-sm font-medium text-gray-300">Uploaded Resumes</span>
                      </div>
                      <span className="font-bold text-[#E1E1E1]">{job.stats.uploadedResumes}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#111111] rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#BB86FC]/10 rounded-lg text-[#BB86FC]"><FiUsers className="w-4 h-4" /></div>
                        <span className="text-sm font-medium text-gray-300">Candidates Ranked</span>
                      </div>
                      <span className="font-bold text-[#E1E1E1]">{job.stats.candidatesRanked}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#111111] rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><FiStar className="w-4 h-4" /></div>
                        <span className="text-sm font-medium text-gray-300">Shortlisted</span>
                      </div>
                      <span className="font-bold text-[#E1E1E1]">{job.stats.shortlisted}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#111111] rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><FiUserPlus className="w-4 h-4" /></div>
                        <span className="text-sm font-medium text-gray-300">Waitlisted</span>
                      </div>
                      <span className="font-bold text-[#E1E1E1]">{job.stats.waitlisted}</span>
                    </div>
                  </div>
                </div>


                <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                  <h3 className="text-lg font-bold mb-4">Requirements</h3>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-500 mb-3">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-[#22C55E]/10 text-[#22C55E] px-3 py-1.5 rounded-lg text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-500 mb-3">Preferred Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.preferredSkills.length > 0 ? job.preferredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
                          {skill}
                        </span>
                      )) : <span className="text-sm text-gray-500">None specified</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Education</p>
                    <p className="text-sm font-medium text-[#E1E1E1]">{job.education || 'Not specified'}</p>
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

export default JobDetails;
