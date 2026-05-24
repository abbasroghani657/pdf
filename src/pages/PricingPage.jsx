import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { clsx } from 'clsx';

export default function PricingPage() {
  const { isPro } = useAuth();
  const [pricingPeriod, setPricingPeriod] = useState('monthly'); // monthly | annual

  return (
    <div className="mt-4">
      {/* Period toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
          <button
            onClick={() => setPricingPeriod('monthly')}
            className={clsx(
              'px-5 py-2 rounded-full text-sm font-semibold transition-all',
              pricingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setPricingPeriod('annual')}
            className={clsx(
              'px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
              pricingPeriod === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            Annual
            <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">SAVE 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Free</div>
          <div className="mb-1">
            <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
            <span className="text-sm text-gray-500"> /forever</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">No credit card required</p>
          <ul className="space-y-3.5 mb-8 flex-1">
            {[
              { t: '2 files per day', v: true },
              { t: 'Max 10MB per file', v: true },
              { t: 'Basic conversion tools', v: true },
              { t: 'Ad-supported', v: false },
              { t: 'API access', v: false },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <iconify-icon
                  icon={item.v ? 'solar:check-circle-linear' : 'solar:close-circle-linear'}
                  class={clsx('text-lg mt-0.5 shrink-0', item.v ? 'text-gray-400' : 'text-red-300')}
                ></iconify-icon>
                {item.t}
              </li>
            ))}
          </ul>
          <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Current plan
          </button>
        </div>

        {/* Pro - FEATURED */}
        <div className="bg-white border-2 border-[#378ADD] rounded-2xl p-8 flex flex-col shadow-xl relative md:-translate-y-3">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#378ADD] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-md">
            MOST POPULAR
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#378ADD] mb-2">Pro</div>
          <div className="mb-1">
            <span className="text-4xl font-bold tracking-tight text-gray-900">
              {pricingPeriod === 'annual' ? '$3.99' : '$4.99'}
            </span>
            <span className="text-sm text-gray-500"> /month</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            {pricingPeriod === 'annual' ? 'Billed $47.88/year · Save $12' : 'Billed monthly · Cancel anytime'}
          </p>
          <ul className="space-y-3.5 mb-8 flex-1">
            {[
              'Unlimited document processing',
              'Max 1GB per file',
              'All 37+ tools (incl. AI)',
              'No advertisements',
              'API access',
              'Priority support 24/7',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-800 font-medium">
                <iconify-icon icon="solar:check-circle-bold" class="text-[#378ADD] text-lg mt-0.5 shrink-0"></iconify-icon>
                {item}
              </li>
            ))}
          </ul>
          <button onClick={() => window.location.href = 'mailto:pro@pdfmaster.com?subject=Pro Plan'} className="w-full py-3 px-4 bg-[#378ADD] hover:bg-[#2b71b8] rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            Get Pro — {pricingPeriod === 'annual' ? '$3.99' : '$4.99'}/mo
          </button>
        </div>

        {/* Business */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Business</div>
          <div className="mb-1">
            <span className="text-4xl font-bold tracking-tight text-gray-900">
              {pricingPeriod === 'annual' ? '$11.99' : '$14.99'}
            </span>
            <span className="text-sm text-gray-500"> /user/mo</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">Min. 5 seats · Volume discounts available</p>
          <ul className="space-y-3.5 mb-8 flex-1">
            {[
              'Everything in Pro',
              'Team seats & management',
              'Shared workspaces',
              'Custom branding',
              'SLA 99.9% uptime guarantee',
              'Dedicated account manager',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <iconify-icon icon="solar:check-circle-linear" class="text-gray-400 text-lg mt-0.5 shrink-0"></iconify-icon>
                {item}
              </li>
            ))}
          </ul>
          <button onClick={() => window.location.href = 'mailto:sales@pdfmaster.com?subject=Business Plan'} className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            Contact Sales →
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <h3 className="text-xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h3>
        <div className="space-y-4">
          {[
            { q: 'Is my data secure?', a: 'All uploads are encrypted with 256-bit SSL. Files are automatically deleted from our servers within 2 hours of processing. We never share your data.' },
            { q: 'Can I cancel anytime?', a: 'Yes, absolutely. Cancel your subscription at any time with no penalties. You\'ll keep access until the end of your billing period.' },
            { q: 'Do you offer a free trial for Pro?', a: 'PDFMaster offers a free tier with no credit card required. Upgrade to Pro anytime for full access.' },
            { q: 'What file formats are supported?', a: 'We support PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), images (JPG, PNG, WebP), HTML, and more.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                {faq.q}
                <iconify-icon icon="solar:alt-arrow-down-linear" class="text-gray-400 transition-transform duration-200 group-open:rotate-180"></iconify-icon>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
