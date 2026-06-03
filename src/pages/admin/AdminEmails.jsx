import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminEmails() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/emails');
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        setTemplates(res.data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchEmails}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors mr-2 disabled:opacity-50"
          >
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-semibold transition-colors", activeTab === 'campaigns' ? "bg-white border border-gray-200 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          >
            Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-semibold transition-colors", activeTab === 'templates' ? "bg-white border border-gray-200 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          >
            Templates
          </button>
        </div>
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Campaigns</h2>
              <p className="text-sm text-gray-500 mt-1">Send marketing emails or announcements to specific user segments.</p>
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#378ADD] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30">
              <iconify-icon icon="solar:pen-new-square-bold"></iconify-icon>
              New Campaign
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Campaign Subject</th>
                    <th className="py-4 px-6 font-semibold">Audience</th>
                    <th className="py-4 px-6 font-semibold">Sent On</th>
                    <th className="py-4 px-6 font-semibold text-center">Recipients</th>
                    <th className="py-4 px-6 font-semibold text-center">Open Rate</th>
                    <th className="py-4 px-6 font-semibold text-center">Click Rate</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">Loading campaigns...</td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">No campaigns found.</td>
                    </tr>
                  ) : (
                    campaigns.map((camp, i) => (
                      <tr key={camp.id || i} className="hover:bg-gray-50/50">
                        <td className="py-4 px-6 font-bold text-gray-900">{camp.subject}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold tracking-wider uppercase">{camp.audience}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{new Date(camp.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-6 font-semibold text-center">{camp.sent_count}</td>
                        <td className="py-4 px-6 font-bold text-emerald-600 text-center">{camp.open_rate}</td>
                        <td className="py-4 px-6 font-bold text-blue-600 text-center">{camp.click_rate}</td>
                        <td className="py-4 px-6 text-right">
                          <button className="text-sm font-semibold text-gray-400 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Report</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              No custom templates available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((temp, i) => (
                <div key={temp.id || i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:-translate-y-1 transition-all cursor-pointer hover:border-blue-200">
                  <div className="w-12 h-12 bg-blue-50 text-[#378ADD] rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    <iconify-icon icon="solar:letter-opened-bold"></iconify-icon>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{temp.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">Updated {new Date(temp.updated_at).toLocaleDateString()}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{temp.status}</span>
                    <button className="text-xs font-bold text-[#378ADD] hover:underline">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Create Custom Template</h3>
              <p className="text-sm text-gray-500">Design your own HTML email templates for API usage or custom events.</p>
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
              + New Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
