import React from 'react';
import { Bold, Italic } from 'lucide-react';

const COLOR_SWATCHES = ['#eab308','#f97316','#ef4444','#22c55e','#3b82f6','#a855f7','#6b7280','#1e293b'];

const TYPE_LABELS = {
  highlight: 'Highlight', underline: 'Underline', strikethrough: 'Strikethrough',
  squiggly: 'Squiggly', note: 'Sticky Note', text: 'Text Box',
  comment: 'Comment', shape_rect: 'Rectangle', shape_circle: 'Circle', draw: 'Drawing',
};

export default function PropertiesPanel({ annotation, onUpdate, isMobile = false }) {
  if (!annotation) return null;

  const isText = annotation.type === 'text';
  const hasOpacity = ['highlight','shape_rect','shape_circle','squiggly'].includes(annotation.type);

  return (
    <div className={`bg-white ${isMobile ? 'p-4' : 'p-3'} space-y-3`}>
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: annotation.color || '#eab308' }} />
        {TYPE_LABELS[annotation.type] || annotation.type} Properties
      </h3>

      {/* Color */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Stroke Color</label>
        <div className="flex items-center flex-wrap gap-1.5">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              className={`w-5 h-5 rounded-full transition-transform border border-black/10 hover:scale-110 ${annotation.color === c ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center hover:border-indigo-400 transition-colors overflow-hidden relative">
            <input
              type="color"
              value={annotation.color || '#eab308'}
              onChange={e => onUpdate({ color: e.target.value })}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
            <span className="text-[8px] text-gray-400 font-bold pointer-events-none">+</span>
          </label>
        </div>
      </div>

      {/* TEXT BOX SPECIFIC: Font Size, Font Color, Bold, Italic */}
      {isText && (
        <>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Font Color</label>
            <div className="flex items-center flex-wrap gap-1.5">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdate({ fontColor: c })}
                  className={`w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform ${(annotation.fontColor||'#1e293b') === c ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center hover:border-indigo-400 transition-colors overflow-hidden relative">
                <input
                  type="color"
                  value={annotation.fontColor || '#1e293b'}
                  onChange={e => onUpdate({ fontColor: e.target.value })}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
                <span className="text-[8px] text-gray-400 font-bold pointer-events-none">+</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Font Size: <span className="text-indigo-600">{annotation.fontSize || 13}px</span>
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={annotation.fontSize || 13}
                onChange={e => onUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex gap-1 shrink-0 mt-4">
              <button
                onClick={() => onUpdate({ fontBold: !annotation.fontBold })}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${annotation.fontBold ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >B</button>
              <button
                onClick={() => onUpdate({ fontItalic: !annotation.fontItalic })}
                className={`p-1.5 rounded-lg border text-xs italic transition-colors ${annotation.fontItalic ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >I</button>
            </div>
          </div>
        </>
      )}

      {/* Opacity slider */}
      {hasOpacity && (
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">
            Opacity: <span className="text-indigo-600">{annotation.opacity || 50}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={annotation.opacity || 50}
            onChange={e => onUpdate({ opacity: parseInt(e.target.value) })}
            className="w-full h-1.5 accent-indigo-500 cursor-pointer"
          />
        </div>
      )}

      {/* Content textarea */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">
          {['note','text','comment'].includes(annotation.type) ? 'Content' : 'Note'}
        </label>
        <textarea
          value={annotation.content || ''}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder="Add a note..."
          rows={3}
          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-gray-50 hover:bg-white transition-colors"
        />
      </div>

      {/* Metadata */}
      <div className="pt-2 border-t border-gray-100 space-y-0.5 text-[10px] text-gray-400">
        <p>Author: <span className="text-gray-600">{annotation.author || '—'}</span></p>
        <p>Date: <span className="text-gray-600">{annotation.date ? new Date(annotation.date).toLocaleString() : '—'}</span></p>
        <p>Page: <span className="text-gray-600">{annotation.page || 1}</span></p>
      </div>
    </div>
  );
}
