import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { saveAs } from 'file-saver';
import UpgradeModal from '../components/UpgradeModal';
import { processWithQueue } from '../utils/queueApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const LEVELS = [
  {
    id: 'basic',
    label: 'Basic Repair',
    desc: 'Fix file structure and metadata headers.',
    icon: 'solar:magic-stick-3-linear',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    activeBg: 'bg-blue-500',
  },
  {
    id: 'deep',
    label: 'Deep Repair',
    desc: 'Rebuild cross-reference table and fix broken streams.',
    icon: 'solar:wrench-linear',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    activeBg: 'bg-amber-500',
  },
  {
    id: 'full',
    label: 'Full Recovery',
    desc: 'Extract salvageable content and generate a new clean PDF.',
    icon: 'solar:shield-warning-linear',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    activeBg: 'bg-red-600',
  }
];

export default function RepairPage() {
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('idle'); // idle | selected | processing | done | error
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('deep');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null); // { bytes, originalSize, message }
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'repair',
    { level },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setLevel(s?.level || 'deep');
      setState('selected');
    },
    state === 'selected' || state === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file.');
      setState('error');
      return;
    }
    if (f.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(f);
    setState('selected');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setState('idle');
    setProgress(0);
    setResult(null);
    setErrorMsg('');
    clearSession();
  };

  const handleRepair = async () => {
    if (!file) return;
    setState('processing');
    setProgress(0);
    setProgressLabel('Diagnosing file corruption...');

    let currentProgress = 0;
    progressRef.current = setInterval(() => {
      currentProgress += Math.random() * 8;
      
      if (currentProgress > 70) {
        setProgressLabel('Recovering content streams...');
      } else if (currentProgress > 40) {
        setProgressLabel('Rebuilding cross-reference table...');
      }
      
      if (currentProgress > 90) currentProgress = 90;
      setProgress(currentProgress);
    }, 400);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('tool', 'Repair PDF');
      formData.append('level', level); // 'basic', 'deep', 'full'

      const response = await processWithQueue('/api/process', formData, null);

      clearInterval(progressRef.current);
      setProgress(100);
      setProgressLabel('Finishing repair...');

      // Check if response is JSON (error/diagnostics) or Blob (the repaired PDF)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
         const data = await response.json();
         throw new Error(data.error || 'Unknown error occurred.');
      }

      let blob;
      try {
        blob = await response.blob();
      } catch (e) {
        throw new Error(`Failed to download repaired file from server: ${e.message}`);
      }
      
      setTimeout(() => {
        setResult({
          bytes: blob,
          originalSize: file.size,
          compressedSize: blob.size,
          message: 'PDF successfully repaired and restructured.'
        });
        setState('done');
      }, 600);

    } catch (err) {
      clearInterval(progressRef.current);
      console.error('Repair Error:', err);
      
      let msg = err.message || 'An error occurred during repair.';
      if (msg === 'Failed to fetch') {
        msg = 'Connection to server failed. Please ensure the backend is running and check your internet connection.';
      }
      
      setErrorMsg(msg);
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!result?.bytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    saveAs(result.bytes, `${baseName}_repaired.pdf`);
    toast.success('Repaired PDF downloaded!');
  };

  const activeLevel = LEVELS.find(l => l.id === level);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pt-4 pb-8 animate-in fade-in duration-500">
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 mb-2">
          <iconify-icon icon="solar:wrench-bold" class="text-3xl"></iconify-icon>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Repair PDF</h1>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto">
          Fix corrupt, damaged, or broken PDF files. Recover content from files that won't open.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">
        {state === 'idle' && (
          <div
            className={clsx(
              "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] transition-all duration-300",
              isDragging ? "border-blue-500 bg-blue-50/50 scale-[0.99]" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <iconify-icon icon="solar:file-corrupted-linear" class="text-3xl"></iconify-icon>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select corrupted PDF</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
              Drag and drop your damaged PDF here, or click to browse. Max size {isPro ? '2GB' : '10MB'}.
            </p>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileSelect(e.target.files[0])} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
            >
              <iconify-icon icon="solar:folder-open-bold" class="text-lg"></iconify-icon>
              Choose PDF File
            </button>
          </div>
        )}

        {state === 'selected' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 bg-gray-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-broken-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4">Select Repair Level</p>
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

            <button
              onClick={handleRepair}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-bold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2"
            >
              <iconify-icon icon="solar:wrench-bold" class="text-xl"></iconify-icon>
              Repair PDF Now
            </button>
          </div>
        )}

        {state === 'processing' && (
          <div className="max-w-md mx-auto py-12 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-300 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Repairing Document...</h3>
              <p className="text-sm text-gray-500 animate-pulse">{progressLabel}</p>
            </div>
          </div>
        )}

        {state === 'done' && result && (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-green-600/20">
              <iconify-icon icon="solar:check-read-bold" class="text-4xl"></iconify-icon>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Repair Successful!</h3>
              <p className="text-base text-gray-500">Your PDF structure has been rebuilt.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-sm mx-auto space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Original File</span>
                <span className="text-sm font-bold text-gray-900">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Repaired File</span>
                <span className="text-sm font-bold text-green-600">{formatFileSize(result.compressedSize)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:download-square-bold" class="text-lg"></iconify-icon>
                Download Repaired PDF
              </button>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:refresh-linear" class="text-lg"></iconify-icon>
                Repair Another
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-md mx-auto py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-4xl"></iconify-icon>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Repair Failed</h3>
            <p className="text-sm text-gray-600">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="PDF Repair" 
        limitMessage="Files over 10MB require a Pro account for repair. Upgrade to Pro for up to 2GB file uploads."
      />
    </div>
  );
}
