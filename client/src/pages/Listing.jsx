import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import {
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaUserFriends,
  FaCar,
  FaCogs,
  FaGasPump,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaCheck,
  FaShareAlt,
  FaFlag,
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowLeft,
  FaEye,
  FaEdit,
} from 'react-icons/fa';
import { getListingById, submitReport } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../constants/contact';
import { adminUrl } from '../services/adminUrl';

export default function Listing() {
  const { listingId } = useParams();
  const { t } = useLanguage();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  SwiperCore.use([Navigation, Pagination]);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchListingData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getListingById(listingId);
        if (!data) {
          if (isMounted) setError('Listing not found or has been removed.');
          return;
        }

        // Public users can only see approved listings unless owner or admin
        const isOwner = currentUser && (currentUser.uid === data.ownerId || currentUser._id === data.ownerId);
        if (data.status !== 'approved' && !isOwner && !isAdmin) {
          if (isMounted) setError('This listing is currently pending moderation and is not yet publicly visible.');
          return;
        }

        if (isMounted) setListing(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load listing details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchListingData();
    return () => {
      isMounted = false;
    };
  }, [listingId, currentUser, isAdmin]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setReporting(true);
    try {
      await submitReport(listingId, reportReason.trim(), currentUser?.uid || 'visitor');
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalOpen(false);
        setReportReason('');
      }, 2000);
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[70vh] flex flex-col items-center justify-center space-y-4'>
        <div className='w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin' />
        <p className='text-xs text-slate-500 font-medium'>{t('listing.loadingDetails')}</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4'>
        <div className='w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-2xl'>
          <FaShieldAlt />
        </div>
        <h2 className='text-xl font-bold text-slate-900'>{t('listing.unavailableTitle')}</h2>
        <p className='text-xs text-slate-600 max-w-md'>{error || t('listing.unavailableDesc')}</p>
        <Link
          to='/search'
          className='px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition'
        >
          {t('listing.browseApprovedBtn')}
        </Link>
      </div>
    );
  }

  const isGuestHouse = listing.type === 'guesthouse' || listing.category === 'guesthouse';
  const images = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
    ? listing.imageUrls
    : [isGuestHouse ? '/images/airbnb_apartment_living.jpg' : '/images/city_regular_sedan.jpg'];

  const cleanPhone = SUPPORT_WHATSAPP;
  const contactEmail = SUPPORT_EMAIL;
  const price = Number(listing.price || listing.regularPrice) || 0;
  const priceUnit = listing.priceUnit || (isGuestHouse ? 'night' : 'day');
  const currency = listing.currency || 'USD';
  const locationText = [listing.city, listing.area].filter(Boolean).join(', ') ||
    listing.address || listing.location || 'Location details on request';

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 text-slate-800 space-y-8'>
      {/* Top Navigation Row */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => navigate(-1)}
          className='inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition cursor-pointer'
        >
          <FaArrowLeft />
          <span>{t('listing.back')}</span>
        </button>

        <div className='flex items-center gap-2'>
          <button
            onClick={handleShare}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs'
          >
            <FaShareAlt className='text-slate-500' />
            <span>{copied ? t('listing.linkCopied') : t('listing.share')}</span>
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-medium transition cursor-pointer'
          >
            <FaFlag className='text-xs' />
            <span>{t('listing.report')}</span>
          </button>
        </div>
      </div>

      {/* Moderation Status Banner (if not approved) */}
      {listing.status !== 'approved' && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-center justify-between flex-wrap gap-2 ${
            listing.status === 'pending'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div>
            <span className='font-bold uppercase tracking-wider block mb-0.5'>
              Listing Status: {listing.status}
            </span>
            {listing.status === 'pending'
              ? 'This listing is pending moderation by the chento 100 team. Only you and platform administrators can see this preview.'
              : `Moderation Feedback: ${listing.rejectionReason || 'Requires revision before publishing.'}`}
          </div>
          <div className='flex items-center gap-2'>
            {(isAdmin || (currentUser && (currentUser.uid === listing.ownerId || currentUser._id === listing.ownerId))) && (
              <Link
                to={`/update-listing/${listing.id || listingId}`}
                className='px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition'
              >
                <FaEdit />
                <span>Edit Listing Info</span>
              </Link>
            )}
            {isAdmin && (
              <a
                href={adminUrl()}
                className='px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800'
              >
                Review in Admin Queue
              </a>
            )}
          </div>
        </div>
      )}

      {/* High-Resolution Swiper Gallery */}
      <div className='rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 max-h-[500px]'>
        <Swiper navigation pagination={{ clickable: true }} className='h-[340px] sm:h-[480px]'>
          {images.map((url, idx) => (
            <SwiperSlide key={idx}>
              <div className='w-full h-full relative flex items-center justify-center bg-black'>
                <img
                  src={url}
                  alt={`${listing.title} photo ${idx + 1}`}
                  className='w-full h-full object-cover sm:object-contain'
                  loading='eager'
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Content Columns */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        {/* Left Column: Details & Specs */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Header & Meta */}
          <div className='space-y-2 border-b border-slate-200 pb-5'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full uppercase tracking-wider'>
                {isGuestHouse ? t('listing.guestHouseRental') : t('listing.carLeasingChauffeur')}
              </span>
              {listing.featured && (
                <span className='px-2.5 py-1 bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full'>
                  ★ {t('listing.featured')}
                </span>
              )}
              <span className='text-xs text-slate-400 flex items-center gap-1 ml-auto'>
                <FaEye /> {listing.viewCount || 1} {t('listing.views')}
              </span>
            </div>

            <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
              {listing.title || listing.name}
            </h1>

            <div className='flex items-center gap-1.5 text-xs sm:text-sm text-slate-600'>
              <FaMapMarkerAlt className='text-amber-500 shrink-0' />
              <span>{locationText}</span>
            </div>
          </div>

          {/* Quick Specifications Pill Bar */}
          <div className='p-4 bg-slate-50 border border-slate-200/90 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center'>
            {isGuestHouse ? (
              <>
                <div className='p-2'>
                  <FaBed className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.bedroomsTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>{listing.bedrooms || 1} {t('listing.roomsUnit')}</span>
                </div>
                <div className='p-2'>
                  <FaBath className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.bathroomsTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>{listing.bathrooms || 1} {t('listing.bathsUnit')}</span>
                </div>
                <div className='p-2'>
                  <FaUserFriends className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.maxCapacityTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>{listing.maxGuests || 2} {t('listing.guestsUnit')}</span>
                </div>
                <div className='p-2'>
                  <FaClock className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.checkInOutTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>
                    {listing.checkIn || '14:00'} / {listing.checkOut || '11:00'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className='p-2'>
                  <FaCar className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.makeModelTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>
                    {listing.make || ''} {listing.model || 'Sedan'}
                  </span>
                </div>
                <div className='p-2'>
                  <FaUserFriends className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.seatsTitle')}</span>
                  <span className='text-sm font-bold text-slate-900'>{listing.seats || 4} {t('listing.passengersUnit')}</span>
                </div>
                <div className='p-2'>
                  <FaCogs className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.transmissionTitle')}</span>
                  <span className='text-sm font-bold text-slate-900 capitalize'>{listing.transmission || 'Automatic'}</span>
                </div>
                <div className='p-2'>
                  <FaShieldAlt className='text-slate-400 mx-auto text-lg mb-1' />
                  <span className='text-xs text-slate-500 block font-medium'>{t('listing.chauffeurTitle')}</span>
                  <span className='text-sm font-bold text-emerald-600'>
                    {listing.driverIncluded ? t('listing.includedStatus') : t('listing.selfDrive')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Description Section */}
          <div className='space-y-3'>
            <h2 className='text-lg font-bold text-slate-900'>{isGuestHouse ? t('listing.aboutGuestHouse') : t('listing.aboutVehicle')}</h2>
            <div className='text-sm text-slate-700 leading-relaxed whitespace-pre-line'>
              {listing.description}
            </div>
          </div>

          {/* Guest House Amenities */}
          {isGuestHouse && Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <div className='space-y-3 pt-4 border-t border-slate-200'>
              <h2 className='text-lg font-bold text-slate-900'>{t('listing.includedAmenities')}</h2>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5'>
                {listing.amenities.map((amenity, i) => (
                  <div key={i} className='flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-800 border border-slate-200/60'>
                    <FaCheck className='text-emerald-500 text-xs shrink-0' />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules or Lease Guidelines */}
          {isGuestHouse && listing.houseRules && (
            <div className='space-y-2 pt-4 border-t border-slate-200'>
              <h2 className='text-lg font-bold text-slate-900'>{t('listing.houseRules')}</h2>
              <p className='text-xs sm:text-sm text-slate-600 leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60'>
                {listing.houseRules}
              </p>
            </div>
          )}

          {/* Car Lease Specifications */}
          {!isGuestHouse && (
            <div className='space-y-3 pt-4 border-t border-slate-200'>
              <h2 className='text-lg font-bold text-slate-900'>{t('listing.leasingTerms')}</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200'>
                  <span className='text-slate-400 block'>{t('listing.mileageAllowance')}</span>
                  <span className='font-bold text-slate-800'>{listing.mileageLimit || '200 km / day'}</span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200'>
                  <span className='text-slate-400 block'>{t('listing.securityDeposit')}</span>
                  <span className='font-bold text-slate-800'>
                    {listing.deposit ? `$${listing.deposit}` : t('listing.noDepositRequired')}
                  </span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200'>
                  <span className='text-slate-400 block'>{t('listing.minLeaseTerm')}</span>
                  <span className='font-bold text-slate-800'>{listing.minLeaseTerm || '1 day'}</span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200'>
                  <span className='text-slate-400 block'>{t('listing.fuelType')}</span>
                  <span className='font-bold text-slate-800'>{listing.fuel || 'Petrol'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Rate Card & Direct Contact Actions */}
        <div className='space-y-6 lg:sticky lg:top-24'>
          <div className='bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5'>
            {/* Owner / Admin Management Quick Bar */}
            {(isAdmin || (currentUser && (currentUser.uid === listing.ownerId || currentUser._id === listing.ownerId))) && (
              <div className='p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs'>
                <div>
                  <span className='font-bold text-slate-900 block'>
                    {isAdmin ? 'Administrator' : 'Host / Owner'}
                  </span>
                  <span className='text-[10px] text-slate-500'>Manage this listing</span>
                </div>
                <Link
                  to={`/update-listing/${listing.id || listingId}`}
                  className='px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer'
                >
                  <FaEdit className='text-xs' />
                  <span>Edit Info</span>
                </Link>
              </div>
            )}

            {/* Price Header */}
            <div className='border-b border-slate-100 pb-4 space-y-2'>
              <span className='text-xs text-slate-400 font-semibold uppercase tracking-wider block'>{t('listing.rateAvailability')}</span>
              <div className='flex items-baseline gap-1 mt-1'>
                <span className='text-3xl font-black text-slate-900'>
                  {currency === 'USD' ? '$' : `${currency} `}
                  {price.toLocaleString()}
                </span>
                <span className='text-xs text-slate-500 font-medium'> / {priceUnit}</span>
              </div>

              {/* Live Availability Badge */}
              <div className='pt-1'>
                {listing.isAvailable !== false && listing.available !== false ? (
                  <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800'>
                    <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
                    <span>{t('listing.availableForBooking')}</span>
                  </div>
                ) : (
                  <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800'>
                    <span className='w-2 h-2 rounded-full bg-rose-500'></span>
                    <span>{t('listing.currentlyBooked')}</span>
                    {listing.availabilityNotes && (
                      <span className='text-[10px] text-rose-600 block mt-0.5 font-normal'>
                        ({listing.availabilityNotes})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className='space-y-2.5'>
              <span className='text-xs font-bold text-slate-700 uppercase tracking-wider block'>
                {t('footer.contactSupport')}
              </span>

              {/* WhatsApp Direct Link */}
              <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello, I saw your listing "${listing.title}" on chento 100 marketplace and would like to inquire about booking/leasing.`
                  )}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition'
                >
                  <FaWhatsapp className='text-base' />
                  <span>{t('listing.chatWhatsApp')}</span>
                </a>

              {/* Direct Phone Call */}
              <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className='w-full py-3 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition'
                >
                  <FaPhoneAlt className='text-xs' />
                  <span>{t('listing.callPhone')} {SUPPORT_PHONE}</span>
                </a>

              {/* Email Contact */}
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                  `Inquiry regarding ${listing.title} on chento 100`
                )}&body=${encodeURIComponent(
                  `Hello,\n\nI would like to inquire about availability and booking for "${listing.title}".\n\nListing link: ${window.location.href}`
                )}`}
                className='w-full py-3 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition border border-neutral-700 shadow-md'
              >
                <FaEnvelope className='text-xs' />
                <span>{t('listing.sendEmailInquiry')}</span>
              </a>

              {/* Share Listing Button */}
              <button
                type='button'
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: listing.title,
                      text: `Check out ${listing.title} on chento 100`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Listing link copied to clipboard!');
                  }
                }}
                className='w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition border border-neutral-700 shadow-xs cursor-pointer'
              >
                <span>{t('listing.shareListingLink')}</span>
              </button>
            </div>

            {/* Safety badge */}
            <div className='pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2'>
              <FaShieldAlt className='text-amber-500 text-base shrink-0' />
              <span>{t('listing.verificationNote')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div
          className='fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4'
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center gap-2 text-rose-600'>
              <FaFlag />
              <h3 className='font-bold text-base text-slate-900'>{t('listing.reportThisListing')}</h3>
            </div>
            <p className='text-xs text-slate-600 leading-relaxed'>
              {t('listing.reportInstructions')}
            </p>

            {reportSuccess ? (
              <div className='p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold text-center'>
                {t('listing.reportSubmitted')}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className='space-y-4'>
                <textarea
                  rows='4'
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder={t('listing.reportReasonPlaceholder')}
                  className='w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                />
                <div className='flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setReportModalOpen(false)}
                    className='px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg'
                  >
                    {t('listing.cancel')}
                  </button>
                  <button
                    type='submit'
                    disabled={reporting}
                    className='px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50'
                  >
                    {reporting ? t('listing.submitting') : t('listing.submitReport')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
