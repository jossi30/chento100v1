import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { currentUser: firebaseUser, isAdmin: authIsAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-900'>
        <div className='w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to='/sign-in' replace />;
  }

  return authIsAdmin ? <Outlet /> : <Navigate to='/' replace />;
}
