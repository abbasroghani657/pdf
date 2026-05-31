import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import { clsx } from 'clsx';
import { saveAs } from 'file-saver';
import { TOOLS_DATA } from '../data/tools';
import { slugify } from '../utils/slugify';
import { processWithQueue } from '../utils/queueApi';
import { toast } from 'react-hot-toast';
import PrivacyBadge from '../components/PrivacyBadge';
import { useAuth } from '../contexts/AuthContext';

// ─── FILE SIZE FORMATTER ──────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ToolPage() {
  const { toolSlug } = useParams();
  const navigate = useNavigate();
  const { isPro } = useAuth();
  
  const tool = TOOLS_DATA.find((t) => slugify(t.title) === toolSlug);

  const [uploadState, setUploadState] = useState('idle'); // idle | dragging | selected | processing | done | error
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Reset on tool change
  useEffect(() => {
    if (!tool) {
      navigate('/');
      return;
    }
    setUploadState('idle');
    setSelectedFiles([]);
    setProcessedBlob(null);
    setProgress(0);
    setIsDragging(false);
    setErrorMsg('');
    setQueuePosition(null);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [toolSlug, tool, navigate]);

  const handleFileSelect = useCallback((files) => {
    if (!files || files.length === 0) return;
    const maxSize = isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024; // 2GB for Pro, 10MB for Free
    const validFiles = Array.from(files).filter(f => f.size <= maxSize);
    if (validFiles.length === 0) {
      setIsUpgradeOpen(true);
      return;
    }
    setSelectedFiles(validFiles);
    setUploadState('selected');
  }, []);

  const handleInputChange = (e) => {
    if (e.target.files) handleFileSelect(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return;
    setUploadState('processing');
    setProgress(0);
    setQueuePosition(null);

    // Simulate progress while waiting for backend
    let p = 0;
    progressIntervalRef.current = setInterval(() => {
      const increment = p < 30 ? 4 : p < 70 ? 1.5 : p < 90 ? 0.8 : 0.1;
      p = Math.min(p + increment, 95);
      setProgress(p);
    }, 60);

    try {
      if (tool.title === 'Merge PDF') {
        const worker = new Worker(new URL('../workers/pdfWorker.js', import.meta.url), { type: 'module' });
        
        worker.onmessage = (e) => {
          if (e.data.success) {
            setProcessedBlob(e.data.blob);
            clearInterval(progressIntervalRef.current);
            setProgress(100);
            setTimeout(() => setUploadState('done'), 200);
            worker.terminate();
          } else {
            throw new Error(e.data.error || 'Worker failed');
          }
        };

        worker.onerror = (err) => {
          throw new Error('Worker error: ' + err.message);
        };

        worker.postMessage({
          tool: tool.title,
          files: selectedFiles,
          options: {}
        });
        
        return; // Wait for worker message
      }

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('tool', tool.title);

      const response = await processWithQueue('/api/process', formData, (status) => {
        if (status.type === 'queued') {
           setQueuePosition(status.position);
        } else if (status.type === 'processing') {
           setQueuePosition(null);
        }
      }, false, true);

      setProcessedUrl(response.url);

      clearInterval(progressIntervalRef.current);
      setProgress(100);
      setTimeout(() => setUploadState('done'), 200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process file');
      clearInterval(progressIntervalRef.current);
      setUploadState('error');
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    
    // Tell browser to natively navigate to the download URL
    // This allows IDM or Chrome to download it directly without empty Blob bugs
    window.location.assign(processedUrl);
    
    toast.success('File downloaded successfully!');
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFiles([]);
    setProcessedUrl(null);
    setProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!tool) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className={clsx('w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4', tool.iconColorClass)}>
          <iconify-icon icon={tool.icon} class="text-3xl" stroke-width="1.5"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{tool.title}</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">{tool.desc}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8">
          {/* IDLE / DRAG STATE */}
          {(uploadState === 'idle' || uploadState === 'dragging') && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={clsx(
                'relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden',
                isDragging
                  ? 'drag-over border-[#378ADD] bg-blue-50/50'
                  : 'border-blue-200 hover:border-[#378ADD]/50 hover:bg-blue-50/30 bg-blue-50/10'
              )}
            >
              {/* Absolute overlay input for bulletproof file selection */}
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.title === 'Merge PDF'}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.html,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleInputChange}
                title=""
              />
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                isDragging ? 'bg-[#378ADD] text-white scale-110 shadow-lg shadow-blue-500/30' : 'bg-white text-[#378ADD] group-hover:scale-110 group-hover:shadow-md'
              )}>
                <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-gray-500 mb-6">or click to browse — PDF, up to {isPro ? '2GB' : '10MB'}</p>
              <button
                type="button"
                className="bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-0 pointer-events-none"
              >
                Choose file
              </button>
              <PrivacyBadge />
            </div>
          )}

          {/* SELECTED STATE */}
          {uploadState === 'selected' && selectedFiles.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="w-12 h-12 rounded-xl bg-[#378ADD]/10 text-[#378ADD] flex items-center justify-center shrink-0 shadow-sm">
                      <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    {i === 0 && selectedFiles.length === 1 && (
                      <button
                        onClick={handleReset}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleProcess}
                className="w-full py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:magic-stick-3-bold" class="text-xl"></iconify-icon>
                Process with {tool.title}
              </button>
            </div>
          )}

          {/* PROCESSING STATE */}
          {uploadState === 'processing' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-[#378ADD]/10 text-[#378ADD] flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {selectedFiles.length > 1 ? `${selectedFiles.length} files` : selectedFiles[0]?.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="pulse-dot w-2.5 h-2.5 bg-[#378ADD] rounded-full inline-block"></span>
                    {queuePosition ? `You are #${queuePosition} in queue...` : 'Processing...'}
                  </span>
                  <span className="text-[#378ADD] text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-[#378ADD] rounded-full progress-bar-animated transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium pt-1">
                  {progress < 30 ? 'Uploading & validating file...' : progress < 60 ? 'Analyzing document structure...' : progress < 85 ? 'Applying transformation...' : 'Finalizing output...'}
                </p>
              </div>
            </div>
          )}

          {/* DONE STATE */}
          {uploadState === 'done' && (
            <div className="text-center space-y-6">
              <div className="success-icon w-24 h-24 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-sm">
                <iconify-icon icon="solar:check-circle-bold" class="text-5xl text-emerald-500"></iconify-icon>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Done! Your file is ready.</p>
                <p className="text-sm text-gray-500 mt-2">File will be automatically deleted in 2 hours for privacy.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl text-base font-semibold transition-all"
                >
                  Process another
                </button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {uploadState === 'error' && (
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
                  className="flex-1 py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Try again
                </button>
                <button className="flex-1 py-4 border-2 border-[#378ADD] text-[#378ADD] hover:bg-blue-50 rounded-2xl text-base font-semibold transition-colors">
                  Go Pro (1GB)
                </button>
              </div>
            </div>
          )}

          {/* Trust Footer */}
          {uploadState !== 'done' && uploadState !== 'error' && (
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-400">
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
          )}
        </div>


      </div>
      
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName={tool.title} 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
