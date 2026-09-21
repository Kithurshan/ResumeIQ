

import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData?.role || 'recruiter');

    if (userData?.recruiter_id != null) {
      localStorage.setItem('recruiterId', String(userData.recruiter_id));
    }

    if (userData?.admin_id != null) {
      localStorage.setItem('adminId', String(userData.admin_id));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    const recruiterId = localStorage.getItem('recruiterId');
    if (recruiterId) {
      fetch('http://localhost:8000/api/auth/recruiter/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiter_id: Number(recruiterId) }),
      }).catch(() => {});
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('recruiterId');
    localStorage.removeItem('adminId');
    localStorage.removeItem('recruiterRememberMe');
    localStorage.removeItem('recruiterSavedEmail');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
