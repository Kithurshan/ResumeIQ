import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiAward,
  FiLinkedin,
  FiGlobe,
  FiCheck,
  FiClock,
  FiExternalLink,
  FiFileText
} from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import { useUI } from '../../../context/UIContext';

  const INITIAL_CANDIDATE = {
  id: '',
  name: '',
  job: '',
  status: 'Pending',
  rank: 1,
  aiScore: 0,
  recommendation: '',
  resume_id: null,
  linkedin_url: null,
  portfolio_url: null,
  personal: {
    email: '',
    phone: '',
    address: ''
  },
  education: [],
  experience: [],
  skills: [],
  aiBreakdown: {
    skillsMatch: 0,
    experienceMatch: 0,
    educationMatch: 0,
    semanticSimilarity: 0
  }
};

// ─── Main Component ────────────────────────────────────────────────────────
const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, showToast } = useUI();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const initialStatus = searchParams.get('status') || INITIAL_CANDIDATE.status;

  const [candidate, setCandidate] = useState({ ...INITIAL_CANDIDATE, status: initialStatus });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const jobId = searchParams.get('job_id');
  const backPath = from === 'shortlisted' ? '/recruiter/shortlisted' : '/recruiter/rankings';

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!jobId || !id) return;
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/rankings/jobs/${jobId}/candidates/${id}?t=${new Date().getTime()}`);
        const data = res.data;
        
        setCandidate({
          id: data.candidate_id,
          name: data.candidate_name,
          job: data.job_title,
          status: data.selection_status,
          rank: data.rank_position,
          aiScore: data.scores.overall_score,
          recommendation: data.recommendation,
          resume_id: data.resume_id,
          linkedin_url: data.linkedin_url,
          portfolio_url: data.portfolio_url,
          personal: {
            email: data.email || 'N/A',
            phone: data.phone || 'N/A',
            address: data.location || 'N/A'
          },
          education: data.education,
          experience: data.experience,
          skills: data.skills,
          aiBreakdown: {
            skillsMatch: data.scores.skill_score,
            experienceMatch: data.scores.experience_score,
            educationMatch: data.scores.education_score,
            semanticSimilarity: data.scores.semantic_score,
            projectScore: data.scores.project_score,
            portfolioScore: data.scores.portfolio_score,
            linkedinScore: data.scores.linkedin_score
          }
        });
      } catch (error) {
        console.error("Failed to fetch candidate details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id, jobId]);

  const handleShortlist = async () => {
    const isConfirmed = await confirm({
      title: 'Shortlist Candidate?',
      message: 'This candidate will be moved to the Shortlisted list.',
      confirmText: 'Yes, Shortlist',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (isConfirmed) {
      try {
        const recruiterId = localStorage.getItem('recruiterId') || '';
        await axios.put(`http://localhost:5000/api/rankings/jobs/${jobId}/candidates/${id}/status`, 
          { status: 'Shortlisted' },
          { headers: { 'x-recruiter-id': recruiterId } }
        );
        setCandidate({ ...candidate, status: 'Shortlisted' });
        showToast('Candidate shortlisted successfully!', 'success');
      } catch (error) {
        showToast('Failed to shortlist candidate.', 'error');
      }
    }
  };

  const handleWaitlist = async () => {
    const isConfirmed = await confirm({
      title: 'Waitlist Candidate?',
      message: 'This candidate will be moved to the Waitlisted list.',
      confirmText: 'Yes, Waitlist',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (isConfirmed) {
      try {
        const recruiterId = localStorage.getItem('recruiterId') || '';
        await axios.put(`http://localhost:5000/api/rankings/jobs/${jobId}/candidates/${id}/status`, 
          { status: 'Waitlisted' },
          { headers: { 'x-recruiter-id': recruiterId } }
        );
        setCandidate({ ...candidate, status: 'Waitlisted' });
        showToast('Candidate successfully waitlisted!', 'success');
      } catch (error) {
        showToast('Failed to waitlist candidate.', 'error');
      }
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇 Rank #1';
    if (rank === 2) return '🥈 Rank #2';
    if (rank === 3) return '🥉 Rank #3';
    return `Rank #${rank}`;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Candidate Details" />

        <main className="flex-1 overflow-y-auto relative">
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-medium">Loading Candidate Profile...</p>
            </div>
          ) : (
            <>
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate(backPath)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm">
                    {candidate.name ? candidate.name.charAt(0) : ''}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="font-medium text-gray-700">{candidate.job}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${candidate.status === 'Shortlisted' ? 'bg-[#e8f5e9] text-[#00c853]' :
                          candidate.status === 'Waitlisted' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gradient-to-r from-[#111116] to-[#1a1a24] p-3 pr-6 rounded-2xl shadow-lg border border-gray-800">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {typeof candidate.aiScore === 'number' ? candidate.aiScore.toFixed(1) : candidate.aiScore}
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">AI Score</p>
                  <p className="text-white font-bold">{getRankBadge(candidate.rank)}</p>
                </div>
              </div>

            </div>

            <div className="max-w-6xl mx-auto mt-8 flex gap-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[#00c853] text-[#00c853]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                Overview & AI Analysis
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'resume' ? 'border-[#00c853] text-[#00c853]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                Original Resume
              </button>
              <button
                onClick={() => setActiveTab('linkedin')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'linkedin' ? 'border-[#00c853] text-[#00c853]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                LinkedIn Profile
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'portfolio' ? 'border-[#00c853] text-[#00c853]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                Portfolio
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-8 pb-32">

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                <div className="xl:col-span-2 space-y-6">

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                      <FiUser className="text-[#00c853]" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1">Email</span>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <FiMail className="text-gray-400" /> {candidate.personal.email}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1">Phone</span>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <FiPhone className="text-gray-400" /> {candidate.personal.phone}
                        </div>
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1">Address</span>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <FiMapPin className="text-gray-400" /> {candidate.personal.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                      <FiBriefcase className="text-[#00c853]" /> Experience
                    </h3>
                    <div className="space-y-4">
                      {candidate.experience && candidate.experience.length > 0 ? (
                        candidate.experience.map((exp, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-bold text-gray-900">{exp.title || exp.position}</h4>
                              <p className="text-sm font-medium text-gray-600">{exp.company}</p>
                              {(exp.duration || exp.years) && (
                                <p className="text-xs text-gray-400 mt-1">{exp.duration || exp.years}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">No work experience data extracted from resume.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                      <FiAward className="text-[#00c853]" /> Education
                    </h3>
                    <div className="space-y-4">
                      {candidate.education && candidate.education.length > 0 ? (
                        candidate.education.map((edu, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                              {(edu.institution || edu.uni) && (
                                <p className="text-sm font-medium text-gray-600">{edu.institution || edu.uni}</p>
                              )}
                              {edu.year && (
                                <p className="text-xs text-gray-400 mt-1">{edu.year}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">No education data extracted from resume.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Extracted Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="space-y-6">

                  <div className="bg-gradient-to-br from-[#08080B] to-[#1a1a24] p-6 rounded-3xl shadow-xl border border-[#2E2E38] relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#7C3AED] rounded-full blur-[80px] opacity-30"></div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                        <div className="w-6 h-6 bg-[#7C3AED] rounded flex items-center justify-center text-white font-bold text-[10px]">AI</div>
                        <h2 className="text-lg font-bold text-white">Ranking Analysis</h2>
                      </div>

                      <div className="bg-[#111116] p-4 rounded-2xl border border-gray-800 mb-6 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-gray-400 font-medium mb-1">Recommendation</p>
                        <p className={`font-bold text-xl ${
                          candidate.recommendation === 'Highly Suitable' ? 'text-[#00c853]' :
                          candidate.recommendation === 'Suitable' ? 'text-green-400' :
                          candidate.recommendation === 'Moderately Suitable' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{candidate.recommendation || 'N/A'}</p>
                      </div>

                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Score Breakdown</h4>

                      <div className="space-y-4">

                        {[
                          { label: 'Skills Match', value: candidate.aiBreakdown.skillsMatch, color: 'bg-[#7C3AED]' },
                          { label: 'Experience Match', value: candidate.aiBreakdown.experienceMatch, color: 'bg-[#7C3AED]' },
                          { label: 'Education Match', value: candidate.aiBreakdown.educationMatch, color: 'bg-[#7C3AED]' },
                          { label: 'Semantic Similarity (SBERT)', value: candidate.aiBreakdown.semanticSimilarity, color: 'bg-[#00c853]' },
                        ].map(({ label, value, color }) => {
                          const pct = typeof value === 'number' ? Math.min(value, 100) : 0;
                          return (
                            <div key={label} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-300">{label}</span>
                                <span className="text-white">{typeof value === 'number' ? value.toFixed(2) : 0}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex gap-3">
                      <FiCheck className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 mb-1">AI Insight</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {candidate.recommendation === 'Highly Suitable' || candidate.recommendation === 'Suitable'
                            ? `${candidate.name} is a ${candidate.recommendation?.toLowerCase()} match for the ${candidate.job} position, with strong skills and profile alignment.`
                            : candidate.recommendation === 'Moderately Suitable'
                            ? `${candidate.name} shows a moderate fit for ${candidate.job}. Some key skills match, but there are gaps in experience or education alignment.`
                            : `${candidate.name}'s profile has low alignment with the ${candidate.job} requirements based on AI scoring. Review manually for niche skills.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'resume' && (
              <div className="w-full h-[800px] bg-gray-200 rounded-2xl flex flex-col items-center justify-center border border-gray-300 overflow-hidden">
                {candidate.resume_id ? (
                  <iframe 
                    src={`http://localhost:5000/api/resumes/${candidate.resume_id}/download`}
                    className="w-full h-full border-none"
                    title="Candidate Resume PDF"
                  />
                ) : (
                  <>
                    <FiFileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">Resume PDF is not available.</p>
                  </>
                )}
              </div>
            )}

            {activeTab === 'linkedin' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <FiLinkedin className="w-6 h-6 text-[#0A66C2]" />
                  <h3 className="text-lg font-bold text-gray-900">LinkedIn Profile Analysis</h3>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  {candidate.linkedin_url ? (
                    <>
                      <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-[#0A66C2] hover:underline font-medium flex items-center gap-2 mb-4">
                        {candidate.linkedin_url} <FiExternalLink />
                      </a>

                      <h4 className="font-bold text-gray-900 mb-2">AI Summary</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2"><span>•</span> AI successfully detected this LinkedIn profile from the candidate's resume.</li>
                        <li className="flex gap-2"><span>•</span> The profile link appears to be valid and active.</li>
                        <li className="flex gap-2"><span>•</span> Click 'View Full LinkedIn Analysis' for deep insights.</li>
                      </ul>

                      <button
                        onClick={() => navigate(`/recruiter/candidates/${id}/linkedin${location.search}`)}
                        className="mt-6 px-5 py-2.5 bg-[#0A66C2] text-white rounded-lg font-medium shadow-sm hover:bg-[#004182] transition-colors"
                      >
                        View Full LinkedIn Analysis
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500 font-medium">No LinkedIn profile URL was found on this candidate's resume.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <FiGlobe className="w-6 h-6 text-[#00c853]" />
                  <h3 className="text-lg font-bold text-gray-900">Portfolio Analysis</h3>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  {candidate.portfolio_url ? (
                    <>
                      <a href={candidate.portfolio_url} target="_blank" rel="noreferrer" className="text-[#00c853] hover:underline font-medium flex items-center gap-2 mb-4">
                        {candidate.portfolio_url} <FiExternalLink />
                      </a>

                      <h4 className="font-bold text-gray-900 mb-2">AI Summary</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2"><span>•</span> AI successfully detected this Portfolio URL from the candidate's resume.</li>
                        <li className="flex gap-2"><span>•</span> This link could point to a personal website, GitHub, or Behance profile.</li>
                        <li className="flex gap-2"><span>•</span> Click 'View Full Portfolio Analysis' for deep technical insights.</li>
                      </ul>

                      <button
                        onClick={() => navigate(`/recruiter/candidates/${id}/portfolio${location.search}`)}
                        className="mt-6 px-5 py-2.5 bg-[#00c853] text-white rounded-lg font-medium shadow-sm hover:bg-[#00b048] transition-colors"
                      >
                        View Full Portfolio Analysis
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500 font-medium">No Portfolio or GitHub URL was found on this candidate's resume.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          </>
          )}
        </main>


        <div className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 sticky bottom-0">

          {candidate.status === 'Shortlisted' && (
            <div className="flex items-center gap-2 w-full justify-center md:justify-start text-[#00c853]">
              <FiCheck className="w-5 h-5" />
              <span className="font-bold">Already Shortlisted</span>
            </div>
          )}

          {candidate.status === 'Waitlisted' && (
            <>
              <p className="text-sm text-gray-500 hidden md:block">
                Current Status: <strong className="text-amber-600">{candidate.status}</strong>
              </p>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleShortlist}
                  className="flex-1 md:flex-none px-8 py-3 bg-[#00c853] text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-[#00b048] hover:shadow-xl hover:shadow-green-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" />
                  Shortlist Candidate
                </button>
              </div>
            </>
          )}

          {candidate.status === 'Pending' && (
            <>
              <p className="text-sm text-gray-500 hidden md:block">
                Current Status: <strong className="text-gray-900">{candidate.status}</strong>
              </p>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleWaitlist}
                  className="flex-1 md:flex-none px-8 py-3 bg-white border border-amber-500 text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiClock className="w-5 h-5" />
                  Waitlist
                </button>
                <button
                  onClick={handleShortlist}
                  className="flex-1 md:flex-none px-8 py-3 bg-[#00c853] text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-[#00b048] hover:shadow-xl hover:shadow-green-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" />
                  Shortlist
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
