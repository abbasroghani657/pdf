import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Funnel, FunnelChart, LabelList } from 'recharts';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';



export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    newUsers: 0
  });
  const [trafficData, setTrafficData] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [countryData, setCountryData] = useState([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setStats(res.data.stats);
        setTrafficData(res.data.trafficData || []);
        setFunnelData(res.data.funnelData || []);
        setCountryData(res.data.countryData || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#378ADD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm">
            <iconify-icon icon="solar:download-square-bold"></iconify-icon> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Visitors', value: loading ? '...' : stats.visitors.toLocaleString(), trend: stats.visitors > 0 ? `+${stats.visitors}` : null },
          { label: 'Sessions', value: loading ? '...' : stats.sessions.toLocaleString(), trend: stats.sessions > 0 ? `+${stats.sessions}` : null },
          { label: 'Page Views', value: loading ? '...' : stats.pageViews.toLocaleString(), trend: stats.pageViews > 0 ? `+${stats.pageViews}` : null },
          { label: 'New Users', value: loading ? '...' : stats.newUsers.toLocaleString(), trend: stats.newUsers > 0 ? `+${stats.newUsers}` : null },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mb-1">{stat.value}</p>
            {stat.trend ? (
              <p className={clsx("text-xs font-bold", stat.trend.startsWith('-') ? "text-red-500" : "text-emerald-500")}>{stat.trend}</p>
            ) : (
              <p className="text-xs font-bold text-gray-300">No data yet</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TRAFFIC OVER TIME */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Traffic (Visits & Sessions)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData.length > 0 ? trafficData : [{name: 'Loading', visits: 0, sessions: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
              Conv: {stats.visitors > 0 && stats.newUsers > 0 ? ((stats.newUsers / stats.visitors) * 100).toFixed(2) : '0'}%
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData.length > 0 ? funnelData : [{name: 'Loading', value: 1}]} isAnimationActive>
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
            {countryData && countryData.length > 0 ? (
              countryData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-2xl">🌍</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-semibold text-gray-900">{item.country}</p>
                      <p className="text-xs text-gray-500">{item.count} users</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#378ADD] h-2 rounded-full" style={{width: `${item.percent}%`}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-10 text-right">{item.percent}%</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No country data available yet.</div>
            )}
          </div>
        </div>

        {/* DEMOGRAPHICS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Device Split</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Desktop (Default)</span><span className="font-bold">{stats.visitors > 0 ? '100%' : '0%'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Mobile</span><span className="font-bold">0%</span></div>
            </div>
            <div className="w-full h-2 flex rounded-full overflow-hidden mt-3 bg-gray-100">
              {stats.visitors > 0 && <div className="bg-blue-500" style={{width: '100%'}}></div>}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Top Referrers</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Direct</span><span className="font-bold">{stats.visitors > 0 ? '100%' : '0%'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Google / Search</span><span className="font-bold">0%</span></div>
            </div>
            <div className="w-full h-2 flex rounded-full overflow-hidden mt-3 bg-gray-100">
              {stats.visitors > 0 && <div className="bg-emerald-500" style={{width: '100%'}}></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
