import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function PricingPage() {
  const { user, isPro, upgradeToPro } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUpgradeClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!isPro) {
      upgradeToPro(isAnnual ? 'annual' : 'monthly');
    }
  };

  const checkIcon = <iconify-icon icon="solar:check-circle-bold" class="text-[#378ADD] text-xl shrink-0"></iconify-icon>;
  const crossIcon = <iconify-icon icon="solar:close-circle-linear" class="text-gray-300 text-xl shrink-0"></iconify-icon>;

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans pb-24 overflow-hidden">
      
      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <div className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 text-center px-4">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-[#378ADD]/10 to-transparent blur-[80px] -z-10 pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#378ADD]/20 shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#378ADD] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#378ADD]">Pricing 2026</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Whether you're a casual user or a power enterprise, we have a plan tailored for your needs. 
            No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              <div 
                className={clsx(
                  "absolute top-1.5 bottom-1.5 w-[120px] bg-slate-900 rounded-full transition-all duration-300 ease-spring",
                  isAnnual ? "left-[126px]" : "left-1.5"
                )}
              />
              <button
                onClick={() => setIsAnnual(false)}
                className={clsx(
                  "relative z-10 w-[120px] h-10 rounded-full text-sm font-semibold transition-colors duration-300",
                  !isAnnual ? "text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={clsx(
                  "relative z-10 w-[120px] h-10 rounded-full text-sm font-semibold transition-colors duration-300",
                  isAnnual ? "text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Annually
              </button>
            </div>
            {/* Save Badge */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
              className="relative"
            >
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide border border-emerald-200 shadow-sm">
                Save 20%
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── PRICING CARDS ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* 1. FREE PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">Perfect for casual users who just need to convert a few files.</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900">$0</span>
              <span className="text-slate-500 font-medium">/forever</span>
            </div>
            <button className="w-full py-3.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors mb-8">
              Current Plan
            </button>
            <ul className="space-y-4">
              {[
                { text: '2 files processed per day', active: true },
                { text: 'Max 10MB per file', active: true },
                { text: 'Basic conversion tools', active: true },
                { text: 'Ad-supported interface', active: false },
                { text: 'No priority support', active: false },
                { text: 'No API access', active: false },
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  {feature.active ? <iconify-icon icon="solar:check-circle-linear" class="text-slate-400 text-xl shrink-0"></iconify-icon> : crossIcon}
                  <span className={feature.active ? 'text-slate-700 font-medium' : 'text-slate-400'}>{feature.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 2. PRO PLAN (HIGHLIGHTED) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative lg:-mt-8 border border-slate-800"
          >
            {/* Absolute Glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#378ADD]/20 to-transparent rounded-3xl opacity-50 blur-xl -z-10"></div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg border border-blue-400/50 uppercase">
              Most Popular
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">For professionals who need unlimited access and advanced AI tools.</p>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">${isAnnual ? '47.88' : '4.99'}</span>
              <span className="text-slate-400 font-medium">{isAnnual ? '/year' : '/month'}</span>
            </div>
            <p className="text-xs text-blue-300/80 mb-6 font-medium h-4">
              {isAnnual ? 'Equivalent to $3.99/month (Save 20%)' : 'Billed monthly. Cancel anytime.'}
            </p>
            
            <button 
              onClick={handleUpgradeClick}
              disabled={isPro}
              className={clsx(
                "w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all mb-8 relative overflow-hidden group",
                isPro 
                  ? "bg-slate-800 text-white cursor-default"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white hover:shadow-blue-500/25 hover:-translate-y-0.5"
              )}
            >
              {/* Shine effect */}
              {!isPro && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />}
              <span className="relative z-10">{isPro ? 'Already Active' : 'Get Started'}</span>
            </button>

            <ul className="space-y-4">
              {[
                'Unlimited document processing',
                'Max 1GB per file size',
                'All 40+ advanced tools',
                'AI Chat, Summarize & Translate',
                'Ad-free experience',
                'Priority 24/7 email support',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <iconify-icon icon="solar:check-circle-bold" class="text-blue-400 text-xl shrink-0"></iconify-icon>
                  <span className="text-slate-200 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 3. BUSINESS PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">Business</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">For teams and organizations requiring custom branding and API.</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900">${isAnnual ? '143.88' : '14.99'}</span>
              <span className="text-slate-500 font-medium">{isAnnual ? '/user/year' : '/user/mo'}</span>
            </div>
            <button 
              onClick={() => window.location.href = 'mailto:sales@pdfmaster.com?subject=Business Plan Inquiry'}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors mb-8"
            >
              Contact Sales
            </button>
            <ul className="space-y-4">
              {[
                { text: 'Everything in Pro', active: true },
                { text: 'Team member management', active: true },
                { text: 'Custom branding & watermarks', active: true },
                { text: 'API access with SLA', active: true },
                { text: 'Dedicated account manager', active: true },
                { text: 'SSO & Advanced Security', active: true },
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  {feature.active ? <iconify-icon icon="solar:check-circle-bold" class="text-slate-800 text-xl shrink-0"></iconify-icon> : crossIcon}
                  <span className="text-slate-800 font-bold">{feature.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>

      {/* ── SECURITY & TRUST BADGES ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 mt-20">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Enterprise-Grade Security</p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-3 text-slate-500">
            <iconify-icon icon="solar:shield-check-bold-duotone" class="text-3xl text-emerald-500"></iconify-icon>
            <span className="text-sm font-semibold">256-bit SSL</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <iconify-icon icon="solar:trash-bin-trash-bold-duotone" class="text-3xl text-[#378ADD]"></iconify-icon>
            <span className="text-sm font-semibold">Auto-Deletion</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <iconify-icon icon="solar:lock-keyhole-bold-duotone" class="text-3xl text-purple-500"></iconify-icon>
            <span className="text-sm font-semibold">100% Private</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <iconify-icon icon="solar:server-square-bold-duotone" class="text-3xl text-indigo-500"></iconify-icon>
            <span className="text-sm font-semibold">99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* ── FEATURE COMPARISON TABLE ───────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 mt-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Compare Features</h2>
          <p className="text-slate-500">A detailed breakdown of everything included.</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-5 px-6 font-bold text-slate-900 w-2/5">Feature Overview</th>
                  <th className="py-5 px-6 font-bold text-slate-900 text-center w-1/5">Free</th>
                  <th className="py-5 px-6 font-bold text-[#378ADD] text-center w-1/5">Pro</th>
                  <th className="py-5 px-6 font-bold text-slate-900 text-center w-1/5">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Daily Process Limit', free: '2 files', pro: 'Unlimited', bus: 'Unlimited' },
                  { name: 'Maximum File Size', free: '10 MB', pro: '1 GB', bus: '5 GB' },
                  { name: 'Standard PDF Tools', free: true, pro: true, bus: true },
                  { name: 'AI Features (Chat, Translate)', free: false, pro: true, bus: true },
                  { name: 'Batch Processing', free: false, pro: true, bus: true },
                  { name: 'Ad-Free Interface', free: false, pro: true, bus: true },
                  { name: 'Custom Watermarking', free: false, pro: false, bus: true },
                  { name: 'API Access', free: false, pro: false, bus: true },
                  { name: 'Support', free: 'Community', pro: 'Priority Email', bus: '24/7 Dedicated' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">{row.name}</td>
                    <td className="py-4 px-6 text-center text-slate-500 font-medium">
                      {typeof row.free === 'boolean' ? (row.free ? checkIcon : crossIcon) : row.free}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-900 font-bold bg-[#378ADD]/5">
                      {typeof row.pro === 'boolean' ? (row.pro ? checkIcon : crossIcon) : row.pro}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-700 font-medium">
                      {typeof row.bus === 'boolean' ? (row.bus ? <iconify-icon icon="solar:check-circle-bold" class="text-slate-800 text-xl shrink-0"></iconify-icon> : crossIcon) : row.bus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── FAQ SECTION ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mt-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-500">Need help deciding? Here are some common questions.</p>
        </div>

        <div className="space-y-4">
          {[
            { q: 'Is my data and documents secure?', a: 'Absolutely. All uploads are encrypted with bank-level 256-bit SSL. Files are automatically and permanently deleted from our servers within 2 hours of processing. We do not inspect, share, or sell your data.' },
            { q: 'How does the billing work? Can I cancel?', a: 'You are billed in advance on a monthly or annual basis, depending on your selection. You can cancel your subscription at any time from your account dashboard with no hidden penalties. You will retain access until the end of your billing cycle.' },
            { q: 'What happens when I reach the file size limit?', a: 'Free users are capped at 10MB per file. Pro users enjoy up to 1GB per file, which covers 99.9% of massive high-resolution PDFs. If you need more, our Business plan supports up to 5GB per file.' },
            { q: 'Do you offer refunds?', a: 'Yes. If you are not completely satisfied within the first 7 days of your Pro subscription, contact support and we will issue a full refund, no questions asked.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer text-base font-bold text-slate-900 hover:text-[#378ADD] transition-colors">
                {faq.q}
                <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                  <iconify-icon icon="solar:alt-arrow-down-linear" class="absolute inset-0 text-slate-400 text-xl transition-transform duration-300 group-open:-rotate-180"></iconify-icon>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-500 leading-relaxed text-sm">
                <div className="pt-2 border-t border-slate-100">
                  {faq.a}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="max-w-4xl mx-auto px-4 mt-32">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10">Ready to boost your productivity?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10 text-lg">Join thousands of professionals who have upgraded their PDF workflow.</p>
          <button onClick={handleUpgradeClick} className="relative z-10 bg-white text-blue-700 hover:bg-slate-50 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            Get Pro Now — Risk Free
          </button>
        </div>
      </div>

    </div>
  );
}
