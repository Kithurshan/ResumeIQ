import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/resumes';

const getRecruiterId = () => {
  const storageUser = localStorage.getItem('user');
  const storedRecruiterId = localStorage.getItem('recruiterId');

  if (storageUser) {
    try {
      const parsedUser = JSON.parse(storageUser);
      const userId = parsedUser?.recruiter_id ?? parsedUser?.recruiterId;
      if (userId != null && userId !== '') return String(userId);
    } catch {
      // Ignore malformed localStorage JSON and continue to the other source.
    }
  }

  if (storedRecruiterId != null && storedRecruiterId !== '') {
    return String(storedRecruiterId);
  }

  throw new Error('No recruiter is logged in. Please sign in again.');
};

export const resumeService = {
  uploadResume: async (file, jobId, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_id", jobId);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-Recruiter-ID": getRecruiterId()
      },
      onUploadProgress,
    });
    
    return response.data;
  },

  getResumeStatus: async (resumeId) => {
    const response = await axios.get(`${API_BASE_URL}/${resumeId}/status`, {
      headers: {
        "X-Recruiter-ID": getRecruiterId()
      }
    });
    return response.data;
  },

  // Stub for bulk upload later
  bulkUpload: async (files, jobId, onUploadProgress) => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("job_id", jobId);

    const response = await axios.post(`${API_BASE_URL}/bulk-upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-Recruiter-ID": getRecruiterId()
      },
      onUploadProgress,
    });
    
    return response.data;
  },

  getDownloadUrl: (resumeId) => {
    return `${API_BASE_URL}/${resumeId}/download`;
  },

  deleteResume: async (resumeId) => {
    const response = await axios.delete(`${API_BASE_URL}/${resumeId}`, {
      headers: {
        "X-Recruiter-ID": getRecruiterId()
      }
    });
    return response.data;
  }
};
