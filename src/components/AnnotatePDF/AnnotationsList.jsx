import React from 'react';
import { Search, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const TYPE_LABELS = {
  highlight:     { label: 'Highlight',     emoji: '🖍️' },
  underline:     { label: 'Underline',     emoji: 'U̲' },
  strikethrough: { label: 'Strikethrough', emoji: 'S̶' },
  squiggly:      { label: 'Squiggly',      emoji: '〰️' },
  note:          { label: 'Sticky Note',   emoji: '📌' },
  text:          { label: 'Text Box',      emoji: 'T' },
  comment:       { label: 'Comment',       emoji: '💬' },
  shape_rect:    { label: 'Rectangle',     emoji: '▭' },
  shape_circle:  { label: 'Circle',        emoji: '○' },
  draw:          { label: 'Drawing',       emoji: '✏️' },
};

export default function AnnotationsList({ annotations, selectedId, onSelect, onDelete, isMobile = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = annotations.filter(ann => {
    const matchSearch = (ann.content || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (TYPE_LABELS[ann.type]?.label || ann.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || ann.type === filterType;
    return matchSearch && matchType;
  });

  // Group by page
  const pages = [...new Set(filtered.map(a => a.page || 1))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full">
      {/* Header / Search */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-900">Annotations</h2>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{annotations.length}</span>
        </div>
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABELS).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-3xl mb-2">📋</div>
            {annotations.length === 0 ? 'No annotations yet.\nUse tools above to start.' : 'No results found.'}
          </div>
        ) : (
          pages.map(page => (
            <div key={page} className="mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">📄 Page {page}</p>
              {filtered.filter(a => (a.page || 1) === page).map(ann => {
                const meta = TYPE_LABELS[ann.type] || { label: ann.type, emoji: '●' };
                const isSelected = selectedId === ann.id;
                return (
                  <div
                    key={ann.id}
                    onClick={() => onSelect(ann.id)}
                    className={`group flex items-start gap-2 p-2.5 rounded-xl mb-1 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 ring-1 ring-indigo-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 flex items-center justify-center">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: (ann.color || '#eab308') + '22', color: ann.color || '#eab308' }}
                      >
                        {meta.emoji}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{meta.label}</p>
                      <p className="text-[11px] text-gray-500 truncate">{ann.content || '—'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {ann.author} · {ann.date ? new Date(ann.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(ann.id); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
