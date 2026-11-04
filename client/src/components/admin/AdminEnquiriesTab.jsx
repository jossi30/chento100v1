import React, { useState, useMemo } from 'react';
import {
  FaConciergeBell,
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaHome,
  FaCar,
  FaCalendarAlt,
  FaUser,
  FaCheck,
  FaClock,
  FaSearch,
  FaRedo,
} from 'react-icons/fa';

export default function AdminEnquiriesTab({
  enquiries = [],
  loading = false,
  onRefresh,
  onUpdateStatus,
  onOpenContact,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === 'new').length;
    const contacted = enquiries.filter((e) => e.status === 'contacted').length;
    const confirmed = enquiries.filter((e) => e.status === 'confirmed').length;
    return { total, newCount, contacted, confirmed };
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          e.guestName?.toLowerCase().includes(q) ||
          e.guestEmail?.toLowerCase().includes(q) ||
          e.guestPhone?.toLowerCase().includes(q) ||
          e.listingTitle?.toLowerCase().includes(q) ||
          e.hostName?.toLowerCase().includes(q) ||
          e.driverName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [enquiries, statusFilter, searchTerm]);

  return (
    <div className='space-y-5 animate-fadeIn'>
      {/* Header Banner */}
      <div className='bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-amber-900/60 shadow-md relative overflow-hidden'>
        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2'>
              <FaConciergeBell />
              <span>Concierge Hospitality &amp; Dispatch Desk</span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black tracking-tight'>
              Booking Requests &amp; Chauffeur Ride Leads
            </h2>
            <p className='text-xs text-slate-300 mt-1 max-w-xl'>
              Direct concierge lead pipeline connecting guests with guesthouse hosts and private drivers. Follow up on WhatsApp or phone immediately for high conversion.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={onRefresh}
              disabled={loading}
              className='px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50'
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
              <span>Refresh Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Total Inquiries</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            {stats.total}
          </span>
          <span className='text-[10px] text-slate-400'>Stays &amp; chauffeur rides</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>New &amp; Unanswered</span>
          <span className='text-xl font-black text-rose-500 mt-1 block'>
            {stats.newCount}
          </span>
          <span className='text-[10px] text-rose-600 font-bold'>Requires immediate contact</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>In Discussion</span>
          <span className='text-xl font-black text-amber-500 mt-1 block'>
            {stats.contacted}
          </span>
          <span className='text-[10px] text-amber-600 font-bold'>Host or guest contacted</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Confirmed Bookings</span>
          <span className='text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block'>
            {stats.confirmed}
          </span>
          <span className='text-[10px] text-emerald-600 font-bold'>Ready for check-in / pickup</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs'>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search guest, listing, host...'
              className='pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-400'
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
          >
            <option value='all'>All Statuses</option>
            <option value='new'>New Only</option>
            <option value='contacted'>Contacted</option>
            <option value='confirmed'>Confirmed Bookings</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>

        <div className='text-slate-400 font-semibold'>
          Showing <span className='text-slate-900 dark:text-white font-bold'>{filteredEnquiries.length}</span> requests
        </div>
      </div>

      {/* Main Table */}
      <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
              <tr>
                <th className='py-3.5 px-4'>Guest / Client Contact</th>
                <th className='py-3.5 px-4'>Requested Listing</th>
                <th className='py-3.5 px-4'>Assigned Host / Driver</th>
                <th className='py-3.5 px-4'>Dates &amp; Schedule</th>
                <th className='py-3.5 px-4'>Concierge Status</th>
                <th className='py-3.5 px-4 text-right'>Direct Outreach</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
              {filteredEnquiries.map((item) => {
                const isCar = item.category === 'car_service' || item.category === 'car';
                const guestPhone = item.guestPhone || '';
                const cleanPhone = guestPhone.replace(/[^\d+]/g, '');

                return (
                  <tr key={item.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition'>
                    {/* Guest info */}
                    <td className='py-3 px-4'>
                      <div>
                        <span className='font-bold text-slate-900 dark:text-white block'>
                          {item.guestName}
                        </span>
                        <span className='text-[11px] text-slate-400 block'>{item.guestEmail}</span>
                        {guestPhone && (
                          <span className='text-[11px] text-emerald-600 font-semibold block'>
                            {guestPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Listing requested */}
                    <td className='py-3 px-4'>
                      <div className='max-w-xs'>
                        <div className='flex items-center gap-1.5 mb-0.5'>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 ${
                              isCar
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isCar ? <FaCar /> : <FaHome />}
                            <span>{isCar ? 'Chauffeur Ride' : 'Guest House'}</span>
                          </span>
                        </div>
                        <span className='font-bold text-slate-900 dark:text-white truncate block'>
                          {item.listingTitle}
                        </span>
                        {item.notes && (
                          <p className='text-[10px] text-slate-500 italic truncate max-w-xs mt-0.5' title={item.notes}>
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Host / Driver info */}
                    <td className='py-3 px-4'>
                      <div>
                        <span className='font-bold text-slate-800 dark:text-slate-100 block'>
                          {item.driverName || item.hostName || 'Host Provider'}
                        </span>
                        <span className='text-[11px] text-slate-400 block'>
                          {item.driverPhone || item.hostPhone || item.hostEmail || ''}
                        </span>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className='py-3 px-4 font-semibold text-slate-700 dark:text-slate-300'>
                      <div className='flex items-center gap-1.5'>
                        <FaCalendarAlt className='text-slate-400' />
                        <span>{item.dates || 'Upcoming'}</span>
                      </div>
                      {item.guestsCount && (
                        <span className='text-[10px] text-slate-400 block mt-0.5'>
                          {item.guestsCount} Guests
                        </span>
                      )}
                    </td>

                    {/* Status dropdown */}
                    <td className='py-3 px-4'>
                      <select
                        value={item.status || 'new'}
                        onChange={(e) => onUpdateStatus?.(item.id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1 border transition cursor-pointer ${
                          item.status === 'new'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.status === 'contacted'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : item.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value='new'>New / Uncontacted</option>
                        <option value='contacted'>Contacted</option>
                        <option value='confirmed'>Confirmed Booking</option>
                        <option value='cancelled'>Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className='py-3 px-4 text-right'>
                      <div className='flex items-center justify-end gap-1.5'>
                        <button
                          type='button'
                          onClick={() =>
                            onOpenContact?.({
                              name: item.guestName,
                              email: item.guestEmail,
                              phone: item.guestPhone,
                              role: 'Guest Traveler',
                              listingTitle: item.listingTitle,
                              context: `booking for "${item.listingTitle}"`,
                            })
                          }
                          className='px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs'
                          title='Open WhatsApp / Call Concierge'
                        >
                          <FaWhatsapp className='text-sm' />
                          <span>Contact Guest</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
