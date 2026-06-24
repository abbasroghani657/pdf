import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';

// pdfjs — uses Vite ?url worker for correct production builds
import { pdfjsLib } from '../utils/pdfjs-setup.js';


// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumbnail({ pdfDoc, pageNum, rotation, isSelected, onRotatePage, onSelectPage }) {
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

  return (
    <div
      onClick={() => onSelectPage(pageNum)}
      style={{
        position: 'relative', borderRadius: 8,
        border: isSelected ? '2px solid #0d9488' : '2px solid #e5e7eb',
        background: isSelected ? '#f0fdfa' : '#f9fafb', transition: 'all .2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8,
        boxShadow: isSelected ? '0 0 0 3px rgba(13,148,136,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
        width: '100%', cursor: 'pointer'
      }}
      className={clsx("group hover:shadow-md", !isSelected && "hover:border-[#0d9488]")}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '141.4%', overflow: 'hidden', background: '#fff', borderRadius: 4 }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
        }}>
          <canvas 
            ref={ref} 
            style={{ 
              maxWidth: '100%', maxHeight: '100%', display: 'block',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
        </div>
        {isSelected && (
          <div style={{
            position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: '50%',
            background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 5
          }}>
            <iconify-icon icon="solar:check-read-bold" class="text-xs"></iconify-icon>
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, opacity: 0,
        transition: 'opacity .2s'
      }} className="group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onRotatePage(pageNum, -90); }}
          title="Rotate Left"
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(17, 24, 39, 0.8)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}
          className="hover:bg-[#0d9488] hover:scale-110 transition-all"
        >
          <iconify-icon icon="solar:round-arrow-left-bold" class="text-lg"></iconify-icon>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRotatePage(pageNum, 90); }}
          title="Rotate Right"
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(17, 24, 39, 0.8)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}
          className="hover:bg-[#0d9488] hover:scale-110 transition-all"
        >
          <iconify-icon icon="solar:round-arrow-right-bold" class="text-lg"></iconify-icon>
        </button>
      </div>
      <div style={{
        position: 'absolute', bottom: -12, background: isSelected ? '#0d9488' : '#111827', color: '#fff', fontSize: 12, fontWeight: 700,
        padding: '2px 10px', borderRadius: 10, border: '2px solid #fff'
      }}>
        {pageNum}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RotatePagesPage({ lang = 'en', ui, toolData }) {
  const { isPro } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | loading | editor | processing | done | error
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [rotations, setRotations] = useState({}); // { pageNum: angle }
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [processedBlob, setProcessedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const rawBufRef = useRef(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'rotate_pages',
    { rotations, selectedPages: Array.from(selectedPages) },
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
      
      setRotations(s?.rotations || {});
      setSelectedPages(new Set(s?.selectedPages || []));
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
      setRotations({});
      setSelectedPages(new Set());
      setFile(file);
      setPhase('editor');
    } catch (e) {
      setErrorMsg('Could not read PDF. It may be corrupted or password-protected.');
      setPhase('error');
    }
  };

  const handleRotatePage = useCallback((pageNum, angle) => {
    setRotations(prev => {
      const current = prev[pageNum] || 0;
      return { ...prev, [pageNum]: current + angle };
    });
  }, []);

  const handleSelectPage = useCallback((pageNum) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  }, []);

  const handleRotateAll = (angle) => {
    setRotations(prev => {
      const next = { ...prev };
      const targetPages = selectedPages.size > 0 
        ? Array.from(selectedPages) 
        : Array.from({ length: totalPages }, (_, i) => i + 1);

      for (const i of targetPages) {
        const current = next[i] || 0;
        next[i] = current + angle;
      }
      return next;
    });
  };

  // ── process ───────────────────────────────────────────────────────────────
  const handleApplyRotation = async () => {
    if (!rawBufRef.current) return;
    setPhase('processing');
    try {
      const pdfLibDoc = await PDFDocument.load(rawBufRef.current, { ignoreEncryption: true });
      const pages = pdfLibDoc.getPages();
      
      for (let i = 1; i <= totalPages; i++) {
        const r = rotations[i];
        if (r && r % 360 !== 0) {
          const page = pages[i - 1];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + r));
        }
      }

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
    a.href = url; a.download = `${base}_rotated.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null); setRotations({}); setTotalPages(0); setSelectedPages(new Set());
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
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-teal-50 text-teal-600">
            <iconify-icon icon="solar:refresh-bold" class="text-3xl"></iconify-icon>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{toolData?.title || 'Rotate PDF Pages'}</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">Visually rotate individual pages or all pages of your PDF.</p>
        </div>

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#111' }}>Done! PDF is rotated.</h2>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>Your document is ready to download.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleDownload} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-800 transition-all">
                ⬇ Download Rotated PDF
              </button>
              <button onClick={handleReset} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-100 transition-all">
                Rotate another
              </button>
            </div>
          </div>
        ) : phase === 'error' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>{ui?.tools_common?.something_went_wrong || (ui?.tools_common?.something_went_wrong || 'Something went wrong')}</h2>
            <p style={{ color: '#6b7280', marginBottom: 28 }}>{errorMsg}</p>
            <button onClick={handleReset} style={{ background: '#e03e3e', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{ui?.tools_common?.try_again || 'Try again'}</button>
          </div>
        ) : (
          <div
            onDrop={e => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files?.[0]); }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2.5px dashed ${isDragging ? '#0d9488' : '#d1d5db'}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              background: isDragging ? '#f0fdfa' : '#fff', transition: 'all .2s',
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
                <span style={{ background: '#0d9488', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14 }} className="hover:bg-teal-700 transition-all">
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
        flexShrink: 0, background: '#1f2937', color: '#e5e7eb', padding: '0 20px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {/* File name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{fileName}</span>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => handleRotateAll(-90)} style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
            <iconify-icon icon="solar:round-arrow-left-bold"></iconify-icon> Left
          </button>
          <button onClick={() => handleRotateAll(90)} style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
            Right <iconify-icon icon="solar:round-arrow-right-bold"></iconify-icon>
          </button>
          
          <div style={{ width: 1, height: 24, background: '#4b5563', margin: '0 4px' }} />
          
          {selectedPages.size > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>{selectedPages.size} selected</span>
              <button onClick={() => setSelectedPages(new Set())} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }} className="hover:text-white">Clear</button>
            </div>
          ) : (
             <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>All pages</span>
          )}
        </div>

        {/* Apply/Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' }}>
          <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} className="hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleApplyRotation} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} className="hover:bg-teal-700 transition-all shadow-md">
            Save Rotations
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', position: 'relative' }}>
        {phase === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Processing PDF...</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Applying your rotations to the document.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32, paddingBottom: 64
          }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <Thumbnail
                key={n}
                pdfDoc={pdfDoc}
                pageNum={n}
                rotation={rotations[n] || 0}
                isSelected={selectedPages.has(n)}
                onSelectPage={handleSelectPage}
                onRotatePage={handleRotatePage}
              />
            ))}
          </div>
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Rotate Pages" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}

