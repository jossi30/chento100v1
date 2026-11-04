import React, { useState } from 'react';
import { FaLock, FaTimes, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function ReauthModal({ isOpen, onClose, onConfirm, actionTitle, actionDescription }) {
  const { reauthenticateAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await reauthenticateAdmin(password);
      setPassword('');
      onConfirm();
    } catch (err) {
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect password. Please verify and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3'>
          <div className='flex items-center gap-2.5 text-rose-600 dark:text-rose-400'>
            <span className='p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl'>
              <FaShieldAlt className='text-base' />
            </span>
            <div>
              <h3 className='font-bold text-sm text-slate-900 dark:text-white'>Admin Re-authentication</h3>
              <p className='text-[11px] text-slate-500 dark:text-slate-400'>Security confirmation required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer'
          >
            <FaTimes />
          </button>
        </div>

        <div className='p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200'>
          <FaExclamationTriangle className='text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5' />
          <div>
            <span className='font-bold block mb-0.5'>{actionTitle || 'Destructive Action'}</span>
            <span>{actionDescription || 'You are about to perform a permanent destructive operation. Re-enter your password to proceed.'}</span>
          </div>
        </div>

        {error && (
          <div className='p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
              Confirm Administrator Password
            </label>
            <div className='relative'>
              <FaLock className='absolute left-3.5 top-3 text-slate-400 text-xs' />
              <input
                type='password'
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••••'
                className='w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-400 focus:outline-hidden text-slate-900 dark:text-white'
              />
            </div>
          </div>

          <div className='flex items-center justify-end gap-2 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5'
            >
              {loading ? 'Verifying...' : 'Authorize & Execute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
