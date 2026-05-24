import React, { useState } from 'react';
import { clsx } from 'clsx';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const TABS = [
    { id: 'general', label: 'General', icon: 'solar:settings-bold' },
    { id: 'pricing', label: 'Pricing & Plans', icon: 'solar:tag-price-bold' },
    { id: 'limits', label: 'Usage Limits', icon: 'solar:stopwatch-bold' },
    { id: 'apikeys', label: 'API Keys', icon: 'solar:key-bold' },
    { id: 'seo', label: 'SEO & Legal', icon: 'solar:global-bold' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <button className="px-6 py-2 bg-[#378ADD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30">
          Save All Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR TABS */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-blue-50 text-[#378ADD]" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <iconify-icon icon={tab.icon} class="text-lg"></iconify-icon>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* SETTINGS CONTENT */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">General Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Site Name</label>
                  <input type="text" defaultValue="PDFMaster" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Site URL</label>
                  <input type="url" defaultValue="https://pdfmaster.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  Maintenance Mode
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="maint_toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                    <label htmlFor="maint_toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </label>
                <input type="text" defaultValue="We'll be right back in 2 hours!" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 focus:ring-[#378ADD] focus:border-[#378ADD]" />
                <p className="text-xs text-gray-400">If enabled, all users (except admins) will see this message.</p>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Pricing & Plans</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Pro Monthly ($)</label>
                  <input type="number" step="0.01" defaultValue="4.99" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Pro Annual ($)</label>
                  <input type="number" step="0.01" defaultValue="44.99" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Business ($/user)</label>
                  <input type="number" step="0.01" defaultValue="69.99" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Currency</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]">
                    <option>USD ($)</option>
                    <option>PKR (Rs)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Global Usage Limits</h2>
              
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="font-bold text-gray-900">Free Tier</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Max File Size (MB)</label>
                    <input type="number" defaultValue="10" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Uses / Day</label>
                    <input type="number" defaultValue="5" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Max Pages</label>
                    <input type="number" defaultValue="50" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4">
                <h3 className="font-bold text-purple-900">Pro Tier</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-700">Max File Size (MB)</label>
                    <input type="number" defaultValue="1000" className="w-full px-3 py-1.5 border border-purple-200 rounded text-sm focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-purple-700">Other Limits</label>
                    <p className="text-sm text-purple-800 font-medium py-1.5">Unlimited uses, unlimited pages</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apikeys' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Third-Party API Keys</h2>
              
              {[
                { name: 'Stripe Secret Key', val: 'sk_live_51O...' },
                { name: 'Stripe Webhook Secret', val: 'whsec_...' },
                { name: 'Gemini AI Key', val: 'AIzaSyA...' },
                { name: 'Groq Key', val: 'gsk_x8L...' },
                { name: 'JazzCash Merchant ID', val: 'MC1234...' },
              ].map((key, i) => (
                <div key={i} className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-bold text-gray-700">{key.name}</label>
                    <input type="password" defaultValue={key.val} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-[#378ADD] focus:border-[#378ADD]" />
                  </div>
                  <button className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Test</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">SEO & Legal</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Default Meta Title</label>
                <input type="text" defaultValue="PDFMaster — Free PDF Tools" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Default Meta Description</label>
                <textarea rows="3" defaultValue="Edit, compress, merge, and sign PDFs for free." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]"></textarea>
              </div>
              <div className="pt-4 flex gap-4">
                <button className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Edit Terms of Service</button>
                <button className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Edit Privacy Policy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
