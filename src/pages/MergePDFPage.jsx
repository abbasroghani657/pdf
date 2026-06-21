import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import clsx from 'clsx';
import { processWithQueue } from '../utils/queueApi';

// Use bundled local worker, fallback to CDN if it fails
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch(e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
}

const { getDocument } = pdfjsLib;



// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Select PDFs', 'Arrange Order', 'Merge'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={s} className="flex items-center">
            <div className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300',
              active ? 'bg-[#378ADD] text-white shadow-lg shadow-blue-200' :
              done ? 'bg-emerald-100 text-emerald-700' :
              'bg-gray-100 text-gray-400'
            )}>
              <div className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                active ? 'bg-white text-[#378ADD]' :
                done ? 'bg-emerald-500 text-white' :
                'bg-gray-300 text-white'
              )}>
                {done ? '✓' : num}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx('h-0.5 w-8 mx-1 transition-all', done ? 'bg-emerald-400' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── PDF Card component ─────────────────────────────────────────────────────────
function PdfCard({ pdf, index, total, onRemove, onMoveUp, onMoveDown, isDragging, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={clsx(
        'group relative bg-white border-2 rounded-2xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none',
        isDragging ? 'opacity-40 border-dashed border-[#378ADD] scale-95' : 'border-gray-100 hover:border-[#378ADD]/40 hover:shadow-lg'
      )}
    >
      {/* Drag handle + order badge */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
          <div className="w-8 h-8 bg-[#378ADD] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
            {index + 1}
          </div>
          <iconify-icon icon="solar:hamburger-menu-linear" class="text-gray-300 text-lg mt-1 group-hover:text-gray-400" />
        </div>

        {/* Thumbnail */}
        <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shrink-0 shadow-sm">
          {pdf.thumbnail ? (
            <img src={pdf.thumbnail} alt={`Page 1 of ${pdf.name}`} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <iconify-icon icon="solar:document-bold" class="text-3xl text-[#378ADD]/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate leading-snug mb-1">{pdf.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              <iconify-icon icon="solar:document-linear" class="text-xs" />
              {!pdf.metaLoaded
                ? <span className="flex items-center gap-1"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Loading</span>
                : pdf.pageCount
                  ? `${pdf.pageCount} page${pdf.pageCount > 1 ? 's' : ''}`
                  : '—'
              }
            </span>
            <span className="text-xs text-gray-400">
              {(pdf.size / 1024).toFixed(0)} KB
            </span>
          </div>

          {/* Page range preview */}
          {pdf.pageCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: Math.min(pdf.pageCount, 8) }, (_, i) => (
                <span key={i} className="w-5 h-6 bg-gray-100 border border-gray-200 rounded text-[9px] flex items-center justify-center text-gray-500 font-medium">
                  {i + 1}
                </span>
              ))}
              {pdf.pageCount > 8 && (
                <span className="h-6 px-1 bg-gray-100 border border-gray-200 rounded text-[9px] flex items-center justify-center text-gray-400">
                  +{pdf.pageCount - 8}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 ml-auto shrink-0">
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
            title="Remove"
          >
            <iconify-icon icon="solar:trash-bin-trash-linear" class="text-base" />
          </button>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors disabled:opacity-30"
            title="Move up"
          >
            <iconify-icon icon="solar:alt-arrow-up-linear" class="text-base" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors disabled:opacity-30"
            title="Move down"
          >
            <iconify-icon icon="solar:alt-arrow-down-linear" class="text-base" />
          </button>
        </div>
      </div>

      {/* Page start/end badge at bottom */}
      {pdf.pageCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span>Starts at page <strong className="text-gray-600">{pdf.startPage}</strong></span>
          <span>Ends at page <strong className="text-gray-600">{pdf.endPage}</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────────
function SummaryBar({ pdfs }) {
  const totalPages = pdfs.reduce((acc, p) => acc + (p.pageCount || 0), 0);
  const totalSize = pdfs.reduce((acc, p) => acc + (p.size || 0), 0);
  const formattedSize = (() => {
    if (totalSize <= 0) return '—';
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(0)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  })();

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
      {[
        { label: 'PDFs', value: pdfs.length, icon: 'solar:documents-bold', color: 'text-[#378ADD] bg-blue-50' },
        { label: 'Total Pages', value: totalPages || '—', icon: 'solar:document-bold', color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Total Size', value: formattedSize, icon: 'solar:database-bold', color: 'text-purple-600 bg-purple-50' },
      ].map(stat => (
        <div key={stat.label} className="bg-white rounded-2xl p-2 sm:p-4 border border-gray-100 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 shadow-sm text-center sm:text-left min-w-0">
          <div className={clsx('w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0', stat.color)}>
            <iconify-icon icon={stat.icon} class="text-xs sm:text-lg" />
          </div>
          <div className="min-w-0 w-full">
            <p className="text-xs sm:text-lg font-bold text-gray-900 leading-none truncate">{stat.value}</p>
            <p className="text-[9px] sm:text-xs text-gray-400 mt-1 truncate">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function MergePDFPage({ lang = 'en' }) {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const fileInputRef = useRef(null);

  // ── Load PDF metadata (page count + thumbnail) ──────────────────────────────
  const loadPdfMeta = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Try loading the PDF
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages;

      // Render page 1 as thumbnail
      try {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
        return { pageCount, thumbnail, metaLoaded: true };
      } catch {
        return { pageCount, thumbnail: null, metaLoaded: true };
      }
    } catch(err) {
      console.warn('pdfjs failed to load:', file.name, err.message);
      // Fallback: try to estimate page count from file size
      const estimatedPages = Math.max(1, Math.round(file.size / 50000));
      return { pageCount: estimatedPages, thumbnail: null, metaLoaded: true };
    }
  };

  // ── Compute cumulative page numbers ─────────────────────────────────────────
  const computePageRanges = (list) => {
    let cumulative = 0;
    return list.map(pdf => {
      const startPage = cumulative + 1;
      const endPage = cumulative + (pdf.pageCount || 0);
      cumulative = endPage;
      return { ...pdf, startPage, endPage };
    });
  };

  // ── Add files ────────────────────────────────────────────────────────────────
  const addFiles = useCallback(async (fileList) => {
    const validFiles = Array.from(fileList).filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) {
      toast.error('Please select PDF files only.');
      return;
    }

    const newEntries = validFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      pageCount: 0,
      thumbnail: null,
      startPage: 0,
      endPage: 0,
      metaLoaded: false,
    }));

    setPdfs(prev => {
      const merged = [...prev, ...newEntries];
      return computePageRanges(merged);
    });

    // Load metadata asynchronously
    for (const entry of newEntries) {
      const meta = await loadPdfMeta(entry.file);
      setPdfs(prev => {
        const updated = prev.map(p => p.id === entry.id ? { ...p, ...meta } : p);
        return computePageRanges(updated);
      });
    }

    if (step === 1) setStep(2);
  }, [step]);

  // ── Drag & drop zone ─────────────────────────────────────────────────────────
  const handleZoneDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Card drag-to-reorder ─────────────────────────────────────────────────────
  const handleCardDragStart = (idx) => setDraggingIdx(idx);
  const handleCardDragOver = (e, idx) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    setPdfs(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(draggingIdx, 1);
      arr.splice(idx, 0, moved);
      setDraggingIdx(idx);
      return computePageRanges(arr);
    });
  };
  const handleCardDrop = () => setDraggingIdx(null);

  // ── Move up/down ─────────────────────────────────────────────────────────────
  const moveCard = (idx, dir) => {
    setPdfs(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return computePageRanges(arr);
    });
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const removeCard = (id) => {
    setPdfs(prev => computePageRanges(prev.filter(p => p.id !== id)));
  };

  // ── Merge & Download ─────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (pdfs.length < 2) {
      toast.error('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setStep(3);

    try {
      const formData = new FormData();
      formData.append('tool', 'Merge PDF');
      pdfs.forEach((pdf) => formData.append('file', pdf.file, pdf.name));

      const res = await processWithQueue(`/api/process`, formData, (status) => {
        // We can update state if needed based on queue position
      }, false, true);

      // Fetch the file and trigger a real browser download
      const token = localStorage.getItem('pdfmaster_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const downloadRes = await fetch(res.url, { headers });
      if (!downloadRes.ok) throw new Error('Download failed');
      const blob = await downloadRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      toast.success('PDFs merged successfully!');
      setTimeout(() => setStep(2), 1500);
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = pdfs.reduce((acc, p) => acc + (p.pageCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-10 md:pb-0">
      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <iconify-icon icon="solar:arrow-left-linear" class="text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-100 rounded-xl flex items-center justify-center">
              <iconify-icon icon="solar:documents-bold" class="text-cyan-600 text-base" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-none">Merge PDF</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">Combine multiple PDFs into one</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {pdfs.length > 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#378ADD] hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors border border-blue-100"
              >
                <iconify-icon icon="solar:add-circle-linear" class="text-sm" />
                Add More
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Steps */}
        <StepIndicator step={step} />

        {/* ── STEP 1: Drop zone (shown when no files or as additional area) ── */}
        {pdfs.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleZoneDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-3xl p-12 sm:p-20 text-center cursor-pointer transition-all duration-300',
              isDragOver
                ? 'border-[#378ADD] bg-blue-50/80 scale-[0.99]'
                : 'border-gray-200 bg-white hover:border-[#378ADD]/50 hover:bg-blue-50/20'
            )}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
              <iconify-icon icon="solar:documents-bold" class="text-white text-4xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Select PDFs to Merge
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Drag & drop multiple PDF files here, or click to browse. You can add more files after selecting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#378ADD] text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#2b71b8] transition-all active:scale-95">
                <iconify-icon icon="solar:folder-open-bold" class="text-lg" />
                Choose PDF Files
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-6">PDF files only • Max 10MB per file (Free tier)</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <SummaryBar pdfs={pdfs} />

            {/* PDF list */}
            <div className="space-y-3 mb-6">
              {pdfs.map((pdf, idx) => (
                <PdfCard
                  key={pdf.id}
                  pdf={pdf}
                  index={idx}
                  total={pdfs.length}
                  onRemove={() => removeCard(pdf.id)}
                  onMoveUp={() => moveCard(idx, -1)}
                  onMoveDown={() => moveCard(idx, 1)}
                  isDragging={draggingIdx === idx}
                  onDragStart={() => handleCardDragStart(idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDrop={handleCardDrop}
                />
              ))}

              {/* Add another PDF inline card */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleZoneDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-3',
                  isDragOver ? 'border-[#378ADD] bg-blue-50' : 'border-gray-200 hover:border-[#378ADD]/50 hover:bg-blue-50/30'
                )}
              >
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-[#378ADD]">
                  <iconify-icon icon="solar:add-circle-linear" class="text-xl" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700">Add another PDF</p>
                  <p className="text-xs text-gray-400">Click or drag & drop</p>
                </div>
              </div>
            </div>

            {/* Merge CTA */}
            <div className="sticky bottom-4 md:bottom-6 z-20">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 border border-gray-100 shadow-2xl shadow-blue-100 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-gray-900">
                    Ready to merge <span className="text-[#378ADD]">{pdfs.length} PDFs</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {totalPages} total pages → 1 combined file
                  </p>
                </div>
                <button
                  onClick={handleMerge}
                  disabled={isProcessing || pdfs.length < 2}
                  className={clsx(
                    'flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 shadow-lg w-full sm:w-auto',
                    pdfs.length < 2
                      ? 'bg-gray-300 cursor-not-allowed shadow-none'
                      : isProcessing
                      ? 'bg-[#378ADD]/70 cursor-wait'
                      : 'bg-gradient-to-r from-[#378ADD] to-blue-600 hover:from-[#2b71b8] hover:to-blue-700 shadow-blue-200'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Merging…
                    </>
                  ) : (
                    <>
                      <iconify-icon icon="solar:documents-bold" class="text-lg" />
                      Merge & Download
                    </>
                  )}
                </button>
              </div>
              {pdfs.length < 2 && (
                <p className="text-center text-xs text-amber-500 mt-2 font-medium">
                  ⚠ Add at least 2 PDF files to merge
                </p>
              )}
            </div>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
