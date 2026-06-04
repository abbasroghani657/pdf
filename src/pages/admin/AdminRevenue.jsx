import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: '$0.00', proUsersCount: 0 });
  const [transactions, setTransactions] = useState([]);
  const [mrrData, setMrrData] = useState([]);
  const [planData, setPlanData] = useState([]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/revenue');
      if (res.data.success) {
        setStats(res.data.stats);
        setTransactions(res.data.transactions);
        setMrrData(res.data.mrrData || []);
        setPlanData(res.data.planData || []);
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const handleExportReport = () => {
    const headers = ['Date', 'User', 'Plan', 'Amount', 'Status'];
    const rows = transactions.map(tx => [
      new Date(tx.time).toLocaleDateString(),
      tx.user || '',
      tx.plan || '',
      tx.amount || '',
      tx.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdfmaster_revenue_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
        <div className="flex gap-3">
          <button 
            onClick={fetchRevenueData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <iconify-icon icon="solar:document-text-linear"></iconify-icon> Export Report
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'TODAY', value: loading ? '...' : stats.revenueToday || '$0.00', trend: '0%', color: 'text-gray-400' },
          { label: 'THIS MONTH', value: loading ? '...' : stats.revenueThisMonth || '$0.00', trend: 'Active', color: 'text-emerald-500' },
          { label: 'PRO SUBSCRIBERS', value: loading ? '...' : (stats.proUsersCount || 0).toString(), trend: 'Active', color: 'text-blue-500' },
          { label: 'TOTAL (ALL TIME)', value: loading ? '...' : stats.totalRevenue || '$0.00', trend: 'Growing', color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <iconify-icon icon="solar:wallet-money-bold" class="text-6xl text-[#378ADD]"></iconify-icon>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
            <p className="text-3xl font-extrabold text-gray-900 mb-2">{stat.value}</p>
            <p className={`text-sm font-semibold ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR GROWTH */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">MRR Growth</h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
            </div>
          ) : mrrData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-gray-400">
              <iconify-icon icon="solar:chart-2-linear" class="text-5xl opacity-50"></iconify-icon>
              <p className="text-sm font-semibold">No revenue data yet</p>
              <p className="text-xs text-gray-400">MRR chart will appear after the first payment is recorded.</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* REVENUE BREAKDOWN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Breakdown</h2>
          <div className="h-[200px] w-full mb-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData.length > 0 ? planData : [{name: 'No data', value: 1, color: '#e2e8f0'}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalRevenue}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            {planData.map((plan, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor: plan.color}}></span>
                  <span className="text-sm font-semibold text-gray-700">{plan.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">${plan.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Real Transactions</h2>
          <span className="text-xs text-gray-400">Showing last {transactions.length} transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-3 px-6 font-semibold">Date</th>
                <th className="py-3 px-6 font-semibold">User</th>
                <th className="py-3 px-6 font-semibold">Plan</th>
                <th className="py-3 px-6 font-semibold">Amount</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
                    <p className="mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : transactions.map((tx, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-4 px-6 text-gray-500">{new Date(tx.time).toLocaleDateString()}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{tx.user}</td>
                  <td className="py-4 px-6 text-gray-600">{tx.plan}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{tx.amount}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${tx.statusCls}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => navigator.clipboard.writeText(tx.user).then(() => toast.success('Email copied!'))}
                      className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
                    >Copy Email</button>
                  </td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
