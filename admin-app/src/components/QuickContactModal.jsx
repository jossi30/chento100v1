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

  const defaultMessage = `Hello ${name}, this is Chento100 Concierge Administration regarding your ${
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
        className='bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-900'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
          <div className='flex items-center gap-2.5'>
            <div className='w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs'>
              {(name[0] || 'C').toUpperCase()}
            </div>
            <div>
              <h3 className='font-bold text-sm text-slate-900'>{name}</h3>
              <span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800'>
                {contact.role || contact.accountType || 'Client'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer'
          >
            <FaTimes />
          </button>
        </div>

        {/* Contact Info Overview */}
        <div className='space-y-2 bg-slate-50 p-4 rounded-2xl text-xs'>
          <div className='flex items-center justify-between'>
            <span className='text-slate-500 font-semibold flex items-center gap-1.5'>
              <FaPhoneAlt className='text-emerald-600' /> Phone Number:
            </span>
            <div className='flex items-center gap-1.5 font-bold'>
              <span>{phone || 'Not Provided'}</span>
              {phone && (
                <button
                  type='button'
                  onClick={() => handleCopy(phone, 'phone')}
                  className='p-1 text-slate-400 hover:text-slate-700'
                  title='Copy Phone'
                >
                  {copiedField === 'phone' ? (
                    <FaCheck className='text-emerald-500 text-[10px]' />
                  ) : (
                    <FaCopy className='text-[10px]' />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-slate-500 font-semibold flex items-center gap-1.5'>
              <FaEnvelope className='text-sky-600' /> Email Address:
            </span>
            <div className='flex items-center gap-1.5 font-bold truncate max-w-[200px]'>
              <span className='truncate'>{email || 'Not Provided'}</span>
              {email && (
                <button
                  type='button'
                  onClick={() => handleCopy(email, 'email')}
                  className='p-1 text-slate-400 hover:text-slate-700'
                  title='Copy Email'
                >
                  {copiedField === 'email' ? (
                    <FaCheck className='text-emerald-500 text-[10px]' />
                  ) : (
                    <FaCopy className='text-[10px]' />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Message Field */}
        <div className='space-y-1.5 text-xs'>
          <label className='font-bold text-slate-700 flex items-center justify-between'>
            <span>Concierge Message Template</span>
            <span className='text-[10px] text-slate-400 font-normal'>Prefills WhatsApp & Email</span>
          </label>
          <textarea
            rows={3}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={defaultMessage}
            className='w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden'
          />
        </div>

        {/* 1-Click Action Buttons */}
        <div className='grid grid-cols-3 gap-2 pt-1 text-xs font-bold'>
          {phone ? (
            <a
              href={`tel:${cleanPhone}`}
              className='py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 shadow-xs transition'
            >
              <FaPhoneAlt className='text-emerald-400 text-sm' />
              <span>Direct Call</span>
            </a>
          ) : (
            <button
              disabled
              className='py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl text-center flex flex-col items-center justify-center gap-1 cursor-not-allowed'
            >
              <FaPhoneAlt className='text-slate-300 text-sm' />
              <span>No Phone</span>
            </button>
          )}

          {phone ? (
            <a
              href={whatsappUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 shadow-xs transition'
            >
              <FaWhatsapp className='text-white text-base' />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className='py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl text-center flex flex-col items-center justify-center gap-1 cursor-not-allowed'
            >
              <FaWhatsapp className='text-slate-300 text-base' />
              <span>No WhatsApp</span>
            </button>
          )}

          {email ? (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent(
                'Chento100 Concierge Administration'
              )}&body=${encodeURIComponent(finalMessage)}`}
              className='py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 shadow-xs transition'
            >
              <FaEnvelope className='text-white text-sm' />
              <span>Send Email</span>
            </a>
          ) : (
            <button
              disabled
              className='py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl text-center flex flex-col items-center justify-center gap-1 cursor-not-allowed'
            >
              <FaEnvelope className='text-slate-300 text-sm' />
              <span>No Email</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
