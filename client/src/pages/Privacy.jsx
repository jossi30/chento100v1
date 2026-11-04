import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../constants/contact';

export default function Privacy() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-12 text-slate-800'>
      <div className='mb-8 border-b border-slate-200 pb-6'>
        <span className='text-xs font-bold text-amber-600 uppercase tracking-wider'>chento 100 Marketplace</span>
        <h1 className='text-3xl font-extrabold text-slate-900 mt-1'>Privacy Policy</h1>
        <p className='text-xs text-slate-500 mt-1'>Last updated: October 2026</p>
      </div>

      <div className='space-y-6 text-sm text-slate-700 leading-relaxed'>
        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>1. Data We Collect</h2>
          <p>
            When registering and using chento 100, we collect:
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1 text-slate-600'>
            <li>Account details: Email address, display name, and contact telephone number.</li>
            <li>Listing details: Property photos, specs, addresses, and pricing.</li>
            <li>Technical data: IP addresses, browser cookies, and interaction analytics to protect against spam.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>2. How Data is Used</h2>
          <p>
            We use your information exclusively to:
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1 text-slate-600'>
            <li>Facilitate listing creation, moderation, and public display to prospective renters.</li>
            <li>Authenticate users securely via Firebase Authentication.</li>
            <li>Send email notifications regarding listing approval, rejection reasons, and security updates.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>3. Data Storage &amp; Security</h2>
          <p>
            All user data and listing assets are stored using enterprise Google Cloud Firestore and Firebase Storage infrastructure with strict access control rules. We never sell your personal data to third parties or advertising networks.
          </p>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>4. Your Rights</h2>
          <p>
            You have the right to inspect, edit, or delete your account and listings at any time through your User Dashboard, or request complete data removal by emailing <a className='text-amber-700 hover:underline' href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <div className='pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500'>
          <Link to='/' className='text-amber-600 font-semibold hover:underline'>
            ← Back to Home
          </Link>
          <Link to='/contact' className='text-slate-600 hover:underline'>
            Contact Data Protection Officer
          </Link>
        </div>
      </div>
    </div>
  );
}
