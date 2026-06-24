import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import UpgradeModal from '../components/UpgradeModal';
import { processWithQueue } from '../utils/queueApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FLATTEN_MODES = [
  {
    id: 'forms',
    label: 'Option A: Form Fields Only',
    desc: 'Locks fillable forms (text boxes, checkboxes) permanently.',
    icon: 'solar:document-text-linear',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    activeBorder: 'border-blue-500',
  },
  {
    id: 'annotations',
    label: 'Option B: Annotations & Comments',
    desc: 'Burns highlights, comments, and drawings into the document.',
    icon: 'solar:pen-linear',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    activeBorder: 'border-amber-500',
  },
  {
    id: 'signatures',
    label: 'Option C: Signatures Only',
    desc: 'Stamps digital signatures permanently so they cannot be edited.',
    icon: 'solar:pen-new-round-linear',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    activeBorder: 'border-emerald-500',
  },
  {
    id: 'all',
    label: 'Option D: Fully Flatten PDF',
    desc: 'Maximum security. Flattens forms, signatures, annotations, and layers.',
    icon: 'solar:shield-check-bold',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    activeBorder: 'border-purple-500',
    tag: 'Recommended',
    tagCls: 'bg-purple-100 text-purple-700',
  },
];

export default function FlattenPDFPage({ lang = 'en', ui, toolData }) {
  const { isPro } = useAuth();
  const [state, setState] = useState('idle');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'flatten',
    { mode },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setMode(s?.mode || 'all');
      setState('selected');
    },
    state === 'selected' || state === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg((ui?.tools_common?.invalid_pdf || 'Please upload a valid PDF file.'));
      setState('error');
      return;
    }
    if (f.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(f);
    setState('selected');
    setErrorMsg('');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    setState('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Flatten PDF');
      formData.append('mode', mode);

      const response = await processWithQueue(API_URL, formData, null, true);

      const data = response;
      
      if (!data.base64) {
        throw new Error('Received invalid data from server.');
      }

      // Convert base64 to Uint8Array
      const binaryString = window.atob(data.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const fields = parseInt(data.fields) || 0;
      const annots = parseInt(data.annots) || 0;
      const originalSize = file.size;
      const newSize = bytes.length;

      const baseName = file.name.replace(/\.pdf$/i, '');
      
      const fileObj = { 
        bytes, 
        fields,
        annots,
        originalSize,
        newSize,
        filename: `${baseName}_flattened.pdf`, 
        mime: 'application/pdf' 
      };
      
      setResult(fileObj);
      setState('done');

      // Auto-download
      const dlBlob = new Blob([fileObj.bytes], { type: fileObj.mime });
      const dlUrl = URL.createObjectURL(dlBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = fileObj.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
      toast.success('Flattened PDF downloaded!');
    } catch (err) {
      setErrorMsg(err.message || 'Flattening failed. Please try again.');
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.bytes], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Flattened PDF downloaded!');
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setErrorMsg('');
    clearSession();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-purple-50 text-purple-600">
          <iconify-icon icon="solar:layers-minimalistic-bold-duotone" class="text-3xl" stroke-width="1.5"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{toolData?.title || 'Flatten PDF'}</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm">
          Make interactive elements permanent. Lock forms, stamp signatures, and embed annotations directly into your document to prevent unauthorized edits.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8 space-y-6">

          {/* ── IDLE ── */}
          {state === 'idle' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={clsx(
                  'relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden',
                  isDragging ? 'drag-over border-purple-500 bg-purple-50/50' : 'border-purple-200 hover:border-purple-500/50 hover:bg-purple-50/30 bg-purple-50/10'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                  isDragging ? 'bg-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30' : 'bg-white text-purple-600 group-hover:scale-110 group-hover:shadow-md'
                )}>
                  <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {isDragging ? 'Drop your PDF' : 'Drag & drop your PDF'}
                </p>
                <p className="text-sm text-gray-500 mb-6">PDF only · up to 20 MB for free users</p>
                <button type="button" className="bg-purple-600 text-white hover:bg-purple-700 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5 relative z-0 pointer-events-none">
                  Choose PDF File
                </button>
              </div>

              {/* Pro Tip */}
              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <iconify-icon icon="solar:danger-circle-bold" class="text-2xl"></iconify-icon>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">⚠️ Pro Tip: Flattening is irreversible!</p>
                  <p className="text-sm text-amber-700">Once you flatten a document, form fields and signatures cannot be recovered. Always keep a backup of your original file before proceeding.</p>
                </div>
              </div>
            </>
          )}

          {/* ── SELECTED ── */}
          {state === 'selected' && file && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-4 p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
                <button onClick={handleReset} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">Select Flatten Level</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FLATTEN_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={clsx(
                        'flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden',
                        mode === m.id ? `${m.bg} ${m.activeBorder} shadow-sm ring-1 ring-purple-500/10` : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', mode === m.id ? m.bg : 'bg-gray-100')}>
                        <iconify-icon icon={m.icon} class={clsx('text-xl', mode === m.id ? m.color : 'text-gray-400')}></iconify-icon>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={clsx('text-sm font-bold', mode === m.id ? 'text-gray-900' : 'text-gray-700')}>{m.label}</span>
                          {m.tag && <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', m.tagCls)}>{m.tag}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProcess}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5"
              >
                Flatten PDF Now
              </button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {state === 'processing' && (
            <div className="text-center py-12 animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <svg className="animate-spin w-full h-full text-gray-100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"></circle>
                </svg>
                <svg className="absolute inset-0 w-full h-full text-purple-600 rotate-[-90deg]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeDasharray="283" strokeDashoffset="50" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                  <iconify-icon icon="solar:layers-minimalistic-bold-duotone" class="text-3xl animate-pulse"></iconify-icon>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Flattening document...</p>
              <p className="text-sm text-gray-500">Locking interactive elements permanently.</p>
            </div>
          )}

          {/* ── DONE ── */}
          {state === 'done' && result && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5">
                  <iconify-icon icon="solar:check-circle-bold" class="text-4xl text-green-500"></iconify-icon>
                </div>
                <p className="text-2xl font-bold text-gray-900">Successfully Flattened!</p>
                <p className="text-sm text-gray-500 mt-2">Your PDF is now permanently locked.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Forms Locked</p>
                    <p className="text-lg font-bold text-gray-900">{result.fields}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Annots Locked</p>
                    <p className="text-lg font-bold text-gray-900">{result.annots}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Original Size</p>
                    <p className="text-lg font-bold text-gray-900">{formatFileSize(result.originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">New Size</p>
                    <p className="text-lg font-bold text-purple-600">{formatFileSize(result.newSize)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all flex items-center justify-center gap-2.5 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                  Download Flattened PDF
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-base font-semibold transition-all"
                >
                  Flatten Another File
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {state === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center shadow-sm">
                <iconify-icon icon="solar:close-circle-bold" class="text-5xl text-red-500"></iconify-icon>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Flattening Failed</p>
                <p className="text-sm text-gray-500 mt-2">{errorMsg}</p>
              </div>
              <button onClick={handleReset} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg">
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
      
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Flatten PDF" 
        limitMessage="Files over 10MB require a Pro account for flattening. Upgrade to Pro for unlimited access."
      />
    </div>
  );
}
