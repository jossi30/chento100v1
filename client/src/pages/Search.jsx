import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { getApprovedListings } from '../services/listingService';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaFilter, FaRedo, FaHome, FaCar, FaSlidersH } from 'react-icons/fa';

export default function Search() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    type: 'all',
    searchTerm: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    seats: '',
    driverIncluded: false,
    wifi: false,
    kitchen: false,
    airConditioning: false,
    pool: false,
    sortBy: 'newest',
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync state from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') || 'all';
    const cityParam = params.get('city') || params.get('searchTerm') || '';
    const minPriceParam = params.get('minPrice') || '';
    const maxPriceParam = params.get('maxPrice') || '';
    const bedroomsParam = params.get('bedrooms') || '';
    const seatsParam = params.get('seats') || '';
    const driverParam = params.get('driverIncluded') === 'true';
    const wifiParam = params.get('wifi') === 'true';
    const kitchenParam = params.get('kitchen') === 'true';
    const acParam = params.get('airConditioning') === 'true';
    const poolParam = params.get('pool') === 'true';
    const sortParam = params.get('sortBy') || 'newest';

    const newFilters = {
      type: typeParam,
      searchTerm: cityParam,
      city: cityParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      bedrooms: bedroomsParam,
      seats: seatsParam,
      driverIncluded: driverParam,
      wifi: wifiParam,
      kitchen: kitchenParam,
      airConditioning: acParam,
      pool: poolParam,
      sortBy: sortParam,
    };

    setFilters(newFilters);
    fetchData(newFilters);
  }, [location.search]);

  const fetchData = async (currentFilters) => {
    setLoading(true);
    try {
      const amenitiesList = [];
      if (currentFilters.wifi) amenitiesList.push('WiFi');
      if (currentFilters.kitchen) amenitiesList.push('Kitchen');
      if (currentFilters.airConditioning) amenitiesList.push('Air Conditioning');
      if (currentFilters.pool) amenitiesList.push('Pool');

      const result = await getApprovedListings({
        type: currentFilters.type === 'all' ? null : currentFilters.type,
        city: currentFilters.city || currentFilters.searchTerm,
        minPrice: currentFilters.minPrice ? Number(currentFilters.minPrice) : null,
        maxPrice: currentFilters.maxPrice ? Number(currentFilters.maxPrice) : null,
        bedrooms: currentFilters.bedrooms ? Number(currentFilters.bedrooms) : null,
        seats: currentFilters.seats ? Number(currentFilters.seats) : null,
        amenities: amenitiesList,
        driverIncluded: currentFilters.type === 'car' && currentFilters.driverIncluded ? true : null,
        sortBy: currentFilters.sortBy,
        pageSize: 12,
      });

      setListings(result.listings || []);
      setLastVisibleDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.warn('Search query error:', err.message);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastVisibleDoc || loadingMore) return;
    setLoadingMore(true);

    try {
      const amenitiesList = [];
      if (filters.wifi) amenitiesList.push('WiFi');
      if (filters.kitchen) amenitiesList.push('Kitchen');
      if (filters.airConditioning) amenitiesList.push('Air Conditioning');
      if (filters.pool) amenitiesList.push('Pool');

      const result = await getApprovedListings({
        type: filters.type === 'all' ? null : filters.type,
        city: filters.city || filters.searchTerm,
        minPrice: filters.minPrice ? Number(filters.minPrice) : null,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : null,
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : null,
        seats: filters.seats ? Number(filters.seats) : null,
        amenities: amenitiesList,
        driverIncluded: filters.type === 'car' && filters.driverIncluded ? true : null,
        sortBy: filters.sortBy,
        lastDoc: lastVisibleDoc,
        pageSize: 12,
      });

      setListings((prev) => [...prev, ...(result.listings || [])]);
      setLastVisibleDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.warn('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.city.trim()) params.set('city', filters.city.trim());
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
    if (filters.seats) params.set('seats', filters.seats);
    if (filters.driverIncluded) params.set('driverIncluded', 'true');
    if (filters.wifi) params.set('wifi', 'true');
    if (filters.kitchen) params.set('kitchen', 'true');
    if (filters.airConditioning) params.set('airConditioning', 'true');
    if (filters.pool) params.set('pool', 'true');
    if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);

    navigate(`/search?${params.toString()}`);
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    navigate('/search');
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 text-slate-800'>
      {/* Top Header & Mobile Filter Trigger */}
      <div className='flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>{t('search.browseListings')}</h1>
          <p className='text-xs text-slate-500 mt-0.5'>
            {loading ? t('search.searchingLive') : `${t('search.showingApproved')} ${listings.length} ${t('search.approvedListings')}`}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className='md:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition border border-slate-200'
          >
            <FaSlidersH />
            <span>{t('search.filters')}</span>
          </button>

          {/* Sort By Dropdown */}
          <div className='flex items-center gap-2'>
            <label className='text-xs text-slate-500 hidden sm:inline font-medium'>{t('search.sort')}</label>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                handleFilterChange('sortBy', e.target.value);
                const params = new URLSearchParams(location.search);
                params.set('sortBy', e.target.value);
                navigate(`/search?${params.toString()}`);
              }}
              className='px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 shadow-2xs'
            >
              <option value='newest'>{t('search.sortNewest')}</option>
              <option value='price_asc'>{t('search.sortPriceAsc')}</option>
              <option value='price_desc'>{t('search.sortPriceDesc')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className='flex flex-col md:flex-row gap-8'>
        {/* Sidebar Filter Panel */}
        <aside
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } md:block w-full md:w-72 shrink-0 space-y-6 bg-white md:bg-transparent p-5 md:p-0 rounded-2xl border border-slate-200 md:border-none shadow-sm md:shadow-none`}
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2'>
              <FaFilter className='text-amber-500' />
              <span>{t('search.filters')}</span>
            </h2>
            <button
              type='button'
              onClick={handleResetFilters}
              className='text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer'
            >
              <FaRedo className='text-[10px]' />
              <span>{t('search.reset')}</span>
            </button>
          </div>

          <form onSubmit={applyFilters} className='space-y-5'>
            {/* Category Selector */}
            <div className='space-y-2'>
              <label className='text-xs font-bold text-slate-700 uppercase'>{t('search.category')}</label>
              <div className='grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs'>
                <button
                  type='button'
                  onClick={() => handleFilterChange('type', 'all')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    filters.type === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('search.all')}
                </button>
                <button
                  type='button'
                  onClick={() => handleFilterChange('type', 'guesthouse')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    filters.type === 'guesthouse'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FaHome className='text-amber-500' />
                  <span>{t('search.stays')}</span>
                </button>
                <button
                  type='button'
                  onClick={() => handleFilterChange('type', 'car')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    filters.type === 'car'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FaCar className='text-amber-500' />
                  <span>{t('search.cars')}</span>
                </button>
              </div>
            </div>

            {/* Makindye Neighborhood / Keyword */}
            <div className='space-y-2'>
              <label className='text-xs font-bold text-slate-700 uppercase'>
                {t('search.makindyeNeighborhood')}
              </label>
              <div className='relative'>
                <FaSearch className='absolute left-3 top-3 text-slate-400 text-xs' />
                <input
                  type='text'
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder={t('search.neighborhoodPlaceholder')}
                  className='w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white'
                />
              </div>

              {/* Quick Neighborhood Tags */}
              <div className='flex flex-wrap gap-1 pt-1'>
                {['Muyenga', 'Munyonyo', 'Buziga', 'Ggaba', 'Kansanga', 'Makindye', 'Kabalagala', 'Nsambya'].map((hood) => {
                  const isSelected = filters.city.toLowerCase() === hood.toLowerCase();
                  return (
                    <button
                      key={hood}
                      type='button'
                      onClick={() => {
                        const nextVal = isSelected ? '' : hood;
                        handleFilterChange('city', nextVal);
                        const params = new URLSearchParams(location.search);
                        if (nextVal) {
                          params.set('city', nextVal);
                        } else {
                          params.delete('city');
                        }
                        navigate(`/search?${params.toString()}`);
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {hood}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className='space-y-1.5'>
              <label className='text-xs font-bold text-slate-700 uppercase'>{t('search.priceRange')}</label>
              <div className='grid grid-cols-2 gap-2'>
                <input
                  type='number'
                  min='0'
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder={t('search.minPrice')}
                  className='w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900'
                />
                <input
                  type='number'
                  min='0'
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder={t('search.maxPrice')}
                  className='w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900'
                />
              </div>
            </div>

            {/* Guest House Specific Filters */}
            {filters.type !== 'car' && (
              <div className='space-y-3 pt-2 border-t border-slate-100'>
                <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                  {t('search.guestHouseSpecs')}
                </span>
                <div>
                  <label className='text-xs text-slate-600 block mb-1'>{t('search.minBedrooms') || 'Min Bedrooms'}</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    className='w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white'
                  >
                    <option value=''>{t('search.anyBedrooms')}</option>
                    <option value='1'>{t('search.onePlusBed')}</option>
                    <option value='2'>{t('search.twoPlusBed')}</option>
                    <option value='3'>{t('search.threePlusBed')}</option>
                    <option value='4'>{t('search.fourPlusBed')}</option>
                  </select>
                </div>

                {/* Amenities */}
                <div className='space-y-1.5 pt-1'>
                  <label className='text-xs text-slate-600 block'>{t('search.amenities')}</label>
                  <div className='space-y-1 text-xs text-slate-700'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={filters.wifi}
                        onChange={(e) => handleFilterChange('wifi', e.target.checked)}
                        className='rounded text-slate-900'
                      />
                      <span>{t('search.wifi')}</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={filters.kitchen}
                        onChange={(e) => handleFilterChange('kitchen', e.target.checked)}
                        className='rounded text-slate-900'
                      />
                      <span>{t('search.kitchen')}</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={filters.airConditioning}
                        onChange={(e) => handleFilterChange('airConditioning', e.target.checked)}
                        className='rounded text-slate-900'
                      />
                      <span>{t('search.airConditioning')}</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={filters.pool}
                        onChange={(e) => handleFilterChange('pool', e.target.checked)}
                        className='rounded text-slate-900'
                      />
                      <span>{t('search.poolGarden')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Car Leasing Specific Filters */}
            {filters.type !== 'guesthouse' && (
              <div className='space-y-3 pt-2 border-t border-slate-100'>
                <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                  {t('search.carLeasingSpecs')}
                </span>
                <div>
                  <label className='text-xs text-slate-600 block mb-1'>{t('search.seats') || 'Min Seats'}</label>
                  <select
                    value={filters.seats}
                    onChange={(e) => handleFilterChange('seats', e.target.value)}
                    className='w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white'
                  >
                    <option value=''>{t('search.anySeats')}</option>
                    <option value='4'>{t('search.fourSeats')}</option>
                    <option value='5'>{t('search.fiveSeats')}</option>
                    <option value='7'>{t('search.sevenSeats')}</option>
                  </select>
                </div>

                <label className='flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1'>
                  <input
                    type='checkbox'
                    checked={filters.driverIncluded}
                    onChange={(e) => handleFilterChange('driverIncluded', e.target.checked)}
                    className='rounded text-slate-900'
                  />
                  <span>{t('search.proDriverIncluded')}</span>
                </label>
              </div>
            )}

            <button
              type='submit'
              className='w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-xs transition shadow-sm cursor-pointer'
            >
              {t('search.applyFilters')}
            </button>
          </form>
        </aside>

        {/* Listings Result Grid */}
        <section className='flex-1 min-w-0'>
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className='h-72 bg-slate-100 rounded-2xl animate-pulse' />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className='space-y-8'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {listings.map((listing) => (
                  <ListingItem key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination: Load More */}
              {hasMore && (
                <div className='text-center pt-4'>
                  <button
                    type='button'
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className='px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-60 cursor-pointer'
                  >
                    {loadingMore ? t('search.loadingMore') : t('search.loadMore')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Clean Empty State (Rule 1) */
            <div className='bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8'>
              <div className='w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl'>
                <FaSearch />
              </div>
              <h3 className='text-xl font-bold text-slate-900'>{t('search.noListingsFound')}</h3>
              <p className='text-xs text-slate-500 leading-relaxed'>
                {t('search.noListingsDesc')}
              </p>
              <button
                type='button'
                onClick={handleResetFilters}
                className='px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition'
              >
                {t('search.resetAll')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
