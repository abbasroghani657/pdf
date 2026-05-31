import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { TOOLS_DATA } from '../data/tools';
import { slugify } from '../utils/slugify';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '37+', label: 'PDF tools available', icon: 'solar:box-bold-duotone', color: 'text-[#378ADD]' },
  { value: '100%', label: 'Free core tools', icon: 'solar:gift-bold-duotone', color: 'text-emerald-500' },
  { value: '256-bit', label: 'SSL encrypted', icon: 'solar:shield-check-bold-duotone', color: 'text-violet-500' },
  { value: 'No signup', label: 'Required ever', icon: 'solar:user-check-bold-duotone', color: 'text-amber-500' },
];

const CATEGORIES = [
  { id: 'all',      label: 'All tools',  icon: 'solar:widget-5-bold-duotone' },
  { id: 'convert',  label: 'Convert',    icon: 'solar:repeat-bold-duotone' },
  { id: 'organize', label: 'Organize',   icon: 'solar:layers-bold-duotone' },
  { id: 'optimize', label: 'Optimize',   icon: 'solar:zip-file-bold-duotone' },
  { id: 'security', label: 'Security',   icon: 'solar:shield-keyhole-bold-duotone' },
  { id: 'edit',     label: 'Edit',       icon: 'solar:pen-new-square-bold-duotone' },
  { id: 'sign',     label: 'eSign',      icon: 'solar:pen-bold-duotone' },
];

// Map each iconColorClass to a matching gradient for the card top bar
const GRADIENT_MAP = {
  'bg-blue-50 text-blue-600':       'from-blue-500 to-blue-400',
  'bg-emerald-50 text-emerald-600': 'from-emerald-500 to-teal-400',
  'bg-amber-50 text-amber-500':     'from-amber-400 to-orange-400',
  'bg-orange-50 text-orange-600':   'from-orange-500 to-amber-400',
  'bg-indigo-50 text-indigo-500':   'from-indigo-500 to-violet-400',
  'bg-cyan-50 text-cyan-600':       'from-cyan-500 to-sky-400',
  'bg-green-50 text-green-600':     'from-green-500 to-emerald-400',
  'bg-red-50 text-red-500':         'from-red-500 to-rose-400',
  'bg-violet-50 text-violet-600':   'from-violet-500 to-purple-400',
  'bg-fuchsia-50 text-fuchsia-600': 'from-fuchsia-500 to-pink-400',
  'bg-yellow-50 text-yellow-600':   'from-yellow-400 to-amber-400',
  'bg-gray-100 text-gray-600':      'from-gray-500 to-slate-400',
  'bg-blue-50 text-blue-600':       'from-blue-500 to-sky-400',
};

export default function HomePage({ searchQuery, setSearchQuery }) {
  const { isPro } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const filteredTools = TOOLS_DATA.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openTool = (tool) => {
    navigate('/tools/' + slugify(tool.title));
  };

  const getGradient = (colorClass) => GRADIENT_MAP[colorClass] || 'from-blue-500 to-indigo-400';

  return (
    <div className="space-y-10">

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="stat-item bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-[#378ADD]/20 transition-all"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <iconify-icon icon={stat.icon} class={`text-2xl mb-2 ${stat.color}`}></iconify-icon>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
            <span className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 border-b border-gray-200/60">
          {CATEGORIES.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                activeCategory === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setActiveCategory('ai')}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
              activeCategory === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            )}
          >
            <iconify-icon icon="solar:stars-bold-duotone" class="text-sm"></iconify-icon>
            AI Tools
          </button>
        </div>
      </div>

      {/* Tool cards grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredTools.map((tool, idx) => {
            const gradient = getGradient(tool.iconColorClass);
            return (
              <div
                key={idx}
                onClick={() => openTool(tool)}
                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Gradient top bar + icon */}
                <div className={clsx(
                  'relative flex items-center justify-center pt-6 pb-5',
                  `bg-gradient-to-br ${gradient}`
                )}>
                  {/* Badge */}
                  {tool.badge && (
                    <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-sm border border-white/30">
                      {tool.badge.text}
                    </span>
                  )}
                  {/* Large white icon on gradient */}
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                    <iconify-icon icon={tool.icon} class="text-3xl text-white drop-shadow"></iconify-icon>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
                </div>

                {/* Card body */}
                <div className="px-4 py-3 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{tool.title}</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed flex-1 line-clamp-2">{tool.desc}</p>
                  <div className="mt-2.5 flex items-center text-[11px] font-semibold text-gray-400 group-hover:text-[#378ADD] transition-colors duration-200">
                    Use tool
                    <iconify-icon icon="solar:arrow-right-bold" class="ml-1 group-hover:translate-x-1 transition-transform duration-200"></iconify-icon>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <iconify-icon icon="solar:file-remove-bold-duotone" class="text-5xl text-gray-300 mb-4"></iconify-icon>
          <h3 className="text-base font-semibold text-gray-900">No tools found</h3>
          <p className="text-sm text-gray-500 mt-1">Try a different search term or category.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-4 text-xs font-semibold text-[#378ADD] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Bottom CTA banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#378ADD] p-8 md:p-12 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5"></div>
        </div>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">Upgrade anytime</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready for unlimited power?</h2>
          <p className="text-blue-100 text-sm mb-7 max-w-md mx-auto">Unlock all 37+ tools, 1GB file sizes, API access, and zero ads for just $4.99/month.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { navigate('/pricing'); }}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#378ADD] font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              View pricing
            </button>
            <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm">
              Try free — no card needed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
