import React from 'react';
import { clsx } from 'clsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Funnel, FunnelChart, LabelList } from 'recharts';

const TRAFFIC_DATA = [
  { name: 'Mon', visits: 4000, sessions: 6000 },
  { name: 'Tue', visits: 5200, sessions: 7200 },
  { name: 'Wed', visits: 4800, sessions: 6800 },
  { name: 'Thu', visits: 6300, sessions: 8300 },
  { name: 'Fri', visits: 5900, sessions: 7900 },
  { name: 'Sat', visits: 7200, sessions: 9200 },
  { name: 'Sun', visits: 8500, sessions: 11000 },
];

const FUNNEL_DATA = [
  { value: 45230, name: 'Total Visitors', fill: '#e2e8f0' },
  { value: 38100, name: 'Used a Tool', fill: '#bae6fd' },
  { value: 8900, name: 'Hit Free Limit', fill: '#7dd3fc' },
  { value: 5200, name: 'Pricing Page', fill: '#38bdf8' },
  { value: 892, name: 'Bought Pro', fill: '#0ea5e9' },
];

const COUNTRIES = [
  { flag: '🇵🇰', name: 'Pakistan', percentage: 35, users: '12,450' },
  { flag: '🇮🇳', name: 'India', percentage: 22, users: '7,850' },
  { flag: '🇺🇸', name: 'USA', percentage: 15, users: '5,350' },
  { flag: '🇬🇧', name: 'UK', percentage: 8, users: '2,850' },
  { flag: '🇸🇦', name: 'Saudi Arabia', percentage: 7, users: '2,500' },
];

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 px-4 py-2 cursor-pointer shadow-sm focus:ring-[#378ADD] focus:border-[#378ADD]">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#378ADD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm">
            <iconify-icon icon="solar:download-square-bold"></iconify-icon> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Visitors', value: '45,230', trend: '+12%' },
          { label: 'Sessions', value: '62,100', trend: '+8%' },
          { label: 'Page Views', value: '189.5k', trend: '+21%' },
          { label: 'Bounce Rate', value: '34%', trend: '-2%' },
          { label: 'Avg Session', value: '4m 23s', trend: '+1m' },
          { label: 'New Users', value: '68%', trend: '+5%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className={clsx("text-xs font-bold", stat.trend.startsWith('+') ? "text-emerald-500" : "text-emerald-500")}>{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TRAFFIC OVER TIME */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Traffic (Visits & Sessions)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
                <Area type="monotone" dataKey="visits" stroke="#378ADD" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONVERSION FUNNEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Conversion Funnel</h2>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">Conv: 1.97%</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={FUNNEL_DATA} isAnimationActive>
                  <LabelList position="right" fill="#475569" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP COUNTRIES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Countries</h2>
          <div className="space-y-4">
            {COUNTRIES.map((country, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-semibold text-gray-900">{country.name}</p>
                    <p className="text-xs text-gray-500">{country.users} users</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#378ADD] h-2 rounded-full" style={{width: `${country.percentage}%`}}></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 w-10 text-right">{country.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* DEMOGRAPHICS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Device Split</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Mobile</span><span className="font-bold">62%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Desktop</span><span className="font-bold">31%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tablet</span><span className="font-bold">7%</span></div>
            </div>
            <div className="w-full h-2 flex rounded-full overflow-hidden mt-3">
              <div className="bg-blue-500" style={{width: '62%'}}></div>
              <div className="bg-indigo-400" style={{width: '31%'}}></div>
              <div className="bg-purple-300" style={{width: '7%'}}></div>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Top Referrers</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Google</span><span className="font-bold">45%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Direct</span><span className="font-bold">30%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Social</span><span className="font-bold">15%</span></div>
            </div>
            <div className="w-full h-2 flex rounded-full overflow-hidden mt-3">
              <div className="bg-emerald-500" style={{width: '45%'}}></div>
              <div className="bg-amber-400" style={{width: '30%'}}></div>
              <div className="bg-rose-400" style={{width: '15%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
