import api from '../api/axios';

export const authService = {
  login: async (email, password, rememberMe = false, role = 'recruiter') => {
    const endpoint = role === 'admin' ? '/admins/login' : '/auth/recruiter/login';

    const response = await api.post(endpoint, {
      email,
      password,
      remember_me: rememberMe,
    });

    const token = response.data.data.token;
    const user = response.data.data.user;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user?.role || role);

    if (user?.recruiter_id != null) {
      localStorage.setItem('recruiterId', String(user.recruiter_id));
    }

    if (user?.admin_id != null) {
      localStorage.setItem('adminId', String(user.admin_id));
    }

    return response;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/recruiter/forgot-password', {
      email,
    });

    return response;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/recruiter/reset-password', {
      token,
      new_password: newPassword,
    });

    return response;
  },

  logout: async (recruiterId = null) => {
    try {
      if (recruiterId) {
        await api.post('/auth/recruiter/logout', { recruiter_id: recruiterId });
      }
    } catch (error) {
      console.warn('Logout request failed, but local session was still cleared.', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('recruiterId');
    localStorage.removeItem('recruiterRememberMe');
    localStorage.removeItem('recruiterSavedEmail');
  }
};
