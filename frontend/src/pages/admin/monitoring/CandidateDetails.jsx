import React, { useState } from 'react';
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
  FiFileText,
  FiBarChart2,
  FiPieChart,
  FiCheckCircle
} from 'react-icons/fi';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const INITIAL_CANDIDATE = {
  id: '',
  name: '',
  job: '',
  status: '',
  rank: 0,
  aiScore: 0,
  recommendation: '',
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
  },
  linkedin: {
    url: '',
    connections: '',
    endorsements: 0,
    posts: 0
  },
  portfolio: {
    url: '',
    repos: 0,
    stars: 0,
    commits: ''
  }
};

// ─── Main Component ────────────────────────────────────────────────────────
const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');

  const [candidate, setCandidate] = useState(INITIAL_CANDIDATE);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const fetchCandidateDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/admins/rankings/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setCandidate(result.data);
        } else {
          setError('Candidate details not found.');
        }
      } catch (err) {
        setError('Failed to fetch candidate details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidateDetails();
  }, [id]);

  const backPath = from === 'shortlisted' ? '/admin/monitoring?tab=shortlisted' : '/admin/monitoring?tab=rankings';

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <p>Loading candidate details...</p>
      </div>
    );
  }

  if (error || !candidate || !candidate.name) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate(backPath)} className="text-[#3B82F6] hover:underline">
            Back to Rankings
          </button>
        </div>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇 Rank #1';
    if (rank === 2) return '🥈 Rank #2';
    if (rank === 3) return '🥉 Rank #3';
    return `Rank #${rank}`;
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Candidate Monitoring" />

        <main className="flex-1 overflow-y-auto relative custom-scrollbar">


          <div className="bg-[#1F1F1F] border-b border-gray-800 px-8 py-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate(backPath)}
                  className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#BB86FC]/20 text-[#BB86FC] rounded-2xl flex items-center justify-center text-2xl font-bold border border-[#BB86FC]/30">
                    {candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="font-medium text-gray-300">{candidate.job}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${candidate.status === 'Shortlisted' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                        candidate.status === 'Waitlisted' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              <div className="flex items-center gap-4 bg-[#111111] p-3 pr-6 rounded-2xl border border-gray-800">
                <div className="w-12 h-12 bg-gradient-to-br from-[#BB86FC] to-[#8A2BE2] rounded-xl flex items-center justify-center text-black font-bold text-xl">
                  {candidate.aiScore}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">AI Score</p>
                  <p className="text-[#E1E1E1] font-bold">{getRankBadge(candidate.rank)}</p>
                </div>
              </div>

            </div>


            <div className="max-w-6xl mx-auto mt-8 flex gap-8 border-b border-gray-800">
              {['overview', 'resume', 'linkedin', 'portfolio'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-colors capitalize ${activeTab === tab
                    ? 'border-[#BB86FC] text-[#BB86FC]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {tab === 'overview' ? 'Overview & AI Analysis' :
                    tab === 'resume' ? 'Original Resume' :
                      tab === 'linkedin' ? 'LinkedIn Profile' : 'Portfolio'}
                </button>
              ))}
            </div>
          </div>


          <div className="max-w-6xl mx-auto p-8 pb-32">

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">


                <div className="xl:col-span-2 space-y-6">


                  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                      <FiUser className="text-[#BB86FC]" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase mb-1">Email</span>
                        <div className="flex items-center gap-2 text-gray-300 font-medium">
                          <FiMail className="text-gray-500" /> {candidate.personal.email}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase mb-1">Phone</span>
                        <div className="flex items-center gap-2 text-gray-300 font-medium">
                          <FiPhone className="text-gray-500" /> {candidate.personal.phone}
                        </div>
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <span className="text-xs text-gray-500 font-medium uppercase mb-1">Address</span>
                        <div className="flex items-center gap-2 text-gray-300 font-medium">
                          <FiMapPin className="text-gray-500" /> {candidate.personal.address}
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                      <FiBriefcase className="text-[#BB86FC]" /> Experience
                    </h3>
                    <div className="space-y-4">
                      {candidate.experience && candidate.experience.length > 0 ? (
                        candidate.experience.map((exp, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                            <div>
                              <h4 className="font-bold text-[#E1E1E1]">{exp.title || exp.position || 'Unknown Role'}</h4>
                              <p className="text-sm font-medium text-gray-400">{exp.company || 'Unknown Company'}</p>
                              <p className="text-xs text-gray-500 mt-1">{exp.duration || exp.years || ''}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No experience data available.</p>
                      )}
                    </div>
                  </div>


                  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                      <FiAward className="text-[#BB86FC]" /> Education
                    </h3>
                    <div className="space-y-4">
                      {candidate.education && candidate.education.length > 0 ? (
                        candidate.education.map((edu, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-[#BB86FC] shrink-0"></div>
                            <div>
                              <h4 className="font-bold text-[#E1E1E1]">{edu.degree || 'Unknown Degree'}</h4>
                              <p className="text-sm font-medium text-gray-400">{edu.institution || edu.uni || 'Unknown Institution'}</p>
                              {(edu.start_year || edu.end_year || edu.year) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {edu.start_year ? `${edu.start_year} - ${edu.end_year || 'Present'}` : `Class of ${edu.year}`}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No education data available.</p>
                      )}
                    </div>
                  </div>


                  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                      <FiCheckCircle className="text-[#BB86FC]" /> Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <span key={idx} className="bg-[#111111] border border-gray-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>


                <div className="space-y-6">

                  <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <FiPieChart className="text-[#BB86FC]" /> AI Score Breakdown
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-400">Semantic Similarity</span>
                          <span className="font-bold text-emerald-500">{candidate.aiBreakdown.semanticSimilarity}%</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${candidate.aiBreakdown.semanticSimilarity}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-400">Skills Match</span>
                          <span className="font-bold text-blue-500">{candidate.aiBreakdown.skillsMatch}%</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${candidate.aiBreakdown.skillsMatch}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-400">Experience Match</span>
                          <span className="font-bold text-purple-500">{candidate.aiBreakdown.experienceMatch}%</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${candidate.aiBreakdown.experienceMatch}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-400">Education Match</span>
                          <span className="font-bold text-amber-500">{candidate.aiBreakdown.educationMatch}%</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${candidate.aiBreakdown.educationMatch}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#111111] to-[#1F1F1F] p-6 rounded-2xl border border-[#BB86FC]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#BB86FC]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="text-sm font-bold text-[#BB86FC] uppercase tracking-wider mb-2 relative z-10">AI Recommendation</h3>
                    <p className="text-white font-medium leading-relaxed relative z-10">
                      This candidate is <strong className="text-[#BB86FC]">{candidate.recommendation.toLowerCase()}</strong> for the role. Their experience aligns perfectly with the job requirements.
                    </p>
                  </div>

                </div>
              </div>
            )}


            {activeTab === 'resume' && (
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 h-[800px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#111111]/50 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><FiFileText className="text-[#BB86FC]" /> Document Viewer</h3>
                </div>
                <div className="flex-1 bg-gray-900 p-2">
                  {candidate.previewUrl ? (
                    <iframe
                      src={candidate.previewUrl}
                      className="w-full h-full rounded-xl border-none bg-white"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FiFileText className="w-12 h-12 mb-3 opacity-20" />
                      <p>No document preview available.</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'linkedin' && (
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8 text-center">
                <FiLinkedin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">LinkedIn Analysis</h3>
                <p className="text-gray-400 mb-6">View AI insights gathered from the candidate's public LinkedIn profile.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Connections</p>
                    <p className="text-lg font-bold">{candidate.linkedin.connections}</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Endorsements</p>
                    <p className="text-lg font-bold">{candidate.linkedin.endorsements}</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Posts</p>
                    <p className="text-lg font-bold">{candidate.linkedin.posts}</p>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'portfolio' && (
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8 text-center">
                <FiGlobe className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Portfolio Analysis</h3>
                <p className="text-gray-400 mb-6">View AI insights gathered from the candidate's GitHub or personal website.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Repositories</p>
                    <p className="text-lg font-bold">{candidate.portfolio.repos}</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Total Stars</p>
                    <p className="text-lg font-bold">{candidate.portfolio.stars}</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-gray-500 text-xs uppercase mb-1">Commits</p>
                    <p className="text-lg font-bold">{candidate.portfolio.commits}</p>
                  </div>
                </div>
              </div>
            )}

          </div>


          <div className="fixed bottom-0 left-64 right-0 bg-[#111111] border-t border-gray-800 p-4 px-8 z-10 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Administrator View • Read Only</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 font-medium">Current Decision:</span>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${candidate.status === 'Shortlisted' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                candidate.status === 'Waitlisted' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-gray-800 text-gray-300'
                }`}>
                {candidate.status}
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default CandidateDetails;
