import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ requireAdmin }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
        <div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !['admin', 'superadmin'].includes(user.profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
