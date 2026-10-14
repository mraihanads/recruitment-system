import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PublicRoute from './PublicRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import CompanyLayout from '../layouts/CompanyLayout';
import CandidateLayout from '../layouts/CandidateLayout';

// Pages
import LandingPage from '../pages/public/LandingPage';
import JobsPage from '../pages/public/JobsPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import CompanyDashboard from '../pages/dashboard/CompanyDashboard';
import CandidateDashboard from '../pages/dashboard/CandidateDashboard';

// Admin Modules (STEP 16)
import UserManagement from '../pages/admin/UserManagement';
import CompanyVerification from '../pages/admin/CompanyVerification';
import CompanyDocuments from '../pages/admin/CompanyDocuments';
import JobModeration from '../pages/admin/JobModeration';
import JobCategories from '../pages/admin/JobCategories';
import ApplicationMonitoring from '../pages/admin/ApplicationMonitoring';
import InterviewMonitoring from '../pages/admin/InterviewMonitoring';
import AdminReports from '../pages/admin/AdminReports';
import AdminNotifications from '../pages/admin/AdminNotifications';
import CompanyProfile from '../pages/company/CompanyProfile';
import CompanyJobs from '../pages/company/CompanyJobs';
import CreateJob from '../pages/company/CreateJob';
import EditJob from '../pages/company/EditJob';
import CompanyJobDetail from '../pages/company/CompanyJobDetail';
import Applicants from '../pages/company/Applicants';
import ApplicantDetail from '../pages/company/ApplicantDetail';
import Interviews from '../pages/company/Interviews';
import InterviewDetail from '../pages/company/InterviewDetail';
import Reports from '../pages/company/Reports';
import CompanyNotifications from '../pages/company/CompanyNotifications';

// Candidate Profile Modules (STEP 14A)
import CandidateProfile from '../pages/candidate/CandidateProfile';
import CandidateEducation from '../pages/candidate/CandidateEducation';
import CandidateExperience from '../pages/candidate/CandidateExperience';
import CandidatePortfolio from '../pages/candidate/CandidatePortfolio';
import CandidateSkills from '../pages/candidate/CandidateSkills';

// Candidate Job Search & Application (STEP 14B)
import FindJobs from '../pages/candidate/FindJobs';
import JobDetail from '../pages/candidate/JobDetail';

// Candidate Applications Modules (STEP 14C)
import MyApplications from '../pages/candidate/MyApplications';
import ApplicationDetail from '../pages/candidate/ApplicationDetail';

// Candidate Saved Jobs, Interviews & Notifications (STEP 17)
import CandidateSavedJobs from '../pages/candidate/CandidateSavedJobs';
import CandidateInterviews from '../pages/candidate/CandidateInterviews';
import CandidateNotifications from '../pages/candidate/CandidateNotifications';

const AppRoutes = () => {
  return (
    <Routes>
      {/* =========================================
          PUBLIC ROUTES
          ========================================= */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs" element={<JobsPage />} />

      {/* Guest-only routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* =========================================
          ADMIN PROTECTED ROUTES & LAYOUT
          ========================================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="companies" element={<CompanyVerification />} />
        <Route path="company-documents" element={<CompanyDocuments />} />
        <Route path="jobs" element={<JobModeration />} />
        <Route path="categories" element={<JobCategories />} />
        <Route path="applications" element={<ApplicationMonitoring />} />
        <Route path="interviews" element={<InterviewMonitoring />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* =========================================
          COMPANY PROTECTED ROUTES & LAYOUT
          ========================================= */}
      <Route
        path="/company"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['company']}>
              <CompanyLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CompanyDashboard />} />
        <Route path="profile" element={<CompanyProfile />} />
        {/* Company Jobs Management (STEP 15B) */}
        <Route path="jobs" element={<CompanyJobs />} />
        <Route path="jobs/create" element={<CreateJob />} />
        <Route path="jobs/:id" element={<CompanyJobDetail />} />
        <Route path="jobs/:id/edit" element={<EditJob />} />
        {/* Company Applicants Management (STEP 15C) */}
        <Route path="applicants" element={<Applicants />} />
        <Route path="applicants/:id" element={<ApplicantDetail />} />
        {/* Route aliases */}
        <Route path="applications" element={<Navigate to="/company/applicants" replace />} />
        <Route path="applications/:id" element={<ApplicantDetail />} />
        {/* Company Interviews Management (STEP 15D) */}
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/:id" element={<InterviewDetail />} />
        {/* Company Reports & Statistics (STEP 15E) */}
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<CompanyNotifications />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* =========================================
          CANDIDATE PROTECTED ROUTES & LAYOUT
          ========================================= */}
      <Route
        path="/candidate"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['candidate']}>
              <CandidateLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CandidateDashboard />} />

        {/* Candidate Profile Modules (STEP 14A) */}
        <Route path="profile" element={<CandidateProfile />} />
        <Route path="profile/education" element={<CandidateEducation />} />
        <Route path="profile/experience" element={<CandidateExperience />} />
        <Route path="profile/portfolio" element={<CandidatePortfolio />} />
        <Route path="profile/skills" element={<CandidateSkills />} />

        {/* Sub-route aliases */}
        <Route path="education" element={<Navigate to="profile/education" replace />} />
        <Route path="experience" element={<Navigate to="profile/experience" replace />} />
        <Route path="portfolio" element={<Navigate to="profile/portfolio" replace />} />
        <Route path="skills" element={<Navigate to="profile/skills" replace />} />

        {/* Candidate Jobs & Application (STEP 14B) */}
        <Route path="jobs" element={<FindJobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />

        {/* Candidate Applications Modules (STEP 14C) */}
        <Route path="applications" element={<MyApplications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />

        {/* Candidate Saved Jobs, Interviews & Notifications */}
        <Route path="saved-jobs" element={<CandidateSavedJobs />} />
        <Route path="interviews" element={<CandidateInterviews />} />
        <Route path="notifications" element={<CandidateNotifications />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
