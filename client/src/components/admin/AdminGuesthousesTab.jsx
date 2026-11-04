import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaBed,
  FaBath,
  FaUsers,
  FaMapMarkerAlt,
  FaStar,
  FaArchive,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaPhoneAlt,
  FaWhatsapp,
  FaCheck,
  FaTimes,
  FaRedo,
  FaSearch,
  FaFilter,
  FaEdit,
} from 'react-icons/fa';

export default function AdminGuesthousesTab({
  listings = [],
  loading = false,
  onRefresh,
  onToggleFeatured,
  onToggleActive,
  onApprove,
  onReject,
  onArchive,
  onRestore,
  onDeleteWithReauth,
  onOpenContact,
  onEditListing,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [bedroomFilter, setBedroomFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract only guesthouse listings
  const guesthouseList = useMemo(() => {
    return listings.filter(
      (l) => l.type === 'guesthouse' || l.category === 'guesthouse' || l.type === 'rent'
    );
  }, [listings]);

  // Compute Guesthouse KPI metrics
  const stats = useMemo(() => {
    const total = guesthouseList.length;
    const active = guesthouseList.filter((l) => l.active !== false && l.isActive !== false).length;
    const pending = guesthouseList.filter((l) => l.status === 'pending' || !l.isApproved).length;
    const approved = guesthouseList.filter((l) => l.status === 'approved' && l.isApproved).length;
    const prices = guesthouseList.map((l) => Number(l.price || l.regularPrice || 0)).filter((p) => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 120;
    return { total, active, pending, approved, avgPrice };
  }, [guesthouseList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return guesthouseList.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (bedroomFilter !== 'all' && Number(item.bedrooms || 0) < Number(bedroomFilter)) return false;
      if (cityFilter.trim() && !item.city?.toLowerCase().includes(cityFilter.toLowerCase().trim())) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          item.title?.toLowerCase().includes(q) ||
          item.address?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.city?.toLowerCase().includes(q) ||
          item.ownerName?.toLowerCase().includes(q) ||
          item.ownerEmail?.toLowerCase().includes(q) ||
          item.contactPhone?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [guesthouseList, statusFilter, bedroomFilter, cityFilter, searchTerm]);

  return (
    <div className='space-y-5 animate-fadeIn'>
      {/* Header Banner */}
      <div className='bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-900/60 shadow-md relative overflow-hidden'>
        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2'>
              <FaHome />
              <span>Dedicated Property Management</span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black tracking-tight'>
              Guest Houses &amp; Apartments Directory
            </h2>
            <p className='text-xs text-slate-300 mt-1 max-w-xl'>
              Manage boutique apartment stays, Airbnb flats, room capacities, host contacts, and pricing moderations.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={onRefresh}
              disabled={loading}
              className='px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50'
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
              <span>Refresh Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Total Properties</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            {stats.total}
          </span>
          <span className='text-[10px] text-emerald-600 font-bold'>Listed across cities</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Active Stays</span>
          <span className='text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block'>
            {stats.active}
          </span>
          <span className='text-[10px] text-slate-400'>Open for guest booking</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Pending Review</span>
          <span className='text-xl font-black text-amber-500 mt-1 block'>
            {stats.pending}
          </span>
          <span className='text-[10px] text-amber-600 dark:text-amber-400 font-bold'>Awaiting sign-off</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Avg Nightly Rate</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            ${stats.avgPrice}
          </span>
          <span className='text-[10px] text-slate-400'>Per night average</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs'>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search title, address, host...'
              className='pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-emerald-400'
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>All Statuses</option>
            <option value='approved'>Approved Only</option>
            <option value='pending'>Pending Only</option>
            <option value='rejected'>Rejected</option>
            <option value='archived'>Archived</option>
          </select>

          <select
            value={bedroomFilter}
            onChange={(e) => setBedroomFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>Any Bedrooms</option>
            <option value='1'>1+ Bedrooms</option>
            <option value='2'>2+ Bedrooms</option>
            <option value='3'>3+ Bedrooms</option>
          </select>

          <input
            type='text'
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder='Filter city...'
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-[130px]'
          />
        </div>

        <div className='text-slate-400 font-semibold'>
          Showing <span className='text-slate-900 dark:text-white font-bold'>{filteredList.length}</span> guest houses
        </div>
      </div>

      {/* Main Table View */}
      <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
        <div className='overflow-x-auto hidden md:block'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
              <tr>
                <th className='py-3.5 px-4'>Property &amp; Photos</th>
                <th className='py-3.5 px-4'>Location / City</th>
                <th className='py-3.5 px-4'>Host / Owner</th>
                <th className='py-3.5 px-4'>Capacity Specs</th>
                <th className='py-3.5 px-4'>Price / Night</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4 text-right'>Management Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
              {filteredList.map((listing) => {
                const img = Array.isArray(listing.images) && listing.images.length > 0
                  ? listing.images[0]
                  : '/images/airbnb_apartment_living.jpg';
                const hostName = listing.ownerName || listing.ownerEmail?.split('@')[0] || 'Host Provider';
                const hostPhone = listing.contactPhone || '+256762242354';

                return (
                  <tr key={listing.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition'>
                    {/* Thumbnail & Title */}
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <img
                          src={img}
                          alt=''
                          className='w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700'
                        />
                        <div className='min-w-0 max-w-xs'>
                          <span className='font-bold text-slate-900 dark:text-white truncate block'>
                            {listing.title}
                          </span>
                          <span className='text-[10px] text-slate-400 flex items-center gap-1 mt-0.5'>
                            <FaMapMarkerAlt className='text-emerald-500' />
                            <span className='truncate'>{listing.address || listing.location}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* City */}
                    <td className='py-3 px-4 font-semibold text-slate-700 dark:text-slate-300'>
                      {listing.city || 'Downtown'}
                    </td>

                    {/* Host Info & Direct Contact */}
                    <td className='py-3 px-4'>
                      <div>
                        <span className='font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[140px]'>
                          {hostName}
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <button
                            type='button'
                            onClick={() =>
                              onOpenContact?.({
                                name: hostName,
                                email: listing.ownerEmail,
                                phone: hostPhone,
                                role: 'Guest House Host',
                                listingTitle: listing.title,
                                context: `listing "${listing.title}"`,
                              })
                            }
                            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer'
                          >
                            <FaPhoneAlt className='text-[8px]' />
                            <span>{hostPhone}</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Capacity Specs */}
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-3 text-slate-600 dark:text-slate-300 text-[11px]'>
                        <span className='flex items-center gap-1 font-semibold' title='Bedrooms'>
                          <FaBed className='text-slate-400' />
                          <span>{listing.bedrooms || 1} Bed</span>
                        </span>
                        <span className='flex items-center gap-1 font-semibold' title='Bathrooms'>
                          <FaBath className='text-slate-400' />
                          <span>{listing.bathrooms || 1} Bath</span>
                        </span>
                        <span className='flex items-center gap-1 font-semibold' title='Max Guests'>
                          <FaUsers className='text-slate-400' />
                          <span>{listing.maxGuests || 2} Ppl</span>
                        </span>
                      </div>
                    </td>

                    {/* Nightly Price */}
                    <td className='py-3 px-4'>
                      <div className='font-black text-slate-900 dark:text-white text-sm'>
                        ${listing.price || listing.regularPrice}
                        <span className='text-[10px] text-slate-400 font-normal'> /night</span>
                      </div>
                      {listing.discountPrice > 0 && (
                        <span className='text-[10px] text-emerald-600 font-bold'>
                          Special offer applied
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className='py-3 px-4'>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          listing.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : listing.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : listing.status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {listing.status || 'approved'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className='py-3 px-4 text-right'>
                      <div className='flex items-center justify-end gap-1.5'>
                        <Link
                          to={`/listing/${listing.id}`}
                          target='_blank'
                          className='p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg'
                          title='View Live Listing'
                        >
                          <FaExternalLinkAlt />
                        </Link>

                        <button
                          type='button'
                          onClick={() => onEditListing ? onEditListing(listing) : null}
                          className='p-1.5 text-slate-400 hover:text-amber-500 rounded-lg transition cursor-pointer'
                          title='Edit Property Information'
                        >
                          <FaEdit />
                        </button>

                        <button
                          type='button'
                          onClick={() => onToggleFeatured?.(listing)}
                          className={`p-1.5 rounded-lg transition ${
                            listing.featured
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                          title={listing.featured ? 'Unfeature' : 'Feature Listing'}
                        >
                          <FaStar />
                        </button>

                        <button
                          type='button'
                          onClick={() => onToggleActive?.(listing.id, listing.active, listing.title)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition ${
                            listing.active !== false && listing.isActive !== false
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title='Toggle Active / Inactive'
                        >
                          {listing.active !== false && listing.isActive !== false ? 'Active' : 'Paused'}
                        </button>

                        <button
                          type='button'
                          onClick={() => onDeleteWithReauth?.(listing)}
                          className='p-1.5 text-slate-400 hover:text-rose-600 rounded-lg'
                          title='Delete Property'
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className='divide-y divide-slate-100 dark:divide-slate-800 md:hidden'>
          {filteredList.map((listing) => (
            <div key={listing.id} className='p-4 space-y-3'>
              <div className='flex items-center gap-3'>
                <img
                  src={
                    Array.isArray(listing.images) && listing.images.length > 0
                      ? listing.images[0]
                      : '/images/airbnb_apartment_living.jpg'
                  }
                  alt=''
                  className='w-16 h-16 rounded-2xl object-cover shrink-0'
                />
                <div className='min-w-0 flex-1'>
                  <p className='font-bold text-xs text-slate-900 dark:text-white truncate'>
                    {listing.title}
                  </p>
                  <p className='text-[11px] text-slate-500'>
                    ${listing.price}/night • {listing.bedrooms || 1} Bed • {listing.city}
                  </p>
                  <span className='px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 uppercase'>
                    {listing.status || 'approved'}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between text-xs pt-1'>
                <button
                  type='button'
                  onClick={() =>
                    onOpenContact?.({
                      name: listing.ownerName || 'Host',
                      email: listing.ownerEmail,
                      phone: listing.contactPhone || '+256762242354',
                      role: 'Guest House Host',
                      listingTitle: listing.title,
                    })
                  }
                  className='text-emerald-600 font-bold flex items-center gap-1 text-[11px]'
                >
                  <FaWhatsapp />
                  <span>Contact Host</span>
                </button>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => onEditListing ? onEditListing(listing) : null}
                    className='px-3 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold cursor-pointer'
                  >
                    Edit
                  </button>
                  <Link
                    to={`/listing/${listing.id}`}
                    className='px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-white font-bold'
                  >
                    View
                  </Link>
                  <button
                    onClick={() => onDeleteWithReauth?.(listing)}
                    className='px-3 py-1 bg-rose-50 text-rose-600 rounded-lg font-bold'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
