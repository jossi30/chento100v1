import React, { useState, useEffect } from 'react';
import { apiFetch as fetch } from '../utils/apiFetch';
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
} from 'react-icons/fa';

export default function EditListingModal({
  isOpen,
  listing,
  onClose,
  onSaved,
  authHeaders,
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

      setFormData({
        _id: listing._id || listing.id,
        type: isCar ? 'car' : 'guesthouse',
        category: isCar ? 'car_service' : 'guesthouse',
        title: listing.title || listing.name || '',
        description: listing.description || '',
        price: Number(listing.price || listing.regularPrice || 0),
        currency: listing.currency || 'USD',
        priceUnit: listing.priceUnit || (isCar ? 'day' : 'night'),
        city: listing.city || listing.location || '',
        address: listing.address || listing.location || '',
        contactPhone: listing.contactPhone || listing.ownerPhone || '',
        ownerName: listing.ownerName || '',
        ownerEmail: listing.ownerEmail || '',
        status: listing.status || 'approved',
        active: listing.active !== false && listing.isActive !== false,
        featured: Boolean(listing.featured),
        offer: Boolean(listing.offer),
        images: Array.isArray(listing.images) && listing.images.length > 0
          ? [...listing.images]
          : Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
          ? [...listing.imageUrls]
          : [],
        // Guesthouse fields
        bedrooms: Number(listing.bedrooms || 1),
        bathrooms: Number(listing.bathrooms || 1),
        maxGuests: Number(listing.maxGuests || 2),
        amenities: Array.isArray(listing.amenities)
          ? listing.amenities
          : ['WiFi', 'Air Conditioning'],
        checkIn: listing.checkIn || '14:00',
        checkOut: listing.checkOut || '11:00',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (Number(formData.price) <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    setSaving(true);
    setError(null);

    const listingId = formData._id || formData.id;
    const payload = {
      ...formData,
      _id: listingId,
      id: listingId,
      price: Number(formData.price),
      regularPrice: Number(formData.price),
      isApproved: formData.status === 'approved',
      category: isCar ? 'car_service' : 'guesthouse',
      type: isCar ? 'car' : 'guesthouse',
    };

    try {
      const baseHeaders = authHeaders ? authHeaders() : {};
      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...baseHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res = await fetch(`/api/admin/listings/${encodeURIComponent(listingId)}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`/api/listing/update/${encodeURIComponent(listingId)}`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to update listing (${res.status})`);
      }

      onSaved(data._id || data.id ? data : { ...formData, ...payload });
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 text-slate-800 animate-fadeIn'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
          <div className='flex items-center gap-3'>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold ${
                isCar ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isCar ? <FaCar /> : <FaHome />}
            </div>
            <div>
              <h2 className='text-lg font-black text-slate-900'>Edit Listing Information</h2>
              <p className='text-xs text-slate-500'>
                Admin Authority Override • ID: {formData._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer'
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className='p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5 text-xs'>
          {/* Service Line Switcher & Status Controls */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl'>
            <div>
              <label className='font-bold block mb-1 text-slate-700'>Service Line</label>
              <select
                name='type'
                value={formData.type}
                onChange={handleChange}
                className='w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold'
              >
                <option value='guesthouse'>🏡 Guest House / Apartment</option>
                <option value='car'>🚗 Car &amp; Chauffeur Fleet</option>
              </select>
            </div>

            <div>
              <label className='font-bold block mb-1 text-slate-700'>Moderation Status</label>
              <select
                name='status'
                value={formData.status}
                onChange={handleChange}
                className='w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold capitalize'
              >
                <option value='approved'>Approved (Live)</option>
                <option value='pending'>Pending Moderation</option>
                <option value='rejected'>Rejected</option>
              </select>
            </div>

            <div>
              <label className='font-bold block mb-1 text-slate-700'>Visibility State</label>
              <select
                name='active'
                value={formData.active ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, active: e.target.value === 'true' }))
                }
                className='w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold'
              >
                <option value='true'>Published &amp; Active</option>
                <option value='false'>Hidden / Paused</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl'>
            <label className='flex items-start gap-2.5 cursor-pointer font-bold text-slate-800'>
              <input
                type='checkbox'
                name='featured'
                checked={formData.featured}
                onChange={handleChange}
                className='mt-0.5 rounded text-amber-600 focus:ring-amber-500'
              />
              <span>
                Top listing
                <span className='block mt-0.5 text-[11px] font-normal text-slate-600'>
                  Show in the client home page slideshow.
                </span>
              </span>
            </label>
            <label className='flex items-start gap-2.5 cursor-pointer font-bold text-slate-800'>
              <input
                type='checkbox'
                name='offer'
                checked={formData.offer}
                onChange={handleChange}
                className='mt-0.5 rounded text-emerald-600 focus:ring-emerald-500'
              />
              <span>
                Offer
                <span className='block mt-0.5 text-[11px] font-normal text-slate-600'>
                  Show in the client home page slideshow.
                </span>
              </span>
            </label>
          </div>

          {/* Basic Details */}
          <div className='space-y-3'>
            <h3 className='font-black text-sm text-slate-900'>General Information</h3>

            <div>
              <label className='font-bold block mb-1'>Listing Title *</label>
              <input
                type='text'
                name='title'
                value={formData.title}
                onChange={handleChange}
                placeholder='e.g. Serengeti Luxury Safari Lodge'
                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold'
                required
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div>
                <label className='font-bold block mb-1'>Price / Rate *</label>
                <input
                  type='number'
                  name='price'
                  min='1'
                  value={formData.price}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold'
                  required
                />
              </div>

              <div>
                <label className='font-bold block mb-1'>Currency</label>
                <input
                  type='text'
                  name='currency'
                  value={formData.currency}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold'
                />
              </div>

              <div>
                <label className='font-bold block mb-1'>Rate Unit</label>
                <select
                  name='priceUnit'
                  value={formData.priceUnit}
                  onChange={handleChange}
                  className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold'
                >
                  <option value='night'>per night</option>
                  <option value='day'>per day (24h)</option>
                  <option value='trip'>per trip / transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className='font-bold block mb-1'>Description</label>
              <textarea
                name='description'
                rows='3'
                value={formData.description}
                onChange={handleChange}
                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl'
              />
            </div>
          </div>

          {/* Location & Contact */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label className='font-bold block mb-1'>Neighborhood / Division</label>
              <input
                type='text'
                name='city'
                value={formData.city}
                onChange={handleChange}
                placeholder='e.g. Muyenga, Makindye Division'
                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl'
              />
            </div>

            <div>
              <label className='font-bold block mb-1'>Full Address / Location</label>
              <input
                type='text'
                name='address'
                value={formData.address}
                onChange={handleChange}
                placeholder='e.g. Tank Hill Road, Makindye Division, Kampala'
                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl'
              />
            </div>

            <div>
              <label className='font-bold block mb-1'>Contact Phone</label>
              <input
                type='text'
                name='contactPhone'
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder='+255 ...'
                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono'
              />
            </div>
          </div>

          {/* Service Line Specific Fields */}
          {!isCar ? (
            /* GUEST HOUSE FIELDS */
            <div className='p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3'>
              <h4 className='font-black text-emerald-950 flex items-center gap-1.5'>
                <FaHome className='text-emerald-600' /> Property Specifications
              </h4>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Bedrooms</label>
                  <input
                    type='number'
                    name='bedrooms'
                    min='0'
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Bathrooms</label>
                  <input
                    type='number'
                    name='bathrooms'
                    min='0'
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Max Guests</label>
                  <input
                    type='number'
                    name='maxGuests'
                    min='1'
                    value={formData.maxGuests}
                    onChange={handleChange}
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Check-in Time</label>
                  <input
                    type='text'
                    name='checkIn'
                    value={formData.checkIn}
                    onChange={handleChange}
                    placeholder='14:00'
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl'
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CAR & CHAUFFEUR FIELDS */
            <div className='p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3'>
              <h4 className='font-black text-sky-950 flex items-center gap-1.5'>
                <FaCar className='text-sky-600' /> Vehicle &amp; Chauffeur Specifications
              </h4>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Make</label>
                  <input
                    type='text'
                    name='make'
                    value={formData.make}
                    onChange={handleChange}
                    placeholder='e.g. Toyota'
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Model</label>
                  <input
                    type='text'
                    name='model'
                    value={formData.model}
                    onChange={handleChange}
                    placeholder='e.g. Land Cruiser Prado'
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Year</label>
                  <input
                    type='number'
                    name='year'
                    value={formData.year}
                    onChange={handleChange}
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-bold'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Transmission</label>
                  <select
                    name='transmission'
                    value={formData.transmission}
                    onChange={handleChange}
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl capitalize font-bold'
                  >
                    <option value='automatic'>Automatic</option>
                    <option value='manual'>Manual</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1'>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Driver Name</label>
                  <input
                    type='text'
                    name='driverName'
                    value={formData.driverName}
                    onChange={handleChange}
                    placeholder='e.g. James Wilson'
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl'
                  />
                </div>
                <div>
                  <label className='font-bold block mb-1 text-slate-700'>Driver Phone</label>
                  <input
                    type='text'
                    name='driverContact'
                    value={formData.driverContact}
                    onChange={handleChange}
                    placeholder='+1 ...'
                    className='w-full p-2 bg-white border border-slate-200 rounded-xl font-mono'
                  />
                </div>
                <div className='flex items-center pt-5'>
                  <label className='flex items-center gap-2 cursor-pointer font-bold text-slate-800'>
                    <input
                      type='checkbox'
                      name='driverIncluded'
                      checked={formData.driverIncluded}
                      onChange={handleChange}
                      className='rounded text-sky-600 focus:ring-sky-500'
                    />
                    <span>Chauffeur Included in Rate</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Photo Gallery Management */}
          <div className='space-y-3 bg-slate-50 p-4 rounded-2xl'>
            <label className='font-bold text-slate-900 block'>Photos &amp; Imagery ({formData.images.length})</label>

            <div className='flex items-center gap-2'>
              <input
                type='url'
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder='Paste image URL to add...'
                className='flex-1 p-2 bg-white border border-slate-200 rounded-xl'
              />
              <button
                type='button'
                onClick={handleAddImage}
                className='px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5'
              >
                <FaPlus className='text-[10px]' /> Add Photo
              </button>
            </div>

            <div className='grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2'>
              {formData.images.map((img, idx) => (
                <div key={idx} className='relative group h-16 rounded-xl overflow-hidden border border-slate-200'>
                  <img src={img} alt='' className='w-full h-full object-cover' />
                  <button
                    type='button'
                    onClick={() => handleRemoveImage(idx)}
                    className='absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                    title='Remove photo'
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2.5 text-slate-500 hover:text-slate-900 font-bold rounded-xl'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer'
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
