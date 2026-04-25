import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { saveAs } from 'file-saver';
import { TOOLS_DATA } from './data/tools';
import CompressPDFModal from './components/CompressPDFModal';

// ─── TESTIMONIALS DATA ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Head of Legal, Accenture', text: 'PDFMaster replaced 4 separate tools for our legal team. The AI summarizer alone saves us 2 hours a day.', avatar: 'SC' },
  { name: 'Marcus Petrov', role: 'CTO, Fintech Startup', text: 'We process 10,000+ PDFs monthly via their API. Fastest, most reliable service we\'ve found.', avatar: 'MP' },
  { name: 'Aisha Okonkwo', role: 'Research Director, WHO', text: 'Translating our reports into 12 languages while preserving formatting was a dream. PDFMaster made it trivial.', avatar: 'AO' },
  { name: 'James Liu', role: 'Lead Architect, KPMG', text: 'Enterprise-grade security, audit logs, and team management. It fits perfectly into our compliance workflows.', avatar: 'JL' },
  { name: 'Priya Mehta', role: 'Operations Manager, Deloitte', text: 'Went from 30 minutes to 30 seconds for our monthly report merges. Incredible time savings.', avatar: 'PM' },
  { name: 'Tom Weber', role: 'Founder, DocuFlow AI', text: 'We built our entire document automation product on top of PDFMaster\'s API. Rock solid.', avatar: 'TW' },
  { name: 'Lena Torres', role: 'VP Product, Salesforce', text: 'The sign + request signature workflow is cleaner than DocuSign for our internal use cases.', avatar: 'LT' },
  { name: 'Ravi Shankar', role: 'Director, Infosys', text: 'OCR accuracy on scanned engineering drawings is exceptional. Better than any other tool we\'ve tested.', avatar: 'RS' },
];

const STATS = [
  { value: '50M+', label: 'Documents processed', icon: 'solar:document-bold' },
  { value: '2.4M+', label: 'Happy users', icon: 'solar:users-group-two-rounded-bold' },
  { value: '37+', label: 'PDF tools', icon: 'solar:box-bold' },
  { value: '99.9%', label: 'Uptime SLA', icon: 'solar:shield-check-bold' },
];

const TRUST_LOGOS = [
  'Accenture', 'Deloitte', 'KPMG', 'Infosys', 'Salesforce', 'WHO',
];

// ─── FILE SIZE FORMATTER ──────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
function UploadModal({ isOpen, tool, onClose }) {
  const [uploadState, setUploadState] = useState('idle'); // idle | dragging | selected | processing | done | error
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setUploadState('idle');
      setSelectedFile(null);
      setProcessedBlob(null);
      setProgress(0);
      setIsDragging(false);
      setErrorMsg('');
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setErrorMsg('Maximum file size is 100MB on the free plan');
      setUploadState('error');
      return;
    }
    setSelectedFile(file);
    setUploadState('selected');
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setUploadState('processing');
    setProgress(0);

    // Simulate progress while waiting for backend
    let p = 0;
    progressIntervalRef.current = setInterval(() => {
      const increment = p < 30 ? 4 : p < 70 ? 1.5 : p < 90 ? 0.8 : 0.1;
      p = Math.min(p + increment, 95);
      setProgress(p);
    }, 60);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tool', tool.title);

      const response = await fetch('http://localhost:3005/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errStr = 'Backend API error';
        try {
           const json = await response.json();
           if (json.error) errStr = json.error;
        } catch(e){}
        throw new Error(errStr);
      }

      const blob = await response.blob();
      setProcessedBlob(blob);

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
    if (!processedBlob) return;
    const safeOriginalName = selectedFile?.name ? selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'document';
    const safeToolName = tool?.title ? tool.title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'tool';
    
    let finalExt = '.pdf';
    if (tool?.title === 'PDF to Excel') finalExt = '.xlsx';
    if (tool?.title === 'PDF to Word') finalExt = '.docx';
    if (tool?.title === 'PDF to PowerPoint') finalExt = '.pptx';
    if (tool?.title === 'PDF to JPG') finalExt = '.jpg';
    
    const baseName = safeOriginalName.replace(/\.[^/.]+$/, "");
    const filename = `pdfmaster_${safeToolName}_${baseName}${finalExt}`;
    
    saveAs(processedBlob, filename);
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setProcessedBlob(null);
    setProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen || !tool) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-enter bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm', tool.iconColorClass)}>
              <iconify-icon icon={tool.icon} class="text-xl" stroke-width="1.5"></iconify-icon>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">{tool.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Free · Secure · No signup needed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <iconify-icon icon="solar:close-linear" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* IDLE / DRAG STATE */}
          {(uploadState === 'idle' || uploadState === 'dragging') && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={clsx(
                'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group',
                isDragging
                  ? 'drag-over'
                  : 'border-gray-200 hover:border-[#378ADD]/50 hover:bg-blue-50/30'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
                isDragging ? 'bg-[#378ADD]/10 text-[#378ADD] scale-110' : 'bg-gray-100 text-gray-400 group-hover:bg-[#378ADD]/10 group-hover:text-[#378ADD]'
              )}>
                <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-gray-400 mb-5">or click to browse — PDF, up to 100MB</p>
              <button
                type="button"
                className="bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                Choose file
              </button>
            </div>
          )}

          {/* SELECTED STATE */}
          {uploadState === 'selected' && selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-[#378ADD]/10 text-[#378ADD] flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-lg"></iconify-icon>
                </button>
              </div>

              <button
                onClick={handleProcess}
                className="w-full py-3 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-sm font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:magic-stick-3-bold" class="text-lg"></iconify-icon>
                Process with {tool.title}
              </button>
            </div>
          )}

          {/* PROCESSING STATE */}
          {uploadState === 'processing' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#378ADD]/10 text-[#378ADD] flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile?.size || 0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="pulse-dot w-2 h-2 bg-[#378ADD] rounded-full inline-block"></span>
                    Processing...
                  </span>
                  <span className="text-[#378ADD]">{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#378ADD] rounded-full progress-bar-animated transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {progress < 30 ? 'Uploading & validating file...' : progress < 60 ? 'Analyzing document structure...' : progress < 85 ? 'Applying transformation...' : 'Finalizing output...'}
                </p>
              </div>
            </div>
          )}

          {/* DONE STATE */}
          {uploadState === 'done' && (
            <div className="text-center space-y-4">
              <div className="success-icon w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                <iconify-icon icon="solar:check-circle-bold" class="text-3xl text-emerald-500"></iconify-icon>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Done! Your file is ready.</p>
                <p className="text-xs text-gray-500 mt-1">File will be automatically deleted in 2 hours</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-sm font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-lg"></iconify-icon>
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-colors"
                >
                  Process another
                </button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {uploadState === 'error' && (
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
                  className="flex-1 py-3 bg-[#378ADD] hover:bg-[#2b71b8] text-white rounded-2xl text-sm font-semibold transition-all"
                >
                  Try again
                </button>
                <button className="flex-1 py-3 border border-[#378ADD] text-[#378ADD] hover:bg-blue-50 rounded-2xl text-sm font-semibold transition-colors">
                  Go Pro (1GB)
                </button>
              </div>
            </div>
          )}

          {/* Trust Footer */}
          {uploadState !== 'done' && uploadState !== 'error' && (
            <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-400">
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
          )}
        </div>

        {/* Hidden real file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.html,.txt"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}

// ─── MOBILE NAVIGATION DRAWER ─────────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, currentView, onNav }) {
  const links = [
    { id: 'tools-view', label: 'Tools', icon: 'solar:box-linear' },
    { id: 'pricing-view', label: 'Pricing', icon: 'solar:tag-price-linear' },
    { id: 'vs-view', label: 'vs ILovePDF', icon: 'solar:chart-square-linear' },
  ];
  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={clsx(
        'fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#378ADD] rounded flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="font-semibold text-sm"><span className="text-[#378ADD]">PDF</span>Master</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <iconify-icon icon="solar:close-linear" class="text-xl"></iconify-icon>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 py-6 px-4 space-y-1">
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => { onNav(link.id); onClose(); }}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors',
                currentView === link.id ? 'bg-[#378ADD]/10 text-[#378ADD]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <iconify-icon icon={link.icon} class="text-lg"></iconify-icon>
              {link.label}
            </button>
          ))}
          <a href="#" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <iconify-icon icon="solar:notebook-linear" class="text-lg"></iconify-icon>
            Blog
          </a>
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <button className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
            Sign in
          </button>
          <button className="w-full py-2.5 text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl transition-colors shadow-sm">
            Go Premium — $4.99/mo
          </button>
        </div>
      </div>
    </>
  );
}

// ─── MARQUEE TESTIMONIALS ─────────────────────────────────────────────────────
function TestimonialMarquee() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <div className="overflow-hidden py-2">
      <div className="marquee-track flex gap-5 w-max">
        {doubled.map((t, i) => (
          <div
            key={i}
            className="w-72 shrink-0 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex text-amber-400 text-xs mb-3">
              {'★★★★★'}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">"{t.text}"</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#378ADD] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {t.avatar}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                <p className="text-[10px] text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [currentView, setCurrentView] = useState('tools-view');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, tool: null });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState('monthly'); // monthly | annual
  const [scrolled, setScrolled] = useState(false);
  const [compressModalOpen, setCompressModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter tools
  const filteredTools = TOOLS_DATA.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleNavClick = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = (tool) => {
    if (tool.title === 'Compress PDF') {
      setCompressModalOpen(true);
      document.body.style.overflow = 'hidden';
      return;
    }
    setModalState({ isOpen: true, tool });
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 250);
  };

  const CATEGORIES = [
    { id: 'all', label: 'All tools', icon: 'solar:box-linear' },
    { id: 'convert', label: 'Convert', icon: 'solar:repeat-linear' },
    { id: 'organize', label: 'Organize', icon: 'solar:documents-linear' },
    { id: 'optimize', label: 'Optimize', icon: 'solar:minimize-square-linear' },
    { id: 'security', label: 'Security', icon: 'solar:lock-keyhole-linear' },
    { id: 'edit', label: 'Edit', icon: 'solar:pen-new-square-linear' },
    { id: 'sign', label: 'eSign', icon: 'solar:pen-linear' },
  ];

  const annualSavings = 20; // percent

  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#f8fafc]">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className={clsx(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-lg border-b border-gray-200/70 shadow-sm'
          : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => handleNavClick('tools-view')}
          >
            <div className="w-7 h-7 bg-[#378ADD] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              P
            </div>
            <span className="font-bold text-base tracking-tight">
              <span className="text-[#378ADD]">PDF</span><span className="text-gray-900">Master</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'tools-view', label: 'Tools' },
              { id: 'pricing-view', label: 'Pricing' },
              { id: 'vs-view', label: 'vs ILovePDF' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  currentView === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </button>
            ))}
            <a href="#" className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">Blog</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <button className="text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg px-4 py-1.5 transition-colors">
              Sign in
            </button>
            <button className="text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-lg px-4 py-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0">
              Go Premium
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <iconify-icon icon="solar:hamburger-menu-linear" class="text-2xl"></iconify-icon>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        onNav={handleNavClick}
      />

      {/* ── HERO / HEADER ──────────────────────────────────────────────────── */}
      <header className={clsx(
        'w-full text-center transition-all duration-500 relative overflow-hidden',
        currentView === 'tools-view' ? 'pt-16 pb-10' : 'pt-12 pb-6'
      )}>
        {/* Decorative background */}
        {currentView === 'tools-view' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#378ADD]/8 blur-3xl" />
            <div className="absolute top-10 left-1/4 w-32 h-32 rounded-full bg-purple-500/6 blur-2xl" />
            <div className="absolute top-10 right-1/4 w-32 h-32 rounded-full bg-blue-400/6 blur-2xl" />
          </div>
        )}

        <div className="relative max-w-4xl mx-auto px-4">
          {currentView === 'tools-view' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-[#378ADD] mb-5">
              <span className="pulse-dot w-1.5 h-1.5 bg-[#378ADD] rounded-full"></span>
              50M+ documents processed this month
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {currentView === 'tools-view' && (
              <> The most powerful<br className="hidden sm:block" />
                <span className="gradient-text"> PDF toolkit</span> — free</>
            )}
            {currentView === 'pricing-view' && 'Simple, transparent pricing'}
            {currentView === 'vs-view' && 'PDFMaster vs ILovePDF'}
          </h1>

          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-6">
            {currentView === 'tools-view' && '37+ tools. AI-powered. Faster than ILovePDF. No limits on free tier. Used by teams at Accenture, Deloitte & 2.4M+ professionals.'}
            {currentView === 'pricing-view' && 'Get more done with PDFMaster Pro. No hidden fees, cancel anytime.'}
            {currentView === 'vs-view' && 'Why millions are switching to the faster, smarter, and more affordable alternative.'}
          </p>

          {/* Feature pills */}
          {currentView === 'tools-view' && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { icon: 'solar:stars-linear', label: 'AI-powered', cls: 'bg-purple-50 text-purple-600 border-purple-100' },
                { icon: 'solar:layers-linear', label: '37+ tools', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
                { icon: 'solar:user-cross-linear', label: 'No signup', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
                { icon: 'solar:shield-check-linear', label: '256-bit SSL', cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                { icon: 'solar:devices-linear', label: 'All devices', cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                { icon: 'solar:cloud-bolt-linear', label: 'Edge CDN', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', hidden: 'sm' },
              ].map((pill, i) => (
                <span
                  key={i}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                    pill.cls,
                    pill.hidden === 'sm' ? 'hidden sm:inline-flex' : ''
                  )}
                >
                  <iconify-icon icon={pill.icon} stroke-width="1.5"></iconify-icon>
                  {pill.label}
                </span>
              ))}
            </div>
          )}

          {/* Search bar */}
          {currentView === 'tools-view' && (
            <div className="relative max-w-md mx-auto w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <iconify-icon icon="solar:magnifer-linear" stroke-width="1.5" class="text-lg"></iconify-icon>
              </div>
              <input
                type="text"
                placeholder="Search tools... compress, merge, sign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full py-3 pl-11 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <iconify-icon icon="solar:close-circle-linear" class="text-lg"></iconify-icon>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ══ TOOLS VIEW ══════════════════════════════════════════════════════ */}
        <div className={currentView === 'tools-view' ? 'block space-y-10' : 'hidden'}>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="stat-item bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-[#378ADD]/20 transition-all"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <iconify-icon icon={stat.icon} class="text-[#378ADD] text-2xl mb-2"></iconify-icon>
                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Category tabs */}
          <div>
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 border-b border-gray-200/60">
              {CATEGORIES.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                    activeCategory === tab.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => setActiveCategory('ai')}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                  activeCategory === 'ai'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                )}
              >
                <iconify-icon icon="solar:stars-linear"></iconify-icon>
                AI Tools
              </button>
            </div>
          </div>

          {/* Tool cards grid */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => openModal(tool)}
                  className="tool-card group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer relative flex flex-col min-h-[148px] shadow-sm hover:border-[#378ADD]/30"
                >
                  {tool.badge && (
                    <span className={clsx(
                      'absolute top-3.5 right-3.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full',
                      tool.badgeClass || ''
                    )}>
                      {tool.badge.text}
                    </span>
                  )}
                  <div className={clsx(
                    'w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
                    tool.iconColorClass
                  )}>
                    <iconify-icon icon={tool.icon} class="text-xl" stroke-width="1.5"></iconify-icon>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight mb-1">{tool.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{tool.desc}</p>
                  <div className="mt-3 flex items-center text-[#378ADD] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Use tool <iconify-icon icon="solar:arrow-right-linear" class="ml-1 transition-transform group-hover:translate-x-1 duration-200"></iconify-icon>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <iconify-icon icon="solar:file-remove-linear" class="text-5xl text-gray-300 mb-4"></iconify-icon>
              <h3 className="text-base font-semibold text-gray-900">No tools found</h3>
              <p className="text-sm text-gray-500 mt-1">Try a different search term or category.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-4 text-xs font-semibold text-[#378ADD] hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Testimonials section */}
          <div className="py-6">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Trusted by professionals worldwide</p>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">What our users say</h2>
            </div>

            {/* Trust logos */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-8 opacity-50">
              {TRUST_LOGOS.map((logo, i) => (
                <span key={i} className="text-sm font-bold text-gray-600 tracking-wider uppercase">{logo}</span>
              ))}
            </div>

            <TestimonialMarquee />
          </div>

          {/* Bottom CTA banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#378ADD] p-8 md:p-12 text-center">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5"></div>
              <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5"></div>
            </div>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">Upgrade anytime</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready for unlimited power?</h2>
              <p className="text-blue-100 text-sm mb-7 max-w-md mx-auto">Unlock all 37+ tools, 1GB file sizes, API access, and zero ads for just $4.99/month.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleNavClick('pricing-view')}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#378ADD] font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm hover:-translate-y-0.5 active:translate-y-0"
                >
                  View pricing
                </button>
                <button className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm">
                  Try free — no card needed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ PRICING VIEW ════════════════════════════════════════════════════ */}
        <div className={currentView === 'pricing-view' ? 'block mt-4' : 'hidden'}>

          {/* Period toggle */}
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={clsx(
                  'px-5 py-2 rounded-full text-sm font-semibold transition-all',
                  pricingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod('annual')}
                className={clsx(
                  'px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
                  pricingPeriod === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                )}
              >
                Annual
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Free</div>
              <div className="mb-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                <span className="text-sm text-gray-500"> /forever</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">No credit card required</p>
              <ul className="space-y-3.5 mb-8 flex-1">
                {[
                  { t: '2 files per day', v: true },
                  { t: 'Max 10MB per file', v: true },
                  { t: 'Basic conversion tools', v: true },
                  { t: 'Ad-supported', v: false },
                  { t: 'API access', v: false },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <iconify-icon
                      icon={item.v ? 'solar:check-circle-linear' : 'solar:close-circle-linear'}
                      class={clsx('text-lg mt-0.5 shrink-0', item.v ? 'text-gray-400' : 'text-red-300')}
                    ></iconify-icon>
                    {item.t}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Current plan
              </button>
            </div>

            {/* Pro - FEATURED */}
            <div className="bg-white border-2 border-[#378ADD] rounded-2xl p-8 flex flex-col shadow-xl relative md:-translate-y-3">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#378ADD] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-md">
                MOST POPULAR
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#378ADD] mb-2">Pro</div>
              <div className="mb-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {pricingPeriod === 'annual' ? '$3.99' : '$4.99'}
                </span>
                <span className="text-sm text-gray-500"> /month</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                {pricingPeriod === 'annual' ? 'Billed $47.88/year · Save $12' : 'Billed monthly · Cancel anytime'}
              </p>
              <ul className="space-y-3.5 mb-8 flex-1">
                {[
                  'Unlimited document processing',
                  'Max 1GB per file',
                  'All 37+ tools (incl. AI)',
                  'No advertisements',
                  'API access',
                  'Priority support 24/7',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-800 font-medium">
                    <iconify-icon icon="solar:check-circle-bold" class="text-[#378ADD] text-lg mt-0.5 shrink-0"></iconify-icon>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-4 bg-[#378ADD] hover:bg-[#2b71b8] rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                Get Pro — {pricingPeriod === 'annual' ? '$3.99' : '$4.99'}/mo
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-3">30-day money-back guarantee</p>
            </div>

            {/* Business */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Business</div>
              <div className="mb-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {pricingPeriod === 'annual' ? '$11.99' : '$14.99'}
                </span>
                <span className="text-sm text-gray-500"> /user/mo</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">Min. 5 seats · Volume discounts available</p>
              <ul className="space-y-3.5 mb-8 flex-1">
                {[
                  'Everything in Pro',
                  'Team seats & management',
                  'Shared workspaces',
                  'SSO / SAML integration',
                  'Custom branding',
                  'SLA 99.9% uptime guarantee',
                  'Dedicated account manager',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <iconify-icon icon="solar:check-circle-linear" class="text-gray-400 text-lg mt-0.5 shrink-0"></iconify-icon>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                Contact Sales →
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mt-16">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h3>
            <div className="space-y-4">
              {[
                { q: 'Is my data secure?', a: 'All uploads are encrypted with 256-bit SSL. Files are automatically deleted from our servers within 2 hours of processing. We never share your data.' },
                { q: 'Can I cancel anytime?', a: 'Yes, absolutely. Cancel your subscription at any time with no penalties. You\'ll keep access until the end of your billing period.' },
                { q: 'Do you offer a free trial for Pro?', a: 'Yes! Start a 7-day free trial of Pro with no credit card required. Full access to all features.' },
                { q: 'What file formats are supported?', a: 'We support PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), images (JPG, PNG, WebP), HTML, and more.' },
              ].map((faq, i) => (
                <details key={i} className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                    {faq.q}
                    <iconify-icon icon="solar:alt-arrow-down-linear" class="text-gray-400 transition-transform duration-200 group-open:rotate-180"></iconify-icon>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ══ VS VIEW ═════════════════════════════════════════════════════════ */}
        <div className={currentView === 'vs-view' ? 'block mt-4' : 'hidden'}>
          <div className="max-w-4xl mx-auto">

            {/* Comparison table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    <th className="py-4 px-6 text-sm font-semibold text-gray-500 w-2/5">Feature</th>
                    <th className="py-4 px-6 text-sm font-bold text-[#378ADD] w-[30%] border-l border-gray-100 bg-blue-50/30">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#378ADD] rounded flex items-center justify-center text-white font-bold text-[10px]">P</div>
                        PDFMaster
                      </div>
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-400 w-[30%] border-l border-gray-100">ILovePDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { feature: 'Free file size limit', us: '100 MB', them: '15 MB', winner: true },
                    { feature: 'AI-powered tools', us: '✓ Yes (5 tools)', them: '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                    { feature: 'Pro subscription price', us: '$4.99/mo', them: '$9.99/mo', winner: true },
                    { feature: 'Total tools available', us: '37+', them: '25', winner: true },
                    { feature: 'No signup required', us: '✓ Yes', them: '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                    { feature: 'Processing speed', us: '2× Faster (Edge CDN)', them: 'Standard', winner: true },
                    { feature: 'API access on free plan', us: '✗ Pro only', them: '✗ Pro only', winner: false },
                    { feature: 'Batch processing', us: '✓ Yes', them: '✓ Yes', winner: false, usClass: 'text-emerald-600', themClass: 'text-emerald-500' },
                    { feature: 'File auto-delete', us: '2 hours', them: '2 hours', winner: false },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/40">
                      <td className="py-4 px-6 text-sm text-gray-700 font-medium">{row.feature}</td>
                      <td className={clsx('py-4 px-6 text-sm font-semibold border-l border-gray-100 bg-blue-50/20', row.usClass || 'text-gray-900')}>
                        {row.us}
                      </td>
                      <td className={clsx('py-4 px-6 text-sm border-l border-gray-100', row.themClass || 'text-gray-400')}>
                        {row.them}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Why us cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: 'solar:stars-bold', color: 'bg-fuchsia-50 text-fuchsia-600', title: 'AI-powered tools — free', desc: 'Chat with PDFs, auto-summarize, and translate documents. Features ILovePDF simply doesn\'t have.' },
                { icon: 'solar:box-minimalistic-bold', color: 'bg-blue-50 text-blue-600', title: 'Bigger free tier', desc: 'Process files up to 100MB without paying. Stop hitting paywalls for everyday tasks.' },
                { icon: 'solar:wallet-bold', color: 'bg-amber-50 text-amber-600', title: 'Half the price', desc: 'Pro at $4.99/mo vs ILovePDF\'s $9.99. Same quality, half the cost.' },
                { icon: 'solar:layers-bold', color: 'bg-emerald-50 text-emerald-600', title: '12 more tools', desc: 'The most comprehensive PDF suite available. If you need a PDF tool, we have it.' },
              ].map((card, i) => (
                <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center mb-4', card.color)}>
                    <iconify-icon icon={card.icon} class="text-xl"></iconify-icon>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">{card.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center bg-gradient-to-br from-[#1e3a5f] to-[#378ADD] rounded-3xl p-10 text-white">
              <h3 className="text-xl font-bold mb-2">Ready to switch?</h3>
              <p className="text-blue-100 text-sm mb-6">Join 2.4M+ professionals who chose the smarter PDF toolkit.</p>
              <button
                onClick={() => handleNavClick('tools-view')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#378ADD] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Try PDFMaster for free
                <iconify-icon icon="solar:arrow-right-linear" class="text-lg"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#378ADD] rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
                <span className="font-bold text-base"><span className="text-[#378ADD]">PDF</span>Master</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
                The world's most powerful PDF toolkit. Free, fast, and secure. Trusted by 2.4M+ professionals worldwide.
              </p>
              <div className="flex items-center gap-3">
                {['solar:twitter-linear', 'solar:github-linear', 'solar:linkedin-linear', 'solar:youtube-linear'].map((icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#378ADD] hover:border-[#378ADD]/40 transition-all">
                    <iconify-icon icon={icon} class="text-lg"></iconify-icon>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'Tools', links: [
                  'Merge PDF', 'Split PDF', 'Compress PDF', 'PDF to Word',
                  'PDF to Excel', 'Word to PDF', 'Sign PDF', 'Edit PDF',
                ],
              },
              {
                title: 'Company', links: [
                  'About us', 'Blog', 'Careers', 'Press kit',
                  'Contact', 'Partners',
                ],
              },
              {
                title: 'Legal', links: [
                  'Privacy policy', 'Terms of service', 'Cookie policy',
                  'GDPR compliance', 'Security',
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-gray-500 hover:text-[#378ADD] transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} PDFMaster Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <iconify-icon icon="solar:shield-check-linear" class="text-emerald-500 text-base"></iconify-icon>
                256-bit SSL encrypted
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <iconify-icon icon="solar:lock-keyhole-linear" class="text-blue-400 text-base"></iconify-icon>
                GDPR compliant
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <iconify-icon icon="solar:cloud-check-linear" class="text-purple-400 text-base"></iconify-icon>
                SOC 2 Type II
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      <UploadModal isOpen={modalState.isOpen} tool={modalState.tool} onClose={closeModal} />

      {/* Compress PDF Modal */}
      <CompressPDFModal
        isOpen={compressModalOpen}
        onClose={() => {
          setCompressModalOpen(false);
          setTimeout(() => { document.body.style.overflow = ''; }, 250);
        }}
      />
    </div>
  );
}

export default App;