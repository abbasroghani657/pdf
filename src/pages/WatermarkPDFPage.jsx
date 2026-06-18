import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';
import UpgradeModal from '../components/UpgradeModal';

export default function WatermarkPDFPage() {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  
  // Mobile Steps
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [step, setStep] = useState('UPLOAD');

  // State
  const [wmType, setWmType] = useState('text'); 
  
  // Text State
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFont, setWmFont] = useState('Helvetica');
  const [wmSize, setWmSize] = useState(72);
  const [wmColor, setWmColor] = useState('#000000');
  
  // Image State
  const [wmImageFile, setWmImageFile] = useState(null);
  const [wmImageBytes, setWmImageBytes] = useState(null);
  const [wmImageSize, setWmImageSize] = useState(200);

  // Appearance & Position State
  const [wmOpacity, setWmOpacity] = useState(30);
  const [wmRotation, setWmRotation] = useState(-45);
  // Position as % of canvas (0-100 each axis, top-left origin)
  const [wmX, setWmX] = useState(50);
  const [wmY, setWmY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [wmApplyTo, setWmApplyTo] = useState('all');
  const [wmSpecificPages, setWmSpecificPages] = useState('');
  
  // Pro modal
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { isPro } = useAuth();
  
  const checkPro = (msg) => {
    if (!isPro) {
      setUpgradeMessage(msg);
      setIsUpgradeOpen(true);
      return false;
    }
    return true;
  };

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Session
  const { clearSession } = useToolSession(
    'watermark_pdf',
    { wmType, wmText, wmFont, wmSize, wmColor, wmImageSize, wmOpacity, wmRotation, wmX, wmY, wmApplyTo, wmSpecificPages },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setFileBytes(bytes);
      pdfjsLib.getDocument({ data: bytes.slice(0) }).promise.then(doc => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      });
      if (s) {
        if (s.wmType) setWmType(s.wmType);
        if (s.wmText) setWmText(s.wmText);
        if (s.wmSize) setWmSize(s.wmSize);
        if (s.wmColor) setWmColor(s.wmColor);
        if (s.wmOpacity) setWmOpacity(s.wmOpacity);
        if (s.wmRotation !== undefined) setWmRotation(s.wmRotation);
        if (s.wmX !== undefined) setWmX(s.wmX);
        if (s.wmY !== undefined) setWmY(s.wmY);
        if (s.wmApplyTo) setWmApplyTo(s.wmApplyTo);
        if (s.wmSpecificPages !== undefined) setWmSpecificPages(s.wmSpecificPages);
      }
      if (isMobile) setStep('CHOOSE_TYPE');
    }
  );

  // ── Drag handlers ────────────────────────────────────────────────
  const getRelativePos = (clientX, clientY) => {
    // Use the canvas element directly for maximum accuracy
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setWmX(x);
    setWmY(y);
  };
  const handleWmMouseDown = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleContainerMouseMove = (e) => { if (isDragging) getRelativePos(e.clientX, e.clientY); };
  const handleContainerMouseUp = () => setIsDragging(false);
  const handleWmTouchStart = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleContainerTouchMove = (e) => {
    if (isDragging && e.touches[0]) getRelativePos(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleContainerTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f || f.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file.');
      return;
    }
    if (f.size > 2000 * 1024 * 1024) {
      checkPro("Files over 2GB require a Pro account. Upgrade to Pro for massive file uploads.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const bytes = new Uint8Array(ev.target.result);
      setFileBytes(bytes);
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      if (isMobile) setStep('CHOOSE_TYPE');
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setWmImageFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setWmImageBytes(new Uint8Array(ev.target.result));
    };
    reader.readAsArrayBuffer(f);
  };

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      
      let viewport = page.getViewport({ scale: 1 });
      const containerWidth = isMobile ? window.innerWidth - 32 : window.innerWidth - 360;
      const desiredScale = Math.min(1.5, containerWidth / viewport.width) * 0.95;
      setScale(desiredScale);
      
      viewport = page.getViewport({ scale: desiredScale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      
      const renderContext = { canvasContext: context, viewport };
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      
      await renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error("Render error", err);
      }
    }
  }, [pdfDoc, currentPage, isMobile]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Download PDF
  const [isProcessing, setIsProcessing] = useState(false);
  const processAndDownload = async () => {
    setIsProcessing(true);
    if (isMobile) setStep('PROCESSING');
    
    try {
      const pDoc = await PDFDocument.load(fileBytes);
      const font = await pDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pDoc.getPages();
      
      let imgObj = null;
      if (wmType === 'image' && wmImageBytes) {
        if (wmImageFile.type === 'image/png') imgObj = await pDoc.embedPng(wmImageBytes);
        else if (wmImageFile.type === 'image/jpeg') imgObj = await pDoc.embedJpg(wmImageBytes);
      }
      
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16)/255, g: parseInt(result[2], 16)/255, b: parseInt(result[3], 16)/255 } : {r:0,g:0,b:0};
      };
      const c = hexToRgb(wmColor);
      const color = rgb(c.r, c.g, c.b);
      
      const parsePagesString = (str, total) => {
        const pagesSet = new Set();
        const parts = str.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
              for (let i = Math.max(1, start); i <= Math.min(total, end); i++) pagesSet.add(i);
            }
          } else {
            const num = Number(part);
            if (!isNaN(num) && num >= 1 && num <= total) pagesSet.add(num);
          }
        }
        return Array.from(pagesSet);
      };
      const specificPagesArr = wmApplyTo === 'specific' ? parsePagesString(wmSpecificPages, pages.length) : [];

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        if (wmApplyTo === 'first' && pageNum !== 1) continue;
        if (wmApplyTo === 'last' && pageNum !== pages.length) continue;
        if (wmApplyTo === 'odd' && pageNum % 2 === 0) continue;
        if (wmApplyTo === 'even' && pageNum % 2 !== 0) continue;
        if (wmApplyTo === 'specific' && !specificPagesArr.includes(pageNum)) continue;
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        let drawW = 0; let drawH = 0;
        let actualText = wmText.replace('{PAGE}', pageNum).replace('{DATE}', new Date().toLocaleDateString());
        
        if (wmType === 'text') {
          drawW = font.widthOfTextAtSize(actualText, wmSize);
          drawH = wmSize;
        } else if (imgObj) {
          drawW = wmImageSize;
          drawH = (imgObj.height / imgObj.width) * wmImageSize;
        }
        
        // ── PDF coordinate conversion (rotation-aware) ─────────────────────
        // KEY: CSS Y-axis goes DOWN, PDF Y-axis goes UP.
        //   CSS rotate(-45deg) = CCW visually = must use degrees(45) in pdf-lib
        //   So pdfRotDeg = -wmRotation
        //
        // KEY: pdf-lib places text at baseline-LEFT, images at bottom-LEFT.
        //   We must rotate the half-dimension offset to find the true origin.
        const pdfRotDeg = -wmRotation; // negate to match CSS visual direction
        const pdfRotRad = pdfRotDeg * (Math.PI / 180);
        const cosR = Math.cos(pdfRotRad);
        const sinR = Math.sin(pdfRotRad);

        // Center point in PDF space (flip Y from canvas %)
        const cx = (wmX / 100) * width;
        const cy = height - (wmY / 100) * height;

        // Half-dimensions in the element's local frame
        const halfW = drawW / 2;
        // For text, visual center is ~35% above baseline; for images it's 50%
        const halfH = wmType === 'text' ? wmSize * 0.35 : drawH / 2;

        // Rotate the local offset vector by pdfRotRad to get world-space offset
        // origin = center - rotated(halfW, halfH)
        let x = cx - (halfW * cosR - halfH * sinR);
        let y = cy - (halfW * sinR + halfH * cosR);

        // Clamp within page bounds
        x = Math.max(0, Math.min(width - 1, x));
        y = Math.max(0, Math.min(height - 1, y));

        if (wmType === 'text') {
           page.drawText(actualText, { x, y, size: wmSize, font, color, opacity: wmOpacity/100, rotate: degrees(pdfRotDeg) });
        } else if (imgObj) {
           page.drawImage(imgObj, { x, y, width: drawW, height: drawH, opacity: wmOpacity/100, rotate: degrees(pdfRotDeg) });
        }
      }
      
      const newPdfBytes = await pDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Watermark applied successfully!');
      if (isMobile) setStep('SUCCESS');
      clearSession();
    } catch (e) {
      console.error(e);
      toast.error("Failed to apply watermark.");
      if (isMobile) setStep('PREVIEW');
    } finally {
      setIsProcessing(false);
    }
  };

  const MobileProgress = ({ current }) => {
    const map = { UPLOAD: 10, CHOOSE_TYPE: 25, TEXT_SETTINGS: 40, IMAGE_SETTINGS: 40, APPEARANCE: 60, POSITION: 80, PREVIEW: 95, SUCCESS: 100 };
    return (
      <div className="w-full h-1 bg-gray-100"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${map[current]}%` }} /></div>
    );
  };

  // Preview overlay CSS styles
  const getPreviewStyles = () => ({
    position: 'absolute',
    left: `${wmX}%`,
    top: `${wmY}%`,
    transform: `translate(-50%, -50%) rotate(${wmRotation}deg)`,
    opacity: wmOpacity / 100,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: 10,
    pointerEvents: 'auto',
    ...(wmType === 'text' ? {
      color: wmColor,
      fontSize: `${wmSize * scale}px`,
      fontWeight: 'bold',
      fontFamily: wmFont,
      whiteSpace: 'nowrap',
    } : {
      width: `${wmImageSize * scale}px`,
    })
  });

  if (!file && !isMobile) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
            <iconify-icon icon="solar:stamp-bold-duotone" class="text-4xl"></iconify-icon>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Watermark PDF</h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.</p>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all shadow-indigo-600/30 shadow-lg flex items-center justify-center gap-3 mx-auto">
            <iconify-icon icon="solar:folder-with-files-linear" class="text-2xl"></iconify-icon> Select PDF File
          </button>
        </div>
      </div>
    );
  }

  // DESKTOP LAYOUT
  if (!isMobile) {
    return (
      <div className="h-screen flex flex-col bg-[#f3f4f6] overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/" onClick={clearSession} className="text-gray-500 hover:text-gray-900 transition-colors">
              <iconify-icon icon="solar:home-smile-linear" class="text-xl"></iconify-icon>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <h1 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <iconify-icon icon="solar:stamp-linear" class="text-indigo-600"></iconify-icon> Watermark PDF
            </h1>
          </div>
          <button onClick={processAndDownload} disabled={isProcessing} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all">
            {isProcessing ? <iconify-icon icon="solar:spinner-linear" class="animate-spin"></iconify-icon> : <iconify-icon icon="solar:check-read-linear"></iconify-icon>}
            Apply Watermark
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto">
             <div className="p-4 space-y-6">
                
                {/* Type Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Watermark Type</label>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setWmType('text')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${wmType === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Text</button>
                    <button onClick={() => setWmType('image')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${wmType === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Image</button>
                  </div>
                </div>

                {/* Text Settings */}
                {wmType === 'text' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">Text</label>
                      <input type="text" value={wmText} onChange={e => setWmText(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="CONFIDENTIAL" />
                      <div className="flex flex-wrap gap-1 mt-2">
                         {['DRAFT', 'APPROVED', 'VOID', 'COPY'].map(p => (
                           <button key={p} onClick={() => setWmText(p)} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">{p}</button>
                         ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={wmColor} onChange={e => setWmColor(e.target.value)} className="h-9 w-9 rounded overflow-hidden cursor-pointer shrink-0 border border-gray-200 p-0" />
                          <input type="text" value={wmColor} onChange={e => setWmColor(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 text-sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 flex justify-between"><span>Size</span> <span>{wmSize}px</span></label>
                      <input type="range" min="12" max="150" value={wmSize} onChange={e => setWmSize(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                  </div>
                )}

                {/* Image Settings */}
                {wmType === 'image' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">Upload Logo/Stamp</label>
                      <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleImageUpload} className="hidden" ref={imageInputRef} />
                      <button onClick={() => imageInputRef.current.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
                        {wmImageFile ? (
                           <p className="text-sm font-semibold text-indigo-600 truncate">{wmImageFile.name}</p>
                        ) : (
                           <p className="text-sm font-semibold text-gray-500"><iconify-icon icon="solar:upload-linear" class="text-xl mb-1 block mx-auto"></iconify-icon> Select Image (PNG/JPG)</p>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 flex justify-between"><span>Image Scale</span> <span>{wmImageSize}px</span></label>
                      <input type="range" min="50" max="600" value={wmImageSize} onChange={e => setWmImageSize(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                  </div>
                )}

                <hr className="border-gray-100" />

                {/* Appearance */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Appearance</label>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 flex justify-between"><span>Opacity</span> <span>{wmOpacity}%</span></label>
                    <input type="range" min="5" max="100" value={wmOpacity} onChange={e => setWmOpacity(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 flex justify-between"><span>Rotation</span> <span>{wmRotation}°</span></label>
                    <input type="range" min="-180" max="180" value={wmRotation} onChange={e => setWmRotation(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                    <div className="flex justify-between mt-2">
                       {[-90, -45, 0, 45, 90].map(r => (
                         <button key={r} onClick={() => setWmRotation(r)} className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${wmRotation === r ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}°</button>
                       ))}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Position hint */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <iconify-icon icon="solar:cursor-bold-duotone" class="text-indigo-500 text-lg shrink-0"></iconify-icon>
                  <p className="text-xs font-semibold text-indigo-700 leading-snug">Drag the watermark on the preview to position it precisely.</p>
                </div>

                <hr className="border-gray-100" />

                {/* Pages */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Apply To</label>
                  <select value={wmApplyTo} onChange={e => setWmApplyTo(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="all">All Pages</option>
                    <option value="first">First Page Only</option>
                    <option value="last">Last Page Only</option>
                    <option value="odd">Odd Pages (1,3,5...)</option>
                    <option value="even">Even Pages (2,4,6...)</option>
                    <option value="specific">Specific Pages</option>
                  </select>
                  {wmApplyTo === 'specific' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="text" 
                        value={wmSpecificPages} 
                        onChange={e => setWmSpecificPages(e.target.value)} 
                        placeholder="e.g. 1, 3-5, 8" 
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Center Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 relative">
            <div className="min-h-full flex flex-col items-center justify-start py-8 px-8 pb-24">
              {/* Draggable preview container */}
              <div
                ref={previewContainerRef}
                className="relative shadow-2xl bg-white rounded overflow-hidden select-none"
                onMouseMove={handleContainerMouseMove}
                onMouseUp={handleContainerMouseUp}
                onMouseLeave={handleContainerMouseUp}
                onTouchMove={handleContainerTouchMove}
                onTouchEnd={handleContainerTouchEnd}
              >
                <canvas ref={canvasRef} className="block"></canvas>
                {/* Draggable Watermark Overlay */}
                <div
                  style={getPreviewStyles()}
                  onMouseDown={handleWmMouseDown}
                  onTouchStart={handleWmTouchStart}
                >
                  {wmType === 'text'
                    ? wmText.replace('{PAGE}', currentPage)
                    : (wmImageBytes ? <img src={URL.createObjectURL(new Blob([wmImageBytes]))} alt="wm" style={{width:'100%', display:'block'}} draggable={false} /> : null)
                  }
                </div>
              </div>
            </div>

            {/* Pagination Controls — sticky at the bottom of the scroll area */}
            <div className="sticky bottom-6 flex justify-center pointer-events-none">
              <div className="flex items-center gap-4 bg-gray-900/85 backdrop-blur-md px-5 py-2.5 rounded-full text-white shadow-xl pointer-events-auto">
                 <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="hover:text-indigo-300 disabled:opacity-30 transition-colors"><iconify-icon icon="solar:alt-arrow-left-linear" class="text-xl"></iconify-icon></button>
                 <span className="text-sm font-bold w-24 text-center">Page {currentPage} of {numPages}</span>
                 <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage === numPages} className="hover:text-indigo-300 disabled:opacity-30 transition-colors"><iconify-icon icon="solar:alt-arrow-right-linear" class="text-xl"></iconify-icon></button>
              </div>
            </div>
          </div>
        </div>
        
        <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} featureName="Watermark PDF" limitMessage={upgradeMessage} />
      </div>
    );
  }

  // MOBILE LAYOUT (Wizard)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Mobile Header */}
      <header className="h-14 bg-white flex items-center px-4 justify-between shrink-0 shadow-sm sticky top-0 z-50">
        <button onClick={() => step === 'UPLOAD' ? clearSession() : setStep('UPLOAD')} className="text-gray-500 hover:text-gray-900">
           {step === 'UPLOAD' ? <Link to="/"><iconify-icon icon="solar:close-circle-linear" class="text-2xl"></iconify-icon></Link> : <iconify-icon icon="solar:alt-arrow-left-linear" class="text-2xl"></iconify-icon>}
        </button>
        <span className="font-bold text-gray-800 text-sm">Watermark PDF</span>
        <div className="w-6"></div> {/* spacer */}
      </header>
      <MobileProgress current={step} />

      <main className="flex-1 overflow-y-auto p-5 flex flex-col relative" style={{paddingBottom: '5rem'}}>
         {step === 'UPLOAD' && (
           <div className="flex-1 flex flex-col justify-center items-center">
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
              <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6"><iconify-icon icon="solar:stamp-bold" class="text-5xl"></iconify-icon></div>
              <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Add Watermark</h2>
              <p className="text-center text-gray-500 mb-8 px-4 text-sm">Stamp text or image onto your PDF instantly.</p>
              <button onClick={() => fileInputRef.current.click()} className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg">{lang === 'es' ? 'Seleccionar archivo PDF' : 'Select PDF File'}</button>
           </div>
         )}
         
         {step !== 'UPLOAD' && step !== 'PROCESSING' && step !== 'SUCCESS' && (
            <div className="space-y-6">
               <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 border-b pb-2">Watermark Type</h3>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setWmType('text')} className={`flex-1 py-3 text-sm font-bold rounded-lg ${wmType === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Text</button>
                    <button onClick={() => setWmType('image')} className={`flex-1 py-3 text-sm font-bold rounded-lg ${wmType === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Image</button>
                  </div>
               </div>
               
               {wmType === 'text' && (
                 <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
                   <h3 className="font-bold text-gray-900 border-b pb-2">Text Settings</h3>
                   <input type="text" value={wmText} onChange={e => setWmText(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-bold" />
                   <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={wmColor} onChange={e => setWmColor(e.target.value)} className="h-12 w-12 rounded overflow-hidden cursor-pointer shrink-0 border border-gray-200 p-0" />
                        <input type="text" value={wmColor} onChange={e => setWmColor(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 text-sm font-mono uppercase" />
                      </div>
                   </div>
                 </div>
               )}
               
               {wmType === 'image' && (
                 <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
                   <h3 className="font-bold text-gray-900 border-b pb-2">Image Settings</h3>
                   <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleImageUpload} className="hidden" ref={imageInputRef} />
                   <button onClick={() => imageInputRef.current.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                     {wmImageFile ? (
                        <p className="text-sm font-semibold text-indigo-600 truncate">{wmImageFile.name}</p>
                     ) : (
                        <p className="text-sm font-semibold text-gray-500"><iconify-icon icon="solar:upload-linear" class="text-3xl mb-2 block mx-auto"></iconify-icon> Select Image</p>
                     )}
                   </button>
                 </div>
               )}

               <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
                 <h3 className="font-bold text-gray-900 border-b pb-2">Appearance</h3>
                 <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between"><span>Opacity</span> <span>{wmOpacity}%</span></label>
                    <input type="range" min="5" max="100" value={wmOpacity} onChange={e => setWmOpacity(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between mt-4"><span>Rotation</span> <span>{wmRotation}°</span></label>
                    <input type="range" min="-180" max="180" value={wmRotation} onChange={e => setWmRotation(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                 </div>
               </div>

               <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 border-b pb-2">Pages</h3>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Apply To</label>
                    <select value={wmApplyTo} onChange={e => setWmApplyTo(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="all">All Pages</option>
                      <option value="first">First Page Only</option>
                      <option value="last">Last Page Only</option>
                      <option value="odd">Odd Pages (1,3,5...)</option>
                      <option value="even">Even Pages (2,4,6...)</option>
                      <option value="specific">Specific Pages</option>
                    </select>
                    {wmApplyTo === 'specific' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                        <input 
                          type="text" 
                          value={wmSpecificPages} 
                          onChange={e => setWmSpecificPages(e.target.value)} 
                          placeholder="e.g. 1, 3-5, 8" 
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                    )}
                  </div>
               </div>

               {/* Mobile drag preview */}
               {file && (
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                   <p className="text-xs font-bold text-indigo-600 px-4 pt-3 pb-2 flex items-center gap-1.5">
                     <iconify-icon icon="solar:cursor-bold-duotone" class="text-base"></iconify-icon>
                     Drag watermark to position
                   </p>
                   <div
                     ref={previewContainerRef}
                     className="relative bg-gray-50 overflow-hidden select-none"
                     style={{ touchAction: 'none' }}
                     onMouseMove={handleContainerMouseMove}
                     onMouseUp={handleContainerMouseUp}
                     onMouseLeave={handleContainerMouseUp}
                     onTouchMove={handleContainerTouchMove}
                     onTouchEnd={handleContainerTouchEnd}
                   >
                     <canvas ref={canvasRef} className="block w-full"></canvas>
                     <div
                       style={getPreviewStyles()}
                       onMouseDown={handleWmMouseDown}
                       onTouchStart={handleWmTouchStart}
                     >
                       {wmType === 'text'
                         ? wmText.replace('{PAGE}', currentPage)
                         : (wmImageBytes ? <img src={URL.createObjectURL(new Blob([wmImageBytes]))} alt="wm" style={{width:'100%',display:'block'}} draggable={false} /> : null)
                       }
                     </div>
                   </div>
                 </div>
               )}
               
               {/* Spacer so sticky button doesn't cover last form element */}
               <div className="h-2"></div>
            </div>
         )}
         
         {step === 'PROCESSING' && (
           <div className="flex-1 flex flex-col items-center justify-center">
             <iconify-icon icon="solar:spinner-bold-duotone" class="text-6xl text-indigo-600 animate-spin mb-4"></iconify-icon>
             <h2 className="text-2xl font-bold text-gray-900">Applying Watermark...</h2>
           </div>
         )}
         
         {step === 'SUCCESS' && (
           <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"><iconify-icon icon="solar:check-circle-bold" class="text-6xl"></iconify-icon></div>
             <h2 className="text-3xl font-bold text-gray-900 mb-4">Watermark Applied!</h2>
             <button onClick={() => { clearSession(); setStep('UPLOAD'); setFile(null); }} className="w-full border-2 border-gray-200 text-gray-700 font-bold text-lg py-4 rounded-2xl hover:bg-gray-50">Process Another File</button>
           </div>
         )}
      </main>
      {/* Mobile sticky footer CTA */}
      {step !== 'UPLOAD' && step !== 'PROCESSING' && step !== 'SUCCESS' && (
        <div className="shrink-0 bg-white border-t border-gray-100 px-5 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-bottom">
          <button
            onClick={processAndDownload}
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            {isProcessing
              ? <><iconify-icon icon="solar:spinner-linear" class="animate-spin text-xl"></iconify-icon> Applying...</>
              : <><iconify-icon icon="solar:check-read-linear" class="text-xl"></iconify-icon> Apply Watermark</>
            }
          </button>
        </div>
      )}
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} featureName="Watermark PDF" limitMessage={upgradeMessage} />
    </div>
  );
}
