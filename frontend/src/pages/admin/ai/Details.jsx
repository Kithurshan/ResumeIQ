import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCpu,
  FiLinkedin,
  FiGlobe,
  FiAward,
  FiBarChart2
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const StepIcon = ({ status }) => {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
        <FiCheckCircle className="w-4 h-4 text-[#22C55E]" />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="w-7 h-7 rounded-full bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
        <FiXCircle className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
      <FiClock className="w-4 h-4 text-gray-500" />
    </div>
  );
};

const ScoreBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="font-medium text-gray-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}%</span>
    </div>
    <div className="w-full bg-[#111111] rounded-full h-2">
      <div className={`h-2 rounded-full`} style={{ width: `${value}%`, backgroundColor: color === 'text-emerald-500' ? '#22C55E' : color === 'text-blue-500' ? '#3B82F6' : color === 'text-purple-500' ? '#A855F7' : '#F59E0B' }}></div>
    </div>
  </div>
);

const Details = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchProcessingDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/admins/ai-processing/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError('Data not found');
        }
      } catch (err) {
        console.error('Failed to fetch processing details', err);
        setError('Failed to fetch details from the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchProcessingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <p>Loading AI processing details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Data not found'}</p>
          <button onClick={() => navigate('/admin/ai/processing')} className="text-[#3B82F6] hover:underline">
            Back to AI Processing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="AI Monitoring" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-12 space-y-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/ai/processing')}
                  className="w-10 h-10 bg-[#1F1F1F] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <FiCpu className="text-[#BB86FC]" />
                    Processing Details
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    ID: {id} • {data.candidate} • {data.job}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${data.status === 'Completed' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                  data.status === 'Processing' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    'bg-[#EF4444]/10 text-[#EF4444]'
                }`}>
                {data.status === 'Completed' && <FiCheckCircle />}
                {data.status === 'Failed' && <FiXCircle />}
                {data.status}
              </span>
            </div>




            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2"><FiCpu className="text-[#BB86FC]" /> Processing Information</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiFileText} label="Resume" value={data.resume} />
                  <InfoRow icon={FiUser} label="Candidate" value={data.candidate} />
                  <InfoRow icon={FiBriefcase} label="Job" value={data.job} />
                  <InfoRow icon={FiUser} label="Recruiter" value={data.recruiter} />
                  <InfoRow icon={FiBriefcase} label="Company" value={data.company} />
                </div>
              </div>


              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2"><FiClock className="text-[#BB86FC]" /> Timeline</h3>
                </div>
                <div className="p-5 divide-y divide-gray-800">
                  <InfoRow icon={FiCalendar} label="Uploaded" value={data.uploadedDate} />
                  <InfoRow icon={FiClock} label="Processing Started" value={data.processingStarted} />
                  <InfoRow icon={FiCheckCircle} label="Completed" value={data.completedDate} />
                  <InfoRow icon={FiClock} label="Processing Time" value={data.processingTime} highlight />
                  <InfoRow icon={FiFileText} label="File Size" value={data.fileSize} />
                </div>
              </div>
            </div>




            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2"><FiBarChart2 className="text-[#BB86FC]" /> AI Pipeline Steps</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#111111] rounded-xl border border-gray-800">
                      <StepIcon status={step.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#E1E1E1] truncate">{step.name}</p>
                        <p className="text-xs text-gray-500">{step.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>




            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2"><FiCpu className="text-[#BB86FC]" /> SBERT Semantic Matching</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                  <div className="flex flex-col items-center justify-center text-center p-6 bg-[#111111] rounded-2xl border border-gray-800">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BB86FC] to-[#8A2BE2] flex items-center justify-center mb-4">
                      <span className="text-3xl font-black text-white">{data.semantic.similarity}%</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Semantic Similarity</p>
                  </div>


                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3">Matched Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {data.semantic.matchedSkills.map((skill, idx) => (
                          <span key={idx} className="bg-[#22C55E]/10 text-[#22C55E] px-3 py-1.5 rounded-lg text-xs font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3">Missing Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {data.semantic.missingSkills.map((skill, idx) => (
                          <span key={idx} className="bg-[#EF4444]/10 text-[#EF4444] px-3 py-1.5 rounded-lg text-xs font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="bg-[#111111] rounded-2xl border border-gray-800 p-5">
                    <p className="text-sm font-medium text-gray-500 mb-3">Semantic Summary</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{data.semantic.summary}</p>
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-1">Experience Match</p>
                      <p className="text-sm text-gray-300">{data.semantic.matchedExperience}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>




            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                <h3 className="font-bold flex items-center gap-2"><FiAward className="text-[#BB86FC]" /> AI Recommendation</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                  <div className="flex flex-col items-center justify-center text-center p-6 bg-[#111111] rounded-2xl border border-gray-800">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#BB86FC] to-[#8A2BE2] flex items-center justify-center mb-4">
                      <span className="text-2xl font-black text-white">{data.recommendation.aiScore}%</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold mb-2 ${data.recommendation.recommendation === 'Highly Recommended' ? 'bg-emerald-500/10 text-emerald-500' :
                        data.recommendation.recommendation === 'Recommended' ? 'bg-blue-500/10 text-blue-500' :
                          data.recommendation.recommendation === 'Consider' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-[#EF4444]/10 text-[#EF4444]'
                      }`}>
                      {data.recommendation.recommendation}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">Ranking Position: <strong className="text-[#E1E1E1]">#{data.recommendation.rankPosition}</strong></p>
                  </div>


                  <div className="space-y-5 flex flex-col justify-center">
                    <ScoreBar label="Semantic Similarity" value={data.recommendation.breakdown.semanticSimilarity} color="text-emerald-500" />
                    <ScoreBar label="Skills Match" value={data.recommendation.breakdown.skillsMatch} color="text-blue-500" />
                    <ScoreBar label="Experience Match" value={data.recommendation.breakdown.experienceMatch} color="text-purple-500" />
                    <ScoreBar label="Education Match" value={data.recommendation.breakdown.educationMatch} color="text-amber-500" />
                  </div>


                  <div className="bg-gradient-to-br from-[#111111] to-[#1F1F1F] rounded-2xl border border-[#BB86FC]/20 p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#BB86FC]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <p className="text-sm font-bold text-[#BB86FC] uppercase tracking-wider mb-3 relative z-10">Overall AI Summary</p>
                    <p className="text-sm text-gray-300 leading-relaxed relative z-10">{data.recommendation.summary}</p>
                  </div>
                </div>
              </div>
            </div>




            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LinkedIn Analysis */}
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2"><FiLinkedin className="text-blue-500" /> LinkedIn Analysis</h3>
                </div>
                <div className="p-5">
                  {data.linkedin.detected ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Connections</p>
                          <p className="text-lg font-bold">{data.linkedin.connections}</p>
                        </div>
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Endorsements</p>
                          <p className="text-lg font-bold">{data.linkedin.endorsements}</p>
                        </div>
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Relevant Posts</p>
                          <p className="text-lg font-bold">{data.linkedin.relevantPosts}</p>
                        </div>
                      </div>
                      
                      {(() => {
                        try {
                          const liData = JSON.parse(data.linkedin.summary);
                          return (
                            <div className="space-y-4">
                              {liData.profile_information && (
                                <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                                  <h4 className="font-semibold text-[#E1E1E1] mb-2">{liData.profile_information.full_name}</h4>
                                  <p className="text-sm text-gray-400 mb-1">{liData.profile_information.headline}</p>
                                  <p className="text-xs text-blue-400">{liData.profile_information.location}</p>
                                </div>
                              )}
                              
                              {liData.experience_timeline && liData.experience_timeline.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Experience</p>
                                  <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                                    <p className="font-medium text-[#E1E1E1] text-sm">{liData.experience_timeline[0].position}</p>
                                    <p className="text-xs text-gray-400 mt-1">{liData.experience_timeline[0].company} • {liData.experience_timeline[0].duration}</p>
                                  </div>
                                </div>
                              )}

                              {liData.skills && liData.skills.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Skills</p>
                                  <div className="flex flex-wrap gap-2">
                                    {liData.skills.slice(0, 5).map((skill, idx) => (
                                      <span key={idx} className="bg-[#3B82F6]/10 text-blue-400 px-2 py-1 rounded text-xs font-medium border border-[#3B82F6]/20">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return <p className="text-sm text-gray-400 leading-relaxed">{data.linkedin.summary}</p>;
                        }
                      })()}
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No LinkedIn profile detected.</p>
                  )}
                </div>
              </div>

              {/* Portfolio Analysis */}
              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                  <h3 className="font-bold flex items-center gap-2"><FiGlobe className="text-emerald-500" /> Portfolio Analysis</h3>
                </div>
                <div className="p-5">
                  {data.portfolio.detected ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Repositories</p>
                          <p className="text-lg font-bold">{data.portfolio.repos}</p>
                        </div>
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Total Stars</p>
                          <p className="text-lg font-bold">{data.portfolio.stars}</p>
                        </div>
                        <div className="bg-[#111111] p-3 rounded-xl border border-gray-800 text-center">
                          <p className="text-gray-500 text-xs uppercase mb-1">Relevant Projects</p>
                          <p className="text-lg font-bold">{data.portfolio.relevantProjects}</p>
                        </div>
                      </div>
                      
                      {(() => {
                        try {
                          const portData = JSON.parse(data.portfolio.summary);
                          return (
                            <div className="space-y-4">
                              <div className="bg-[#111111] rounded-xl p-4 border border-gray-800 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Portfolio Domain</p>
                                  <p className="text-sm font-medium text-emerald-400">{portData.domain || 'N/A'}</p>
                                </div>
                                <a href={portData.portfolio_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1F1F1F] rounded-lg hover:bg-gray-800 transition-colors">
                                  <FiGlobe className="text-gray-400 w-4 h-4" />
                                </a>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#111111] rounded-xl p-3 border border-gray-800">
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pages Crawled</p>
                                  <p className="text-sm text-[#E1E1E1] font-medium">{portData.pages_crawled || 0}</p>
                                </div>
                                <div className="bg-[#111111] rounded-xl p-3 border border-gray-800">
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tech Stack Size</p>
                                  <p className="text-sm text-[#E1E1E1] font-medium">{portData.technologies_used || 0}</p>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <p className="text-sm text-gray-400 leading-relaxed">{data.portfolio.summary}</p>;
                        }
                      })()}
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No portfolio detected.</p>
                  )}
                </div>
              </div>

            </div>


            <div className="flex justify-start pt-2">
              <button
                onClick={() => navigate('/admin/ai/processing')}
                className="flex items-center gap-2 px-6 py-3 bg-[#1F1F1F] border border-gray-800 text-[#E1E1E1] rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                <FiArrowLeft className="w-4 h-4" /> Back to AI Processing
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="py-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
    <span className={`text-sm font-medium ${highlight ? 'text-[#BB86FC]' : 'text-[#E1E1E1]'}`}>{value}</span>
  </div>
);

export default Details;
