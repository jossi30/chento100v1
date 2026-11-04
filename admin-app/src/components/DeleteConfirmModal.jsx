import React from 'react';

export default function DeleteConfirmModal({ isOpen, listing, onClose, onConfirm, loading }) {
  if (!isOpen || !listing) return null;

  const title = listing.title || listing.name || 'Untitled Listing';
  const isCar = listing.category === 'car' || listing.category === 'car_service' || listing.type === 'sale';
  const price = listing.regularPrice || listing.price || 0;
  const thumb =
    listing.imageUrls && listing.imageUrls[0]
      ? listing.imageUrls[0]
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80';

  return (
    <div
      id='delete-listing-modal'
      className='fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto'>
          <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
            />
          </svg>
        </div>

        <h3 className='text-lg font-bold text-slate-900 text-center mb-1'>Delete Listing?</h3>
        <p className='text-xs text-slate-500 text-center mb-4'>
          Are you sure you want to permanently delete this listing from the Chento100 directory? This action cannot be undone.
        </p>

        {/* Listing preview pill */}
        <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-6'>
          <img src={thumb} alt={title} className='w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0' />
          <div className='min-w-0 flex-1 text-left'>
            <h4 className='text-xs font-bold text-slate-800 truncate'>{title}</h4>
            <div className='flex items-center gap-2 mt-0.5'>
              <span className='text-[10px] font-semibold text-slate-500 uppercase'>
                {isCar ? 'Car & Driver' : 'Guest House'}
              </span>
              <span className='text-[10px] text-slate-400'>•</span>
              <span className='text-[11px] font-bold text-slate-900'>
                ${price} {isCar ? '/day' : '/night'}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={loading}
            className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50'
          >
            {loading ? (
              <div className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : null}
            <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
