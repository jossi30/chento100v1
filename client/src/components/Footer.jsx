import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCar, FaShieldAlt, FaPhoneAlt, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../constants/contact';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className='bg-black text-neutral-300 pt-14 pb-8 border-t border-neutral-900 text-xs sm:text-sm'>
      <div className='max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
        {/* Brand column */}
        <div className='space-y-3'>
          <Link to='/' className='flex items-center gap-1 text-white font-extrabold text-lg tracking-tight'>
            <span className='text-amber-400'>chento</span>
            <span>100</span>
          </Link>
          <p className='text-neutral-400 text-xs leading-relaxed'>
            {t('footer.brandDesc')}
          </p>
          <div className='flex items-center gap-2 text-neutral-400 text-xs pt-1'>
            <FaShieldAlt className='text-emerald-400 text-xs' />
            <span>{t('footer.prescreened')}</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className='text-white font-bold mb-3 text-xs uppercase tracking-wider text-neutral-200'>
            {t('footer.marketplace')}
          </h3>
          <ul className='space-y-2 text-neutral-400 text-xs'>
            <li>
              <Link to='/search?type=guesthouse' className='hover:text-amber-400 transition flex items-center gap-1.5'>
                <FaHome className='text-neutral-500' />
                {t('header.guestHouses')}
              </Link>
            </li>
            <li>
              <Link to='/search?type=car' className='hover:text-amber-400 transition flex items-center gap-1.5'>
                <FaCar className='text-neutral-500' />
                {t('header.carLeasing')}
              </Link>
            </li>
            <li>
              <Link to='/partner' className='hover:text-amber-400 transition font-semibold text-white flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse'></span>
                {t('footer.hostPortal')}
              </Link>
            </li>
            <li>
              <Link to='/search' className='hover:text-amber-400 transition'>
                {t('footer.browseAll')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Trust & Legal */}
        <div>
          <h3 className='text-white font-bold mb-3 text-xs uppercase tracking-wider text-neutral-200'>
            {t('footer.trustPolicies')}
          </h3>
          <ul className='space-y-2 text-neutral-400 text-xs'>
            <li>
              <Link to='/terms' className='hover:text-amber-400 transition flex items-center gap-1.5'>
                <FaShieldAlt className='text-neutral-500' />
                {t('footer.terms')}
              </Link>
            </li>
            <li>
              <Link to='/privacy' className='hover:text-amber-400 transition'>
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link to='/contact' className='hover:text-amber-400 transition'>
                {t('footer.guidelines')}
              </Link>
            </li>
            <li>
              <span className='text-neutral-500 text-[11px] block pt-1'>
                {t('footer.moderatedNote')}
              </span>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h3 className='text-white font-bold mb-3 text-xs uppercase tracking-wider text-neutral-200'>
            {t('footer.contactSupport')}
          </h3>
          <ul className='space-y-2 text-neutral-400 text-xs'>
            <li className='flex items-center gap-2'>
              <FaEnvelope className='text-amber-400 shrink-0' />
              <a href={`mailto:${SUPPORT_EMAIL}`} className='hover:text-white transition'>{SUPPORT_EMAIL}</a>
            </li>
            <li className='flex items-center gap-2'>
              <FaPhoneAlt className='text-amber-400 shrink-0' />
              <a href={`tel:${SUPPORT_PHONE}`} className='hover:text-white transition'>{SUPPORT_PHONE}</a>
            </li>
            <li className='flex items-center gap-2'>
              <FaWhatsapp className='text-amber-400 shrink-0' />
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-white transition'
              >
                WhatsApp
              </a>
            </li>
            <li className='pt-2'>
              <Link
                to='/contact'
                className='inline-block px-4 py-2 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-semibold border border-neutral-700 transition shadow-sm'
              >
                {t('contact.sendMessage')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar with required credit */}
      <div className='max-w-6xl mx-auto px-4 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-500 text-xs'>
        <p>© {new Date().getFullYear()} chento 100 Marketplace. All rights reserved.</p>
        <p className='font-medium text-neutral-400'>
          Built by <span className='text-amber-400 font-semibold'>jpulse systems</span>
        </p>
      </div>
    </footer>
  );
}
