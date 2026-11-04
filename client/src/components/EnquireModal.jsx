import { useState, useEffect } from 'react';
import {
  FaWhatsapp,
  FaEnvelope,
  FaPhoneAlt,
  FaTimes,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaPaperPlane,
  FaCommentDots,
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../constants/contact';
import { apiFetch as fetch } from '../services/apiFetch';

export default function EnquireModal({ listing, isOpen, onClose }) {
  const { t } = useLanguage();
  const [landlord, setLandlord] = useState(null);
  const [loadingLandlord, setLoadingLandlord] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'email', 'whatsapp', 'phone'

  // Listing details
  const listingTitle = listing?.name || listing?.title || 'Listing';
  const listingAddress = listing?.address || listing?.location || '';
  const priceDisplay = listing?.offer
    ? listing?.discountPrice || listing?.discountedPrice || listing?.regularPrice || listing?.price
    : listing?.regularPrice || listing?.price || 0;
  const unit = listing?.type === 'rent' ? '/night' : '/day';

  // Inquiry message state
  const defaultMessage = `Hello, I am enquiring about "${listingTitle}" (${listingAddress}, $${priceDisplay}${unit}) listed on Chento 100. Could you please provide more details regarding availability and booking?`;
  const [message, setMessage] = useState(defaultMessage);

  // Fetch landlord / host contact information
  useEffect(() => {
    if (!isOpen || !listing) return;

    setMessage(
      `Hello, I am enquiring about "${listingTitle}" (${listingAddress}, $${priceDisplay}${unit}) listed on Chento 100. Could you please provide more details regarding availability and booking?`
    );

    const fetchLandlord = async () => {
      try {
        setLoadingLandlord(true);
        if (!listing.userRef) {
          setLandlord({
            username: listing.driverName || 'Chento 100 Host',
            email: SUPPORT_EMAIL,
            phone: SUPPORT_PHONE,
          });
          setLoadingLandlord(false);
          return;
        }

        const res = await fetch(`/api/user/${listing.userRef}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data && !data.message && (data.username || data.email)) {
          setLandlord(data);
        } else {
          setLandlord({
            username: listing.driverName || 'Chento 100 Host',
            email: SUPPORT_EMAIL,
            phone: SUPPORT_PHONE,
          });
        }
      } catch (err) {
        setLandlord({
          username: listing.driverName || 'Chento 100 Host',
          email: SUPPORT_EMAIL,
          phone: SUPPORT_PHONE,
        });
      } finally {
        setLoadingLandlord(false);
      }
    };

    fetchLandlord();
  }, [isOpen, listing, listingTitle, listingAddress, priceDisplay, unit]);

  if (!isOpen || !listing) return null;

  // Resolve Phone & WhatsApp numbers
  const rawPhone = SUPPORT_PHONE;

  // Format phone digits for WhatsApp (wa.me requires international digits without + or spaces)
  const cleanDigits = SUPPORT_WHATSAPP;

  // Resolve Email
  const rawEmail = SUPPORT_EMAIL;

  const hostName = landlord?.username || listing.driverName || 'Host / Provider';

  // Quick message presets
  const quickPrompts = [
    'Is this place available this weekend?',
    'What is the check-in and cancellation policy?',
    'Can I arrange an airport transfer or early arrival?',
  ];

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const whatsappUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:${rawEmail}?subject=${encodeURIComponent(`Inquiry: ${listingTitle} on Chento 100`)}&body=${encodeURIComponent(message)}`;
  const phoneUrl = `tel:${rawPhone.replace(/\s+/g, '')}`;

  return (
    <div
      id='enquiry-modal-backdrop'
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn overflow-y-auto'
      onClick={(e) => {
        if (e.target.id === 'enquiry-modal-backdrop') {
          onClose();
        }
      }}
    >
      <div className='relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleIn'>
        {/* Header */}
        <div className='bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 text-lg'>
              <FaCommentDots />
            </div>
            <div>
              <h2 className='text-lg sm:text-xl font-bold tracking-tight'>
                {listing.type === 'rent' ? t('enquire.title') : t('enquire.buttonCar')}
              </h2>
              <p className='text-xs text-slate-300 mt-0.5'>
                {t('enquire.subtitle')}
              </p>
            </div>
          </div>
          <button
            type='button'
            id='close-enquiry-modal-btn'
            onClick={onClose}
            className='text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 active:scale-95 transition-all duration-150'
            aria-label='Close enquiry modal'
          >
            <FaTimes className='text-base' />
          </button>
        </div>

        {/* Listing preview banner */}
        <div className='bg-slate-50 border-b border-slate-200 p-3 sm:px-5 sm:py-3 flex items-center gap-3'>
          {listing.imageUrls?.[0] && (
            <img
              src={listing.imageUrls[0]}
              alt={listingTitle}
              className='w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0'
            />
          )}
          <div className='min-w-0 flex-1'>
            <h3 className='text-sm font-semibold text-slate-900 truncate'>
              {listingTitle}
            </h3>
            <p className='text-xs text-slate-500 truncate'>
              {listingAddress || 'Location provided upon booking'}
            </p>
            <div className='flex items-center gap-2 mt-0.5'>
              <span className='text-xs font-bold text-slate-800'>
                ${priceDisplay.toLocaleString('en-US')}{' '}
                <span className='text-[11px] font-normal text-slate-500'>{unit}</span>
              </span>
              <span className='text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200'>
                {t('enquire.responseBadge')}
              </span>
            </div>
          </div>
        </div>

        {/* Channels Content */}
        <div className='p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-4'>
          {/* Tabs Filter */}
          <div className='flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium'>
            <button
              type='button'
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Options
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaWhatsapp className='text-sm' /> WhatsApp
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition ${
                activeTab === 'email'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaEnvelope className='text-sm' /> Email
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition ${
                activeTab === 'phone'
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaPhoneAlt className='text-xs' /> Phone
            </button>
          </div>

          {/* Quick Customizable Message */}
          <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4'>
            <label
              htmlFor='enquiry-message-input'
              className='block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between'
            >
              <span>{t('enquire.customMessage')}</span>
              <span className='text-[11px] font-normal text-slate-400'>
                Included in Email & WhatsApp
              </span>
            </label>
            <textarea
              id='enquiry-message-input'
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('enquire.placeholder')}
              className='w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-700 transition resize-none'
            ></textarea>
            {/* Quick Prompt Pills */}
            <div className='flex flex-wrap gap-1.5 mt-2'>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => setMessage(prompt)}
                  className='text-[11px] px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md transition text-left'
                >
                  &quot;{prompt}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Option 1: WhatsApp */}
          {(activeTab === 'all' || activeTab === 'whatsapp') && (
            <div className='border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 transition hover:border-emerald-300'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xl shadow-xs'>
                    <FaWhatsapp />
                  </div>
                  <div>
                    <h4 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                      {t('enquire.whatsappOption')}
                      <span className='text-[10px] uppercase font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full'>
                        Recommended
                      </span>
                    </h4>
                    <p className='text-xs text-slate-600 font-mono mt-0.5'>
                      {rawPhone}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => handleCopy(rawPhone, 'whatsapp')}
                  className='text-xs flex items-center gap-1 text-slate-600 hover:text-emerald-700 px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition shrink-0'
                  title='Copy WhatsApp number'
                >
                  {copiedField === 'whatsapp' ? (
                    <>
                      <FaCheck className='text-emerald-600' />
                      <span>{t('enquire.copied')}</span>
                    </>
                  ) : (
                    <>
                      <FaCopy />
                      <span>{t('enquire.copy')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className='mt-3 flex items-center gap-2'>
                <a
                  id='enquiry-whatsapp-link'
                  href={whatsappUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition'
                >
                  <FaWhatsapp className='text-base' />
                  <span>{t('enquire.chatWhatsapp')}</span>
                  <FaExternalLinkAlt className='text-xs opacity-75' />
                </a>
              </div>
            </div>
          )}

          {/* Option 2: Email */}
          {(activeTab === 'all' || activeTab === 'email') && (
            <div className='border border-blue-200 bg-blue-50/40 rounded-xl p-4 transition hover:border-blue-300'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-lg shadow-xs'>
                    <FaEnvelope />
                  </div>
                  <div className='min-w-0'>
                    <h4 className='text-sm font-bold text-slate-900'>
                      {t('enquire.emailOption')}
                    </h4>
                    <p className='text-xs text-slate-600 font-mono mt-0.5 truncate max-w-[220px] sm:max-w-xs'>
                      {rawEmail}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => handleCopy(rawEmail, 'email')}
                  className='text-xs flex items-center gap-1 text-slate-600 hover:text-blue-700 px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition shrink-0'
                  title='Copy Email'
                >
                  {copiedField === 'email' ? (
                    <>
                      <FaCheck className='text-blue-600' />
                      <span>{t('enquire.copied')}</span>
                    </>
                  ) : (
                    <>
                      <FaCopy />
                      <span>{t('enquire.copy')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className='mt-3 flex items-center gap-2'>
                <a
                  id='enquiry-email-link'
                  href={emailUrl}
                  className='flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition'
                >
                  <FaPaperPlane className='text-xs' />
                  <span>{t('enquire.sendEmail')}</span>
                  <FaExternalLinkAlt className='text-xs opacity-75' />
                </a>
              </div>
            </div>
          )}

          {/* Option 3: Phone Number */}
          {(activeTab === 'all' || activeTab === 'phone') && (
            <div className='border border-slate-200 bg-slate-50 rounded-xl p-4 transition hover:border-slate-300'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 text-base shadow-xs'>
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <h4 className='text-sm font-bold text-slate-900'>
                      {t('enquire.phoneOption')}
                    </h4>
                    <p className='text-xs text-slate-600 font-mono mt-0.5'>
                      {rawPhone}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => handleCopy(rawPhone, 'phone')}
                  className='text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition shrink-0'
                  title='Copy phone number'
                >
                  {copiedField === 'phone' ? (
                    <>
                      <FaCheck className='text-slate-800' />
                      <span>{t('enquire.copied')}</span>
                    </>
                  ) : (
                    <>
                      <FaCopy />
                      <span>{t('enquire.copy')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className='mt-3 flex items-center gap-2'>
                <a
                  id='enquiry-phone-link'
                  href={phoneUrl}
                  className='flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition'
                >
                  <FaPhoneAlt className='text-xs' />
                  <span>{t('enquire.callNow')}</span>
                </a>
              </div>
            </div>
          )}

          {/* Host info footer */}
          <div className='pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100'>
            <span>
              Contacting:{' '}
              {loadingLandlord ? (
                <span className='text-slate-400 italic'>Loading host info...</span>
              ) : (
                <strong className='text-slate-700'>{hostName}</strong>
              )}
            </span>
            <span className='italic'>Chento 100 Verified Direct Booking</span>
          </div>
        </div>

        {/* Modal footer close */}
        <div className='p-3 bg-slate-50 border-t border-slate-200 flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition'
          >
            {t('enquire.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
