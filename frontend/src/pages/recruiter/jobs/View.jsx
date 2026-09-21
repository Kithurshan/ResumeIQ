import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiCalendar, FiUsers } from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import { jobService } from '../../../services/jobService';

const INITIAL_JOB_DATA = {
  id: '',
  title: '',
  department: '',
  location: '',
  type: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
  vacancies: 0,
  status: '',
  description: '',
  responsibilities: [],
  requiredSkills: [],
  preferredSkills: [],
  experience: '',
  education: '',
};

// ─── Main View Job Component ───────────────────────────────────────────────
const View = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = React.useState(INITIAL_JOB_DATA);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await jobService.get(id);
        setJob({
          ...response.data,
          responsibilities: response.data.responsibilities
            ? response.data.responsibilities.split('\n').filter(Boolean)
            : [],
        });
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Unable to load this job.');
      }
    };
    loadJob();
  }, [id]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Job Details" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto pb-12 space-y-6">

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}


            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/recruiter/jobs')}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-200 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-gray-500 text-sm mt-1">ID: {job.id} • Department: {job.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${job.status === 'Active' ? 'bg-[#e8f5e9] text-[#00c853]' :
                    job.status === 'Draft' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                  {job.status}
                </span>
                <button
                  onClick={() => navigate(`/recruiter/jobs/${id}/edit`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Job
                </button>
              </div>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiBriefcase className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Type</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">{job.type}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiMapPin className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Location</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">{job.location || 'N/A'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiClock className="w-6 h-6 text-amber-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Experience</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">{job.experience || 'N/A'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiDollarSign className="w-6 h-6 text-green-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Salary</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">
                  {job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Not Disclosed'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiCalendar className="w-6 h-6 text-purple-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Deadline</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">{job.deadline}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <FiUsers className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Vacancies</span>
                <span className="text-sm font-semibold text-gray-900 mt-1">{job.vacancies}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h3>
                  <ul className="space-y-3">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-[#00c853] mt-1">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>


              <div className="space-y-6">


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-[#e8f5e9] text-[#00c853] px-3 py-1 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Preferred Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.preferredSkills.length > 0 ? job.preferredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      )) : <span className="text-sm text-gray-500">None specified</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Education</p>
                    <p className="text-sm text-gray-600">{job.education || 'Not specified'}</p>
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

export default View;
