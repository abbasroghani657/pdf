import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'PDFMaster',
    site_url: 'https://pdfmaster.com',
    maintenance_mode: 'false',
    maintenance_message: "We'll be right back in 2 hours!",
    pro_monthly_price: '4.99',
    pro_annual_price: '44.99',
    free_file_size_limit: '10',
    free_daily_uses: '5',
    pro_file_size_limit: '100',
    support_email: 'support@pdfmaster.com',
    meta_title: 'PDFMaster — Free PDF Tools Online',
    meta_description: 'Edit, compress, merge, sign and convert PDFs for free. No installation needed.',
  });

  const TABS = [
    { id: 'general',  label: 'General',         icon: 'solar:settings-bold' },
    { id: 'pricing',  label: 'Pricing & Plans',  icon: 'solar:tag-price-bold' },
    { id: 'limits',   label: 'Usage Limits',     icon: 'solar:stopwatch-bold' },
    { id: 'apikeys',  label: 'API Keys',          icon: 'solar:key-bold' },
    { id: 'seo',      label: 'SEO & Legal',       icon: 'solar:global-bold' },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const settingsObj = {};
        res.data.settings.forEach(s => { settingsObj[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      // Settings table might not exist yet — use defaults
      console.log('Settings table not ready, using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings. Make sure to run the SQL script first.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-[#378ADD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2 disabled:opacity-70"
        >
          <iconify-icon icon={saving ? "line-md:loading-twotone-loop" : "solar:save-bold"}></iconify-icon>
          {saving ? 'Saving...' : 'Save All Changes'}
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
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">General Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Site Name</label>
                  <input 
                    type="text" 
                    value={settings.site_name} 
                    onChange={e => updateSetting('site_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Site URL</label>
                  <input 
                    type="url" 
                    value={settings.site_url}
                    onChange={e => updateSetting('site_url', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Support Email</label>
                  <input 
                    type="email" 
                    value={settings.support_email}
                    onChange={e => updateSetting('support_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  Maintenance Mode
                  <button 
                    onClick={() => updateSetting('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                    className={clsx(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      settings.maintenance_mode === 'true' ? "bg-amber-500" : "bg-gray-200"
                    )}
                  >
                    <span className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.maintenance_mode === 'true' ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </label>
                <input 
                  type="text" 
                  value={settings.maintenance_message}
                  onChange={e => updateSetting('maintenance_message', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                />
                <p className="text-xs text-gray-400">If enabled, all users (except admins) will see this message.</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <iconify-icon icon="solar:info-circle-bold" class="text-lg"></iconify-icon>
                  Live Settings from Database
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  These settings are loaded from the <code className="bg-blue-100 px-1 rounded">platform_settings</code> table and saved back on click.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Pricing & Plans</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Pro Monthly ($)</label>
                  <input 
                    type="number" step="0.01" 
                    value={settings.pro_monthly_price}
                    onChange={e => updateSetting('pro_monthly_price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Pro Annual ($)</label>
                  <input 
                    type="number" step="0.01" 
                    value={settings.pro_annual_price}
                    onChange={e => updateSetting('pro_annual_price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                  />
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
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Global Usage Limits</h2>
              
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="font-bold text-gray-900">Free Tier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Max File Size (MB)</label>
                    <input 
                      type="number" 
                      value={settings.free_file_size_limit}
                      onChange={e => updateSetting('free_file_size_limit', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Per-tool Daily Uses</label>
                    <input 
                      type="number" 
                      value={settings.free_daily_uses}
                      onChange={e => updateSetting('free_daily_uses', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4">
                <h3 className="font-bold text-purple-900">Pro Tier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-700">Max File Size (MB)</label>
                    <input 
                      type="number" 
                      value={settings.pro_file_size_limit}
                      onChange={e => updateSetting('pro_file_size_limit', e.target.value)}
                      className="w-full px-3 py-1.5 border border-purple-200 rounded text-sm focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-bold text-purple-700">Other Limits</label>
                    <p className="text-sm text-purple-800 font-medium py-1.5">Unlimited uses & pages</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apikeys' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Third-Party API Keys</h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium flex items-start gap-2">
                <iconify-icon icon="solar:shield-warning-bold" class="text-xl shrink-0 mt-0.5 text-amber-600"></iconify-icon>
                These keys are stored in your server's <code className="bg-amber-100 px-1 rounded">.env</code> file, not in the database. Edit them there directly to avoid security risks.
              </div>
              {[
                { name: 'Stripe Secret Key',      val: 'sk_live_*****' },
                { name: 'Stripe Webhook Secret',  val: 'whsec_*****' },
                { name: 'Gemini AI Key',          val: 'AIzaSy*****' },
                { name: 'Groq Key',               val: 'gsk_*****' },
                { name: 'JazzCash Merchant ID',   val: 'MC*****' },
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
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">SEO & Legal</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Default Meta Title</label>
                <input 
                  type="text" 
                  value={settings.meta_title}
                  onChange={e => updateSetting('meta_title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Default Meta Description</label>
                <textarea 
                  rows="3" 
                  value={settings.meta_description}
                  onChange={e => updateSetting('meta_description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]"
                ></textarea>
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
