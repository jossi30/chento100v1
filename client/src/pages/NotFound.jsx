import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className='min-h-[70vh] flex items-center justify-center px-4 py-16 text-center'>
      <div className='max-w-md space-y-5'>
        <div className='inline-block p-4 rounded-full bg-amber-100 text-amber-600 text-3xl font-black'>
          404
        </div>
        <h1 className='text-3xl font-extrabold text-slate-900'>Page Not Found</h1>
        <p className='text-slate-600 text-sm leading-relaxed'>
          The listing, profile, or page you are looking for may have been moved, archived, or is no longer available.
        </p>

        <div className='pt-2 flex flex-wrap items-center justify-center gap-3'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition shadow-sm'
          >
            <FaHome />
            <span>Go Home</span>
          </Link>
          <Link
            to='/search'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition shadow-2xs'
          >
            <FaSearch />
            <span>Browse Listings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
