import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  // If user role is not authorized, redirect to their own role dashboard
  if (!role || !allowedRoles.includes(role)) {
    const roleDashboardMap = {
      admin: '/admin/dashboard',
      company: '/company/dashboard',
      candidate: '/candidate/dashboard',
    };

    const targetDashboard = roleDashboardMap[role] || '/login';
    return <Navigate to={targetDashboard} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
