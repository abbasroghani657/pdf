import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const name = user.name || '';
    const email = user.email || '';
    const plan = user.is_pro ? 'Pro' : 'Free';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'All' || plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

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
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
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
        <div className="flex items-center gap-3">
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-3 px-6 font-semibold w-8"><input type="checkbox" className="rounded text-[#378ADD] focus:ring-[#378ADD]" /></th>
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
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
                    <p className="mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => {
                const isPro = user.is_pro;
                const planName = isPro ? 'Pro' : 'Free';
                const status = user.is_banned ? 'Banned' : 'Active';
                const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6"><input type="checkbox" className="rounded text-[#378ADD] focus:ring-[#378ADD]" /></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#378ADD] font-bold text-sm shrink-0">
                          {firstLetter}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            {user.name || 'Unknown User'} 
                            {user.country && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-semibold">{user.country}</span>
                            )}
                          </p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                        isPro ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {planName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={clsx(
                        "flex items-center gap-1.5 text-xs font-bold",
                        status === 'Active' ? "text-emerald-500" : "text-red-500"
                      )}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", status === 'Active' ? "bg-emerald-500" : "bg-red-500")}></span>
                        {status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-gray-400 hover:text-[#378ADD] transition-colors rounded-lg hover:bg-blue-50">
                        <iconify-icon icon="solar:menu-dots-bold" class="text-lg"></iconify-icon>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing {filteredUsers.length} users</p>
        </div>
      </div>
    </div>
  );
}
