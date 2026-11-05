import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserListings, deleteListing, updateListing } from '../services/listingService';
import {
  FaHome,
  FaCar,
  FaCheckCircle,
  FaPlus,
  FaPhoneAlt,
  FaEnvelope,
  FaUser,
  FaLock,
  FaInfoCircle,
  FaSignOutAlt,
  FaCalendarAlt,
  FaTrashAlt,
  FaEdit,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaClock,
  FaClipboardList,
  FaCheck,
  FaSync,
} from 'react-icons/fa';

export default function Partner() {
  const { currentUser, userProfile, signUp, signIn, loginDemo, updateUser, logOut } = useAuth();

  const effectiveUser = useMemo(() => {
    return (
      currentUser || {
        displayName: 'Partner Host',
        email: 'partner@chento100.com',
        phone: '+291 7 888 999',
        uid: '',
        role: 'host',
        accountType: 'host',
      }
    );
  }, [currentUser]);

  // Auth Mode: 'register' | 'signin'
  const [authMode, setAuthMode] = useState('register');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Host Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPartnerType, setRegPartnerType] = useState('both'); // 'guesthouse' | 'car' | 'both'
  const [regCity] = useState('Muyenga');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dashboard Tab & Filter State
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'availability'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'guesthouse' | 'car'

  // Listings State
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch partner listings
  const loadUserListings = useCallback(async () => {
    if (!currentUser) {
      setListings([]);
      return;
    }
    const uid = currentUser.uid || currentUser.id || currentUser._id;
    if (!uid) return;

    try {
      setLoadingListings(true);
      const data = await getUserListings(uid);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch host listings:', err.message);
      // Fallback empty array
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserListings();
  }, [loadUserListings]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = listings.length;
    const available = listings.filter(
      (item) => item.active !== false && item.isActive !== false && item.status === 'approved'
    ).length;
    const views = listings.reduce((sum, item) => sum + (Number(item.views) || 12), 0);
    return { total, available, views };
  }, [listings]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    if (filterType === 'all') return listings;
    return listings.filter((item) => item.type === filterType);
  }, [listings, filterType]);

  // Handle Host Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setAuthError('Please fill in your name, email, phone number, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);
    try {
      await signUp(regEmail.trim(), regPassword, regName.trim(), regPhone.trim());
      await updateUser({
        displayName: regName.trim(),
        phone: regPhone.trim(),
        role: 'host',
        accountType: 'host',
        hostType: regPartnerType,
        city: regCity,
      });

      showToast(`Welcome ${regName.trim()}! You are now registered as a Partner Host.`);
    } catch (err) {
      console.warn('Host registration notice:', err.message);
      const isDuplicate = err.message && err.message.toLowerCase().includes('already exists');
      if (isDuplicate) {
        setLoginEmail(regEmail.trim());
        setAuthError('An account with this email address already exists. You can click "Sign In" above to log in.');
      } else {
        setAuthError(err.message || 'Failed to register. Please check your details.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Host Sign In
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      showToast('Signed in successfully! Welcome to your Partner Portal.');
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1-Click Demo Testing Sign In for Partner Host or Platform Admin
  const handleDemoLogin = async (role = 'partner') => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginDemo(role);
      showToast(
        role === 'admin'
          ? 'Signed in as Platform Administrator (Joe Patriot)! Full admin controls enabled.'
          : 'Signed in as Verified Partner Host (Alexander Vance)! Welcome back.'
      );
    } catch (err) {
      setAuthError(err.message || 'Demo sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item) => {
    const newActive = !(item.active !== false && item.isActive !== false);
    setUpdatingId(item.id);
    try {
      await updateListing(item.id, { active: newActive, isActive: newActive });
      setListings((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, active: newActive, isActive: newActive } : l))
      );
      showToast(`Listing marked as ${newActive ? 'Available' : 'Paused / Unavailable'}.`);
    } catch (err) {
      showToast(`Could not update availability: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    setDeletingId(listingId);
    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast('Listing removed successfully.');
    } catch (err) {
      showToast(`Failed to delete listing: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Sign out of partner account
  const handleSignOut = async () => {
    try {
      if (logOut) await logOut();
      showToast('Signed out of partner account.');
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  const displayName = currentUser?.displayName || effectiveUser.displayName || 'Partner Host';
  const email = currentUser?.email || effectiveUser.email;
  const phone = userProfile?.phone || effectiveUser.phone;
  const initialLetter = (displayName || email || 'P')[0].toUpperCase();

  return (
    <div className='min-h-screen bg-white text-neutral-900 pb-20'>
      {/* Toast Notification */}
      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 text-sm font-semibold flex items-center gap-3 animate-fadeInUp max-w-md'>
          <FaCheckCircle className='text-emerald-400 text-base shrink-0' />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HERO BANNER: Partner with chento 100 */}
      <section className='bg-black text-white pt-12 sm:pt-16 pb-20 sm:pb-24 px-4 sm:px-8 border-b border-neutral-900 relative overflow-hidden'>
        <div className='max-w-6xl mx-auto relative z-10'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
            <div className='lg:col-span-8 space-y-4'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]'>
                Partner with chento 100
              </h1>
              <p className='text-neutral-300 text-sm sm:text-base max-w-2xl leading-relaxed'>
                Submit your guest house, apartment, or private vehicle for admin approval before it appears on the marketplace. Once approved, manage availability and receive direct inquiries from travelers.
              </p>
            </div>

            <div className='lg:col-span-4 bg-[#141518] border border-neutral-800 p-6 sm:p-7 rounded-3xl space-y-3.5 shadow-xl'>
              <div className='text-xs font-bold uppercase tracking-wider text-neutral-400'>
                PARTNER GUARANTEES
              </div>
              <div className='space-y-3 text-xs text-neutral-200'>
                <div className='flex items-center gap-2.5'>
                  <FaCheckCircle className='text-emerald-400 shrink-0 text-sm' />
                  <span>100% Direct Guest Payments upon check-in</span>
                </div>
                <div className='flex items-center gap-2.5'>
                  <FaCheckCircle className='text-emerald-400 shrink-0 text-sm' />
                  <span>Zero hidden broker commission deductions</span>
                </div>
                <div className='flex items-center gap-2.5'>
                  <FaCheckCircle className='text-emerald-400 shrink-0 text-sm' />
                  <span>Request admin confirmation to take a listing offline</span>
                </div>
                <div className='flex items-center gap-2.5'>
                  <FaCheckCircle className='text-emerald-400 shrink-0 text-sm' />
                  <span>Direct WhatsApp and phone inquiries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNER PORTAL CONTENT SECTION */}
      <section className='max-w-6xl mx-auto px-4 sm:px-8 -mt-10 relative z-20'>
        {currentUser ? (
          /* ================= SIGNED-IN PARTNER DASHBOARD ================= */
          <div className='space-y-6'>
            {/* 1. Partner Profile Card */}
            <div className='bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-xl'>
              <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6'>
                {/* User Identity */}
                <div className='flex items-center gap-4 min-w-0'>
                  <div className='w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-2xl font-black shadow-sm shrink-0'>
                    {initialLetter}
                  </div>
                  <div className='min-w-0 space-y-1'>
                    <div className='flex items-center gap-2.5 flex-wrap'>
                      <h2 className='text-xl sm:text-2xl font-bold text-neutral-900 truncate'>
                        {displayName}
                      </h2>
                      <span className='px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1.5'>
                        <FaCheck className='text-[10px] text-emerald-600' />
                        <span>VERIFIED PARTNER</span>
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-xs text-neutral-500 flex-wrap'>
                      <span className='flex items-center gap-1.5'>
                        <FaEnvelope className='text-neutral-400 text-xs' />
                        <span>{email}</span>
                      </span>
                      {phone && (
                        <span className='flex items-center gap-1.5'>
                          <FaPhoneAlt className='text-neutral-400 text-xs' />
                          <span>{phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Counters on the right */}
                <div className='flex items-center gap-6 sm:gap-8 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-4 lg:pt-0 lg:pl-8 w-full lg:w-auto justify-between lg:justify-end'>
                  <div className='text-center'>
                    <p className='text-2xl sm:text-3xl font-black text-neutral-900'>{stats.total}</p>
                    <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5'>
                      Total Listings
                    </p>
                  </div>
                  <div className='w-px h-10 bg-neutral-200' />
                  <div className='text-center'>
                    <p className='text-2xl sm:text-3xl font-black text-emerald-600'>{stats.available}</p>
                    <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5'>
                      Available Now
                    </p>
                  </div>
                  <div className='w-px h-10 bg-neutral-200' />
                  <div className='text-center'>
                    <p className='text-2xl sm:text-3xl font-black text-neutral-900'>{stats.views}</p>
                    <p className='text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5'>
                      Total Views
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Switcher Bar */}
              <div className='mt-6 pt-5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2 flex-wrap text-xs'>
                  {userProfile?.role === 'admin' || currentUser?.isAdmin ? (
                    <>
                      <a
                        href='/admin'
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition shadow-xs'
                      >
                        <span>🛡️ Standalone Admin Portal</span>
                      </a>
                      <button
                        type='button'
                        onClick={() => handleDemoLogin('partner')}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition cursor-pointer'
                      >
                        <span>🏡 Switch to Partner Host</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type='button'
                      onClick={() => handleDemoLogin('admin')}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition cursor-pointer'
                    >
                      <span>🛡️ Switch to Demo Admin</span>
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={loadUserListings}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-neutral-600 hover:text-black bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition cursor-pointer'
                    title='Refresh listings'
                  >
                    <FaSync className={`text-xs ${loadingListings ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <button
                  type='button'
                  onClick={handleSignOut}
                  className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-600 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 transition cursor-pointer'
                >
                  <FaSignOutAlt />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* 2. Top Navigation Pill Tabs */}
            <div className='bg-white p-2 rounded-2xl border border-neutral-200 shadow-sm flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => setActiveTab('listings')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'listings'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <FaClipboardList className='text-xs' />
                <span>My Properties &amp; Vehicles</span>
                <span className='ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]'>
                  {listings.length}
                </span>
              </button>

              <Link
                to='/create-listing?type=guesthouse'
                className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 transition'
              >
                <FaPlus className='text-[10px]' />
                <span>List a Guest House</span>
              </Link>

              <Link
                to='/create-listing?type=car'
                className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 transition'
              >
                <FaPlus className='text-[10px]' />
                <span>List a Vehicle</span>
              </Link>

              <button
                type='button'
                onClick={() => setActiveTab('availability')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'availability'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <FaCalendarAlt className='text-xs' />
                <span>Availability Manager</span>
              </button>
            </div>

            {/* 3. Sub-filter Row & Action Buttons */}
            {activeTab === 'listings' && (
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                {/* Category Pills */}
                <div className='inline-flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-bold'>
                  <button
                    type='button'
                    onClick={() => setFilterType('all')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    All ({listings.length})
                  </button>
                  <button
                    type='button'
                    onClick={() => setFilterType('guesthouse')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filterType === 'guesthouse'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <FaHome className='text-xs' />
                    <span>Guest Houses</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setFilterType('car')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filterType === 'car'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <FaCar className='text-xs' />
                    <span>Vehicles</span>
                  </button>
                </div>

                {/* Right Action Buttons */}
                <div className='flex items-center gap-2.5'>
                  <Link
                    to='/create-listing?type=guesthouse'
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs transition shadow-xs'
                  >
                    <FaPlus className='text-[10px]' />
                    <span>Add Property</span>
                  </Link>
                  <Link
                    to='/create-listing?type=car'
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs transition shadow-xs'
                  >
                    <FaPlus className='text-[10px]' />
                    <span>Add Vehicle</span>
                  </Link>
                </div>
              </div>
            )}

            {/* 4. Tab Content: Listings or Availability Manager */}
            {activeTab === 'listings' ? (
              loadingListings ? (
                <div className='p-16 text-center bg-white rounded-3xl border border-neutral-200'>
                  <div className='w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                  <p className='text-xs font-bold text-neutral-500'>Loading your partner listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                /* Empty state matching the user's reference design */
                <div className='p-12 sm:p-16 text-center bg-white border border-dashed border-neutral-300 rounded-3xl space-y-4'>
                  <div className='w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto shadow-2xs'>
                    🏡
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-xl sm:text-2xl font-bold text-neutral-900'>
                      No listings posted yet
                    </h3>
                    <p className='text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed'>
                      Ready to start earning? Add your boutique guest house or chauffeured vehicle in just a few minutes.
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
                    <Link
                      to='/create-listing?type=guesthouse'
                      className='inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow-xs'
                    >
                      <FaPlus className='text-[10px]' />
                      <span>List a Guest House</span>
                    </Link>
                    <Link
                      to='/create-listing?type=car'
                      className='inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow-xs'
                    >
                      <FaPlus className='text-[10px]' />
                      <span>List a Vehicle</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Grid of Live Partner Listings */
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                  {filteredListings.map((item) => {
                    const isGuestHouse = item.type === 'guesthouse';
                    const cover =
                      (Array.isArray(item.images) && item.images[0]) ||
                      (Array.isArray(item.imageUrls) && item.imageUrls[0]) ||
                      (isGuestHouse
                        ? '/images/kampala_apartment_living.jpg'
                        : '/images/kampala_city_sedan.jpg');
                    const isAvailable = item.active !== false && item.isActive !== false;
                    const isApproved = item.status === 'approved' || Boolean(item.isApproved);

                    return (
                      <div
                        key={item.id}
                        className='bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between'
                      >
                        <div>
                          {/* Image & Type Badge */}
                          <div className='relative h-48 bg-neutral-900 overflow-hidden'>
                            <img
                              src={cover}
                              alt={item.title}
                              className='w-full h-full object-cover'
                            />
                            <div className='absolute top-3 left-3 flex items-center gap-2'>
                              <span className='px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white backdrop-blur-xs'>
                                {isGuestHouse ? '🏡 Guest House' : '🚗 Vehicle'}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-amber-400 text-amber-950 font-black'
                                }`}
                              >
                                {isApproved ? 'Approved & Live' : 'Pending Review'}
                              </span>
                            </div>

                            <button
                              type='button'
                              disabled={updatingId === item.id}
                              onClick={() => handleToggleAvailability(item)}
                              className='absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-white/95 text-neutral-900 shadow-sm cursor-pointer hover:bg-white transition flex items-center gap-1.5'
                            >
                              {isAvailable ? (
                                <>
                                  <FaToggleOn className='text-emerald-500 text-base' />
                                  <span>Available</span>
                                </>
                              ) : (
                                <>
                                  <FaToggleOff className='text-neutral-400 text-base' />
                                  <span>Paused</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Listing Details */}
                          <div className='p-5 space-y-2.5'>
                            <h4 className='font-bold text-base text-neutral-900 line-clamp-1'>
                              {item.title}
                            </h4>
                            <p className='text-xs text-neutral-500 line-clamp-1'>
                              📍 {item.location || item.address || 'Makindye Division, Kampala'}
                            </p>
                            <div className='flex items-baseline gap-1 pt-1'>
                              <span className='text-lg font-black text-neutral-900'>
                                ${item.price || item.regularPrice || 0}
                              </span>
                              <span className='text-xs text-neutral-400'>
                                / {isGuestHouse ? 'night' : 'day'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className='p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs'>
                          <div className='flex items-center gap-2'>
                            <Link
                              to={`/listing/${item.id}`}
                              className='p-2 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded-lg transition'
                              title='View Public Listing'
                            >
                              <FaEye className='text-sm' />
                            </Link>
                            <Link
                              to={`/update-listing/${item.id}`}
                              className='p-2 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded-lg transition'
                              title='Edit Listing'
                            >
                              <FaEdit className='text-sm' />
                            </Link>
                          </div>

                          <button
                            type='button'
                            disabled={deletingId === item.id}
                            onClick={() => handleDeleteListing(item.id)}
                            className='p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50'
                            title='Delete Listing'
                          >
                            <FaTrashAlt className='text-xs' />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ================= AVAILABILITY MANAGER TAB ================= */
              <div className='bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6'>
                <div>
                  <h3 className='text-xl font-bold text-neutral-900'>
                    Live Inventory &amp; Booking Availability
                  </h3>
                  <p className='text-xs text-neutral-500 mt-1'>
                    Instantly pause listings when you are fully booked, conducting maintenance, or unavailable for guest arrivals.
                  </p>
                </div>

                {listings.length === 0 ? (
                  <div className='p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200'>
                    <p className='text-xs text-neutral-500'>
                      You do not have any listings yet. Post your first property or vehicle to manage availability.
                    </p>
                  </div>
                ) : (
                  <div className='divide-y divide-neutral-100'>
                    {listings.map((item) => {
                      const isAvailable = item.active !== false && item.isActive !== false;
                      return (
                        <div
                          key={item.id}
                          className='py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
                        >
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className='font-bold text-sm text-neutral-900'>{item.title}</span>
                              <span className='text-[10px] uppercase font-bold text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-100'>
                                {item.type === 'guesthouse' ? 'Guest House' : 'Vehicle'}
                              </span>
                            </div>
                            <p className='text-xs text-neutral-500 mt-0.5'>
                              {item.location || 'Makindye, Kampala'} &bull; ${item.price || 0} /{' '}
                              {item.type === 'guesthouse' ? 'night' : 'day'}
                            </p>
                          </div>

                          <button
                            type='button'
                            disabled={updatingId === item.id}
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                            }`}
                          >
                            {isAvailable ? (
                              <>
                                <FaCheckCircle className='text-emerald-600' />
                                <span>Available for Inquiries</span>
                              </>
                            ) : (
                              <>
                                <FaClock className='text-neutral-400' />
                                <span>Paused / Temporarily Offline</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= ONBOARDING / SIGN-IN VIEW ================= */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
            {/* Left Column: Why Partner Value Props */}
            <div className='lg:col-span-6 space-y-6 pt-4'>
              <div className='bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-5'>
                <h2 className='text-2xl font-bold text-neutral-900 tracking-tight'>
                  How Partnering Works
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-start gap-3.5'>
                    <div className='w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5'>
                      1
                    </div>
                    <div>
                      <h4 className='text-sm font-bold text-neutral-900'>Register with Name, Email &amp; Phone</h4>
                      <p className='text-xs text-neutral-500 mt-0.5 leading-relaxed'>
                        Quick 1-minute registration so travelers can contact you directly via phone or WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3.5'>
                    <div className='w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5'>
                      2
                    </div>
                    <div>
                      <h4 className='text-sm font-bold text-neutral-900'>List Your Property or Vehicle</h4>
                      <p className='text-xs text-neutral-500 mt-0.5 leading-relaxed'>
                        Add high-quality photos, daily or nightly rates, amenities, and specifications. Our administrators verify your listing within 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3.5'>
                    <div className='w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5'>
                      3
                    </div>
                    <div>
                      <h4 className='text-sm font-bold text-neutral-900'>Direct Payments &amp; Zero Hidden Fees</h4>
                      <p className='text-xs text-neutral-500 mt-0.5 leading-relaxed'>
                        Guests pay you directly when checking in or receiving vehicle keys. No escrow lockups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Category Cards */}
              <div className='grid grid-cols-2 gap-4 text-neutral-700'>
                <div className='p-5 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-1.5'>
                  <FaHome className='text-xl text-neutral-900' />
                  <h4 className='text-xs font-bold text-neutral-900'>Guest House Hosts</h4>
                  <p className='text-[11px] text-neutral-500'>Apartments, villas, and family homes in Muyenga, Munyonyo, Buziga, and across Makindye Division.</p>
                </div>
                <div className='p-5 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-1.5'>
                  <FaCar className='text-xl text-neutral-900' />
                  <h4 className='text-xs font-bold text-neutral-900'>Chauffeur &amp; Fleets</h4>
                  <p className='text-[11px] text-neutral-500'>City sedans, 4x4 SUVs, and VIP airport transfer vans.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Registration / Sign In Form Box */}
            <div className='lg:col-span-6'>
              <div className='bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-6'>
                {/* Form Header & Switch */}
                <div className='flex items-center justify-between border-b border-neutral-100 pb-4'>
                  <div>
                    <h2 className='text-xl sm:text-2xl font-bold text-neutral-900'>
                      {authMode === 'register' ? 'Register as a Partner' : 'Partner Sign In'}
                    </h2>
                    <p className='text-xs text-neutral-500 mt-0.5'>
                      {authMode === 'register'
                        ? 'Join our host network and list your property or vehicle'
                        : 'Access your partner portal and availability controls'}
                    </p>
                  </div>

                  <div className='flex bg-neutral-100 p-1 rounded-xl text-xs font-bold'>
                    <button
                      type='button'
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError('');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      Register
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className='p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2'>
                    <FaInfoCircle className='shrink-0' />
                    <span>{authError}</span>
                  </div>
                )}

                {/* 1-Click Demo Testing Sign In for Partner Host & Platform Admin */}
                <div className='p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5 shadow-2xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
                      Demo Testing Sign In
                    </span>
                    <span className='text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded-full'>
                      Instant 1-Click
                    </span>
                  </div>
                  <p className='text-xs text-amber-800/90 leading-relaxed'>
                    Test the partner and administrative portals without needing passwords or verification:
                  </p>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1'>
                    <button
                      type='button'
                      id='partner-demo-host-btn'
                      disabled={authLoading}
                      onClick={() => handleDemoLogin('partner')}
                      className='py-2.5 px-3 bg-neutral-900 hover:bg-black active:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60'
                    >
                      <span className='text-sm'>🏡</span>
                      <span>Demo Partner (Host)</span>
                    </button>
                    <button
                      type='button'
                      id='partner-demo-admin-btn'
                      disabled={authLoading}
                      onClick={() => handleDemoLogin('admin')}
                      className='py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60'
                    >
                      <span className='text-sm'>🛡️</span>
                      <span>Demo Admin</span>
                    </button>
                  </div>
                </div>

                <div className='relative flex items-center justify-center my-2'>
                  <div className='border-t border-neutral-200 w-full' />
                  <span className='bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider shrink-0'>
                    or sign in with email credentials
                  </span>
                  <div className='border-t border-neutral-200 w-full' />
                </div>

                {/* Registration Form */}
                {authMode === 'register' ? (
                  <form onSubmit={handleRegisterSubmit} className='space-y-4'>
                    <div>
                      <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                        <FaUser className='text-neutral-400 text-xs' />
                        <span>Full Name / Host Name *</span>
                      </label>
                      <input
                        type='text'
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder='e.g. Alexander Vance or Horizon Stays'
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                        required
                      />
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                      <div>
                        <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                          <FaEnvelope className='text-neutral-400 text-xs' />
                          <span>Email Address *</span>
                        </label>
                        <input
                          type='email'
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder='host@example.com'
                          className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                          required
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                          <FaPhoneAlt className='text-neutral-400 text-xs' />
                          <span>Phone / WhatsApp *</span>
                        </label>
                        <input
                          type='tel'
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder='+291 7 123 456'
                          className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                        <FaLock className='text-neutral-400 text-xs' />
                        <span>Password (min. 6 characters) *</span>
                      </label>
                      <input
                        type='password'
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder='••••••••'
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                        What would you like to list?
                      </label>
                      <div className='grid grid-cols-3 gap-2'>
                        {[
                          { id: 'guesthouse', label: '🏡 Guest House' },
                          { id: 'car', label: '🚗 Vehicle' },
                          { id: 'both', label: '⭐ Both' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type='button'
                            onClick={() => setRegPartnerType(t.id)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                              regPartnerType === t.id
                                ? 'bg-black text-white border-black shadow-xs'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type='submit'
                      disabled={authLoading}
                      className='w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60'
                    >
                      {authLoading ? 'Registering...' : 'Register as Partner & Enter Portal →'}
                    </button>
                  </form>
                ) : (
                  /* Sign In Form */
                  <form onSubmit={handleSignInSubmit} className='space-y-4'>
                    <div>
                      <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                        <FaEnvelope className='text-neutral-400 text-xs' />
                        <span>Email Address</span>
                      </label>
                      <input
                        type='email'
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder='your-email@example.com'
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5'>
                        <FaLock className='text-neutral-400 text-xs' />
                        <span>Password</span>
                      </label>
                      <input
                        type='password'
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder='••••••••'
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white transition'
                        required
                      />
                    </div>

                    <button
                      type='submit'
                      disabled={authLoading}
                      className='w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60'
                    >
                      {authLoading ? 'Signing In...' : 'Sign In to Partner Portal →'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
