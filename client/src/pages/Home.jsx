import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { getApprovedListings, getOfferListings } from '../services/listingService';
import { useLanguage } from '../context/LanguageContext';
import {
  FaSearch,
  FaHome,
  FaCar,
  FaPlus,
  FaFire,
  FaTag,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaUserFriends,
  FaShieldAlt,
  FaPlaneDeparture,
  FaCheckCircle,
  FaUserCheck,
  FaChevronDown,
  FaKey,
  FaClock,
  FaStar,
  FaArrowRight,
  FaSuitcaseRolling,
  FaCompass,
} from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Put your hero photo in /public (e.g. /public/hero.jpg) or change this path.
// A wide, bright architectural photo works best (like the reference image).
const HERO_IMAGE = '/hero.jpg';

export default function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const heroSwiperRef = useRef(null);
  const swiperRef = useRef(null);

  // Search Bar State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'guesthouse' | 'car'
  const [searchLocation, setSearchLocation] = useState('');

  // Interactive FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);
  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Firestore live state
  const [bestOffers, setBestOffers] = useState([]);
  const [guestHouses, setGuestHouses] = useState([]);
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMarketplaceData() {
      setLoading(true);
      try {
        const [offersData, ghData, carData] = await Promise.all([
          getOfferListings(8),
          getApprovedListings({ type: 'guesthouse', pageSize: 6 }),
          getApprovedListings({ type: 'car', pageSize: 6 }),
        ]);

        if (isMounted) {
          setBestOffers(offersData || []);
          setGuestHouses(ghData.listings || []);
          setCarListings(carData.listings || []);
        }
      } catch (err) {
        console.warn('Home page live data fetch notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMarketplaceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeTab !== 'all') {
      params.set('type', activeTab);
    }
    if (searchLocation.trim()) {
      params.set('city', searchLocation.trim());
    }
    navigate(`/search?${params.toString()}`);
  };

  const totalListingsCount = guestHouses.length + carListings.length;

  // Shared tab styles
  const tabBase =
    'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer';
  const tabActive = 'bg-black text-white shadow-xs';
  const tabIdle = 'text-neutral-600 hover:text-black hover:bg-neutral-100';

  return (
    <div className="flex flex-col gap-24 pb-24 bg-white text-neutral-900 font-['Inter_Tight','Inter',ui-sans-serif,system-ui,sans-serif]">
      {/* Hero Section */}
      <section className='relative bg-white pt-14 sm:pt-20 px-4 sm:px-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Headline row: big title left, small gray copy right */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
            <div className='lg:col-span-8 space-y-8'>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[1.02] text-neutral-900'>
                {t('home.heroHeadline')}
              </h1>
            </div>

            <p className='lg:col-span-3 lg:col-start-10 lg:pt-10 text-neutral-500 text-xs sm:text-[13px] leading-relaxed max-w-xs'>
              {t('home.heroSubheadline')}
            </p>
          </div>

          {/* Hero image with floating search box */}
          <div className='relative mt-10 sm:mt-14'>
            <div className='h-[360px] sm:h-[480px] lg:h-[560px] w-full rounded-3xl overflow-hidden relative shadow-md bg-neutral-900 group'>
              {bestOffers.length > 0 ? (
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  onBeforeInit={(swiper) => {
                    heroSwiperRef.current = swiper;
                  }}
                  loop={bestOffers.length > 1}
                  speed={750}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  className='w-full h-full hero-offers-swiper'
                >
                  {bestOffers.map((offer, index) => {
                    const isGuestHouse =
                      offer.type === 'guesthouse' ||
                      offer.category === 'guesthouse' ||
                      offer.type === 'rent';

                    const images =
                      Array.isArray(offer.images) && offer.images.length > 0
                        ? offer.images
                        : Array.isArray(offer.imageUrls) && offer.imageUrls.length > 0
                        ? offer.imageUrls
                        : [];

                    const coverImage =
                      images[0] ||
                      (isGuestHouse
                        ? '/images/airbnb_apartment_living.jpg'
                        : '/images/city_regular_sedan.jpg');

                    const regularPrice = Number(offer.regularPrice || offer.price || 0);
                    const discountPrice = Number(offer.discountPrice || 0);
                    const hasDiscount = discountPrice > 0 && discountPrice < regularPrice;
                    const effectivePrice = hasDiscount ? discountPrice : Number(offer.price || regularPrice);
                    const savings = hasDiscount ? regularPrice - discountPrice : 0;
                    const priceUnit = offer.priceUnit || (isGuestHouse ? 'night' : 'day');
                    const currency = offer.currency || 'USD';
                    const locationText =
                      [offer.city, offer.area].filter(Boolean).join(', ') ||
                      offer.location ||
                      offer.address ||
                      'Makindye, Kampala';

                    return (
                      <SwiperSlide key={offer.id || index} className='relative w-full h-full'>
                        {/* Background Photo */}
                        <div
                          className='absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 scale-100 group-hover:scale-105'
                          style={{ backgroundImage: `url(${coverImage})` }}
                          role='img'
                          aria-label={offer.title}
                        />

                        {/* Elegant Dark Gradient Overlays */}
                        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45' />
                        <div className='absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent' />

                        {/* Floating Offer Badge Card */}
                        <div className='absolute top-5 left-5 sm:top-8 sm:left-8 z-10 max-w-sm sm:max-w-md text-white space-y-2 pointer-events-auto'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-rose-600 text-white shadow-md'>
                              <FaFire className='text-amber-300 text-xs' />
                              <span>{t('home.adminOffer')}</span>
                            </span>

                            <span className='px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs'>
                              {isGuestHouse ? `🏡 ${t('home.guestHouses')}` : `🚗 ${t('home.carLeasing')}`}
                            </span>

                            {hasDiscount && (
                              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-neutral-950 shadow-md'>
                                {t('home.save')} ${savings}/{priceUnit}
                              </span>
                            )}
                          </div>

                          <Link to={`/listing/${offer.id}`}>
                            <h2 className='text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-md line-clamp-1 hover:text-amber-300 transition-colors'>
                              {offer.title || offer.name}
                            </h2>
                          </Link>

                          <div className='flex items-center gap-2 text-xs text-neutral-200'>
                            <span className='flex items-center gap-1'>
                              <FaMapMarkerAlt className='text-rose-400' />
                              <span>{locationText}</span>
                            </span>
                            <span>•</span>
                            <div className='flex items-baseline gap-1'>
                              {hasDiscount && (
                                <span className='text-neutral-400 line-through text-xs'>
                                  ${regularPrice}
                                </span>
                              )}
                              <span className='text-base sm:text-lg font-black text-amber-300'>
                                {currency === 'USD' ? '$' : `${currency} `}
                                {effectivePrice.toLocaleString()}
                              </span>
                              <span className='text-xs text-neutral-300 font-normal'>
                                /{priceUnit}
                              </span>
                            </div>
                          </div>

                          <div className='pt-1'>
                            <Link
                              to={`/listing/${offer.id}`}
                              className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 font-bold text-xs shadow-md transition border border-neutral-700'
                            >
                              <span>{t('home.exploreOffer')}</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              ) : (
                /* Fallback single hero image if no offers yet */
                <div
                  className='h-full w-full bg-cover bg-center'
                  style={{ backgroundImage: `url(${HERO_IMAGE})` }}
                  role='img'
                  aria-label='Modern house exterior'
                />
              )}

              {/* Prev / Next controls on the sides of the hero slideshow */}
              {bestOffers.length > 1 && (
                <>
                  <button
                    type='button'
                    onClick={() => heroSwiperRef.current?.slidePrev()}
                    aria-label='Previous offer'
                    className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg opacity-80 hover:opacity-100 cursor-pointer'
                  >
                    <FaChevronLeft className='text-xs sm:text-sm' />
                  </button>
                  <button
                    type='button'
                    onClick={() => heroSwiperRef.current?.slideNext()}
                    aria-label='Next offer'
                    className='absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg opacity-80 hover:opacity-100 cursor-pointer'
                  >
                    <FaChevronRight className='text-xs sm:text-sm' />
                  </button>
                </>
              )}
            </div>

            {/* Search Box with Tabbed Selector */}
            <div className='relative sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 -mt-16 sm:mt-0 mx-3 sm:mx-0 w-auto sm:w-[92%] max-w-3xl bg-white rounded-2xl p-3 sm:p-4 text-neutral-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] border border-neutral-200 z-10'>
              {/* Category Tabs */}
              <div className='flex items-center gap-1 mb-3 bg-neutral-100 p-1 rounded-full w-full sm:w-max'>
                <button
                  type='button'
                  onClick={() => setActiveTab('all')}
                  className={`${tabBase} ${activeTab === 'all' ? tabActive : tabIdle}`}
                >
                  {t('home.allCategories')}
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTab('guesthouse')}
                  className={`${tabBase} ${activeTab === 'guesthouse' ? tabActive : tabIdle}`}
                >
                  <FaHome />
                  <span>{t('home.guestHouses')}</span>
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTab('car')}
                  className={`${tabBase} ${activeTab === 'car' ? tabActive : tabIdle}`}
                >
                  <FaCar />
                  <span>{t('home.carLeasing')}</span>
                </button>
              </div>

              {/* Form Input and Search Button */}
              <form onSubmit={handleSearchSubmit} className='flex flex-col sm:flex-row gap-2.5 items-center'>
                <div className='relative flex-1 w-full'>
                  <FaSearch className='absolute left-4 top-3.5 text-neutral-400 text-sm' />
                  <input
                    type='text'
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder={
                      activeTab === 'guesthouse'
                        ? t('home.searchPlaceholderStay')
                        : activeTab === 'car'
                        ? t('home.searchPlaceholderCar')
                        : t('home.searchPlaceholderAll')
                    }
                    className='w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-900'
                  />
                </div>

                <button
                  type='submit'
                  className='w-full sm:w-auto px-8 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-sm rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-md'
                >
                  <FaSearch />
                  <span>{t('home.searchButton')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className='max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-20'>
        {/* Section: Best Offers Slideshow */}
        {bestOffers.length > 0 && (
          <section className='space-y-6 relative'>
            <div className='flex items-end justify-between'>
              <div className='flex items-center gap-3'>
                <span className='w-9 h-9 flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 rounded-full text-sm shadow-xs'>
                  <FaFire />
                </span>
                <div>
                  <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 mb-1'>
                    <FaTag className='text-[10px]' />
                    <span>{t('home.specialPromo')}</span>
                  </div>
                  <h2 className='text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900'>
                    {t('home.bestOffers')}
                  </h2>
                  <p className='text-xs text-neutral-500 mt-0.5'>
                    {t('home.bestOffersSub')}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                {/* Desktop/Tablet Slideshow Prev & Next Controls */}
                <div className='hidden sm:flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label='Previous slide'
                    className='w-9 h-9 rounded-full border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-900 text-neutral-700 hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer'
                  >
                    <FaChevronLeft className='text-xs' />
                  </button>
                  <button
                    type='button'
                    onClick={() => swiperRef.current?.slideNext()}
                    aria-label='Next slide'
                    className='w-9 h-9 rounded-full border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-900 text-neutral-700 hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer'
                  >
                    <FaChevronRight className='text-xs' />
                  </button>
                </div>

                <Link
                  to='/search?offer=true'
                  className='text-xs font-medium text-neutral-900 border border-neutral-200 hover:border-neutral-900 px-4 py-2 rounded-md transition whitespace-nowrap'
                >
                  {t('home.viewAllOffers')}
                </Link>
              </div>
            </div>

            {/* Swiper Slideshow Container */}
            <div className='relative best-offers-slideshow'>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                onBeforeInit={(swiper) => {
                  swiperRef.current = swiper;
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                autoplay={{
                  delay: 4500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                loop={bestOffers.length > 3}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 20 },
                  1024: { slidesPerView: 3, spaceBetween: 24 },
                  1280: { slidesPerView: 4, spaceBetween: 24 },
                }}
                className='pb-12 pt-1'
              >
                {bestOffers.map((listing) => {
                  const isGuestHouse =
                    listing.type === 'guesthouse' ||
                    listing.category === 'guesthouse' ||
                    listing.type === 'rent';

                  const images =
                    Array.isArray(listing.images) && listing.images.length > 0
                      ? listing.images
                      : Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
                      ? listing.imageUrls
                      : [];

                  const coverImage =
                    images[0] ||
                    (isGuestHouse
                      ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
                      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80');

                  const regularPrice = Number(listing.regularPrice || listing.price || 0);
                  const discountPrice = Number(listing.discountPrice || 0);
                  const hasDiscount = discountPrice > 0 && discountPrice < regularPrice;
                  const effectivePrice = hasDiscount ? discountPrice : Number(listing.price || regularPrice);
                  const savings = hasDiscount ? regularPrice - discountPrice : 0;
                  const priceUnit = listing.priceUnit || (isGuestHouse ? 'night' : 'day');
                  const currency = listing.currency || 'USD';
                  const locationText =
                    [listing.city, listing.area].filter(Boolean).join(', ') ||
                    listing.location ||
                    listing.address ||
                    'Makindye, Kampala';

                  return (
                    <SwiperSlide key={listing.id} className='h-auto'>
                      <div className='group bg-white rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full'>
                        {/* Slide Photo with Badges */}
                        <Link
                          to={`/listing/${listing.id}`}
                          className='relative h-56 w-full overflow-hidden bg-neutral-100 block'
                        >
                          <img
                            src={coverImage}
                            alt={listing.title}
                            loading='lazy'
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out'
                          />

                          {/* Floating Badges */}
                          <div className='absolute top-3 left-3 flex items-center gap-1.5 flex-wrap'>
                            <span className='bg-neutral-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs border border-white/10'>
                              {isGuestHouse ? t('listing.guestHouse') : t('listing.carLeasing')}
                            </span>
                            <span className='bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1'>
                              <FaFire className='text-amber-300 text-xs' />
                              <span>{t('home.bestOffer')}</span>
                            </span>
                          </div>

                          {/* Discount Savings Tag */}
                          {hasDiscount && (
                            <div className='absolute top-3 right-3 bg-amber-400 text-neutral-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-md'>
                              {t('home.save')} ${savings}/{priceUnit}
                            </div>
                          )}
                        </Link>

                        {/* Slide Details */}
                        <div className='p-4 sm:p-5 flex flex-col flex-1 gap-2.5'>
                          <Link to={`/listing/${listing.id}`}>
                            <h3 className='font-bold text-neutral-900 text-base line-clamp-1 group-hover:text-rose-600 transition-colors'>
                              {listing.title || listing.name}
                            </h3>
                          </Link>

                          <div className='flex items-center gap-1.5 text-neutral-500 text-xs truncate'>
                            <FaMapMarkerAlt className='text-rose-500 shrink-0 text-xs' />
                            <span className='truncate'>{locationText}</span>
                          </div>

                          {/* Specs */}
                          <div className='flex items-center gap-3 text-xs text-neutral-600 py-2 border-y border-neutral-100 my-1'>
                            {isGuestHouse ? (
                              <>
                                <span className='flex items-center gap-1'>
                                  <FaBed className='text-neutral-400' />
                                  <span>{listing.bedrooms || 1} {t('listing.beds')}</span>
                                </span>
                                <span className='flex items-center gap-1'>
                                  <FaBath className='text-neutral-400' />
                                  <span>{listing.bathrooms || 1} {t('listing.baths')}</span>
                                </span>
                                <span className='flex items-center gap-1'>
                                  <FaUserFriends className='text-neutral-400' />
                                  <span>{listing.maxGuests || 2} {t('listing.max')}</span>
                                </span>
                              </>
                            ) : (
                              <>
                                <span className='flex items-center gap-1'>
                                  <FaCar className='text-neutral-400' />
                                  <span>{listing.seats || 4} {t('listing.seats')}</span>
                                </span>
                                <span className='capitalize font-medium'>
                                  {listing.transmission || 'Auto'}
                                </span>
                                <span className='text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'>
                                  {listing.driverIncluded ? t('listing.withDriver') : t('listing.selfDrive')}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Pricing and Action */}
                          <div className='mt-auto pt-2 flex items-center justify-between'>
                            <div>
                              {hasDiscount && (
                                <span className='text-xs text-neutral-400 line-through block -mb-0.5'>
                                  ${regularPrice}
                                </span>
                              )}
                              <div className='flex items-baseline gap-1'>
                                <span className='text-lg font-black text-neutral-900'>
                                  {currency === 'USD' ? '$' : `${currency} `}
                                  {effectivePrice.toLocaleString()}
                                </span>
                                <span className='text-xs text-neutral-500 font-normal'>
                                  {' '}/ {priceUnit}
                                </span>
                              </div>
                            </div>

                            <Link
                              to={`/listing/${listing.id}`}
                              className='px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs'
                            >
                              <span>{t('home.viewDeal')}</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </section>
        )}

        {/* Section 1: Guest Houses */}
        <section className='space-y-6'>
          <div className='flex items-end justify-between border-b border-neutral-200 pb-4'>
            <div className='flex items-center gap-3'>
              <span className='w-9 h-9 flex items-center justify-center border border-neutral-200 text-neutral-900 rounded-full text-sm'>
                <FaHome />
              </span>
              <div>
                <h2 className='text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900'>{t('home.boutiqueGuestHouses')}</h2>
                <p className='text-xs text-neutral-500 mt-0.5'>{t('home.boutiqueSub')}</p>
              </div>
            </div>
            <Link
              to='/search?type=guesthouse'
              className='text-xs font-semibold text-white bg-black hover:bg-neutral-800 px-4 py-2 rounded-lg transition whitespace-nowrap shadow-xs'
            >
              {t('home.showMoreStays')}
            </Link>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map((n) => (
                <div key={n} className='h-80 bg-neutral-100 rounded-2xl animate-pulse' />
              ))}
            </div>
          ) : guestHouses.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {guestHouses.map((listing) => (
                <ListingItem key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            /* Clean Empty State (Rule 1: NO mock, placeholder, or seed data) */
            <div className='bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-8 sm:p-12 text-center space-y-3'>
              <div className='w-12 h-12 rounded-full bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto text-xl'>
                <FaHome />
              </div>
              <h3 className='text-base font-medium text-neutral-900'>{t('home.noStaysYet')}</h3>
              <p className='text-xs text-neutral-500 max-w-md mx-auto leading-relaxed'>
                {t('home.noStaysDesc')}
              </p>
              <div className='pt-2'>
                <Link
                  to='/partner'
                  className='inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs'
                >
                  <FaPlus className='text-xs' />
                  <span>{t('home.partnerListStay')}</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Car Leasing & Private Drivers */}
        <section className='space-y-6'>
          <div className='flex items-end justify-between border-b border-neutral-200 pb-4'>
            <div className='flex items-center gap-3'>
              <span className='w-9 h-9 flex items-center justify-center border border-neutral-200 text-neutral-900 rounded-full text-sm'>
                <FaCar />
              </span>
              <div>
                <h2 className='text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900'>{t('home.carLeasingRides')}</h2>
                <p className='text-xs text-neutral-500 mt-0.5'>{t('home.carLeasingSub')}</p>
              </div>
            </div>
            <Link
              to='/search?type=car'
              className='text-xs font-semibold text-white bg-black hover:bg-neutral-800 px-4 py-2 rounded-lg transition whitespace-nowrap shadow-xs'
            >
              {t('home.showMoreVehicles')}
            </Link>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map((n) => (
                <div key={n} className='h-80 bg-neutral-100 rounded-2xl animate-pulse' />
              ))}
            </div>
          ) : carListings.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {carListings.map((listing) => (
                <ListingItem key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            /* Clean Empty State */
            <div className='bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-8 sm:p-12 text-center space-y-3'>
              <div className='w-12 h-12 rounded-full bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto text-xl'>
                <FaCar />
              </div>
              <h3 className='text-base font-medium text-neutral-900'>{t('home.noCarsYet')}</h3>
              <p className='text-xs text-neutral-500 max-w-md mx-auto leading-relaxed'>
                {t('home.noCarsDesc')}
              </p>
              <div className='pt-2'>
                <Link
                  to='/partner'
                  className='inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs'
                >
                  <FaPlus className='text-xs' />
                  <span>{t('home.partnerListCar')}</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Platform Trust & Safety Pillars */}
        <section className='border-t border-neutral-200 pt-14'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-10'>
            <div className='lg:col-span-4'>
              <h2 className='text-3xl sm:text-4xl font-medium tracking-tighter text-neutral-900 leading-tight'>
                {t('home.whyChoose')}
              </h2>
              <p className='text-xs text-neutral-500 mt-3 max-w-xs leading-relaxed'>
                {t('home.whyChooseSub')}
              </p>
            </div>

            <div className='lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8'>
              <div className='space-y-2 sm:border-l sm:border-neutral-200 sm:pl-6'>
                <div className='text-sm font-medium text-neutral-400'>1</div>
                <h3 className='font-medium text-neutral-900 text-base'>{t('home.qualityPillar')}</h3>
                <p className='text-xs text-neutral-500 leading-relaxed'>
                  {t('home.qualityPillarDesc')}
                </p>
              </div>

              <div className='space-y-2 sm:border-l sm:border-neutral-200 sm:pl-6'>
                <div className='text-sm font-medium text-neutral-400'>2</div>
                <h3 className='font-medium text-neutral-900 text-base'>{t('home.directContactPillar')}</h3>
                <p className='text-xs text-neutral-500 leading-relaxed'>
                  {t('home.directContactDesc')}
                </p>
              </div>

              <div className='space-y-2 sm:border-l sm:border-neutral-200 sm:pl-6'>
                <div className='text-sm font-medium text-neutral-400'>3</div>
                <h3 className='font-medium text-neutral-900 text-base'>{t('home.verifiedProfiles')}</h3>
                <p className='text-xs text-neutral-500 leading-relaxed'>
                  {t('home.verifiedProfilesDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Popular Curated Destinations & Regional Hubs */}
        <section className='border-t border-neutral-200 pt-16 space-y-8'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4'>
            <div>
              <span className='text-xs uppercase tracking-wider text-neutral-400 font-semibold'>{t('home.makindyeKampala')}</span>
              <h2 className='text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900 mt-1'>
                {t('home.featuredNeighborhoods')}
              </h2>
              <p className='text-xs text-neutral-500 mt-1'>
                {t('home.featuredNeighborhoodsSub')}
              </p>
            </div>
            <Link
              to='/search'
              className='text-xs font-semibold text-white bg-black hover:bg-neutral-800 px-4 py-2 rounded-lg transition whitespace-nowrap shadow-xs self-start sm:self-auto'
            >
              {t('home.exploreAllNeighborhoods')}
            </Link>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Destination 1: Muyenga (Tank Hill) */}
            <div className='group border border-neutral-200 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col bg-white'>
              <div className='relative h-52 w-full overflow-hidden bg-neutral-100'>
                <img
                  src='/images/kampala_tank_hill.jpg'
                  alt='Muyenga Tank Hill Kampala'
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  onError={(e) => {
                    e.currentTarget.src = '/images/kampala_apartment_living.jpg';
                  }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                <div className='absolute bottom-3 left-4 right-4 text-white'>
                  <span className='text-[11px] font-medium tracking-wide uppercase text-amber-300'>{t('home.lakeViewRidge')}</span>
                  <h3 className='text-lg font-medium text-white tracking-tight'>Muyenga (Tank Hill)</h3>
                </div>
              </div>
              <div className='p-5 flex-1 flex flex-col justify-between space-y-4'>
                <div className='space-y-1.5'>
                  <div className='text-xs text-neutral-500'>
                    <span>{t('home.lakeViewTags')}</span>
                  </div>
                  <p className='text-xs text-neutral-600 leading-relaxed'>
                    {t('home.lakeViewDesc')}
                  </p>
                </div>
                <div className='pt-2 flex items-center gap-2'>
                  <Link
                    to='/search?city=Muyenga&type=guesthouse'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs'
                  >
                    {t('home.viewStays')}
                  </Link>
                  <Link
                    to='/search?city=Muyenga&type=car'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs border border-neutral-700'
                  >
                    {t('home.chauffeurCar')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Destination 2: Munyonyo & Buziga */}
            <div className='group border border-neutral-200 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col bg-white'>
              <div className='relative h-52 w-full overflow-hidden bg-neutral-100'>
                <img
                  src='/images/kampala_munyonyo_lake.jpg'
                  alt='Munyonyo Waterfront and Buziga'
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  onError={(e) => {
                    e.currentTarget.src = '/images/kampala_prado_suv.jpg';
                  }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                <div className='absolute bottom-3 left-4 right-4 text-white'>
                  <span className='text-[11px] font-medium tracking-wide uppercase text-amber-300'>{t('home.lakesideLuxury')}</span>
                  <h3 className='text-lg font-medium text-white tracking-tight'>Munyonyo &amp; Buziga</h3>
                </div>
              </div>
              <div className='p-5 flex-1 flex flex-col justify-between space-y-4'>
                <div className='space-y-1.5'>
                  <div className='text-xs text-neutral-500'>
                    <span>{t('home.lakesideTags')}</span>
                  </div>
                  <p className='text-xs text-neutral-600 leading-relaxed'>
                    {t('home.lakesideDesc')}
                  </p>
                </div>
                <div className='pt-2 flex items-center gap-2'>
                  <Link
                    to='/search?city=Munyonyo&type=guesthouse'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs'
                  >
                    {t('home.viewStays')}
                  </Link>
                  <Link
                    to='/search?city=Munyonyo&type=car'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs border border-neutral-700'
                  >
                    {t('home.hire4x4')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Destination 3: Kansanga, Kabalagala & Ggaba */}
            <div className='group border border-neutral-200 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col bg-white'>
              <div className='relative h-52 w-full overflow-hidden bg-neutral-100'>
                <img
                  src='/images/kampala_ggaba_waterfront.jpg'
                  alt='Kansanga Kabalagala and Ggaba'
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  onError={(e) => {
                    e.currentTarget.src = '/images/kampala_city_sedan.jpg';
                  }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                <div className='absolute bottom-3 left-4 right-4 text-white'>
                  <span className='text-[11px] font-medium tracking-wide uppercase text-amber-300'>{t('home.diningLakeShore')}</span>
                  <h3 className='text-lg font-medium text-white tracking-tight'>Kansanga &amp; Ggaba Shore</h3>
                </div>
              </div>
              <div className='p-5 flex-1 flex flex-col justify-between space-y-4'>
                <div className='space-y-1.5'>
                  <div className='text-xs text-neutral-500'>
                    <span>{t('home.diningTags')}</span>
                  </div>
                  <p className='text-xs text-neutral-600 leading-relaxed'>
                    {t('home.diningDesc')}
                  </p>
                </div>
                <div className='pt-2 flex items-center gap-2'>
                  <Link
                    to='/search?city=Kansanga&type=guesthouse'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs'
                  >
                    {t('home.viewStays')}
                  </Link>
                  <Link
                    to='/search?city=Kansanga&type=car'
                    className='flex-1 text-center py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition shadow-xs border border-neutral-700'
                  >
                    {t('home.bookDriver')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: The chento 100 Experience — How It Works */}
        <section className='border-t border-neutral-200 pt-16 space-y-10'>
          <div className='max-w-2xl'>
            <span className='text-xs uppercase tracking-wider text-neutral-400 font-semibold'>{t('home.simpleTransparent')}</span>
            <h2 className='text-3xl sm:text-4xl font-medium tracking-tighter text-neutral-900 mt-1'>
              {t('home.howItWorksTitle')}
            </h2>
            <p className='text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed'>
              {t('home.howItWorksSubtitle')}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3'>
              <div className='w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold'>
                01
              </div>
              <h3 className='text-base font-semibold text-neutral-900'>{t('home.step1Title')}</h3>
              <p className='text-xs text-neutral-500 leading-relaxed'>
                {t('home.step1Desc')}
              </p>
            </div>

            <div className='p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3'>
              <div className='w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold'>
                02
              </div>
              <h3 className='text-base font-semibold text-neutral-900'>{t('home.step2Title')}</h3>
              <p className='text-xs text-neutral-500 leading-relaxed'>
                {t('home.step2Desc')}
              </p>
            </div>

            <div className='p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3'>
              <div className='w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold'>
                03
              </div>
              <h3 className='text-base font-semibold text-neutral-900'>{t('home.step3Title')}</h3>
              <p className='text-xs text-neutral-500 leading-relaxed'>
                {t('home.step3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: VIP Airport Transfers & Executive Chauffeur Spotlight */}
        <section className='border-t border-neutral-200 pt-16'>
          <div className='bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 lg:p-14 overflow-hidden relative shadow-lg'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'>
              <div className='lg:col-span-7 space-y-6'>
                <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-amber-300 text-xs font-medium'>
                  <FaPlaneDeparture className='text-xs' />
                  <span>{t('home.vipAirportTitle')}</span>
                </div>

                <h2 className='text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-tight'>
                  {t('home.vipAirportHeading')}
                </h2>

                <p className='text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-xl'>
                  {t('home.vipAirportDesc')}
                </p>

                <div className='pt-4 flex flex-wrap items-center gap-4'>
                  <Link
                    to='/search?type=car'
                    className='px-6 py-3 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-md border border-neutral-700'
                  >
                    <span>{t('home.reserveChauffeur')}</span>
                    <FaArrowRight className='text-[10px]' />
                  </Link>
                  <Link
                    to='/contact'
                    className='px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition border border-neutral-700 shadow-md'
                  >
                    {t('home.customItinerary')}
                  </Link>
                </div>
              </div>

              <div className='lg:col-span-5 relative'>
                <div className='relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-700 aspect-[4/3] bg-neutral-800'>
                  <img
                    src='/images/vip_chauffeur_concierge.jpg'
                    alt='Executive Chauffeur Concierge'
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.currentTarget.src = '/images/city_driver_car.jpg';
                    }}
                  />
                  <div className='absolute bottom-3 left-3 right-3 p-3 bg-neutral-950/80 backdrop-blur-md rounded-xl border border-neutral-700 text-xs flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                      <span className='text-white font-medium'>{t('home.airportConcierge')}</span>
                    </div>
                    <span className='text-neutral-400 text-[11px]'>{t('home.doorToDoor')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Host & Chauffeur Fleet Onboarding Banner */}
        <section className='border-t border-neutral-200 pt-16'>
          <div className='bg-neutral-50 border border-neutral-200 rounded-3xl p-8 sm:p-12 lg:p-14 overflow-hidden'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'>
              <div className='lg:col-span-5 order-2 lg:order-1'>
                <div className='rounded-2xl overflow-hidden shadow-sm border border-neutral-200 aspect-[4/3] bg-neutral-200'>
                  <img
                    src='/images/host_partner_boutique.jpg'
                    alt='Welcome Guests as a chento 100 Host'
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.currentTarget.src = '/images/airbnb_apartment_bed.jpg';
                    }}
                  />
                </div>
              </div>

              <div className='lg:col-span-7 order-1 lg:order-2 space-y-5'>
                <span className='text-xs uppercase tracking-wider text-neutral-400 font-semibold'>{t('home.hostEarnTitle')}</span>
                <h2 className='text-3xl sm:text-4xl font-medium tracking-tight text-neutral-900 leading-tight'>
                  {t('home.hostEarnHeading')}
                </h2>
                <p className='text-xs sm:text-sm text-neutral-600 leading-relaxed'>
                  {t('home.hostEarnDesc')}
                </p>

                <div className='pt-3'>
                  <Link
                    to='/partner'
                    className='inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-md'
                  >
                    <FaPlus className='text-xs' />
                    <span>{t('home.openHostPortal')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Traveler Experiences & Attributable Reviews */}
        <section className='border-t border-neutral-200 pt-16 space-y-10'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div>
              <span className='text-xs uppercase tracking-wider text-neutral-400 font-semibold'>{t('home.verifiedExperiences')}</span>
              <h2 className='text-3xl sm:text-4xl font-medium tracking-tight text-neutral-900 mt-1'>
                {t('home.trustedReviewsTitle')}
              </h2>
              <p className='text-xs text-neutral-500 mt-1'>
                {t('home.trustedReviewsSub')}
              </p>
            </div>
            <div className='text-xs text-neutral-500 flex items-center gap-1.5'>
              <div className='flex text-amber-400 text-sm'>
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <span className='font-semibold text-neutral-900 ml-1'>4.9 / 5.0</span>
              <span>· {language === 'ti' ? 'ዝተረጋገጹ ጻንሒታት' : 'Verified Stays'}</span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Review 1 */}
            <div className='p-6 bg-white border border-neutral-200 rounded-3xl space-y-4 shadow-2xs flex flex-col justify-between'>
              <div className='space-y-3'>
                <div className='flex text-amber-400 text-xs'>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className='text-xs text-neutral-700 leading-relaxed italic'>
                  {language === 'ti'
                    ? '“ኣብ ሙየንጋ 24/7 ኤሌክትሪክን ቅልጡፍ ዋይፋይን ዘለዎ ናይ ኣጋይሽ ገዛ ምርካብ ኣዝዩ ኣጸጋሚ ነይሩ። ኣብ ቸንቶ 100 ግን ብቐጥታ ምስቲ ዋና ብምዝርራብ ኣዝዩ ጽሩይን ምቹእን ገዛ ረኺብና።”'
                    : '“Finding a reliable 3-bedroom guest house in Muyenga with 24/7 backup power and fast Wi-Fi for my family used to take days of calling around. On chento 100, we contacted the host directly and the villa was immaculate.”'}
                </p>
              </div>
              <div className='pt-4 border-t border-neutral-100 flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center'>
                  SK
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-neutral-900'>Sarah K.</h4>
                  <p className='text-[11px] text-neutral-500'>Stockholm, Sweden · Family Guest Stay</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className='p-6 bg-white border border-neutral-200 rounded-3xl space-y-4 shadow-2xs flex flex-col justify-between'>
              <div className='space-y-3'>
                <div className='flex text-amber-400 text-xs'>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className='text-xs text-neutral-700 leading-relaxed italic'>
                  {language === 'ti'
                    ? '“ን 8 መዓልቲ ናይ ስራሕ ጉዕዞ ፕራዶ ምስ መራሒ ኣሲዘ ነይረ። እቲ መራሒ ኣብ መዕረፎ ነፈርቲ ብስመይ ሰሌዳ ሒዙ ይጽበየና ነይሩ። ሰዓቱ ዝሓልውን ፍጹም ህዱእን እዩ ነይሩ።”'
                    : '“I booked an executive Prado with chauffeur for an 8-day corporate mission. The driver was waiting at airport arrivals with our name board. Punctual, discreet, and navigated city meetings effortlessly.”'}
                </p>
              </div>
              <div className='pt-4 border-t border-neutral-100 flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center'>
                  MT
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-neutral-900'>Michael Tekle</h4>
                  <p className='text-[11px] text-neutral-500'>London, UK · Corporate Mobility</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className='p-6 bg-white border border-neutral-200 rounded-3xl space-y-4 shadow-2xs flex flex-col justify-between'>
              <div className='space-y-3'>
                <div className='flex text-amber-400 text-xs'>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className='text-xs text-neutral-700 leading-relaxed italic'>
                  {language === 'ti'
                    ? '“እቲ ናይ ኣመሓደርቲ ቅድመ-ምጽራይ ዓቢ እምነት ፈጢሩልና። ነፍሲ ወከፍ ገዛ ተፈቲሹ ዝወጽእ ምዃኑ ምፍላጥ ካብ ዘየድሊ ምድንጋር ኣድሒኑና። ብርግጽ እንደገና ክንጥቀመሉ ኢና።”'
                    : '“The pre-moderation gives you real reassurance. Knowing that administration checks every property before it is posted meant zero unpleasant surprises. Will definitely book through chento 100 again.”'}
                </p>
              </div>
              <div className='pt-4 border-t border-neutral-100 flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center'>
                  ER
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-neutral-900'>Elena &amp; Marco R.</h4>
                  <p className='text-[11px] text-neutral-500'>Milan, Italy · Boutique Studio Stay</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Frequently Asked Questions (Interactive Accordion) */}
        <section className='border-t border-neutral-200 pt-16 space-y-8'>
          <div className='max-w-2xl'>
            <span className='text-xs uppercase tracking-wider text-neutral-400 font-semibold'>{t('home.clarificationsHelp')}</span>
            <h2 className='text-3xl sm:text-4xl font-medium tracking-tight text-neutral-900 mt-1'>
              {t('home.faqsTitle')}
            </h2>
            <p className='text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed'>
              {t('home.faqsSub')}
            </p>
          </div>

          <div className='space-y-3 max-w-4xl'>
            {(language === 'ti'
              ? [
                  {
                    q: 'መኪና ምስ መራሒ ብኸመይ ይተሓዝ?',
                    a: 'ናብ ክፍሊ ናይ መኪና ክራይ ብምኻድ ንዓኻ እትጥዕም መኪና ምረጽ። ብቐጥታ ብስልኪ፣ ዋትስኣፕ ወይ ብኢመይል ምስቲ መራሒ ተራኺብካ መዓልታትን ዋጋን ተሰማማዕ።',
                  },
                  {
                    q: 'እቶም ናይ ኣጋይሽ ኣባይትን መካይንን ዝተረጋገጹ ድዮም?',
                    a: 'እወ! ነፍሲ ወከፍ ዝርዝር ቅድሚ ምውጽኡ ብኣመሓደርትና ጽሬቱ፣ ስእልታቱን ናይ ዋና መንነትን ብጥንቃቐ ይረጋገጽ።',
                  },
                  {
                    q: 'ናይ ክፍሊት መስርሕ ከመይ እዩ ዝሰርሕ?',
                    a: 'ኣብ መንጎኻን ኣብ መንጎ ዋናን ቀጥታዊ ርክብ ስለዝኾነ፡ ኣብቲ ቦታ ምስ በጻሕካ ብጥረ ገንዘብ ወይ ብዝተሰማማዕኩምሉ መንገዲ ብዘይ ምንም ተወሳኺ ክፍሊት ትኸፍል።',
                  },
                  {
                    q: 'ካብ ኤንተበ ናብ ማኪንድየ መጓዕዝያ ክዳሎ ይከኣል ዶ?',
                    a: 'እወ! መኪና ምስ መራሒ መሪጽካ ናይ ነፋሪትካ ሰዓትን መዕረፎን ጥራይ ንገሮም፤ እቲ መራሒ ኣብ መዕረፎ ነፈርቲ ስምካ ሒዙ ክጽበየካ እዩ።',
                  },
                  {
                    q: 'ናተይ ናይ ኣጋይሽ ገዛ ወይ መኪና ብኸመይ ኣብ ቸንቶ 100 ከስፍር እኽእል?',
                    a: 'ኣብ ላዕሊ "ምሳና ስራሕ" ብምጥዋቕ ፎርም ብምምላእ ስእልታትን ዋጋን መዝግብ። ኣመሓደርትና ኣብ ውሽጢ 24 ሰዓት መርሚሮም የጽድቑልካ።',
                  },
                ]
              : [
                  {
                    q: 'How does booking a private car with driver work?',
                    a: 'Browse the car leasing section, choose the vehicle that fits your party size and itinerary, and click to view listing details. You can call, message via WhatsApp, or send an instant inquiry directly to the driver or fleet manager. Confirm pickup dates, itinerary, and whether fuel is included.',
                  },
                  {
                    q: 'Are the guest houses and vehicles verified before being listed?',
                    a: 'Yes. Every single listing submitted to chento 100 is manually reviewed by our administrative moderation team. We verify that photos represent real properties, amenities match descriptions, and hosts provide valid contact details.',
                  },
                  {
                    q: 'How do payments work between guests and hosts?',
                    a: 'chento 100 facilitates transparent, direct connections between guests and verified hosts or chauffeurs. You pay the host directly upon check-in or via mutually agreed payment methods (cash, local transfer, or international wire) without hidden platform surcharges.',
                  },
                  {
                    q: 'Can I arrange an airport transfer from Entebbe to Makindye?',
                    a: 'Yes! Simply select a vehicle with chauffeur, contact the driver with your flight details (airline and arrival time), and request Entebbe terminal pickup directly to your Makindye Division destination. The driver will be stationed in the arrival hall holding a personalized name board.',
                  },
                  {
                    q: 'How do I list my guest house or chauffeur vehicle on chento 100?',
                    a: "Click 'List Your Property / Vehicle' in the top navigation or footer. Complete the listing form with photos, pricing, and amenities. Our administrators review the submission within 24 hours and publish it to the live marketplace.",
                  },
                ]
            ).map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className='border border-neutral-200 rounded-2xl overflow-hidden bg-white transition-colors'
                >
                  <button
                    type='button'
                    onClick={() => toggleFaq(idx)}
                    className='w-full p-5 text-left flex items-center justify-between gap-4 font-medium text-sm sm:text-base text-neutral-900 hover:text-neutral-700 transition'
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <FaChevronDown
                      className={`text-xs text-neutral-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'transform rotate-180 text-neutral-900' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className='px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-neutral-50/50'>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 9: Concierge Assistance & Custom Group Bookings CTA */}
        <section className='border-t border-neutral-200 pt-16'>
          <div className='p-8 sm:p-12 bg-neutral-900 text-white rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8'>
            <div className='space-y-2 max-w-xl'>
              <h3 className='text-2xl sm:text-3xl font-medium tracking-tight text-white'>
                {t('home.conciergeTitle')}
              </h3>
              <p className='text-xs sm:text-sm text-neutral-300 leading-relaxed'>
                {t('home.conciergeDesc')}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3 shrink-0'>
              <Link
                to='/contact'
                className='px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition border border-neutral-700 shadow-md'
              >
                {t('home.contactConcierge')}
              </Link>
              <Link
                to='/search'
                className='px-5 py-2.5 bg-black hover:bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs font-bold transition shadow-md'
              >
                {t('home.browseMarketplace')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}