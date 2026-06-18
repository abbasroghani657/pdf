import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import adminApi from '../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [actionLoading, setActionLoading] = useState({});
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.profile?.role === 'superadmin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBanToggle = async (user) => {
    const newBanned = !user.is_banned;
    setActionLoading(prev => ({ ...prev, [`ban-${user.id}`]: true }));
    try {
      await adminApi.put(`/admin/users/${user.id}/ban`, { is_banned: newBanned });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: newBanned } : u));
      toast.success(newBanned ? `${user.email} banned.` : `${user.email} unbanned.`);
    } catch {
      toast.error('Failed to update ban status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`ban-${user.id}`]: false }));
    }
  };

  const handleProToggle = async (user) => {
    const newPro = !user.is_pro;
    setActionLoading(prev => ({ ...prev, [`pro-${user.id}`]: true }));
    try {
      await adminApi.put(`/admin/users/${user.id}/pro`, { is_pro: newPro });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_pro: newPro, plan: newPro ? 'Pro' : 'Free' } : u));
      toast.success(newPro ? `Pro granted to ${user.email}.` : `Pro revoked from ${user.email}.`);
    } catch {
      toast.error('Failed to update Pro status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`pro-${user.id}`]: false }));
    }
  };

  const handleInviteAdmin = async (userEmail, role) => {
    setActionLoading(prev => ({ ...prev, [`invite-${userEmail}`]: true }));
    try {
      const res = await adminApi.post('/admin/invitations', { email: userEmail, role });
      toast.success(res.data.message || 'Invitation sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [`invite-${userEmail}`]: false }));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'All' || (user.is_pro ? 'Pro' : 'Free') === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Plan', 'Country', 'Joined'];
    const rows = filteredUsers.map(u => [
      u.name || '',
      u.email || '',
      u.is_pro ? 'Pro' : 'Free',
      u.country || '',
      new Date(u.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TheyLovePDF_users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <iconify-icon icon={loading ? 'line-md:loading-twotone-loop' : 'solar:refresh-linear'}></iconify-icon> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <iconify-icon icon="solar:export-linear"></iconify-icon> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></iconify-icon>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:border-[#378ADD] focus:bg-white focus:ring-0 rounded-xl text-sm transition-all"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-gray-50 border-transparent focus:border-[#378ADD] focus:bg-white focus:ring-0 rounded-xl text-sm font-medium py-2.5 px-4 cursor-pointer"
        >
          <option value="All">All Plans</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-3 px-6 font-semibold">User</th>
                <th className="py-3 px-6 font-semibold">Plan</th>
                <th className="py-3 px-6 font-semibold">Joined</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
                    <p className="mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => {
                const isPro = user.is_pro;
                const isBanned = user.is_banned;
                const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#378ADD] font-bold text-sm shrink-0">
                          {firstLetter}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            {user.name || 'Unknown User'}
                            {user.country && <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-semibold">{user.country}</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-500 text-xs">{user.email}</p>
                            {user.role === 'superadmin' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">Super Admin</span>}
                            {user.role === 'admin' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Admin</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={clsx('px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider', isPro ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600')}>
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={clsx('flex items-center gap-1.5 text-xs font-bold', isBanned ? 'text-red-500' : 'text-emerald-500')}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', isBanned ? 'bg-red-500' : 'bg-emerald-500')}></span>
                        {isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && user.role !== 'superadmin' && user.role !== 'admin' && (
                          <button
                            onClick={() => handleInviteAdmin(user.email, 'admin')}
                            disabled={!!actionLoading[`invite-${user.email}`]}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#378ADD]/30 text-[#378ADD] bg-[#378ADD]/5 hover:bg-[#378ADD]/10 transition-colors disabled:opacity-50"
                          >
                            {actionLoading[`invite-${user.email}`] ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : 'Invite Admin'}
                          </button>
                        )}
                        <button
                          onClick={() => handleProToggle(user)}
                          disabled={!!actionLoading[`pro-${user.id}`]}
                          className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50', isPro ? 'border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100' : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100')}
                        >
                          {actionLoading[`pro-${user.id}`] ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : isPro ? 'Revoke Pro' : 'Grant Pro'}
                        </button>
                        <button
                          onClick={() => handleBanToggle(user)}
                          disabled={!!actionLoading[`ban-${user.id}`]}
                          className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50', isBanned ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100')}
                        >
                          {actionLoading[`ban-${user.id}`] ? <iconify-icon icon="line-md:loading-twotone-loop"></iconify-icon> : isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredUsers.length === 0 && (
                <tr><td colSpan="5" className="py-10 text-center text-gray-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          <p>Showing {filteredUsers.length} of {users.length} users</p>
        </div>
      </div>
    </div>
  );
}
