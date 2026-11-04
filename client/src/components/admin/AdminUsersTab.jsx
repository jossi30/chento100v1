import React, { useState, useMemo } from 'react';
import {
  FaUsers,
  FaHome,
  FaCar,
  FaUserShield,
  FaUserCheck,
  FaBan,
  FaTrashAlt,
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaCopy,
  FaCheck,
  FaFileCsv,
  FaRedo,
  FaSearch,
  FaUserTie,
  FaCheckCircle,
} from 'react-icons/fa';

export default function AdminUsersTab({
  users = [],
  loading = false,
  currentUser,
  onRefresh,
  onSelectUserForDrawer,
  onToggleAdminRole,
  onToggleUserDisabled,
  onDeleteUserWithReauth,
  onExportCSV,
  onOpenContact,
}) {
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'hosts' | 'users'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'unverified' | 'disabled'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Categorize Hosts vs Regular Guests/Users
  const { allCount, hostsCount, guestsCount, verifiedCount } = useMemo(() => {
    let hosts = 0;
    let guests = 0;
    let verified = 0;

    users.forEach((u) => {
      const isHost =
        u.accountType === 'host' ||
        u.role === 'host' ||
        (u.listingsCount && u.listingsCount > 0);
      if (isHost) hosts++;
      else if (!u.isAdmin) guests++;

      if (u.verified || u.emailVerified) verified++;
    });

    return {
      allCount: users.length,
      hostsCount: hosts,
      guestsCount: guests,
      verifiedCount: verified,
    };
  }, [users]);

  // Filter users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isHost =
        u.accountType === 'host' ||
        u.role === 'host' ||
        (u.listingsCount && u.listingsCount > 0);

      // Role filter (Hosts vs Users)
      if (roleFilter === 'hosts' && !isHost) return false;
      if (roleFilter === 'users' && (isHost || u.isAdmin)) return false;

      // Status filter
      if (statusFilter === 'verified' && !u.verified && !u.emailVerified) return false;
      if (statusFilter === 'unverified' && (u.verified || u.emailVerified)) return false;
      if (statusFilter === 'disabled' && !u.disabled) return false;

      // Search query across Name, Email, and Phone Number
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          u.displayName?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.phoneNumber?.toLowerCase().includes(q) ||
          u.uid?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className='space-y-5 animate-fadeIn'>
      {/* Header Banner */}
      <div className='bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-purple-900/60 shadow-md relative overflow-hidden'>
        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold mb-2'>
              <FaUsers />
              <span>CRM &amp; User Relationship Center</span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black tracking-tight'>
              User &amp; Host Management Directory
            </h2>
            <p className='text-xs text-slate-300 mt-1 max-w-xl'>
              Separate directory of registered property hosts, chauffeur operators, and traveling guests with phone contact, verified credentials, and concierge messaging.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => onExportCSV?.(filteredUsers)}
              className='px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer'
            >
              <FaFileCsv className='text-amber-400' />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className='p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50'
              title='Refresh Directory'
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Total Registered</span>
          <span className='text-xl font-black text-slate-900 dark:text-white mt-1 block'>
            {allCount}
          </span>
          <span className='text-[10px] text-purple-600 font-bold'>All account records</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Hosts &amp; Providers</span>
          <span className='text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block'>
            {hostsCount}
          </span>
          <span className='text-[10px] text-slate-400'>Apartments &amp; Chauffeurs</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Travelers / Guests</span>
          <span className='text-xl font-black text-sky-600 dark:text-sky-400 mt-1 block'>
            {guestsCount}
          </span>
          <span className='text-[10px] text-slate-400'>Active platform clients</span>
        </div>

        <div className='bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
          <span className='text-[11px] text-slate-400 font-semibold block'>Verified Identities</span>
          <span className='text-xl font-black text-amber-500 mt-1 block'>
            {verifiedCount}
          </span>
          <span className='text-[10px] text-slate-400'>Phone or email verified</span>
        </div>
      </div>

      {/* Role Segments Switcher & Search Bar */}
      <div className='bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {/* Main Segment Tabs */}
          <div className='inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold'>
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Accounts</span>
              <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700'>
                {allCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('hosts')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'hosts'
                  ? 'bg-white dark:bg-slate-950 font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FaHome className='text-emerald-500' />
              <span>Hosts &amp; Fleet Operators</span>
              <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'>
                {hostsCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('users')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'users'
                  ? 'bg-white dark:bg-slate-950 font-bold text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FaUsers className='text-sky-500' />
              <span>Travelers &amp; Guests</span>
              <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold'>
                {guestsCount}
              </span>
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold'
            >
              <option value='all'>All Statuses</option>
              <option value='verified'>Verified Only</option>
              <option value='unverified'>Unverified Only</option>
              <option value='disabled'>Disabled Only</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className='flex items-center justify-between gap-3 pt-1'>
          <div className='relative flex-1 max-w-md'>
            <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by full name, email address, or phone number...'
              className='w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400'
            />
          </div>

          <span className='text-slate-400 font-semibold'>
            Displaying <span className='text-slate-900 dark:text-white font-bold'>{filteredUsers.length}</span> members
          </span>
        </div>
      </div>

      {/* Main Users Table */}
      <div className='bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800'>
              <tr>
                <th className='py-3.5 px-4'>Full Name &amp; Email</th>
                <th className='py-3.5 px-4'>Phone Number &amp; Contact</th>
                <th className='py-3.5 px-4'>Account Classification</th>
                <th className='py-3.5 px-4'>Inventory / Activity</th>
                <th className='py-3.5 px-4'>Verification</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4 text-right'>Concierge Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
              {filteredUsers.map((user) => {
                const isCurrentUser =
                  user.uid === currentUser?.uid || user.email === currentUser?.email;
                const name = user.displayName || user.username || user.name || 'Member';
                const phone = user.phoneNumber || user.phone || '';
                const cleanPhone = phone.replace(/[^\d+]/g, '');
                const isHost =
                  user.accountType === 'host' ||
                  user.role === 'host' ||
                  (user.listingsCount && user.listingsCount > 0);

                return (
                  <tr
                    key={user.uid || user.id}
                    onClick={() => onSelectUserForDrawer?.(user)}
                    className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer'
                  >
                    {/* User & Email */}
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-9 h-9 rounded-2xl font-bold flex items-center justify-center text-xs shrink-0 ${
                            user.isAdmin
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : isHost
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {(name[0] || 'U').toUpperCase()}
                        </div>
                        <div className='min-w-0 max-w-xs'>
                          <span className='font-bold text-slate-900 dark:text-white truncate block'>
                            {name}
                            {isCurrentUser && (
                              <span className='ml-1 text-[10px] text-amber-500 font-semibold'>
                                (You)
                              </span>
                            )}
                          </span>
                          <span className='text-[11px] text-slate-400 truncate block flex items-center gap-1'>
                            <span>{user.email}</span>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(user.email, user.uid + '_email');
                              }}
                              className='text-slate-400 hover:text-slate-600'
                              title='Copy Email'
                            >
                              {copiedId === user.uid + '_email' ? (
                                <FaCheck className='text-[9px] text-emerald-500' />
                              ) : (
                                <FaCopy className='text-[9px]' />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone Number & WhatsApp */}
                    <td className='py-3 px-4' onClick={(e) => e.stopPropagation()}>
                      {phone ? (
                        <div className='flex items-center gap-2'>
                          <a
                            href={`tel:${phone}`}
                            className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs'
                            title='Call Phone Number'
                          >
                            <FaPhoneAlt className='text-[10px] text-emerald-600' />
                            <span>{phone}</span>
                          </a>

                          <a
                            href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                              `Hello ${name}, this is Chento100 Concierge. How can we help you?`
                            )}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                            title='Chat on WhatsApp'
                          >
                            <FaWhatsapp className='text-xs' />
                          </a>
                        </div>
                      ) : (
                        <span className='text-slate-400 text-[11px] italic'>
                          No phone registered
                        </span>
                      )}
                    </td>

                    {/* Classification */}
                    <td className='py-3 px-4'>
                      {user.isAdmin ? (
                        <span className='px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'>
                          Admin Director
                        </span>
                      ) : isHost ? (
                        <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1'>
                          <FaHome className='text-[10px]' />
                          <span>{user.hostType === 'car_service' ? 'Chauffeur Host' : 'Guesthouse Host'}</span>
                        </span>
                      ) : (
                        <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 inline-flex items-center gap-1'>
                          <FaUsers className='text-[10px]' />
                          <span>Traveler / Guest</span>
                        </span>
                      )}
                    </td>

                    {/* Inventory / Bookings */}
                    <td className='py-3 px-4 font-semibold text-slate-700 dark:text-slate-300'>
                      {isHost ? (
                        <span className='font-bold text-emerald-700 dark:text-emerald-300'>
                          {user.listingsCount || 1} Listed Properties
                        </span>
                      ) : (
                        <span className='text-slate-500'>
                          {user.bookingsCount || 1} Trips / Enquiries
                        </span>
                      )}
                    </td>

                    {/* Verification */}
                    <td className='py-3 px-4'>
                      {user.verified || user.emailVerified ? (
                        <span className='text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]'>
                          <FaCheckCircle className='text-xs' /> Verified
                        </span>
                      ) : (
                        <span className='text-amber-500 font-semibold text-[11px]'>
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className='py-3 px-4'>
                      {user.disabled ? (
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700'>
                          Suspended
                        </span>
                      ) : (
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700'>
                          Active
                        </span>
                      )}
                    </td>

                    {/* Concierge Actions */}
                    <td
                      className='py-3 px-4 text-right'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-end gap-1.5'>
                        {/* Quick Concierge Contact */}
                        <button
                          type='button'
                          onClick={() =>
                            onOpenContact?.({
                              name,
                              email: user.email,
                              phone,
                              role: isHost ? 'Host Provider' : 'Guest Traveler',
                              context: isHost ? 'hosted services' : 'bookings',
                            })
                          }
                          className='px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs'
                          title='Concierge Quick Contact'
                        >
                          <FaWhatsapp className='text-xs' />
                          <span>Contact</span>
                        </button>

                        {/* Toggle Admin */}
                        <button
                          type='button'
                          disabled={isCurrentUser}
                          onClick={() => onToggleAdminRole?.(user)}
                          className='p-1.5 text-slate-400 hover:text-amber-500 disabled:opacity-30 rounded-lg'
                          title={user.role === 'admin' ? 'Demote Admin' : 'Grant Admin'}
                        >
                          <FaUserShield />
                        </button>

                        {/* Toggle Disabled */}
                        <button
                          type='button'
                          disabled={isCurrentUser}
                          onClick={() => onToggleUserDisabled?.(user)}
                          className={`p-1.5 rounded-lg disabled:opacity-30 ${
                            user.disabled
                              ? 'text-emerald-500 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title={user.disabled ? 'Enable Account' : 'Suspend Account'}
                        >
                          {user.disabled ? <FaUserCheck /> : <FaBan />}
                        </button>

                        {/* Delete User */}
                        <button
                          type='button'
                          disabled={isCurrentUser}
                          onClick={() => onDeleteUserWithReauth?.(user)}
                          className='p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg'
                          title='Delete Account Permanently'
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
      </div>
    </div>
  );
}
