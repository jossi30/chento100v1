import { useEffect, useState } from 'react';
import { FaWhatsapp, FaEnvelope, FaPhoneAlt, FaCheck, FaCopy } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../constants/contact';
import { apiFetch as fetch } from '../services/apiFetch';

export default function Contact({ listing }) {
  const { t } = useLanguage();
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(null);

  const onChange = (e) => {
    setMessage(e.target.value);
  };

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        if (!listing?.userRef) {
          setLandlord({
            username: listing?.driverName || 'Host / Service Provider',
            email: SUPPORT_EMAIL,
            phone: SUPPORT_PHONE,
          });
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
            username: listing?.driverName || 'Host / Service Provider',
            email: SUPPORT_EMAIL,
            phone: SUPPORT_PHONE,
          });
        }
      } catch (error) {
        console.log(error);
        setLandlord({
          username: listing?.driverName || 'Host / Service Provider',
          email: SUPPORT_EMAIL,
          phone: SUPPORT_PHONE,
        });
      }
    };
    fetchLandlord();
  }, [listing]);

  const rawPhone = SUPPORT_PHONE;

  const cleanDigits = SUPPORT_WHATSAPP;

  const defaultSubject = `Regarding ${listing?.name || listing?.title || 'Listing'} on Chento 100`;
  const whatsappUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message || `Hello, I would like to enquire about ${listing?.name || listing?.title || 'this listing'}.`)}`;

  const copyText = (txt, key) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      {landlord && (
        <div className='flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2'>
          <div className='flex items-center justify-between flex-wrap gap-2'>
            <p className='text-sm text-slate-700'>
              {t('contact.contact')}{' '}
              <span className='font-semibold text-slate-900'>{landlord?.username || 'Host'}</span>{' '}
              {t('contact.for')}{' '}
              <span className='font-semibold text-slate-900'>{String(listing?.name || listing?.title || 'listing').toLowerCase()}</span>
            </p>
            <span className='text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full'>
              {t('enquire.responseBadge')}
            </span>
          </div>

          <textarea
            name='message'
            id='message'
            rows='3'
            value={message}
            onChange={onChange}
            placeholder={t('contact.placeholder')}
            className='w-full border border-slate-300 p-3 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-700'
          ></textarea>

          {/* 3 Channels Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1'>
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold p-2.5 rounded-lg transition shadow-xs'
            >
              <FaWhatsapp className='text-base' />
              <span>{t('enquire.whatsappOption')}</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(message)}`}
              className='flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold p-2.5 rounded-lg transition shadow-xs'
            >
              <FaEnvelope className='text-sm' />
              <span>{t('enquire.emailOption')}</span>
            </a>

            {/* Phone */}
            <a
              href={`tel:${rawPhone.replace(/\s+/g, '')}`}
              className='flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold p-2.5 rounded-lg transition shadow-xs'
            >
              <FaPhoneAlt className='text-xs' />
              <span>{t('enquire.phoneOption')}</span>
            </a>
          </div>

          {/* Quick Copy bar */}
          <div className='flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 gap-2'>
            <div className='flex items-center gap-2'>
              <span>Phone: <strong className='text-slate-700 font-mono'>{rawPhone}</strong></span>
              <button
                type='button'
                onClick={() => copyText(rawPhone, 'phone')}
                className='text-slate-600 hover:text-slate-900'
                title='Copy phone'
              >
                {copied === 'phone' ? <FaCheck className='text-emerald-600 inline' /> : <FaCopy className='inline' />}
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <span>Email: <strong className='text-slate-700 font-mono'>{SUPPORT_EMAIL}</strong></span>
              <button
                type='button'
                onClick={() => copyText(SUPPORT_EMAIL, 'email')}
                className='text-slate-600 hover:text-slate-900'
                title='Copy email'
              >
                {copied === 'email' ? <FaCheck className='text-emerald-600 inline' /> : <FaCopy className='inline' />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
