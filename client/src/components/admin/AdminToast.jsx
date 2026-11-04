import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaShieldAlt } from 'react-icons/fa';

export default function AdminToast({ toast, onDismiss }) {
  if (!toast) return null;

  const { type = 'success', message, title } = toast;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  return (
    <div
      role='alert'
      aria-live='assertive'
      className={`fixed bottom-6 right-6 z-50 max-w-md w-full shadow-2xl rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-slideIn ${
        isSuccess
          ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50'
          : isError
          ? 'bg-rose-950/90 text-rose-100 border-rose-500/50'
          : isWarning
          ? 'bg-amber-950/90 text-amber-100 border-amber-500/50'
          : 'bg-slate-900/95 text-slate-100 border-slate-700'
      }`}
    >
      <div className='text-lg shrink-0 mt-0.5'>
        {isSuccess && <FaCheckCircle className='text-emerald-400' />}
        {isError && <FaExclamationCircle className='text-rose-400' />}
        {isWarning && <FaShieldAlt className='text-amber-400' />}
        {!isSuccess && !isError && !isWarning && <FaInfoCircle className='text-blue-400' />}
      </div>

      <div className='flex-1 text-xs leading-relaxed'>
        {title && <h4 className='font-bold uppercase tracking-wider text-[11px] mb-0.5'>{title}</h4>}
        <p className='font-medium'>{message}</p>
      </div>

      <button
        onClick={onDismiss}
        className='text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer'
        aria-label='Close alert'
      >
        <FaTimes className='text-xs' />
      </button>
    </div>
  );
}
