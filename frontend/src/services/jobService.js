import api from '../api/axios';

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

const config = () => ({
  headers: { 'X-Recruiter-ID': getRecruiterId() },
});

export const jobService = {
  list: (params = {}) => api.get('/jobs', { ...config(), params }),
  stats: () => api.get('/jobs/stats', config()),
  get: (id) => api.get(`/jobs/${id}`, config()),
  create: (job) => api.post('/jobs', job, config()),
  update: (id, job) => api.put(`/jobs/${id}`, job, config()),
  remove: (id) => api.delete(`/jobs/${id}`, config()),
};
