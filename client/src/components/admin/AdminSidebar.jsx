import React from 'react';
import {
  FaChartPie,
  FaClock,
  FaBell,
  FaListUl,
  FaUsers,
  FaHome,
  FaCar,
  FaConciergeBell,
  FaFlag,
  FaHistory,
  FaCog,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaArrowLeft,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  stats,
  availabilityRequestCount = 0,
  isMobileOpen,
  setIsMobileOpen,
  onSignOut,
  currentUser,
}) {
  const guesthouseCount = stats?.guesthouses?.total ?? (stats?.totalListings ? Math.ceil(stats.totalListings / 2) : 3);
  const carCount = stats?.cars?.total ?? (stats?.totalListings ? Math.floor(stats.totalListings / 2) : 3);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FaChartPie,
      badge: null,
    },
    {
      id: 'pending',
      label: 'Pending Review',
      icon: FaClock,
      badge: stats.pendingCount > 0 ? stats.pendingCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'availabilityRequests',
      label: 'Unavailable Requests',
      icon: FaBell,
      badge: availabilityRequestCount > 0 ? availabilityRequestCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'guesthouses',
      label: 'Guest Houses',
      icon: FaHome,
      badge: guesthouseCount > 0 ? guesthouseCount : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'cars',
      label: 'Cars & Drivers',
      icon: FaCar,
      badge: carCount > 0 ? carCount : null,
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      id: 'listings',
      label: 'All Inventory',
      icon: FaListUl,
      badge: stats.totalListings > 0 ? stats.totalListings : null,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'users',
      label: 'Users & Hosts',
      icon: FaUsers,
      badge: stats.totalUsers > 0 ? stats.totalUsers : null,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'enquiries',
      label: 'Bookings & Leads',
      icon: FaConciergeBell,
      badge: 4,
      badgeColor: 'bg-amber-400 text-slate-950',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FaFlag,
      badge: stats.openReportsCount > 0 ? stats.openReportsCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: FaHistory,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className='p-5 border-b border-slate-800/80 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-md'>
              <FaShieldAlt className='text-lg' />
            </div>
            <div>
              <span className='font-black text-sm tracking-tight text-white block'>
                chento <span className='text-amber-400'>100</span>
              </span>
              <span className='text-[10px] text-slate-400 uppercase tracking-widest font-semibold block'>
                Admin Console
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className='lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg'
            aria-label='Close sidebar'
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation List */}
        <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <Icon className={`text-sm ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-900 text-amber-300' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Inactivity Status & Return Link */}
        <div className='p-3 border-t border-slate-800/80 space-y-2'>
          <div className='p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400'>
            <span className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              <span>Session: Active</span>
            </span>
            <span className='text-[10px] text-slate-400'>30m Auto-Logout</span>
          </div>

          <Link
            to='/'
            className='w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition'
          >
            <FaArrowLeft className='text-[10px]' />
            <span>Return to Marketplace</span>
          </Link>
        </div>

        {/* Admin Profile & Sign Out Footer */}
        <div className='p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60'>
          <div className='flex items-center gap-2.5 overflow-hidden'>
            <div className='w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0'>
              {(currentUser?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className='overflow-hidden text-left'>
              <span className='text-xs font-bold text-white truncate block max-w-[110px]'>
                {currentUser?.displayName || 'Administrator'}
              </span>
              <span className='text-[10px] text-slate-400 truncate block max-w-[110px]' title={currentUser?.email}>
                {currentUser?.email}
              </span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className='p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer'
            title='Sign Out of Admin Console'
          >
            <FaSignOutAlt />
          </button>
        </div>
      </aside>
    </>
  );
}
