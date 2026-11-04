import React from 'react';
import { Link } from 'react-router-dom';
import { MdLocationOn, MdStar } from 'react-icons/md';
import { FaBed, FaBath, FaUserFriends, FaCar, FaGasPump, FaCogs } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

export default function ListingItem({ listing, showStatus = false, onEdit, onArchive, onDelete }) {
  const { t } = useLanguage();
  const listingId = listing?.id || listing?._id;

  const isGuestHouse =
    listing?.type === 'guesthouse' ||
    listing?.category === 'guesthouse' ||
    listing?.type === 'rent';

  const images = Array.isArray(listing?.images) && listing.images.length > 0
    ? listing.images
    : Array.isArray(listing?.imageUrls) && listing.imageUrls.length > 0
    ? listing.imageUrls
    : [];

  const coverImage = images[0] || (
    isGuestHouse
      ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
  );

  const price = Number(listing?.price || listing?.regularPrice) || 0;
  const priceUnit = listing?.priceUnit || (isGuestHouse ? 'night' : 'day');
  const currency = listing?.currency || 'USD';
  const title = listing?.title || listing?.name || 'Untitled Listing';
  const locationText = [listing?.city, listing?.area].filter(Boolean).join(', ') ||
    listing?.location || listing?.address || 'Location on request';

  const status = listing?.status || 'approved';

  return (
    <div className='group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden w-full flex flex-col'>
      {/* Thumbnail */}
      <Link to={`/listing/${listingId}`} className='relative h-52 w-full overflow-hidden bg-slate-100 block'>
        <img
          src={coverImage}
          alt={title}
          loading='lazy'
          className='h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out'
        />

        {/* Category Pill */}
        <div className='absolute top-3 left-3 flex items-center gap-1.5'>
          <span className='bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs border border-white/10'>
            {isGuestHouse ? t('listing.guestHouse') : t('listing.carLeasing')}
          </span>
          {listing?.featured && (
            <span className='bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm'>
              <MdStar className='text-xs' />
              {t('listing.featured')}
            </span>
          )}
          {listing && (listing.isAvailable === false || listing.available === false) && (
            <span className='bg-rose-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm'>
              {t('listing.booked')}
            </span>
          )}
        </div>

        {/* Status Badge (for owner dashboard) */}
        {showStatus && (
          <div className='absolute top-3 right-3'>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider backdrop-blur-md ${
                status === 'approved'
                  ? 'bg-emerald-600/90 text-white'
                  : status === 'pending'
                  ? 'bg-amber-500/95 text-slate-950 font-black'
                  : status === 'rejected'
                  ? 'bg-rose-600/90 text-white'
                  : 'bg-slate-700/90 text-slate-200'
              }`}
            >
              {status}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className='p-4 flex flex-col flex-1 gap-2'>
        <Link to={`/listing/${listingId}`}>
          <h3 className='font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors'>
            {title}
          </h3>
        </Link>

        <div className='flex items-center gap-1 text-slate-500 text-xs truncate'>
          <MdLocationOn className='text-amber-500 shrink-0 text-sm' />
          <span className='truncate'>{locationText}</span>
        </div>

        {/* Specs badges */}
        <div className='flex items-center gap-3 text-xs text-slate-600 py-1.5 border-y border-slate-100 my-1'>
          {isGuestHouse ? (
            <>
              <span className='flex items-center gap-1' title='Bedrooms'>
                <FaBed className='text-slate-400' />
                {listing?.bedrooms || 1} {t('listing.beds')}
              </span>
              <span className='flex items-center gap-1' title='Bathrooms'>
                <FaBath className='text-slate-400' />
                {listing?.bathrooms || 1} {t('listing.baths')}
              </span>
              <span className='flex items-center gap-1' title='Guests'>
                <FaUserFriends className='text-slate-400' />
                {listing?.maxGuests || 2} {t('listing.max')}
              </span>
            </>
          ) : (
            <>
              <span className='flex items-center gap-1' title='Seats'>
                <FaCar className='text-slate-400' />
                {listing?.seats || 4} {t('listing.seats')}
              </span>
              <span className='flex items-center gap-1' title='Transmission'>
                <FaCogs className='text-slate-400' />
                <span className='capitalize'>{listing?.transmission || 'Auto'}</span>
              </span>
              <span className='flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'>
                {listing?.driverIncluded ? t('listing.withDriver') : t('listing.selfDrive')}
              </span>
            </>
          )}
        </div>

        {/* Price & Action row */}
        <div className='mt-auto pt-1 flex items-center justify-between'>
          <div>
            <span className='text-lg font-extrabold text-slate-900'>
              {currency === 'USD' ? '$' : `${currency} `}
              {price.toLocaleString()}
            </span>
            <span className='text-xs text-slate-500 font-normal'> / {priceUnit}</span>
          </div>

          <Link
            to={`/listing/${listingId}`}
            className='px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs'
          >
            <span>{t('listing.view')}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Dashboard actions row */}
        {showStatus && (
          <div className='pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs'>
            {onEdit && (
              <button
                type='button'
                onClick={() => onEdit(listing)}
                className='px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold transition'
              >
                {t('listing.edit')}
              </button>
            )}
            {onArchive && status !== 'archived' && (
              <button
                type='button'
                onClick={() => onArchive(listingId)}
                className='px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded transition'
              >
                {t('listing.archive')}
              </button>
            )}
            {onDelete && (
              <button
                type='button'
                onClick={() => onDelete(listingId)}
                className='px-2.5 py-1 text-rose-600 hover:text-rose-800 rounded font-medium transition ml-auto'
              >
                {t('listing.delete')}
              </button>
            )}
          </div>
        )}

        {/* Rejection reason box if rejected */}
        {showStatus && status === 'rejected' && listing.rejectionReason && (
          <div className='mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-relaxed'>
            <span className='font-bold block'>Moderation Feedback:</span>
            {listing.rejectionReason}
          </div>
        )}
      </div>
    </div>
  );
}
