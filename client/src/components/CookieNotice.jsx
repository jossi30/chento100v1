import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieNotice() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const hasConsent = localStorage.getItem('chento100_cookie_consent');
    if (!hasConsent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('chento100_cookie_consent', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className='fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fadeInUp'>
      <div className='flex items-start gap-3'>
        <div className='text-amber-400 text-lg mt-0.5'>🍪</div>
        <div className='flex-1 text-xs text-slate-300 leading-relaxed'>
          <p className='font-semibold text-white mb-1'>Cookie &amp; Privacy Notice</p>
          We use cookies and essential browser storage to secure authentication, remember preferences, and analyze listing traffic.
          <div className='mt-2 flex items-center gap-3'>
            <button
              onClick={handleAccept}
              className='px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer'
            >
              Got it, accept
            </button>
            <Link to='/privacy' className='text-slate-400 hover:text-white underline text-[11px]'>
              Read Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
