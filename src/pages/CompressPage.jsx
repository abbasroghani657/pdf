import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import UpgradeModal from '../components/UpgradeModal';
import { processWithQueue } from '../utils/queueApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

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

// ─── Compression levels ───────────────────────────────────────────────────────
const LEVELS = [
  {
    id: 'extreme',
    label: 'Extreme Compression',
    desc: 'Less quality, high compression',
    icon: 'solar:battery-charge-linear',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    activeBg: 'bg-red-600',
    expectedReduction: '50–80%',
  },
  {
    id: 'recommended',
    label: 'Recommended Compression',
    desc: 'Good quality, good compression',
    icon: 'solar:star-fall-linear',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    activeBg: 'bg-green-500',
    expectedReduction: '20–50%',
  },
  {
    id: 'less',
    label: 'Less compression',
    desc: 'High quality, less compression',
    icon: 'solar:shield-check-linear',
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    activeBg: 'bg-blue-500',
    expectedReduction: '5–20%',
  }
];

export default function CompressPage() {
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('idle'); // idle | selected | processing | done | error
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('recommended');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null); // { bytes, originalSize, compressedSize }
  const [errorMsg, setErrorMsg] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'compress',
    { level },
    file,
    ({ state, bytes, fileName, fileSize }) => {
      // Restore file from bytes
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const restoredFile = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() });
      setFile(restoredFile);
      setLevel(state?.level || 'recommended');
      setState('selected');
    },
    state === 'selected' || state === 'done'
  );
  // ────────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file.');
      setState('error');
      return;
    }
    const maxSize = isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024;
    if (f.size > maxSize) {
      setIsUpgradeOpen(true);
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

    let p = 0;
    progressRef.current = setInterval(() => {
      const inc = p < 40 ? 1.5 : p < 75 ? 0.8 : 0.2;
      p = Math.min(p + inc, 95);
      setProgress(p);
      setProgressLabel(
        p < 20 ? 'Uploading to server...' :
        p < 45 ? 'Ghostscript analyzing structure...' :
        p < 70 ? 'Optimizing image streams...' :
        p < 90 ? 'Compressing fonts & metadata...' :
        'Finalizing download...'
      );
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Compress PDF');
      formData.append('level', level);

      const response = await processWithQueue('/api/process', formData, (status) => {
        if (status.type === 'queued') {
           setQueuePosition(status.position);
        } else if (status.type === 'processing') {
           setQueuePosition(null);
        }
      });

      const blob = await response.blob();
      const compressedBytes = new Uint8Array(await blob.arrayBuffer());

      // Get size info from headers
      const originalSize = parseInt(response.headers.get('X-Original-Size')) || file.size;
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size')) || compressedBytes.byteLength;

      clearInterval(progressRef.current);
      setProgress(100);
      setProgressLabel('Done!');

      setTimeout(() => {
        setResult({
          bytes: compressedBytes,
          originalSize,
          compressedSize,
        });
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
    const safeOriginalName = file?.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'document.pdf';
    const baseName = safeOriginalName.replace(/\.pdf$/i, '');
    const filename = `${baseName}_compressed.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Compressed PDF downloaded!');
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setProgress(0);
    setErrorMsg('');
    setQueuePosition(null);
    clearSession(); // Clear saved session on reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reduction = result ? calcReduction(result.originalSize, result.compressedSize) : 0;
  const activeLevel = LEVELS.find(l => l.id === level);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-green-50 text-green-600">
          <iconify-icon icon="solar:minimize-square-linear" class="text-3xl" stroke-width="1.5"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">Reduce file size while optimizing for maximal PDF quality. Fast, free, and secure.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8 space-y-6">

          {/* ── IDLE / DRAG STATE ── */}
          {(state === 'idle') && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={clsx(
                  'relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden',
                  isDragging ? 'drag-over border-green-500 bg-green-50/50' : 'border-green-200 hover:border-green-500/50 hover:bg-green-50/30 bg-green-50/10'
                )}
              >
                {/* Absolute overlay input for bulletproof file selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  title=""
                />
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                  isDragging ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-500/30' : 'bg-white text-green-600 group-hover:scale-110 group-hover:shadow-md'
                )}>
                  <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                </p>
                <p className="text-sm text-gray-500 mb-6">or click to browse — PDF only, up to {isPro ? '2GB' : '10MB'}</p>
                <button
                  type="button"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-0 pointer-events-none"
                >
                  Choose PDF
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-400 mt-6">
                <span className="flex items-center gap-2">
                  <iconify-icon icon="solar:shield-check-linear" class="text-lg"></iconify-icon>
                  256-bit SSL
                </span>
                <span className="flex items-center gap-2">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-lg"></iconify-icon>
                  Auto-deleted in 2h
                </span>
                <span className="flex items-center gap-2">
                  <iconify-icon icon="solar:eye-closed-linear" class="text-lg"></iconify-icon>
                  Private
                </span>
              </div>
            </>
          )}

          {/* ── SELECTED STATE ── */}
          {state === 'selected' && file && (
            <div className="space-y-8">
              {/* File info */}
              <div className="flex items-center gap-4 p-5 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center shrink-0 shadow-sm">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)} · PDF</p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                </button>
              </div>

              {/* Compression level picker */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">Select Compression Level</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center',
                        level === l.id
                          ? `border-current ${l.bg} ${l.color} shadow-sm`
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <iconify-icon icon={l.icon} class="text-3xl"></iconify-icon>
                      <span className="text-sm font-bold mt-1">{l.label}</span>
                      <span className="text-xs opacity-70 mt-1">{l.expectedReduction}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                  <iconify-icon icon="solar:info-circle-linear" class="text-gray-400 text-lg mt-0.5"></iconify-icon>
                  <p className="text-sm text-gray-600">
                    <span className={activeLevel?.color + ' font-semibold'}>{activeLevel?.label}: </span> 
                    {activeLevel?.desc}.
                  </p>
                </div>
              </div>

              {/* Compress button */}
              <button
                onClick={handleCompress}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:minimize-square-bold" class="text-xl"></iconify-icon>
                Compress PDF Now
              </button>
            </div>
          )}

          {/* ── PROCESSING STATE ── */}
          {state === 'processing' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{file?.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file?.size || 0)}</p>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="pulse-dot w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
                    {queuePosition ? `You are #${queuePosition} in queue...` : progressLabel}
                  </span>
                  <span className="text-green-600 text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-green-500 rounded-full progress-bar-animated transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium pt-1">{progressLabel}</p>
              </div>
            </div>
          )}

          {/* ── DONE STATE ── */}
          {state === 'done' && result && (
            <div className="space-y-6">
              {/* Success header */}
              <div className="text-center">
                <div className="success-icon w-24 h-24 mx-auto rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center shadow-sm mb-4">
                  <iconify-icon icon="solar:check-circle-bold" class="text-5xl text-green-500"></iconify-icon>
                </div>
                <p className="text-xl font-bold text-gray-900">Compression Complete!</p>
                <p className="text-sm text-gray-500 mt-2">Your PDF has been successfully compressed.</p>
              </div>

              {/* Stats card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 shadow-sm">
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Original</p>
                    <p className="text-base font-bold text-gray-700">{formatFileSize(result.originalSize)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-2 shadow-sm">
                      <iconify-icon icon="solar:arrow-down-bold" class="text-white text-lg"></iconify-icon>
                    </div>
                    <p className="text-xl font-extrabold text-green-600">{reduction}%</p>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">smaller</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compressed</p>
                    <p className="text-base font-bold text-green-700">{formatFileSize(result.compressedSize)}</p>
                  </div>
                </div>

                {/* Savings bar */}
                <div className="mt-5 pt-5 border-t border-green-200/50">
                  <div className="h-2.5 bg-green-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${100 - reduction}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-3 text-center">
                    You saved <span className="text-green-700 font-bold">{formatFileSize(result.originalSize - result.compressedSize)}</span>
                  </p>
                </div>
              </div>

              {reduction < 5 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mt-5">
                  <iconify-icon icon="solar:info-circle-bold" class="text-amber-500 text-xl shrink-0 mt-0.5"></iconify-icon>
                  <p className="text-sm text-amber-800 font-medium">
                    Is PDF mein compress karne layak content kam hai (jaise text-only PDF). Images hoti toh size zyada kam hota.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                  Download Compressed PDF
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl text-base font-semibold transition-all"
                >
                  Compress another
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 pt-2">
                File will be automatically deleted from our servers in 2 hours
              </p>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {state === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center shadow-sm">
                <iconify-icon icon="solar:close-circle-bold" class="text-5xl text-red-500"></iconify-icon>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Something went wrong</p>
                <p className="text-sm text-gray-500 mt-2">{errorMsg}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Try again
                </button>
                <button className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-base font-semibold transition-colors">
                  Go Pro (1 GB)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="PDF Compression" 
        limitMessage="Files over 10MB require a Pro account for compression. Upgrade to Pro for up to 2GB file uploads."
      />
    </div>
  );
}
