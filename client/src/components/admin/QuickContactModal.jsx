import React, { useState } from 'react';
import {
  FaTimes,
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaCopy,
  FaCheck,
  FaUser,
  FaShieldAlt,
} from 'react-icons/fa';

export default function QuickContactModal({ isOpen, onClose, contact }) {
  const [copiedField, setCopiedField] = useState(null);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !contact) return null;

  const phone = contact.phone || contact.phoneNumber || '';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const email = contact.email || '';
  const name = contact.name || contact.displayName || contact.username || 'Client';

  const defaultMessage = `Hello ${name}, this is Chento100 Concierge regarding your ${
    contact.context || contact.listingTitle || 'account'
  }. How can we assist you today?`;

  const finalMessage = customNote.trim() ? customNote.trim() : defaultMessage;
  const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
    finalMessage
  )}`;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-900 dark:text-white'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3'>
          <div className='flex items-center gap-2.5'>
            <div className='w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs'>
              {(name[0] || 'C').toUpperCase()}
            </div>
            <div>
              <h3 className='font-bold text-sm text-slate-900 dark:text-white'>
                {name}
              </h3>
              <span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'>
                {contact.role || contact.accountType || 'Client'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl'
          >
            <FaTimes />
          </button>
        </div>

        {/* Contact info cards */}
        <div className='space-y-2.5 text-xs'>
          {/* Phone Number */}
          <div className='p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs'>
                <FaPhoneAlt />
              </div>
              <div>
                <span className='text-[10px] text-slate-400 block font-semibold'>Phone Number</span>
                <span className='font-bold text-slate-800 dark:text-slate-100'>
                  {phone || 'No phone recorded'}
                </span>
              </div>
            </div>

            {phone && (
              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={() => handleCopy(phone, 'phone')}
                  title='Copy phone'
                  className='p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50'
                >
                  {copiedField === 'phone' ? <FaCheck className='text-emerald-500' /> : <FaCopy />}
                </button>
                <a
                  href={`tel:${phone}`}
                  className='px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-[11px] shadow-xs'
                >
                  <FaPhoneAlt className='text-[10px]' />
                  <span>Call</span>
                </a>
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className='p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs'>
                <FaEnvelope />
              </div>
              <div className='min-w-0'>
                <span className='text-[10px] text-slate-400 block font-semibold'>Email Address</span>
                <span className='font-bold text-slate-800 dark:text-slate-100 truncate block max-w-[190px]' title={email}>
                  {email || 'No email recorded'}
                </span>
              </div>
            </div>

            {email && (
              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={() => handleCopy(email, 'email')}
                  title='Copy email'
                  className='p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50'
                >
                  {copiedField === 'email' ? <FaCheck className='text-emerald-500' /> : <FaCopy />}
                </button>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent('Chento100 Concierge Support')}`}
                  className='px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-[11px] shadow-xs'
                >
                  <FaEnvelope className='text-[10px]' />
                  <span>Email</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Fast Concierge */}
        {cleanPhone && (
          <div className='p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2 text-xs'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold'>
                <FaWhatsapp className='text-sm text-emerald-600' />
                <span>Instant WhatsApp Concierge Message</span>
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={defaultMessage}
                className='w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400'
              />
            </div>

            <a
              href={whatsappUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer'
            >
              <FaWhatsapp className='text-base' />
              <span>Launch WhatsApp Chat</span>
            </a>
          </div>
        )}

        {/* Footer */}
        <div className='flex items-center justify-end pt-1'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
