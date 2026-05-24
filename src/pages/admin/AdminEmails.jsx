import React, { useState } from 'react';
import { clsx } from 'clsx';

const TEMPLATES = [
  { name: 'Welcome Email', status: 'Active', updated: '10 days ago' },
  { name: 'Pro Upgrade Receipt', status: 'Active', updated: '1 month ago' },
  { name: 'Payment Failed', status: 'Active', updated: '2 months ago' },
  { name: 'Password Reset', status: 'Active', updated: '2 months ago' },
];

const CAMPAIGNS = [
  { subject: 'New Feature: Translate PDF is Live!', audience: 'All Users', sent: '12,450', opened: '42%', clicked: '18%', date: '01/05/2026' },
  { subject: '50% off Pro for a limited time', audience: 'Free Users', sent: '10,200', opened: '38%', clicked: '5%', date: '15/04/2026' },
  { subject: 'Your API limit is increasing', audience: 'API Plans', sent: '150', opened: '85%', clicked: '40%', date: '10/03/2026' },
];

export default function AdminEmails() {
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
        <div className="flex items-center gap-2">
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
                  {CAMPAIGNS.map((camp, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-4 px-6 font-bold text-gray-900">{camp.subject}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold tracking-wider uppercase">{camp.audience}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-500">{camp.date}</td>
                      <td className="py-4 px-6 font-semibold text-center">{camp.sent}</td>
                      <td className="py-4 px-6 font-bold text-emerald-600 text-center">{camp.opened}</td>
                      <td className="py-4 px-6 font-bold text-blue-600 text-center">{camp.clicked}</td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-sm font-semibold text-gray-400 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((temp, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:-translate-y-1 transition-all cursor-pointer hover:border-blue-200">
                <div className="w-12 h-12 bg-blue-50 text-[#378ADD] rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <iconify-icon icon="solar:letter-opened-bold"></iconify-icon>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{temp.name}</h3>
                <p className="text-xs text-gray-500 mb-4">Updated {temp.updated}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{temp.status}</span>
                  <button className="text-xs font-bold text-[#378ADD] hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>

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
