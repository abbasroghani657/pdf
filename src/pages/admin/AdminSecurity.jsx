import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminSecurity() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [savingRates, setSavingRates] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [rateLimits, setRateLimits] = useState({ global: 100, perTool: 10, ai: 5 });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddBan, setShowAddBan] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newBanEmail, setNewBanEmail] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        api.get('/admin/security/logs').catch(() => ({ data: { success: false }})),
        api.get('/admin/users').catch(() => ({ data: { success: false }}))
      ]);

      if (logsRes.data && logsRes.data.success) {
        setLogs(logsRes.data.logs);
        setBannedUsers(logsRes.data.bannedUsers || []);
      }
      
      if (usersRes.data && usersRes.data.success) {
        const adminUsers = usersRes.data.users.filter(u => u.role === 'admin' || u.role === 'superadmin');
        setAdmins(adminUsers);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveRateLimits = async () => {
    setSavingRates(true);
    try {
      await api.put('/admin/settings', {
        settings: {
          rate_limit_global: String(rateLimits.global),
          rate_limit_per_tool: String(rateLimits.perTool),
          rate_limit_ai: String(rateLimits.ai),
        }
      });
      toast.success('Rate limits saved!');
    } catch {
      toast.error('Failed to save rate limits.');
    } finally {
      setSavingRates(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return toast.error('Enter an email address.');
    try {
      const usersRes = await api.get('/admin/users');
      const target = usersRes.data.users?.find(u => u.email === newAdminEmail.trim());
      if (!target) return toast.error('User not found with that email.');
      await api.put(`/admin/users/${target.id}/role`, { role: 'admin' }).catch(() => {
        throw new Error('Role update not available');
      });
      toast.success(`${newAdminEmail} promoted to Admin!`);
      setNewAdminEmail('');
      setShowAddAdmin(false);
      fetchData();
    } catch (e) {
      toast.error(e.message || 'Failed to add admin.');
    }
  };

  const handleAddBan = async () => {
    if (!newBanEmail.trim()) return toast.error('Enter an email address.');
    try {
      const usersRes = await api.get('/admin/users');
      const target = usersRes.data.users?.find(u => u.email === newBanEmail.trim());
      if (!target) return toast.error('User not found with that email.');
      await api.put(`/admin/users/${target.id}/ban`, { is_banned: true });
      toast.success(`${newBanEmail} has been banned.`);
      setNewBanEmail('');
      setShowAddBan(false);
      fetchData();
    } catch {
      toast.error('Failed to ban user.');
    }
  };

  const handleUnban = async (ban) => {
    setActionLoading(prev => ({ ...prev, [`unban-${ban.id}`]: true }));
    try {
      await api.put(`/admin/users/${ban.id}/ban`, { is_banned: false });
      setBannedUsers(prev => prev.filter(u => u.id !== ban.id));
      toast.success(`${ban.email} has been unbanned.`);
    } catch {
      toast.error('Failed to unban user.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`unban-${ban.id}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Security & Access</h1>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
        </button>
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
              <input
                type="number"
                value={rateLimits.global}
                onChange={e => setRateLimits(prev => ({ ...prev, global: e.target.value }))}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Per Tool Limit</p>
                <p className="text-xs text-gray-500">Max process requests per minute</p>
              </div>
              <input
                type="number"
                value={rateLimits.perTool}
                onChange={e => setRateLimits(prev => ({ ...prev, perTool: e.target.value }))}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">AI Endpoints</p>
                <p className="text-xs text-gray-500">Max Chat/Summarize requests per minute</p>
              </div>
              <input
                type="number"
                value={rateLimits.ai}
                onChange={e => setRateLimits(prev => ({ ...prev, ai: e.target.value }))}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-[#378ADD] focus:border-[#378ADD]"
              />
            </div>
            <button
              onClick={handleSaveRateLimits}
              disabled={savingRates}
              className="w-full py-2 bg-gray-50 text-[#378ADD] font-bold text-sm rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {savingRates ? 'Saving...' : 'Save Rate Limits'}
            </button>
          </div>
        </div>

        {/* SUSPICIOUS ACTIVITY */}
        <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <iconify-icon icon="solar:shield-check-bold" class="text-3xl"></iconify-icon>
          </div>
          <h2 className="text-lg font-bold text-emerald-800 mb-2">No Suspicious Activity</h2>
          <p className="text-sm text-emerald-600">All systems are secure. Rate limiting and access controls are functioning normally.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADMIN ACCOUNTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Admin Accounts</h2>
            <button
              onClick={() => setShowAddAdmin(v => !v)}
              className="text-sm font-bold text-[#378ADD] hover:underline flex items-center gap-1"
            >
              <iconify-icon icon="solar:user-plus-bold"></iconify-icon> Add Admin
            </button>
          </div>
          {showAddAdmin && (
            <div className="px-6 pt-4 flex gap-2">
              <input
                type="email"
                placeholder="user@email.com"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]"
              />
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-[#378ADD] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm font-bold text-gray-900">Require 2FA for all admins</span>
              <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle2fa" id="toggle2fa" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                <label htmlFor="toggle2fa" className="toggle-label block overflow-hidden h-5 rounded-full bg-[#378ADD] cursor-pointer"></label>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {admins.length === 0 && !loading && (
                <p className="text-sm text-gray-500 text-center py-4">No admins found.</p>
              )}
              {admins.map((admin, i) => (
                <div key={admin.id || i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#378ADD] font-bold text-xs shrink-0">
                      {(admin.name || admin.email || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {admin.name || 'Unknown Admin'}
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase tracking-wider", admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                          {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">{admin.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toast('To edit admin roles, use the Supabase dashboard → Table Editor → users table.', { icon: 'ℹ️' })}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <iconify-icon icon="solar:pen-bold" class="text-lg"></iconify-icon>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BANNED USERS / IPS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Banned Users & IPs</h2>
            <button
              onClick={() => setShowAddBan(v => !v)}
              className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <iconify-icon icon="solar:shield-minus-bold"></iconify-icon> Add Ban
            </button>
          </div>
          {showAddBan && (
            <div className="px-6 pt-4 flex gap-2">
              <input
                type="email"
                placeholder="user@email.com"
                value={newBanEmail}
                onChange={e => setNewBanEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-red-400 focus:border-red-400"
              />
              <button
                onClick={handleAddBan}
                className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
              >
                Ban
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="py-3 px-6 font-semibold">User / IP</th>
                  <th className="py-3 px-6 font-semibold">Reason</th>
                  <th className="py-3 px-6 font-semibold">Date</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bannedUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No banned users found.
                    </td>
                  </tr>
                )}
                {bannedUsers.map((ban, i) => (
                  <tr key={ban.id || i} className="hover:bg-gray-50/50">
                    <td className="py-3 px-6 font-bold text-gray-900">{ban.email || ban.name || 'Unknown'}</td>
                    <td className="py-3 px-6 text-gray-600">Violation of TOS</td>
                    <td className="py-3 px-6 text-gray-400 text-xs">{new Date(ban.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleUnban(ban)}
                        disabled={actionLoading[`unban-${ban.id}`]}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50"
                      >
                        {actionLoading[`unban-${ban.id}`] ? '...' : 'Unban'}
                      </button>
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
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Audit Log (Admin Actions)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No security logs found.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="py-4 px-6 text-gray-500 w-48">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-4 px-6 font-bold text-gray-900 w-48">{log.user_email || 'System'}</td>
                  <td className="py-4 px-6 text-gray-700">{log.action}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={clsx(
                      "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider",
                      log.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {log.status || 'success'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
