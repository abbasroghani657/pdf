import React, { useState } from 'react';
import { clsx } from 'clsx';

const MOCK_USERS = [
  { id: 'U1', name: 'Ali Hassan', email: 'ali@gmail.com', plan: 'Free', usage: '47/50', status: 'Active', country: 'PK', joined: '01/05/2026', lastActive: 'Today' },
  { id: 'U2', name: 'Sara Khan', email: 'sara@hot.com', plan: 'Pro', usage: 'Unlimited', status: 'Active', country: 'US', joined: '15/04/2026', lastActive: '2h ago' },
  { id: 'U3', name: 'Bad Actor', email: 'spam@xxx.com', plan: 'Free', usage: '50/50', status: 'Banned', country: 'RU', joined: '20/05/2026', lastActive: '1d ago' },
  { id: 'U4', name: 'John Doe', email: 'john@out.com', plan: 'Business', usage: 'Unlimited', status: 'Active', country: 'UK', joined: '10/02/2026', lastActive: '5m ago' },
  { id: 'U5', name: 'Ayesha R.', email: 'ayesha@gm.com', plan: 'Free', usage: '12/50', status: 'Active', country: 'PK', joined: '22/05/2026', lastActive: 'Just now' },
];

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'All' || user.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <iconify-icon icon="solar:export-linear"></iconify-icon> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#378ADD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30">
            <iconify-icon icon="solar:user-plus-bold"></iconify-icon> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></iconify-icon>
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
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
            <option value="Business">Business</option>
          </select>
          <select className="bg-gray-50 border-transparent focus:border-[#378ADD] focus:bg-white focus:ring-0 rounded-xl text-sm font-medium py-2.5 px-4 cursor-pointer hidden sm:block">
            <option>All Status</option>
            <option>Active</option>
            <option>Banned</option>
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
                <th className="py-3 px-6 font-semibold">Usage</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6"><input type="checkbox" className="rounded text-[#378ADD] focus:ring-[#378ADD]" /></td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#378ADD] font-bold text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          {user.name} 
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-semibold">{user.country}</span>
                        </p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                      user.plan === 'Pro' ? "bg-purple-100 text-purple-700" :
                      user.plan === 'Business' ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-gray-700">{user.usage}</p>
                    <p className="text-xs text-gray-400">Last: {user.lastActive}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={clsx(
                      "flex items-center gap-1.5 text-xs font-bold",
                      user.status === 'Active' ? "text-emerald-500" : "text-red-500"
                    )}>
                      <span className={clsx("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? "bg-emerald-500" : "bg-red-500")}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#378ADD] transition-colors rounded-lg hover:bg-blue-50">
                      <iconify-icon icon="solar:menu-dots-bold" class="text-lg"></iconify-icon>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing 1 to {filteredUsers.length} of 12,450 users</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-[#378ADD] text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
