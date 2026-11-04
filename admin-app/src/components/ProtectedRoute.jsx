import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-slate-50'>
        <div className='w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-3'></div>
        <p className='text-sm text-slate-600 font-medium'>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;
}
