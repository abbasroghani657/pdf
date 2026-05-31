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
  { id: 'all',      label: 'All tools' },
  { id: 'convert',  label: 'Convert' },
  { id: 'organize', label: 'Organize' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'security', label: 'Security' },
  { id: 'edit',     label: 'Edit' },
  { id: 'sign',     label: 'eSign' },
];

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

  return (
    <div className="space-y-8">

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all"
          >
            <iconify-icon icon={stat.icon} class={`text-2xl mb-2 ${stat.color}`}></iconify-icon>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
            <span className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 border',
              activeCategory === tab.id
                ? 'bg-[#378ADD] text-white border-[#378ADD] shadow-sm'
                : 'text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300 bg-white'
            )}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setActiveCategory('ai')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 border flex items-center gap-1.5',
            activeCategory === 'ai'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'text-purple-600 border-purple-200 hover:bg-purple-50 bg-white'
          )}
        >
          <iconify-icon icon="solar:stars-bold-duotone" class="text-sm"></iconify-icon>
          AI Tools
        </button>
      </div>

      {/* Tool cards grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredTools.map((tool, idx) => (
            <div
              key={idx}
              onClick={() => openTool(tool)}
              className="group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer relative flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              {/* Badge */}
              {tool.badge && (
                <span className={clsx(
                  'absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full',
                  tool.badgeClass
                )}>
                  {tool.badge.text}
                </span>
              )}

              {/* Icon box */}
              <div className={clsx(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                tool.iconColorClass
              )}>
                <iconify-icon icon={tool.icon} class="text-2xl"></iconify-icon>
              </div>

              {/* Text */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{tool.title}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{tool.desc}</p>
              </div>

              {/* Arrow - appears on hover */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#378ADD] opacity-0 group-hover:opacity-100 transition-all duration-200 -mt-1">
                Open tool
                <iconify-icon icon="solar:arrow-right-bold" class="text-xs group-hover:translate-x-0.5 transition-transform duration-200"></iconify-icon>
              </div>
            </div>
          ))}
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
