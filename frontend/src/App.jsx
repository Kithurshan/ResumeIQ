import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import RecruitmentMonitoring from './pages/admin/monitoring/RecruitmentMonitoring';
import JobDetails from './pages/admin/monitoring/JobDetails';
import ResumeDetails from './pages/admin/monitoring/ResumeDetails';
import CandidateDetailsAdmin from './pages/admin/monitoring/CandidateDetails';
import Processing from './pages/admin/ai/Processing';
import ProcessingDetails from './pages/admin/ai/Details';
import Logs from './pages/admin/activity/Logs';
import ActivityDetails from './pages/admin/activity/Details';
import Analytics from './pages/admin/reports/Analytics';
import RecruitmentDetails from './pages/admin/reports/RecruitmentDetails';
import RecruiterReportDetails from './pages/admin/reports/RecruiterDetails';
import AIDetails from './pages/admin/reports/AIDetails';
import Management from './pages/admin/ai-model/Management';
import TrainingDetails from './pages/admin/ai-model/TrainingDetails';
import System from './pages/admin/settings/System';
import AdminProfile from './pages/admin/profile/Profile';

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import RecruiterList from './pages/admin/recruiters/List';
import AddRecruiter from './pages/admin/recruiters/Add';
import RecruiterDetails from './pages/admin/recruiters/Details';
import EditRecruiter from './pages/admin/recruiters/Edit';
import RecruiterLogin from './pages/recruiter/auth/Login';
import ForgotPassword from './pages/recruiter/auth/ForgotPassword';
import ForgotPasswordSuccess from './pages/recruiter/auth/ForgotPasswordSuccess';
import ResetPassword from './pages/recruiter/auth/ResetPassword';
import ResetSuccess from './pages/recruiter/auth/ResetSuccess';
import RecruiterDashboard from './pages/recruiter/dashboard/Dashboard';
import JobList from './pages/recruiter/jobs/List';
import AddJob from './pages/recruiter/jobs/Add';
import ViewJob from './pages/recruiter/jobs/View';
import ResumeUpload from './pages/recruiter/upload/ResumeUpload';
import Rankings from './pages/recruiter/candidates/Rankings';
import CandidateDetails from './pages/recruiter/candidates/CandidateDetails';
import ShortlistedCandidates from './pages/recruiter/candidates/ShortlistedCandidates';
import LinkedInAnalysis from './pages/recruiter/analysis/LinkedInAnalysis';
import PortfolioAnalysis from './pages/recruiter/analysis/PortfolioAnalysis';
import RecruiterProfile from './pages/recruiter/profile/Profile';

const getStoredRole = () => localStorage.getItem('role');

const ProtectedRoute = ({ allowedRole, redirectTo, children }) => {
  const token = localStorage.getItem('token');
  const role = getStoredRole();

  if (!token || role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

const PublicRoute = ({ redirectTo, children }) => {
  const token = localStorage.getItem('token');
  const role = getStoredRole();

  if (token && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (token && role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  if (token && !role) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

import { UIProvider } from './context/UIContext';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            
            <Route path="/" element={<Navigate to="/recruiter/login" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            
            <Route path="/admin/login" element={<PublicRoute redirectTo="/admin/login"><AdminLogin /></PublicRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/recruiters" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><RecruiterList /></ProtectedRoute>} />
            <Route path="/admin/recruiters/new" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><AddRecruiter /></ProtectedRoute>} />
            <Route path="/admin/recruiters/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><RecruiterDetails /></ProtectedRoute>} />
            <Route path="/admin/recruiters/:id/edit" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><EditRecruiter /></ProtectedRoute>} />

            <Route path="/admin/monitoring" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><RecruitmentMonitoring /></ProtectedRoute>} />
            <Route path="/admin/monitoring/jobs/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><JobDetails /></ProtectedRoute>} />
            <Route path="/admin/monitoring/resumes/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><ResumeDetails /></ProtectedRoute>} />
            <Route path="/admin/monitoring/candidates/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><CandidateDetailsAdmin /></ProtectedRoute>} />

            <Route path="/admin/ai/processing" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><Processing /></ProtectedRoute>} />
            <Route path="/admin/ai/processing/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><ProcessingDetails /></ProtectedRoute>} />

            <Route path="/admin/activity" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><Logs /></ProtectedRoute>} />
            <Route path="/admin/activity/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><ActivityDetails /></ProtectedRoute>} />

            <Route path="/admin/ai-model" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><Management /></ProtectedRoute>} />
            <Route path="/admin/ai-model/history/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><TrainingDetails /></ProtectedRoute>} />

            <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><System /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><AdminProfile /></ProtectedRoute>} />

            <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><Analytics /></ProtectedRoute>} />
            <Route path="/admin/reports/recruitment/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><RecruitmentDetails /></ProtectedRoute>} />
            <Route path="/admin/reports/recruiter/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><RecruiterReportDetails /></ProtectedRoute>} />
            <Route path="/admin/reports/ai/:id" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login"><AIDetails /></ProtectedRoute>} />

            
            <Route path="/recruiter/login" element={<PublicRoute redirectTo="/recruiter/login"><RecruiterLogin /></PublicRoute>} />
            <Route path="/recruiter/forgot-password" element={<PublicRoute redirectTo="/recruiter/login"><ForgotPassword /></PublicRoute>} />
            <Route path="/recruiter/forgot-password-success" element={<PublicRoute redirectTo="/recruiter/login"><ForgotPasswordSuccess /></PublicRoute>} />
            <Route path="/recruiter/reset-password/:token" element={<PublicRoute redirectTo="/recruiter/login"><ResetPassword /></PublicRoute>} />
            <Route path="/recruiter/reset-success" element={<PublicRoute redirectTo="/recruiter/login"><ResetSuccess /></PublicRoute>} />

            
            <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><RecruiterDashboard /></ProtectedRoute>} />

            
            <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><JobList /></ProtectedRoute>} />
            <Route path="/recruiter/jobs/new" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><AddJob /></ProtectedRoute>} />
            <Route path="/recruiter/jobs/:id" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><ViewJob /></ProtectedRoute>} />
            <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><AddJob /></ProtectedRoute>} />

            
            <Route path="/recruiter/resumes/upload" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><ResumeUpload /></ProtectedRoute>} />

            
            <Route path="/recruiter/rankings" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><Rankings /></ProtectedRoute>} />
            <Route path="/recruiter/candidates/:id" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><CandidateDetails /></ProtectedRoute>} />
            <Route path="/recruiter/candidates/:id/linkedin" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><LinkedInAnalysis /></ProtectedRoute>} />
            <Route path="/recruiter/candidates/:id/portfolio" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><PortfolioAnalysis /></ProtectedRoute>} />
            <Route path="/recruiter/shortlisted" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><ShortlistedCandidates /></ProtectedRoute>} />

            
            <Route path="/recruiter/profile" element={<ProtectedRoute allowedRole="recruiter" redirectTo="/recruiter/login"><RecruiterProfile /></ProtectedRoute>} />

            
            <Route path="*" element={<Navigate to="/recruiter/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
