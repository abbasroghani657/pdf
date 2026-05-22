import React, { useState } from 'react';
import {
  MousePointer2, Highlighter, Underline, Strikethrough,
  MapPin, Type, Square, Circle, PenTool, Eraser, MessageSquare,
  Minus, ChevronDown
} from 'lucide-react';

const HIGHLIGHT_COLORS = [
  '#eab308', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#6b7280'
];

const TOOLS = [
  { id: 'select',        icon: MousePointer2, label: 'Select',        shortcut: 'Esc' },
  null,
  { id: 'highlight',     icon: Highlighter,   label: 'Highlight',     shortcut: 'H' },
  { id: 'underline',     icon: Underline,      label: 'Underline',     shortcut: 'U' },
  { id: 'strikethrough', icon: Strikethrough,  label: 'Strikethrough', shortcut: 'S' },
  { id: 'squiggly',      icon: Minus,          label: 'Squiggly',      shortcut: '' },
  null,
  { id: 'note',          icon: MapPin,         label: 'Sticky Note',   shortcut: 'N' },
  { id: 'text',          icon: Type,           label: 'Text Box',      shortcut: 'T' },
  { id: 'comment',       icon: MessageSquare,  label: 'Comment',       shortcut: 'C' },
  null,
  { id: 'shape_rect',    icon: Square,         label: 'Rectangle',     shortcut: '' },
  { id: 'shape_circle',  icon: Circle,         label: 'Circle',        shortcut: '' },
  null,
  { id: 'draw',          icon: PenTool,        label: 'Draw',          shortcut: 'D' },
  { id: 'eraser',        icon: Eraser,         label: 'Eraser',        shortcut: 'E' },
];

export default function Toolbar({
  activeTool, setActiveTool,
  toolColor, setToolColor,
  toolOpacity, setToolOpacity,
  isMobile = false
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (isMobile) {
    const mobileTools = TOOLS.filter(t => t && !['squiggly','shape_circle','eraser'].includes(t.id)).slice(0, 7);
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 px-3 py-2 flex items-center justify-around gap-1">
        {mobileTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(isActive ? 'select' : tool.id)}
              title={tool.label}
              className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-0.5 min-w-[44px] ${
                isActive ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">{tool.label.split(' ')[0]}</span>
            </button>
          );
        })}
        {/* Color dot */}
        <button
          onClick={() => setShowColorPicker(prev => !prev)}
          className="p-2.5 rounded-xl flex flex-col items-center gap-0.5 min-w-[44px] hover:bg-gray-50 relative"
        >
          <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: toolColor }} />
          <span className="text-[9px] font-bold uppercase text-gray-500">Color</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-1 z-10 shadow-sm">
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool, i) => {
          if (!tool) return <div key={`sep-${i}`} className="w-px h-5 bg-gray-200 mx-1.5" />;
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(isActive ? 'select' : tool.id)}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-inner ring-1 ring-indigo-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          );
        })}
      </div>

      {/* Color & Opacity Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Color Swatches */}
        <div className="flex items-center gap-1">
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setToolColor(c)}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border border-black/10 ${toolColor === c ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom hex input */}
          <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden flex items-center justify-center hover:border-indigo-400 transition-colors">
            <input
              type="color"
              value={toolColor}
              onChange={e => setToolColor(e.target.value)}
              className="opacity-0 absolute w-0 h-0"
            />
            <span className="text-[8px] text-gray-400 font-bold">+</span>
          </label>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Opacity Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Opacity</span>
          <input
            type="range"
            min="10"
            max="100"
            value={toolOpacity}
            onChange={e => setToolOpacity(Number(e.target.value))}
            className="w-20 h-1.5 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{toolOpacity}%</span>
        </div>
      </div>
    </div>
  );
}
