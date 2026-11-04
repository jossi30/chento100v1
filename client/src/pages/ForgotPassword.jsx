import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage(`Password reset instructions have been sent to ${email}. Check your inbox or spam folder.`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please ensure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm'>
        <div className='text-center mb-6'>
          <div className='w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3'>
            <FaEnvelope className='text-xl' />
          </div>
          <h1 className='text-2xl font-extrabold text-slate-900'>Reset Password</h1>
          <p className='text-xs text-slate-500 mt-1'>
            Enter your registered email address and we will send you a link to reset your account password.
          </p>
        </div>

        {message && (
          <div className='mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 leading-relaxed'>
            <FaCheckCircle className='text-emerald-600 mt-0.5 shrink-0' />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className='mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 leading-relaxed'>
            <FaExclamationCircle className='text-rose-600 mt-0.5 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-semibold text-slate-700 mb-1'>Email Address</label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition shadow-sm disabled:opacity-50 cursor-pointer'
          >
            {loading ? 'Sending link...' : 'Send Password Reset Link'}
          </button>
        </form>

        <div className='mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500'>
          Remembered your password?{' '}
          <Link to='/sign-in' className='text-amber-600 hover:underline font-semibold'>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
