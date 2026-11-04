import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCar,
  FaPhoneAlt,
  FaWhatsapp,
  FaStar,
  FaArchive,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaCheck,
  FaTimes,
  FaRedo,
  FaSearch,
  FaUserTie,
  FaGasPump,
  FaMapMarkerAlt,
  FaEdit,
} from 'react-icons/fa';

export default function AdminCarsTab({
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
  const [driverFilter, setDriverFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract only car / vehicle listings
  const carsList = useMemo(() => {
    return listings.filter(
      (l) => l.type === 'car' || l.category === 'car_service' || l.category === 'car' || l.type === 'sale'
    );
  }, [listings]);

  // Compute Cars KPI metrics
  const stats = useMemo(() => {
    const total = carsList.length;
    const active = carsList.filter((l) => l.active !== false && l.isActive !== false).length;
    const pending = carsList.filter((l) => l.status === 'pending' || !l.isApproved).length;
    const withDriver = carsList.filter((l) => l.driverIncluded !== false).length;
    const prices = carsList.map((l) => Number(l.price || l.regularPrice || 0)).filter((p) => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 85;
    return { total, active, pending, withDriver, avgPrice };
  }, [carsList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return carsList.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (driverFilter === 'yes' && !item.driverIncluded) return false;
      if (driverFilter === 'no' && item.driverIncluded) return false;
      if (
        transmissionFilter !== 'all' &&
        item.transmission?.toLowerCase() !== transmissionFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          item.title?.toLowerCase().includes(q) ||
          item.make?.toLowerCase().includes(q) ||
          item.model?.toLowerCase().includes(q) ||
          item.driverName?.toLowerCase().includes(q) ||
          item.driverContact?.toLowerCase().includes(q) ||
          item.ownerName?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.city?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [carsList, statusFilter, driverFilter, transmissionFilter, searchTerm]);

  return (
    <div className='space-y-5 animate-fadeIn'>
      {/* Header Banner */}
      <div className='bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-sky-900/60 shadow-md relative overflow-hidden'>
        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold mb-2'>
              <FaCar />
              <span>Chauffeur Fleet &amp; Vehicle Dispatch</span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black tracking-tight'>
              Cars &amp; Private Driver Fleet Directory
            </h2>
            <p className='text-xs text-slate-300 mt-1 max-w-xl'>
              Manage city sedans, SUVs, assigned licensed chauffeurs, emergency contacts, day tariffs, and route readiness.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={onRefresh}
              disabled={loading}
              className='px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50'
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
              <span>Refresh Fleet</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Total Fleet Vehicles</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            {stats.total}
          </span>
          <span className='text-[10px] text-sky-600 font-bold'>Sedans, SUVs &amp; Vans</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Active On-Road</span>
          <span className='text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block'>
            {stats.active}
          </span>
          <span className='text-[10px] text-slate-400'>Ready for instant hire</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Pending Review</span>
          <span className='text-xl font-black text-amber-500 mt-1 block'>
            {stats.pending}
          </span>
          <span className='text-[10px] text-amber-600 dark:text-amber-400 font-bold'>Safety inspection pending</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Avg Daily Rate</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            ${stats.avgPrice}
          </span>
          <span className='text-[10px] text-slate-400'>With driver included</span>
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
              placeholder='Search vehicle, driver name, phone...'
              className='pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-sky-400'
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>All Statuses</option>
            <option value='approved'>Approved Fleet</option>
            <option value='pending'>Pending Inspection</option>
            <option value='rejected'>Rejected</option>
            <option value='archived'>Archived</option>
          </select>

          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>All Driver Modes</option>
            <option value='yes'>Chauffeur Included</option>
            <option value='no'>Self-Drive Only</option>
          </select>

          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>All Transmissions</option>
            <option value='automatic'>Automatic</option>
            <option value='manual'>Manual</option>
          </select>
        </div>

        <div className='text-slate-400 font-semibold'>
          Showing <span className='text-slate-900 dark:text-white font-bold'>{filteredList.length}</span> fleet vehicles
        </div>
      </div>

      {/* Main Table View */}
      <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
        <div className='overflow-x-auto hidden md:block'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
              <tr>
                <th className='py-3.5 px-4'>Vehicle &amp; Model</th>
                <th className='py-3.5 px-4'>Assigned Driver / Contact</th>
                <th className='py-3.5 px-4'>Specs / Transmission</th>
                <th className='py-3.5 px-4'>Service Area</th>
                <th className='py-3.5 px-4'>Rate / Day</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4 text-right'>Fleet Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
              {filteredList.map((listing) => {
                const img = Array.isArray(listing.images) && listing.images.length > 0
                  ? listing.images[0]
                  : '/images/city_regular_sedan.jpg';
                const driverName = listing.driverName || listing.ownerName || 'Professional City Chauffeur';
                const driverPhone = listing.driverContact || listing.contactPhone || '+256762242354';

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
                          <span className='text-[10px] text-slate-400'>
                            {listing.make ? `${listing.make} ${listing.model || ''} (${listing.year || 2023})` : 'Executive Sedan'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Driver & Contact */}
                    <td className='py-3 px-4'>
                      <div>
                        <span className='font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[140px] flex items-center gap-1'>
                          <FaUserTie className='text-sky-500 text-[10px]' />
                          <span>{driverName}</span>
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <button
                            type='button'
                            onClick={() =>
                              onOpenContact?.({
                                name: driverName,
                                email: listing.ownerEmail,
                                phone: driverPhone,
                                role: 'Chauffeur / Fleet Host',
                                listingTitle: listing.title,
                                context: `car service "${listing.title}"`,
                              })
                            }
                            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold hover:bg-sky-100 cursor-pointer'
                          >
                            <FaPhoneAlt className='text-[8px]' />
                            <span>{driverPhone}</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Specs */}
                    <td className='py-3 px-4 text-slate-600 dark:text-slate-300'>
                      <div className='space-y-0.5'>
                        <span className='font-bold block capitalize'>
                          {listing.transmission || 'Automatic'} • {listing.seats || 4} Seats
                        </span>
                        <span className='text-[10px] text-emerald-600 font-semibold block'>
                          {listing.driverIncluded !== false ? '✓ Driver Included' : 'Self-Drive'}
                        </span>
                      </div>
                    </td>

                    {/* Service Area */}
                    <td className='py-3 px-4 font-semibold text-slate-700 dark:text-slate-300'>
                      <span className='flex items-center gap-1 text-[11px] truncate max-w-[130px]'>
                        <FaMapMarkerAlt className='text-sky-500 text-[10px] shrink-0' />
                        <span>{listing.city || listing.location || 'Metro Hub'}</span>
                      </span>
                    </td>

                    {/* Daily Rate */}
                    <td className='py-3 px-4'>
                      <div className='font-black text-slate-900 dark:text-white text-sm'>
                        ${listing.price || listing.regularPrice}
                        <span className='text-[10px] text-slate-400 font-normal'> /day</span>
                      </div>
                      {listing.discountPrice > 0 && (
                        <span className='text-[10px] text-sky-600 font-bold'>
                          Special rate applied
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
                          title='View Live Vehicle Listing'
                        >
                          <FaExternalLinkAlt />
                        </Link>

                        <button
                          type='button'
                          onClick={() => onEditListing ? onEditListing(listing) : null}
                          className='p-1.5 text-slate-400 hover:text-amber-500 rounded-lg transition cursor-pointer'
                          title='Edit Vehicle Information'
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
                          title={listing.featured ? 'Unfeature' : 'Feature Vehicle'}
                        >
                          <FaStar />
                        </button>

                        <button
                          type='button'
                          onClick={() => onToggleActive?.(listing.id, listing.active, listing.title)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition ${
                            listing.active !== false && listing.isActive !== false
                              ? 'text-sky-600 hover:bg-sky-50'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title='Toggle Active / Paused'
                        >
                          {listing.active !== false && listing.isActive !== false ? 'Active' : 'Paused'}
                        </button>

                        <button
                          type='button'
                          onClick={() => onDeleteWithReauth?.(listing)}
                          className='p-1.5 text-slate-400 hover:text-rose-600 rounded-lg'
                          title='Delete Vehicle'
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
                      : '/images/city_regular_sedan.jpg'
                  }
                  alt=''
                  className='w-16 h-16 rounded-2xl object-cover shrink-0'
                />
                <div className='min-w-0 flex-1'>
                  <p className='font-bold text-xs text-slate-900 dark:text-white truncate'>
                    {listing.title}
                  </p>
                  <p className='text-[11px] text-slate-500'>
                    ${listing.price}/day • {listing.driverName || 'Driver Included'} • {listing.city}
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
                      name: listing.driverName || 'Driver',
                      email: listing.ownerEmail,
                      phone: listing.driverContact || listing.contactPhone || '+256762242354',
                      role: 'Private Chauffeur',
                      listingTitle: listing.title,
                    })
                  }
                  className='text-sky-600 font-bold flex items-center gap-1 text-[11px]'
                >
                  <FaWhatsapp />
                  <span>Contact Driver</span>
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
