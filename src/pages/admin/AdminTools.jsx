import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminTools() {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tools');
      if (res.data.success) {
        setTools(res.data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      toast.error('Failed to load tools config. Run the database SQL script.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleToggle = async (id, field, currentValue) => {
    try {
      // Optimistic update
      setTools(tools.map(t => t.id === id ? { ...t, [field]: !currentValue } : t));
      
      const payload = {
        is_active: field === 'is_active' ? !currentValue : tools.find(t => t.id === id).is_active,
        requires_pro: field === 'requires_pro' ? !currentValue : tools.find(t => t.id === id).requires_pro,
        maintenance_mode: field === 'maintenance_mode' ? !currentValue : tools.find(t => t.id === id).maintenance_mode
      };
      
      await api.put(`/admin/tools/${id}`, payload);
      toast.success('Tool updated successfully');
    } catch (error) {
      // Revert on error
      fetchTools();
      toast.error('Failed to update tool');
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || tool.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(tools.map(t => t.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tools Control Center</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTools}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"}></iconify-icon> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></iconify-icon>
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:border-[#378ADD] focus:bg-white focus:ring-0 rounded-xl text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-50 border-transparent focus:border-[#378ADD] focus:bg-white focus:ring-0 rounded-xl text-sm font-medium py-2.5 px-4 cursor-pointer"
          >
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-gray-500">
            <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
            <p className="mt-2">Loading tools config...</p>
          </div>
        ) : filteredTools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden group">
            {tool.maintenance_mode && (
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">{tool.category || 'Tool'}</span>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {tool.name}
                  {tool.requires_pro && <iconify-icon icon="solar:crown-star-bold" class="text-amber-500 text-sm"></iconify-icon>}
                </h3>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggle(tool.id, 'is_active', tool.is_active)}
                  className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    tool.is_active ? "bg-emerald-500" : "bg-gray-200"
                  )}
                >
                  <span className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    tool.is_active ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Requires Pro Plan</span>
                <button 
                  onClick={() => handleToggle(tool.id, 'requires_pro', tool.requires_pro)}
                  className={clsx(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    tool.requires_pro ? "bg-purple-500" : "bg-gray-200"
                  )}
                >
                  <span className={clsx(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    tool.requires_pro ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Maintenance Mode</span>
                <button 
                  onClick={() => handleToggle(tool.id, 'maintenance_mode', tool.maintenance_mode)}
                  className={clsx(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    tool.maintenance_mode ? "bg-amber-500" : "bg-gray-200"
                  )}
                >
                  <span className={clsx(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    tool.maintenance_mode ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredTools.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500">No tools found.</div>
        )}
      </div>
    </div>
  );
}
