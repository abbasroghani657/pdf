import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';
// pdfjs — uses Vite ?url worker for correct production builds
import { pdfjsLib } from '../utils/pdfjs-setup.js';



// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumbnail({ item, pdfDoc, onRemove }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (item.type !== 'original' || !pdfDoc || !ref.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(item.pageNum);
      if (cancelled) return;
      const vp = page.getViewport({ scale: 0.5 });
      const c = ref.current;
      if (!c) return;
      c.width = vp.width; c.height = vp.height;
      page.render({ canvasContext: c.getContext('2d'), viewport: vp });
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, item]);

  return (
    <div
      style={{
        position: 'relative', borderRadius: 8,
        border: item.type === 'blank' ? '2px dashed #94a3b8' : '2px solid #e5e7eb',
        background: item.type === 'blank' ? '#f1f5f9' : '#f9fafb', transition: 'all .2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        width: 140, flexShrink: 0
      }}
      className="group hover:border-blue-500 hover:shadow-md"
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '141.4%', overflow: 'hidden', background: '#fff', borderRadius: 4 }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
        }}>
          {item.type === 'original' ? (
             <canvas ref={ref} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
          ) : (
             <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>BLANK</div>
          )}
        </div>
      </div>
      
      {/* Remove Button */}
      <div style={{
        position: 'absolute', top: -8, right: -8, opacity: 0, transition: 'opacity .2s', zIndex: 10
      }} className="group-hover:opacity-100">
        <button
          onClick={() => onRemove(item.id)}
          title="Remove Page"
          style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
          className="hover:bg-red-600 hover:scale-110 transition-all"
        >
          <iconify-icon icon="solar:trash-bin-trash-bold" class="text-sm"></iconify-icon>
        </button>
      </div>

      <div style={{
        position: 'absolute', bottom: -12, background: item.type === 'blank' ? '#cbd5e1' : '#111827', color: item.type === 'blank' ? '#334155' : '#fff', fontSize: 11, fontWeight: 700,
        padding: '2px 10px', borderRadius: 10, border: '2px solid #fff'
      }}>
        {item.type === 'blank' ? 'NEW' : `PAGE ${item.pageNum}`}
      </div>
    </div>
  );
}

// ── Insert Button ────────────────────────────────────────────────────────────
function InsertButton({ onInsert, position }) {
  return (
    <div 
      onClick={() => onInsert(position)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 200, cursor: 'pointer',
        opacity: 0.3, transition: 'all .2s', zIndex: 5
      }}
      className="group hover:opacity-100"
      title="Insert blank page here"
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
        transform: 'scale(0.9)'
      }} className="group-hover:scale-110 transition-all">
        <iconify-icon icon="solar:add-circle-bold" class="text-xl"></iconify-icon>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BlankPagesPage() {
  const { isPro } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | loading | editor | processing | done | error
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  
  // sequence: array of objects { id, type: 'original'|'blank', pageNum? }
  const [sequence, setSequence] = useState([]); 

  const [processedBlob, setProcessedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const rawBufRef = useRef(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'blank_pages',
    { sequence },
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
        if (!s?.sequence) {
          const initialSeq = Array.from({length: doc.numPages}, (_, i) => ({ id: `orig_${i+1}`, type: 'original', pageNum: i+1 }));
          setSequence(initialSeq);
        }
      });
      
      if (s?.sequence) {
         setSequence(s.sequence);
      }
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
      setFileName(file.name);
      setFileSize(file.size);
      
      const initialSeq = Array.from({length: doc.numPages}, (_, i) => ({ id: `orig_${i+1}`, type: 'original', pageNum: i+1 }));
      setSequence(initialSeq);
      
      setFile(file);
      setPhase('editor');
    } catch (e) {
      setErrorMsg('Could not read PDF. It may be corrupted or password-protected.');
      setPhase('error');
    }
  };

  // ── operations ───────────────────────────────────────────────────────────
  const handleInsertBlank = (index) => {
    const newSeq = [...sequence];
    newSeq.splice(index, 0, { id: `blank_${Date.now()}_${Math.random()}`, type: 'blank' });
    setSequence(newSeq);
  };

  const handleRemoveItem = (id) => {
    setSequence(prev => prev.filter(item => item.id !== id));
  };

  const handleAutoRemoveBlanks = async () => {
    setPhase('processing');
    try {
      const newSeq = [];
      for (const item of sequence) {
        if (item.type === 'blank') continue; // User added blank, but wants to remove blanks? Let's just remove all detected blanks.
        
        // Detect if original page is blank
        const page = await pdfDoc.getPage(item.pageNum);
        const vp = page.getViewport({ scale: 0.3 }); // small scale for speed
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let nonWhitePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) {
            nonWhitePixels++;
          }
        }
        
        // If non-white pixels are more than 0.1%, it's not blank
        const isBlank = nonWhitePixels < (canvas.width * canvas.height * 0.001);
        if (!isBlank) {
          newSeq.push(item);
        }
      }
      setSequence(newSeq);
      setPhase('editor');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error auto-detecting blank pages.');
      setPhase('error');
    }
  };

  const handleApply = async () => {
    if (!rawBufRef.current) return;
    setPhase('processing');
    try {
      const originalPdf = await PDFDocument.load(rawBufRef.current, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      
      // Get dimensions from the first original page to make blanks the same size
      let defaultWidth = 595.28; // A4
      let defaultHeight = 841.89;
      if (originalPdf.getPageCount() > 0) {
         const firstPage = originalPdf.getPage(0);
         const { width, height } = firstPage.getSize();
         defaultWidth = width; defaultHeight = height;
      }

      for (const item of sequence) {
        if (item.type === 'original') {
          const [copiedPage] = await newPdf.copyPages(originalPdf, [item.pageNum - 1]);
          newPdf.addPage(copiedPage);
        } else {
          // Add blank page
          newPdf.addPage([defaultWidth, defaultHeight]);
        }
      }

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
    a.href = url; a.download = `${base}_updated.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null); setSequence([]);
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
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-blue-50 text-blue-600">
            <iconify-icon icon="solar:document-add-bold" class="text-3xl"></iconify-icon>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Add & Remove Blank Pages</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">Insert blank pages anywhere in your PDF or automatically remove existing empty pages.</p>
        </div>

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#111' }}>Done! Document Updated.</h2>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>Your PDF with updated blank pages is ready.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleDownload} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-800 transition-all">
                ⬇ Download PDF
              </button>
              <button onClick={handleReset} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }} className="hover:bg-gray-100 transition-all">
                Process another
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
              border: `2.5px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              background: isDragging ? '#eff6ff' : '#fff', transition: 'all .2s',
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
                <span style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14 }} className="hover:bg-blue-700 transition-all">
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 250 }}>{fileName}</span>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>({sequence.length} pages)</span>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => handleInsertBlank(0)} style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
            <iconify-icon icon="solar:document-add-linear"></iconify-icon> Add at start
          </button>
          <button onClick={() => handleInsertBlank(sequence.length)} style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} className="hover:bg-[#4b5563] transition-all">
            <iconify-icon icon="solar:document-add-linear"></iconify-icon> Add at end
          </button>
          
          <div style={{ width: 1, height: 24, background: '#4b5563', margin: '0 8px' }} />
          
          <button onClick={handleAutoRemoveBlanks} title="AI will scan and remove all blank pages" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} className="hover:bg-red-500/20 hover:text-red-400 transition-all">
            <iconify-icon icon="solar:magic-stick-3-bold"></iconify-icon> Auto-Remove Blanks
          </button>
        </div>

        {/* Apply/Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} className="hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleApply} 
            disabled={sequence.length === 0}
            style={{ background: sequence.length > 0 ? '#3b82f6' : '#374151', color: sequence.length > 0 ? '#fff' : '#6b7280', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: sequence.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }} 
            className="hover:bg-blue-600 transition-all shadow-md"
          >
            Generate PDF
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', position: 'relative' }}>
        {phase === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Processing pages...</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>This might take a few seconds.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
               <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>Hover between pages to add a blank page</h3>
            </div>
            
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '20px 0', paddingBottom: 64, justifyContent: 'center'
            }}>
              {sequence.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {/* Insert button BEFORE the item */}
                  <InsertButton position={idx} onInsert={handleInsertBlank} />
                  <Thumbnail
                    item={item}
                    pdfDoc={pdfDoc}
                    onRemove={handleRemoveItem}
                  />
                </React.Fragment>
              ))}
              {/* Insert button AFTER the last item */}
              <InsertButton position={sequence.length} onInsert={handleInsertBlank} />
            </div>
          </>
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Blank Pages" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}

