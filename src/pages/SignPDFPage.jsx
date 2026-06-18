import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import { useAuth } from '../contexts/AuthContext';
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { processWithQueue } from '../utils/queueApi';
import { useToolSession } from '../hooks/useToolSession';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const STEPS = ['Upload', 'Signature', 'Place', 'Sign'];

export default function SignPDFPage({ lang = 'en' }) {
  const { isPro } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [isDrag, setIsDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|processing|done|error
  const [errMsg, setErrMsg] = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [resultName, setResultName] = useState('');
  const fileInputRef = useRef(null);

  // Step 2 – signature
  const [signMode, setSignMode] = useState('type');
  const [signText, setSignText] = useState('Your Name');
  const [signFont, setSignFont] = useState('serif');
  const [signColor, setSignColor] = useState('#111827');
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [signImg, setSignImg] = useState(null);
  const imgInputRef = useRef(null);
  const [liveDataUrl, setLiveDataUrl] = useState('');

  // Step 3 – placement
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [curPage, setCurPage] = useState(1);
  const [wrapWidth, setWrapWidth] = useState(340);
  const pdfCanvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(80);
  const [sigW, setSigW] = useState(160);
  const [sigH, setSigH] = useState(60);
  const [sigRot, setSigRot] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Step 4 – details
  const [detName, setDetName] = useState('');
  const [detTitle, setDetTitle] = useState('');
  const [detDate, setDetDate] = useState(new Date().toISOString().split('T')[0]);
  const [detId, setDetId] = useState('');
  const [flatten, setFlatten] = useState(true);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'sign',
    {
      step,
      signMode, signText, signFont, signColor, signImg,
      curPage, posX, posY, sigW, sigH, sigRot,
      detName, detTitle, detDate, detId, flatten
    },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      f.arrayBuffer().then(buf => {
        pdfjsLib.getDocument({ data: buf }).promise.then(loadedPdf => {
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
        });
      });
      
      setStep(s?.step || 1);
      setSignMode(s?.signMode || 'type');
      setSignText(s?.signText || 'Your Name');
      setSignFont(s?.signFont || 'serif');
      setSignColor(s?.signColor || '#111827');
      if (s?.signImg) setSignImg(s.signImg);
      setCurPage(s?.curPage || 1);
      if (s?.posX !== undefined) setPosX(s.posX);
      if (s?.posY !== undefined) setPosY(s.posY);
      if (s?.sigW !== undefined) setSigW(s.sigW);
      if (s?.sigH !== undefined) setSigH(s.sigH);
      if (s?.sigRot !== undefined) setSigRot(s.sigRot);
      if (s?.detName !== undefined) setDetName(s.detName);
      if (s?.detTitle !== undefined) setDetTitle(s.detTitle);
      if (s?.detDate !== undefined) setDetDate(s.detDate);
      if (s?.detId !== undefined) setDetId(s.detId);
      if (s?.flatten !== undefined) setFlatten(s.flatten);
      setStatus('idle');
    },
    status !== 'processing' && status !== 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ── helpers ──────────────────────────────────────────────────────────
  const getDataUrl = () => {
    if (signMode === 'upload' && signImg) return signImg;

    if (signMode === 'draw') {
      // Return the drawn canvas as-is (may be blank if nothing drawn yet)
      const c = document.createElement('canvas');
      c.width = 400; c.height = 140;
      if (canvasRef.current) {
        c.getContext('2d').drawImage(canvasRef.current, 0, 0, 400, 140);
      }
      return c.toDataURL('image/png');
    }

    // signMode === 'type'
    const c = document.createElement('canvas');
    c.width = 400; c.height = 140;
    const ctx = c.getContext('2d');
    ctx.fillStyle = signColor;
    ctx.font = `italic 64px ${signFont}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(signText || 'Your Signature', 200, 70);
    return c.toDataURL('image/png');
  };

  // Only auto-update preview for type/upload modes; draw mode updates manually on stopDraw
  useEffect(() => {
    if (signMode === 'type') setLiveDataUrl(getDataUrl());
  }, [signText, signFont, signColor]);

  useEffect(() => {
    if (signMode === 'upload') setLiveDataUrl(signImg || '');
  }, [signImg]);

  // When switching mode, update preview appropriately
  useEffect(() => {
    if (signMode === 'type') setLiveDataUrl(getDataUrl());
    else if (signMode === 'upload') setLiveDataUrl(signImg || '');
    else if (signMode === 'draw') {
      // Show blank canvas preview (user hasn't drawn yet)
      const c = document.createElement('canvas');
      c.width = 400; c.height = 140;
      setLiveDataUrl(c.toDataURL('image/png'));
    }
  }, [signMode]);


  const loadPdf = async (f) => {
    try {
      const buf = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      setPdfDoc(doc); setTotalPages(doc.numPages); setCurPage(1);
    } catch (_) {}
  };

  // Non-passive touch events on draw canvas — prevents page scroll while finger-drawing
  useEffect(() => {
    if (step !== 1 || signMode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onStart = (e) => { e.preventDefault(); startDraw(e); };
    const onMove  = (e) => { e.preventDefault(); doDraw(e); };
    const onEnd   = () => stopDraw();
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove',  onMove,  { passive: false });
    canvas.addEventListener('touchend',   onEnd);
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onEnd);
    };
  }, [step, signMode, drawing, signColor]);


  // ── PDF rendering ────────────────────────────────────────────────────
  const renderTaskRef = useRef(null);

  // Re-render on page change, doc change, or step mounting
  useEffect(() => {
    if (step !== 2 || !pdfDoc || !pdfCanvasRef.current) return;
    
    const measureAndRender = async () => {
      const canvas = pdfCanvasRef.current;
      const w = wrapRef.current?.getBoundingClientRect().width;
      const finalW = w > 0 ? w : Math.min(window.innerWidth - 32, 500);
      setWrapWidth(finalW); // update state for backend to use correct proportion

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const pg = await pdfDoc.getPage(curPage);
        const nativeVP = pg.getViewport({ scale: 1 });
        const scale = finalW / nativeVP.width;
        
        const vp = pg.getViewport({ scale });
        
        canvas.width = vp.width;
        canvas.height = vp.height;
        // Simple responsive CSS
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: vp,
        };

        renderTaskRef.current = pg.render(renderContext);
        await renderTaskRef.current.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("PDF render error:", err);
          setPdfError(err.message || 'Unknown render error');
        }
      }
    };
    
    const timer = setTimeout(measureAndRender, 100);
    return () => {
      clearTimeout(timer);
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, curPage, step]);


  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); await loadPdf(f); setStep(1);
  };

  // Draw canvas handlers — getXY accounts for canvas pixel vs CSS size
  const getXY = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    // Scale coords from CSS pixels to canvas pixels
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return [
      (src.clientX - r.left) * scaleX,
      (src.clientY - r.top) * scaleY,
    ];
  };
  const startDraw = (e) => {
    e.preventDefault();
    const [x, y] = getXY(e, canvasRef.current);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
  };
  const doDraw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const [x, y] = getXY(e, canvasRef.current);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = signColor; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDraw = () => {
    setDrawing(false);
    setLiveDataUrl(getDataUrl());
  };
  const clearDraw = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setLiveDataUrl(getDataUrl());
  };


  // Signature drag on PDF — prevent page scroll during drag (passive:false required)
  const draggingRef = useRef(false);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (draggingRef.current) {
        e.preventDefault(); // must be non-passive to work
        const src = e.touches[0];
        const r = el.getBoundingClientRect();
        setPosX(Math.max(0, Math.min(100, ((src.clientX - r.left) / r.width) * 100)));
        setPosY(Math.max(0, Math.min(100, ((src.clientY - r.top) / r.height) * 100)));
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [step]); // re-attach when step 2 mounts

  const onMove = (e) => {
    if (!dragging || !wrapRef.current) return;
    const src = e.touches ? e.touches[0] : e;
    const r = wrapRef.current.getBoundingClientRect();
    setPosX(Math.max(0, Math.min(100, ((src.clientX - r.left) / r.width) * 100)));
    setPosY(Math.max(0, Math.min(100, ((src.clientY - r.top) / r.height) * 100)));
  };

  const handleProcess = async () => {
    setStatus('processing');
    try {
      const res = await fetch(liveDataUrl);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tool', 'Sign PDF');
      fd.append('signature_image', blob, 'sig.png');
      fd.append('details_name', detName);
      fd.append('details_title', detTitle);
      fd.append('details_date', detDate);
      fd.append('details_id', detId);
      fd.append('target_page', curPage.toString());
      fd.append('pos_x', posX.toString());
      fd.append('pos_y', posY.toString());
      fd.append('sig_width', sigW.toString());
      fd.append('sig_height', sigH.toString());
      fd.append('sig_rotation', sigRot.toString());
      fd.append('flatten', flatten.toString());
      fd.append('container_width', wrapWidth.toString()); // Tell backend actual preview width

      const data = await processWithQueue('/api/process', fd, null, true);
      const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const name = file.name.replace(/\.pdf$/i, '_signed.pdf');
      setResultUrl(url); setResultName(name);

      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setStatus('done');
    } catch (e) {
      setErrMsg(e.message); setStatus('error');
    }
  };

  // ── Processing / Done / Error screens ────────────────────────────────
  if (status === 'processing') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
      <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-xl font-bold text-slate-800">Signing Document...</p>
      <p className="text-slate-500 text-center">Please wait while we embed your signature.</p>
    </div>
  );

  if (status === 'done') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">✅</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Document Signed!</h2>
      <p className="text-slate-500">Your signature has been securely embedded.</p>
      <a href={resultUrl} download={resultName} className="w-full max-w-xs py-4 bg-violet-600 text-white font-bold rounded-2xl text-center shadow-lg shadow-violet-300 text-lg">
        ⬇ Download PDF
      </a>
      <button onClick={() => { setFile(null); setPdfDoc(null); setStep(0); setStatus('idle'); clearSession(); }} className="text-slate-500 underline text-sm mt-2">
        Sign Another Document
      </button>
    </div>
  );

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h2 className="text-xl font-bold text-red-600">Signing Failed</h2>
      <p className="text-slate-500">{errMsg}</p>
      <button onClick={() => setStatus('idle')} className="px-8 py-3 bg-slate-100 rounded-xl font-semibold">Try Again</button>
    </div>
  );

  // ── STEP 0: Upload ────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl mb-4 text-3xl">✍️</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sign PDF</h1>
        <p className="text-slate-500 mt-2 text-sm">Upload a PDF, draw or type your signature, place it exactly where you want.</p>
      </div>
      <div
        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${isDrag ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-white hover:border-violet-400 hover:bg-slate-50'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={(e) => { e.preventDefault(); setIsDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="text-5xl mb-4">📄</div>
        <button type="button" className="px-8 py-4 bg-violet-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-violet-300 mb-3">
          Choose PDF File
        </button>
        <p className="text-slate-400 text-sm">or drag & drop here</p>
      </div>
    </div>
  );

  // ── STEP 1: Create Signature ──────────────────────────────────────────
  if (step === 1) return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setStep(0)} className="p-2 text-slate-500">←</button>
        <div className="flex gap-1 flex-1">
          {STEPS.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-violet-600' : 'bg-slate-200'}`} />)}
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Create Your Signature</h2>

      {/* Mode tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
        {[['type', '⌨️ Type'], ['draw', '✏️ Draw'], ['upload', '🖼 Upload']].map(([id, label]) => (
          <button key={id} onClick={() => setSignMode(id)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${signMode === id ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Signature area */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden mb-5" style={{ minHeight: 160 }}>
        {signMode === 'type' && (
          <div className="p-6 flex flex-col items-center gap-4">
            <input
              value={signText} onChange={(e) => setSignText(e.target.value)}
              className="w-full text-center text-4xl bg-transparent border-b-2 border-slate-300 focus:border-violet-500 outline-none pb-2"
              style={{ fontFamily: signFont, fontStyle: 'italic', color: signColor }}
              placeholder="Your Name"
            />
            <div className="flex gap-3">
              {[['serif', 'Cursive'], ['sans-serif', 'Sans'], ['Georgia', 'Classic']].map(([f, l]) => (
                <button key={f} onClick={() => setSignFont(f)} className={`px-3 py-1.5 rounded-full text-sm border font-medium ${signFont === f ? 'border-violet-500 text-violet-600 bg-violet-50' : 'border-slate-200 text-slate-500'}`} style={{ fontFamily: f }}>{l}</button>
              ))}
            </div>
          </div>
        )}
        {signMode === 'draw' && (
          <div className="flex flex-col items-center p-4 w-full">
            <p className="text-xs text-slate-400 mb-2">✏️ Draw with your finger or mouse</p>
            <canvas
              ref={canvasRef} width={600} height={200}
              className="bg-white rounded-xl border-2 border-dashed border-slate-300 cursor-crosshair w-full"
              style={{ touchAction: 'none' }}
              onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            />
            <button onClick={clearDraw} className="mt-3 text-sm text-red-500 font-semibold">🗑 Clear Canvas</button>
          </div>
        )}
        {signMode === 'upload' && (
          <div className="flex flex-col items-center justify-center p-8">
            {signImg ? (
              <div className="relative">
                <img src={signImg} alt="sig" className="max-h-32 object-contain mix-blend-multiply" />
                <button onClick={() => setSignImg(null)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm font-bold">✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-14 h-14 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center text-2xl">🖼</div>
                <p className="text-sm font-semibold text-slate-600">Upload Signature Image</p>
                <p className="text-xs text-slate-400">PNG with transparent bg preferred</p>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { const r = new FileReader(); r.onload = ev => setSignImg(ev.target.result); r.readAsDataURL(f); }
                }} />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Color picker */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-semibold text-slate-700">Color</span>
        <div className="flex gap-3">
          {['#111827', '#1d4ed8', '#b91c1c', '#166534'].map(c => (
            <button key={c} onClick={() => setSignColor(c)} className={`w-10 h-10 rounded-full border-4 transition-all ${signColor === c ? 'border-violet-500 scale-110' : 'border-transparent'}`} style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Preview */}
      {liveDataUrl && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Preview</p>
          <img src={liveDataUrl} alt="preview" className="max-h-16 object-contain mix-blend-multiply" />
        </div>
      )}

      <button onClick={() => setStep(2)} className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-violet-300">
        Next: Place Signature →
      </button>
    </div>
  );

  // ── STEP 2: Place on PDF ──────────────────────────────────────────────
  if (step === 2) return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setStep(1)} className="p-2 text-slate-500">←</button>
        <div className="flex gap-1 flex-1">
          {STEPS.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-violet-600' : 'bg-slate-200'}`} />)}
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Place Your Signature</h2>
      <p className="text-sm text-slate-500 mb-4">Tap or drag the signature to position it.</p>

      {/* Page navigation */}
      <div className="flex items-center justify-between mb-3 bg-slate-100 rounded-xl px-4 py-2">
        <button onClick={() => setCurPage(p => Math.max(1, p - 1))} disabled={curPage === 1} className="text-2xl text-slate-600 disabled:opacity-30 p-1">‹</button>
        <span className="text-sm font-bold text-slate-700">Page {curPage} / {totalPages}</span>
        <button onClick={() => setCurPage(p => Math.min(totalPages, p + 1))} disabled={curPage === totalPages} className="text-2xl text-slate-600 disabled:opacity-30 p-1">›</button>
      </div>

      {/* PDF Canvas with draggable signature */}
      <div
        ref={wrapRef}
        className="relative bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-lg w-full cursor-crosshair select-none"
        style={{ minHeight: 400 }}
        onMouseMove={onMove}
        onMouseUp={() => setDragging(false)} onTouchEnd={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        {pdfError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-50 z-20 text-center text-red-600">
            <p className="font-bold mb-2">PDF Render Failed</p>
            <p className="text-xs break-words">{pdfError}</p>
          </div>
        )}
        <canvas ref={pdfCanvasRef} className="block w-full h-auto pointer-events-none" />
        {liveDataUrl && (
          <div
            onMouseDown={() => setDragging(true)}
            onTouchStart={(e) => { e.stopPropagation(); setDragging(true); }}
            className="absolute z-10 border-2 border-dashed border-violet-500 cursor-move"
            style={{ left: `${posX}%`, top: `${posY}%`, transform: `translate(-50%,-50%) rotate(${sigRot}deg)`, width: sigW, height: sigH, touchAction: 'none' }}
          >
            <img src={liveDataUrl} alt="sig" className="w-full h-full object-contain pointer-events-none mix-blend-multiply" draggable={false} />
            <div className="absolute inset-0 border-2 border-dashed border-violet-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Rotate + Size sliders */}
      <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 w-16 shrink-0">↻ Rotate</span>
          <input type="range" min="-180" max="180" step="1" value={sigRot} onChange={e => setSigRot(+e.target.value)} className="flex-1 accent-violet-600" />
          <span className="text-sm font-bold text-violet-600 w-10 text-right">{sigRot}°</span>
          <button onClick={() => setSigRot(0)} className="text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-500 font-medium">Reset</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 w-16 shrink-0">⟺ Size</span>
          <input type="range" min="60" max="320" step="5" value={sigW} onChange={e => { const w = +e.target.value; setSigW(w); setSigH(Math.round(w * 0.375)); }} className="flex-1 accent-violet-600" />
          <span className="text-sm font-bold text-violet-600 w-10 text-right">{sigW}px</span>
        </div>
      </div>

      <button onClick={() => setStep(3)} className="w-full mt-5 py-4 bg-violet-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-violet-300">
        Next: Add Details →
      </button>
    </div>
  );

  // ── STEP 3: Details + Sign ────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setStep(2)} className="p-2 text-slate-500">←</button>
        <div className="flex gap-1 flex-1">
          {STEPS.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-violet-600' : 'bg-slate-200'}`} />)}
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Official Stamp Details</h2>
      <p className="text-sm text-slate-500 mb-5">Optional — will appear below your signature.</p>

      <div className="space-y-3 mb-5">
        {[
          ['👤 Full Name', detName, setDetName, 'text', 'e.g. Ahmed Khan'],
          ['💼 Designation', detTitle, setDetTitle, 'text', 'e.g. Manager HR'],
          ['📅 Date', detDate, setDetDate, 'date', ''],
          ['🪪 ID Number', detId, setDetId, 'text', 'CNIC / Passport / SSN'],
        ].map(([label, val, setter, type, ph]) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 block">{label}</label>
              {type === 'date' && val && (
                <button onClick={() => setter('')} className="text-xs text-red-500 font-bold px-2 py-0.5 bg-red-50 rounded-md">Clear</button>
              )}
            </div>
            <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white" />
          </div>
        ))}
      </div>

      {/* Flatten toggle */}
      <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer mb-6 transition-all ${flatten ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <input type="checkbox" checked={flatten} onChange={e => setFlatten(e.target.checked)} className="w-5 h-5 mt-0.5 accent-green-600" />
        <div>
          <p className="font-bold text-slate-800 text-sm">🔒 Flatten Document</p>
          <p className="text-xs text-slate-500 mt-0.5">Permanently embeds signature — document cannot be edited after.</p>
        </div>
      </label>

      {/* Summary card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-sm space-y-1">
        <p className="font-bold text-slate-700 mb-2">📋 Summary</p>
        <p className="text-slate-500">File: <span className="text-slate-800 font-medium">{file?.name}</span></p>
        <p className="text-slate-500">Page: <span className="text-slate-800 font-medium">{curPage} of {totalPages}</span></p>
        <p className="text-slate-500">Signature: <span className="text-slate-800 font-medium capitalize">{signMode}</span></p>
        <p className="text-slate-500">Size: <span className="text-slate-800 font-medium">{sigW}×{sigH}px | {sigRot}° rotation</span></p>
      </div>

      <button onClick={handleProcess} className="w-full py-5 bg-violet-600 text-white font-bold rounded-2xl text-xl shadow-xl shadow-violet-300 flex items-center justify-center gap-2">
        ✍️ Sign Document
      </button>
    </div>
  );
}
