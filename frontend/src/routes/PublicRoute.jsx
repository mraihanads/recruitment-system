import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to their role dashboard
  if (isAuthenticated && role) {
    const roleDashboardMap = {
      admin: '/admin/dashboard',
      company: '/company/dashboard',
      candidate: '/candidate/dashboard',
    };
    return <Navigate to={roleDashboardMap[role] || '/'} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;
