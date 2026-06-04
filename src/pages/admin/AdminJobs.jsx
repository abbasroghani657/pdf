import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminJobs() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    queued: 0,
    doneToday: 0,
    errors: 0
  });
  const [serviceHealth, setServiceHealth] = useState({
    python: null, gotenberg: null, database: null
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const [jobsRes, healthRes] = await Promise.all([
        api.get('/admin/jobs'),
        api.get('/admin/health').catch(() => ({ data: {} }))
      ]);
      if (jobsRes.data.success) {
        setJobs(jobsRes.data.jobs);
        setStats(jobsRes.data.stats);
      }
      if (healthRes.data) {
        setServiceHealth({
          python: healthRes.data.python,
          gotenberg: healthRes.data.gotenberg,
          database: healthRes.data.database
        });
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">PDF Jobs Monitor</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Auto-refresh: ON
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: stats.activeJobs, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Queued', value: stats.queued, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Done Today', value: stats.doneToday, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Errors', value: stats.errors, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 border border-white shadow-sm ${stat.bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LIVE QUEUE (Empty usually since it's sync) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <iconify-icon icon="solar:history-line-duotone" class="text-[#378ADD]"></iconify-icon>
            Live Queue
          </h2>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500 text-sm">
              No active jobs in the queue. Jobs are processed synchronously.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* SERVICE STATUS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            {[
              { name: 'Python Service', key: 'python' },
              { name: 'Gotenberg', key: 'gotenberg' },
              { name: 'Database', key: 'database' },
            ].map((service, i) => {
              const isOnline = service.key === null ? true : serviceHealth[service.key];
              const isUnknown = service.key !== null && serviceHealth[service.key] === null;
              return (
                <div key={i} className="flex-1 min-w-[120px] bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2 truncate">{service.name}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={clsx("w-2 h-2 rounded-full", isUnknown ? 'bg-gray-300 animate-pulse' : isOnline ? 'bg-emerald-500' : 'bg-red-500')}></span>
                    {isUnknown ? 'Checking...' : isOnline ? 'Operational' : 'Offline'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ERROR LOGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500"></iconify-icon>
              Recent Errors
            </h2>
            <div className="space-y-3">
              {jobs.filter(j => j.status === 'error').slice(0, 3).map((job, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm font-semibold text-red-900">{job.tool_name} Failed</p>
                  <p className="text-xs text-red-700 mt-0.5">{job.user?.email || 'anon'} • at {new Date(job.created_at).toLocaleTimeString()}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => toast('Detailed logs view coming soon', { icon: '🚧' })} className="text-xs font-bold bg-white text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">View Details</button>
                  </div>
                </div>
              ))}
              {jobs.filter(j => j.status === 'error').length === 0 && (
                <p className="text-sm text-gray-500">No recent errors recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT COMPLETED */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Processed Jobs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-3 px-6 font-semibold">Tool</th>
                <th className="py-3 px-6 font-semibold">User</th>
                <th className="py-3 px-6 font-semibold">Time</th>
                <th className="py-3 px-6 font-semibold">Size</th>
                <th className="py-3 px-6 font-semibold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
                    <p className="mt-2">Loading jobs...</p>
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-6 font-semibold text-gray-900">{job.tool_name}</td>
                  <td className="py-3 px-6 text-gray-500">{job.user?.email || 'Anonymous'}</td>
                  <td className="py-3 px-6 text-gray-400 text-xs">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {job.file_size ? `${(job.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </td>
                  <td className={clsx(
                    "py-3 px-6 text-right font-bold",
                    job.status === 'success' ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {job.status === 'success' ? 'Success' : 'Failed'}
                  </td>
                </tr>
              ))}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">No jobs processed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
