import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminUrl } from '../services/adminUrl';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHome,
  FaCar,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaSignOutAlt,
  FaCamera,
  FaShieldAlt,
  FaClock,
  FaSuitcaseRolling,
  FaCalendarCheck,
  FaCreditCard,
  FaBan,
  FaReceipt,
  FaPrint,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaCheck,
  FaCopy,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserListings, deleteListing } from '../services/listingService';
import { compressImage } from '../utils/imageCompressor';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';

// Initial realistic Kampala customer activities (Booked, Paid, Cancelled)
const INITIAL_ACTIVITIES = [
  {
    id: 'act_001',
    bookingRef: 'UG-KLA-7842',
    title: 'Toyota Land Cruiser Prado 4WD with Professional Driver',
    type: 'car',
    categoryLabel: 'Chauffeured 4x4 SUV',
    image: '/images/kampala_prado_suv.jpg',
    location: 'Entebbe Airport Arrivals to Makindye Division, Kampala',
    dates: 'Nov 4, 2026 – Nov 7, 2026',
    duration: '3 Days',
    price: 375,
    currency: 'USD',
    status: 'booked', // 'booked' | 'paid' | 'cancelled'
    paymentStatus: 'Pending Arrival',
    paymentMethod: 'Cash on Pickup / Card',
    hostName: 'David Chen',
    hostContact: '+1 415-555-0188',
    whatsapp: '14155550188',
    notes: 'Driver will meet you in the Entebbe arrival hall holding a Chento 100 name board.',
    createdAt: '2026-10-28T10:15:00.000Z',
  },
  {
    id: 'act_002',
    bookingRef: 'UG-KLA-9104',
    title: 'Modern Studio Apartment Airbnb Tank Hill',
    type: 'guesthouse',
    categoryLabel: 'Boutique Apartment',
    image: '/images/kampala_apartment_living.jpg',
    location: 'Tank Hill Road, Muyenga, Makindye Division, Kampala',
    dates: 'Nov 10, 2026 – Nov 14, 2026',
    duration: '4 Nights',
    price: 380,
    currency: 'USD',
    status: 'booked',
    paymentStatus: 'Guaranteed with Card',
    paymentMethod: 'Credit Card (Pay at Check-in)',
    hostName: 'Elena Rostova',
    hostContact: '+1 305-555-8821',
    whatsapp: '13055558821',
    notes: 'Smart lock keypad code will be shared on the morning of check-in.',
    createdAt: '2026-10-29T14:20:00.000Z',
  },
  {
    id: 'act_003',
    bookingRef: 'UG-KLA-6291',
    title: 'Toyota Corolla Modern City Sedan with Private Driver',
    type: 'car',
    categoryLabel: 'City Chauffeur Ride',
    image: '/images/kampala_city_sedan.jpg',
    location: 'Makindye Hill to Nakasero Business District, Kampala',
    dates: 'Oct 20, 2026 – Oct 22, 2026',
    duration: '2 Days',
    price: 130,
    currency: 'USD',
    status: 'paid',
    paymentStatus: 'Paid in Full',
    paymentMethod: 'Visa ending in 4242',
    receiptNumber: 'REC-2026-98124',
    paidAt: 'Oct 20, 2026',
    hostName: 'Marcus Vance',
    hostContact: '+1 305-555-0199',
    whatsapp: '13055550199',
    notes: 'Payment confirmed. Official digital receipt generated.',
    createdAt: '2026-10-18T09:00:00.000Z',
  },
  {
    id: 'act_004',
    bookingRef: 'UG-KLA-5510',
    title: 'Cozy 2-Bedroom Urban Loft Airbnb with Balcony',
    type: 'guesthouse',
    categoryLabel: 'Urban Loft Stay',
    image: '/images/kampala_guest_house.jpg',
    location: 'Ggaba Road, Kansanga, Makindye Division, Kampala',
    dates: 'Oct 12, 2026 – Oct 15, 2026',
    duration: '3 Nights',
    price: 417,
    currency: 'USD',
    status: 'paid',
    paymentStatus: 'Paid in Full',
    paymentMethod: 'Mastercard ending in 1088',
    receiptNumber: 'REC-2026-87421',
    paidAt: 'Oct 12, 2026',
    hostName: 'Amara Diop',
    hostContact: '+1 718-555-3342',
    whatsapp: '17185553342',
    notes: 'Completed stay. Verified by Chento 100 guest concierge.',
    createdAt: '2026-10-10T16:45:00.000Z',
  },
  {
    id: 'act_005',
    bookingRef: 'UG-KLA-4402',
    title: 'Mercedes-Benz E-Class Executive Chauffeur Service',
    type: 'car',
    categoryLabel: 'VIP Chauffeur Ride',
    image: '/images/kampala_prado_suv.jpg',
    location: 'Munyonyo Waterfront Drive, Makindye Division, Kampala',
    dates: 'Sep 28, 2026',
    duration: '1 Day',
    price: 145,
    currency: 'USD',
    status: 'cancelled',
    paymentStatus: 'Refunded / Voided',
    paymentMethod: 'Credit Card',
    cancelledAt: 'Sep 25, 2026',
    cancellationReason: 'Trip itinerary adjusted by guest. Full cancellation with zero platform fee.',
    hostName: 'James Wilson',
    hostContact: '+1 718-555-0142',
    whatsapp: '17185550142',
    notes: 'Reservation cancelled upon customer request.',
    createdAt: '2026-09-22T11:30:00.000Z',
  },
];

export default function Profile() {
  const { t } = useLanguage();
  const {
    currentUser,
    userProfile,
    isEmailVerified,
    isAdmin,
    updateUser,
    logOut,
    resendVerification,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active section tab: 'activity' | 'listings' | 'settings'
  const searchParams = new URLSearchParams(location.search);
  const initialTab =
    searchParams.get('tab') ||
    (location.pathname === '/dashboard' ? 'activity' : currentUser?.role === 'host' ? 'listings' : 'activity');

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL if path changes
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setActiveTab('activity');
    }
  }, [location.pathname]);

  // Customer Activity State
  const storageKey = `chento100_customer_activities_${currentUser?.uid || 'guest'}`;
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read cached activities:', e);
    }
    return INITIAL_ACTIVITIES;
  });

  // Save activities to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(activities));
    } catch (e) {
      console.warn('Could not save activities:', e);
    }
  }, [activities, storageKey]);

  // Activity filter: 'all' | 'booked' | 'paid' | 'cancelled'
  const [activityFilter, setActivityFilter] = useState('all');

  // Selected voucher/receipt modal
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Cancel booking modal
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Listings State
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Email Verification State
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const fileInputRef = useRef(null);

  // Sync profile data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(userProfile?.displayName || currentUser.displayName || '');
      setPhone(userProfile?.phone || '');
      setAvatarUrl(currentUser.photoURL || userProfile?.avatar || '');
    }
  }, [currentUser, userProfile]);

  // Load user listings
  useEffect(() => {
    let isMounted = true;
    async function fetchUserListings() {
      if (!currentUser?.uid) return;
      setLoadingListings(true);
      try {
        const userDocs = await getUserListings(currentUser.uid);
        if (isMounted) setListings(userDocs || []);
      } catch (err) {
        console.warn('Failed to load user listings:', err.message);
      } finally {
        if (isMounted) setLoadingListings(false);
      }
    }

    fetchUserListings();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Cancel an active booking
  const handleConfirmCancel = (activityId) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            status: 'cancelled',
            paymentStatus: 'Voided / Cancelled',
            cancelledAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            cancellationReason: 'Cancelled by customer via activity dashboard.',
          };
        }
        return act;
      })
    );
    setCancelTargetId(null);
    setActionNotice('Reservation has been cancelled. Confirmation sent to your email.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError(null);

    try {
      const optimizedDataUrl = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      });

      const storage = getStorage(app);
      const fileName = `${Date.now()}_avatar.jpg`;
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        null,
        (err) => {
          console.warn('Storage upload fallback:', err);
          setAvatarUrl(optimizedDataUrl);
          setUploadingAvatar(false);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setAvatarUrl(downloadUrl);
            await updateUser({ avatar: downloadUrl });
          } catch {
            setAvatarUrl(optimizedDataUrl);
          } finally {
            setUploadingAvatar(false);
          }
        }
      );
    } catch (err) {
      setProfileError('Failed to process avatar image: ' + err.message);
      setUploadingAvatar(false);
    }
  };

  // Profile save handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await updateUser({
        displayName: displayName.trim(),
        phone: phone.trim(),
        avatar: avatarUrl,
      });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Resend email verification
  const handleResendVerification = async () => {
    setSendingVerification(true);
    setVerificationNotice(null);
    try {
      await resendVerification();
      setVerificationNotice('Verification email sent! Check your inbox and spam folder.');
    } catch (err) {
      setVerificationNotice(err.message || 'Failed to send verification email. Try again later.');
    } finally {
      setSendingVerification(false);
    }
  };

  // Delete listing handler
  const handleDeleteListing = async (listingId) => {
    setDeleting(true);
    setProfileError(null);
    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId && l._id !== listingId));
      setDeleteConfirmId(null);
      setProfileSuccess('Listing removed successfully!');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err) {
      setProfileError('Failed to delete listing: ' + (err.message || 'Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Activity counts
  const bookedCount = activities.filter((a) => a.status === 'booked').length;
  const paidCount = activities.filter((a) => a.status === 'paid').length;
  const cancelledCount = activities.filter((a) => a.status === 'cancelled').length;

  // Filtered activities
  const filteredActivities = activities.filter((a) => {
    if (activityFilter === 'all') return true;
    return a.status === activityFilter;
  });

  // Listings counts
  const pendingCount = listings.filter((l) => l.status === 'pending').length;
  const approvedCount = listings.filter((l) => l.status === 'approved').length;
  const rejectedCount = listings.filter((l) => l.status === 'rejected').length;

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 space-y-8 text-slate-800'>
      {/* Header Profile Summary Card */}
      <div className='bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6'>
        <div className='flex items-center gap-5'>
          <div className='relative group'>
            <img
              src={
                avatarUrl ||
                'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
              }
              alt='Profile Avatar'
              className='w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-200 shadow-inner'
            />
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              title='Change Avatar'
              className='absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition shadow-md cursor-pointer'
            >
              <FaCamera className='text-xs' />
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleAvatarChange}
              className='hidden'
            />
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-xl sm:text-2xl font-black text-slate-900'>
                {displayName || currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </h1>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950'>
                Customer Account
              </span>
              {isAdmin && (
                <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-amber-300'>
                  Admin
                </span>
              )}
            </div>

            <p className='text-xs text-slate-500 flex items-center gap-1.5'>
              <FaEnvelope className='text-slate-400' />
              <span>{currentUser?.email}</span>
            </p>

            {/* Verification Status Badge */}
            <div className='pt-1'>
              {isEmailVerified ? (
                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800'>
                  <FaCheckCircle className='text-emerald-600 text-xs' />
                  <span>Verified Member</span>
                </span>
              ) : (
                <div className='inline-flex items-center gap-2 flex-wrap'>
                  <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800'>
                    <FaExclamationTriangle className='text-amber-600 text-xs' />
                    <span>Email Unverified</span>
                  </span>
                  <button
                    type='button'
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                    className='text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer'
                  >
                    {sendingVerification ? 'Sending...' : 'Send Verification Link'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2.5 flex-wrap'>
          <Link
            to='/search'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm cursor-pointer'
          >
            <FaSearch className='text-xs' />
            <span>Book a Stay or Ride</span>
          </Link>

          <Link
            to='/create-listing'
            className='inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer border border-slate-200'
          >
            <FaPlus className='text-xs' />
            <span>List Property / Car</span>
          </Link>

          {isAdmin && (
            <a
              href={adminUrl()}
              className='inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs sm:text-sm transition shadow-sm'
            >
              <FaShieldAlt />
              <span>Admin App</span>
            </a>
          )}

          <button
            type='button'
            onClick={handleSignOut}
            className='inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer'
          >
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className='p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fadeIn'>
          <span>{actionNotice}</span>
          <button
            type='button'
            onClick={() => setActionNotice(null)}
            className='text-emerald-700 hover:text-emerald-950'
          >
            <FaTimes />
          </button>
        </div>
      )}

      {verificationNotice && (
        <div className='p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs font-medium'>
          {verificationNotice}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className='flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto'>
        <button
          type='button'
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FaSuitcaseRolling className={activeTab === 'activity' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Customer Activity ({activities.length})</span>
          {bookedCount > 0 && (
            <span className='px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-white'>
              {bookedCount} active
            </span>
          )}
        </button>

        <button
          type='button'
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'listings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FaHome className={activeTab === 'listings' ? 'text-amber-400' : 'text-slate-400'} />
          <span>My Listings ({listings.length})</span>
        </button>

        <button
          type='button'
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FaUser className={activeTab === 'settings' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CUSTOMER ACTIVITY DASHBOARD (Booked, Paid, Cancelled) */}
      {/* ======================================================== */}
      {activeTab === 'activity' && (
        <div className='space-y-6'>
          {/* Sub-Filter Bar */}
          <div className='flex items-center justify-between flex-wrap gap-3 pt-2'>
            <div className='flex items-center gap-1.5 bg-slate-100 p-1 rounded-full'>
              <button
                type='button'
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  activityFilter === 'all' ? 'bg-black text-white shadow-xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                type='button'
                onClick={() => setActivityFilter('booked')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activityFilter === 'booked' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                <span>Booked</span>
                <span className='text-[10px] bg-white/20 px-1.5 rounded-full'>{bookedCount}</span>
              </button>
              <button
                type='button'
                onClick={() => setActivityFilter('paid')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activityFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                <span>Paid</span>
                <span className='text-[10px] bg-white/20 px-1.5 rounded-full'>{paidCount}</span>
              </button>
              <button
                type='button'
                onClick={() => setActivityFilter('cancelled')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activityFilter === 'cancelled' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-black'
                }`}
              >
                <span>Cancelled</span>
                <span className='text-[10px] bg-white/20 px-1.5 rounded-full'>{cancelledCount}</span>
              </button>
            </div>

            <Link
              to='/search'
              className='text-xs font-bold text-slate-800 hover:text-black flex items-center gap-1'
            >
              <span>Explore more in Kampala</span>
              <FaArrowRight className='text-[10px]' />
            </Link>
          </div>

          {/* Activities List */}
          {filteredActivities.length === 0 ? (
            <div className='p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-4'>
              <div className='w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto text-2xl'>
                <FaSuitcaseRolling />
              </div>
              <h3 className='text-lg font-bold text-slate-900'>No activities found in this filter</h3>
              <p className='text-xs text-slate-500 max-w-md mx-auto leading-relaxed'>
                Browse boutique apartments, hilltop villas, and chauffeured vehicles in Kampala to start planning your next journey.
              </p>
              <Link
                to='/search'
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition shadow-sm'
              >
                <FaSearch className='text-xs' />
                <span>Search Stays &amp; Chauffeur Rides</span>
              </Link>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredActivities.map((act) => {
                const isBooked = act.status === 'booked';
                const isPaid = act.status === 'paid';
                const isCancelled = act.status === 'cancelled';

                return (
                  <div
                    key={act.id}
                    className={`bg-white rounded-2xl border transition overflow-hidden shadow-2xs hover:shadow-md ${
                      isBooked
                        ? 'border-blue-200'
                        : isPaid
                        ? 'border-emerald-200'
                        : 'border-slate-200 opacity-90'
                    }`}
                  >
                    <div className='p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between'>
                      {/* Left thumbnail & basic info */}
                      <div className='flex items-start sm:items-center gap-4 min-w-0 flex-1'>
                        <div className='relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200'>
                          <img
                            src={act.image}
                            alt={act.title}
                            className='w-full h-full object-cover'
                          />
                          <span className='absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/80 text-white backdrop-blur-xs'>
                            {act.type === 'guesthouse' ? 'Stay' : 'Ride'}
                          </span>
                        </div>

                        <div className='space-y-1.5 min-w-0 flex-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            {/* Status Badges */}
                            {isBooked && (
                              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200'>
                                <FaCalendarCheck className='text-[10px]' />
                                <span>Booked (Upcoming)</span>
                              </span>
                            )}
                            {isPaid && (
                              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200'>
                                <FaCheckCircle className='text-[10px]' />
                                <span>Paid &amp; Confirmed</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200'>
                                <FaBan className='text-[10px]' />
                                <span>Cancelled</span>
                              </span>
                            )}

                            <span className='text-xs font-mono text-slate-400 font-semibold'>
                              #{act.bookingRef}
                            </span>
                          </div>

                          <h3 className='text-base font-bold text-slate-900 leading-snug line-clamp-1'>
                            {act.title}
                          </h3>

                          <p className='text-xs text-slate-500 flex items-center gap-1.5 line-clamp-1'>
                            <FaMapMarkerAlt className='text-rose-500 shrink-0 text-xs' />
                            <span>{act.location}</span>
                          </p>

                          <div className='flex items-center gap-3 text-xs text-slate-600 pt-0.5 flex-wrap'>
                            <span className='flex items-center gap-1'>
                              <FaClock className='text-slate-400' />
                              <span>{act.dates}</span>
                            </span>
                            <span>•</span>
                            <span className='font-semibold'>{act.duration}</span>
                            <span>•</span>
                            <span className='text-slate-500'>
                              {act.type === 'guesthouse' ? 'Host:' : 'Driver:'}{' '}
                              <strong className='text-slate-800'>{act.hostName}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Price & Actions */}
                      <div className='w-full md:w-auto md:text-right flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100'>
                        <div>
                          <div className='flex items-baseline md:justify-end gap-1'>
                            <span className='text-xs text-slate-400 font-medium'>Total:</span>
                            <span className='text-xl sm:text-2xl font-black text-slate-900'>
                              ${act.price}
                            </span>
                            <span className='text-xs text-slate-500'>{act.currency}</span>
                          </div>
                          <p className='text-[11px] text-slate-500 mt-0.5'>
                            {act.paymentMethod}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className='flex items-center gap-2 flex-wrap'>
                          <button
                            type='button'
                            onClick={() => setSelectedVoucher(act)}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer'
                          >
                            <FaReceipt className='text-xs text-amber-500' />
                            <span>Receipt / Voucher</span>
                          </button>

                          {act.whatsapp && (
                            <a
                              href={`https://wa.me/${act.whatsapp}?text=${encodeURIComponent(
                                `Hello ${act.hostName}, inquiring regarding my Chento 100 booking #${act.bookingRef} for "${act.title}".`
                              )}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs'
                              title='Chat on WhatsApp'
                            >
                              <FaWhatsapp className='text-xs' />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {isBooked && (
                            <button
                              type='button'
                              onClick={() => setCancelTargetId(act.id)}
                              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer'
                            >
                              <FaBan className='text-xs' />
                              <span>Cancel</span>
                            </button>
                          )}

                          {isCancelled && (
                            <Link
                              to='/search'
                              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-2xs'
                            >
                              <span>Re-Book</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer note if cancelled or special instruction */}
                    {isCancelled && act.cancellationReason && (
                      <div className='px-6 py-2.5 bg-rose-50/70 border-t border-rose-100 text-[11px] text-rose-800 flex items-center justify-between'>
                        <span>
                          <strong>Cancellation Note:</strong> {act.cancellationReason}
                        </span>
                        {act.cancelledAt && <span>Cancelled on {act.cancelledAt}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: MY LISTINGS (Host management) */}
      {/* ======================================================== */}
      {activeTab === 'listings' && (
        <div className='space-y-6'>
          {/* Status Metrics Bar */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div className='p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs'>
              <p className='text-xs font-semibold text-slate-500'>Total Listings</p>
              <p className='text-2xl font-black text-slate-900 mt-1'>{listings.length}</p>
            </div>
            <div className='p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs'>
              <p className='text-xs font-semibold text-amber-700'>Pending Approval</p>
              <p className='text-2xl font-black text-amber-900 mt-1'>{pendingCount}</p>
            </div>
            <div className='p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs'>
              <p className='text-xs font-semibold text-emerald-700'>Approved &amp; Live</p>
              <p className='text-2xl font-black text-emerald-900 mt-1'>{approvedCount}</p>
            </div>
            <div className='p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs'>
              <p className='text-xs font-semibold text-rose-700'>Needs Revision</p>
              <p className='text-2xl font-black text-rose-900 mt-1'>{rejectedCount}</p>
            </div>
          </div>

          {loadingListings ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[1, 2].map((n) => (
                <div key={n} className='h-48 bg-slate-100 rounded-2xl animate-pulse' />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className='p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-4'>
              <div className='w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto text-2xl'>
                <FaHome />
              </div>
              <h3 className='text-lg font-bold text-slate-900'>No listings posted yet</h3>
              <p className='text-xs text-slate-500 max-w-md mx-auto leading-relaxed'>
                Publish your boutique guest house, serviced apartment, or chauffeur vehicle to reach visitors.
              </p>
              <Link
                to='/create-listing'
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm'
              >
                <FaPlus />
                <span>Post Your First Listing</span>
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {listings.map((item) => {
                const isGuestHouse = item.type === 'guesthouse';
                const coverImage =
                  Array.isArray(item.images) && item.images.length > 0
                    ? item.images[0]
                    : Array.isArray(item.imageUrls) && item.imageUrls.length > 0
                    ? item.imageUrls[0]
                    : isGuestHouse
                    ? '/images/kampala_apartment_living.jpg'
                    : '/images/kampala_city_sedan.jpg';

                return (
                  <div
                    key={item.id}
                    className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between'
                  >
                    <div>
                      {/* Top Media Bar */}
                      <div className='relative h-44 bg-slate-900 overflow-hidden'>
                        <img
                          src={coverImage}
                          alt={item.title}
                          className='w-full h-full object-cover'
                        />
                        <div className='absolute top-3 left-3 flex items-center gap-2'>
                          <span className='px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-xs'>
                            {isGuestHouse ? 'Guest House' : 'Car Leasing'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className='absolute top-3 right-3'>
                          {item.status === 'approved' && (
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm'>
                              <FaCheckCircle className='text-xs' />
                              <span>Live on Marketplace</span>
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-sm'>
                              <FaClock className='text-xs' />
                              <span>Pending Moderation</span>
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-sm'>
                              <FaExclamationTriangle className='text-xs' />
                              <span>Needs Revision</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className='p-5 space-y-2.5'>
                        <h4 className='font-bold text-slate-900 text-base line-clamp-1'>
                          {item.title}
                        </h4>

                        <p className='text-xs text-slate-500 line-clamp-1'>
                          {item.location || item.address}
                        </p>

                        <div className='text-sm font-black text-slate-900'>
                          ${item.price}{' '}
                          <span className='text-xs font-normal text-slate-500'>
                            / {item.priceUnit || (isGuestHouse ? 'night' : 'day')}
                          </span>
                        </div>

                        {item.status === 'rejected' && item.rejectionReason && (
                          <div className='p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed'>
                            <span className='font-bold block'>Moderator Feedback:</span>
                            {item.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bottom Bar */}
                    <div className='px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2'>
                      <Link
                        to={`/listing/${item.id}`}
                        className='inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition py-1'
                      >
                        <FaEye className='text-xs' />
                        <span>Preview</span>
                      </Link>

                      <div className='flex items-center gap-2'>
                        <Link
                          to={`/update-listing/${item.id}`}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-2xs'
                        >
                          <FaEdit className='text-xs' />
                          <span>Edit</span>
                        </Link>

                        <button
                          type='button'
                          onClick={() => setDeleteConfirmId(item.id)}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer'
                        >
                          <FaTrashAlt className='text-xs' />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: PROFILE SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className='max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6'>
          <div>
            <h3 className='text-lg font-bold text-slate-900'>Customer &amp; Host Account Settings</h3>
            <p className='text-xs text-slate-500 mt-1'>
              Update your contact name and telephone for bookings and communications.
            </p>
          </div>

          {profileSuccess && (
            <div className='p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold'>
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className='p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold'>
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className='space-y-4'>
            <div>
              <label className='block text-xs font-bold text-slate-700 mb-1'>Full Name / Display Name</label>
              <div className='relative'>
                <FaUser className='absolute left-3.5 top-3.5 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder='e.g. Alexander Host'
                  className='w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold text-slate-700 mb-1'>Registered Email</label>
              <div className='relative'>
                <FaEnvelope className='absolute left-3.5 top-3.5 text-slate-400 text-xs' />
                <input
                  type='email'
                  disabled
                  value={currentUser?.email || ''}
                  className='w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed'
                />
              </div>
              <p className='text-[11px] text-slate-400 mt-1'>Email cannot be changed directly.</p>
            </div>

            <div>
              <label className='block text-xs font-bold text-slate-700 mb-1'>
                Contact Phone / WhatsApp
              </label>
              <div className='relative'>
                <FaPhone className='absolute left-3.5 top-3.5 text-slate-400 text-xs' />
                <input
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='+1 305-555-1234 or +256 700 000000'
                  className='w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={savingProfile}
              className='px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm disabled:opacity-50 cursor-pointer'
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: BOOKING VOUCHER / RECEIPT MODAL */}
      {/* ======================================================== */}
      {selectedVoucher && (
        <div
          className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn'
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className='bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Voucher Header */}
            <div className='bg-slate-900 text-white p-6 relative'>
              <button
                type='button'
                onClick={() => setSelectedVoucher(null)}
                className='absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition'
              >
                <FaTimes />
              </button>
              <div className='flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1'>
                <FaReceipt />
                <span>Customer Booking Voucher &amp; Receipt</span>
              </div>
              <h3 className='text-xl font-black text-white'>
                {selectedVoucher.title}
              </h3>
              <p className='text-xs text-slate-300 mt-1 flex items-center gap-1.5'>
                <FaMapMarkerAlt className='text-rose-400' />
                <span>{selectedVoucher.location}</span>
              </p>
            </div>

            {/* Voucher Body */}
            <div className='p-6 space-y-5 text-slate-800'>
              {/* Reference & Status Bar */}
              <div className='flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200'>
                <div>
                  <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
                    Booking Reference
                  </span>
                  <div className='flex items-center gap-1.5 mt-0.5'>
                    <span className='font-mono font-black text-slate-900 text-sm'>
                      #{selectedVoucher.bookingRef}
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        navigator.clipboard.writeText(selectedVoucher.bookingRef);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className='text-slate-500 hover:text-slate-800'
                      title='Copy reference'
                    >
                      {copiedRef ? <FaCheck className='text-emerald-600 text-xs' /> : <FaCopy className='text-xs' />}
                    </button>
                  </div>
                </div>

                <div className='text-right'>
                  <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
                    Status
                  </span>
                  {selectedVoucher.status === 'booked' && (
                    <span className='inline-flex items-center gap-1 text-xs font-bold text-blue-700'>
                      <FaCalendarCheck className='text-[10px]' /> Booked (Confirmed)
                    </span>
                  )}
                  {selectedVoucher.status === 'paid' && (
                    <span className='inline-flex items-center gap-1 text-xs font-bold text-emerald-700'>
                      <FaCheckCircle className='text-[10px]' /> Paid in Full
                    </span>
                  )}
                  {selectedVoucher.status === 'cancelled' && (
                    <span className='inline-flex items-center gap-1 text-xs font-bold text-rose-700'>
                      <FaBan className='text-[10px]' /> Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Booking Details Grid */}
              <div className='grid grid-cols-2 gap-3 text-xs'>
                <div className='p-3 bg-slate-50 rounded-xl'>
                  <span className='text-slate-400 block text-[10px] uppercase font-bold'>Dates &amp; Period</span>
                  <span className='font-bold text-slate-900 block mt-0.5'>{selectedVoucher.dates}</span>
                  <span className='text-slate-500 text-[11px]'>{selectedVoucher.duration}</span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl'>
                  <span className='text-slate-400 block text-[10px] uppercase font-bold'>Customer</span>
                  <span className='font-bold text-slate-900 block mt-0.5'>
                    {currentUser?.displayName || 'Customer Guest'}
                  </span>
                  <span className='text-slate-500 text-[11px]'>{currentUser?.email}</span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl'>
                  <span className='text-slate-400 block text-[10px] uppercase font-bold'>
                    {selectedVoucher.type === 'guesthouse' ? 'Host Contact' : 'Driver Contact'}
                  </span>
                  <span className='font-bold text-slate-900 block mt-0.5'>{selectedVoucher.hostName}</span>
                  <span className='text-slate-500 font-mono text-[11px]'>{selectedVoucher.hostContact}</span>
                </div>
                <div className='p-3 bg-slate-50 rounded-xl'>
                  <span className='text-slate-400 block text-[10px] uppercase font-bold'>Payment Method</span>
                  <span className='font-bold text-slate-900 block mt-0.5'>{selectedVoucher.paymentMethod}</span>
                  <span className='text-slate-500 text-[11px]'>{selectedVoucher.paymentStatus}</span>
                </div>
              </div>

              {/* Price summary */}
              <div className='border-t border-slate-100 pt-3 flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-600'>Total Amount Due / Paid:</span>
                <span className='text-2xl font-black text-slate-900'>
                  ${selectedVoucher.price} <span className='text-xs font-normal text-slate-500'>USD</span>
                </span>
              </div>

              {selectedVoucher.notes && (
                <div className='p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900'>
                  <span className='font-bold block'>Check-in &amp; Arrival Instructions:</span>
                  {selectedVoucher.notes}
                </div>
              )}
            </div>

            {/* Voucher Footer */}
            <div className='p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3'>
              <button
                type='button'
                onClick={() => window.print()}
                className='inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer'
              >
                <FaPrint className='text-xs' />
                <span>Print Voucher</span>
              </button>

              <button
                type='button'
                onClick={() => setSelectedVoucher(null)}
                className='px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CANCEL BOOKING CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {cancelTargetId && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn'>
          <div className='bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl'>
            <div className='w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto'>
              <FaBan />
            </div>
            <div className='text-center space-y-1'>
              <h3 className='font-bold text-slate-900 text-base'>Cancel this Reservation?</h3>
              <p className='text-xs text-slate-500 leading-relaxed'>
                Are you sure you want to cancel this booking? There is zero platform cancellation penalty, and the host/driver will be notified immediately.
              </p>
            </div>
            <div className='flex items-center gap-2 pt-2'>
              <button
                type='button'
                onClick={() => setCancelTargetId(null)}
                className='flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer'
              >
                Keep Booking
              </button>
              <button
                type='button'
                onClick={() => handleConfirmCancel(cancelTargetId)}
                className='flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer'
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE LISTING CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteConfirmId && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn'>
          <div className='bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl'>
            <div className='w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto'>
              <FaTrashAlt />
            </div>
            <div className='text-center space-y-1'>
              <h3 className='font-bold text-slate-900 text-base'>Delete Listing?</h3>
              <p className='text-xs text-slate-500'>
                This will permanently remove the listing and its photos from Firestore. This action cannot be undone.
              </p>
            </div>
            <div className='flex items-center gap-2 pt-2'>
              <button
                type='button'
                onClick={() => setDeleteConfirmId(null)}
                className='flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={deleting}
                onClick={() => handleDeleteListing(deleteConfirmId)}
                className='flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50'
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
