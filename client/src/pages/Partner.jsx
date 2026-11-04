import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import {
  getUserListings,
  createListing,
  updateListingAvailability,
  requestListingUnavailable,
  deleteListing,
} from '../services/listingService';
import CameraCaptureModal from '../components/CameraCaptureModal';
import { compressImage } from '../utils/imageCompressor';
import {
  FaHome,
  FaCar,
  FaCheckCircle,
  FaShieldAlt,
  FaCalendarAlt,
  FaShareAlt,
  FaPlus,
  FaEye,
  FaTrash,
  FaEdit,
  FaWhatsapp,
  FaCopy,
  FaCheck,
  FaPhoneAlt,
  FaEnvelope,
  FaUser,
  FaLock,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaTag,
  FaInfoCircle,
  FaTimes,
  FaCamera,
  FaStar,
  FaArrowRight,
  FaGlobe,
} from 'react-icons/fa';

export default function Partner() {
  const { currentUser, userProfile, signUp, signIn, signInWithGoogle, updateUser, loginDemo, logOut } = useAuth();
  const navigate = useNavigate();

  const effectiveUser = useMemo(() => {
    return (
      currentUser || {
        ...DEMO_ACCOUNTS?.guest,
        displayName: 'Sarah (Demo Traveler)',
        email: 'demo.traveler@chento100.com',
        phone: '+1 305-555-1234',
        uid: 'demo_traveler_guest',
        role: 'host',
        accountType: 'host',
      }
    );
  }, [currentUser]);

  // Mode: if signed in, show portal; if not, show registration / sign-in
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'signin'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Host Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPartnerType, setRegPartnerType] = useState('both'); // 'guesthouse' | 'car' | 'both'
  const [regCity, setRegCity] = useState('Muyenga');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Portal State
  const [portalTab, setPortalTab] = useState('listings'); // 'listings' | 'new_house' | 'new_car' | 'availability'
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingFilter, setListingFilter] = useState('all'); // 'all' | 'guesthouse' | 'car'

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Share Modal State
  const [shareModalListing, setShareModalListing] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Availability Date Range Modal State
  const [availModalListing, setAvailModalListing] = useState(null);
  const [blockFromDate, setBlockFromDate] = useState('');
  const [blockToDate, setBlockToDate] = useState('');
  const [blockReason, setBlockReason] = useState('Reserved');

  // New Guest House Form State
  const [ghForm, setGhForm] = useState({
    title: '',
    description: '',
    address: '',
    city: 'Muyenga',
    price: 65,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    amenities: 'WiFi, Air Conditioning, Hot Water, Backup Generator, Kitchen',
    imageUrls: [],
    customImageUrl: '',
  });

  // New Car Form State
  const [carForm, setCarForm] = useState({
    title: '',
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    year: 2022,
    description: '',
    city: 'Makindye',
    price: 90,
    seats: 5,
    transmission: 'Automatic',
    driverIncluded: true,
    driverName: '',
    driverContact: '',
    imageUrls: [],
    customImageUrl: '',
  });

  // Camera & Local Photo Upload State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('gh'); // 'gh' | 'car'
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageNotice, setImageNotice] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Host Listings when signed in
  const loadHostListings = useCallback(async () => {
    if (!effectiveUser?.uid) return;
    setLoadingListings(true);
    try {
      const data = await getUserListings(effectiveUser.uid);
      setListings(data || []);
    } catch (err) {
      console.warn('Error loading host listings:', err.message);
    } finally {
      setLoadingListings(false);
    }
  }, [effectiveUser?.uid]);

  useEffect(() => {
    loadHostListings();
    if (effectiveUser?.displayName) {
      setCarForm((prev) => ({ ...prev, driverName: effectiveUser.displayName }));
    }
    if (effectiveUser?.phone) {
      setCarForm((prev) => ({ ...prev, driverContact: effectiveUser.phone }));
    }
  }, [effectiveUser, loadHostListings]);

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
      setShowAuthModal(false);
      setPortalTab('listings');
    } catch (err) {
      console.error('Host registration error:', err);
      setAuthError(err.message || 'Failed to register. Please check your details.');
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
      setShowAuthModal(false);
      setPortalTab('listings');
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Google Sign In for Partner Host
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google! Welcome to your Partner Portal.');
      setShowAuthModal(false);
      setPortalTab('listings');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google sign in failed.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Demo Host Sign In for Development
  const handleDemoSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginDemo('host');
      showToast('⚡ Signed in with Demo Host Account! Welcome to the Partner Portal.');
      setShowAuthModal(false);
      setPortalTab('listings');
    } catch (err) {
      console.error('Demo sign in error:', err);
      setAuthError(err.message || 'Failed to sign in with demo account.');
    } finally {
      setAuthLoading(false);
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

  // Toggle Availability Instantly
  const handleToggleAvailability = async (listing) => {
    if (listing.status !== 'approved' && !listing.isApproved) {
      showToast('Your listing must be approved before you can change its availability.');
      return;
    }

    if (listing.availabilityRequest?.status === 'pending') {
      showToast('This listing is already waiting for an administrator to mark it unavailable.');
      return;
    }

    const newIsAvailable = listing.isAvailable === false || listing.available === false ? true : false;
    const newStatus = newIsAvailable ? 'available' : 'booked';

    try {
      if (newIsAvailable) {
        await updateListingAvailability(listing.id, {
          isAvailable: true,
          availabilityStatus: newStatus,
        });
        setListings((prev) =>
          prev.map((item) =>
            item.id === listing.id
              ? { ...item, isAvailable: true, available: true, active: true, isActive: true, availabilityStatus: newStatus }
              : item
          )
        );
        showToast(`"${listing.title || listing.name}" is now marked as available.`);
      } else {
        const request = await requestListingUnavailable(listing.id, {
          availabilityNotes: 'Partner requested that this listing be marked unavailable.',
          blockedDates: listing.blockedDates || [],
        });
        setListings((prev) =>
          prev.map((item) => (item.id === listing.id ? { ...item, availabilityRequest: request } : item))
        );
        showToast(`Unavailable request sent to the admin team for "${listing.title || listing.name}".`);
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
      showToast('Could not update availability. Please try again.');
      loadHostListings();
    }
  };

  // Set Custom Blocked Date Range
  const handleSaveBlockDates = async (e) => {
    e.preventDefault();
    if (!availModalListing) return;

    if (!blockFromDate || !blockToDate) {
      showToast('Please select both start and end dates.');
      return;
    }
    if (availModalListing.status !== 'approved' && !availModalListing.isApproved) {
      showToast('Your listing must be approved before you can request an availability change.');
      return;
    }
    if (availModalListing.availabilityRequest?.status === 'pending') {
      showToast('This listing already has an availability request awaiting admin action.');
      return;
    }

    const listingId = availModalListing.id;
    const dateRangeNote = `${blockFromDate} to ${blockToDate} (${blockReason})`;

    try {
      const request = await requestListingUnavailable(listingId, {
        availableFrom: blockFromDate,
        availableUntil: blockToDate,
        availabilityNotes: dateRangeNote,
        blockedDates: [
          ...(availModalListing.blockedDates || []),
          { from: blockFromDate, to: blockToDate, reason: blockReason },
        ],
      });
      setListings((prev) =>
        prev.map((item) => (item.id === listingId ? { ...item, availabilityRequest: request } : item))
      );
      showToast(`Date block request sent to the admin team for "${availModalListing.title}" (${dateRangeNote}).`);
      setAvailModalListing(null);
      setBlockFromDate('');
      setBlockToDate('');
    } catch (err) {
      console.error('Error setting blocked dates:', err);
      showToast('Failed to save date block.');
      loadHostListings();
    }
  };

  // Create Guest House Listing
  const handleCreateGuestHouse = async (e) => {
    e.preventDefault();
    if (!ghForm.title.trim()) {
      showToast('Please provide a title for your guest house.');
      return;
    }
    if (ghForm.imageUrls.length === 0) {
      showToast('Please add at least one photo using your camera or device files.');
      return;
    }

    setFormSubmitting(true);
    try {
      const newListing = {
        title: ghForm.title.trim(),
        name: ghForm.title.trim(),
        description: ghForm.description.trim() || 'Spacious, well-appointed guest house with modern comforts.',
        category: 'guesthouse',
        type: 'guesthouse',
        address: ghForm.address.trim() || `${ghForm.city}, Center`,
        location: ghForm.address.trim() || `${ghForm.city}, Center`,
        city: ghForm.city,
        price: Number(ghForm.price) || 60,
        regularPrice: Number(ghForm.price) || 60,
        priceUnit: 'night',
        currency: 'USD',
        bedrooms: Number(ghForm.bedrooms) || 1,
        bathrooms: Number(ghForm.bathrooms) || 1,
        maxGuests: Number(ghForm.maxGuests) || 2,
        amenities: ghForm.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        images: ghForm.imageUrls,
        imageUrls: ghForm.imageUrls,
        contactPhone: userProfile?.phone || regPhone || '+291 7 123 456',
        ownerEmail: currentUser?.email || effectiveUser?.email || 'partner@chento100.com',
        ownerName: userProfile?.displayName || currentUser?.displayName || effectiveUser?.displayName || 'Partner Host',
        isAvailable: true,
        available: true,
        availabilityStatus: 'available',
      };

      await createListing(newListing, currentUser || effectiveUser);
      showToast('Property submitted and is pending admin approval. It will appear in your listings while under review.');
      setPortalTab('listings');
      loadHostListings();
      // Reset form
      setGhForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        address: '',
        imageUrls: [],
        customImageUrl: '',
      }));
    } catch (err) {
      console.error('Error creating guest house:', err);
      showToast(err.message || 'Failed to submit property. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Create Vehicle Listing
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!carForm.title.trim() && (!carForm.make || !carForm.model)) {
      showToast('Please enter a vehicle make and model.');
      return;
    }
    if (carForm.imageUrls.length === 0) {
      showToast('Please add at least one photo using your camera or device files.');
      return;
    }

    setFormSubmitting(true);
    try {
      const title = carForm.title.trim() || `${carForm.make} ${carForm.model} (${carForm.year})`;
      const newListing = {
        title,
        name: title,
        make: carForm.make,
        model: carForm.model,
        year: Number(carForm.year) || 2022,
        description: carForm.description.trim() || 'Pristine, air-conditioned vehicle with experienced professional chauffeur.',
        category: 'car_service',
        type: 'car',
        address: carForm.city,
        location: carForm.city,
        city: carForm.city,
        price: Number(carForm.price) || 85,
        regularPrice: Number(carForm.price) || 85,
        priceUnit: 'day',
        currency: 'USD',
        seats: Number(carForm.seats) || 4,
        transmission: carForm.transmission,
        driverIncluded: Boolean(carForm.driverIncluded),
        driverName: carForm.driverName || userProfile?.displayName || 'Licensed Chauffeur',
        driverContact: carForm.driverContact || userProfile?.phone || regPhone || '+291 7 123 456',
        contactPhone: carForm.driverContact || userProfile?.phone || regPhone || '+291 7 123 456',
        images: carForm.imageUrls,
        imageUrls: carForm.imageUrls,
        ownerEmail: currentUser?.email || effectiveUser?.email || 'partner@chento100.com',
        ownerName: userProfile?.displayName || currentUser?.displayName || effectiveUser?.displayName || 'Vehicle Partner',
        isAvailable: true,
        available: true,
        availabilityStatus: 'available',
      };

      await createListing(newListing, currentUser || effectiveUser);
      showToast('Vehicle submitted and is pending admin approval. It will appear in your listings while under review.');
      setPortalTab('listings');
      loadHostListings();
      // Reset form
      setCarForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        imageUrls: [],
        customImageUrl: '',
      }));
    } catch (err) {
      console.error('Error creating vehicle:', err);
      showToast(err.message || 'Failed to submit vehicle. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Local device file upload handler for partner portal
  const handleProcessLocalFiles = async (fileList, target = 'gh') => {
    if (!fileList || fileList.length === 0) return;
    const incomingFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (incomingFiles.length === 0) {
      showToast('Please select valid image files (.jpg, .png, .webp).');
      return;
    }

    setIsProcessingImages(true);
    setImageNotice(`Optimizing ${incomingFiles.length} photo${incomingFiles.length > 1 ? 's' : ''} from your device...`);

    try {
      const compressedUrls = [];
      for (const file of incomingFiles) {
        const url = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        if (url) compressedUrls.push(url);
      }

      if (compressedUrls.length > 0) {
        if (target === 'gh') {
          setGhForm((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, ...compressedUrls],
          }));
        } else {
          setCarForm((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, ...compressedUrls],
          }));
        }
        setImageNotice(`✓ Added ${compressedUrls.length} photo${compressedUrls.length > 1 ? 's' : ''} successfully!`);
        setTimeout(() => setImageNotice(''), 3500);
      }
    } catch (err) {
      console.error('Error processing local files in partner portal:', err);
      showToast('Failed to process image files.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  // Device camera photo capture handler
  const handleProcessCameraPhoto = async (file) => {
    if (!file) return;
    setIsProcessingImages(true);
    setImageNotice('Optimizing photo captured with device camera...');
    try {
      const url = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      if (url) {
        if (cameraTarget === 'gh') {
          setGhForm((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, url],
          }));
        } else {
          setCarForm((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, url],
          }));
        }
        setImageNotice('✓ Photo captured with camera added to listing!');
        setTimeout(() => setImageNotice(''), 3500);
      }
    } catch (err) {
      console.error('Camera capture error in partner portal:', err);
      showToast('Failed to process camera photo.');
    } finally {
      setIsProcessingImages(false);
    }
  };



  // Delete Listing
  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast(`Listing "${title}" removed.`);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Could not delete listing.');
    }
  };

  // Share Actions
  const getListingUrl = (id) => `${window.location.origin}/listing/${id}`;

  const handleCopyShareLink = (id) => {
    const url = getListingUrl(id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Direct listing link copied to clipboard!');
  };

  const handleWhatsAppShare = (listing) => {
    const url = getListingUrl(listing.id);
    const text = encodeURIComponent(
      `Check out my verified listing "${listing.title || listing.name}" on chento 100: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredListings = listings.filter((l) => {
    if (listingFilter === 'all') return true;
    if (listingFilter === 'guesthouse') {
      return l.type === 'guesthouse' || l.category === 'guesthouse' || l.type === 'rent';
    }
    if (listingFilter === 'car') {
      return l.type === 'car' || l.category === 'car_service' || l.type === 'sale';
    }
    return true;
  });

  const availableCount = listings.filter(
    (l) => l.isAvailable !== false && l.available !== false
  ).length;

  return (
    <div className='min-h-screen bg-white text-neutral-900 pb-20'>
      {/* Toast Notification */}
      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 text-sm font-semibold flex items-center gap-3 animate-fadeInUp max-w-md'>
          <FaCheckCircle className='text-emerald-400 text-base shrink-0' />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal Dialog */}
      {shareModalListing && (
        <div className='fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-neutral-200 animate-fadeInUp'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <span className='text-[11px] font-extrabold uppercase tracking-wider text-neutral-400'>
                  Share Your Listing
                </span>
                <h3 className='text-xl font-bold text-neutral-900 line-clamp-1'>
                  {shareModalListing.title || shareModalListing.name}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setShareModalListing(null)}
                className='text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-100 transition'
              >
                <FaTimes />
              </button>
            </div>

            <p className='text-xs text-neutral-500 leading-relaxed'>
              Share your direct listing link with potential guests on WhatsApp, social media, or via SMS. Guests can view photos, specifications, and contact you directly.
            </p>

            {/* Link Copy Box */}
            <div className='flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200'>
              <input
                type='text'
                readOnly
                value={getListingUrl(shareModalListing.id)}
                className='bg-transparent text-xs text-neutral-800 w-full focus:outline-hidden font-mono truncate'
              />
              <button
                type='button'
                onClick={() => handleCopyShareLink(shareModalListing.id)}
                className='px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs'
              >
                {copiedLink ? <FaCheck className='text-emerald-400' /> : <FaCopy />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2'>
              <button
                type='button'
                onClick={() => handleWhatsAppShare(shareModalListing)}
                className='py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs'
              >
                <FaWhatsapp className='text-base' />
                <span>Share on WhatsApp</span>
              </button>

              <button
                type='button'
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: shareModalListing.title,
                      text: `Check out ${shareModalListing.title} on chento 100`,
                      url: getListingUrl(shareModalListing.id),
                    });
                  } else {
                    handleCopyShareLink(shareModalListing.id);
                  }
                }}
                className='py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs'
              >
                <FaShareAlt />
                <span>Native Share Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Availability Block Modal */}
      {availModalListing && (
        <div className='fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4'>
          <form
            onSubmit={handleSaveBlockDates}
            className='bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-neutral-200 animate-fadeInUp'
          >
            <div className='flex items-start justify-between'>
              <div>
                <span className='text-[11px] font-extrabold uppercase tracking-wider text-rose-500'>
                  Set Calendar Unavailable Dates
                </span>
                <h3 className='text-lg font-bold text-neutral-900 line-clamp-1'>
                  {availModalListing.title}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setAvailModalListing(null)}
                className='text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-100'
              >
                <FaTimes />
              </button>
            </div>

            <p className='text-xs text-neutral-500 leading-relaxed'>
              Mark your guest house or vehicle as reserved or blocked for specific dates. Guests will see this listing as temporarily booked.
            </p>

            <div className='space-y-3 text-xs'>
              <div>
                <label className='font-bold text-neutral-800 block mb-1'>From Date</label>
                <input
                  type='date'
                  value={blockFromDate}
                  onChange={(e) => setBlockFromDate(e.target.value)}
                  className='w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 focus:outline-hidden focus:border-black'
                  required
                />
              </div>

              <div>
                <label className='font-bold text-neutral-800 block mb-1'>To Date</label>
                <input
                  type='date'
                  value={blockToDate}
                  onChange={(e) => setBlockToDate(e.target.value)}
                  className='w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 focus:outline-hidden focus:border-black'
                  required
                />
              </div>

              <div>
                <label className='font-bold text-neutral-800 block mb-1'>Reason / Note</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className='w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 focus:outline-hidden focus:border-black'
                >
                  <option value='Reserved by direct guest'>Reserved by direct guest</option>
                  <option value='Booked via WhatsApp'>Booked via WhatsApp</option>
                  <option value='Scheduled vehicle maintenance'>Scheduled vehicle maintenance</option>
                  <option value='Host personal holiday'>Host personal holiday / unavailable</option>
                  <option value='Under renovation'>Under renovation</option>
                </select>
              </div>
            </div>

            <div className='pt-2 flex items-center justify-end gap-2'>
              <button
                type='button'
                onClick={() => setAvailModalListing(null)}
                className='px-4 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold transition'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs'
              >
                Block Dates
              </button>
            </div>
          </form>
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

      {/* Optional Host Registration & Sign In Modal */}
      {showAuthModal && (
        <section className='max-w-6xl mx-auto px-4 sm:px-8 -mt-8 relative z-20'>
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
                      <h4 className='text-sm font-bold text-neutral-900'>Share &amp; Control Availability Anytime</h4>
                      <p className='text-xs text-neutral-500 mt-0.5 leading-relaxed'>
                        Once approved, mark your listing available or request that it be taken offline. Admins confirm unavailable requests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge Grid */}
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

            {/* Right Column: Registration Form Box */}
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

                  <div className='flex items-center gap-2'>
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

                    <button
                      type='button'
                      onClick={() => setShowAuthModal(false)}
                      className='p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-xl transition cursor-pointer'
                      title='Close'
                    >
                      <FaTimes className='text-sm' />
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className='p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2'>
                    <FaInfoCircle className='shrink-0' />
                    <span>{authError}</span>
                  </div>
                )}

                {/* 1-Click Google Sign In */}
                <button
                  type='button'
                  disabled={authLoading}
                  onClick={handleGoogleSignIn}
                  className='w-full py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold border border-neutral-300 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-60'
                >
                  <svg className='w-4 h-4' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className='relative flex items-center justify-center my-2'>
                  <div className='border-t border-neutral-200 w-full' />
                  <span className='bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider shrink-0'>
                    or with email
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
                        placeholder='e.g. Abraham Ghebrehiwet or Horizon Stays'
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

                {/* Development Quick Demo Account Sign-In */}
                <div className='p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 mt-4'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='font-bold text-neutral-800 flex items-center gap-1.5'>
                      <span className='text-amber-500 font-extrabold'>⚡</span>
                      <span>Development Quick Demo</span>
                    </span>
                    <button
                      type='button'
                      onClick={handleDemoSignIn}
                      disabled={authLoading}
                      className='px-3 py-1 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer'
                    >
                      1-Click Host Sign In
                    </button>
                  </div>
                  <div className='bg-white p-2.5 rounded-xl text-[11px] font-mono text-neutral-600 border border-neutral-200 flex flex-col gap-0.5'>
                    <div>Email: <span className='text-neutral-950 font-bold'>demo.host@chento100.com</span></div>
                    <div>Password: <span className='text-neutral-950 font-bold'>password123</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PARTNER PORTAL VIEW */}
      {/* ========================================================================= */}
      <section className='max-w-6xl mx-auto px-4 sm:px-8 -mt-10 sm:-mt-12 relative z-20 space-y-6'>
          {/* Partner Info Banner */}
          <div className='bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center text-2xl font-bold shadow-sm shrink-0'>
                {(effectiveUser.displayName || effectiveUser.email || 'S')[0].toUpperCase()}
              </div>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2.5 flex-wrap'>
                  <h2 className='text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight'>
                    {effectiveUser.displayName || 'Sarah (Demo Traveler)'}
                  </h2>
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#d1fae5] text-[#065f46] flex items-center gap-1.5 tracking-wide'>
                    <FaCheckCircle className='text-[11px] text-[#059669]' />
                    <span>VERIFIED PARTNER</span>
                  </span>
                </div>
                <div className='flex items-center gap-4 text-xs text-neutral-500 flex-wrap'>
                  <span className='flex items-center gap-1.5'>
                    <FaEnvelope className='text-neutral-400 text-xs' />
                    <span>{effectiveUser.email || 'demo.traveler@chento100.com'}</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <FaPhoneAlt className='text-neutral-400 text-xs' />
                    <span>{effectiveUser.phone || userProfile?.phone || '+1 305-555-1234'}</span>
                  </span>
                  {currentUser ? (
                    <button
                      type='button'
                      onClick={handleSignOut}
                      className='text-[11px] font-bold text-neutral-500 hover:text-black underline cursor-pointer'
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setShowAuthModal((prev) => !prev)}
                      className='text-[11px] font-bold text-neutral-900 hover:text-black underline cursor-pointer'
                    >
                      {showAuthModal ? 'Close Form' : 'Sign In / Register'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className='flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-neutral-100'>
              <div className='text-center px-3 sm:px-5'>
                <div className='text-2xl sm:text-3xl font-black text-neutral-900'>{listings.length}</div>
                <div className='text-xs text-neutral-400 font-medium mt-0.5'>Total Listings</div>
              </div>
              <div className='h-10 w-px bg-neutral-200 hidden sm:block' />
              <div className='text-center px-3 sm:px-5'>
                <div className='text-2xl sm:text-3xl font-black text-[#059669]'>{availableCount}</div>
                <div className='text-xs text-neutral-400 font-medium mt-0.5'>Available Now</div>
              </div>
              <div className='h-10 w-px bg-neutral-200 hidden sm:block' />
              <div className='text-center px-3 sm:px-5'>
                <div className='text-2xl sm:text-3xl font-black text-neutral-900'>
                  {listings.reduce((sum, item) => sum + (item.viewCount || 0), 0)}
                </div>
                <div className='text-xs text-neutral-400 font-medium mt-0.5'>Total Views</div>
              </div>
            </div>
          </div>

          {/* Portal Navigation Tabs */}
          <div className='flex items-center gap-2 overflow-x-auto p-1.5 sm:p-2 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs'>
            <button
              type='button'
              onClick={() => setPortalTab('listings')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                portalTab === 'listings'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <span>📋 My Properties &amp; Vehicles</span>
              <span className='px-1.5 py-0.2 rounded-full text-[11px] font-black bg-neutral-800 text-white min-w-4 text-center'>
                {listings.length}
              </span>
            </button>

            <button
              type='button'
              onClick={() => setPortalTab('new_house')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                portalTab === 'new_house'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <FaPlus className='text-[10px]' />
              <span>List a Guest House</span>
            </button>

            <button
              type='button'
              onClick={() => setPortalTab('new_car')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                portalTab === 'new_car'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <FaPlus className='text-[10px]' />
              <span>List a Vehicle</span>
            </button>

            <button
              type='button'
              onClick={() => setPortalTab('availability')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                portalTab === 'availability'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <FaCalendarAlt className='text-xs' />
              <span>Availability Manager</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MY PROPERTIES & VEHICLES LIST */}
          {/* ========================================================================= */}
          {portalTab === 'listings' && (
            <div className='space-y-6'>
              {/* Category Filter Toolbar */}
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                <div className='flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-xs font-semibold shadow-2xs'>
                  <button
                    type='button'
                    onClick={() => setListingFilter('all')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                      listingFilter === 'all' ? 'bg-black text-white' : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                    }`}
                  >
                    All ({listings.length})
                  </button>
                  <button
                    type='button'
                    onClick={() => setListingFilter('guesthouse')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium ${
                      listingFilter === 'guesthouse' ? 'bg-black text-white' : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                    }`}
                  >
                    <FaHome className='text-xs text-neutral-600' />
                    <span>Guest Houses</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setListingFilter('car')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium ${
                      listingFilter === 'car' ? 'bg-black text-white' : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                    }`}
                  >
                    <FaCar className='text-xs text-neutral-600' />
                    <span>Vehicles</span>
                  </button>
                </div>

                <div className='flex items-center gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setPortalTab('new_house')}
                    className='px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer'
                  >
                    <FaPlus className='text-[10px]' />
                    <span>Add Property</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setPortalTab('new_car')}
                    className='px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer'
                  >
                    <FaPlus className='text-[10px]' />
                    <span>Add Vehicle</span>
                  </button>
                </div>
              </div>

              {/* Listings Grid */}
              {loadingListings ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className='h-72 bg-white rounded-3xl border border-neutral-200 animate-pulse' />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredListings.map((listing) => {
                    const isAvailable = listing.isAvailable !== false && listing.available !== false;
                    const isApprovedListing = listing.status === 'approved' || listing.isApproved === true;
                    const hasPendingAvailabilityRequest = listing.availabilityRequest?.status === 'pending';
                    const moderationLabel = isApprovedListing
                      ? '✓ Approved'
                      : listing.status === 'rejected'
                      ? 'Rejected'
                      : '⏳ Pending approval';
                    const isGuestHouse =
                      listing.type === 'guesthouse' ||
                      listing.category === 'guesthouse' ||
                      listing.type === 'rent';
                    const cover =
                      listing.images?.[0] ||
                      listing.imageUrls?.[0] ||
                      (isGuestHouse ? '/images/airbnb_apartment_living.jpg' : '/images/city_regular_sedan.jpg');

                    return (
                      <div
                        key={listing.id}
                        className='bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between'
                      >
                        <div>
                          {/* Image & Status Overlay */}
                          <div className='relative h-48 w-full bg-neutral-100 overflow-hidden'>
                            <img
                              src={cover}
                              alt={listing.title}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                e.currentTarget.src = isGuestHouse
                                  ? '/images/airbnb_apartment_living.jpg'
                                  : '/images/city_regular_sedan.jpg';
                              }}
                            />
                            {/* Badges */}
                            <div className='absolute top-3 left-3 flex items-center gap-1.5'>
                              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md text-white'>
                                {isGuestHouse ? '🏡 Guest House' : '🚗 Vehicle'}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isApprovedListing
                                    ? 'bg-emerald-500 text-white'
                                    : listing.status === 'rejected'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-amber-400 text-neutral-900'
                                }`}
                              >
                                {moderationLabel}
                              </span>
                            </div>

                            {/* Live Availability Badge */}
                            <div className='absolute bottom-3 left-3'>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-black shadow-md flex items-center gap-1.5 ${
                                  isAvailable
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-300' : 'bg-rose-300'} animate-pulse`} />
                                <span>{isAvailable ? 'Available for Booking' : 'Unavailable / Blocked'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Listing Card Details */}
                          <div className='p-5 space-y-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <h3 className='font-bold text-neutral-900 text-base line-clamp-1'>
                                {listing.title || listing.name}
                              </h3>
                              <div className='text-right shrink-0'>
                                <span className='text-sm font-black text-neutral-900'>
                                  ${listing.price || listing.regularPrice}
                                </span>
                                <span className='text-[10px] text-neutral-500'>
                                  /{listing.priceUnit || (isGuestHouse ? 'night' : 'day')}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center gap-1 text-xs text-neutral-500 truncate'>
                              <FaMapMarkerAlt className='text-rose-500 text-xs shrink-0' />
                              <span className='truncate'>{listing.city || listing.address || 'Makindye, Kampala'}</span>
                            </div>

                            {/* Blocked dates note if present */}
                            {!isAvailable && listing.availabilityNotes && (
                              <div className='p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5'>
                                <FaCalendarAlt className='shrink-0' />
                                <span className='truncate'>{listing.availabilityNotes}</span>
                              </div>
                            )}
                            {hasPendingAvailabilityRequest && (
                              <div className='p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5'>
                                <FaInfoCircle className='shrink-0' />
                                <span>Request sent. The listing remains live until an administrator confirms.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions Toolbar */}
                        <div className='p-5 pt-0 space-y-2.5 border-t border-neutral-100 mt-2 pt-4'>
                          {/* Live Availability Switch Button */}
                          <button
                            type='button'
                            onClick={() => handleToggleAvailability(listing)}
                            disabled={!isApprovedListing || hasPendingAvailabilityRequest}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                              !isApprovedListing || hasPendingAvailabilityRequest
                                ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                                : isAvailable
                                ? 'bg-black text-white hover:bg-neutral-800'
                                : 'bg-black text-white hover:bg-neutral-800'
                            }`}
                          >
                            <FaCalendarAlt />
                            <span>
                              {!isApprovedListing
                                ? 'Availability after approval'
                                : hasPendingAvailabilityRequest
                                ? 'Waiting for admin action'
                                : isAvailable
                                ? 'Request Unavailable'
                                : 'Mark Available Now'}
                            </span>
                          </button>

                          {/* Secondary Controls: Share, Dates, View, Delete */}
                          <div className='grid grid-cols-4 gap-1.5 pt-1'>
                            <button
                              type='button'
                              onClick={() => setShareModalListing(listing)}
                              title='Share listing link'
                              className='py-2 px-1 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer'
                            >
                              <FaShareAlt className='text-xs' />
                              <span className='hidden sm:inline'>Share</span>
                            </button>

                            <button
                              type='button'
                              onClick={() => setAvailModalListing(listing)}
                              disabled={!isApprovedListing || hasPendingAvailabilityRequest}
                              title='Block custom date range'
                              className='py-2 px-1 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-600 disabled:cursor-not-allowed'
                            >
                              <FaCalendarAlt className='text-xs' />
                              <span className='hidden sm:inline'>Dates</span>
                            </button>

                            <Link
                              to={`/listing/${listing.id}`}
                              title='Preview public listing page'
                              className='py-2 px-1 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs'
                            >
                              <FaEye className='text-xs' />
                              <span className='hidden sm:inline'>View</span>
                            </Link>

                            <button
                              type='button'
                              onClick={() => handleDeleteListing(listing.id, listing.title)}
                              title='Delete listing'
                              className='py-2 px-1 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer'
                            >
                              <FaTrash className='text-xs text-rose-400' />
                              <span className='hidden sm:inline text-rose-400'>Del</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Listings State */
                <div className='bg-white rounded-3xl border border-dashed border-neutral-300 py-16 sm:py-20 px-6 sm:px-12 text-center space-y-4'>
                  <div className='w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-2xl mx-auto shadow-2xs'>
                    🏡
                  </div>
                  <h3 className='text-2xl font-bold text-neutral-900 tracking-tight'>No listings posted yet</h3>
                  <p className='text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed'>
                    Ready to start earning? Add your boutique guest house or chauffeured vehicle in just a few minutes.
                  </p>
                  <div className='flex items-center justify-center gap-3 pt-3'>
                    <button
                      type='button'
                      onClick={() => setPortalTab('new_house')}
                      className='px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer'
                    >
                      <FaPlus className='text-[10px]' />
                      <span>List a Guest House</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => setPortalTab('new_car')}
                      className='px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer'
                    >
                      <FaPlus className='text-[10px]' />
                      <span>List a Vehicle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIST A GUEST HOUSE */}
          {/* ========================================================================= */}
          {portalTab === 'new_house' && (
            <div className='bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm space-y-6'>
              <div className='border-b border-neutral-100 pb-4'>
                <span className='text-[11px] font-extrabold uppercase tracking-wider text-neutral-400'>
                  Add Property to chento 100
                </span>
                <h2 className='text-2xl font-bold text-neutral-900 mt-0.5'>
                  List a Guest House, Studio, or Villa
                </h2>
                <p className='text-xs text-neutral-500 mt-1 leading-relaxed'>
                  Provide your guest accommodation details. Your submission will appear in your dashboard as pending until an administrator approves it.
                </p>
              </div>

              <form onSubmit={handleCreateGuestHouse} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  {/* Title */}
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Property Title *
                    </label>
                    <input
                      type='text'
                      value={ghForm.title}
                      onChange={(e) => setGhForm({ ...ghForm, title: e.target.value })}
                      placeholder='e.g. Modern Sunset Boutique Villa with Backup Generator'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                      required
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Neighborhood in Makindye Division *
                    </label>
                    <select
                      value={ghForm.city}
                      onChange={(e) => setGhForm({ ...ghForm, city: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    >
                      <option value='Muyenga'>Muyenga (Tank Hill)</option>
                      <option value='Munyonyo'>Munyonyo (Waterfront & Marina)</option>
                      <option value='Buziga'>Buziga (Buziga Hill)</option>
                      <option value='Ggaba'>Ggaba (Lake Victoria Shore)</option>
                      <option value='Kansanga'>Kansanga (Ggaba Road Corridor)</option>
                      <option value='Makindye'>Makindye (Makindye Hill / Division HQ)</option>
                      <option value='Kabalagala'>Kabalagala (Dining & Entertainment)</option>
                      <option value='Nsambya'>Nsambya (Historic Enclave)</option>
                      <option value='Kibuli'>Kibuli (Scenic Hill)</option>
                      <option value='Luwafu'>Luwafu (Residential)</option>
                      <option value='Katwe'>Katwe</option>
                      <option value='Kisugu'>Kisugu</option>
                      <option value='Wabigalo'>Wabigalo</option>
                      <option value='Salaama'>Salaama / Munyonyo Corridor</option>
                      <option value='Lukuli'>Lukuli / Konge</option>
                      <option value='Bunga'>Bunga</option>
                      <option value='Other Makindye'>Other (Makindye Division, Kampala)</option>
                    </select>
                  </div>

                  {/* Neighborhood / Address */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Street / Local Address
                    </label>
                    <input
                      type='text'
                      value={ghForm.address}
                      onChange={(e) => setGhForm({ ...ghForm, address: e.target.value })}
                      placeholder='e.g. Tank Hill Road, near Lake Victoria view'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    />
                  </div>

                  {/* Nightly Price */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Nightly Rate (USD) *
                    </label>
                    <input
                      type='number'
                      min='10'
                      max='2000'
                      value={ghForm.price}
                      onChange={(e) => setGhForm({ ...ghForm, price: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                      required
                    />
                  </div>

                  {/* Specs: Bedrooms, Baths, Max Guests */}
                  <div className='grid grid-cols-3 gap-2'>
                    <div>
                      <label className='block text-[11px] font-bold text-neutral-800 mb-1.5'>
                        Bedrooms
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='20'
                        value={ghForm.bedrooms}
                        onChange={(e) => setGhForm({ ...ghForm, bedrooms: e.target.value })}
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-[11px] font-bold text-neutral-800 mb-1.5'>
                        Bathrooms
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='10'
                        value={ghForm.bathrooms}
                        onChange={(e) => setGhForm({ ...ghForm, bathrooms: e.target.value })}
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-[11px] font-bold text-neutral-800 mb-1.5'>
                        Max Guests
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='30'
                        value={ghForm.maxGuests}
                        onChange={(e) => setGhForm({ ...ghForm, maxGuests: e.target.value })}
                        className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Description
                    </label>
                    <textarea
                      rows='3'
                      value={ghForm.description}
                      onChange={(e) => setGhForm({ ...ghForm, description: e.target.value })}
                      placeholder='Describe your accommodation, neighborhood, peace of mind, backup water/power features...'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    />
                  </div>

                  {/* Amenities */}
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Amenities (comma separated)
                    </label>
                    <input
                      type='text'
                      value={ghForm.amenities}
                      onChange={(e) => setGhForm({ ...ghForm, amenities: e.target.value })}
                      placeholder='WiFi, Air Conditioning, Hot Water, Backup Generator, Kitchen, Free Parking'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    />
                  </div>

                  {/* Photo Management */}
                  <div className='md:col-span-2 space-y-3 bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200'>
                    <div>
                      <label className='block text-xs font-bold text-neutral-900'>
                        Property Photos ({ghForm.imageUrls.length})
                      </label>
                      <span className='text-neutral-500 text-[11px] block'>
                        {ghForm.imageUrls.length > 0
                          ? 'The first photo serves as the main search cover'
                          : 'Add property photos using device camera or file upload'}
                      </span>
                    </div>

                    {/* Camera & Local File Upload Area */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {/* Option 1: Live Device Camera Capture */}
                      <button
                        type='button'
                        onClick={() => {
                          setCameraTarget('gh');
                          setCameraModalOpen(true);
                        }}
                        id='partner-gh-open-camera-btn'
                        className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50/90 rounded-2xl transition cursor-pointer group text-center'
                      >
                        <div className='w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                            />
                            <circle cx='12' cy='13' r='3' strokeWidth='2' />
                          </svg>
                        </div>
                        <span className='text-xs font-bold text-indigo-950 group-hover:text-indigo-900 flex items-center gap-1.5'>
                          Take Photo with Camera
                          <span className='text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded-full font-medium'>
                            Live
                          </span>
                        </span>
                        <span className='text-[11px] text-neutral-500 mt-0.5'>
                          Snap photos with laptop webcam or mobile camera
                        </span>
                      </button>

                      {/* Option 2: Choose Images from Device */}
                      <div className='relative'>
                        <input
                          type='file'
                          id='partner-gh-local-photos'
                          accept='image/*'
                          multiple
                          onChange={(e) => {
                            handleProcessLocalFiles(e.target.files, 'gh');
                            e.target.value = '';
                          }}
                          className='hidden'
                        />
                        <label
                          htmlFor='partner-gh-local-photos'
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer?.files) {
                              handleProcessLocalFiles(e.dataTransfer.files, 'gh');
                            }
                          }}
                          className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl transition cursor-pointer group text-center h-full'
                        >
                          <div className='w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                            </svg>
                          </div>
                          <span className='text-xs font-bold text-emerald-950 group-hover:text-emerald-900'>
                            Choose Images from Device
                          </span>
                          <span className='text-[11px] text-neutral-500 mt-0.5'>
                            Browse local files or drag &amp; drop photos (.jpg, .png)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Direct Mobile Quick Camera Trigger */}
                    <div className='flex items-center justify-between px-3.5 py-2 bg-neutral-100 rounded-xl text-xs text-neutral-600 border border-neutral-200'>
                      <span className='text-[11px] text-neutral-600 flex items-center gap-1.5'>
                        <FaCamera className='text-neutral-500' />
                        Mobile camera shortcut:
                      </span>
                      <input
                        type='file'
                        accept='image/*'
                        capture='environment'
                        id='partner-gh-direct-camera'
                        className='hidden'
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setCameraTarget('gh');
                            handleProcessCameraPhoto(e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                      />
                      <label
                        htmlFor='partner-gh-direct-camera'
                        className='text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline text-[11px]'
                      >
                        Launch Native Device Camera App
                      </label>
                    </div>

                    {/* Progress / Status Notice */}
                    {isProcessingImages && (
                      <div className='p-2 bg-indigo-100/80 text-indigo-900 rounded-xl text-xs flex items-center justify-center gap-2 font-medium animate-pulse'>
                        <span className='w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin' />
                        <span>Optimizing and processing photos...</span>
                      </div>
                    )}
                    {imageNotice && !isProcessingImages && (
                      <div className='p-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs text-center font-medium'>
                        {imageNotice}
                      </div>
                    )}

                    {/* Direct URL addition */}
                    <div className='pt-1'>
                      <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1'>
                        Or Add by Web URL
                      </span>
                      <div className='flex gap-2'>
                        <input
                          type='url'
                          placeholder='Paste direct image URL (https://... or /images/...)'
                          value={ghForm.customImageUrl}
                          onChange={(e) => setGhForm({ ...ghForm, customImageUrl: e.target.value })}
                          className='flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-black'
                        />
                        <button
                          type='button'
                          onClick={() => {
                            if (ghForm.customImageUrl.trim()) {
                              setGhForm({
                                ...ghForm,
                                imageUrls: [...ghForm.imageUrls, ghForm.customImageUrl.trim()],
                                customImageUrl: '',
                              });
                            }
                          }}
                          className='px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer'
                        >
                          Add Photo
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail Gallery with Cover Badge and Delete Button */}
                    {ghForm.imageUrls.length > 0 ? (
                      <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs'>
                        {ghForm.imageUrls.map((url, i) => (
                          <div key={i} className='relative h-20 rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100'>
                            <img
                              src={url}
                              alt={`Property photo ${i + 1}`}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/airbnb_apartment_living.jpg';
                              }}
                            />
                            {i === 0 && (
                              <span className='absolute bottom-1 left-1 bg-black/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded'>
                                Cover
                              </span>
                            )}
                            <button
                              type='button'
                              onClick={() =>
                                setGhForm({
                                  ...ghForm,
                                  imageUrls: ghForm.imageUrls.filter((_, idx) => idx !== i),
                                })
                              }
                              className='absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-[10px] opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs'
                              title='Remove photo'
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='p-4 rounded-xl border border-dashed border-neutral-300 bg-white text-center text-xs text-neutral-500'>
                        <p className='font-bold text-neutral-800'>No photos added yet</p>
                        <p className='text-[11px] text-neutral-400 mt-0.5'>
                          Use the camera option above or select photos from your device to showcase this property.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className='pt-4 border-t border-neutral-100 flex items-center justify-between'>
                  <button
                    type='button'
                    onClick={() => setPortalTab('listings')}
                    className='px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold transition'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={formSubmitting}
                    className='px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60'
                  >
                    <FaCheck />
                    <span>{formSubmitting ? 'Publishing...' : 'Publish Guest House Listing'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LIST A VEHICLE */}
          {/* ========================================================================= */}
          {portalTab === 'new_car' && (
            <div className='bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm space-y-6'>
              <div className='border-b border-neutral-100 pb-4'>
                <span className='text-[11px] font-extrabold uppercase tracking-wider text-neutral-400'>
                  Add Vehicle to chento 100 Fleet
                </span>
                <h2 className='text-2xl font-bold text-neutral-900 mt-0.5'>
                  List a Private Car, SUV, or Chauffeur Service
                </h2>
                <p className='text-xs text-neutral-500 mt-1 leading-relaxed'>
                  Offer airport transfers, corporate rides, or cross-country tours. Your vehicle listing will remain pending in your dashboard until an administrator approves it.
                </p>
              </div>

              <form onSubmit={handleCreateVehicle} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  {/* Make & Model */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Vehicle Make *
                    </label>
                    <input
                      type='text'
                      value={carForm.make}
                      onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                      placeholder='Toyota, Nissan, Hyundai, Mercedes...'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Vehicle Model *
                    </label>
                    <input
                      type='text'
                      value={carForm.model}
                      onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                      placeholder='Land Cruiser Prado, Corolla, RAV4...'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                      required
                    />
                  </div>

                  {/* Title / Headline */}
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Listing Headline
                    </label>
                    <input
                      type='text'
                      value={carForm.title}
                      onChange={(e) => setCarForm({ ...carForm, title: e.target.value })}
                      placeholder='e.g. Executive Prado 4x4 with Chauffeur for Airport & Tours'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    />
                  </div>

                  {/* Daily Price */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Daily Lease Rate (USD) *
                    </label>
                    <input
                      type='number'
                      min='20'
                      max='1500'
                      value={carForm.price}
                      onChange={(e) => setCarForm({ ...carForm, price: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                      required
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Model Year
                    </label>
                    <input
                      type='number'
                      min='2000'
                      max={new Date().getFullYear() + 1}
                      value={carForm.year}
                      onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                    />
                  </div>

                  {/* Transmission and Seats */}
                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Base Neighborhood in Makindye *
                    </label>
                    <select
                      value={carForm.city}
                      onChange={(e) => setCarForm({ ...carForm, city: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    >
                      <option value='Makindye'>Makindye (Makindye Hill)</option>
                      <option value='Muyenga'>Muyenga (Tank Hill)</option>
                      <option value='Munyonyo'>Munyonyo (Waterfront & Marina)</option>
                      <option value='Buziga'>Buziga (Buziga Hill)</option>
                      <option value='Ggaba'>Ggaba (Lake Victoria Shore)</option>
                      <option value='Kansanga'>Kansanga (Ggaba Road Corridor)</option>
                      <option value='Kabalagala'>Kabalagala (Dining & Entertainment)</option>
                      <option value='Nsambya'>Nsambya (Historic Enclave)</option>
                      <option value='Kibuli'>Kibuli (Scenic Hill)</option>
                      <option value='Luwafu'>Luwafu</option>
                      <option value='Katwe'>Katwe</option>
                      <option value='Kisugu'>Kisugu</option>
                      <option value='Salaama'>Salaama</option>
                      <option value='Bunga'>Bunga</option>
                      <option value='Other Makindye'>Other (Makindye Division, Kampala)</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Transmission
                    </label>
                    <select
                      value={carForm.transmission}
                      onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                    >
                      <option value='Automatic'>Automatic</option>
                      <option value='Manual'>Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Seating Capacity
                    </label>
                    <input
                      type='number'
                      min='2'
                      max='15'
                      value={carForm.seats}
                      onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })}
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm'
                    />
                  </div>

                  {/* Driver Options */}
                  <div className='md:col-span-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3'>
                    <div className='flex items-center gap-3'>
                      <input
                        type='checkbox'
                        id='driverIncludedCheck'
                        checked={carForm.driverIncluded}
                        onChange={(e) => setCarForm({ ...carForm, driverIncluded: e.target.checked })}
                        className='w-4 h-4 accent-black'
                      />
                      <label htmlFor='driverIncludedCheck' className='text-xs font-bold text-neutral-900 cursor-pointer'>
                        Professional Chauffeur / Driver Included in Rate
                      </label>
                    </div>

                    {carForm.driverIncluded && (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                        <div>
                          <label className='block text-[11px] font-bold text-neutral-700 mb-1'>
                            Driver Name
                          </label>
                          <input
                            type='text'
                            value={carForm.driverName}
                            onChange={(e) => setCarForm({ ...carForm, driverName: e.target.value })}
                            placeholder='e.g. Marcus Vance'
                            className='w-full p-2.5 bg-white border border-neutral-300 rounded-xl text-xs'
                          />
                        </div>
                        <div>
                          <label className='block text-[11px] font-bold text-neutral-700 mb-1'>
                            Driver Phone / WhatsApp
                          </label>
                          <input
                            type='tel'
                            value={carForm.driverContact}
                            onChange={(e) => setCarForm({ ...carForm, driverContact: e.target.value })}
                            placeholder='+291 7 123 456'
                            className='w-full p-2.5 bg-white border border-neutral-300 rounded-xl text-xs'
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-neutral-800 mb-1.5'>
                      Description
                    </label>
                    <textarea
                      rows='3'
                      value={carForm.description}
                      onChange={(e) => setCarForm({ ...carForm, description: e.target.value })}
                      placeholder='Highlight AC condition, clean leather seats, airport pickup availability, fuel terms...'
                      className='w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:bg-white'
                    />
                  </div>

                  {/* Photos */}
                  <div className='md:col-span-2 space-y-3 bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200'>
                    <div>
                      <label className='block text-xs font-bold text-neutral-900'>
                        Vehicle Photos ({carForm.imageUrls.length})
                      </label>
                      <span className='text-neutral-500 text-[11px] block'>
                        {carForm.imageUrls.length > 0
                          ? 'The first photo serves as the main search cover'
                          : 'Add vehicle photos using device camera or file upload'}
                      </span>
                    </div>

                    {/* Camera & Local File Upload Area */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {/* Option 1: Live Device Camera Capture */}
                      <button
                        type='button'
                        onClick={() => {
                          setCameraTarget('car');
                          setCameraModalOpen(true);
                        }}
                        id='partner-car-open-camera-btn'
                        className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50/90 rounded-2xl transition cursor-pointer group text-center'
                      >
                        <div className='w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                            />
                            <circle cx='12' cy='13' r='3' strokeWidth='2' />
                          </svg>
                        </div>
                        <span className='text-xs font-bold text-indigo-950 group-hover:text-indigo-900 flex items-center gap-1.5'>
                          Take Photo with Camera
                          <span className='text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded-full font-medium'>
                            Live
                          </span>
                        </span>
                        <span className='text-[11px] text-neutral-500 mt-0.5'>
                          Snap photos with laptop webcam or mobile camera
                        </span>
                      </button>

                      {/* Option 2: Choose Images from Device */}
                      <div className='relative'>
                        <input
                          type='file'
                          id='partner-car-local-photos'
                          accept='image/*'
                          multiple
                          onChange={(e) => {
                            handleProcessLocalFiles(e.target.files, 'car');
                            e.target.value = '';
                          }}
                          className='hidden'
                        />
                        <label
                          htmlFor='partner-car-local-photos'
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer?.files) {
                              handleProcessLocalFiles(e.dataTransfer.files, 'car');
                            }
                          }}
                          className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl transition cursor-pointer group text-center h-full'
                        >
                          <div className='w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                            </svg>
                          </div>
                          <span className='text-xs font-bold text-emerald-950 group-hover:text-emerald-900'>
                            Choose Images from Device
                          </span>
                          <span className='text-[11px] text-neutral-500 mt-0.5'>
                            Browse local files or drag &amp; drop photos (.jpg, .png)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Direct Mobile Quick Camera Trigger */}
                    <div className='flex items-center justify-between px-3.5 py-2 bg-neutral-100 rounded-xl text-xs text-neutral-600 border border-neutral-200'>
                      <span className='text-[11px] text-neutral-600 flex items-center gap-1.5'>
                        <FaCamera className='text-neutral-500' />
                        Mobile camera shortcut:
                      </span>
                      <input
                        type='file'
                        accept='image/*'
                        capture='environment'
                        id='partner-car-direct-camera'
                        className='hidden'
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setCameraTarget('car');
                            handleProcessCameraPhoto(e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                      />
                      <label
                        htmlFor='partner-car-direct-camera'
                        className='text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline text-[11px]'
                      >
                        Launch Native Device Camera App
                      </label>
                    </div>

                    {/* Progress / Status Notice */}
                    {isProcessingImages && (
                      <div className='p-2 bg-indigo-100/80 text-indigo-900 rounded-xl text-xs flex items-center justify-center gap-2 font-medium animate-pulse'>
                        <span className='w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin' />
                        <span>Optimizing and processing photos...</span>
                      </div>
                    )}
                    {imageNotice && !isProcessingImages && (
                      <div className='p-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs text-center font-medium'>
                        {imageNotice}
                      </div>
                    )}

                    {/* Direct URL addition */}
                    <div className='pt-1'>
                      <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1'>
                        Or Add by Web URL
                      </span>
                      <div className='flex gap-2'>
                        <input
                          type='url'
                          placeholder='Paste direct image URL (https://... or /images/...)'
                          value={carForm.customImageUrl}
                          onChange={(e) => setCarForm({ ...carForm, customImageUrl: e.target.value })}
                          className='flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-black'
                        />
                        <button
                          type='button'
                          onClick={() => {
                            if (carForm.customImageUrl.trim()) {
                              setCarForm({
                                ...carForm,
                                imageUrls: [...carForm.imageUrls, carForm.customImageUrl.trim()],
                                customImageUrl: '',
                              });
                            }
                          }}
                          className='px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer'
                        >
                          Add Photo
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail Gallery with Cover Badge and Delete Button */}
                    {carForm.imageUrls.length > 0 ? (
                      <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs'>
                        {carForm.imageUrls.map((url, i) => (
                          <div key={i} className='relative h-20 rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100'>
                            <img
                              src={url}
                              alt={`Vehicle photo ${i + 1}`}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/city_regular_sedan.jpg';
                              }}
                            />
                            {i === 0 && (
                              <span className='absolute bottom-1 left-1 bg-black/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded'>
                                Cover
                              </span>
                            )}
                            <button
                              type='button'
                              onClick={() =>
                                setCarForm({
                                  ...carForm,
                                  imageUrls: carForm.imageUrls.filter((_, idx) => idx !== i),
                                })
                              }
                              className='absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-[10px] opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs'
                              title='Remove photo'
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='p-4 rounded-xl border border-dashed border-neutral-300 bg-white text-center text-xs text-neutral-500'>
                        <p className='font-bold text-neutral-800'>No photos added yet</p>
                        <p className='text-[11px] text-neutral-400 mt-0.5'>
                          Use the camera option above or select photos from your device to showcase this vehicle.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className='pt-4 border-t border-neutral-100 flex items-center justify-between'>
                  <button
                    type='button'
                    onClick={() => setPortalTab('listings')}
                    className='px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold transition'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={formSubmitting}
                    className='px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60'
                  >
                    <FaCheck />
                    <span>{formSubmitting ? 'Publishing...' : 'Publish Vehicle Listing'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: AVAILABILITY & CALENDAR MANAGER */}
          {/* ========================================================================= */}
          {portalTab === 'availability' && (
            <div className='bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm space-y-6'>
              <div className='border-b border-neutral-100 pb-4'>
                <span className='text-[11px] font-extrabold uppercase tracking-wider text-neutral-400'>
                  Real-Time Calendar Control
                </span>
                <h2 className='text-2xl font-bold text-neutral-900 mt-0.5'>
                  Listing Availability &amp; Booking Status
                </h2>
                <p className='text-xs text-neutral-500 mt-1 leading-relaxed'>
                  Approved listings can be marked available immediately. Requests to mark a listing unavailable are sent to the admin team for confirmation.
                </p>
              </div>

              {listings.length > 0 ? (
                <div className='space-y-4'>
                  {listings.map((item) => {
                    const isAvail = item.isAvailable !== false && item.available !== false;
                    const isApprovedListing = item.status === 'approved' || item.isApproved === true;
                    const hasPendingAvailabilityRequest = item.availabilityRequest?.status === 'pending';
                    const isGH = item.type === 'guesthouse' || item.category === 'guesthouse';

                    return (
                      <div
                        key={item.id}
                        className='p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-white hover:border-neutral-300'
                      >
                        <div className='flex items-center gap-3.5'>
                          <div className='w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200'>
                            <img
                              src={item.images?.[0] || item.imageUrls?.[0] || '/images/airbnb_apartment_living.jpg'}
                              alt=''
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <div>
                            <div className='flex items-center gap-2'>
                              <h4 className='font-bold text-neutral-900 text-sm'>
                                {item.title || item.name}
                              </h4>
                              <span className='text-[10px] text-neutral-500 uppercase'>
                                ({isGH ? 'Property' : 'Vehicle'})
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-neutral-500 mt-0.5'>
                              <span>${item.price}/{item.priceUnit || (isGH ? 'night' : 'day')}</span>
                              <span>•</span>
                              <span>{item.city || 'Makindye, Kampala'}</span>
                              {item.availabilityNotes && (
                                <>
                                  <span>•</span>
                                  <span className='text-rose-600 font-medium'>
                                    {item.availabilityNotes}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 w-full md:w-auto justify-end flex-wrap'>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isAvail
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isAvail ? '🟢 Available Now' : '🔴 Blocked / Booked'}
                          </span>
                          {!isApprovedListing && (
                            <span className='px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800'>
                              {item.status === 'rejected' ? 'Rejected' : 'Pending approval'}
                            </span>
                          )}
                          {hasPendingAvailabilityRequest && (
                            <span className='px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800'>
                              Waiting for admin
                            </span>
                          )}

                          <button
                            type='button'
                            onClick={() => handleToggleAvailability(item)}
                            disabled={!isApprovedListing || hasPendingAvailabilityRequest}
                            className='px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-600 disabled:cursor-not-allowed'
                          >
                            {!isApprovedListing
                              ? 'Available after approval'
                              : hasPendingAvailabilityRequest
                              ? 'Waiting for admin'
                              : isAvail
                              ? 'Request Unavailable'
                              : 'Turn On (Available)'}
                          </button>

                          <button
                            type='button'
                            onClick={() => setAvailModalListing(item)}
                            disabled={!isApprovedListing || hasPendingAvailabilityRequest}
                            className='px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-600 disabled:cursor-not-allowed'
                          >
                            Set Dates
                          </button>

                          <button
                            type='button'
                            onClick={() => setShareModalListing(item)}
                            className='px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer'
                            title='Share'
                          >
                            <FaShareAlt />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8 text-neutral-500 text-xs'>
                  You have not created any listings yet. Create a guest house or vehicle listing first to manage its availability.
                </div>
              )}
            </div>
          )}
        </section>

      {/* Interactive Device Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleProcessCameraPhoto}
        maxAllowed={8}
        currentCount={cameraTarget === 'gh' ? ghForm.imageUrls.length : carForm.imageUrls.length}
      />
    </div>
  );
}
