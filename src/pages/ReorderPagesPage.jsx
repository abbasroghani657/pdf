import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';
import * as pdfjsLib from 'pdfjs-dist';

// ── pdfjs setup ──────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;


// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumbnail({ pdfDoc, pageNum, orderIndex, draggedIdx, dragOverIdx, onDragStart, onDragEnter, onDrop, onDragEnd }) {
  const ref = useRef(null);
  useEffect(() => {
    (async () => {
      if (!pdfDoc || !ref.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const vp = page.getViewport({ scale: 0.5 });
      const c = ref.current;
      c.width = vp.width; c.height = vp.height;
      page.render({ canvasContext: c.getContext('2d'), viewport: vp });
    })();
  }, [pdfDoc, pageNum]);

  const isDragging = draggedIdx === orderIndex;
  const isDragOver = dragOverIdx === orderIndex;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, orderIndex)}
      onDragEnter={(e) => onDragEnter(e, orderIndex)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => onDrop(e, orderIndex)}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative', borderRadius: 8,
        border: isDragOver ? '2px dashed #4f46e5' : '2px solid #e5e7eb',
        background: isDragOver ? '#eef2ff' : '#f9fafb', transition: 'all .2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8,
        boxShadow: isDragOver ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
        width: '100%', cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragOver ? 'scale(1.02)' : 'none',
        zIndex: isDragOver ? 10 : 1
      }}
      className={clsx("group hover:shadow-md", !isDragging && !isDragOver && "hover:border-indigo-500")}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '141.4%', overflow: 'hidden', background: '#fff', borderRadius: 4, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
        }}>
          <canvas 
            ref={ref} 
            style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} 
          />
        </div>
      </div>
      
      {/* Visual Indicator of Original Page Number */}
      <div style={{
        position: 'absolute', top: -10, left: -10, background: '#111827', color: '#fff', fontSize: 13, fontWeight: 800,
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10
      }} title="Original Page Number">
        {pageNum}
      </div>

      {/* New Position Indicator */}
      <div style={{
        position: 'absolute', bottom: -12, background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 700,
        padding: '2px 10px', borderRadius: 10, border: '2px solid #fff', letterSpacing: 0.5
      }}>
        POS {orderIndex + 1}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReorderPagesPage() {
  const { isPro } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | loading | editor | processing | done | error
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  
  const [sequenceString, setSequenceString] = useState('');
  const [sequence, setSequence] = useState([]); 

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const [processedBlob, setProcessedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const fileInputRef = useRef(null);
  const rawBufRef = useRef(null);
  const [file, setFile] = useState(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'reorder_pages',
    { sequence, sequenceString },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      rawBufRef.current = bytes;
      setFileName(fileName);
      setFileSize(blob.size);
      
      pdfjsLib.getDocument({ data: bytes.slice(0) }).promise.then(doc => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        if (!s?.sequence) {
          const initialSeq = Array.from({length: doc.numPages}, (_, i) => i + 1);
          setSequence(initialSeq);
          setSequenceString(initialSeq.join(', '));
        }
      });
      
      if (s?.sequence) {
         setSequence(s.sequence);
         setSequenceString(s.sequenceString || s.sequence.join(', '));
      }
      setPhase('editor');
    },
    phase === 'editor' || phase === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ── load file ────────────────────────────────────────────────────────────
  const loadFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    if (file.size > isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024) {
      setIsUpgradeOpen(true);
      return;
    }
    setPhase('loading');
    try {
      const buf = await file.arrayBuffer();
      rawBufRef.current = buf;
      const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setFileName(file.name);
      setFileSize(file.size);
      
      const initialSeq = Array.from({length: doc.numPages}, (_, i) => i + 1);
      setSequence(initialSeq);
      setSequenceString(initialSeq.join(', '));
      
      setFile(file);
      setPhase('editor');
    } catch (e) {
      setErrorMsg('Could not read PDF. It may be corrupted or password-protected.');
      setPhase('error');
    }
  };

  const handleSequenceStringChange = (val) => {
    setSequenceString(val);
    const parts = val.split(',').map(s => parseInt(s.trim(), 10));
    const validSequence = parts.filter(n => !isNaN(n) && n >= 1 && n <= totalPages);
    setSequence(validSequence);
  };

  const handleReverse = () => {
    const reversed = [...sequence].reverse();
    setSequence(reversed);
    setSequenceString(reversed.join(', '));
  };

  const handleResetOrder = () => {
    const initialSeq = Array.from({length: totalPages}, (_, i) => i + 1);
    setSequence(initialSeq);
    setSequenceString(initialSeq.join(', '));
  };

  // ── drag and drop ─────────────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (index !== draggedIdx) setDragOverIdx(index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null); setDragOverIdx(null); return;
    }
    const newSeq = [...sequence];
    const [movedItem] = newSeq.splice(draggedIdx, 1);
    newSeq.splice(targetIndex, 0, movedItem);
    setSequence(newSeq);
    setSequenceString(newSeq.join(', '));
    setDraggedIdx(null); setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null); setDragOverIdx(null);
  };

  // ── process ───────────────────────────────────────────────────────────────
  const handleApplyReorder = async () => {
    if (!rawBufRef.current || sequence.length === 0) return;
    setPhase('processing');
    try {
      const originalPdf = await PDFDocument.load(rawBufRef.current, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      
      // Zero-indexed indices
      const indices = sequence.map(n => n - 1);
      
      const copiedPages = await newPdf.copyPages(originalPdf, indices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const bytes = await newPdf.save();
      setProcessedBlob(new Blob([bytes], { type: 'application/pdf' }));
      setPhase('done');
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to process PDF.');
      setPhase('error');
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    const base = fileName.replace(/\.pdf$/i, '');
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `${base}_reordered.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null); setSequence([]); setSequenceString(''); setTotalPages(0);
    setFileName(''); setProcessedBlob(null); setErrorMsg('');
    rawBufRef.current = null;
    clearSession();
    setPhase('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (phase !== 'editor' && phase !== 'processing') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-indigo-50 text-indigo-600">
            <iconify-icon icon="solar:sort-from-bottom-to-top-bold" class="text-3xl"></iconify-icon>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Reorder PDF Pages</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">Sort, reverse, repeat, or arrange the pages of your PDF in any order you like.</p>
        </div>

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#111' }}>Done! PDF is Reordered.</h2>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>Your document is ready to download in its new sequence.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleDownload} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-800 transition-all">
                ⬇ Download PDF
              </button>
              <button onClick={handleReset} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-100 transition-all">
                Reorder another
              </button>
            </div>
          </div>
        ) : phase === 'error' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', marginBottom: 28 }}>{errorMsg}</p>
            <button onClick={handleReset} style={{ background: '#e03e3e', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Try again</button>
          </div>
        ) : (
          <div
            onDrop={e => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files?.[0]); }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2.5px dashed ${isDragging ? '#4f46e5' : '#d1d5db'}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              background: isDragging ? '#eef2ff' : '#fff', transition: 'all .2s',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              maxWidth: 640, margin: '0 auto'
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => loadFile(e.target.files?.[0])} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>{phase === 'loading' ? '⏳' : '📄'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}>
              {phase === 'loading' ? 'Loading PDF pages...' : 'Select PDF file'}
            </h2>
            {phase !== 'loading' && (
              <>
                <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>Drag & drop your PDF here, or click to browse</p>
                <span style={{ background: '#4f46e5', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14 }} className="hover:bg-indigo-700 transition-all">
                  Choose PDF file
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR + PROCESSING
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden', background: '#f9fafb' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── TOP TOOLBAR ── */}
      <div style={{
        flexShrink: 0, background: '#1f2937', color: '#e5e7eb', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Sequence Editor */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Type your desired page sequence
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="text" 
              value={sequenceString}
              onChange={(e) => handleSequenceStringChange(e.target.value)}
              placeholder="e.g. 1, 3, 2, 4, 4, 5"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #4b5563', background: '#111827', color: '#fff', outline: 'none', fontSize: 15, fontWeight: 600, letterSpacing: 1 }}
              className="focus:border-[#4f46e5]"
            />
            <button onClick={handleReverse} title="Reverse Order" style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
              <iconify-icon icon="solar:round-transfer-horizontal-bold"></iconify-icon> Reverse
            </button>
            <button onClick={handleResetOrder} title="Reset to Original" style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
              Reset
            </button>
          </div>
        </div>

        {/* Apply/Close */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 2 }}>
          <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 600, paddingBottom: 6 }} className="hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleApplyReorder} 
            disabled={sequence.length === 0}
            style={{ background: sequence.length > 0 ? '#4f46e5' : '#374151', color: sequence.length > 0 ? '#fff' : '#6b7280', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 15, fontWeight: 700, cursor: sequence.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }} 
            className="hover:bg-indigo-500 transition-all shadow-md"
          >
            Apply Order
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', position: 'relative' }}>
        {phase === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Processing PDF...</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Rebuilding document in your new sequence.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Live Preview</h3>
               <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '4px 12px', borderRadius: 20 }}>
                 Final Document will have {sequence.length} pages
               </span>
            </div>
            
            {sequence.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '64px 20px', color: '#6b7280', fontSize: 15 }}>
                  <iconify-icon icon="solar:clipboard-remove-linear" class="text-4xl mb-3 opacity-50"></iconify-icon>
                  <p>Sequence is empty. Please type valid page numbers in the input field above.</p>
               </div>
            ) : (
               <div style={{
                 display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 32, paddingBottom: 64
               }}>
                 {sequence.map((n, idx) => (
                   <Thumbnail
                     key={`${n}-${idx}`}
                     pdfDoc={pdfDoc}
                     pageNum={n}
                     orderIndex={idx}
                     draggedIdx={draggedIdx}
                     dragOverIdx={dragOverIdx}
                     onDragStart={handleDragStart}
                     onDragEnter={handleDragEnter}
                     onDrop={handleDrop}
                     onDragEnd={handleDragEnd}
                   />
                 ))}
               </div>
            )}
          </>
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Reorder Pages" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
