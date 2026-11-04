import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaHome,
  FaCar,
  FaSave,
  FaTrashAlt,
  FaPlus,
  FaBed,
  FaBath,
  FaGasPump,
  FaUserTie,
  FaMapMarkerAlt,
  FaStar,
  FaTag,
  FaCheck,
} from 'react-icons/fa';

export default function AdminEditListingModal({
  isOpen,
  listing,
  onClose,
  onSaved,
}) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (listing) {
      const isCar =
        listing.category === 'car' ||
        listing.category === 'car_service' ||
        listing.type === 'car' ||
        listing.type === 'sale';

      const images = Array.isArray(listing.images) && listing.images.length > 0
        ? [...listing.images]
        : Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
        ? [...listing.imageUrls]
        : [];

      setFormData({
        id: listing.id || listing._id,
        type: isCar ? 'car' : 'guesthouse',
        category: isCar ? 'car_service' : 'guesthouse',
        title: listing.title || listing.name || '',
        description: listing.description || '',
        price: Number(listing.price || listing.regularPrice || 0),
        regularPrice: Number(listing.regularPrice || listing.price || 0),
        discountPrice: Number(listing.discountPrice || listing.discountedPrice || 0),
        offer: Boolean(listing.offer || (Number(listing.discountPrice) > 0)),
        currency: listing.currency || 'USD',
        priceUnit: listing.priceUnit || (isCar ? 'day' : 'night'),
        city: listing.city || listing.location || '',
        area: listing.area || '',
        address: listing.address || listing.location || '',
        contactPhone: listing.contactPhone || listing.ownerPhone || '',
        ownerName: listing.ownerName || '',
        ownerEmail: listing.ownerEmail || '',
        status: listing.status || 'approved',
        active: listing.active !== false && listing.isActive !== false,
        featured: Boolean(listing.featured),
        rejectionReason: listing.rejectionReason || '',
        images,
        // Guesthouse fields
        bedrooms: Number(listing.bedrooms || 1),
        bathrooms: Number(listing.bathrooms || 1),
        maxGuests: Number(listing.maxGuests || 2),
        amenities: Array.isArray(listing.amenities)
          ? [...listing.amenities]
          : ['WiFi', 'Air Conditioning'],
        checkIn: listing.checkIn || '14:00',
        checkOut: listing.checkOut || '11:00',
        houseRules: listing.houseRules || '',
        // Car fields
        make: listing.make || '',
        model: listing.model || '',
        year: Number(listing.year || new Date().getFullYear()),
        transmission: listing.transmission || 'automatic',
        fuel: listing.fuel || 'Petrol',
        seats: Number(listing.seats || 4),
        driverIncluded: listing.driverIncluded !== false,
        driverName: listing.driverName || '',
        driverContact: listing.driverContact || '',
      });
      setError(null);
    }
  }, [listing]);

  if (!isOpen || !formData) return null;

  const isCar = formData.type === 'car';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return setError('Title is required.');
    }
    if (formData.price <= 0) {
      return setError('Price must be greater than zero.');
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        regularPrice: Number(formData.regularPrice || formData.price),
        discountPrice: Number(formData.discountPrice || 0),
        offer: Boolean(formData.offer),
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        city: formData.city.trim(),
        area: formData.area.trim(),
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim(),
        status: formData.status,
        isApproved: formData.status === 'approved',
        active: Boolean(formData.active),
        isActive: Boolean(formData.active),
        featured: Boolean(formData.featured),
        rejectionReason: formData.rejectionReason,
        images: formData.images,
        imageUrls: formData.images,
        type: formData.type,
        category: formData.type === 'car' ? 'car_service' : 'guesthouse',
      };

      if (isCar) {
        payload.make = formData.make.trim();
        payload.model = formData.model.trim();
        payload.year = Number(formData.year);
        payload.transmission = formData.transmission;
        payload.fuel = formData.fuel;
        payload.seats = Number(formData.seats);
        payload.driverIncluded = Boolean(formData.driverIncluded);
        payload.driverName = formData.driverName.trim();
        payload.driverContact = formData.driverContact.trim();
      } else {
        payload.bedrooms = Number(formData.bedrooms);
        payload.bathrooms = Number(formData.bathrooms);
        payload.maxGuests = Number(formData.maxGuests);
        payload.amenities = formData.amenities;
        payload.checkIn = formData.checkIn;
        payload.checkOut = formData.checkOut;
        payload.houseRules = formData.houseRules;
      }

      await onSaved(formData.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  const commonAmenities = [
    'WiFi',
    'Air Conditioning',
    'Kitchen',
    'Free Parking',
    'Hot Water',
    'TV / Cable',
    'Generator Backup',
    'Washing Machine',
    'Security Guard',
    'Balcony',
  ];

  return (
    <div
      className='fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-fadeIn'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4'>
          <div className='flex items-center gap-3'>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${
                isCar
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isCar ? <FaCar /> : <FaHome />}
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'>
                  Admin Override
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    formData.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : formData.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              <h2 className='text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1'>
                Edit Listing Info &amp; Specs
              </h2>
            </div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer'
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className='p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Section: Category & Status */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs'>
            <div>
              <label className='font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                Listing Type
              </label>
              <select
                name='type'
                value={formData.type}
                onChange={handleChange}
                className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium'
              >
                <option value='guesthouse'>🏡 Boutique Guest House</option>
                <option value='car'>🚗 Car Leasing / Chauffeur</option>
              </select>
            </div>

            <div>
              <label className='font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                Moderation Status
              </label>
              <select
                name='status'
                value={formData.status}
                onChange={handleChange}
                className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium'
              >
                <option value='approved'>Approved (Live)</option>
                <option value='pending'>Pending Review</option>
                <option value='rejected'>Rejected</option>
                <option value='archived'>Archived</option>
              </select>
            </div>

            <div className='flex items-center gap-4 pt-5'>
              <label className='flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  name='active'
                  checked={formData.active}
                  onChange={handleChange}
                  className='rounded text-emerald-600 w-4 h-4'
                />
                <span>Active</span>
              </label>

              <label className='flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  name='featured'
                  checked={formData.featured}
                  onChange={handleChange}
                  className='rounded text-amber-500 w-4 h-4'
                />
                <span>Featured ★</span>
              </label>
            </div>
          </div>

          {/* Core Info */}
          <div className='space-y-4'>
            <h3 className='text-xs font-black uppercase tracking-wider text-slate-400'>
              Core Details &amp; Location
            </h3>

            <div>
              <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                Title / Headline
              </label>
              <input
                type='text'
                name='title'
                required
                value={formData.title}
                onChange={handleChange}
                className='w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900'
                placeholder='e.g. Modern Villa in Downtown / Luxury Sedan with Chauffeur'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div>
                <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                  Rate / Price
                </label>
                <input
                  type='number'
                  name='price'
                  required
                  min='1'
                  value={formData.price}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold'
                />
              </div>

              <div>
                <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                  Unit
                </label>
                <select
                  name='priceUnit'
                  value={formData.priceUnit}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                >
                  <option value='night'>per night</option>
                  <option value='day'>per day</option>
                  <option value='week'>per week</option>
                  <option value='month'>per month</option>
                </select>
              </div>

              <div>
                <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                  Currency
                </label>
                <select
                  name='currency'
                  value={formData.currency}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                >
                  <option value='USD'>USD ($)</option>
                  <option value='EUR'>EUR (€)</option>
                  <option value='ERN'>ERN (Nakfa)</option>
                  <option value='GBP'>GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Special Offer & Discount controls */}
            <div className='p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs'>
              <label className='flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  name='offer'
                  checked={formData.offer}
                  onChange={handleChange}
                  className='rounded text-amber-600 w-4 h-4'
                />
                <FaTag className='text-amber-500' />
                <span>Mark as Special Offer</span>
              </label>

              <div>
                <label className='text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5'>
                  Regular Rate
                </label>
                <input
                  type='number'
                  name='regularPrice'
                  value={formData.regularPrice}
                  onChange={handleChange}
                  placeholder='Full price'
                  className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                />
              </div>

              <div>
                <label className='text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5'>
                  Discounted / Promo Rate
                </label>
                <input
                  type='number'
                  name='discountPrice'
                  value={formData.discountPrice}
                  onChange={handleChange}
                  placeholder='Discount rate'
                  className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-700'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                  City / Region
                </label>
                <input
                  type='text'
                  name='city'
                  value={formData.city}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                  placeholder='e.g. Muyenga, Munyonyo, Makindye'
                />
              </div>

              <div>
                <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                  Neighborhood / Area
                </label>
                <input
                  type='text'
                  name='area'
                  value={formData.area}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                  placeholder='e.g. Tank Hill, Buziga Hill, Ggaba Marina'
                />
              </div>
            </div>

            <div>
              <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                Contact Phone / WhatsApp
              </label>
              <input
                type='text'
                name='contactPhone'
                value={formData.contactPhone}
                onChange={handleChange}
                className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono'
                placeholder='e.g. +256 762 242354'
              />
            </div>

            <div>
              <label className='text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1'>
                Description
              </label>
              <textarea
                name='description'
                rows='3'
                value={formData.description}
                onChange={handleChange}
                className='w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs'
                placeholder='Detailed description of amenities, services, rules...'
              />
            </div>
          </div>

          {/* Dynamic Specifications */}
          {isCar ? (
            <div className='space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800'>
              <h3 className='text-xs font-black uppercase tracking-wider text-slate-400'>
                Vehicle &amp; Chauffeur Specifications
              </h3>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                <div>
                  <label className='font-bold block mb-1'>Make</label>
                  <input
                    type='text'
                    name='make'
                    value={formData.make}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                    placeholder='Toyota, Mercedes...'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1'>Model</label>
                  <input
                    type='text'
                    name='model'
                    value={formData.model}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                    placeholder='Land Cruiser, Corolla...'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1'>Year</label>
                  <input
                    type='number'
                    name='year'
                    value={formData.year}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1'>Seats</label>
                  <input
                    type='number'
                    name='seats'
                    value={formData.seats}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs'>
                <div>
                  <label className='font-bold block mb-1'>Transmission</label>
                  <select
                    name='transmission'
                    value={formData.transmission}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  >
                    <option value='automatic'>Automatic</option>
                    <option value='manual'>Manual</option>
                  </select>
                </div>
                <div>
                  <label className='font-bold block mb-1'>Fuel</label>
                  <select
                    name='fuel'
                    value={formData.fuel}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  >
                    <option value='Petrol'>Petrol</option>
                    <option value='Diesel'>Diesel</option>
                    <option value='Hybrid'>Hybrid</option>
                  </select>
                </div>
                <div className='flex items-center pt-5'>
                  <label className='flex items-center gap-1.5 font-bold cursor-pointer select-none text-emerald-600'>
                    <input
                      type='checkbox'
                      name='driverIncluded'
                      checked={formData.driverIncluded}
                      onChange={handleChange}
                      className='rounded text-emerald-600 w-4 h-4'
                    />
                    <span>Driver Included</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800'>
              <h3 className='text-xs font-black uppercase tracking-wider text-slate-400'>
                Guest House Layout &amp; Amenities
              </h3>
              <div className='grid grid-cols-3 gap-3 text-xs'>
                <div>
                  <label className='font-bold block mb-1'>Bedrooms</label>
                  <input
                    type='number'
                    name='bedrooms'
                    min='0'
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1'>Bathrooms</label>
                  <input
                    type='number'
                    name='bathrooms'
                    min='0'
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1'>Max Guests</label>
                  <input
                    type='number'
                    name='maxGuests'
                    min='1'
                    value={formData.maxGuests}
                    onChange={handleChange}
                    className='w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
                  />
                </div>
              </div>

              <div>
                <span className='font-bold text-xs text-slate-700 dark:text-slate-300 block mb-2'>
                  Included Amenities
                </span>
                <div className='flex flex-wrap gap-2'>
                  {commonAmenities.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);
                    return (
                      <button
                        type='button'
                        key={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Photo Gallery Editor */}
          <div className='space-y-3'>
            <h3 className='text-xs font-black uppercase tracking-wider text-slate-400'>
              Photos &amp; Imagery ({formData.images.length})
            </h3>

            <div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
              {formData.images.map((url, idx) => (
                <div
                  key={idx}
                  className='relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-20 bg-slate-100'
                >
                  <img src={url} alt='' className='w-full h-full object-cover' />
                  <button
                    type='button'
                    onClick={() => handleRemoveImage(idx)}
                    className='absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer text-xs'
                    title='Remove photo'
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ))}
            </div>

            <div className='flex gap-2 text-xs'>
              <input
                type='url'
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder='Add image URL (https://...)'
                className='flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl'
              />
              <button
                type='button'
                onClick={handleAddImage}
                className='px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer'
              >
                + Add Photo
              </button>
            </div>
          </div>

          {/* Rejection / Moderation Feedback */}
          {formData.status === 'rejected' && (
            <div>
              <label className='text-xs font-bold text-rose-700 block mb-1'>
                Reason for Rejection / Moderation Notes
              </label>
              <textarea
                name='rejectionReason'
                rows='2'
                value={formData.rejectionReason}
                onChange={handleChange}
                placeholder='Explain what the owner should revise...'
                className='w-full p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium'
              />
            </div>
          )}

          {/* Footer Save / Cancel */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer'
            >
              Cancel
            </button>

            <button
              type='submit'
              disabled={saving}
              className='px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50'
            >
              <FaSave />
              <span>{saving ? 'Saving Changes...' : 'Save & Update Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
