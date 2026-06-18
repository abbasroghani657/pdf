import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import UpgradeModal from '../components/UpgradeModal';

const FONTS = ['Helvetica', 'Times-Roman', 'Courier'];
const POSITIONS = [
  { id: 'top-left', label: 'Top-Left', icon: '↖️' },
  { id: 'top-center', label: 'Top-Center', icon: '⬆️' },
  { id: 'top-right', label: 'Top-Right', icon: '↗️' },
  { id: 'middle-left', label: 'Middle-Left', icon: '⬅️' },
  { id: 'middle-center', label: 'Center', icon: '⬛' },
  { id: 'middle-right', label: 'Middle-Right', icon: '➡️' },
  { id: 'bottom-left', label: 'Bottom-Left', icon: '↙️' },
  { id: 'bottom-center', label: 'Bottom-Center', icon: '⬇️' },
  { id: 'bottom-right', label: 'Bottom-Right', icon: '↘️' }
];

export default function PageNumbersPage({ lang = 'en' }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [step, setStep] = useState('UPLOAD'); // UPLOAD, FORMAT, POSITION, TYPO, NUMBERING, PREVIEW, PROCESSING, SUCCESS
  
  // File state
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upgrade Modal
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fileInputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Settings State
  const [format, setFormat] = useState('1'); // '1', '1/10', 'Page 1', 'Page 1 of 10', 'i', 'I', 'a', 'A', 'custom'
  const [customFormat, setCustomFormat] = useState('{PAGE}');
  const [position, setPosition] = useState('bottom-center');
  const [margin, setMargin] = useState(20);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [startNum, setStartNum] = useState(1);
  const [startPage, setStartPage] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [skipLast, setSkipLast] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatNumber = (num, total, fmtType, custFmt, pref, suff) => {
    let base = num.toString();
    if (fmtType === 'i' || fmtType === 'I') base = toRoman(num, fmtType === 'I');
    else if (fmtType === 'a' || fmtType === 'A') base = toAlpha(num, fmtType === 'A');
    
    let text = '';
    if (fmtType === '1') text = base;
    else if (fmtType === '1/10') text = `${base}/${total}`;
    else if (fmtType === 'Page 1') text = `Page ${base}`;
    else if (fmtType === 'Page 1 of 10') text = `Page ${base} of ${total}`;
    else if (fmtType === 'custom') {
      text = custFmt.replace('{PAGE}', base).replace('{TOTAL}', total);
    } else {
      text = base;
    }
    return pref + text + suff;
  };

  const toRoman = (num, upper) => {
    if (isNaN(num)) return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--) roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    var final = Array(+digits.join("") + 1).join("M") + roman;
    return upper ? final : final.toLowerCase();
  };

  const toAlpha = (num, upper) => {
    let s = "";
    while(num > 0) {
      let m = (num - 1) % 26;
      s = String.fromCharCode(97 + m) + s;
      num = Math.floor((num - m)/26);
    }
    return upper ? s.toUpperCase() : s;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16)/255, g: parseInt(result[2], 16)/255, b: parseInt(result[3], 16)/255 } : {r:0,g:0,b:0};
  };

  // ── Core Logic ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch(e){} }
      const page = await pdfDoc.getPage(currentPage);
      
      const containerW = isMobile ? window.innerWidth - 32 : window.innerWidth - 360;
      const baseVp = page.getViewport({ scale: 1 });
      const finalScale = Math.min(containerW / baseVp.width, 1.5) * 0.95;
      setScale(finalScale);
      
      const vp = page.getViewport({ scale: finalScale });
      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';

      const ctx = canvas.getContext('2d');
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport: vp });
      await renderTaskRef.current.promise;
    };
    renderPage();
  }, [pdfDoc, currentPage, wrapperRef.current]);

  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f || f.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const bytes = new Uint8Array(ev.target.result);
      setFileBytes(bytes);
      try {
        const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setStep(isMobile ? 'FORMAT' : 'PREVIEW');
      } catch (err) {
        toast.error("Failed to load PDF.");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const processPDF = async () => {
    setStep('PROCESSING');
    // Defer to next tick so the PROCESSING spinner can render first
    await new Promise(r => setTimeout(r, 50));
    try {
      const pDoc = await PDFDocument.load(fileBytes);
      const pages = pDoc.getPages();
      
      // embedStandardFont is synchronous in pdf-lib
      const fontName = fontFamily === 'Courier' ? StandardFonts.Courier : fontFamily === 'Times-Roman' ? StandardFonts.TimesRoman : StandardFonts.Helvetica;
      const font = pDoc.embedStandardFont(fontName);
      
      const c = hexToRgb(color);
      const pdfColor = rgb(c.r, c.g, c.b);
      
      let currentNumber = startNum;

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        
        if (pageNum < startPage) continue;
        if (skipFirst && pageNum === 1) continue;
        if (skipLast && pageNum === pages.length) continue;
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        const textToDraw = formatNumber(currentNumber, pages.length, format, customFormat, prefix, suffix);
        const textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
        const textHeight = fontSize;
        
        let x = 0;
        let y = 0;
        
        // Calculate Position
        if (position.includes('left')) x = margin;
        else if (position.includes('center')) x = width / 2 - textWidth / 2;
        else if (position.includes('right')) x = width - margin - textWidth;
        
        if (position.includes('bottom')) y = margin;
        else if (position.includes('middle')) y = height / 2 - textHeight / 2;
        else if (position.includes('top')) y = height - margin - textHeight;

        page.drawText(textToDraw, {
          x,
          y,
          size: fontSize,
          font,
          color: pdfColor
        });
        
        currentNumber++;
      }
      
      const newPdfBytes = await pDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `numbered_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Page numbers added successfully!');
      setStep('SUCCESS');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add page numbers.');
      setStep('PREVIEW');
    }
  };

  const getPreviewStyles = () => {
    // Generate styles for the live preview overlay based on position
    if (!canvasRef.current) return {};
    
    let styles = {
      position: 'absolute',
      fontFamily: fontFamily === 'Helvetica' ? 'sans-serif' : fontFamily === 'Courier' ? 'monospace' : 'serif',
      fontSize: `${fontSize * scale}px`,
      color: color,
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    };

    const scaledMargin = margin * scale;

    if (position.includes('left')) styles.left = `${scaledMargin}px`;
    else if (position.includes('center')) styles.left = '50%';
    else if (position.includes('right')) styles.right = `${scaledMargin}px`;

    if (position.includes('center')) styles.transform = 'translateX(-50%)';
    if (position === 'middle-center') styles.transform = 'translate(-50%, -50%)';
    if (position === 'middle-left' || position === 'middle-right') styles.transform = 'translateY(-50%)';

    if (position.includes('top')) styles.top = `${scaledMargin}px`;
    else if (position.includes('middle')) styles.top = '50%';
    else if (position.includes('bottom')) styles.bottom = `${scaledMargin}px`;

    return styles;
  };

  const MobileProgress = ({ current }) => {
    const steps = ['UPLOAD', 'FORMAT', 'POSITION', 'TYPO', 'NUMBERING', 'PREVIEW'];
    const idx = steps.indexOf(current);
    if (idx === -1) return null;
    return (
      <div className="h-1 bg-gray-200 w-full fixed top-14 z-40">
        <div className="h-full bg-indigo-600 transition-all duration-300" style={{width: `${(idx / (steps.length-1)) * 100}%`}}></div>
      </div>
    );
  };

  // ── Component Render Blocks ───────────────────────────────────────────────
  
  if (step === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-gray-100">
           <div className="w-20 h-20 mb-6 rounded-full border-4 border-gray-100 border-t-indigo-600 animate-spin"></div>
           <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Applying Numbers...</h2>
           <p className="text-gray-500 text-sm">Please wait while we number your PDF.</p>
        </div>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
         <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-gray-100">
           <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
             <iconify-icon icon="solar:check-read-bold" class="text-4xl"></iconify-icon>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
           <p className="text-gray-500 text-sm mb-8">Page numbers have been added to your PDF.</p>
           <div className="space-y-3 w-full">
             <button onClick={() => window.location.reload()} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700">Add to Another PDF</button>
             <Link to="/" className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl block hover:bg-gray-200">Back to Home</Link>
           </div>
         </div>
      </div>
    );
  }

  if (step === 'UPLOAD') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <iconify-icon icon="solar:alt-arrow-left-linear" class="text-2xl"></iconify-icon>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <h1 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <iconify-icon icon="solar:sort-by-time-linear" class="text-indigo-600"></iconify-icon> Add Page Numbers
            </h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <iconify-icon icon="solar:sort-by-time-bold-duotone" class="text-5xl"></iconify-icon>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Add Page Numbers</h1>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">Insert page numbers in your PDF documents with ease. Choose positions, formats, and typography.</p>
            
            <div 
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload({ target: { files: [e.dataTransfer.files[0]] } });
                }
              }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current.click()}
              className={clsx(
                "border-3 border-dashed rounded-3xl p-10 cursor-pointer transition-all",
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
              )}
            >
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
              <div className="flex flex-col items-center gap-4">
                <iconify-icon icon="solar:upload-minimalistic-linear" class="text-4xl text-indigo-500"></iconify-icon>
                <div>
                  <span className="bg-indigo-600 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-md inline-block mb-3">Choose File</span>
                  <p className="text-sm text-gray-500 font-medium">or drop PDF here</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Common Preview Rendering Logic
  const renderPreviewBox = () => (
    <div className="flex-1 overflow-y-auto overflow-x-auto bg-[#e5e7eb] p-6 flex flex-col items-center gap-6" style={{minHeight: 0}}>
      <div 
        ref={wrapperRef} 
        className="relative shadow-2xl bg-white rounded overflow-visible select-none"
        style={{
          width: canvasRef.current ? canvasRef.current.style.width : 'auto',
          flexShrink: 0
        }}
      >
        <canvas ref={canvasRef} className="block pointer-events-none"></canvas>
        {/* Number Overlay */}
        <div style={getPreviewStyles()}>
           {formatNumber(currentPage < startPage ? 1 : currentPage - startPage + startNum, numPages, format, customFormat, prefix, suffix)}
        </div>
      </div>
      
      {/* Pagination Controls — inline below the page */}
      {numPages > 1 && (
        <div className="flex items-center gap-4 bg-gray-900/85 backdrop-blur-md px-6 py-3 rounded-full text-white shadow-xl shrink-0">
           <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="hover:text-indigo-300 disabled:opacity-30 transition-colors"><iconify-icon icon="solar:alt-arrow-left-linear" class="text-xl"></iconify-icon></button>
           <span className="text-sm font-bold w-28 text-center">Page {currentPage} of {numPages}</span>
           <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage === numPages} className="hover:text-indigo-300 disabled:opacity-30 transition-colors"><iconify-icon icon="solar:alt-arrow-right-linear" class="text-xl"></iconify-icon></button>
        </div>
      )}
    </div>
  );

  if (!isMobile) {
    return (
      <div className="h-screen flex flex-col bg-[#f3f4f6] overflow-hidden font-sans">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <iconify-icon icon="solar:home-smile-linear" class="text-xl"></iconify-icon>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <iconify-icon icon="solar:sort-by-time-linear" class="text-indigo-600 text-lg"></iconify-icon> Add Page Numbers
            </h2>
          </div>
          <button onClick={processPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2 rounded-lg shadow transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:check-read-linear"></iconify-icon> Add Numbers
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 shadow-xl z-20">
            <div className="p-5 space-y-6">
              
              {/* FORMAT */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Number Format</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setFormat('1')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === '1' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>1</button>
                  <button onClick={() => setFormat('1/10')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === '1/10' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>1/10</button>
                  <button onClick={() => setFormat('Page 1')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === 'Page 1' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>Page 1</button>
                  <button onClick={() => setFormat('Page 1 of 10')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === 'Page 1 of 10' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>Page 1 of 10</button>
                  <button onClick={() => setFormat('a')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === 'a' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>a, b, c...</button>
                  <button onClick={() => setFormat('i')} className={clsx("py-2 text-sm font-bold border rounded-lg transition-colors", format === 'i' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>i, ii, iii...</button>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* POSITION */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Position</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {POSITIONS.map(pos => (
                    <button 
                      key={pos.id} 
                      onClick={() => setPosition(pos.id)}
                      className={clsx("aspect-square flex items-center justify-center border rounded-lg transition-colors text-xl", position === pos.id ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-200 text-gray-400 hover:bg-gray-50")}
                      title={pos.label}
                    >{pos.icon}</button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                   <label className="text-sm font-bold text-gray-700">Margin: {margin}px</label>
                   <input type="range" min="10" max="100" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-1/2" />
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* TYPOGRAPHY */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Typography</h3>
                <div className="space-y-3">
                  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-20 border border-gray-200 rounded-lg p-2 text-sm font-bold text-center" min="6" max="72" />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-full rounded-lg cursor-pointer border border-gray-200 p-1" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* NUMBERING SETTINGS */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Settings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-bold text-gray-700">Start number:</label>
                    <input type="number" value={startNum} onChange={e => setStartNum(Number(e.target.value))} className="w-16 border rounded p-1 text-center font-bold" min="1" />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-bold text-gray-700">Start at page:</label>
                    <input type="number" value={startPage} onChange={e => setStartPage(Number(e.target.value))} className="w-16 border rounded p-1 text-center font-bold" min="1" max={numPages} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-2">
                    <input type="checkbox" checked={skipFirst} onChange={e => setSkipFirst(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Skip first page
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={skipLast} onChange={e => setSkipLast(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Skip last page
                  </label>
                </div>
              </div>

            </div>
          </aside>

          {/* Center Preview */}
          {renderPreviewBox()}

        </div>
        <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} featureName="Page Numbers" limitMessage={upgradeMessage} />
      </div>
    );
  }

  // ── MOBILE LAYOUT (WIZARD) ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="h-14 bg-white flex items-center px-4 justify-between shrink-0 shadow-sm sticky top-0 z-50">
        <button onClick={() => {
          if (step === 'PREVIEW') setStep('NUMBERING');
          else if (step === 'NUMBERING') setStep('TYPO');
          else if (step === 'TYPO') setStep('POSITION');
          else if (step === 'POSITION') setStep('FORMAT');
          else if (step === 'FORMAT') { setStep('UPLOAD'); setFile(null); }
        }} className="text-gray-500 hover:text-gray-900">
          <iconify-icon icon="solar:alt-arrow-left-linear" class="text-2xl"></iconify-icon>
        </button>
        <span className="font-bold text-gray-800 text-sm">{step === 'FORMAT' ? 'Format' : step === 'POSITION' ? 'Position' : step === 'TYPO' ? 'Typography' : step === 'NUMBERING' ? 'Settings' : 'Preview'}</span>
        <div className="w-6"></div>
      </header>
      <MobileProgress current={step} />

      <main className="flex-1 overflow-y-auto p-5 pb-24 flex flex-col relative">
         {step === 'FORMAT' && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold text-gray-900 mb-4">Number Format</h2>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setFormat('1')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === '1' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  1<br/><span className="text-xs font-normal opacity-70">Simple</span>
               </button>
               <button onClick={() => setFormat('1/10')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === '1/10' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  1/10<br/><span className="text-xs font-normal opacity-70">Ratio</span>
               </button>
               <button onClick={() => setFormat('Page 1')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === 'Page 1' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  Page 1<br/><span className="text-xs font-normal opacity-70">Text</span>
               </button>
               <button onClick={() => setFormat('Page 1 of 10')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === 'Page 1 of 10' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  Pg 1 of 10<br/><span className="text-xs font-normal opacity-70">Full</span>
               </button>
               <button onClick={() => setFormat('i')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === 'i' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  i, ii, iii<br/><span className="text-xs font-normal opacity-70">Roman</span>
               </button>
               <button onClick={() => setFormat('a')} className={clsx("p-4 border-2 rounded-2xl font-bold text-center transition-colors", format === 'a' ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-200 text-gray-700 bg-white")}>
                  a, b, c<br/><span className="text-xs font-normal opacity-70">Alpha</span>
               </button>
             </div>
             <button onClick={() => setStep('POSITION')} className="w-full mt-6 bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl">Next Step</button>
           </div>
         )}

         {step === 'POSITION' && (
           <div className="space-y-6 animate-fade-in">
             <h2 className="text-xl font-bold text-gray-900 mb-2">Position</h2>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 gap-2">
                {POSITIONS.map(pos => (
                  <button 
                    key={pos.id} 
                    onClick={() => setPosition(pos.id)}
                    className={clsx("aspect-square flex items-center justify-center border-2 rounded-xl transition-colors text-2xl", position === pos.id ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-transparent bg-gray-50 text-gray-400")}
                  >{pos.icon}</button>
                ))}
             </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
               <label className="text-sm font-bold text-gray-700 mb-2 block">Margin: {margin}px</label>
               <input type="range" min="10" max="100" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full" />
             </div>
             <button onClick={() => setStep('TYPO')} className="w-full mt-6 bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl">Next Step</button>
           </div>
         )}

         {step === 'TYPO' && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold text-gray-900 mb-2">Typography</h2>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Font Family</label>
                  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold bg-gray-50">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Size: {fontSize}px</label>
                  <input type="range" min="6" max="72" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Color</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-12 w-full rounded-xl cursor-pointer border-2 border-gray-100 p-1" />
                </div>
             </div>
             <button onClick={() => setStep('NUMBERING')} className="w-full mt-6 bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl">Next Step</button>
           </div>
         )}

         {step === 'NUMBERING' && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold text-gray-900 mb-2">Numbering</h2>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Start number:</label>
                  <input type="number" value={startNum} onChange={e => setStartNum(Number(e.target.value))} className="w-20 border-2 border-gray-100 rounded-lg p-2 text-center font-bold bg-gray-50" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Start at page:</label>
                  <input type="number" value={startPage} onChange={e => setStartPage(Number(e.target.value))} className="w-20 border-2 border-gray-100 rounded-lg p-2 text-center font-bold bg-gray-50" max={numPages} />
                </div>
                <div className="h-px bg-gray-100 my-2"></div>
                <label className="flex items-center gap-3 font-bold text-gray-700">
                  <input type="checkbox" checked={skipFirst} onChange={e => setSkipFirst(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  Skip first page
                </label>
                <label className="flex items-center gap-3 font-bold text-gray-700">
                  <input type="checkbox" checked={skipLast} onChange={e => setSkipLast(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  Skip last page
                </label>
             </div>
             <button onClick={() => setStep('PREVIEW')} className="w-full mt-6 bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl">View Preview</button>
           </div>
         )}

         {step === 'PREVIEW' && (
           <div className="h-full flex flex-col -mx-5 -my-5 h-[calc(100vh-56px)]">
             {renderPreviewBox()}
             <div className="bg-white p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 fixed bottom-0 left-0 right-0">
                <button onClick={processPDF} className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2">
                  <iconify-icon icon="solar:check-read-bold"></iconify-icon> Apply Numbers
                </button>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}
