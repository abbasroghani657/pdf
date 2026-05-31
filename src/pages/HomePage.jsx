import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { TOOLS_DATA } from '../data/tools';
import { slugify } from '../utils/slugify';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '37+', label: 'PDF tools available', icon: 'solar:box-bold' },
  { value: '100%', label: 'Free core tools', icon: 'solar:gift-bold' },
  { value: '256-bit', label: 'SSL encrypted', icon: 'solar:shield-check-bold' },
  { value: 'No signup', label: 'Required', icon: 'solar:user-cross-bold' },
];

const CATEGORIES = [
  { id: 'all', label: 'All tools', icon: 'solar:box-linear' },
  { id: 'convert', label: 'Convert', icon: 'solar:repeat-linear' },
  { id: 'organize', label: 'Organize', icon: 'solar:documents-linear' },
  { id: 'optimize', label: 'Optimize', icon: 'solar:minimize-square-linear' },
  { id: 'security', label: 'Security', icon: 'solar:lock-keyhole-linear' },
  { id: 'edit', label: 'Edit', icon: 'solar:pen-new-square-linear' },
  { id: 'sign', label: 'eSign', icon: 'solar:pen-linear' },
];

const TRUST_LOGOS = ['Lawyers', 'Accountants', 'Researchers', 'Educators', 'Developers', 'Businesses'];

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
    <div className="space-y-10">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="stat-item bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-[#378ADD]/20 transition-all"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <iconify-icon icon={stat.icon} class="text-[#378ADD] text-2xl mb-2"></iconify-icon>
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
            <iconify-icon icon="solar:stars-linear"></iconify-icon>
            AI Tools
          </button>
        </div>
      </div>

      {/* Tool cards grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool, idx) => (
            <div
              key={idx}
              onClick={() => openTool(tool)}
              className="tool-card group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer relative flex flex-col min-h-[148px] shadow-sm hover:border-[#378ADD]/30 hover:shadow-lg transition-all duration-300"
          >
            {tool.badge && (
              <span className={clsx(
                'absolute top-3.5 right-3.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full',
                tool.badgeClass || ''
              )}>
                {tool.badge.text}
              </span>
            )}
            <div className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
              tool.iconColorClass
            )}>
              <iconify-icon icon={tool.icon} class="text-2xl"></iconify-icon>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight mb-1">{tool.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed flex-1">{tool.desc}</p>
            <div className="mt-3 flex items-center text-[#378ADD] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Use tool <iconify-icon icon="solar:arrow-right-bold" class="ml-1 transition-transform group-hover:translate-x-1 duration-200"></iconify-icon>
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <iconify-icon icon="solar:file-remove-linear" class="text-5xl text-gray-300 mb-4"></iconify-icon>
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
