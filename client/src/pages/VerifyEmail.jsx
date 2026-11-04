import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelopeOpenText, FaCheckCircle, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

export default function VerifyEmail() {
  const { currentUser, isEmailVerified, resendVerification, refreshUserData } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleResend = async () => {
    setError(null);
    setLoading(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    if (currentUser?.reload) {
      await currentUser.reload();
    }
    await refreshUserData();
    setChecking(false);
    if (currentUser?.emailVerified) {
      navigate('/create-listing');
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center'>
        {isEmailVerified ? (
          <div className='space-y-4'>
            <div className='w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto'>
              <FaCheckCircle className='text-3xl' />
            </div>
            <h1 className='text-2xl font-extrabold text-slate-900'>Email Verified!</h1>
            <p className='text-xs text-slate-600 leading-relaxed'>
              Your email ({currentUser?.email}) is verified. You now have full permissions to publish guest houses and car leasing listings.
            </p>
            <div className='pt-2 flex flex-col gap-2'>
              <Link
                to='/create-listing'
                className='w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition shadow-sm'
              >
                Create a Listing Now
              </Link>
              <Link
                to='/profile'
                className='w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition'
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto'>
              <FaEnvelopeOpenText className='text-3xl' />
            </div>
            <h1 className='text-2xl font-extrabold text-slate-900'>Verify Your Email</h1>
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2 text-left'>
              <FaExclamationTriangle className='shrink-0 text-amber-600 text-sm' />
              <span>Email verification is required before your listing can be submitted for review.</span>
            </div>
            <p className='text-xs text-slate-600 leading-relaxed'>
              We sent a verification link to <strong className='text-slate-900'>{currentUser?.email || 'your email'}</strong>. Please click the link inside to verify your account.
            </p>

            {sent && (
              <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs'>
                A fresh verification link has been sent! Check your spam folder if it doesn&apos;t arrive in 2 minutes.
              </div>
            )}

            {error && (
              <div className='p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs'>
                {error}
              </div>
            )}

            <div className='pt-2 space-y-2'>
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className='w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer'
              >
                <FaRedo className={checking ? 'animate-spin' : ''} />
                <span>{checking ? 'Checking verification...' : "I've Verified, Continue"}</span>
              </button>

              <button
                onClick={handleResend}
                disabled={loading}
                className='w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer'
              >
                {loading ? 'Resending...' : 'Resend Verification Email'}
              </button>
            </div>

            <div className='pt-2 text-xs text-slate-500'>
              Need to change your account?{' '}
              <Link to='/sign-in' className='text-amber-600 hover:underline font-semibold'>
                Sign in with another email
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
