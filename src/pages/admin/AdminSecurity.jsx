import React from 'react';
import { clsx } from 'clsx';

const BANNED_IPS = [
  { ip: '103.xxx.xxx.x', reason: 'Abuse (500 req/min)', date: '25/05/2026', by: 'Ahmed' },
  { ip: '45.xxx.xxx.xx', reason: 'Spam accounts', date: '24/05/2026', by: 'Sara' },
  { ip: '185.xx.xxx.x', reason: 'DDoS attempt', date: '20/05/2026', by: 'System' },
];

const ADMINS = [
  { name: 'Zaheer A.', email: 'admin@pdfmaster.com', role: 'Super Admin', lastLogin: 'Just now', twoFA: true },
  { name: 'Sara Khan', email: 'sara@pdfmaster.com', role: 'Admin', lastLogin: '2 hours ago', twoFA: true },
  { name: 'Ali Support', email: 'support@pdfmaster.com', role: 'Support', lastLogin: '1 day ago', twoFA: false },
];

const AUDIT_LOG = [
  { time: 'Today, 2:15 PM', admin: 'Zaheer A.', action: 'Banned IP 103.xxx.xxx.x', type: 'security' },
  { time: 'Today, 1:30 PM', admin: 'Sara Khan', action: 'Upgraded user ali@gm.com to Pro', type: 'user' },
  { time: 'Today, 11:00 AM', admin: 'Zaheer A.', action: 'Changed Pro Monthly price to $4.99', type: 'settings' },
  { time: 'Yesterday, 4:00 PM', admin: 'System', action: 'Auto-banned 185.xx.xxx.x (DDoS)', type: 'system' },
];

export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Security & Access</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RATE LIMITING */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Rate Limiting</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Global Limit</p>
                <p className="text-xs text-gray-500">Max requests per IP per 15 minutes</p>
              </div>
              <input type="number" defaultValue="100" className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Per Tool Limit</p>
                <p className="text-xs text-gray-500">Max process requests per minute</p>
              </div>
              <input type="number" defaultValue="10" className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">AI Endpoints</p>
                <p className="text-xs text-gray-500">Max Chat/Summarize requests per minute</p>
              </div>
              <input type="number" defaultValue="5" className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]" />
            </div>
            <button className="w-full py-2 bg-gray-50 text-[#378ADD] font-bold text-sm rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              Save Rate Limits
            </button>
          </div>
        </div>

        {/* SUSPICIOUS ACTIVITY */}
        <div className="bg-red-50 rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <iconify-icon icon="solar:danger-triangle-bold" class="text-xl"></iconify-icon>
            Suspicious Activity Alerts
          </h2>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
              <p className="text-sm font-bold text-gray-900">IP: 103.xxx.xxx.x</p>
              <p className="text-xs text-red-600 mt-0.5">500 requests in 5 minutes (Today)</p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Ban IP</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 border border-gray-200">Whitelist</button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
              <p className="text-sm font-bold text-gray-900">User: spam@xxx.com</p>
              <p className="text-xs text-red-600 mt-0.5">Multiple accounts from same IP (Yesterday)</p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Ban User</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADMIN ACCOUNTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Admin Accounts</h2>
            <button className="text-sm font-bold text-[#378ADD] hover:underline flex items-center gap-1">
              <iconify-icon icon="solar:user-plus-bold"></iconify-icon> Add Admin
            </button>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm font-bold text-gray-900">Require 2FA for all admins</span>
              <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle2fa" id="toggle2fa" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                <label htmlFor="toggle2fa" className="toggle-label block overflow-hidden h-5 rounded-full bg-[#378ADD] cursor-pointer"></label>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {ADMINS.map((admin, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      {admin.name} 
                      <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase tracking-wider", admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>{admin.role}</span>
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{admin.email} • Last: {admin.lastLogin}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {!admin.twoFA && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">No 2FA</span>}
                    <button className="text-gray-400 hover:text-gray-700"><iconify-icon icon="solar:pen-bold" class="text-lg"></iconify-icon></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BANNED IPS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Banned IPs</h2>
            <button className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
              <iconify-icon icon="solar:shield-minus-bold"></iconify-icon> Add Ban
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="py-3 px-6 font-semibold">IP Address</th>
                  <th className="py-3 px-6 font-semibold">Reason</th>
                  <th className="py-3 px-6 font-semibold">Date</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {BANNED_IPS.map((ban, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-3 px-6 font-bold text-gray-900">{ban.ip}</td>
                    <td className="py-3 px-6 text-gray-600">{ban.reason}</td>
                    <td className="py-3 px-6 text-gray-400 text-xs">{ban.date}</td>
                    <td className="py-3 px-6 text-right">
                      <button className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg">Unban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AUDIT LOG */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Audit Log (Admin Actions)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <tbody className="divide-y divide-gray-50">
              {AUDIT_LOG.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-4 px-6 text-gray-500 w-48">{log.time}</td>
                  <td className="py-4 px-6 font-bold text-gray-900 w-48">{log.admin}</td>
                  <td className="py-4 px-6 text-gray-700">{log.action}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={clsx(
                      "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider",
                      log.type === 'security' ? 'bg-red-50 text-red-600' :
                      log.type === 'user' ? 'bg-blue-50 text-blue-600' :
                      log.type === 'settings' ? 'bg-gray-100 text-gray-600' :
                      'bg-purple-50 text-purple-600'
                    )}>
                      {log.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button className="text-sm font-bold text-[#378ADD] hover:underline">View Full Audit Log</button>
        </div>
      </div>
    </div>
  );
}
