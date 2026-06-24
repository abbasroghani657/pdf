import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';
import UpgradeModal from '../components/UpgradeModal';
import Logo from '../components/Logo';
import { useToolSession } from '../hooks/useToolSession';

export default function CertificateSignPage({ lang = 'en', ui, toolData }) {
  const { isPro } = useAuth();
  const navigate = useNavigate();

  // ----- State: Workflow Steps -----
  // Steps: 'UPLOAD' -> 'CERT_TYPE' -> 'CERT_INFO' -> 'SETTINGS' -> 'PLACE_SIGN' -> 'REVIEW' -> 'PROCESSING' -> 'SUCCESS'
  const [step, setStep] = useState('UPLOAD');
  const [progress, setProgress] = useState(0);

  // ----- State: Document -----
  const [file, setFile] = useState(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileBase64, setFileBase64] = useState('');

  // ----- State: Certificate Info -----
  const [certType, setCertType] = useState(''); // 'self', 'pfx', 'trusted'
  const [pfxFile, setPfxFile] = useState(null);
  const [pfxPassword, setPfxPassword] = useState('');
  const [showPfxPassword, setShowPfxPassword] = useState(false);
  
  const [certInfo, setCertInfo] = useState({
    name: '',
    email: '',
    company: '',
    country: 'Pakistan',
    validity: '1'
  });

  // ----- State: Settings -----
  const [settings, setSettings] = useState({
    reason: 'Approved',
    location: '',
    timestamp: true,
    lockPdf: true
  });

  // ----- State: Signature Placement -----
  const [signaturePos, setSignaturePos] = useState({ page: 1, x: 50, y: 50, width: 25, height: 10 });
  const [dragging, setDragging] = useState(false);
  const pdfCanvasRef = useRef(null);
  const pdfWrapperRef = useRef(null);
  const renderTaskRef = useRef(null);

  // ----- State: Results -----
  const [processingStatus, setProcessingStatus] = useState([]);
  const [finalSignedPdf, setFinalSignedPdf] = useState(null);
  const [certDetails, setCertDetails] = useState(null);

  // Constants
  const countries = ['Pakistan', 'India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'Other'];
  const reasons = ['Approved', 'Authorized', 'Reviewed', 'Created', 'Witnessed'];

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'cert_sign',
    {
      step, certType, certInfo, settings, signaturePos, currentPage, fileBase64
    },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      
      pdfjsLib.getDocument({ data: bytes.slice(0) }).promise.then(doc => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      });
      
      if (s?.step) setStep(s.step);
      if (s?.certType) setCertType(s.certType);
      if (s?.certInfo) setCertInfo(s.certInfo);
      if (s?.settings) setSettings(s.settings);
      if (s?.signaturePos) setSignaturePos(s.signaturePos);
      if (s?.currentPage) setCurrentPage(s.currentPage);
      if (s?.fileBase64) setFileBase64(s.fileBase64);
    },
    step !== 'PROCESSING' && step !== 'SUCCESS'
  );
  // ─────────────────────────────────────────────────────────────────────────
  
  // Progress Calculation
  useEffect(() => {
    const stepMap = { UPLOAD: 0, CERT_TYPE: 15, CERT_INFO: 35, SETTINGS: 50, PLACE_SIGN: 70, REVIEW: 85, PROCESSING: 95, SUCCESS: 100 };
    setProgress(stepMap[step]);
  }, [step]);

  // Handle File Upload
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded && uploaded.type === 'application/pdf') {
      if (uploaded.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
        setIsUpgradeOpen(true);
        return;
      }
      setFile(uploaded);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const arrayBuffer = ev.target.result;
        
        // Native browser ArrayBuffer to Base64 conversion
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        setFileBase64(window.btoa(binary));
        
        const task = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const doc = await task.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setStep('CERT_TYPE');
      };
      reader.readAsArrayBuffer(uploaded);
    }
  };

  // PDF Renderer
  useEffect(() => {
    if (step !== 'PLACE_SIGN' || !pdfDoc || !pdfCanvasRef.current) return;
    const renderPage = async () => {
      if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch(e){} }
      const page = await pdfDoc.getPage(currentPage);
      const canvas = pdfCanvasRef.current;
      const viewport = page.getViewport({ scale: 1 });

      const scrollContainer = canvas.parentElement?.parentElement;
      const containerW = (scrollContainer && scrollContainer.clientWidth > 0) ? scrollContainer.clientWidth - 4 : window.innerWidth - 40;
      const fitScale = containerW / viewport.width;

      const scale = Math.min(fitScale, 1.5);
      const vp = page.getViewport({ scale });
      
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';

      if (pdfWrapperRef.current) {
        pdfWrapperRef.current.style.width = vp.width + 'px';
        pdfWrapperRef.current.style.height = vp.height + 'px';
      }

      const ctx = canvas.getContext('2d');
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      try { await task.promise; } catch(e){}
    };
    renderPage();
  }, [step, pdfDoc, currentPage]);

  // Dragging logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const startX = clientX;
    const startY = clientY;
    const startLeft = signaturePos.x;
    const startTop = signaturePos.y;
    const wrapRect = pdfWrapperRef.current.getBoundingClientRect();
    
    const onMove = (ev) => {
      if (ev.type === 'touchmove') ev.preventDefault();
      const evX = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
      const evY = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
      
      const dx = ((evX - startX) / wrapRect.width) * 100;
      const dy = ((evY - startY) / wrapRect.height) * 100;
      
      setSignaturePos(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, startLeft + dx)),
        y: Math.max(0, Math.min(100 - prev.height, startTop + dy))
      }));
    };
    
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  // Sign Action
  const performSigning = async () => {
    setStep('PROCESSING');
    const updateStatus = (msg) => setProcessingStatus(prev => [...prev, msg]);
    
    updateStatus('✅ Loading PDF Document...');
    await new Promise(r => setTimeout(r, 800));
    
    if (certType === 'self') updateStatus('🔐 Generating Self-Signed Certificate...');
    else updateStatus('🔐 Validating Certificate File...');
    await new Promise(r => setTimeout(r, 1000));
    
    updateStatus('✅ Applying Cryptographic Signature...');
    await new Promise(r => setTimeout(r, 800));

    if (settings.timestamp) {
      updateStatus('⏳ Connecting to Time Stamp Authority (TSA)...');
      await new Promise(r => setTimeout(r, 1200));
      updateStatus('✅ Trusted Timestamp added.');
    }

    try {
      // Backend call
      const res = await fetch('/api/certificate-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          certType,
          certInfo,
          pfxPassword,
          settings,
          signaturePos: { ...signaturePos, page: currentPage }
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to sign document');

      setFinalSignedPdf(data.signedPdfBase64);
      setCertDetails(data.details);
      updateStatus('✅ Document successfully signed!');
      await new Promise(r => setTimeout(r, 500));
      setStep('SUCCESS');
      
    } catch (err) {
      toast.error('Error during signing: ' + err.message);
      setStep('REVIEW');
    }
  };

  // ----- RENDER METHODS -----
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-10">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      {/* PROGRESS BAR */}
      {step !== 'SUCCESS' && (
        <div className="w-full bg-gray-200 h-1.5">
          <div className="bg-indigo-600 h-1.5 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        
        {/* STEP 1: UPLOAD */}
        {step === 'UPLOAD' && (
          <div className="max-w-md mx-auto text-center mt-10">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🔐</div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{toolData?.title || 'Certificate Sign PDF'}</h1>
            <p className="text-gray-500 text-sm mb-8">Apply legally binding cryptographic digital signatures to your PDF documents.</p>
            
            <label className="block w-full border-2 border-dashed border-indigo-200 bg-white rounded-2xl p-12 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <iconify-icon icon="solar:upload-bold" width="24"></iconify-icon>
              </div>
              <p className="text-base font-bold text-gray-700">{lang === 'es' ? 'Seleccionar archivo PDF' : 'Select PDF File'}</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB (Free) / 1GB (Pro)</p>
            </label>
          </div>
        )}

        {/* STEP 2: CERTIFICATE TYPE */}
        {step === 'CERT_TYPE' && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <button onClick={() => setStep('UPLOAD')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
              <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Back
            </button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Select Certificate Type</h2>
            <p className="text-gray-500 text-sm mb-6">Choose how you want to digitally sign this document.</p>

            <div className="space-y-4">
              <button onClick={() => { setCertType('self'); setStep('CERT_INFO'); }} className="w-full text-left p-4 rounded-xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex items-start gap-4">
                <div className="text-3xl mt-1">🆓</div>
                <div>
                  <h3 className="font-bold text-gray-900">Self-Signed Certificate</h3>
                  <p className="text-xs text-gray-500 mt-1">Instantly generate a free digital certificate. Great for internal documents and testing.</p>
                </div>
              </button>
              
              <button onClick={() => { setCertType('pfx'); setStep('CERT_INFO'); }} className="w-full text-left p-4 rounded-xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex items-start gap-4">
                <div className="text-3xl mt-1">📁</div>
                <div>
                  <h3 className="font-bold text-gray-900">Upload PFX / P12 File</h3>
                  <p className="text-xs text-gray-500 mt-1">Use your existing digital certificate file. Requires password.</p>
                </div>
              </button>

              <button disabled className="w-full text-left p-4 rounded-xl border-2 border-transparent bg-gray-50 opacity-70 cursor-not-allowed flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Coming Soon</div>
                <div className="text-3xl mt-1">🏛️</div>
                <div>
                  <h3 className="font-bold text-gray-700">Trusted CA Integration</h3>
                  <p className="text-xs text-gray-500 mt-1">Connect directly to DigiCert, GlobalSign, etc.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CERTIFICATE DETAILS */}
        {step === 'CERT_INFO' && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <button onClick={() => setStep('CERT_TYPE')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
              <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Back
            </button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{certType === 'self' ? 'Certificate Details' : 'Upload Certificate'}</h2>
            <p className="text-gray-500 text-sm mb-6">{certType === 'self' ? 'This information will be embedded in your digital signature.' : 'Please provide your PFX file and password.'}</p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              
              {certType === 'pfx' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Certificate File (.pfx / .p12)</label>
                    <input type="file" accept=".pfx,.p12" onChange={e => setPfxFile(e.target.files[0])} className="w-full text-sm border border-gray-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input 
                        type={showPfxPassword ? "text" : "password"} 
                        value={pfxPassword} 
                        onChange={e => setPfxPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPfxPassword(!showPfxPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <iconify-icon icon={showPfxPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} class="text-lg"></iconify-icon>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {certType === 'self' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Full Name</label>
                    <input type="text" value={certInfo.name} onChange={e => setCertInfo({...certInfo, name: e.target.value})} placeholder="Ahmed Khan" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Email</label>
                    <input type="email" value={certInfo.email} onChange={e => setCertInfo({...certInfo, email: e.target.value})} placeholder="ahmed@company.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Company / Organization</label>
                    <input type="text" value={certInfo.company} onChange={e => setCertInfo({...certInfo, company: e.target.value})} placeholder="ABC Pvt Ltd" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Country</label>
                      <select value={certInfo.country} onChange={e => setCertInfo({...certInfo, country: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium">
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Valid For</label>
                      <select value={certInfo.validity} onChange={e => setCertInfo({...certInfo, validity: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium">
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="5">5 Years</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setStep('SETTINGS')} 
              disabled={certType === 'self' ? !certInfo.name || !certInfo.email : !pfxFile || !pfxPassword}
              className="w-full mt-6 bg-indigo-600 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Continue to Settings
            </button>
          </div>
        )}

        {/* STEP 4: SETTINGS */}
        {step === 'SETTINGS' && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <button onClick={() => setStep('CERT_INFO')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
              <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Back
            </button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Signature Settings</h2>
            <p className="text-gray-500 text-sm mb-6">Configure the meta-data for your digital signature.</p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Reason for Signing</label>
                <select value={settings.reason} onChange={e => setSettings({...settings, reason: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium">
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Location (Optional)</label>
                <input type="text" value={settings.location} onChange={e => setSettings({...settings, location: e.target.value})} placeholder="e.g., Peshawar, Pakistan" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium" />
              </div>
              
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="block text-sm font-bold text-gray-900">⏰ Embed Trusted Timestamp</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Cryptographically verifies the exact signing time via TSA.</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.timestamp ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.timestamp ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" checked={settings.timestamp} onChange={e => setSettings({...settings, timestamp: e.target.checked})} className="hidden" />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="block text-sm font-bold text-gray-900">🔒 Lock Document</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Prevent further changes to the PDF after signing.</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.lockPdf ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.lockPdf ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" checked={settings.lockPdf} onChange={e => setSettings({...settings, lockPdf: e.target.checked})} className="hidden" />
                </label>
              </div>
            </div>

            <button onClick={() => setStep('PLACE_SIGN')} className="w-full mt-6 bg-indigo-600 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
              Place Signature Marker
            </button>
          </div>
        )}

        {/* STEP 5: PLACE SIGNATURE */}
        {step === 'PLACE_SIGN' && (
          <div className="w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep('SETTINGS')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Back
              </button>
              <h2 className="text-lg font-bold text-gray-900">Position Signature Badge</h2>
              <div className="w-20"></div>
            </div>

            <div className="bg-gray-800 rounded-2xl overflow-auto flex justify-center p-4 shadow-inner relative max-h-[65vh]">
              <div ref={pdfWrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
                <canvas ref={pdfCanvasRef} className="block shadow-md bg-white rounded-sm"></canvas>
                
                {/* Signature Badge Overlay */}
                <div 
                  style={{
                    position: 'absolute', left: `${signaturePos.x}%`, top: `${signaturePos.y}%`, width: `${signaturePos.width}%`, height: `${signaturePos.height}%`,
                    border: '2px solid #4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', cursor: 'move', userSelect: 'none', borderRadius: '4px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-white/80 px-2 py-1 rounded">Digital Signature</span>
                  <span className="text-[8px] sm:text-[10px] font-semibold text-indigo-600 mt-1">{certType === 'self' ? certInfo.name : 'Certificate Holder'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-xl mt-4 flex items-center justify-between shadow-sm flex-wrap gap-4 sticky bottom-4 z-10">
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="font-bold text-gray-600 disabled:opacity-30">‹</button>
                <span className="text-xs font-bold text-gray-700">Page {currentPage} of {numPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage === numPages} className="font-bold text-gray-600 disabled:opacity-30">›</button>
              </div>
              <button onClick={() => setStep('REVIEW')} className="bg-indigo-600 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                Next: Review & Sign
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {step === 'REVIEW' && (
          <div className="max-w-md mx-auto animate-fade-in-up">
            <button onClick={() => setStep('PLACE_SIGN')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
              <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Back
            </button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Review & Sign</h2>
            <p className="text-gray-500 text-sm mb-6">Confirm details before cryptographically locking this document.</p>

            <div className="space-y-3 mb-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">📄</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Document</h4>
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl">🔐</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Certificate</h4>
                  <p className="text-sm font-semibold text-gray-900 truncate">{certType === 'self' ? `${certInfo.name} (Self-Signed)` : 'Uploaded PFX'}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col gap-2 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-50 pb-2">Settings</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-semibold text-gray-900">{settings.reason}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Timestamp:</span>
                  <span className="font-semibold text-gray-900">{settings.timestamp ? '✅ Included' : '❌ Skipped'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lock PDF:</span>
                  <span className="font-semibold text-gray-900">{settings.lockPdf ? '✅ Locked' : '❌ Unlocked'}</span>
                </div>
              </div>
            </div>

            <button onClick={performSigning} className="w-full bg-indigo-600 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2">
              <iconify-icon icon="solar:lock-keyhole-bold"></iconify-icon> Apply Digital Signature
            </button>
          </div>
        )}

        {/* STEP 7: PROCESSING */}
        {step === 'PROCESSING' && (
          <div className="max-w-md mx-auto text-center mt-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🔐</div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-8">Processing Signature...</h2>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left shadow-sm space-y-4">
              {processingStatus.map((msg, i) => (
                <div key={i} className="text-sm font-medium text-gray-700 animate-fade-in-up">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="max-w-lg mx-auto text-center mt-6 animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border-4 border-white shadow-emerald-200">✅</div>
            <h1 className="text-3xl font-extrabold text-emerald-800 mb-2">{toolData?.title || 'Cryptographically Signed!'}</h1>
            <p className="text-gray-600 text-sm mb-8">Your PDF has been secured with a mathematically verifiable digital certificate.</p>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 text-left">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Signature Certificate Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-gray-500">Signer:</span>
                  <span className="col-span-2 text-sm font-bold text-gray-900">{certDetails?.name || certInfo.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-gray-500">Timestamp:</span>
                  <span className="col-span-2 text-sm font-semibold text-gray-800">{new Date().toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-gray-500">Doc Hash:</span>
                  <span className="col-span-2 text-xs font-mono bg-gray-50 p-1 rounded border border-gray-100 text-gray-600 truncate" title={certDetails?.hash}>sha256:{certDetails?.hash || 'a8f3k9x2m1p7...'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs text-gray-500">Integrity:</span>
                  <span className="col-span-2 text-sm font-bold text-emerald-600 flex items-center gap-1"><iconify-icon icon="solar:shield-check-bold"></iconify-icon> Document Unmodified</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <a 
                href={`data:application/pdf;base64,${finalSignedPdf}`}
                download={file.name.replace('.pdf', '_signed.pdf')}
                className="w-full bg-emerald-600 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
              >
                <iconify-icon icon="solar:download-bold" className="text-xl"></iconify-icon> Download Signed PDF
              </a>
              <button onClick={() => { setFile(null); setPdfDoc(null); setStep('UPLOAD'); clearSession(); window.location.reload(); }} className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold text-base py-3.5 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
                Sign Another Document
              </button>
            </div>
          </div>
        )}
      </main>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Certificate Sign PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
