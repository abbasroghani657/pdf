import React, { useState } from 'react';
import { clsx } from 'clsx';

const TOOLS_LIST = [
  { name: 'Compress PDF', slug: 'compress-pdf', active: true, freeLimit: '10MB/5/day', uses: 1247, revenue: '$0' },
  { name: 'Chat with PDF', slug: 'chat-with-pdf', active: true, freeLimit: 'Pro Only', uses: 634, revenue: '$892' },
  { name: 'OCR PDF', slug: 'ocr-pdf', active: true, freeLimit: '3/day Free', uses: 521, revenue: '$340' },
  { name: 'Translate PDF', slug: 'translate-pdf', active: true, freeLimit: '3/day Free', uses: 289, revenue: '$210' },
  { name: 'Summarize PDF', slug: 'summarize-pdf', active: false, freeLimit: '—', uses: 0, revenue: '$0', maint: true },
  { name: 'Watermark PDF', slug: 'watermark-pdf', active: true, freeLimit: '5/day Free', uses: 445, revenue: '$180' },
];

export default function AdminTools() {
  const [tools, setTools] = useState(TOOLS_LIST);

  const toggleTool = (index) => {
    const newTools = [...tools];
    newTools[index].active = !newTools[index].active;
    if (newTools[index].active) newTools[index].maint = false;
    setTools(newTools);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools Management</h1>
          <p className="text-sm text-gray-500 mt-1">Enable, disable, and configure limits for all 37+ tools.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <input 
            type="text" 
            placeholder="Search tools..." 
            className="flex-1 max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#378ADD] focus:border-[#378ADD]"
          />
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Filter by Category
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-4 px-6 font-semibold">Tool</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Free Limit</th>
                <th className="py-4 px-6 font-semibold">Uses Today</th>
                <th className="py-4 px-6 font-semibold">Revenue Effect</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tools.map((tool, i) => (
                <tr key={i} className={clsx("transition-colors", tool.active ? "hover:bg-gray-50/50" : "bg-red-50/20")}>
                  <td className="py-4 px-6">
                    <p className="font-bold text-gray-900">{tool.name}</p>
                    <p className="text-xs text-gray-400">/{tool.slug}</p>
                    {tool.maint && <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Maintenance Mode</span>}
                  </td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => toggleTool(i)}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        tool.active ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    >
                      <span className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        tool.active ? "translate-x-6" : "translate-x-1"
                      )}/>
                    </button>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-600">{tool.freeLimit}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{tool.uses.toLocaleString()}</td>
                  <td className="py-4 px-6 font-bold text-emerald-600">{tool.revenue}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1.5 bg-blue-50 text-[#378ADD] font-semibold text-xs rounded-lg hover:bg-blue-100 transition-colors">Edit Limits</button>
                      <button className="px-3 py-1.5 bg-gray-50 text-gray-600 font-semibold text-xs rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">Stats</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
