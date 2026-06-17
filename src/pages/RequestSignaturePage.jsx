import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import { useToolSession } from '../hooks/useToolSession';
// pdfjs legacy — uses Vite ?url worker for correct production builds
import { pdfjsLib } from '../utils/pdfjs-legacy-setup.js';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const SIGNER_COLORS = [
  'bg-blue-500 border-blue-600 text-blue-50',
  'bg-emerald-500 border-emerald-600 text-emerald-50',
  'bg-amber-500 border-amber-600 text-amber-50',
  'bg-purple-500 border-purple-600 text-purple-50',
  'bg-rose-500 border-rose-600 text-rose-50'
];

export default function RequestSignaturePage() {
  const { isPro } = useAuth();
  const navigate = useNavigate();

  // STAGES: 1_UPLOAD -> 2_SIGNERS -> 3_PLACE_FIELDS -> 4_SETTINGS -> 5_SENDING -> 6_DASHBOARD
  const [step, setStep] = useState('1_UPLOAD');
  
  // File state
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Signers state
  const [signers, setSigners] = useState([{ id: 1, name: '', email: '', colorIdx: 0 }]);
  
  // Fields placement state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [fields, setFields] = useState([]);
  const [placingMode, setPlacingMode] = useState(null); // {signerId, type} or null
  const [draggingField, setDraggingField] = useState(null); // {id, startX, startY, origX, origY}
  const canvasRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Settings state
  const [order, setOrder] = useState('parallel');
  const [deadline, setDeadline] = useState('7');
  const [reminder, setReminder] = useState('3');
  const [customMessage, setCustomMessage] = useState('');

  // Dashboard state
  const [requests, setRequests] = useState([]);

  // ── Session persistence ──────────────────────────────────────────────────
  useToolSession(
    'request_signature',
    { step, signers, fields, order, deadline, reminder, customMessage },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setFileBase64(e.target.result);
      reader.readAsDataURL(f);
      
      setStep(s?.step || '2_SIGNERS');
      setSigners(s?.signers || [{ id: 1, name: '', email: '', colorIdx: 0 }]);
      setFields(s?.fields || []);
      setOrder(s?.order || 'parallel');
      setDeadline(s?.deadline || '7');
      setReminder(s?.reminder || '3');
      setCustomMessage(s?.customMessage || '');
      
      if (s && ['3_PLACE_FIELDS', '4_SETTINGS'].includes(s.step)) {
        f.arrayBuffer().then(buf => {
          pdfjsLib.getDocument({ data: buf }).promise.then(loadedPdf => {
             setPdfDoc(loadedPdf);
             setNumPages(loadedPdf.numPages);
          });
        });
      }
    },
    step !== '1_UPLOAD' && step !== '6_DASHBOARD' && step !== '5_SENDING'
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ─── 1. UPLOAD ────────────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file.');
      return;
    }
    if (f.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setFileBase64(e.target.result);
    reader.readAsDataURL(f);
    setStep('2_SIGNERS');
  };

  // ─── 2. SIGNERS ───────────────────────────────────────────────────────
  const addSigner = () => {
    if (signers.length >= 5) return toast.error('Maximum 5 signers allowed for now.');
    setSigners([...signers, { id: Date.now(), name: '', email: '', colorIdx: signers.length }]);
  };

  const removeSigner = (id) => {
    if (signers.length === 1) return;
    setSigners(signers.filter(s => s.id !== id));
  };

  const updateSigner = (id, field, value) => {
    setSigners(signers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const proceedToPlacement = async () => {
    // Validate signers
    for (let s of signers) {
      if (!s.name || !s.email) return toast.error('Please fill out all signer names and emails.');
      if (!/^\S+@\S+\.\S+$/.test(s.email)) return toast.error(`Invalid email for ${s.name || 'Signer'}`);
    }
    setStep('3_PLACE_FIELDS');

    // Load PDF for placement
    const arrayBuffer = await file.arrayBuffer();
    const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setPdfDoc(loadedPdf);
    setNumPages(loadedPdf.numPages);
  };

  // ─── 3. PLACEMENT — PDF Canvas + Click-to-Place + Drag ───────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch(e){} }
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = pdfContainerRef.current;
      const parentW = container?.parentElement?.clientWidth;
      const maxW = parentW ? parentW - 32 : 600; // 32px accounts for padding on the parent
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(maxW / viewport.width, 1.5);
      const vp = page.getViewport({ scale });
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      try { await task.promise; } catch(e) {}
    };
    renderPage();
  }, [pdfDoc, currentPage]);

  const handleCanvasClick = useCallback((e) => {
    if (!placingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setFields(prev => [...prev, {
      id: Date.now(),
      signerId: placingMode.signerId,
      type: placingMode.type,
      page: currentPage,
      x: Math.max(0, Math.min(75, xPct)),
      y: Math.max(0, Math.min(85, yPct)),
      width: placingMode.type === 'sign' ? 25 : 20,   // % of page width
      height: placingMode.type === 'sign' ? 10 : 5    // % of page height
    }]);
    setPlacingMode(null);
  }, [placingMode, currentPage]);

  const handleFieldMouseDown = (e, fieldId) => {
    e.stopPropagation();
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const container = pdfContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const field = fields.find(f => f.id === fieldId);
    setDraggingField({ id: fieldId, startX: clientX, startY: clientY, origX: field.x, origY: field.y, rect });
  };

  useEffect(() => {
    if (!draggingField) return;
    const onMove = (e) => {
      // Prevent default scrolling when dragging on mobile
      if (e.type === 'touchmove') e.preventDefault();
      
      const isTouch = e.type === 'touchmove';
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      
      const dx = ((clientX - draggingField.startX) / draggingField.rect.width) * 100;
      const dy = ((clientY - draggingField.startY) / draggingField.rect.height) * 100;
      setFields(prev => prev.map(f => f.id === draggingField.id
        ? { ...f, x: Math.max(0, Math.min(85, draggingField.origX + dx)), y: Math.max(0, Math.min(92, draggingField.origY + dy)) }
        : f
      ));
    };
    const onUp = () => setDraggingField(null);
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    
    return () => { 
      window.removeEventListener('mousemove', onMove); 
      window.removeEventListener('mouseup', onUp); 
      window.removeEventListener('touchmove', onMove); 
      window.removeEventListener('touchend', onUp); 
    };
  }, [draggingField]);

  const removeField = (id) => setFields(fields.filter(f => f.id !== id));

  // ─── 5. SENDING / DASHBOARD ────────────────────────────────────────────
  const sendRequest = async () => {
    setStep('5_SENDING');
    try {
      const res = await fetch('/api/send-signature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signers,
          fileName: file?.name || 'Document',
          order,
          deadline,
          customMessage,
          senderName: 'TheyLovePDF User',
          requesterEmail: 'abbasroghani869@gmail.com',
          fileBase64,
          fields
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_CONFIGURED') {
          // Show configuration instructions
          setStep('EMAIL_SETUP');
        } else {
          toast.error(`Error: ${data.error}`);
          setStep('4_SETTINGS');
        }
        return;
      }

      setRequests(data.results.map((r, i) => ({ ...r, colorIdx: signers[i]?.colorIdx ?? i, sentAt: new Date().toLocaleTimeString() })));
      setStep('6_DASHBOARD');
    } catch (err) {
      toast.error('Network error: ' + err.message);
      setStep('4_SETTINGS');
    }
  };

  // ─── Polling for Dashboard Status ──────────────────────────────────────
  useEffect(() => {
    if (step !== '6_DASHBOARD' || requests.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/signature-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: requests.map(r => r.token).filter(Boolean) })
        });
        const data = await res.json();
        if (data.statuses) {
          setRequests(prev => prev.map(r => {
            if (r.token && data.statuses[r.token]) {
              return { ...r, status: data.statuses[r.token] };
            }
            return r;
          }));
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [step, requests]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-violet-50 text-violet-600">
          <iconify-icon icon="solar:user-speak-rounded-bold" class="text-3xl"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Request Signatures</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          Legally binding electronic signatures for the entire world. Upload a PDF, add signers, and track the process in real-time.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto min-h-[400px]">
        
        {/* ============================================================== */}
        {/* STEP 1: UPLOAD */}
        {/* ============================================================== */}
        {step === '1_UPLOAD' && (
          <div className="px-6 py-6 md:px-10 md:py-8">
            <div
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              className={clsx(
                'relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden',
                isDragging ? 'drag-over border-violet-500 bg-violet-50/50' : 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/30 bg-violet-50/10'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => handleFile(e.target.files[0])}
                title=""
              />
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                isDragging ? 'bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/30' : 'bg-white text-violet-500 group-hover:scale-110 group-hover:shadow-md'
              )}>
                <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                {isDragging ? 'Drop your PDF here' : 'Select PDF to send for signature'}
              </p>
              <p className="text-sm text-gray-500 mb-6">Secure, worldwide, legally binding</p>
              <button className="bg-violet-600 text-white hover:bg-violet-700 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 transition-all pointer-events-none">
                Choose PDF
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: ADD SIGNERS */}
        {/* ============================================================== */}
        {step === '2_SIGNERS' && (
          <div className="px-6 py-8 md:px-10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Who needs to sign?</h2>
                <p className="text-sm text-gray-500">Enter the names and email addresses of everyone who needs to sign.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-sm">
                  <iconify-icon icon="solar:users-group-two-rounded-bold" class="text-xl"></iconify-icon>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {signers.map((signer, index) => (
                <div key={signer.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", SIGNER_COLORS[signer.colorIdx])}>
                    {index + 1}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                    <input 
                      type="text" 
                      placeholder="Signer Name (e.g. Ahmed Khan)" 
                      value={signer.name}
                      onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                    <input 
                      type="email" 
                      placeholder="Email Address (e.g. ahmed@email.com)" 
                      value={signer.email}
                      onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  {signers.length > 1 && (
                    <button onClick={() => removeSigner(signer.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <iconify-icon icon="solar:trash-bin-trash-linear" class="text-lg"></iconify-icon>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addSigner} className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors mb-10">
              <iconify-icon icon="solar:add-circle-bold" class="text-xl"></iconify-icon>
              Add another signer
            </button>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button onClick={() => setStep('1_UPLOAD')} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Back</button>
              <button onClick={proceedToPlacement} className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                Next: Place Fields
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: PLACE FIELDS */}
        {/* ============================================================== */}
        {step === '3_PLACE_FIELDS' && (
          <div className="flex flex-col md:flex-row min-h-[400px] md:min-h-[600px]">
            {/* Sidebar */}
            <div className="w-full md:w-60 bg-gray-50 border-r border-gray-100 p-5 flex flex-col shrink-0">
              <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Place Fields</h3>
              {placingMode ? (
                <div className="mb-4 mt-2 px-3 py-2 bg-violet-100 text-violet-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                  <iconify-icon icon="solar:cursor-bold"></iconify-icon>
                  Click on PDF to place {placingMode.type === 'sign' ? 'Signature' : 'Date'}
                  <button onClick={() => setPlacingMode(null)} className="ml-auto text-violet-500 hover:text-red-500">
                    <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4 mt-1">Select a field type, then click on the document where you want to place it.</p>
              )}
              <div className="space-y-5 flex-1 overflow-y-auto">
                {signers.map(signer => {
                  const bg = ['bg-blue-500','bg-emerald-500','bg-amber-500','bg-purple-500','bg-rose-500'][signer.colorIdx];
                  const isActive = placingMode?.signerId === signer.id;
                  return (
                    <div key={signer.id}>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${bg}`}></div>
                        <span className="truncate">{signer.name || 'Signer'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['sign','date'].map(type => (
                          <button
                            key={type}
                            onClick={() => setPlacingMode(isActive && placingMode?.type===type ? null : {signerId:signer.id,type})}
                            className={clsx(
                              'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold border transition-all',
                              isActive && placingMode?.type===type
                                ? 'bg-violet-600 text-white border-violet-700 shadow-md'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
                            )}
                          >
                            <iconify-icon icon={type==='sign'?'solar:pen-bold':'solar:calendar-bold'} class="text-sm"></iconify-icon>
                            {type==='sign'?'Sign':'Date'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <iconify-icon icon="solar:info-circle-linear"></iconify-icon>
                  {fields.length} field(s) placed. Drag to reposition.
                </div>
                <button onClick={() => setStep('4_SETTINGS')} className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all">
                  Next: Settings
                </button>
                <button onClick={() => setStep('2_SIGNERS')} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900">Back</button>
              </div>
            </div>

            {/* PDF Canvas Area */}
            <div className="flex-1 bg-gray-100 flex flex-col items-center py-6 px-4 overflow-auto">
              <div
                ref={pdfContainerRef}
                onClick={handleCanvasClick}
                className={clsx(
                  'relative inline-block shadow-2xl rounded border border-gray-200 bg-white select-none',
                  placingMode ? 'cursor-crosshair' : 'cursor-default'
                )}
              >
                <canvas ref={canvasRef} className="block max-w-full" />
                {/* Field Overlays */}
                {fields.filter(f => f.page === currentPage).map(field => {
                  const signer = signers.find(s => s.id === field.signerId);
                  const colors = [['#3b82f6','#bfdbfe'],['#10b981','#d1fae5'],['#f59e0b','#fef3c7'],['#8b5cf6','#ede9fe'],['#f43f5e','#ffe4e6']];
                  const [fg,bg2] = colors[signer?.colorIdx ?? 0];
                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                      onTouchStart={(e) => handleFieldMouseDown(e, field.id)}
                      style={{
                        position:'absolute',
                        left:`${field.x}%`,
                        top:`${field.y}%`,
                        background: bg2,
                        border:`2px solid ${fg}`,
                        borderRadius:'6px',
                        padding:'4px 8px',
                        cursor:'grab',
                        display:'flex',
                        alignItems:'center',
                        gap:'6px',
                        minWidth:'110px',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
                        fontSize:'11px',
                        fontWeight:700,
                        color: fg,
                        userSelect:'none',
                        zIndex:10
                      }}
                    >
                      <span>{field.type==='sign'?'✍️ Signature':'📅 Date'}</span>
                      <span style={{fontSize:'9px',opacity:0.7}}>{signer?.name?.split(' ')[0]}</span>
                      <button
                        onMouseDown={e=>e.stopPropagation()}
                        onTouchStart={e=>e.stopPropagation()}
                        onClick={(e)=>{e.stopPropagation();removeField(field.id);}}
                        style={{marginLeft:'auto',opacity:0.6,lineHeight:1}}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
              {/* Page Nav */}
              <div className="mt-4 flex items-center gap-4 bg-white px-5 py-2 rounded-full shadow-sm border border-gray-200">
                <button disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)} className="text-gray-500 hover:text-violet-600 disabled:opacity-30 text-lg">‹</button>
                <span className="text-sm font-bold text-gray-700">Page {currentPage} of {numPages}</span>
                <button disabled={currentPage>=numPages} onClick={()=>setCurrentPage(p=>p+1)} className="text-gray-500 hover:text-violet-600 disabled:opacity-30 text-lg">›</button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: SETTINGS */}
        {/* ============================================================== */}
        {step === '4_SETTINGS' && (
          <div className="px-6 py-8 md:px-12 md:py-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Final Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Configure how your signature request will be sent.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Signing Order</label>
                  <div className="flex rounded-xl bg-gray-100 p-1">
                    <button onClick={()=>setOrder('parallel')} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", order==='parallel'?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700')}>
                      Parallel (All at once)
                    </button>
                    <button onClick={()=>setOrder('sequential')} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", order==='sequential'?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700')}>
                      Sequential (One by one)
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {order === 'parallel' ? 'Emails will be sent to all signers immediately.' : 'Signer 2 will only receive an email after Signer 1 signs.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Deadline</label>
                    <select value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-violet-500">
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Auto Reminder</label>
                    <select value={reminder} onChange={e=>setReminder(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-violet-500">
                      <option value="0">Off</option>
                      <option value="1">Every day</option>
                      <option value="3">Every 3 days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Custom Email Message</label>
                <textarea 
                  value={customMessage}
                  onChange={e=>setCustomMessage(e.target.value)}
                  placeholder="e.g. Please review and sign this agreement."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button onClick={() => setStep('3_PLACE_FIELDS')} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Back</button>
              <button onClick={sendRequest} className="flex items-center gap-2 bg-violet-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                <iconify-icon icon="solar:plain-bold" class="text-xl"></iconify-icon>
                Send Request Now
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: SENDING LOADER */}
        {/* ============================================================== */}
        {step === '5_SENDING' && (
          <div className="px-6 py-20 flex flex-col items-center justify-center text-center h-[500px]">
             <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin"></div>
                <iconify-icon icon="solar:plain-bold" class="text-3xl text-violet-600 animate-pulse"></iconify-icon>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Sending Requests...</h2>
             <p className="text-gray-500">Preparing document and dispatching emails to {signers.length} signer(s).</p>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 6: DASHBOARD */}
        {/* ============================================================== */}
        {step === '6_DASHBOARD' && (
          <div className="px-6 py-10 md:px-12 bg-gray-50 h-full min-h-[500px]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <iconify-icon icon="solar:check-circle-bold" class="text-4xl"></iconify-icon>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Emails Successfully Sent!</h2>
              <p className="text-gray-500 mt-1">Your document is out for signature. Track its status below.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <iconify-icon icon="solar:chart-square-bold" class="text-violet-500"></iconify-icon> Live Tracking Dashboard
                </h3>
                <span className="text-xs font-semibold px-3 py-1 bg-violet-100 text-violet-700 rounded-full uppercase tracking-wider">
                  {order} Order
                </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {requests.map((req, i) => (
                  <div key={i} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm", SIGNER_COLORS[req.colorIdx])}>
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{req.name}</p>
                        <p className="text-xs text-gray-500">{req.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {req.status === 'signed' ? (
                          <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-emerald-500 mb-0.5">
                            <iconify-icon icon="solar:check-circle-bold"></iconify-icon> Signed
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-amber-500 mb-0.5">
                            <iconify-icon icon="solar:clock-circle-bold"></iconify-icon> Pending
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent {req.sentAt}</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://theylovepdf.com/sign/${req.name.toLowerCase().replace(/\s/g, '')}-req123`);
                          toast.success('Signing link copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
                      >
                        <iconify-icon icon="solar:link-bold"></iconify-icon> Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <button onClick={() => navigate('/')} className="text-sm font-bold text-violet-600 hover:underline">
                Return to Home
              </button>
            </div>
          </div>
        )}

        {/* STEP: EMAIL NOT CONFIGURED */}
        {step === 'EMAIL_SETUP' && (
          <div className="px-6 py-10 md:px-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <iconify-icon icon="solar:settings-bold" class="text-4xl text-amber-500"></iconify-icon>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Setup Required</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">To send signature request emails, add your Gmail credentials to the server config. This only needs to be done once.</p>

            <div className="bg-gray-900 rounded-2xl p-6 text-left mb-6 max-w-lg mx-auto">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">server/.env</p>
              <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">{`EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM_NAME=TheyLovePDF`}</pre>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 text-left mb-8 max-w-lg mx-auto">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <iconify-icon icon="solar:info-circle-bold" class="text-blue-500"></iconify-icon>
                How to get Gmail App Password (Free)
              </h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener" className="font-bold underline">myaccount.google.com/security</a></li>
                <li>2. Enable <strong>2-Step Verification</strong></li>
                <li>3. Search for <strong>"App Passwords"</strong></li>
                <li>4. Generate password for <strong>"Mail"</strong></li>
                <li>5. Copy the 16-char password → paste in .env as EMAIL_PASS</li>
                <li>6. Restart server with <code className="bg-blue-100 px-1 rounded">npm run start:all</code></li>
              </ol>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={() => setStep('4_SETTINGS')} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">← Back to Settings</button>
              <button onClick={sendRequest} className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all">
                Retry Send
              </button>
            </div>
          </div>
        )}

      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="eSign PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}

