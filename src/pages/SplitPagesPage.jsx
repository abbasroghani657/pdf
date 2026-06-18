import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';
// pdfjs — uses Vite ?url worker for correct production builds
import { pdfjsLib } from '../utils/pdfjs-setup.js';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function SplitPagesPage({ lang = 'en' }) {
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploadState, setUploadState] = useState('idle'); // idle | dragging | config | processing | done | error
  const [selectedFile, setSelectedFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [processedBlob, setProcessedBlob] = useState(null);

  // Split configurations
  const [splitMode, setSplitMode] = useState('custom');
  const [customRanges, setCustomRanges] = useState('');
  const [fixedPages, setFixedPages] = useState(1);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'split',
    { splitMode, customRanges, fixedPages, totalPages },
    selectedFile,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setSelectedFile(f);
      setSplitMode(s?.splitMode || 'custom');
      setCustomRanges(s?.customRanges || '');
      setFixedPages(s?.fixedPages || 1);
      setTotalPages(s?.totalPages || 0);
      setUploadState('config');
    },
    uploadState === 'config'
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ─── File Handling ────────────────────────────────────────────────────────
  const processFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid PDF file.');
      setUploadState('error');
      return;
    }
    if (file.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    
    setSelectedFile(file);
    setUploadState('config');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setCustomRanges(`1-${pdf.numPages}`);
    } catch (e) {
      console.error(e);
      // Fallback if PDF parsing fails
      setTotalPages(10);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  // ─── Processing ───────────────────────────────────────────────────────────
  const handleSplit = async () => {
    if (!selectedFile) return;
    
    // ── Validate custom ranges before processing ──
    if (splitMode === 'custom') {
      const ranges = customRanges.split(',').map(s => s.trim()).filter(Boolean);
      if (ranges.length === 0) {
        setErrorMsg('Please enter at least one page range (e.g. 1-3, 5).');
        setUploadState('error');
        return;
      }
      for (const range of ranges) {
        if (range.includes('-')) {
          const [startStr, endStr] = range.split('-');
          const start = Number(startStr);
          const end = Number(endStr);
          if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
            setErrorMsg(`Invalid range "${range}". Pages must be positive numbers.`);
            setUploadState('error');
            return;
          }
          if (start > end) {
            setErrorMsg(`Invalid range "${range}". Start page (${start}) cannot be greater than end page (${end}).`);
            setUploadState('error');
            return;
          }
          if (totalPages > 0 && start > totalPages) {
            setErrorMsg(`Invalid range "${range}". This PDF only has ${totalPages} pages.`);
            setUploadState('error');
            return;
          }
        } else {
          const page = Number(range);
          if (isNaN(page) || page < 1) {
            setErrorMsg(`Invalid page number "${range}". Must be a positive number.`);
            setUploadState('error');
            return;
          }
          if (totalPages > 0 && page > totalPages) {
            setErrorMsg(`Page ${page} does not exist. This PDF only has ${totalPages} pages.`);
            setUploadState('error');
            return;
          }
        }
      }
    }
    
    setUploadState('processing');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 90));
    }, 100);

    try {
      const worker = new Worker(new URL('../workers/pdfWorker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
           setProgress(e.data.progress);
        } else if (e.data.success) {
           setProcessedBlob(e.data.blob);
           setProgress(100);
           setTimeout(() => setUploadState('done'), 400);
           worker.terminate();
        } else {
           setErrorMsg(e.data.error || 'Failed to split PDF');
           setUploadState('error');
           worker.terminate();
        }
      };

      worker.onerror = (err) => {
        setErrorMsg('Worker error: ' + err.message);
        setUploadState('error');
        worker.terminate();
      };

      const options = {
        mode: splitMode,
        customRanges: splitMode === 'custom' ? customRanges : null,
        fixedPages: splitMode === 'fixed' ? parseInt(fixedPages, 10) : null
      };

      worker.postMessage({
        tool: 'Split PDF',
        files: [selectedFile],
        options: options
      });



    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err.message || 'An error occurred during splitting.');
      setUploadState('error');
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Check blob type to determine if it's a ZIP or a single PDF
    const ext = processedBlob.type === 'application/zip' ? '.zip' : '.pdf';
    a.download = `TheyLovePDF_split_${selectedFile.name.replace('.pdf', '')}${ext}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setProcessedBlob(null);
    setTotalPages(0);
    setProgress(0);
    setErrorMsg('');
    clearSession();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-cyan-50 text-cyan-600">
          <iconify-icon icon="solar:scissors-linear" class="text-3xl" stroke-width="1.5"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Split PDF</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">Separate one page or a whole set for easy conversion into independent PDF files.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8">
          
          {/* UPLOAD STATE */}
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
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
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-sm text-gray-500 mb-6">or click to browse — PDF, up to {isPro ? '2GB' : '10MB'}</p>
              <button type="button" className="bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-0 pointer-events-none">
                Choose file
              </button>
            </div>
          )}

          {/* CONFIGURATION STATE */}
          {uploadState === 'config' && selectedFile && (
            <div className="space-y-8">
              {/* File Info */}
              <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-[#378ADD]/10 text-[#378ADD] flex items-center justify-center shrink-0 shadow-sm">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(selectedFile.size)} • {totalPages} pages</p>
                </div>
                <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                </button>
              </div>

              {/* Split Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Custom Ranges */}
                <div 
                  onClick={() => setSplitMode('custom')}
                  className={clsx(
                    "cursor-pointer border-2 rounded-2xl p-5 transition-all duration-200",
                    splitMode === 'custom' ? "border-[#378ADD] bg-blue-50/20 shadow-[0_0_0_4px_rgba(55,138,221,0.1)]" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center", splitMode === 'custom' ? "border-[#378ADD]" : "border-gray-300")}>
                      {splitMode === 'custom' && <div className="w-2.5 h-2.5 rounded-full bg-[#378ADD]" />}
                    </div>
                    <span className="font-bold text-gray-900">Custom Ranges</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Extract specific pages or ranges. Ex: 1-5, 8, 11-13</p>
                  
                  {splitMode === 'custom' && (
                    <input 
                      type="text" 
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      placeholder="e.g. 1-5, 8, 11-13"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#378ADD] text-sm"
                    />
                  )}
                </div>

                {/* Fixed Ranges */}
                <div 
                  onClick={() => setSplitMode('fixed')}
                  className={clsx(
                    "cursor-pointer border-2 rounded-2xl p-5 transition-all duration-200",
                    splitMode === 'fixed' ? "border-[#378ADD] bg-blue-50/20 shadow-[0_0_0_4px_rgba(55,138,221,0.1)]" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center", splitMode === 'fixed' ? "border-[#378ADD]" : "border-gray-300")}>
                      {splitMode === 'fixed' && <div className="w-2.5 h-2.5 rounded-full bg-[#378ADD]" />}
                    </div>
                    <span className="font-bold text-gray-900">Fixed Ranges</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Split the PDF into files of exactly N pages.</p>
                  
                  {splitMode === 'fixed' && (
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1"
                        max={totalPages}
                        value={fixedPages}
                        onChange={(e) => setFixedPages(e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#378ADD] text-sm"
                      />
                      <span className="text-sm text-gray-500 font-medium">pages per file</span>
                    </div>
                  )}
                </div>

                {/* Extract All */}
                <div 
                  onClick={() => setSplitMode('all')}
                  className={clsx(
                    "cursor-pointer border-2 rounded-2xl p-5 transition-all duration-200",
                    splitMode === 'all' ? "border-[#378ADD] bg-blue-50/20 shadow-[0_0_0_4px_rgba(55,138,221,0.1)]" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center", splitMode === 'all' ? "border-[#378ADD]" : "border-gray-300")}>
                      {splitMode === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-[#378ADD]" />}
                    </div>
                    <span className="font-bold text-gray-900">Extract All Pages</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">Every page of this PDF will be converted into a separate PDF file.</p>
                </div>

              </div>

              <div className="pt-2">
                <button
                  onClick={handleSplit}
                  className="w-full py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Split PDF
                </button>
              </div>
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
                  <p className="text-base font-semibold text-gray-900 truncate">{selectedFile?.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(selectedFile?.size || 0)}</p>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="pulse-dot w-2.5 h-2.5 bg-[#378ADD] rounded-full inline-block"></span>
                    Splitting PDF...
                  </span>
                  <span className="text-[#378ADD] text-lg font-bold">{progress}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-[#378ADD] rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* DONE STATE */}
          {uploadState === 'done' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-sm">
                <iconify-icon icon="solar:check-circle-bold" class="text-5xl text-emerald-500"></iconify-icon>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Done! PDF has been split.</p>
                <p className="text-sm text-gray-500 mt-2">
                  {processedBlob?.type === 'application/zip' 
                    ? 'Your files have been packed into a ZIP file.'
                    : 'Your custom PDF file is ready to download.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                  {processedBlob?.type === 'application/zip' ? 'Download ZIP' : 'Download PDF'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl text-base font-semibold transition-all"
                >
                  Split another PDF
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
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-[#378ADD] text-white rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Split PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}

