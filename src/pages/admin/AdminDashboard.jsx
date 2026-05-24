import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const REVENUE_DATA = [
  { name: 'May 1', value: 120 }, { name: 'May 5', value: 180 }, 
  { name: 'May 10', value: 250 }, { name: 'May 15', value: 210 }, 
  { name: 'May 20', value: 340 }, { name: 'May 25', value: 420 },
];

const TOP_TOOLS = [
  { name: 'Compress PDF', uses: 847 },
  { name: 'Chat PDF', uses: 634 },
  { name: 'OCR PDF', uses: 521 },
  { name: 'Merge PDF', uses: 489 },
  { name: 'Translate PDF', uses: 312 },
];

const RECENT_SIGNUPS = [
  { email: 'ali.hassan@example.com', time: '2 mins ago', plan: 'Pro', country: 'PK' },
  { email: 'sara.k@example.com', time: '15 mins ago', plan: 'Free', country: 'UK' },
  { email: 'john.smith@example.com', time: '1 hour ago', plan: 'Pro', country: 'US' },
  { email: 'ahmed.r@example.com', time: '3 hours ago', plan: 'Business', country: 'PK' },
  { email: 'maria.g@example.com', time: '5 hours ago', plan: 'Free', country: 'IN' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          <iconify-icon icon="solar:refresh-linear"></iconify-icon>
          Refresh Data
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '$4,280', trend: '+23%', color: 'from-emerald-500 to-teal-400', icon: 'solar:wallet-money-bold' },
          { title: 'Total Users', value: '12,450', trend: '+15%', color: 'from-[#378ADD] to-indigo-500', icon: 'solar:users-group-rounded-bold' },
          { title: 'New Today', value: '247', trend: '+5%', color: 'from-amber-400 to-orange-400', icon: 'solar:user-plus-bold' },
          { title: 'Pro Subscribers', value: '892', trend: '+12%', color: 'from-purple-500 to-pink-500', icon: 'solar:crown-star-bold' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shrink-0`}>
              <iconify-icon icon={stat.icon} class="text-3xl"></iconify-icon>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue (Last 30 Days)</h2>
            <select className="text-sm border-none bg-gray-50 font-medium rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer text-gray-600">
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="value" stroke="#378ADD" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALERTS & RECENT */}
        <div className="space-y-6">
          {/* ALERTS */}
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-lg"></iconify-icon>
              Action Required (2)
            </h2>
            <div className="space-y-3">
              <div className="bg-white/60 p-3 rounded-xl border border-red-200 text-sm text-red-900 flex gap-3">
                <iconify-icon icon="solar:shield-warning-bold" class="text-red-500 text-xl shrink-0"></iconify-icon>
                <div>
                  <span className="font-bold">Suspicious IP Detected:</span> 103.xxx.xxx.x has hit rate limits 5 times.
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl border border-red-200 text-sm text-red-900 flex gap-3">
                <iconify-icon icon="solar:server-bold" class="text-red-500 text-xl shrink-0"></iconify-icon>
                <div>
                  <span className="font-bold">Python Service:</span> Memory usage above 85% for 10 minutes.
                </div>
              </div>
            </div>
          </div>

          {/* RECENT SIGNUPS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Signups</h2>
            <div className="space-y-4">
              {RECENT_SIGNUPS.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#378ADD] flex items-center justify-center font-bold text-xs">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    user.plan === 'Pro' ? 'bg-purple-100 text-purple-700' :
                    user.plan === 'Business' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.plan}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-5 py-2 text-sm font-semibold text-[#378ADD] hover:bg-blue-50 rounded-lg transition-colors">
              View All Users →
            </button>
          </div>
        </div>
      </div>

      {/* TOP TOOLS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Top Tools Today</h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOP_TOOLS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={120} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="uses" fill="#378ADD" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
