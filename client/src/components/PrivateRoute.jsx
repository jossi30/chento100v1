import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-sm text-gray-600'>Checking your account...</p>
      </div>
    );
  }

  return currentUser
    ? <Outlet />
    : <Navigate to='/partner' replace />;
}
