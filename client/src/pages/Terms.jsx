import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-12 text-slate-800'>
      <div className='mb-8 border-b border-slate-200 pb-6'>
        <span className='text-xs font-bold text-amber-600 uppercase tracking-wider'>chento 100 Marketplace</span>
        <h1 className='text-3xl font-extrabold text-slate-900 mt-1'>Terms of Service</h1>
        <p className='text-xs text-slate-500 mt-1'>Last updated: October 2026</p>
      </div>

      <div className='space-y-6 text-sm text-slate-700 leading-relaxed'>
        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>1. Platform Overview</h2>
          <p>
            chento 100 operates a peer-to-peer hospitality and mobility marketplace connecting owners of boutique guest houses and licensed car leasing services with visitors and verified tenants. We provide moderation, listing infrastructure, and direct contact tools.
          </p>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>2. Listing Moderation &amp; Approval</h2>
          <p>
            In order to maintain safety and high quality standards across our catalog:
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1 text-slate-600'>
            <li>Every newly submitted listing is initially placed in a <strong>pending</strong> state.</li>
            <li>Our moderation team manually verifies the specifications, photos, and contact information before granting public approval.</li>
            <li>Listings that fail to meet hygiene, safety, or legal leasing criteria will be rejected with an explanation provided in the owner dashboard.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>3. User Responsibilities &amp; Eligibility</h2>
          <p>
            To submit a listing, hosts and car operators must create an account with a verified email address. Unverified accounts cannot publish listings. Operators warrant that all vehicles possess valid registration, insurance, and professional chauffeur licenses where applicable.
          </p>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>4. Direct Transactions</h2>
          <p>
            Guests and renters contact owners directly via phone, WhatsApp, or email. chento 100 is not a party to the rental agreement or lease contract executed between the host and tenant.
          </p>
        </section>

        <section>
          <h2 className='text-lg font-bold text-slate-900 mb-2'>5. Prohibited Conduct</h2>
          <p>
            Users are strictly prohibited from publishing fraudulent rates, misleading photos, or duplicate listings. Any violations reported by users will result in immediate suspension or permanent account ban.
          </p>
        </section>

        <div className='pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500'>
          <Link to='/' className='text-amber-600 font-semibold hover:underline'>
            ← Back to Home
          </Link>
          <Link to='/contact' className='text-slate-600 hover:underline'>
            Have questions? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
