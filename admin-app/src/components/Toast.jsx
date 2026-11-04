import React, { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      id='admin-toast'
      role='status'
      aria-live='polite'
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
          : isError
          ? 'bg-rose-50 text-rose-900 border-rose-300'
          : 'bg-slate-800 text-white border-slate-700'
      }`}
    >
      <div className='shrink-0'>
        {isSuccess && (
          <svg className='w-5 h-5 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        )}
        {isError && (
          <svg className='w-5 h-5 text-rose-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        )}
        {!isSuccess && !isError && (
          <svg className='w-5 h-5 text-slate-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        )}
      </div>

      <p className='text-xs sm:text-sm font-medium pr-2'>{toast.message}</p>

      <button
        type='button'
        onClick={onClose}
        className={`ml-auto p-1 rounded-md hover:bg-black/5 transition-colors ${
          isSuccess ? 'text-emerald-700' : isError ? 'text-rose-700' : 'text-slate-300'
        }`}
        aria-label='Close notification'
      >
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
        </svg>
      </button>
    </div>
  );
}
