import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { TOOLS_DATA } from '../data/tools';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';

// ── pdfjs setup ──────────────────────────────────────────────────────────────
import { pdfjsLib } from '../utils/pdfjs-setup.js';


// ── Page Canvas ───────────────────────────────────────────────────────────────
function PdfPageCanvas({ pdfDoc, pageNum, scale, marked, onToggle }) {
  const canvasRef = useRef(null);
  const renderTask = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pdfDoc || !canvasRef.current) return;
      if (renderTask.current) { try { renderTask.current.cancel(); } catch (_) {} }
      const page = await pdfDoc.getPage(pageNum);
      const vp = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      renderTask.current = page.render({ canvasContext: ctx, viewport: vp });
      try { await renderTask.current.promise; } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div
      id={`page-${pageNum}`}
      style={{ position: 'relative', display: 'inline-block', margin: '0 auto 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', opacity: marked ? 0.35 : 1, transition: 'opacity .2s' }} />
      {marked && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ background: '#e03e3e', color: '#fff', padding: '8px 20px', borderRadius: 6, fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
            ✕ Marked for deletion
          </span>
        </div>
      )}
      <button
        onClick={() => onToggle(pageNum)}
        title={marked ? 'Restore page' : 'Mark for deletion'}
        style={{
          position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%',
          border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 16, lineHeight: 1,
          background: marked ? '#22c55e' : '#e03e3e', color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s', zIndex: 10
        }}
      >
        {marked ? '↺' : '✕'}
      </button>
    </div>
  );
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumbnail({ pdfDoc, pageNum, marked, onToggle, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    (async () => {
      if (!pdfDoc || !ref.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const vp = page.getViewport({ scale: 0.18 });
      const c = ref.current;
      c.width = vp.width; c.height = vp.height;
      page.render({ canvasContext: c.getContext('2d'), viewport: vp });
    })();
  }, [pdfDoc, pageNum]);

  return (
    <div
      onClick={() => { onClick(pageNum); onToggle(pageNum); }}
      style={{
        position: 'relative', cursor: 'pointer', borderRadius: 8,
        border: marked ? '2.5px solid #e03e3e' : '2px solid #e5e7eb',
        overflow: 'hidden', background: '#f9fafb', transition: 'border .15s',
      }}
    >
      <canvas ref={ref} style={{ width: '100%', display: 'block', opacity: marked ? 0.5 : 1 }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700,
        textAlign: 'center', padding: '3px 0'
      }}>
        {marked ? <span style={{ color: '#fca5a5' }}>✕ {pageNum}</span> : pageNum}
      </div>
      {marked && (
        <div style={{
          position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%',
          background: '#e03e3e', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 9, fontWeight: 900
        }}>✕</div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DeletePagesPage() {
  const { isPro } = useAuth();
  const tool = TOOLS_DATA.find(t => t.title === 'Delete pages');

  const [phase, setPhase] = useState('idle'); // idle | loading | editor | processing | done | error
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);        // pdfjs doc (for rendering)
  const [marked, setMarked] = useState(new Set());
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const viewerRef = useRef(null);
  const rawBufRef = useRef(null); // keep ArrayBuffer for pdf-lib processing
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'delete_pages',
    { marked: Array.from(marked), currentPage },
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
      });
      
      setMarked(new Set(s?.marked || []));
      setCurrentPage(s?.currentPage || 1);
      setPhase('editor');
    },
    phase === 'editor' || phase === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ── load file ────────────────────────────────────────────────────────────
  const loadFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    if (file.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
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
      setMarked(new Set());
      setCurrentPage(1);
      setFile(file);
      setPhase('editor');
    } catch (e) {
      setErrorMsg('Could not read PDF. It may be corrupted or password-protected.');
      setPhase('error');
    }
  };

  const toggle = useCallback((pageNum) => {
    setMarked(prev => {
      const n = new Set(prev);
      n.has(pageNum) ? n.delete(pageNum) : n.add(pageNum);
      return n;
    });
  }, []);

  const scrollToPage = (n) => {
    const el = document.getElementById(`page-${n}`);
    if (el && viewerRef.current) {
      viewerRef.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
      setCurrentPage(n);
    }
  };

  // ── scroll spy ───────────────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onScroll = () => {
      for (let i = 1; i <= totalPages; i++) {
        const el = document.getElementById(`page-${i}`);
        if (el && el.offsetTop >= viewer.scrollTop - 40) { setCurrentPage(i); break; }
      }
    };
    viewer.addEventListener('scroll', onScroll, { passive: true });
    return () => viewer.removeEventListener('scroll', onScroll);
  }, [totalPages, phase]);

  // ── process ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!rawBufRef.current || marked.size === 0) return;
    setPhase('processing');
    try {
      const pdfLibDoc = await PDFDocument.load(rawBufRef.current, { ignoreEncryption: true });
      const toRemove = Array.from(marked).sort((a, b) => b - a);
      toRemove.forEach(n => pdfLibDoc.removePage(n - 1));
      const bytes = await pdfLibDoc.save();
      setProcessedBlob(new Blob([bytes], { type: 'application/pdf' }));
      setPhase('done');
    } catch (e) {
      setErrorMsg('Failed to process PDF.');
      setPhase('error');
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    const base = fileName.replace(/\.pdf$/i, '');
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `${base}_edited.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null); setMarked(new Set()); setTotalPages(0);
    setFileName(''); setProcessedBlob(null); setErrorMsg('');
    rawBufRef.current = null;
    clearSession();
    setPhase('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAllMarks = () => setMarked(new Set());

  // ─────────────────────────────────────────────────────────────────────────
  // IDLE / LOADING / ERROR / DONE → standard card layout
  // ─────────────────────────────────────────────────────────────────────────
  if (phase !== 'editor' && phase !== 'processing') {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 640, margin: '64px auto', padding: '0 24px' }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#111' }}>Done! PDF is ready.</h2>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>
              {totalPages - marked.size} pages remain after removing {marked.size} page{marked.size > 1 ? 's' : ''}.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleDownload} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                ⬇ Download PDF
              </button>
              <button onClick={handleReset} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Edit another
              </button>
            </div>
          </div>
        ) : phase === 'error' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48 }}>
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
              border: `2.5px dashed ${isDragging ? '#e03e3e' : '#d1d5db'}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              background: isDragging ? '#fff5f5' : '#fff', transition: 'all .2s',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
              onChange={e => loadFile(e.target.files?.[0])} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>{phase === 'loading' ? '⏳' : '📄'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}>
              {phase === 'loading' ? 'Loading PDF...' : 'Delete Pages from PDF'}
            </h2>
            {phase !== 'loading' && (
              <>
                <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>Drag & drop your PDF here, or click to browse</p>
                <span style={{ background: '#e03e3e', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
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
  // EDITOR + PROCESSING → full viewport two-panel layout
  // ─────────────────────────────────────────────────────────────────────────
  const hint = marked.size === 0
    ? 'Click a page thumbnail or the ✕ button on any page to mark it for deletion.'
    : marked.size === totalPages
      ? '⚠ You cannot delete all pages — at least one must remain.'
      : `${marked.size} page${marked.size > 1 ? 's' : ''} selected. Click "Delete marked pages" when ready.`;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden', background: '#f9fafb' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── TOP TOOLBAR ── */}
      <div style={{
        flexShrink: 0, background: '#1f2937', color: '#e5e7eb', padding: '0 20px',
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
      }}>
        {/* File name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{fileName}</span>
        </div>

        {/* Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#374151', borderRadius: 8, padding: '4px 12px' }}>
          <button onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>▲</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', minWidth: 72, textAlign: 'center' }}>
            Page {currentPage} / {totalPages}
          </span>
          <button onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))}
            style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>▼</button>
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#374151', borderRadius: 8, padding: '4px 10px' }}>
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>−</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
            style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>+</button>
        </div>

        {/* Close */}
        <button onClick={handleReset}
          style={{ background: 'none', border: '1px solid #4b5563', color: '#9ca3af', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ✕ Close
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: PDF Viewer */}
        <div ref={viewerRef} style={{
          flex: 1, overflowY: 'auto', overflowX: 'auto',
          background: '#3d4043', padding: '32px 48px',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {phase === 'processing' ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#d1d5db' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
              <p style={{ fontSize: 18, fontWeight: 700 }}>Processing PDF...</p>
            </div>
          ) : (
            Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <PdfPageCanvas
                key={n}
                pdfDoc={pdfDoc}
                pageNum={n}
                scale={scale}
                marked={marked.has(n)}
                onToggle={toggle}
              />
            ))
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{
          width: 280, flexShrink: 0, background: '#fff', borderLeft: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111' }}>Delete Pages</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
              Click pages to mark them for deletion. Marked pages will be removed from the final PDF.
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{totalPages}</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>Total Pages</div>
            </div>
            <div style={{ flex: 1, background: marked.size > 0 ? '#fff5f5' : '#f9fafb', border: `1px solid ${marked.size > 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center', transition: 'all .2s' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: marked.size > 0 ? '#e03e3e' : '#111' }}>{marked.size}</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>Marked</div>
            </div>
          </div>

          {/* Hint */}
          <div style={{ padding: '10px 16px 6px', fontSize: 11.5, color: marked.size === 0 ? '#6b7280' : '#b91c1c', background: marked.size > 0 ? '#fff5f5' : 'transparent', fontWeight: 500, lineHeight: 1.5, transition: 'all .2s' }}>
            {hint}
          </div>

          {/* Thumbnails */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Thumbnail
                  key={n}
                  pdfDoc={pdfDoc}
                  pageNum={n}
                  marked={marked.has(n)}
                  onToggle={toggle}
                  onClick={scrollToPage}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleDelete}
              disabled={marked.size === 0 || marked.size === totalPages}
              style={{
                background: (marked.size > 0 && marked.size < totalPages) ? '#e03e3e' : '#f3f4f6',
                color: (marked.size > 0 && marked.size < totalPages) ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14,
                cursor: (marked.size > 0 && marked.size < totalPages) ? 'pointer' : 'not-allowed',
                transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              🗑 Delete {marked.size > 0 ? `${marked.size} ` : ''}Marked Page{marked.size !== 1 ? 's' : ''}
            </button>
            <button
              onClick={handleDownload}
              disabled={!processedBlob}
              style={{
                background: processedBlob ? '#111' : '#f3f4f6',
                color: processedBlob ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14,
                cursor: processedBlob ? 'pointer' : 'not-allowed', transition: 'all .2s'
              }}
            >
              ⬇ Save PDF
            </button>
            {marked.size > 0 && (
              <button onClick={clearAllMarks} style={{
                background: 'none', color: '#6b7280', border: '1px solid #e5e7eb',
                borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>
                Clear all marks
              </button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Delete Pages" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}

