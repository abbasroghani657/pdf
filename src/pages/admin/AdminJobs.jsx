import React from 'react';
import { clsx } from 'clsx';

const LIVE_JOBS = [
  { id: 'JOB-001', tool: 'Compress PDF', user: 'sara@hot.com', size: '8MB', progress: 60, status: 'Processing' },
  { id: 'JOB-002', tool: 'OCR PDF', user: 'ali@gm.com', size: '5MB', progress: 30, status: 'Processing' },
  { id: 'JOB-003', tool: 'Chat PDF', user: 'john@out.com', size: '2MB', progress: 0, status: 'Queued' },
  { id: 'JOB-004', tool: 'Translate', user: 'raza@gm.com', size: '3MB', progress: 0, status: 'Queued' },
];

const COMPLETED_JOBS = [
  { tool: 'Compress PDF', user: 'ali@gm.com', time: '2:15 PM', size: '5MB', result: '-67% size', resultCls: 'text-emerald-600' },
  { tool: 'Sign PDF', user: 'sara@hot.com', time: '2:10 PM', size: '2MB', result: 'Success', resultCls: 'text-emerald-600' },
  { tool: 'OCR PDF', user: 'anon_user', time: '2:05 PM', size: '8MB', result: 'Failed', resultCls: 'text-red-500' },
  { tool: 'Chat PDF', user: 'john@out.com', time: '1:55 PM', size: '3MB', result: 'Success', resultCls: 'text-emerald-600' },
];

export default function AdminJobs() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">PDF Jobs Monitor</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Auto-refresh: ON
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: '5', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Queued', value: '12', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Done Today', value: '8,450', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Errors', value: '3', color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 border border-white shadow-sm ${stat.bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LIVE QUEUE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <iconify-icon icon="solar:history-line-duotone" class="text-[#378ADD]"></iconify-icon>
            Live Queue
          </h2>
          <div className="space-y-4">
            {LIVE_JOBS.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{job.tool} <span className="text-gray-400 font-normal ml-2">#{job.id}</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.user} • {job.size}</p>
                  </div>
                  <button className="text-xs font-semibold text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    Cancel
                  </button>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                    <span>{job.status}</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${job.progress > 0 ? 'bg-[#378ADD]' : 'bg-gray-300'}`} 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* SERVICE STATUS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            {[
              { name: 'Python Service', status: 'online' },
              { name: 'Gotenberg', status: 'online' },
              { name: 'Gemini API', status: 'online' },
              { name: 'Groq API', status: 'warning' },
            ].map((service, i) => (
              <div key={i} className="flex-1 min-w-[120px] bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2 truncate">{service.name}</p>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={clsx("w-2 h-2 rounded-full", service.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500')}></span>
                  {service.status === 'online' ? 'Operational' : 'Slow'}
                </div>
              </div>
            ))}
          </div>

          {/* ERROR LOGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500"></iconify-icon>
              Recent Errors
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-semibold text-red-900">OCR Failed</p>
                <p className="text-xs text-red-700 mt-0.5">ali@gm.com • "Tesseract timeout"</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="text-xs font-bold bg-white text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">View Details</button>
                  <button className="text-xs font-bold text-gray-500 hover:text-gray-700">Retry</button>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-semibold text-red-900">Translate Error</p>
                <p className="text-xs text-red-700 mt-0.5">anon_user • "Gemini API quota exceeded"</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="text-xs font-bold bg-white text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Switch to Groq</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT COMPLETED */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Completed Jobs</h2>
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
              {COMPLETED_JOBS.map((job, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 px-6 font-semibold text-gray-900">{job.tool}</td>
                  <td className="py-3 px-6 text-gray-500">{job.user}</td>
                  <td className="py-3 px-6 text-gray-400 text-xs">{job.time}</td>
                  <td className="py-3 px-6 text-gray-600">{job.size}</td>
                  <td className={`py-3 px-6 text-right font-bold ${job.resultCls}`}>{job.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
