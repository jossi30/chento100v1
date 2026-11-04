import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../services/listingService';
import { compressImage } from '../utils/imageCompressor';
import CameraCaptureModal from '../components/CameraCaptureModal';

export default function CreateListing() {
  const { t } = useLanguage();
  const reduxUser = useSelector((state) => state.user.currentUser);
  const { currentUser: authUser, isEmailVerified, isAdmin } = useAuth();
  const currentUser = authUser || reduxUser;
  const navigate = useNavigate();

  const [category, setCategory] = useState('guesthouse'); // 'guesthouse' | 'car_service'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedListing, setSubmittedListing] = useState(null);

  // Form state mirroring admin property structure
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    regularPrice: '120',
    discountPrice: '',
    offer: false,
    isApproved: Boolean(isAdmin),
    active: true,
    // Guesthouse
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    furnished: true,
    parking: true,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning'],
    // Car Service
    make: 'Toyota',
    model: 'Camry Sedan',
    year: 2023,
    seats: 4,
    transmission: 'automatic',
    driverIncluded: true,
    driverName: '',
    driverContact: '',
    luggageCapacity: 2,
    imageUrls: [],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [isProcessingLocalImages, setIsProcessingLocalImages] = useState(false);
  const [localImageNotice, setLocalImageNotice] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'car_service') {
      setFormData((prev) => ({
        ...prev,
        regularPrice: prev.regularPrice === '120' ? '75' : prev.regularPrice,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        regularPrice: prev.regularPrice === '75' ? '120' : prev.regularPrice,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImageUrl = (idx) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== idx),
    }));
  };



  const handleProcessLocalFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Please select valid image files (.jpg, .png, .webp).');
      return;
    }

    try {
      setIsProcessingLocalImages(true);
      setLocalImageNotice(`Optimizing ${files.length} photo${files.length > 1 ? 's' : ''} from local device...`);
      setError(null);

      const compressedUrls = [];
      for (const file of files) {
        const url = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        if (url) compressedUrls.push(url);
      }

      if (compressedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...compressedUrls],
        }));
        setLocalImageNotice(`Added ${compressedUrls.length} photo${compressedUrls.length > 1 ? 's' : ''} successfully!`);
        setTimeout(() => setLocalImageNotice(''), 3500);
      }
    } catch (err) {
      console.error('Error processing local images in listing portal:', err);
      setError('Failed to process image file from local device.');
    } finally {
      setIsProcessingLocalImages(false);
    }
  };

  const handleProcessCameraPhoto = async (file) => {
    if (!file) return;
    try {
      setIsProcessingLocalImages(true);
      setLocalImageNotice('Optimizing photo captured with device camera...');
      const url = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      if (url) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, url],
        }));
        setLocalImageNotice('✓ Photo captured with camera added to listing!');
        setTimeout(() => setLocalImageNotice(''), 3500);
      }
    } catch (err) {
      console.error('Camera photo error in listing portal:', err);
      setError('Failed to process photo captured with camera.');
    } finally {
      setIsProcessingLocalImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('You must be signed in to create a listing.');
      return;
    }

    if (!isEmailVerified && !isAdmin) {
      setError('Email verification required: You must verify your email address before publishing listings.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please provide a listing title.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please provide a location/address.');
      return;
    }
    if (!formData.regularPrice || Number(formData.regularPrice) <= 0) {
      setError('Please provide a valid regular price.');
      return;
    }
    if (formData.imageUrls.length === 0) {
      setError('Please add at least one image URL for the listing.');
      return;
    }

    try {
      setLoading(true);

      const listingStatus = isAdmin
        ? (formData.isApproved ? 'approved' : 'pending')
        : 'pending';

      const payload = {
        category,
        type: category === 'car_service' ? 'car' : 'guesthouse',
        propertyType: category === 'car_service' ? 'sale' : 'rent',
        title: formData.title.trim(),
        name: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        address: formData.location.trim(),
        city: formData.location.trim().split(',')[0].trim() || 'Makindye',
        regularPrice: Number(formData.regularPrice),
        price: Number(formData.regularPrice),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        discountedPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        offer: Boolean(formData.offer),
        priceUnit: category === 'car_service' ? 'day' : 'night',
        currency: 'USD',
        status: listingStatus,
        isApproved: listingStatus === 'approved',
        active: Boolean(formData.active),
        isActive: Boolean(formData.active),
        images: formData.imageUrls,
        imageUrls: formData.imageUrls,
        // Guesthouse
        bedrooms: Number(formData.bedrooms || 1),
        bathrooms: Number(formData.bathrooms || 1),
        maxGuests: Number(formData.maxGuests || 2),
        furnished: Boolean(formData.furnished),
        parking: Boolean(formData.parking),
        amenities: formData.amenities,
        // Car
        make: formData.make || '',
        model: formData.model || '',
        year: Number(formData.year || 2024),
        seats: Number(formData.seats || 4),
        transmission: formData.transmission || 'automatic',
        driverIncluded: Boolean(formData.driverIncluded),
        driverName: formData.driverName || '',
        driverContact: formData.driverContact || '',
        luggageCapacity: Number(formData.luggageCapacity || 2),
      };

      const created = await createListing(payload, currentUser);
      setLoading(false);
      setSubmittedListing(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Create listing error:', err);
      setError(err.message || 'Failed to create listing. Please try again.');
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedListing(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      regularPrice: '120',
      discountPrice: '',
      offer: false,
      isApproved: Boolean(isAdmin),
      active: true,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      furnished: true,
      parking: true,
      amenities: ['WiFi', 'Kitchen', 'Air Conditioning'],
      make: 'Toyota',
      model: 'Camry Sedan',
      year: 2023,
      seats: 4,
      transmission: 'automatic',
      driverIncluded: true,
      driverName: '',
      driverContact: '',
      luggageCapacity: 2,
      imageUrls: [
        '/images/airbnb_apartment_living.jpg',
        '/images/airbnb_apartment_bed.jpg',
      ],
    });
  };

  return (
    <main className='py-8 px-4 sm:px-6 max-w-3xl mx-auto'>
      {/* Top Banner Navigation */}
      <div className='flex items-center justify-between mb-4'>
        <Link
          to='/profile'
          className='inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Back to Profile
        </Link>
        <Link
          to='/partner'
          className='inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 transition'
        >
          Partner Portal &amp; Calendar Availability →
        </Link>
      </div>

      {/* Email Verification Warning Banner */}
      {!isEmailVerified && !isAdmin && (
        <div className='mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs'>
          <div>
            <p className='font-bold text-sm text-amber-950 mb-0.5'>Email Verification Required</p>
            <p className='text-amber-800'>
              You must verify your email address ({currentUser?.email}) before publishing guest houses or car leasing listings.
            </p>
          </div>
          <Link
            to='/verify-email'
            className='shrink-0 inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-xs'
          >
            Verify Email Now →
          </Link>
        </div>
      )}

      {/* Success Notification */}
      {submittedListing && (
        <div
          id='success-submission-banner'
          className='mb-8 p-6 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm text-slate-800 animate-fadeIn'
        >
          <div className='flex items-start gap-4'>
            <div className='p-3 bg-emerald-100 text-emerald-700 rounded-full shrink-0 mt-1'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-2 mb-1'>
                <h2 className='text-xl font-bold text-emerald-900'>
                  Listing Submitted Successfully!
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    submittedListing.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {submittedListing.status === 'approved' ? 'Approved & Live' : 'Pending Admin Review'}
                </span>
              </div>
              <p className='text-slate-700 text-sm md:text-base leading-relaxed mb-4'>
                Thank you! Your listing{' '}
                <strong className='text-slate-900 font-semibold'>
                  &ldquo;{submittedListing.title || submittedListing.name}&rdquo;
                </strong>{' '}
                has been submitted {submittedListing.status === 'approved' ? 'and is now live in search and catalog!' : 'and is currently pending moderation. Our team will verify and approve your submission promptly.'}
              </p>

              <div className='flex flex-wrap gap-3 pt-2'>
                <Link
                  to={`/listing/${submittedListing._id || submittedListing.id}`}
                  className='px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition'
                >
                  Preview Listing
                </Link>
                <Link
                  to='/profile'
                  className='px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition'
                >
                  Go to My Listings
                </Link>
                <button
                  type='button'
                  onClick={handleResetForm}
                  className='px-5 py-2.5 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/50 text-sm font-medium rounded-lg transition cursor-pointer'
                >
                  + Submit Another Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Listing Structure Mirroring Admin Adding Properties Exactly */}
      <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8'>
        {/* Structure Header */}
        <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-5'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-900 text-white'>
                Listing Portal
              </span>
              <span className='text-xs text-slate-500 font-medium'>
                {isAdmin ? 'Admin Direct Publishing' : 'Add property or chauffeured vehicle to platform directory'}
              </span>
            </div>
            <h1 className='text-2xl font-bold text-slate-900'>
              {t('create.title') || 'Add New Listing'}
            </h1>
          </div>
        </div>

        {error && (
          <div className='mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2'>
            <svg className='w-4 h-4 text-rose-500 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Category Toggle Tabs */}
          <div>
            <label className='block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2'>
              Listing Category
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => handleCategoryChange('guesthouse')}
                className={`py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  category === 'guesthouse'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    category === 'guesthouse' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
                  </svg>
                </div>
                <div>
                  <div className='text-sm font-bold text-slate-900'>Guest House / Airbnb</div>
                  <div className='text-xs text-slate-500'>Furnished apartments &amp; guest suites</div>
                </div>
              </button>

              <button
                type='button'
                onClick={() => handleCategoryChange('car_service')}
                className={`py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  category === 'car_service'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    category === 'car_service' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
                  </svg>
                </div>
                <div>
                  <div className='text-sm font-bold text-slate-900'>Car Rental with Driver</div>
                  <div className='text-xs text-slate-500'>Sedans, SUVs with private chauffeur</div>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Info: Title & Location */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-slate-700 mb-1'>
                Listing Title <span className='text-rose-500'>*</span>
              </label>
              <input
                type='text'
                name='title'
                value={formData.title}
                onChange={handleChange}
                placeholder={
                  category === 'guesthouse'
                    ? 'e.g. Modern Sunset Studio Airbnb with Balcony'
                    : 'e.g. Toyota Camry Executive City Sedan with Chauffeur'
                }
                required
                className='w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-700 mb-1'>
                Makindye Neighborhood / Route <span className='text-rose-500'>*</span>
              </label>
              <input
                type='text'
                name='location'
                list='makindye-neighborhoods'
                value={formData.location}
                onChange={handleChange}
                placeholder='e.g. Tank Hill Road, Muyenga, Makindye Division, Kampala'
                required
                className='w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white'
              />
              <datalist id='makindye-neighborhoods'>
                <option value='Muyenga (Tank Hill), Makindye Division, Kampala' />
                <option value='Munyonyo Waterfront, Makindye Division, Kampala' />
                <option value='Buziga Hill, Makindye Division, Kampala' />
                <option value='Ggaba Shore & Marina, Makindye Division, Kampala' />
                <option value='Kansanga (Ggaba Road), Makindye Division, Kampala' />
                <option value='Makindye Hill, Makindye Division, Kampala' />
                <option value='Kabalagala, Makindye Division, Kampala' />
                <option value='Nsambya, Makindye Division, Kampala' />
                <option value='Kibuli, Makindye Division, Kampala' />
                <option value='Luwafu, Makindye Division, Kampala' />
                <option value='Katwe, Makindye Division, Kampala' />
                <option value='Kisugu, Makindye Division, Kampala' />
                <option value='Wabigalo, Makindye Division, Kampala' />
                <option value='Salaama, Makindye Division, Kampala' />
                <option value='Lukuli / Konge, Makindye Division, Kampala' />
                <option value='Bunga, Makindye Division, Kampala' />
              </datalist>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className='block text-xs font-semibold text-slate-700 mb-1'>
              Detailed Description
            </label>
            <textarea
              name='description'
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder='Describe key features, comfort, interior perks, self check-in, or route details...'
              className='w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white'
            />
          </div>

          {/* Pricing Row */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200'>
            <div>
              <label className='block text-xs font-semibold text-slate-700 mb-1'>
                Regular Rate ($ {category === 'guesthouse' ? '/night' : '/day'}) <span className='text-rose-500'>*</span>
              </label>
              <input
                type='number'
                name='regularPrice'
                min='1'
                value={formData.regularPrice}
                onChange={handleChange}
                placeholder='120'
                required
                className='w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-700 mb-1'>
                Discounted Rate ($) <span className='text-slate-400 font-normal'>(Optional)</span>
              </label>
              <input
                type='number'
                name='discountPrice'
                min='0'
                value={formData.discountPrice}
                onChange={handleChange}
                placeholder='95'
                className='w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800'
              />
            </div>

            <div className='flex items-center sm:pt-6'>
              <label className='inline-flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  name='offer'
                  checked={formData.offer}
                  onChange={handleChange}
                  className='w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500'
                />
                <span className='text-xs font-semibold text-slate-700'>
                  Display Special Deal Badge
                </span>
              </label>
            </div>
          </div>

          {/* Category-Specific Fields */}
          {category === 'guesthouse' ? (
            <div className='space-y-4 p-4 bg-blue-50/40 rounded-xl border border-blue-100'>
              <div className='text-xs font-bold uppercase tracking-wider text-blue-900'>
                Guest House Specifications
              </div>
              <div className='grid grid-cols-3 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Bedrooms</label>
                  <input
                    type='number'
                    name='bedrooms'
                    min='1'
                    max='20'
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Bathrooms</label>
                  <input
                    type='number'
                    name='bathrooms'
                    min='1'
                    max='10'
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Max Guests</label>
                  <input
                    type='number'
                    name='maxGuests'
                    min='1'
                    max='50'
                    value={formData.maxGuests}
                    onChange={handleChange}
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className='block text-xs font-medium text-slate-700 mb-1.5'>
                  Key Amenities
                </label>
                <div className='flex flex-wrap gap-2'>
                  {['WiFi', 'Kitchen', 'Air Conditioning', 'Workspace', 'Balcony', 'Pool', 'Smart TV'].map(
                    (item) => (
                      <button
                        type='button'
                        key={item}
                        onClick={() => handleAmenityToggle(item)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          formData.amenities.includes(item)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {formData.amenities.includes(item) ? '✓ ' : '+ '}
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className='flex gap-4 pt-1'>
                <label className='inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700'>
                  <input
                    type='checkbox'
                    name='furnished'
                    checked={formData.furnished}
                    onChange={handleChange}
                    className='rounded text-blue-600'
                  />
                  Fully Furnished
                </label>
                <label className='inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700'>
                  <input
                    type='checkbox'
                    name='parking'
                    checked={formData.parking}
                    onChange={handleChange}
                    className='rounded text-blue-600'
                  />
                  Dedicated Parking Spot
                </label>
              </div>
            </div>
          ) : (
            <div className='space-y-4 p-4 bg-amber-50/40 rounded-xl border border-amber-200/70'>
              <div className='text-xs font-bold uppercase tracking-wider text-amber-900'>
                Chauffeur &amp; Vehicle Specifications
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Make</label>
                  <input
                    type='text'
                    name='make'
                    value={formData.make}
                    onChange={handleChange}
                    placeholder='Toyota, Lexus...'
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Model</label>
                  <input
                    type='text'
                    name='model'
                    value={formData.model}
                    onChange={handleChange}
                    placeholder='Camry Sedan, Prado SUV...'
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Year</label>
                  <input
                    type='number'
                    name='year'
                    min='2015'
                    max='2026'
                    value={formData.year}
                    onChange={handleChange}
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>Passenger Seats</label>
                  <input
                    type='number'
                    name='seats'
                    min='1'
                    max='15'
                    value={formData.seats}
                    onChange={handleChange}
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>
                    Designated Driver Name
                  </label>
                  <input
                    type='text'
                    name='driverName'
                    value={formData.driverName}
                    onChange={handleChange}
                    placeholder='e.g. David Chen or Marcus Vance'
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-700 mb-1'>
                    Driver Contact Phone
                  </label>
                  <input
                    type='text'
                    name='driverContact'
                    value={formData.driverContact}
                    onChange={handleChange}
                    placeholder='+1 555-0199'
                    className='w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg'
                  />
                </div>
              </div>

              <div className='flex gap-4 pt-1'>
                <label className='inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700'>
                  <input
                    type='checkbox'
                    name='driverIncluded'
                    checked={formData.driverIncluded}
                    onChange={handleChange}
                    className='rounded text-amber-600'
                  />
                  Professional Chauffeur Service Included
                </label>
              </div>
            </div>
          )}

          {/* Photo Management */}
          <div className='space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200'>
            <div>
              <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                Listing Photos ({formData.imageUrls.length})
              </label>
              <span className='text-[11px] text-slate-500'>
                {formData.imageUrls.length > 0
                  ? 'The first image serves as the main search cover'
                  : 'Add listing photos using your local camera, uploading files from your device, or pasting URLs.'}
              </span>
            </div>

            {/* Camera & Local File Upload Area */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Option 1: Live Device Camera Capture */}
              <button
                type='button'
                onClick={() => setIsCameraOpen(true)}
                id='listing-open-camera-btn'
                className='flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50/90 rounded-xl transition cursor-pointer group text-center'
              >
                <div className='w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                <span className='text-[11px] text-slate-500 mt-0.5'>
                  Snap photos with laptop webcam or mobile camera
                </span>
              </button>

              {/* Option 2: Choose Images from Local Device */}
              <div className='relative'>
                <input
                  type='file'
                  id='client-local-photos-input'
                  accept='image/*'
                  multiple
                  onChange={(e) => {
                    handleProcessLocalFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className='hidden'
                />
                <label
                  htmlFor='client-local-photos-input'
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer?.files) {
                      handleProcessLocalFiles(e.dataTransfer.files);
                    }
                  }}
                  className='flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl transition cursor-pointer group text-center h-full'
                >
                  <div className='w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-110 transition'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                  </div>
                  <span className='text-xs font-bold text-emerald-950 group-hover:text-emerald-900'>
                    Choose Images from Device
                  </span>
                  <span className='text-[11px] text-slate-500 mt-0.5'>
                    Browse files or drag &amp; drop photos (.jpg, .png)
                  </span>
                </label>
              </div>
            </div>

            {/* Direct Mobile Quick Camera Trigger */}
            <div className='flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200'>
              <span className='text-[11px] text-slate-600'>Mobile camera shortcut:</span>
              <input
                type='file'
                accept='image/*'
                capture='environment'
                id='client-direct-mobile-camera'
                className='hidden'
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessCameraPhoto(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              <label
                htmlFor='client-direct-mobile-camera'
                className='text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline text-[11px]'
              >
                Launch Native Device Camera App
              </label>
            </div>

            {/* Progress / Status Notice */}
            {isProcessingLocalImages && (
              <div className='p-2 bg-indigo-100/80 text-indigo-900 rounded-lg text-xs flex items-center justify-center gap-2 font-medium animate-pulse'>
                <span className='w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin' />
                <span>Processing photos...</span>
              </div>
            )}
            {localImageNotice && !isProcessingLocalImages && (
              <div className='p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs text-center font-medium'>
                {localImageNotice}
              </div>
            )}

            {/* Custom URL add */}
            <div className='pt-1'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1'>
                Or Add by Web URL
              </span>
              <div className='flex gap-2'>
                <input
                  type='url'
                  placeholder='Paste image URL (https://... or /images/...)'
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className='flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-700'
                />
                <button
                  type='button'
                  onClick={handleAddImageUrl}
                  className='px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition cursor-pointer'
                >
                  Add Photo
                </button>
              </div>
            </div>

            {/* Photo Thumbnails */}
            {formData.imageUrls.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 shadow-2xs'>
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className='relative group rounded-lg overflow-hidden h-20 border border-slate-200 bg-slate-100'>
                    <img
                      src={url}
                      alt={`Listing photo ${index + 1}`}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = category === 'guesthouse' ? '/images/airbnb_apartment_living.jpg' : '/images/city_regular_sedan.jpg';
                      }}
                    />
                    {index === 0 && (
                      <span className='absolute bottom-1 left-1 bg-slate-900/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded'>
                        Cover
                      </span>
                    )}
                    <button
                      type='button'
                      onClick={() => handleRemoveImageUrl(index)}
                      className='absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-[10px] opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs'
                      title='Remove photo'
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500'>
                <p className='font-medium text-slate-700'>No photos added yet</p>
                <p className='text-[11px] text-slate-400 mt-0.5'>
                  Use the options above to take a photo with your camera or select files from your local device.
                </p>
              </div>
            )}
          </div>

          {/* Publishing & Moderation Toggles */}
          {isAdmin ? (
            <div className='p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
              <label className='inline-flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  name='isApproved'
                  checked={formData.isApproved}
                  onChange={handleChange}
                  className='w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500'
                />
                <span className='text-xs font-bold text-emerald-800'>
                  Publish as Approved (Instant live visibility)
                </span>
              </label>

              <label className='inline-flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  name='active'
                  checked={formData.active}
                  onChange={handleChange}
                  className='w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500'
                />
                <span className='text-xs font-semibold text-slate-700'>
                  Active in Public Search
                </span>
              </label>
            </div>
          ) : (
            <div className='p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900'>
              <svg className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <div>
                <span className='font-bold text-amber-950 block mb-0.5'>Moderation Notice:</span>
                Your property will be held in a pending state for administrator moderation. Once verified, it will instantly appear across the homepage and search catalog.
              </div>
            </div>
          )}

          {/* Form Action Controls */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
            <Link
              to='/profile'
              className='px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors'
            >
              Cancel
            </Link>
            <button
              type='submit'
              disabled={loading || (!isEmailVerified && !isAdmin)}
              className='inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
            >
              {loading && (
                <div className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
              <span>{loading ? 'Creating Listing...' : (isAdmin ? 'Create & Publish Listing' : 'Submit Listing for Review')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Device Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleProcessCameraPhoto}
        maxAllowed={8}
        currentCount={formData.imageUrls.length}
      />
    </main>
  );
}
