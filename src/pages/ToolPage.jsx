import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import { clsx } from 'clsx';
import { saveAs } from 'file-saver';
import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import { processWithQueue } from '../utils/queueApi';
import { toast } from 'react-hot-toast';
import PrivacyBadge from '../components/PrivacyBadge';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';

// ─── FILE SIZE FORMATTER ──────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
// ─── DYNAMIC SEO CONTENT INJECTOR ─────────────────────────────────────────────
function injectPlatformContext(text, platform) {
  if (!platform || !text) return text;
  const p = platform.toLowerCase();
  
  let result = text;
  if (p === 'mac') {
    result = result.replace(/your device/gi, 'your Mac');
    result = result.replace(/your computer/gi, 'your Mac');
    result = result.replace(/any device/gi, 'any Mac or Apple device');
    result = result.replace(/web browser/gi, 'Safari or Chrome browser');
  } else if (p === 'windows') {
    result = result.replace(/your device/gi, 'your Windows PC');
    result = result.replace(/your computer/gi, 'your Windows PC');
    result = result.replace(/any device/gi, 'any Windows device');
    result = result.replace(/web browser/gi, 'Edge or Chrome browser');
  } else if (p === 'iphone') {
    result = result.replace(/your device/gi, 'your iPhone');
    result = result.replace(/your computer/gi, 'your iPhone');
    result = result.replace(/any device/gi, 'any iOS device');
    result = result.replace(/web browser/gi, 'Safari browser');
    result = result.replace(/drag and drop/gi, 'select');
    result = result.replace(/dragging/gi, 'selecting');
  } else if (p === 'android') {
    result = result.replace(/your device/gi, 'your Android phone');
    result = result.replace(/your computer/gi, 'your Android device');
    result = result.replace(/any device/gi, 'any Android device');
    result = result.replace(/web browser/gi, 'Chrome browser');
    result = result.replace(/drag and drop/gi, 'select');
    result = result.replace(/dragging/gi, 'selecting');
  }
  return result;
}

import { useTranslation } from 'react-i18next';

export default function ToolPage({ lang = 'en', hideSEO = false }) {
  const { toolSlug, platform } = useParams();
  const navigate = useNavigate();
  const { isPro } = useAuth();
  const { t, i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);
  
  const toolIndex = TOOLS_DATA.findIndex((t) => slugify(t.title) === toolSlug);
  const tool = TOOLS_DATA[toolIndex];
  const toolDataList = lang === 'es' ? TOOLS_DATA_ES : TOOLS_DATA;
  const displayTool = toolDataList[toolIndex];

  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '';
  
  const localizedTitle = displayTool?.title;
  const displayTitle = platform ? `${localizedTitle} on ${platformName}` : localizedTitle;

  const dynamicSteps = (displayTool?.howToSteps || [
    `Select or drag and drop your file into the ${localizedTitle} tool.`,
    'Wait a few seconds while our secure cloud servers process your file.',
    'Once completed, download your newly processed file instantly.'
  ]).map(step => injectPlatformContext(step, platform));

  const dynamicFaqs = (displayTool?.faqs || [
    { question: `Is it safe to use the ${localizedTitle} tool?`, answer: `Yes, absolutely. We use 256-bit SSL encryption to ensure your files are completely secure. All files are automatically deleted from our servers within 2 hours.` },
    { question: `Do I need to install any software?`, answer: `No. TheyLovePDF is a cloud-based platform. You can use our ${localizedTitle} tool directly from your web browser on any device, including Windows, Mac, iOS, and Android.` },
    { question: `Are there any limits on file size?`, answer: `Free users can process files up to 10MB. If you need to process larger files (up to 2GB), you can upgrade to our Pro plan.` }
  ]).map(faq => ({
    question: injectPlatformContext(faq.question, platform),
    answer: injectPlatformContext(faq.answer, platform)
  }));

  const [uploadState, setUploadState] = useState('idle'); // idle | dragging | selected | processing | done | error
  const [urlInput, setUrlInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const uploadBoxRef = useRef(null);

  // Intersection observer for sticky CTA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky CTA only when upload box is completely out of view and we are in idle state
        if (!entry.isIntersecting && uploadState === 'idle') {
          setShowStickyCTA(true);
        } else {
          setShowStickyCTA(false);
        }
      },
      { threshold: 0 }
    );

    if (uploadBoxRef.current) {
      observer.observe(uploadBoxRef.current);
    }
    return () => observer.disconnect();
  }, [uploadState]);

  // Reset on tool change
  useEffect(() => {
    if (!tool) {
      navigate('/');
      return;
    }
    setUploadState('idle');
    setSelectedFiles([]);
    setProcessedUrl(null);
    setProgress(0);
    setIsDragging(false);
    setErrorMsg('');
    setQueuePosition(null);
    setShowStickyCTA(false);
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
    setShowStickyCTA(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isPro]);

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
    // ── Handle URL mode for HTML to PDF ──
    if (tool.title === 'HTML to PDF' && urlInput.trim()) {
      setUploadState('processing');
      setProgress(0);
      progressIntervalRef.current = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 300);
      try {
        const formData = new FormData();
        formData.append('tool', tool.title);
        formData.append('url', urlInput.trim());
        const response = await processWithQueue('/api/process', formData, (status) => {
          if (status.type === 'queued') setQueuePosition(status.position);
          else if (status.type === 'processing') setQueuePosition(null);
        }, false, true);
        setProcessedUrl(response.url);
        clearInterval(progressIntervalRef.current);
        setProgress(100);
        setTimeout(() => setUploadState('done'), 200);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to process URL');
        clearInterval(progressIntervalRef.current);
        setUploadState('error');
      }
      return;
    }

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
            setProcessedUrl(URL.createObjectURL(e.data.blob));
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

  const handleDownload = async () => {
    if (!processedUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('pdfmaster_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(processedUrl, { headers });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : 'converted_file';
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      toast.success('File downloaded successfully!');
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFiles([]);
    setUrlInput('');
    setProcessedUrl(null);
    setProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!tool) return null;

  return (
    <>
      {!hideSEO && (
        <SEOHead 
          lang={lang}
          title={`${displayTitle} Online`} 
          description={displayTool?.desc || ''} 
          url={`/tools/${toolSlug}${platform ? '/' + platform : ''}`} 
          toolName={displayTitle}
          howToSteps={dynamicSteps}
          faqs={dynamicFaqs}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className={clsx('w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4', tool.iconColorClass)}>
            <iconify-icon icon={tool.icon} class="text-4xl"></iconify-icon>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{displayTitle}</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">{displayTool?.desc}</p>
        </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8">
          {/* IDLE / DRAG STATE */}
          {(uploadState === 'idle' || uploadState === 'dragging') && (
            <>
            <div
              ref={uploadBoxRef}
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
                multiple={tool.title === 'Merge PDF' || tool.title === 'JPG to PDF'}
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
              <p className="text-xl font-bold text-gray-900 mb-1 text-center leading-tight">
                {isDragging ? t('dropFileHere') : t('dragDropHere')}
              </p>
              <p className="text-sm text-gray-500 mb-6 text-center">{t('orClickBrowse')} {isPro ? '2GB' : '10MB'}</p>
              <button
                type="button"
                className="bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-0 pointer-events-none"
              >
                {t('chooseFile')}
              </button>
              <PrivacyBadge lang={lang} />
            </div>
            {tool.title === 'HTML to PDF' && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="text-sm font-bold text-gray-700 mb-3 text-center">
                  {lang === 'es' ? 'O INGRESE UNA URL WEB' : 'OR ENTER A WEBPAGE URL'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#378ADD] transition-shadow text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && urlInput && handleProcess()}
                  />
                  <button
                    onClick={handleProcess}
                    disabled={!urlInput.trim()}
                    className="px-6 py-3 bg-[#378ADD] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#2b71b8] transition-colors"
                  >
                    {lang === 'es' ? 'Convertir' : 'Convert'}
                  </button>
                </div>
              </div>
            )}
            </>
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
                {t('processWith')} {localizedTitle}
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
                    {selectedFiles.length > 1 ? t('filesCount', { count: selectedFiles.length }) : selectedFiles[0]?.name}
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
                    {queuePosition ? t('inQueue', { count: queuePosition }) : t('processingMsg')}
                  </span>
                  <span className="text-[#378ADD] text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-[#378ADD] rounded-full progress-bar-animated transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium pt-1 text-center sm:text-left">
                  {progress < 30 ? t('uploadingValidating') : progress < 60 ? t('analyzingDoc') : progress < 85 ? t('applyingTransform') : t('finalizingOutput')}
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
                <p className="text-xl font-bold text-gray-900">{t('doneReady')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('autoDeletePrivacy')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={clsx(
                    'flex-1 py-4 text-white rounded-2xl text-base font-semibold shadow-md transition-all flex items-center justify-center gap-2.5',
                    isDownloading
                      ? 'bg-[#2b71b8] cursor-not-allowed opacity-90'
                      : 'bg-[#378ADD] hover:bg-[#2b71b8] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  )}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t('preparingDownload')}
                    </>
                  ) : (
                    <>
                      <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                      {t('downloadBtn')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl text-base font-semibold transition-all"
                >
                  {t('processAnother')}
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
                <p className="text-xl font-bold text-gray-900">{t('errorTitle')}</p>
                <p className="text-sm text-red-500 mt-2 max-w-sm mx-auto">{errorMsg}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t('tryAgain')}
                </button>
                <button className="flex-1 py-4 border-2 border-[#378ADD] text-[#378ADD] hover:bg-blue-50 rounded-2xl text-base font-semibold transition-colors">
                  {t('goPro')}
                </button>
              </div>
            </div>
          )}

          {/* Trust Footer */}
          {uploadState !== 'done' && uploadState !== 'error' && (
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:shield-check-linear" class="text-base sm:text-lg"></iconify-icon>
                256-bit SSL
              </span>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:trash-bin-trash-linear" class="text-base sm:text-lg"></iconify-icon>
                {t('autoDeleted')}
              </span>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:eye-closed-linear" class="text-base sm:text-lg"></iconify-icon>
                {t('private')}
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

      {/* Sticky Floating Upload Button */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Optional: fileInputRef.current?.click();
        }}
        className={clsx(
          "fixed z-50 md:hidden bg-[#378ADD] text-white rounded-full shadow-2xl flex items-center gap-2 font-bold transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          showStickyCTA ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-20 opacity-0 pointer-events-none",
          // Positioned above the Bottom Navbar
          "bottom-[80px] right-4 px-6 py-4"
        )}
      >
        <iconify-icon icon="solar:upload-minimalistic-bold" class="text-2xl"></iconify-icon>
        Upload
      </button>

      </div>
    </>
  );
}
