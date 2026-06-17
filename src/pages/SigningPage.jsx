import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
// pdfjs legacy — uses Vite ?url worker for correct production builds
import { pdfjsLib } from '../utils/pdfjs-legacy-setup.js';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
export default function SigningPage() {
  const { isPro } = useAuth();
  const { token } = useParams();
  const [step, setStep] = useState('LOADING'); // LOADING -> ERROR -> VIEW -> SIGN -> ADJUST -> DONE
  const [requestInfo, setRequestInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signMethod, setSignMethod] = useState('draw'); // draw | type | upload
  const [typedName, setTypedName] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [drawnImage, setDrawnImage] = useState(null);
  const signatureImageRef = useRef(null); // stores drawn/uploaded image reliably before step change
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const lastPos = useRef(null);

  // PDF & Adjustment states
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfCanvasRef = useRef(null);
  const pdfWrapperRef = useRef(null);
  const renderTaskRef = useRef(null);
  
  // Placement array for the signer
  const [finalFields, setFinalFields] = useState([]);
  // UI dragging states
  const [draggingFieldId, setDraggingFieldId] = useState(null);
  
  useEffect(() => {
    fetch(`/api/signature-request/${token}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setErrorMsg(data.error || 'Invalid link');
          setStep('ERROR');
        } else {
          if (data.fileBase64) {
            const base64Data = data.fileBase64.replace(/^data:application\/pdf;base64,/, "");
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdfjsLib.getDocument({ data: bytes.buffer }).promise.then(doc => {
              setPdfDoc(doc);
              setNumPages(doc.numPages);
            });
            // Initialize final fields from backend fields
            if (data.fields) setFinalFields(data.fields);
          }
          setRequestInfo(data);
          setStep('VIEW');
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load request. Please try again.');
        setStep('ERROR');
      });
  }, [token]);

  // ─── Canvas Drawing ───────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDraw = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleProceedToAdjust = () => {
    if (signMethod === 'draw' && !hasSignature) return toast.error('Please draw your signature first.');
    if (signMethod === 'type' && !typedName.trim()) return toast.error('Please type your name.');
    if (signMethod === 'upload' && !uploadedImage) return toast.error('Please upload your signature image.');
    
    // Capture signature NOW synchronously via ref — before canvas unmounts
    if (signMethod === 'draw' && canvasRef.current) {
      // Export as transparent PNG — just the black ink strokes, no background
      const dataUrl = canvasRef.current.toDataURL('image/png');
      signatureImageRef.current = dataUrl;
      setDrawnImage(dataUrl);
      console.log('Captured drawn signature (transparent), length:', dataUrl.length);
    } else if (signMethod === 'upload' && uploadedImage) {
      signatureImageRef.current = uploadedImage;
      console.log('Captured uploaded signature, length:', uploadedImage.length);
    }
    
    // If there are no fields for this signer, create a default one
    if (finalFields.length === 0) {
      setFinalFields([
        { id: Date.now(), type: 'sign', page: 1, x: 10, y: 80, width: 25, height: 10 },
        { id: Date.now() + 1, type: 'date', page: 1, x: 10, y: 92, width: 15, height: 5 }
      ]);
    }
    setStep('ADJUST');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Use ref (always reliable) — fall back to state if needed
    const sigImg = signatureImageRef.current || drawnImage || (signMethod === 'upload' ? uploadedImage : null);
    console.log('handleSubmit: signMethod=', signMethod, '| sigImg present=', !!sigImg, '| sigImg length=', sigImg?.length);
    try {
      await fetch(`/api/complete-signing/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedDate: new Date(signedDate).toLocaleDateString('en-US', { dateStyle: 'long' }),
          signMethod,
          typedName: signMethod === 'type' ? typedName : null,
          signatureImage: (signMethod === 'draw' || signMethod === 'upload') ? sigImg : null,
          finalFields
        })
      });
    } catch (e) { console.error('Submit error:', e); /* still show success */ }
    setSubmitting(false);
    setStep('DONE');
  };

  // PDF Rendering for Adjust Step — rendered at actual screen size (96 DPI)
  useEffect(() => {
    if (step !== 'ADJUST' || !pdfDoc || !pdfCanvasRef.current) return;
    const renderPage = async () => {
      if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch(e){} }
      const page = await pdfDoc.getPage(currentPage);
      const canvas = pdfCanvasRef.current;
      const viewport = page.getViewport({ scale: 1 });

      const scrollContainer = canvas.parentElement?.parentElement;
      const containerW = (scrollContainer && scrollContainer.clientWidth > 0) ? scrollContainer.clientWidth - 4 : window.innerWidth - 40;
      const fitScale = containerW / viewport.width;

      // Always scale down to fit the screen width perfectly (especially on mobile)
      // Cap at 1.5x on very wide desktop screens so it doesn't get absurdly large
      const scale = Math.min(fitScale, 1.5);

      const vp = page.getViewport({ scale });
      canvas.width  = vp.width;
      canvas.height = vp.height;
      // Set explicit pixel size — DO NOT use CSS '100%' which would distort proportions
      canvas.style.width  = vp.width  + 'px';
      canvas.style.height = vp.height + 'px';

      // Size the wrapper div to exactly match the canvas so % overlays align perfectly
      if (pdfWrapperRef.current) {
        pdfWrapperRef.current.style.width  = vp.width  + 'px';
        pdfWrapperRef.current.style.height = vp.height + 'px';
      }

      const ctx = canvas.getContext('2d');
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      try { await task.promise; } catch(e) {}
    };
    renderPage();
  }, [step, pdfDoc, currentPage]);

  const updateField = (id, changes) => {
    setFinalFields(prev => prev.map(f => f.id === id ? { ...f, ...changes } : f));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, Arial, sans-serif' }}>

      {/* ─── HEADER LOGO ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>P</span>
        </div>
        <span style={{ fontWeight: '800', fontSize: '20px', color: '#1f2937' }}>TheyLovePDF</span>
      </div>

      {/* ─── LOADING STEP ─── */}
      {step === 'LOADING' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#6b7280', fontSize: '16px', fontWeight: '600' }}>Loading secure document...</p>
        </div>
      )}

      {/* ─── ERROR STEP ─── */}
      {step === 'ERROR' && (
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(239,68,68,0.12)', border: '1px solid #fecaca' }}>
          <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            ⚠️
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#991b1b' }}>Access Denied</h1>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', lineHeight: '1.6' }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* ─── VIEW STEP ─── */}
      {step === 'VIEW' && (
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(124,58,237,0.12)', border: '1px solid #ede9fe' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '64px', height: '64px', background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              📄
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#1f2937' }}>Signature Requested</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>{requestInfo?.senderName || 'Someone'}</strong> has requested you to sign a document. Please review and apply your electronic signature.
            </p>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '28px' }}>📋</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#111827', fontSize: '15px' }}>{requestInfo?.fileName || 'Document for Signature'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Request ID: {token?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '14px 18px', marginBottom: '28px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6d28d9', lineHeight: '1.7' }}>
              ✅ By clicking <strong>"Proceed to Sign"</strong>, you agree that your electronic signature is legally binding, equivalent to a handwritten signature.
            </p>
          </div>

          <button
            onClick={() => setStep('SIGN')}
            style={{ width: '100%', background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
          >
            ✍️ Proceed to Sign
          </button>
        </div>
      )}

      {/* ─── SIGN STEP ─── */}
      {step === 'SIGN' && (
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 60px rgba(124,58,237,0.12)', border: '1px solid #ede9fe' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>Apply Your Signature</h2>
          <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>Draw your signature or type your full name below.</p>

          {/* Method Toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
            {[['draw', '✏️ Draw'], ['type', '⌨️ Type'], ['upload', '📷 Upload']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setSignMethod(val); clearCanvas(); setTypedName(''); setUploadedImage(null); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: signMethod === val ? 'white' : 'transparent', color: signMethod === val ? '#5b21b6' : '#6b7280', boxShadow: signMethod === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>

          {signMethod === 'draw' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ border: '2px dashed #c4b5fd', borderRadius: '14px', background: '#faf5ff', position: 'relative', overflow: 'hidden' }}>
                {!hasSignature && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <p style={{ color: '#c4b5fd', fontSize: '14px', fontWeight: '600' }}>Draw your signature here</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  style={{ display: 'block', width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button onClick={clearCanvas} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>🗑 Clear</button>
              </div>
            </div>
          )}

          {signMethod === 'type' && (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Type your full name..."
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e9d5ff', borderRadius: '12px', fontSize: '22px', fontFamily: 'Brush Script MT, cursive', color: '#1e1b4b', outline: 'none', boxSizing: 'border-box', background: '#faf5ff' }}
              />
              {typedName && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Preview: <span style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '18px', color: '#5b21b6' }}>{typedName}</span></p>
              )}
            </div>
          )}

          {signMethod === 'upload' && (
            <div style={{ marginBottom: '20px', border: '2px dashed #c4b5fd', borderRadius: '14px', background: '#faf5ff', padding: '20px', textAlign: 'center' }}>
              {uploadedImage ? (
                <div>
                  <img src={uploadedImage} alt="Uploaded signature" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                  <button onClick={() => setUploadedImage(null)} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>🗑 Remove Image</button>
                </div>
              ) : (
                <div>
                  <label style={{ cursor: 'pointer', display: 'inline-block', padding: '10px 20px', background: 'white', border: '1px solid #d8b4fe', borderRadius: '8px', color: '#6b21a8', fontWeight: '700', fontSize: '13px' }}>
                    Choose Image File
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            // Convert any format (WebP, GIF, BMP, etc.) to PNG via canvas
                            // so pdf-lib can embed it regardless of original format
                            const img = new Image();
                            img.onload = () => {
                              const cvs = document.createElement('canvas');
                              cvs.width = img.naturalWidth;
                              cvs.height = img.naturalHeight;
                              const ctx = cvs.getContext('2d');
                              // White background for JPG originals (for transparent PNGs keep transparent)
                              if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                                ctx.fillStyle = 'white';
                                ctx.fillRect(0, 0, cvs.width, cvs.height);
                              }
                              ctx.drawImage(img, 0, 0);
                              const pngDataUrl = cvs.toDataURL('image/png');
                              console.log('Uploaded image converted to PNG, length:', pngDataUrl.length, '| original format:', file.type);
                              setUploadedImage(pngDataUrl);
                              signatureImageRef.current = pngDataUrl; // set immediately
                            };
                            img.src = ev.target.result;
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9ca3af' }}>PNG or JPG. Transparent background recommended.</p>
                </div>
              )}
            </div>
          )}

          {/* Date Field */}
          <div style={{ marginBottom: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📅 Signing Date
            </label>
            <input
              type="date"
              value={signedDate}
              onChange={e => setSignedDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9d5ff', borderRadius: '10px', fontSize: '14px', color: '#1f2937', outline: 'none', background: 'white', boxSizing: 'border-box' }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af' }}>This date will be included in the signed document and audit trail.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep('VIEW')} style={{ flex: 1, padding: '14px', background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', color: '#6b7280', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              ← Back
            </button>
            <button
              onClick={handleProceedToAdjust}
              style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}
            >
              Next: Adjust Placement →
            </button>
          </div>
        </div>
      )}

      {/* ─── ADJUST STEP ─── */}
      {step === 'ADJUST' && (
        <div style={{ background: 'white', borderRadius: '24px', padding: '20px 24px', width: '100%', maxWidth: '1100px', boxShadow: '0 20px 60px rgba(124,58,237,0.12)', border: '1px solid #ede9fe' }}>

          {/* ── Sticky Toolbar ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', padding: '12px 16px', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', position: 'sticky', top: '8px', zIndex: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1f2937' }}>📍 Place Your Signature</h2>
              <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '12px' }}>Drag the boxes to move them. Resize with + / − buttons.</p>
            </div>

            {/* Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #d8b4fe' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d8b4fe', background: currentPage === 1 ? '#f3f4f6' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px' }}>‹</button>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', minWidth: '70px', textAlign: 'center' }}>Page {currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d8b4fe', background: currentPage === numPages ? '#f3f4f6' : 'white', cursor: currentPage === numPages ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px' }}>›</button>
            </div>

            {/* Field Size Controls */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {finalFields.filter(f => f.page === currentPage).map(field => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '6px 10px', borderRadius: '8px', border: `2px solid ${field.type === 'sign' ? '#7c3aed' : '#0891b2'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: field.type === 'sign' ? '#5b21b6' : '#0e7490' }}>
                    {field.type === 'sign' ? '✍️ Sign' : '📅 Date'}
                  </span>
                  <button onClick={() => updateField(field.id, { width: Math.max(5, (field.width||25) * 0.85), height: Math.max(2, (field.height||10) * 0.85) })}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '700', fontSize: '14px', lineHeight: 1 }}>−</button>
                  <button onClick={() => updateField(field.id, { width: Math.min(80, (field.width||25) * 1.15), height: Math.min(40, (field.height||10) * 1.15) })}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '700', fontSize: '14px', lineHeight: 1 }}>+</button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setStep('SIGN')}
                style={{ padding: '8px 18px', background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '8px 22px', background: submitting ? '#a78bfa' : 'linear-gradient(135deg, #5b21b6, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                {submitting ? '⏳ Finalizing...' : '✅ Confirm & Sign'}
              </button>
            </div>
          </div>

          {/* ── PDF Scroll Viewer ── */}
          <div style={{ overflow: 'auto', maxHeight: '78vh', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#6b7280', display: 'flex', justifyContent: 'center', padding: '12px' }}>
            {/* Inner wrapper — sized to match canvas exactly so % overlays work correctly */}
            <div ref={pdfWrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
              <canvas ref={pdfCanvasRef} style={{ display: 'block' }} />

              {finalFields.filter(f => f.page === currentPage).map(field => (
                <div
                  key={field.id}
                  title={field.type === 'sign' ? 'Drag to reposition signature' : 'Drag to reposition date'}
                  style={{
                    position: 'absolute',
                    left:   `${field.x}%`,
                    top:    `${field.y}%`,
                    width:  `${field.width  || (field.type === 'sign' ? 25 : 15)}%`,
                    height: `${field.height || (field.type === 'sign' ? 10 : 5)}%`,
                    cursor: 'move',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    // Completely transparent — NO box, NO border, NO outline
                    overflow: 'visible',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const isTouch = e.type === 'touchstart';
                    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
                    
                    const startX = clientX;
                    const startY = clientY;
                    const startLeft = field.x;
                    const startTop  = field.y;
                    const wrapRect  = pdfWrapperRef.current.getBoundingClientRect();
                    const move = (ev) => {
                      if (ev.type === 'touchmove') ev.preventDefault();
                      
                      const evX = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
                      const evY = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
                      
                      const dx = ((evX - startX) / wrapRect.width)  * 100;
                      const dy = ((evY - startY) / wrapRect.height) * 100;
                      const fw = field.width  || (field.type === 'sign' ? 25 : 15);
                      const fh = field.height || (field.type === 'sign' ? 10 : 5);
                      updateField(field.id, {
                        x: Math.max(0, Math.min(100 - fw, startLeft + dx)),
                        y: Math.max(0, Math.min(100 - fh, startTop  + dy)),
                      });
                    };
                    const up = () => { 
                      window.removeEventListener('mousemove', move); 
                      window.removeEventListener('mouseup', up); 
                      window.removeEventListener('touchmove', move); 
                      window.removeEventListener('touchend', up); 
                    };
                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                    window.addEventListener('touchmove', move, { passive: false });
                    window.addEventListener('touchend', up);
                  }}
                  onTouchStart={(e) => {
                    // Stop propagation to avoid double firing on some devices, but allow custom logic
                    const isTouch = e.type === 'touchstart';
                    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
                    
                    const startX = clientX;
                    const startY = clientY;
                    const startLeft = field.x;
                    const startTop  = field.y;
                    const wrapRect  = pdfWrapperRef.current.getBoundingClientRect();
                    const move = (ev) => {
                      if (ev.type === 'touchmove') ev.preventDefault();
                      
                      const evX = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
                      const evY = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
                      
                      const dx = ((evX - startX) / wrapRect.width)  * 100;
                      const dy = ((evY - startY) / wrapRect.height) * 100;
                      const fw = field.width  || (field.type === 'sign' ? 25 : 15);
                      const fh = field.height || (field.type === 'sign' ? 10 : 5);
                      updateField(field.id, {
                        x: Math.max(0, Math.min(100 - fw, startLeft + dx)),
                        y: Math.max(0, Math.min(100 - fh, startTop  + dy)),
                      });
                    };
                    const up = () => { 
                      window.removeEventListener('mousemove', move); 
                      window.removeEventListener('mouseup', up); 
                      window.removeEventListener('touchmove', move); 
                      window.removeEventListener('touchend', up); 
                    };
                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                    window.addEventListener('touchmove', move, { passive: false });
                    window.addEventListener('touchend', up);
                  }}
                >
                  {field.type === 'sign' ? (
                    signMethod === 'type' ? (
                      <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                        <text x="150" y="55" dominantBaseline="middle" textAnchor="middle" fill="#1e1b4b" fontFamily="Brush Script MT, cursive" fontSize="60">
                          {typedName}
                        </text>
                      </svg>
                    ) : (
                      // Signature image — contained within field bounds
                      <div style={{ width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
                        <img
                          src={signatureImageRef.current || drawnImage || uploadedImage}
                          alt="Signature"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                    )
                  ) : (
                    // Date text — overflow visible so it never gets clipped when box is small
                    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontFamily: 'Inter, Arial, sans-serif',
                        fontWeight: '700',
                        // Scales with box height; default height 5% = 14px
                        fontSize: `${Math.max(8, (field.height || 5) * 2.8)}px`,
                        color: '#111827',
                        lineHeight: 1,
                        display: 'block',
                      }}>
                        {new Date(signedDate).toLocaleDateString('en-US', { dateStyle: 'long' })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
            📌 PDF shown at actual screen size — scroll to see full document. Drag the highlighted boxes to position your signature and date.
          </p>
        </div>
      )}

      {/* ─── DONE STEP ─── */}
      {step === 'DONE' && (
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(16,185,129,0.12)', border: '1px solid #d1fae5' }}>
          <div style={{ width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '36px' }}>
            ✅
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: '800', color: '#065f46' }}>Signed Successfully!</h2>
          <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '15px', lineHeight: '1.6' }}>
            Your electronic signature has been applied and recorded. The sender will be notified automatically.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '28px', textAlign: 'left' }}>
            <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#065f46', fontSize: '13px' }}>✅ What happens next?</p>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#047857', fontSize: '13px', lineHeight: '1.8' }}>
              <li>Sender receives notification immediately</li>
              <li>Signed document is saved securely</li>
              <li>Audit trail is recorded (IP, time, device)</li>
            </ul>
          </div>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>You may now close this tab.</p>
        </div>
      )}

      <p style={{ marginTop: '24px', color: '#9ca3af', fontSize: '12px' }}>
        Powered by <strong style={{ color: '#7c3aed' }}>TheyLovePDF</strong> — Secure Electronic Signatures
      </p>
    </div>
  );
}

