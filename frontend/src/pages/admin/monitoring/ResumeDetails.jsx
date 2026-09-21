import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const INITIAL_RESUME_DATA = {
  id: '',
  candidate: '',
  file: '',
  uploadedDate: '',
  uploadedBy: '',
  job: '',
  status: '',
  fileSize: '',
  previewUrl: ''
};

// ─── Main Component ────────────────────────────────────────────────────────
const ResumeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [resume, setResume] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchResumeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/admins/resumes/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const data = result.data;
          
          let formattedSize = 'Unknown';
          if (data.file_size) {
            if (typeof data.file_size === 'string' && (data.file_size.includes('MB') || data.file_size.includes('KB'))) {
              formattedSize = data.file_size;
            } else {
              const sizeKB = Math.round(parseFloat(data.file_size) / 1024);
              if (!isNaN(sizeKB)) {
                formattedSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;
              }
            }
          }

          setResume({
            id: data.resume_id,
            candidate: data.candidate_name || 'Unknown',
            file: data.file_name || 'Resume',
            uploadedDate: data.upload_date ? new Date(data.upload_date).toLocaleDateString() : 'N/A',
            uploadedBy: data.recruiter_name || 'Unknown',
            job: data.job_title || 'N/A',
            status: data.status || 'Uploaded',
            fileSize: formattedSize,
            previewUrl: data.preview_url || ''
          });
        } else {
          setError('Resume not found.');
        }
      } catch (err) {
        setError('Failed to load resume details.');
      } finally {
        setLoading(false);
      }
    };
    fetchResumeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <p>Loading resume details...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex h-screen bg-black items-center justify-center font-inter text-[#E1E1E1]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/monitoring?tab=resumes')} className="text-[#3B82F6] hover:underline">
            Back to Resume Monitoring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Resume Monitoring" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-12 space-y-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/monitoring?tab=resumes')}
                  className="w-10 h-10 bg-[#1F1F1F] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-800"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FiFileText className="text-[#BB86FC]" />
                    {resume.file}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    ID: {id} • Uploaded on {resume.uploadedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${resume.status === 'Completed' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                    resume.status === 'Processing' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}>
                  {resume.status === 'Completed' && <FiCheckCircle />}
                  {resume.status}
                </span>

                <button 
                  onClick={() => {
                    if (resume.previewUrl) {
                      const link = document.createElement('a');
                      link.href = resume.previewUrl;
                      link.download = resume.file || 'resume.pdf';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      alert('No file available to download.');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#BB86FC] text-black rounded-lg hover:bg-[#cfa4ff] transition-colors font-bold text-sm"
                >
                  <FiDownload className="w-4 h-4" /> Download Resume
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


              <div className="lg:col-span-1 space-y-6">

                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-800 bg-[#111111]/50">
                    <h3 className="font-bold">Resume Information</h3>
                  </div>
                  <div className="p-5 divide-y divide-gray-800">
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-2"><FiUser /> Candidate Name</span>
                      <span className="text-sm font-medium text-[#E1E1E1]">{resume.candidate}</span>
                    </div>
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-2"><FiBriefcase /> Applied Job</span>
                      <span className="text-sm font-medium text-[#E1E1E1]">{resume.job}</span>
                    </div>
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-2"><FiUser /> Uploaded By (Recruiter)</span>
                      <span className="text-sm font-medium text-[#E1E1E1]">{resume.uploadedBy}</span>
                    </div>
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-2"><FiCalendar /> Upload Date</span>
                      <span className="text-sm font-medium text-[#E1E1E1]">{resume.uploadedDate}</span>
                    </div>
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-2"><FiFileText /> File Size</span>
                      <span className="text-sm font-medium text-[#E1E1E1]">{resume.fileSize}</span>
                    </div>
                  </div>
                </div>

              </div>


              <div className="lg:col-span-2">
                <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden h-[800px] flex flex-col">
                  <div className="p-4 border-b border-gray-800 bg-[#111111]/50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">Document Preview</h3>
                    <span className="text-xs text-gray-500 bg-[#111111] px-3 py-1 rounded-full border border-gray-800">
                      Read-Only View
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-900 p-2">
                    {resume.previewUrl ? (
                      <iframe
                        src={resume.previewUrl}
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
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumeDetails;
