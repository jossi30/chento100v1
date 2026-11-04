import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main requested routes */}
          <Route path='/login' element={<Login />} />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Also handle /admin prefix paths for reverse-proxy / subpath mounting */}
          <Route path='/admin/login' element={<Login />} />
          <Route
            path='/admin/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path='/admin' element={<Navigate to='/admin/dashboard' replace />} />

          {/* Root redirect to protected dashboard (which redirects to /login if unauthenticated) */}
          <Route path='/' element={<Navigate to='/dashboard' replace />} />
          <Route path='*' element={<Navigate to='/dashboard' replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
