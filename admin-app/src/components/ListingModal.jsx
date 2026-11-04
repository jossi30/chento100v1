import React from 'react';

export default function ListingModal({
  listing,
  onClose,
  onApprove,
  onReject,
  onToggleActive,
  onDelete,
  onEdit,
  actionLoading,
  isTogglingActive,
}) {
  if (!listing) return null;

  const isCar = listing.category === 'car' || listing.type === 'sale';
  const isGuesthouse = listing.category === 'guesthouse' || listing.type === 'rent';
  const title = listing.title || listing.name || 'Untitled Listing';
  const price = listing.regularPrice || listing.price || 0;
  const isActionThis = actionLoading && actionLoading.id === listing._id;
  const status = listing.status || 'pending';
  const isActive = listing.active !== false;

  return (
    <div
      id='listing-details-modal'
      className='fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className='flex items-start justify-between border-b border-slate-100 pb-4 mb-5'>
          <div>
            <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isCar
                    ? 'bg-amber-100 text-amber-800'
                    : isGuesthouse
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isCar ? 'Chauffeur Car' : isGuesthouse ? 'Guest House' : 'Property'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                  status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {status === 'approved'
                  ? 'Approved'
                  : status === 'rejected'
                  ? 'Rejected'
                  : 'Pending Approval'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h2 className='text-xl font-bold text-slate-900'>{title}</h2>
            <p className='text-xs text-slate-500 mt-0.5 flex items-center gap-1'>
              <svg className='w-3.5 h-3.5 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              <span>{listing.location || listing.address || 'Address not specified'}</span>
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors'
            aria-label='Close details'
          >
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Gallery */}
        {listing.imageUrls && listing.imageUrls.length > 0 && (
          <div className='mb-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl overflow-hidden'>
              <img
                src={listing.imageUrls[0]}
                alt={title}
                className='w-full h-52 object-cover rounded-lg'
              />
              {listing.imageUrls[1] ? (
                <img
                  src={listing.imageUrls[1]}
                  alt={title}
                  className='w-full h-52 object-cover rounded-lg'
                />
              ) : (
                <div className='h-52 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400'>
                  Single photo provided
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specs & Pricing Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5'>
          <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
            <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
              Pricing
            </span>
            <span className='text-base font-bold text-slate-900'>
              ${price}
              <span className='text-xs font-normal text-slate-500'>
                {isCar ? '/day' : '/night'}
              </span>
            </span>
          </div>

          {isCar && (
            <>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Vehicle
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.make || ''} {listing.model || 'Sedan'}
                </span>
              </div>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Seating
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.seats || 4} Passengers
                </span>
              </div>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Chauffeur
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.driverIncluded ? 'Included' : 'None'}
                </span>
              </div>
            </>
          )}

          {isGuesthouse && (
            <>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Bedrooms
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.bedrooms || 1} Bed
                </span>
              </div>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Bathrooms
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.bathrooms || 1} Bath
                </span>
              </div>
              <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                <span className='text-[10px] uppercase font-semibold text-slate-500 block mb-0.5'>
                  Max Guests
                </span>
                <span className='text-sm font-semibold text-slate-800'>
                  {listing.maxGuests || 2} Guests
                </span>
              </div>
            </>
          )}
        </div>

        {/* Description */}
        <div className='mb-6'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-slate-600 mb-2'>
            Listing Description
          </h3>
          <p className='text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100'>
            {listing.description || 'No description provided.'}
          </p>
        </div>

        {/* Chauffeur details if present */}
        {listing.driverName && (
          <div className='mb-6 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs'>
            <span className='font-bold text-amber-900 block mb-1'>Designated Chauffeur Info:</span>
            <div className='text-amber-800'>
              Name: <span className='font-semibold'>{listing.driverName}</span>
              {listing.driverContact && (
                <span className='ml-3'>Contact: <span className='font-semibold'>{listing.driverContact}</span></span>
              )}
            </div>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className='flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap'>
          <div className='flex items-center gap-2'>
            {onToggleActive && (
              <button
                type='button'
                id={'modal-toggle-active-btn-' + listing._id}
                disabled={isTogglingActive}
                onClick={() => onToggleActive(listing._id, listing.active, title)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>
                  {isTogglingActive
                    ? 'Updating...'
                    : isActive
                    ? 'Listing Active (Click to Deactivate)'
                    : 'Listing Inactive (Click to Activate)'}
                </span>
              </button>
            )}

            {onDelete && (
              <button
                type='button'
                id={'modal-delete-btn-' + listing._id}
                onClick={() => {
                  onDelete(listing);
                  onClose();
                }}
                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors'
                title='Delete listing permanently'
              >
                <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                </svg>
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className='flex items-center gap-2.5 ml-auto'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors'
            >
              Close
            </button>

            {onEdit && (
              <button
                type='button'
                onClick={() => {
                  onEdit(listing);
                  onClose();
                }}
                className='px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs transition-colors'
              >
                Edit Info
              </button>
            )}

            {status === 'pending' && onReject && (
              <button
                type='button'
                id={'modal-reject-btn-' + listing._id}
                disabled={isActionThis}
                onClick={() => {
                  onReject(listing._id, title);
                  onClose();
                }}
                className='px-4 py-2 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50'
              >
                {isActionThis && actionLoading.action === 'reject' ? 'Rejecting...' : 'Reject Listing'}
              </button>
            )}

            {status === 'pending' && onApprove && (
              <button
                type='button'
                id={'modal-approve-btn-' + listing._id}
                disabled={isActionThis}
                onClick={() => {
                  onApprove(listing._id, title);
                  onClose();
                }}
                className='px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50'
              >
                {isActionThis && actionLoading.action === 'approve' ? 'Approving...' : 'Approve Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
