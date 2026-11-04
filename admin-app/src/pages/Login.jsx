import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isUnderAdminPrefix = location.pathname.startsWith('/admin');
  const targetDashboard = isUnderAdminPrefix ? '/admin/dashboard' : '/dashboard';

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || targetDashboard;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location, targetDashboard]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await login(formData.email.trim(), formData.password);
      const destination = location.state?.from?.pathname || targetDashboard;
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-100'>
      <div className='w-full max-w-md'>
        {/* Header Branding */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg mb-3 shadow-sm'>
            C
          </div>
          <h1 className='text-2xl font-bold text-slate-800 tracking-tight'>
            Chento100 Admin Portal
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            Sign in with your administrative credentials
          </p>
        </div>

        {/* Card Container */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-7 sm:p-8'>
          {/* Error Banner */}
          {errorMessage && (
            <div
              id='login-error-banner'
              className='mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2.5'
            >
              <svg
                className='w-5 h-5 text-red-500 shrink-0 mt-0.5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <div>
              <label
                htmlFor='email'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'
              >
                Admin Email
              </label>
              <input
                type='email'
                id='email'
                autoComplete='email'
                placeholder='chentoadmin@gmail.com'
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
                className='w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all'
                required
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                autoComplete='current-password'
                placeholder='••••••••••••'
                value={formData.password}
                onChange={handleChange}
                disabled={submitting}
                className='w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all'
                required
              />
            </div>

            <button
              type='submit'
              id='signin-submit-btn'
              disabled={submitting}
              className='mt-2 w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm'
            >
              {submitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Admin</span>
              )}
            </button>
          </form>

          <div className='mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500'>
            Sign in with a Firebase account that has administrator access.
          </div>
        </div>
      </div>
    </div>
  );
}
