import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../constants/contact';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  return (
    <div className='max-w-5xl mx-auto px-4 py-12 text-slate-800'>
      <div className='text-center max-w-xl mx-auto mb-12'>
        <span className='text-xs font-bold text-amber-600 uppercase tracking-wider'>Customer Support</span>
        <h1 className='text-3xl font-extrabold text-slate-900 mt-1'>Get in Touch</h1>
        <p className='text-sm text-slate-600 mt-2'>
          Have questions about listing a guest house or car? Need assistance with host verification? Our dedicated concierge team is here to help.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {/* Info Column */}
        <div className='space-y-6 bg-slate-900 text-white p-6 rounded-2xl shadow-xl'>
          <div>
            <h2 className='text-lg font-bold mb-1 text-amber-400'>Concierge Desk</h2>
            <p className='text-xs text-slate-400'>Direct support for hosts, drivers, and guests.</p>
          </div>

          <div className='space-y-4 text-xs sm:text-sm text-slate-300'>
            <div className='flex items-start gap-3'>
              <FaEnvelope className='text-amber-400 mt-1 shrink-0' />
              <div>
                <p className='text-slate-400 text-xs font-semibold'>Email Support</p>
                <a className='font-medium text-white hover:underline' href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <FaPhoneAlt className='text-amber-400 mt-1 shrink-0' />
              <div>
                <p className='text-slate-400 text-xs font-semibold'>Direct Concierge</p>
                <a className='font-medium text-white hover:underline' href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</a>
                <a
                  className='block font-medium text-emerald-400 hover:underline mt-1'
                  href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Contact us on WhatsApp
                </a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <FaMapMarkerAlt className='text-amber-400 mt-1 shrink-0' />
              <div>
                <p className='text-slate-400 text-xs font-semibold'>Regional Hub</p>
                <p className='font-medium text-white'>Downtown Hospitality Tower, Suite 400</p>
              </div>
            </div>
          </div>

          <div className='pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed'>
            <p className='font-semibold text-white mb-1'>Moderation Hours</p>
            Listings submitted between 8:00 AM - 10:00 PM are typically reviewed in less than 2 hours.
          </div>
        </div>

        {/* Contact Form */}
        <div className='md:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm'>
          {submitted ? (
            <div className='p-8 text-center space-y-4'>
              <FaCheckCircle className='text-5xl text-emerald-500 mx-auto' />
              <h3 className='text-xl font-bold text-slate-900'>Message Received!</h3>
              <p className='text-slate-600 text-sm max-w-md mx-auto'>
                Thank you for reaching out. A concierge specialist has received your message and will respond within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className='px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 transition'
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <h2 className='text-xl font-bold text-slate-900 mb-4'>Send Us a Message</h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-1'>Your Full Name</label>
                  <input
                    type='text'
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='Jane Doe'
                    className='w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-1'>Email Address</label>
                  <input
                    type='email'
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder='jane@example.com'
                    className='w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 mb-1'>Subject</label>
                <input
                  type='text'
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder='Listing inquiry, host onboarding, general question...'
                  className='w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 mb-1'>Message</label>
                <textarea
                  required
                  rows='5'
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder='How can we assist you today?'
                  className='w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                />
              </div>

              <button
                type='submit'
                disabled={sending}
                className='px-6 py-2.5 bg-black text-white font-bold rounded-lg text-sm hover:bg-neutral-800 transition disabled:opacity-75 cursor-pointer shadow-md'
              >
                {sending ? 'Sending message...' : 'Submit Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
