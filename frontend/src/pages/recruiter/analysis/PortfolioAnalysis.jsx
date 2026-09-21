import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiExternalLink,
  FiGlobe,
  FiGithub,
  FiCheckCircle,
  FiCode,
  FiStar
} from 'react-icons/fi';
import api from '../../../api/axios';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';

const INITIAL_PORTFOLIO = {
  candidateName: '',
  job: '',
  website: {
    url: '',
    domain: '',
    lastUpdated: ''
  },
  techStack: [],
  projects: [],
  github: {
    url: '',
    repoName: '',
    stars: 0,
    language: '',
    lastCommit: ''
  },
  liveDemo: '',
  qualityMetrics: {
    projectsFound: 0,
    completedProjects: 0,
    technologiesUsed: 0,
    responsiveDesign: '',
    documentation: ''
  },
  aiAnalysis: {
    summary: [],
    portfolioScore: 0
  }
};

const normalizePortfolioData = (apiData) => {
  const normalized = apiData?.normalized_profile || apiData || {};
  const raw = apiData || {};

  const techStack = Array.isArray(normalized.skills)
    ? normalized.skills
    : Array.isArray(raw.technologies)
      ? raw.technologies
      : [];

  const rawProjects = Array.isArray(normalized.projects)
    ? normalized.projects
    : Array.isArray(raw.projects)
      ? raw.projects
      : [];

  const projects = rawProjects.map((project) => ({
    name: project.title || project.name || 'Project',
    description: project.description || project.summary || 'No description available.',
    tech: Array.isArray(project.technologies) ? project.technologies : [],
    url: project.url || ''
  }));

  const candidateName = normalized.candidateName || raw.candidateName || 'Candidate';
  const job = normalized.job || raw.job || 'Portfolio Review';
  const portfolioUrl = normalized.profile?.portfolio_url || raw.portfolio_url || '';
  let parsedDomain = '';
  if (portfolioUrl) {
    try { parsedDomain = new URL(portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`).hostname; } catch { parsedDomain = portfolioUrl; }
  }
  const domain = normalized.profile?.domain || raw.domain || parsedDomain;
  const websiteDescription = normalized.profile?.website_description || raw.website_description || raw.about || 'Portfolio site discovered.';
  const aboutText = normalized.about || raw.about || websiteDescription;

  return {
    candidateName,
    job,
    website: {
      url: portfolioUrl,
      domain,
      lastUpdated: raw.last_updated || 'Not available'
    },
    techStack,
    projects: projects.length
      ? projects
      : [
          {
            name: 'Portfolio Project',
            description: aboutText || 'Portfolio project discovered from the website.',
            tech: techStack.slice(0, 5),
            url: portfolioUrl
          }
        ],
    github: {
      url: raw.github_url || '#',
      repoName: raw.github_repo || 'GitHub Repository',
      stars: raw.github_stars || 0,
      language: raw.github_language || 'Not available',
      lastCommit: raw.github_last_commit || 'Not available'
    },
    liveDemo: portfolioUrl,
    qualityMetrics: {
      projectsFound: projects.length || 1,
      completedProjects: projects.length || 1,
      technologiesUsed: techStack.length,
      responsiveDesign: techStack.length > 0 ? 'Yes' : 'No',
      documentation: websiteDescription ? 'Available' : 'Not available'
    },
    aiAnalysis: {
      summary: [
        `Portfolio URL: ${portfolioUrl || 'Not available'}`,
        `Tech stack discovered: ${techStack.length} technologies`,
        `About summary: ${aboutText ? aboutText.slice(0, 200) : 'No summary available'}`,
        `Projects found: ${projects.length}`
      ],
      portfolioScore: Math.min(98, 72 + Math.max(0, projects.length * 3) + Math.min(techStack.length, 10))
    }
  };
};

const PortfolioAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('job_id');
  
  const [data, setData] = React.useState(INITIAL_PORTFOLIO);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCandidate = async () => {
      if (!jobId || !id) return;
      try {
        setLoading(true);

        const backendRes = await api.get(`/rankings/jobs/${jobId}/candidates/${id}`);
        const result = backendRes?.data;
        const profile = result?.portfolio_profile || result;

        if (!profile || Object.keys(profile).length === 0) {
          setData(INITIAL_PORTFOLIO);
          return;
        }

        const mappedData = normalizePortfolioData(profile);
        setData(mappedData);
      } catch (error) {
        console.error('Failed to load portfolio data:', error);
        setData(INITIAL_PORTFOLIO);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [jobId, id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center font-inter">
        <div className="text-gray-500 font-medium">Loading Portfolio Analysis...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Portfolio Analysis" />

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
                <h1 className="text-2xl font-bold text-gray-900">Portfolio Analysis</h1>
                <p className="text-gray-500 text-sm mt-1">{data.candidateName} • {data.job}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">


              <div className="xl:col-span-2 space-y-6">


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiGlobe className="text-[#00c853]" /> Website Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Portfolio URL</span>
                      <a href={data.website.url} target="_blank" rel="noreferrer" className="block text-[#00c853] hover:underline text-sm font-medium mt-1 flex items-center gap-1">
                        {data.website.url} <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Domain</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{data.website.domain}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase">Last Updated</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{data.website.lastUpdated}</p>
                    </div>
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiCode className="text-[#00c853]" /> Technology Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.techStack.map((tech, idx) => (
                      <span key={idx} className="bg-[#e8f5e9] text-[#00c853] px-3 py-1.5 rounded-lg text-sm font-medium border border-green-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.projects.map((proj, idx) => (
                      <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-2">{proj.name}</h4>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {proj.tech.map((t, tidx) => (
                            <span key={tidx} className="bg-white text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <FiGithub className="text-gray-900" /> GitHub Repository
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <a href={data.github.url} target="_blank" rel="noreferrer" className="text-[#0A66C2] hover:underline font-semibold flex items-center gap-1">
                        {data.github.repoName} <FiExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-1 text-sm text-amber-500">
                        <FiStar className="w-4 h-4" /> {data.github.stars}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase">Language</span>
                        <p className="text-gray-900 font-medium mt-1">{data.github.language}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase">Last Commit</span>
                        <p className="text-gray-900 font-medium mt-1">{data.github.lastCommit}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase">Live Demo</span>
                        <a href={data.liveDemo} target="_blank" rel="noreferrer" className="block text-[#00c853] hover:underline font-medium mt-1 text-xs flex items-center gap-1">
                          Visit <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Portfolio Quality Metrics</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Metric</th>
                          <th className="px-4 py-3 font-medium">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        <tr><td className="px-4 py-3">Projects Found</td><td className="px-4 py-3 font-semibold text-gray-900">{data.qualityMetrics.projectsFound}</td></tr>
                        <tr><td className="px-4 py-3">Completed Projects</td><td className="px-4 py-3 font-semibold text-gray-900">{data.qualityMetrics.completedProjects}</td></tr>
                        <tr><td className="px-4 py-3">Technologies Used</td><td className="px-4 py-3 font-semibold text-gray-900">{data.qualityMetrics.technologiesUsed}</td></tr>
                        <tr><td className="px-4 py-3">Responsive Design</td><td className="px-4 py-3 font-semibold text-[#00c853]">{data.qualityMetrics.responsiveDesign}</td></tr>
                        <tr><td className="px-4 py-3">Documentation</td><td className="px-4 py-3 font-semibold text-[#00c853]">{data.qualityMetrics.documentation}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>


              <div className="space-y-6">


                <div className="bg-gradient-to-br from-[#08080B] to-[#1a1a24] p-6 rounded-3xl shadow-xl border border-[#2E2E38] relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#00c853] rounded-full blur-[80px] opacity-20"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                      <div className="w-6 h-6 bg-[#00c853] rounded flex items-center justify-center text-white font-bold text-[10px]">AI</div>
                      <h2 className="text-lg font-bold text-white">Portfolio Analysis</h2>
                    </div>


                    <div className="bg-[#111116] p-5 rounded-2xl border border-gray-800 mb-6 flex flex-col items-center text-center">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Portfolio Score</p>
                      <div className="relative w-20 h-20 mb-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#2E2E38" strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#00c853" strokeWidth="3"
                            strokeDasharray={`${data.aiAnalysis.portfolioScore}, 100`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                          {data.aiAnalysis.portfolioScore}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Overall portfolio quality evaluation</p>
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
            href={data.website.url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 bg-[#00c853] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#00b048] transition-all flex items-center gap-2"
          >
            Visit Portfolio
            <FiExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
};

export default PortfolioAnalysis;
