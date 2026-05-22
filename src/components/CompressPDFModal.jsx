import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function calcReduction(original, compressed) {
  if (!original || !compressed) return 0;
  return Math.max(0, Math.round(((original - compressed) / original) * 100));
}

const API_URL = http://:3005\;

// ─── Compression levels ───────────────────────────────────────────────────────
const LEVELS = [
  {
    id: 'extreme',
    label: 'Extreme Compression',
    desc: 'Less quality, high compression',
    icon: 'solar:battery-charge-linear',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    expectedReduction: '50–80%',
  },
  {
    id: 'recommended',
    label: 'Recommended Compression',
    desc: 'Good quality, good compression',
    icon: 'solar:star-fall-linear',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    expectedReduction: '20–50%',
  },
  {
    id: 'less',
    label: 'Less compression',
    desc: 'High quality, less compression',
    icon: 'solar:shield-check-linear',
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    expectedReduction: '5–20%',
  }
];

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function CompressPDFModal({ isOpen, onClose }) {
  const [state, setState] = useState('idle'); // idle | selected | processing | done | error
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('recommended');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null); // { bytes, originalSize, compressedSize }
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setState('idle');
      setFile(null);
      setLevel('recommended');
      setProgress(0);
      setResult(null);
      setErrorMsg('');
      setIsDragging(false);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isOpen]);

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file.');
      setState('error');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setErrorMsg('File exceeds 100 MB free limit. Upgrade to Pro for 1 GB.');
      setState('error');
      return;
    }
    setFile(f);
    setState('selected');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleCompress = async () => {
    if (!file) return;
    setState('processing');
    setProgress(0);

    // Animate progress while backend works
    let p = 0;
    progressRef.current = setInterval(() => {
      const inc = p < 40 ? 2 : p < 75 ? 0.8 : 0.3;
      p = Math.min(p + inc, 92);
      setProgress(p);
      setProgressLabel(
        p < 20 ? 'Uploading to server...' :
        p < 45 ? 'Ghostscript analyzing structure...' :
        p < 70 ? 'Optimizing image streams...' :
        p < 88 ? 'Compressing fonts & metadata...' :
        'Finalizing...'
      );
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Compress PDF');
      formData.append('level', level);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `Server error (${response.status})`);
      }

      const blob = await response.blob();
      const compressedBytes = new Uint8Array(await blob.arrayBuffer());

      const originalSize  = parseInt(response.headers.get('X-Original-Size'))   || file.size;
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size')) || compressedBytes.byteLength;

      clearInterval(progressRef.current);
      setProgress(100);
      setProgressLabel('Done!');

      setTimeout(() => {
        setResult({ bytes: compressedBytes, originalSize, compressedSize });
        setState('done');
      }, 300);
    } catch (err) {
      clearInterval(progressRef.current);
      console.error('Compression error:', err);
      setErrorMsg(err.message || 'Could not compress this PDF. It may be encrypted or corrupted.');
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.bytes], { type: 'application/pdf' });
    const safeName = file?.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'document.pdf';
    const baseName = safeName.replace(/\.pdf$/i, '');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reduction = result ? calcReduction(result.originalSize, result.compressedSize) : 0;
  const activeLevel = LEVELS.find(l => l.id === level);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-enter bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
              <iconify-icon icon="solar:minimize-square-linear" class="text-xl" stroke-width="1.5"></iconify-icon>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">Compress PDF</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real compression · Free · Secure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <iconify-icon icon="solar:close-linear" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* ── IDLE / DRAG STATE ── */}
          {(state === 'idle') && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={clsx(
                  'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group',
                  isDragging ? 'drag-over' : 'border-gray-200 hover:border-green-400/60 hover:bg-green-50/30'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
                  isDragging ? 'bg-green-100 text-green-600 scale-110' : 'bg-gray-100 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600'
                )}>
                  <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                </p>
                <p className="text-xs text-gray-400 mb-5">or click to browse — PDF only, up to 100 MB</p>
                <button
                  type="button"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Choose PDF
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <iconify-icon icon="solar:shield-check-linear" class="text-base"></iconify-icon>
                  256-bit SSL
                </span>
                <span className="flex items-center gap-1.5">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-base"></iconify-icon>
                  Auto-deleted in 2h
                </span>
                <span className="flex items-center gap-1.5">
                  <iconify-icon icon="solar:eye-closed-linear" class="text-base"></iconify-icon>
                  Private
                </span>
              </div>
            </>
          )}

          {/* ── SELECTED STATE ── */}
          {state === 'selected' && file && (
            <>
              {/* File info */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-10 h-10 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)} · PDF</p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-lg"></iconify-icon>
                </button>
              </div>

              {/* Compression level picker */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2.5">Compression Level</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={clsx(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 text-center',
                        level === l.id
                          ? `border-current ${l.bg} ${l.color}`
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <iconify-icon icon={l.icon} class="text-xl"></iconify-icon>
                      <span className="text-xs font-bold">{l.label}</span>
                      <span className="text-[10px] leading-tight opacity-70">{l.expectedReduction}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  <span className={activeLevel?.color + ' font-semibold'}>{activeLevel?.label}:</span> {activeLevel?.desc}
                </p>
              </div>

              {/* Compress button */}
              <button
                onClick={handleCompress}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:minimize-square-bold" class="text-lg"></iconify-icon>
                Compress PDF
              </button>
            </>
          )}

          {/* ── PROCESSING STATE ── */}
          {state === 'processing' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{file?.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file?.size || 0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="pulse-dot w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                    Compressing...
                  </span>
                  <span className="text-green-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full progress-bar-animated transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">{progressLabel}</p>
              </div>
            </div>
          )}

          {/* ── DONE STATE ── */}
          {state === 'done' && result && (
            <div className="space-y-4">
              {/* Success header */}
              <div className="text-center">
                <div className="success-icon w-16 h-16 mx-auto rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mb-3">
                  <iconify-icon icon="solar:check-circle-bold" class="text-3xl text-green-500"></iconify-icon>
                </div>
                <p className="font-semibold text-gray-900">Compression Complete!</p>
                <p className="text-xs text-gray-500 mt-1">Your PDF has been successfully compressed.</p>
              </div>

              {/* Stats card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Original</p>
                    <p className="text-sm font-bold text-gray-700">{formatFileSize(result.originalSize)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mb-1">
                      <iconify-icon icon="solar:arrow-down-bold" class="text-white text-sm"></iconify-icon>
                    </div>
                    <p className="text-base font-extrabold text-green-600">{reduction}%</p>
                    <p className="text-[10px] text-green-600 font-semibold">smaller</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Compressed</p>
                    <p className="text-sm font-bold text-green-700">{formatFileSize(result.compressedSize)}</p>
                  </div>
                </div>

                {/* Savings bar */}
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${100 - reduction}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-center">
                    Saved {formatFileSize(result.originalSize - result.compressedSize)}
                  </p>
                </div>
              </div>

              {reduction < 5 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mt-4">
                  <iconify-icon icon="solar:info-circle-bold" class="text-amber-500 text-lg shrink-0 mt-0.5"></iconify-icon>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Is PDF mein compress karne layak content kam hai (jaise text-only PDF). Images hoti toh size zyada kam hota.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-lg"></iconify-icon>
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-colors"
                >
                  Compress another
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-400">
                File will be automatically deleted from our servers in 2 hours
              </p>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {state === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                <iconify-icon icon="solar:close-circle-bold" class="text-3xl text-red-500"></iconify-icon>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Something went wrong</p>
                <p className="text-xs text-gray-500 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold transition-all"
                >
                  Try again
                </button>
                <button className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-colors">
                  Go Pro (1 GB)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />
    </div>
  );
}
