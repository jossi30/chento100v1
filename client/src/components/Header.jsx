import {
  FaSearch,
  FaGlobe,
  FaPlus,
  FaHome,
  FaCar,
  FaShieldAlt,
  FaBars,
  FaTimes,
  FaFire,
  FaUser,
  FaSignOutAlt,
  FaInfoCircle,
  FaChevronRight,
  FaSuitcaseRolling,
} from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { adminUrl } from '../services/adminUrl';

export default function Header() {
  const { currentUser, isAdmin, logOut } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    if (searchTerm.trim()) {
      urlParams.set('searchTerm', searchTerm.trim());
    } else {
      urlParams.delete('searchTerm');
    }
    setMobileMenuOpen(false);
    navigate(`/search?${urlParams.toString()}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const term = urlParams.get('searchTerm') || urlParams.get('city') || '';
    setSearchTerm(term);
  }, [location.search]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      if (logOut) await logOut();
      setMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.warn('Sign out error:', err.message);
    }
  };

  const navLinks = [
    {
      to: '/search?type=guesthouse',
      label: t('header.guestHouses'),
      icon: FaHome,
      sublabel: t('header.sublabelStays'),
    },
    {
      to: '/search?type=car',
      label: t('header.carLeasing'),
      icon: FaCar,
      sublabel: t('header.sublabelCars'),
    },
    {
      to: '/search?offer=true',
      label: t('header.bestOffers'),
      icon: FaFire,
      sublabel: t('header.sublabelOffers'),
      badge: 'Hot',
    },
    {
      to: '/partner',
      label: t('header.partnerWithUs'),
      icon: FaPlus,
      sublabel: t('header.sublabelPartner'),
    },
    {
      to: '/about',
      label: t('header.aboutPlatform'),
      icon: FaInfoCircle,
      sublabel: t('header.sublabelAbout'),
    },
  ];

  return (
    <>
      <header className='sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-xs transition-all duration-300'>
        <div className='flex justify-between items-center max-w-6xl mx-auto px-4 py-3 gap-2 sm:gap-4'>
          {/* Brand Logo */}
          <Link
            to='/'
            className='group flex items-center transition-transform duration-200 active:scale-95 shrink-0'
          >
            <h1 className='font-bold text-base sm:text-xl tracking-tight flex items-center'>
              <span className='text-slate-500 group-hover:text-slate-600 transition-colors'>chento</span>
              <span className='text-slate-900 group-hover:text-slate-950 transition-colors font-black'>&nbsp;100</span>
            </h1>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSubmit}
            className='bg-slate-100 hover:bg-slate-100/90 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 px-3.5 py-1.5 sm:py-2 rounded-full flex items-center gap-2 transition-all duration-200 shadow-2xs max-w-xs sm:max-w-sm flex-1'
          >
            <input
              type='text'
              placeholder={t('header.searchPlaceholder')}
              className='bg-transparent focus:outline-hidden text-xs sm:text-sm text-slate-800 placeholder-slate-400 w-full transition-all'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type='submit'
              aria-label='Search'
              className='text-slate-500 hover:text-slate-800 transition-transform active:scale-90 p-0.5 cursor-pointer'
            >
              <FaSearch className='text-xs sm:text-sm' />
            </button>
          </form>

          {/* Desktop Nav Links */}
          <ul className='hidden md:flex items-center gap-3 text-xs sm:text-sm font-semibold shrink-0'>
            <Link
              to='/search?type=guesthouse'
              className='inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-950 transition-colors py-1'
            >
              <FaHome className='text-slate-400 text-xs' />
              <span>{t('header.guestHouses')}</span>
            </Link>

            <Link
              to='/search?type=car'
              className='inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-950 transition-colors py-1'
            >
              <FaCar className='text-slate-400 text-xs' />
              <span>{t('header.carLeasing')}</span>
            </Link>

            <Link
              to='/partner'
              className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition shadow-xs text-xs font-bold'
            >
              <FaPlus className='text-[10px]' />
              <span>{t('header.partnerWithUs')}</span>
            </Link>

            {isAdmin && (
              <a href={adminUrl()}>
                <li className='flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-black text-amber-300 hover:bg-neutral-800 transition shadow-xs'>
                  <FaShieldAlt className='text-xs' />
                  <span>{t('header.admin')}</span>
                </li>
              </a>
            )}

            <button
              type='button'
              onClick={toggleLanguage}
              title={t('header.langTitle')}
              className='inline-flex items-center p-0.5 rounded-full border border-slate-200 bg-slate-100 hover:border-slate-300 transition shadow-2xs cursor-pointer shrink-0'
              aria-label={t('header.langTitle')}
            >
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                  language === 'ti'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ትግ
              </span>
            </button>

            {currentUser ? (
              <div className='flex items-center gap-2.5'>
                <Link to='/partner' className='flex items-center' title='Partner Dashboard'>
                  <img
                    className='rounded-full h-8 w-8 object-cover border border-slate-200 ring-2 ring-transparent hover:ring-slate-900 transition'
                    src={
                      currentUser.photoURL ||
                      'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                    }
                    alt='partner profile'
                  />
                </Link>
              </div>
            ) : null}
          </ul>

          {/* Mobile Right Controls: Hamburger Toggle & Quick Dashboard */}
          <div className='flex md:hidden items-center gap-2 shrink-0'>
            {currentUser ? (
              <Link to='/partner' className='flex items-center' title='Partner Dashboard'>
                <img
                  className='rounded-full h-7 w-7 object-cover border border-slate-200'
                  src={
                    currentUser.photoURL ||
                    'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                  }
                  alt='partner profile'
                />
              </Link>
            ) : null}

            <button
              type='button'
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className='p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition active:scale-95 border border-slate-200/80 cursor-pointer shadow-2xs'
            >
              {mobileMenuOpen ? <FaTimes className='text-base' /> : <FaBars className='text-base' />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity md:hidden animate-fadeIn'
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        id='mobile-navigation-drawer'
        aria-label='Mobile navigation'
        className={`fixed top-0 right-0 bottom-0 z-50 w-[84%] max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out md:hidden border-l border-slate-200 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='p-5 space-y-5'>
          {/* Drawer Top Header */}
          <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
            <Link to='/' onClick={() => setMobileMenuOpen(false)} className='flex items-center'>
              <span className='font-bold text-lg text-slate-500'>chento</span>
              <span className='font-black text-lg text-slate-900'>&nbsp;100</span>
            </Link>

            <button
              type='button'
              onClick={() => setMobileMenuOpen(false)}
              aria-label='Close menu'
              className='p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer'
            >
              <FaTimes className='text-base' />
            </button>
          </div>

          {/* User Account Card */}
          <div className='p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3'>
            {currentUser ? (
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <img
                    src={
                      currentUser.photoURL ||
                      'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                    }
                    alt=''
                    className='w-10 h-10 rounded-full object-cover border border-slate-200'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-bold text-slate-900 truncate'>
                      {currentUser.displayName || currentUser.username || 'Member'}
                    </p>
                    <p className='text-[11px] text-slate-500 truncate'>
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-1.5'>
                  <Link
                    to='/partner'
                    onClick={() => setMobileMenuOpen(false)}
                    className='px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shrink-0 flex items-center gap-1.5 shadow-xs'
                  >
                    <FaSuitcaseRolling className='text-amber-400 text-xs' />
                    <span>Partner Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-slate-800 text-xs font-bold'>
                  <FaUser className='text-slate-400' />
                  <span>{t('header.welcome')}</span>
                </div>
                <p className='text-[11px] text-slate-500 leading-relaxed'>
                  List your boutique guest house or chauffeur car fleet on chento 100.
                </p>
                <Link
                  to='/partner'
                  onClick={() => setMobileMenuOpen(false)}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition mt-1 shadow-xs'
                >
                  <FaPlus className='text-[10px]' />
                  <span>Partner with Us</span>
                </Link>
              </div>
            )}
          </div>

          {/* Primary Navigation Links */}
          <div className='space-y-1.5'>
            <span className='text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block'>
              {t('header.marketplaceMenu')}
            </span>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to.split('?')[0];

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition group ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-50 text-slate-800 border border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-xs'>{item.label}</span>
                        {item.badge && (
                          <span className='px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white uppercase'>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[10px] ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.sublabel}
                      </p>
                    </div>
                  </div>

                  <FaChevronRight
                    className={`text-[10px] ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Admin Management Section (If Administrator) */}
          {isAdmin && (
            <div className='p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5'>
              <div className='flex items-center gap-2 text-amber-900 text-xs font-black uppercase tracking-wider'>
                <FaShieldAlt className='text-amber-600' />
                <span>{t('header.adminSuite')}</span>
              </div>
              <div className='grid grid-cols-1 gap-2'>
                <a
                  href={adminUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className='p-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs border border-amber-200 shadow-2xs hover:bg-amber-100 transition flex items-center justify-between'
                >
                  <span>{t('header.queueModeration')}</span>
                  <FaChevronRight className='text-[10px] text-slate-400' />
                </a>
                <a
                  href={adminUrl()}
                  className='p-2.5 bg-slate-900 text-amber-300 font-bold rounded-xl text-xs shadow-2xs hover:bg-slate-800 transition flex items-center justify-between'
                >
                  <span>{t('header.standaloneAdmin')}</span>
                  <FaChevronRight className='text-[10px] text-amber-400' />
                </a>
              </div>
            </div>
          )}

          {/* Language Switcher */}
          <div className='pt-1'>
            <div className='flex items-center justify-between py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50/70'>
              <div className='flex items-center gap-2 text-xs font-semibold text-slate-700'>
                <FaGlobe className='text-slate-400 text-xs' />
                <span>Language / ቋንቋ</span>
              </div>
              <button
                type='button'
                onClick={toggleLanguage}
                title={t('header.langTitle')}
                className='inline-flex items-center p-0.5 rounded-full border border-slate-200 bg-white transition shadow-2xs cursor-pointer'
                aria-label={t('header.langTitle')}
              >
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                    language === 'en'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                    language === 'ti'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ትግ
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Bottom Footer */}
        <div className='p-5 border-t border-slate-100 bg-slate-50/50 space-y-3'>
          {currentUser && (
            <button
              type='button'
              onClick={handleSignOut}
              className='w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer'
            >
              <FaSignOutAlt />
              <span>{t('header.signOut')}</span>
            </button>
          )}

          <p className='text-[10px] text-slate-400 text-center'>
            {t('footer.moderatedNote')}
          </p>
        </div>
      </aside>
    </>
  );
}
