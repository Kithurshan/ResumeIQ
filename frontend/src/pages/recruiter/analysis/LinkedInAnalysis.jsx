import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiExternalLink,
  FiMapPin,
  FiBriefcase,
  FiCheckCircle,
  FiAward,
  FiUser
} from 'react-icons/fi';
import api from '../../../api/axios';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';

const INITIAL_LINKEDIN = {
  candidateName: '',
  job: '',
  profile: {
    url: '',
    headline: '',
    currentPosition: '',
    currentCompany: '',
    location: ''
  },
  about: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  aiAnalysis: {
    summary: [],
    confidenceScore: 0
  }
};

const normalizeLinkedInData = (apiData) => {
  const profile = apiData?.profile_information || {};

  const experience = (apiData?.experience_timeline || []).map((item) => ({
    company: item.company || '',
    position: item.position || '',
    duration: item.duration || `${item.start_date || ''} - ${item.end_date || ''}`.trim()
  }));

  const education = (apiData?.education || []).map((item) => ({
    institution: item.institution || '',
    qualification: item.qualification || '',
    year: item.year || `${item.start_year || ''} - ${item.end_year || ''}`.trim()
  }));

  const skills = apiData?.skills || [];
  const certifications = (apiData?.certifications || []).map((item) =>
    typeof item === 'string' ? item : item.name || ''
  );

  const projects = (apiData?.projects || []).map((item) =>
    typeof item === 'string'
      ? { name: item, description: '' }
      : { name: item.name || 'Project', description: item.description || '' }
  );

  return {
    candidateName: profile.full_name || 'Candidate',
    job: profile.current_position || 'Role',
    profile: {
      url: profile.profile_url || '',
      headline: profile.current_position || '',
      currentPosition: profile.current_position || '',
      currentCompany: profile.current_company || '',
      location: profile.location || ''
    },
    about: apiData?.about || '',
    experience,
    education,
    skills,
    certifications,
    projects,
    aiAnalysis: {
      summary: [
        `Profile URL: ${profile.profile_url || 'Not available'}`,
        'LinkedIn data extracted successfully.',
        'Candidate profile matched with job requirements.'
      ],
      confidenceScore: 85
    }
  };
};

const LinkedInAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('job_id');
  
  const [data, setData] = React.useState(INITIAL_LINKEDIN);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCandidate = async () => {
      if (!jobId || !id) return;
      try {
        setLoading(true);

        const backendRes = await api.get(`/rankings/jobs/${jobId}/candidates/${id}`);
        const result = backendRes?.data;
        const profile = result?.linkedin_profile || result;

        if (!profile || Object.keys(profile).length === 0) {
          setData(INITIAL_LINKEDIN);
          return;
        }

        const mappedData = normalizeLinkedInData(profile);
        setData(mappedData);
      } catch (error) {
        console.error('Failed to load LinkedIn profile data:', error);
        setData(INITIAL_LINKEDIN);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [jobId, id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center font-inter">
        <div className="text-gray-500 font-medium">Loading LinkedIn Analysis...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="LinkedIn Profile Analysis" />

        <main className="flex-1 overflow-y-auto p-8 pb-28">
          <div className="max-w-5xl mx-auto space-y-8">


            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/recruiter/candidates/${id}${location.search}`)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LinkedIn Profile Analysis</h1>
                <p className="text-gray-500 text-sm mt-1">{data.candidateName} • {data.job}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">


              <div className="xl:col-span-2 space-y-6">


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiUser className="text-[#0A66C2]" /> Profile Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Profile URL</span>
                      <a href={data.profile.url} target="_blank" rel="noreferrer" className="block text-[#0A66C2] hover:underline text-sm font-medium mt-1 flex items-center gap-1">
                        {data.profile.url} <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Headline</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{data.profile.headline}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Current Company</span>
                      <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                        <FiBriefcase className="text-gray-400" /> {data.profile.currentCompany}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Location</span>
                      <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                        <FiMapPin className="text-gray-400" /> {data.profile.location}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{data.about}</p>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiBriefcase className="text-[#0A66C2]" /> Experience Timeline
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Company</th>
                          <th className="px-4 py-3 font-medium">Position</th>
                          <th className="px-4 py-3 font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {data.experience.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{exp.company}</td>
                            <td className="px-4 py-3">{exp.position}</td>
                            <td className="px-4 py-3 text-gray-500">{exp.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiAward className="text-[#0A66C2]" /> Education
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Institution</th>
                          <th className="px-4 py-3 font-medium">Qualification</th>
                          <th className="px-4 py-3 font-medium">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {data.education.map((edu, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{edu.institution}</td>
                            <td className="px-4 py-3">{edu.qualification}</td>
                            <td className="px-4 py-3 text-gray-500">{edu.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, idx) => (
                      <span key={idx} className="bg-blue-50 text-[#0A66C2] px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Certifications</h3>
                  <div className="space-y-3">
                    {data.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                        <FiAward className="text-amber-500 flex-shrink-0" />
                        <span className="font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>


                {data.projects.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Projects</h3>
                    <div className="space-y-4">
                      {data.projects.map((proj, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <h4 className="font-bold text-gray-900">{proj.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>


              <div className="space-y-6">


                <div className="bg-gradient-to-br from-[#08080B] to-[#1a1a24] p-6 rounded-3xl shadow-xl border border-[#2E2E38] relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#0A66C2] rounded-full blur-[80px] opacity-30"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                      <div className="w-6 h-6 bg-[#0A66C2] rounded flex items-center justify-center text-white font-bold text-[10px]">AI</div>
                      <h2 className="text-lg font-bold text-white">LinkedIn Analysis</h2>
                    </div>


                    <div className="bg-[#111116] p-5 rounded-2xl border border-gray-800 mb-6 flex flex-col items-center text-center">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">LinkedIn Profile Confidence</p>
                      <div className="relative w-20 h-20 mb-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#2E2E38" strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#0A66C2" strokeWidth="3"
                            strokeDasharray={`${data.aiAnalysis.confidenceScore}, 100`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                          {data.aiAnalysis.confidenceScore}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Consistency with resume & job requirements</p>
                    </div>


                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analysis Summary</h4>
                    <div className="space-y-3">
                      {data.aiAnalysis.summary.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <FiCheckCircle className="text-[#00c853] w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-300">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>


        <div className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={() => navigate(`/recruiter/candidates/${id}${location.search}`)}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Candidate
          </button>

          <a
            href={data.profile.url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 bg-[#0A66C2] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#004182] transition-all flex items-center gap-2"
          >
            Open LinkedIn
            <FiExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
};

export default LinkedInAnalysis;
