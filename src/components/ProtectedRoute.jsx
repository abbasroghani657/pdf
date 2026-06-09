import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ requireAdmin }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
        <div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Pass current location so login can redirect back after auth
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !['admin', 'superadmin'].includes(user.profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
