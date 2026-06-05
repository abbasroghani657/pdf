import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import adminApi from '../../utils/adminApi';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    newToday: 0,
    totalRevenue: '$0.00'
  });
  const [recentSignups, setRecentSignups] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topTools, setTopTools] = useState([]);
  const [trends, setTrends] = useState({ revenue: null, users: null, newToday: null, pro: null });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/dashboard-stats');
      if (res.data.success) {
        const s = res.data.stats;
        setStats(s);
        setRecentSignups(res.data.recentSignups);
        setRevenueData(res.data.revenueGraphData || []);
        setTopTools(res.data.topToolsData || []);

        // Compute real trend labels from data
        const newTodayTrend = s.newToday > 0 ? `+${s.newToday} today` : 'None today';
        const proRate = s.totalUsers > 0 ? ((s.proUsers / s.totalUsers) * 100).toFixed(0) : 0;
        const proTrend = `${proRate}% of users`;
        setTrends({
          revenue: s.totalRevenue === '$0.00' ? 'No sales yet' : 'All time',
          users: `Total registered`,
          newToday: newTodayTrend,
          pro: proTrend,
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button 
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: stats.totalRevenue, trend: trends.revenue, color: 'from-emerald-500 to-teal-400', icon: 'solar:wallet-money-bold' },
          { title: 'Total Users', value: stats.totalUsers, trend: trends.users, color: 'from-[#378ADD] to-indigo-500', icon: 'solar:users-group-rounded-bold' },
          { title: 'New Today', value: stats.newToday, trend: trends.newToday, color: 'from-amber-400 to-orange-400', icon: 'solar:user-plus-bold' },
          { title: 'Pro Subscribers', value: stats.proUsers, trend: trends.pro, color: 'from-purple-500 to-pink-500', icon: 'solar:crown-star-bold' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shrink-0`}>
              <iconify-icon icon={stat.icon} class="text-3xl"></iconify-icon>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </span>
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
            <h2 className="text-lg font-bold text-gray-900">Revenue</h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-gray-400">
              <iconify-icon icon="solar:wallet-money-linear" class="text-5xl"></iconify-icon>
              <p className="text-sm font-medium">No revenue data yet.</p>
              <p className="text-xs text-gray-400">Revenue will appear here after the first payment.</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#378ADD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                    formatter={(value) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#378ADD" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ALERTS & RECENT */}
        <div className="space-y-6">
          {/* ALERTS */}
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <iconify-icon icon="solar:shield-check-bold" class="text-2xl"></iconify-icon>
            </div>
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">
              System Secure
            </h2>
            <p className="text-xs text-emerald-600 font-medium">No alerts or actions required at this time.</p>
          </div>

          {/* RECENT SIGNUPS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Signups</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-400">Loading...</div>
              ) : recentSignups.length === 0 ? (
                <div className="text-center py-4 text-gray-400">No recent signups</div>
              ) : (
                recentSignups.map((user, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#378ADD] flex items-center justify-center font-bold text-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP TOOLS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Top Tools Today</h2>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center text-gray-400">Loading...</div>
        ) : topTools.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center gap-2 text-gray-400">
            <iconify-icon icon="solar:chart-2-linear" class="text-4xl"></iconify-icon>
            <p className="text-sm font-medium">No tool usage recorded yet.</p>
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTools} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
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
        )}
      </div>
    </div>
  );
}
