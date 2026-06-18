import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';



const CUSTOM_FONTS = {
  'Helvetica': '',
  'Times-Roman': '',
  'Courier': '',
  'Roboto': 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Regular.ttf',
  'Open Sans': 'https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/static/OpenSans-Regular.ttf',
  'Lato': 'https://raw.githubusercontent.com/google/fonts/main/ofl/lato/Lato-Regular.ttf',
  'Montserrat': 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Regular.ttf',
  'Oswald': 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/static/Oswald-Regular.ttf',
  'Raleway': 'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Regular.ttf',
  'Playfair Display': 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf',
  'Merriweather': 'https://raw.githubusercontent.com/google/fonts/main/ofl/merriweather/Merriweather-Regular.ttf',
  'Nunito': 'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/static/Nunito-Regular.ttf',
  'Ubuntu': 'https://raw.githubusercontent.com/google/fonts/main/ufl/ubuntu/Ubuntu-Regular.ttf',
  'Poppins': 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf',
  'Inter': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Regular.ttf',
  'Rubik': 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/static/Rubik-Regular.ttf',
  'Noto Sans': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Regular.ttf',
  'Work Sans': 'https://raw.githubusercontent.com/google/fonts/main/ofl/worksans/static/WorkSans-Regular.ttf',
  'Dancing Script': 'https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/static/DancingScript-Regular.ttf',
  'Pacifico': 'https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf',
  'Caveat': 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/static/Caveat-Regular.ttf',
  'Cinzel': 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/static/Cinzel-Regular.ttf',
  'EB Garamond': 'https://raw.githubusercontent.com/google/fonts/main/ofl/ebgaramond/static/EBGaramond-Regular.ttf'
};

const ALL_FONTS = Object.keys(CUSTOM_FONTS);

export default function EditPDFPage() {
  // ----- Core State -----
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  // ----- Editor State -----
  const [activeTool, setActiveTool] = useState('select'); // select, text, image, shape, draw
  const [activeMode, setActiveMode] = useState('annotate'); // annotate, edit
  const [leftTab, setLeftTab] = useState('bookmarks'); // bookmarks, layers, signatures, attachments
  const [elements, setElements] = useState([]); // All added elements
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [bookmarks, setBookmarks] = useState([]); // [{page, label}]
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const sigCanvasRef = useRef(null);
  
  // History for Undo/Redo
  const [history, setHistory] = useState([{ elements: [], drawPaths: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Tool specific options
  const [textOptions, setTextOptions] = useState({ font: 'Helvetica', size: 16, color: '#000000', bold: false, italic: false });
  const [shapeOptions, setShapeOptions] = useState({ type: 'rectangle', fill: 'transparent', border: '#ff0000', width: 2 });
  const [drawOptions, setDrawOptions] = useState({ size: 3, color: '#0000ff' });
  const [highlightOptions, setHighlightOptions] = useState({ color: '#ffff00', opacity: 0.4 });
  const [formOptions, setFormOptions] = useState({ type: 'text_field' });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]); // [{page, points:[], color, size}]
  const [currentDrawPath, setCurrentDrawPath] = useState(null);
  const drawCanvasRef = useRef(null);
  const [userScale, setUserScale] = useState(null); // null = auto-fit

  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  
  // Pro Plan System
  const { isPro } = useAuth();
  const PRO_SHAPES = ['triangle', 'arrow', 'star', 'diamond'];
  const PRO_HIGHLIGHT_COLORS = ['#00ff00','#ff99cc','#00ccff','#ff9900'];
  const isProFeature = (feature) => {
    if (feature === 'shape_pro') return !isPro;
    if (feature === 'highlight_colors') return !isPro;
    if (feature === 'draw_full') return !isPro;
    if (feature === 'multi_image') return !isPro;
    if (feature === 'forms') return !isPro;
    if (feature === 'no_watermark') return !isPro;
    if (feature === 'edit_mode') return !isPro;
    return false;
  };
  const checkPro = (feature) => { 
    if (isProFeature(feature)) { 
      setUpgradeMessage("This advanced editing feature requires a Pro account. Upgrade to unlock all shapes, highlight colors, and full PDF text editing.");
      setIsUpgradeOpen(true); 
      return false; 
    } 
    return true; 
  };

  // Refs
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  
  const elementsRef = useRef(elements);
  const fileBytesRef = useRef(null);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'edit_pdf',
    { elements, drawPaths, currentPage, numPages, activeMode, activeTool },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setFileBytes(bytes);
      fileBytesRef.current = bytes;
      
      pdfjsLib.getDocument({ data: bytes.slice(0) }).promise.then(doc => {
        setPdfDoc(doc);
        setNumPages(s?.numPages || doc.numPages);
      });
      
      if (s) {
        if (s.currentPage) setCurrentPage(s.currentPage);
        if (s.elements) setElements(s.elements);
        if (s.drawPaths) setDrawPaths(s.drawPaths);
        if (s.activeMode) setActiveMode(s.activeMode);
        if (s.activeTool) setActiveTool(s.activeTool);
        
        setHistory([{ elements: s.elements || [], drawPaths: s.drawPaths || [] }]);
        setHistoryIndex(0);
      }
    },
    !!pdfDoc && !isSaving
  );
  // ─────────────────────────────────────────────────────────────────────────

  // Handle Resize for Mobile/Desktop layout switching
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync History
  const pushHistory = (newElements, newDrawPaths = drawPaths) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: newElements, drawPaths: newDrawPaths });
    if (newHistory.length > 20) newHistory.shift(); // Max 20 steps
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
    setDrawPaths(newDrawPaths);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1].elements);
      setDrawPaths(history[historyIndex - 1].drawPaths);
      setSelectedElementId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1].elements);
      setDrawPaths(history[historyIndex + 1].drawPaths);
      setSelectedElementId(null);
    }
  };

  // Upload PDF
  const handleUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      const maxSize = 2000 * 1024 * 1024;
      if (uploadedFile.size > maxSize) {
        setUpgradeMessage("Files over 2GB require a Pro account. Upgrade to Pro for massive file uploads.");
        setIsUpgradeOpen(true);
        return;
      }
      setFile(uploadedFile);
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setFileBytes(bytes);
      fileBytesRef.current = bytes;
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setElements([]);
      setDrawPaths([]);
      setHistory([{ elements: [], drawPaths: [] }]);
      setHistoryIndex(0);
    }
  };

  // Render PDF Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      if (renderTaskRef.current) { try { await renderTaskRef.current.cancel(); } catch(e){} }
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });
      
      let finalScale;
      if (userScale !== null) {
        finalScale = userScale;
      } else {
        const containerW = wrapperRef.current ? wrapperRef.current.clientWidth - 32 : window.innerWidth;
        finalScale = Math.min(containerW / viewport.width, 1.5);
      }
      setScale(finalScale);

      const vp = page.getViewport({ scale: finalScale });
      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';

      // Also size the draw canvas overlay
      if (drawCanvasRef.current) {
        drawCanvasRef.current.width = vp.width;
        drawCanvasRef.current.height = vp.height;
        drawCanvasRef.current.style.width = vp.width + 'px';
        drawCanvasRef.current.style.height = vp.height + 'px';
        redrawPaths();
      }

      const ctx = canvas.getContext('2d');
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      try { await task.promise; } catch(e){}
    };
    renderPage();
  }, [pdfDoc, currentPage, userScale]);

  // Zoom handlers
  const zoomIn = () => setUserScale(s => Math.min(3, (s || scale) + 0.15));
  const zoomOut = () => setUserScale(s => Math.max(0.3, (s || scale) - 0.15));
  const zoomReset = () => setUserScale(null);

  // Redraw freehand paths on draw canvas
  const redrawPaths = () => {
    if (!drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    const pagePaths = drawPaths.filter(p => p.page === currentPage);
    for (const path of pagePaths) {
      if (path.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    }
    // Draw current in-progress path
    if (currentDrawPath && currentDrawPath.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentDrawPath.color;
      ctx.lineWidth = currentDrawPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentDrawPath.points[0].x, currentDrawPath.points[0].y);
      for (let i = 1; i < currentDrawPath.points.length; i++) {
        ctx.lineTo(currentDrawPath.points[i].x, currentDrawPath.points[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => { redrawPaths(); }, [drawPaths, currentDrawPath, currentPage]);

  // Freehand draw event handlers
  const startDraw = (e) => {
    if (activeTool !== 'draw') return;
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const isTouch = e.type === 'touchstart';
    const cx = isTouch ? e.touches[0].clientX : e.clientX;
    const cy = isTouch ? e.touches[0].clientY : e.clientY;
    setIsDrawing(true);
    setCurrentDrawPath({ page: currentPage, points: [{ x: cx - rect.left, y: cy - rect.top }], color: drawOptions.color, size: drawOptions.size });
  };
  const moveDraw = (e) => {
    if (!isDrawing || !currentDrawPath) return;
    if (e.type === 'touchmove') e.preventDefault();
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const isTouch = e.type === 'touchmove';
    const cx = isTouch ? e.touches[0].clientX : e.clientX;
    const cy = isTouch ? e.touches[0].clientY : e.clientY;
    setCurrentDrawPath(prev => ({ ...prev, points: [...prev.points, { x: cx - rect.left, y: cy - rect.top }] }));
  };
  const endDraw = () => {
    if (!isDrawing || !currentDrawPath) return;
    setIsDrawing(false);
    if (currentDrawPath.points.length > 1) {
      // Store canvas dimensions with path for accurate PDF coordinate mapping
      const cw = drawCanvasRef.current?.width || 1;
      const ch = drawCanvasRef.current?.height || 1;
      const newPath = { ...currentDrawPath, canvasWidth: cw, canvasHeight: ch };
      pushHistory(elements, [...drawPaths, newPath]);
    }
    setCurrentDrawPath(null);
  };

  // Global Color Picker Handler
  const handleGlobalColorChange = (e) => {
    const val = e.target.value;
    setTextOptions(prev => ({...prev, color: val}));
    setShapeOptions(prev => ({...prev, border: val}));
    setDrawOptions(prev => ({...prev, color: val}));
    if (selectedElementId) {
      const el = elements.find(el => el.id === selectedElementId);
      if (el) {
        if (el.type === 'text') updateElement(selectedElementId, { options: { ...el.options, color: val } });
        if (el.type === 'shape') updateElement(selectedElementId, { options: { ...el.options, border: val } });
        if (el.type === 'highlight') updateElement(selectedElementId, { options: { ...el.options, color: val } });
        finalizeElementUpdate();
      }
    }
  };

  // Panning Handlers
  const startPan = (e) => {
    if (activeTool !== 'select') return;
    setIsPanning(true);
  };
  const movePan = (e) => {
    if (!isPanning || activeTool !== 'select') return;
    if (scrollContainerRef.current && e.movementX !== undefined) {
      scrollContainerRef.current.scrollLeft -= e.movementX;
      scrollContainerRef.current.scrollTop -= e.movementY;
    }
  };
  const endPan = () => {
    setIsPanning(false);
  };

  // Handle Canvas Click to Add Elements
  const handleCanvasClick = (e) => {
    // If clicking the background in select mode, deselect
    if (activeTool === 'select') { setSelectedElementId(null); return; }
    if (activeTool === 'draw') return;
    
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to within canvas bounds
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    let newElement = {
      id: Date.now().toString(),
      page: currentPage,
      type: activeTool,
      x: Math.max(0, Math.min(80, x)),
      y: Math.max(0, Math.min(90, y)),
      width: 20, height: 10,
    };

    if (activeTool === 'text') {
      newElement = { ...newElement, text: '', options: { ...textOptions }, width: 25, height: 6 };
    } else if (activeTool === 'shape') {
      newElement = { ...newElement, options: { ...shapeOptions }, width: 15, height: 15 };
    } else if (activeTool === 'eraser') {
      newElement = { ...newElement, width: 15, height: 5 };
    } else if (activeTool === 'highlight') {
      newElement = { ...newElement, type: 'highlight', options: { ...highlightOptions }, width: 25, height: 3 };
    } else if (activeTool === 'form') {
      newElement = { ...newElement, options: { ...formOptions, name: `field_${newElement.id}` }, width: 25, height: 4 };
      if (formOptions.type === 'checkbox') {
        newElement.width = 4;
        newElement.height = 4;
      }
    } else {
      return; // Unknown tool, don't add
    }

    pushHistory([...elements, newElement]);
    setSelectedElementId(newElement.id);
    if (isMobile) setBottomSheetOpen(false);
  };

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const imgFile = e.target.files[0];
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newElement = {
          id: Date.now().toString(),
          page: currentPage,
          type: 'image',
          x: 10, y: 10,
          width: 30, height: 30,
          src: ev.target.result
        };
        pushHistory([...elements, newElement]);
        setSelectedElementId(newElement.id);
        setActiveTool('select');
        if (isMobile) setBottomSheetOpen(false);
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // Update Element
  const updateElement = (id, changes) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...changes } : el));
  };

  const finalizeElementUpdate = () => {
    pushHistory([...elementsRef.current]);
  };

  const deleteSelected = () => {
    if (selectedElementId) {
      pushHistory(elements.filter(el => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  // Dragging logic
  const handleMouseDown = (e, el) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(el.id);
    
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const startX = clientX;
    const startY = clientY;
    const startLeft = el.x;
    const startTop = el.y;
    const wrapRect = wrapperRef.current.getBoundingClientRect();
    
    const onMove = (ev) => {
      if (ev.type === 'touchmove') ev.preventDefault();
      const evX = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
      const evY = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
      
      const dx = ((evX - startX) / wrapRect.width) * 100;
      const dy = ((evY - startY) / wrapRect.height) * 100;
      
      updateElement(el.id, {
        x: Math.max(0, Math.min(100 - el.width, startLeft + dx)),
        y: Math.max(0, Math.min(100 - el.height, startTop + dy))
      });
    };
    
    const onUp = () => {
      finalizeElementUpdate();
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

  // Convert Hex to RGB object
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  // Font mapping for pdf-lib
  const getFontKey = (fontName, bold) => {
    if (fontName === 'Courier') return bold ? StandardFonts.CourierBold : StandardFonts.Courier;
    if (fontName === 'Times-Roman') return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
    return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  };

  // Save PDF - FULL FUNCTIONAL VERSION
  const savePDF = async () => {
    setIsSaving(true);
    try {
      // Use ref first (most reliable), fallback to state, then re-read from file
      let bytes = fileBytesRef.current || fileBytes;
      if (!bytes || bytes.length === 0) {
        if (file) {
          toast.loading('Re-reading file...');
          const ab = await file.arrayBuffer();
          bytes = new Uint8Array(ab);
          fileBytesRef.current = bytes;
          setFileBytes(bytes);
        } else {
          toast.error('No PDF file loaded. Please re-upload the file.');
          setIsSaving(false);
          return;
        }
      }
      const pdfLibDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdfLibDoc.getPages();
      
      // --- Save all placed elements ---
      for (const el of elements) {
        const page = pages[el.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();
        
        const px = (el.x / 100) * width;
        const py = height - ((el.y / 100) * height) - ((el.height / 100) * height);
        const pw = (el.width / 100) * width;
        const ph = (el.height / 100) * height;

        // TEXT
        if (el.type === 'text' && el.text && el.text.trim()) {
          pdfLibDoc.registerFontkit(fontkit);
          const fontKey = el.options.font;
          let font;
          if (CUSTOM_FONTS[fontKey] && CUSTOM_FONTS[fontKey] !== '') {
            try {
              const fontBytes = await fetch(CUSTOM_FONTS[fontKey]).then(res => res.arrayBuffer());
              font = await pdfLibDoc.embedFont(fontBytes);
            } catch(e) {
              console.error('Failed to load custom font', e);
              font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);
            }
          } else {
            const stdFontKey = getFontKey(fontKey, el.options.bold);
            font = await pdfLibDoc.embedFont(stdFontKey);
          }
          
          const color = hexToRgb(el.options.color);
          const lines = el.text.split('\n');
          const lineHeight = el.options.size * 1.2;
          lines.forEach((line, i) => {
            if (line.trim()) {
              page.drawText(line, {
                x: px,
                y: py + ph - (el.options.size) - (i * lineHeight),
                size: el.options.size,
                font: font,
                color: rgb(color.r, color.g, color.b)
              });
            }
          });
        }
        
        // HIGHLIGHT
        else if (el.type === 'highlight') {
          const hc = hexToRgb(el.options.color);
          page.drawRectangle({
            x: px, y: py, width: pw, height: ph,
            color: rgb(hc.r, hc.g, hc.b),
            opacity: el.options.opacity || 0.4,
          });
        }
        
        // ERASER (Whiteout)
        else if (el.type === 'eraser') {
          page.drawRectangle({
            x: px, y: py, width: pw, height: ph,
            color: rgb(1, 1, 1),
          });
        }
        
        // SHAPES
        else if (el.type === 'shape') {
          const bc = hexToRgb(el.options.border);
          const fillColor = el.options.fill !== 'transparent' ? rgb(hexToRgb(el.options.fill).r, hexToRgb(el.options.fill).g, hexToRgb(el.options.fill).b) : undefined;
          const borderRgb = rgb(bc.r, bc.g, bc.b);

          if (el.options.type === 'rectangle') {
            page.drawRectangle({ x: px, y: py, width: pw, height: ph, borderColor: borderRgb, borderWidth: el.options.width, color: fillColor });
          } 
          else if (el.options.type === 'circle') {
            page.drawEllipse({ x: px + pw/2, y: py + ph/2, xScale: pw/2, yScale: ph/2, borderColor: borderRgb, borderWidth: el.options.width, color: fillColor });
          } 
          else if (el.options.type === 'line') {
            page.drawLine({ start: { x: px, y: py + ph/2 }, end: { x: px + pw, y: py + ph/2 }, color: borderRgb, thickness: el.options.width });
          }
          else if (el.options.type === 'arrow') {
            // Line + arrowhead
            page.drawLine({ start: { x: px, y: py + ph/2 }, end: { x: px + pw * 0.85, y: py + ph/2 }, color: borderRgb, thickness: el.options.width });
            // Arrowhead triangle
            const ax = px + pw; const ay = py + ph/2; const aSize = Math.min(pw * 0.15, ph * 0.4);
            page.drawRectangle({ x: ax - aSize, y: ay - aSize/2, width: aSize, height: aSize, color: borderRgb });
          }
          else if (el.options.type === 'triangle') {
            // Draw 3 lines for triangle
            page.drawLine({ start: { x: px + pw/2, y: py + ph }, end: { x: px + pw, y: py }, color: borderRgb, thickness: el.options.width });
            page.drawLine({ start: { x: px + pw, y: py }, end: { x: px, y: py }, color: borderRgb, thickness: el.options.width });
            page.drawLine({ start: { x: px, y: py }, end: { x: px + pw/2, y: py + ph }, color: borderRgb, thickness: el.options.width });
          }
          else if (el.options.type === 'star') {
            // Approximate star as filled circle with border for PDF save
            page.drawEllipse({ x: px + pw/2, y: py + ph/2, xScale: pw/2, yScale: ph/2, borderColor: borderRgb, borderWidth: el.options.width, color: fillColor });
          }
          else if (el.options.type === 'diamond') {
            // Draw 4 lines for diamond
            const cx = px + pw/2; const cy = py + ph/2;
            page.drawLine({ start: { x: cx, y: py + ph }, end: { x: px + pw, y: cy }, color: borderRgb, thickness: el.options.width });
            page.drawLine({ start: { x: px + pw, y: cy }, end: { x: cx, y: py }, color: borderRgb, thickness: el.options.width });
            page.drawLine({ start: { x: cx, y: py }, end: { x: px, y: cy }, color: borderRgb, thickness: el.options.width });
            page.drawLine({ start: { x: px, y: cy }, end: { x: cx, y: py + ph }, color: borderRgb, thickness: el.options.width });
          }
        }
        
        // IMAGE
        else if (el.type === 'image') {
          try {
            const isPng = el.src.includes('image/png');
            const imgBytes = Uint8Array.from(atob(el.src.split(',')[1]), c => c.charCodeAt(0));
            const embeddedImage = isPng ? await pdfLibDoc.embedPng(imgBytes) : await pdfLibDoc.embedJpg(imgBytes);
            page.drawImage(embeddedImage, { x: px, y: py, width: pw, height: ph });
          } catch(imgErr) {
            console.warn('Image embed failed, trying alternate format:', imgErr);
            try {
              const imgBytes = Uint8Array.from(atob(el.src.split(',')[1]), c => c.charCodeAt(0));
              const embeddedImage = await pdfLibDoc.embedPng(imgBytes);
              page.drawImage(embeddedImage, { x: px, y: py, width: pw, height: ph });
            } catch(e2) { console.error('Image embed failed completely:', e2); }
          }
        }
        
        // FORMS
        else if (el.type === 'form') {
          const form = pdfLibDoc.getForm();
          const fieldName = el.options.name || `field_${el.id}`;
          if (el.options.type === 'text_field') {
             try {
               const field = form.createTextField(fieldName);
               field.addToPage(page, { x: px, y: py, width: pw, height: ph });
             } catch(e) { console.error('Form field error:', e) }
          } else if (el.options.type === 'checkbox') {
             try {
               const field = form.createCheckBox(fieldName);
               field.addToPage(page, { x: px, y: py, width: pw, height: ph });
             } catch(e) { console.error('Form field error:', e) }
          }
        }
      }

      // --- Save freehand draw paths ---
      for (const path of drawPaths) {
        const page = pages[path.page - 1];
        if (!page || path.points.length < 2) continue;
        const { width, height } = page.getSize();
        const dc = hexToRgb(path.color);
        const cw = path.canvasWidth || canvasRef.current?.width || 1;
        const ch = path.canvasHeight || canvasRef.current?.height || 1;
        
        for (let i = 0; i < path.points.length - 1; i++) {
          const p1x = (path.points[i].x / cw) * width;
          const p1y = height - (path.points[i].y / ch) * height;
          const p2x = (path.points[i+1].x / cw) * width;
          const p2y = height - (path.points[i+1].y / ch) * height;
          
          page.drawLine({
            start: { x: p1x, y: p1y },
            end: { x: p2x, y: p2y },
            color: rgb(dc.r, dc.g, dc.b),
            thickness: path.size * 0.75,
          });
        }
      }

      const savedBytes = await pdfLibDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${file.name}`;
      link.click();
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Error saving PDF: ' + e.message);
    }
    setIsSaving(false);
  };

  // ----- RENDER -----
  if (!file) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-indigo-50 text-indigo-600">
            <iconify-icon icon="solar:pen-new-square-linear" class="text-3xl" stroke-width="1.5"></iconify-icon>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">Add text, images, shapes or freehand annotations directly onto your PDF. Professional editing tools.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
          <div className="px-6 py-6 md:px-10 md:py-8">
            <label
              className="relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden cursor-pointer border-indigo-200 hover:border-indigo-500/50 hover:bg-indigo-50/30 bg-indigo-50/10"
            >
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,application/pdf" onChange={handleUpload} title="" />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm bg-white text-indigo-600 group-hover:scale-110 group-hover:shadow-md">
                <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">{lang === 'es' ? 'Arrastra y suelta tu PDF aquí' : 'Drag & drop your PDF here'}</p>
              <p className="text-sm text-gray-500 mb-6">or click to browse — PDF only, up to 2GB (Free for Testing)</p>
              <span className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all pointer-events-none">
                Select PDF File
              </span>
            </label>

            {/* Trust badges */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-2">
                <iconify-icon icon="solar:shield-check-linear" class="text-lg"></iconify-icon>
                256-bit SSL
              </span>
              <span className="flex items-center gap-2">
                <iconify-icon icon="solar:trash-bin-trash-linear" class="text-lg"></iconify-icon>
                Auto-deleted in 2h
              </span>
              <span className="flex items-center gap-2">
                <iconify-icon icon="solar:eye-closed-linear" class="text-lg"></iconify-icon>
                Private & Secure
              </span>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'solar:text-square-linear', label: 'Add Text', desc: 'Type anywhere on PDF' },
            { icon: 'solar:shapes-linear', label: '7 Shapes', desc: 'Rectangle, Circle, Arrow...' },
            { icon: 'solar:pen-linear', label: 'Freehand Draw', desc: 'Draw with custom brush' },
            { icon: 'solar:gallery-linear', label: 'Insert Images', desc: 'Add photos & logos' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <iconify-icon icon={f.icon} class="text-xl"></iconify-icon>
              </div>
              <p className="text-sm font-bold text-gray-900">{f.label}</p>
              <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Common Tool Icon Component
  const ToolBtn = ({ name, icon, label }) => (
    <button 
      onClick={() => { setActiveTool(name); setSelectedElementId(null); if (isMobile) setBottomSheetOpen(true); }}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${activeTool === name ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      style={{ minWidth: isMobile ? '64px' : '100%', minHeight: isMobile ? '56px' : '64px' }}
    >
      <iconify-icon icon={icon} class="text-2xl"></iconify-icon>
      <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden text-gray-800">
      
      {/* Google Fonts Preload */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Oswald&family=Raleway&family=Playfair+Display&family=Merriweather&family=Nunito&family=Ubuntu&family=Poppins&family=Inter&family=Rubik&family=Noto+Sans&family=Work+Sans&family=Dancing+Script&family=Pacifico&family=Caveat&family=Cinzel&family=EB+Garamond&display=swap');
      `}</style>
      {/* ── TOP NAV BAR (PREMIUM STYLE) ── */}
      <header className="bg-white border-b border-gray-200 flex flex-col shrink-0 z-30 shadow-sm relative">
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <Link to="/" onClick={clearSession} className="text-gray-500 hover:text-gray-900 transition-colors" title="Back to Home">
              <iconify-icon icon="solar:home-smile-linear" class="text-xl"></iconify-icon>
            </Link>
            
            <div className="flex items-center bg-gray-100 rounded-full p-0.5 shadow-inner">
              <button onClick={() => { setActiveMode('annotate'); setActiveTool('draw'); setSelectedElementId(null); }} className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all ${activeMode === 'annotate' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                <iconify-icon icon="solar:pen-linear"></iconify-icon> Annotate
              </button>
              <button onClick={() => { if(checkPro('edit_mode')) { setActiveMode('edit'); setActiveTool('eraser'); setSelectedElementId(null); } }} className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all ${activeMode === 'edit' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                <iconify-icon icon="solar:text-square-linear"></iconify-icon> Edit
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-200"></div>
            
            <div className="flex items-center gap-1">
              <label className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 cursor-pointer overflow-hidden relative" title="Global Color">
                <input type="color" className="absolute w-12 h-12 -top-2 -left-2 cursor-pointer opacity-0" onChange={handleGlobalColorChange} />
                <div className="w-5 h-5 rounded-md border-2 border-gray-300 shadow-sm" style={{ backgroundColor: textOptions.color }}></div>
              </label>
              <button onClick={() => setActiveTool('select')} className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${activeTool === 'select' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`} title="Pan / Select">
                <iconify-icon icon="solar:cursor-square-linear" class="text-lg"></iconify-icon>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button onClick={undo} disabled={historyIndex === 0} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-gray-600 disabled:opacity-30"><iconify-icon icon="solar:undo-left-linear"></iconify-icon></button>
                <button onClick={redo} disabled={historyIndex === history.length - 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-gray-600 disabled:opacity-30"><iconify-icon icon="solar:undo-right-linear"></iconify-icon></button>
              </div>
            <button onClick={savePDF} disabled={isSaving} className="bg-indigo-600 text-white font-bold text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
              {isSaving ? <iconify-icon icon="solar:spinner-linear" class="animate-spin"></iconify-icon> : <iconify-icon icon="solar:diskette-bold"></iconify-icon>}
              Download
            </button>
          </div>
        </div>
        
        {/* Sub Toolbar */}
        <div className="h-14 flex items-center justify-center gap-1 bg-[#f9fafb] transition-all">
          {activeMode === 'annotate' ? (
            <>
              <button onClick={() => setActiveTool('draw')} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors ${activeTool === 'draw' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:pen-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Draw</span>
              </button>
              <button onClick={() => setActiveTool('highlight')} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors ${activeTool === 'highlight' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="mdi:marker" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Highlight</span>
              </button>
              <button onClick={() => setActiveTool('shape')} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors ${activeTool === 'shape' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="mdi:shape-outline" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Shapes</span>
              </button>
              <button onClick={() => { setActiveTool('form'); setSelectedElementId(null); if (isMobile) setBottomSheetOpen(true); }} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors relative ${activeTool === 'form' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:document-add-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Forms</span>
              </button>
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <button onClick={() => setActiveTool('image')} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors ${activeTool === 'image' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:gallery-add-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Insert</span>
              </button>
              <button onClick={() => setActiveTool('text')} className={`flex flex-col items-center justify-center w-20 h-12 rounded-lg transition-colors relative ${activeTool === 'text' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:text-square-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Add Text</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTool('eraser')} className={`flex flex-col items-center justify-center w-24 h-12 rounded-lg transition-colors ${activeTool === 'eraser' ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:eraser-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Erase (Whiteout)</span>
              </button>
              <button onClick={() => setActiveTool('text')} className={`flex flex-col items-center justify-center w-24 h-12 rounded-lg transition-colors relative ${activeTool === 'text' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:text-square-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Replace Text</span>
              </button>
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <button onClick={() => setActiveTool('image')} className={`flex flex-col items-center justify-center w-24 h-12 rounded-lg transition-colors ${activeTool === 'image' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                 <iconify-icon icon="solar:gallery-add-linear" class="text-xl"></iconify-icon>
                 <span className="text-[10px] font-bold mt-0.5">Replace Image</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Tabs) */}
        {!isMobile && (
          <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-20">
            {/* Tab Header */}
            <div className="flex border-b border-gray-100">
              {[
                { id: 'bookmarks', icon: 'solar:bookmark-bold-duotone', label: 'Bookmarks' },
                { id: 'layers',    icon: 'solar:layers-bold-duotone',   label: 'Layers' },
                { id: 'signatures',icon: 'solar:pen-new-round-bold-duotone', label: 'Signature' },
                { id: 'attachments',icon: 'solar:paperclip-2-bold-duotone', label: 'Attach' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`flex-1 py-2 flex flex-col items-center justify-center gap-0.5 transition-all border-b-2 text-[10px] font-bold uppercase tracking-wide ${
                    leftTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                      : 'border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                  title={tab.label}
                >
                  <iconify-icon icon={tab.icon} class="text-lg"></iconify-icon>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── BOOKMARKS ── */}
              {leftTab === 'bookmarks' && (
                <div className="p-3">
                  <button
                    onClick={() => {
                      const label = `Page ${currentPage}`;
                      if (!bookmarks.find(b => b.page === currentPage)) {
                        setBookmarks(prev => [...prev, { page: currentPage, label }]);
                        toast.success(`Bookmark added for Page ${currentPage}`);
                      } else {
                        toast('Bookmark already exists for this page');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl mb-3 transition-colors shadow-sm"
                  >
                    <iconify-icon icon="solar:add-circle-bold" class="text-lg"></iconify-icon>
                    Bookmark Current Page
                  </button>
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-10">
                      <iconify-icon icon="solar:bookmark-broken" class="text-4xl text-gray-200"></iconify-icon>
                      <p className="text-sm text-gray-400 mt-2">No bookmarks yet.<br/>Click above to add one.</p>
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {bookmarks.map((bm, i) => (
                        <li key={i} className="flex items-center justify-between bg-gray-50 hover:bg-indigo-50 rounded-xl px-3 py-2 group transition-colors">
                          <button
                            onClick={() => setCurrentPage(bm.page)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-indigo-600 flex-1 text-left"
                          >
                            <iconify-icon icon="solar:bookmark-bold" class="text-indigo-400"></iconify-icon>
                            {bm.label}
                          </button>
                          <button
                            onClick={() => setBookmarks(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                          >
                            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── LAYERS ── */}
              {leftTab === 'layers' && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Elements on Page {currentPage}</p>
                  {elements.filter(el => el.page === currentPage).length === 0 ? (
                    <div className="text-center py-10">
                      <iconify-icon icon="solar:layers-broken" class="text-4xl text-gray-200"></iconify-icon>
                      <p className="text-sm text-gray-400 mt-2">No elements on this page yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {elements.filter(el => el.page === currentPage).map((el, i) => (
                        <li
                          key={el.id}
                          onClick={() => { setSelectedElementId(el.id); setActiveTool(el.type === 'highlight' ? 'highlight' : el.type === 'eraser' ? 'eraser' : el.type); }}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-colors group ${
                            selectedElementId === el.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <iconify-icon
                              icon={
                                el.type === 'text' ? 'solar:text-square-bold' :
                                el.type === 'shape' ? 'solar:shapes-bold' :
                                el.type === 'image' ? 'solar:gallery-bold' :
                                el.type === 'highlight' ? 'solar:marker-bold' :
                                el.type === 'draw' ? 'solar:pen-bold' :
                                el.type === 'eraser' ? 'solar:eraser-bold' :
                                el.type === 'form' ? 'solar:document-add-bold' :
                                'solar:layers-bold'
                              }
                              class={`text-base ${
                                el.type === 'text' ? 'text-blue-500' :
                                el.type === 'shape' ? 'text-purple-500' :
                                el.type === 'image' ? 'text-green-500' :
                                el.type === 'highlight' ? 'text-yellow-500' :
                                el.type === 'eraser' ? 'text-red-400' :
                                'text-gray-500'
                              }`}
                            ></iconify-icon>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {el.type === 'text' ? (el.text?.slice(0, 16) || 'Text box') : el.type} #{i + 1}
                            </span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); pushHistory(elements.filter(x => x.id !== el.id)); if (selectedElementId === el.id) setSelectedElementId(null); }}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── SIGNATURES ── */}
              {leftTab === 'signatures' && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Draw Your Signature</p>
                  <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 mb-3">
                    <canvas
                      ref={sigCanvasRef}
                      width={268}
                      height={120}
                      className="block cursor-crosshair touch-none"
                      style={{ width: '100%', height: '120px' }}
                      onMouseDown={(e) => {
                        setIsDrawingSig(true);
                        const c = sigCanvasRef.current;
                        const ctx = c.getContext('2d');
                        const r = c.getBoundingClientRect();
                        ctx.beginPath();
                        ctx.moveTo((e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height));
                      }}
                      onMouseMove={(e) => {
                        if (!isDrawingSig) return;
                        const c = sigCanvasRef.current;
                        const ctx = c.getContext('2d');
                        const r = c.getBoundingClientRect();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#1e293b';
                        ctx.lineCap = 'round';
                        ctx.lineTo((e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height));
                        ctx.stroke();
                      }}
                      onMouseUp={() => { setIsDrawingSig(false); setSignatureDataUrl(sigCanvasRef.current.toDataURL()); }}
                      onMouseLeave={() => { if (isDrawingSig) { setIsDrawingSig(false); setSignatureDataUrl(sigCanvasRef.current.toDataURL()); } }}
                    />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => {
                        const c = sigCanvasRef.current;
                        const ctx = c.getContext('2d');
                        ctx.clearRect(0, 0, c.width, c.height);
                        setSignatureDataUrl(null);
                      }}
                      className="flex-1 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >Clear</button>
                    <button
                      onClick={() => {
                        if (!signatureDataUrl) { toast.error('Please draw your signature first'); return; }
                        const newEl = {
                          id: Date.now().toString(),
                          page: currentPage,
                          type: 'image',
                          x: 20, y: 70,
                          width: 30, height: 12,
                          src: signatureDataUrl
                        };
                        pushHistory([...elements, newEl]);
                        setSelectedElementId(newEl.id);
                        setActiveTool('select');
                        toast.success('Signature placed on PDF!');
                      }}
                      className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >Place on PDF</button>
                  </div>
                  {signatureDataUrl && (
                    <div className="bg-white rounded-xl border border-gray-100 p-2">
                      <p className="text-xs text-gray-400 mb-1 font-bold">Preview</p>
                      <img src={signatureDataUrl} alt="Signature" className="max-h-12 object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* ── ATTACHMENTS ── */}
              {leftTab === 'attachments' && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">File Attachments</p>
                  <div className="text-center py-10">
                    <iconify-icon icon="solar:paperclip-2-bold" class="text-4xl text-gray-200"></iconify-icon>
                    <p className="text-sm text-gray-400 mt-2 mb-4">This PDF has no embedded file attachments.</p>
                    <p className="text-xs text-gray-300">PDF file attachments are embedded inside the document. Use the official Adobe Acrobat tools to add/manage embedded files.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Contextual Properties injected into Sidebar if element is selected */}
            {(activeTool !== 'select' || selectedElementId) && (
              <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Properties</h3>
                  {selectedElementId && (
                     <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-1 rounded">
                       <iconify-icon icon="solar:trash-bin-trash-linear" class="text-base"></iconify-icon>
                     </button>
                  )}
                </div>
              
              {activeTool === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Font</label>
                    <select 
                      value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.font : textOptions.font} 
                      onChange={e => {
                        const val = e.target.value;
                        setTextOptions({...textOptions, font: val});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, font: val }});
                          finalizeElementUpdate();
                        }
                      }} 
                      className="w-full mt-1 p-2 border border-gray-200 rounded text-sm"
                    >
                      {ALL_FONTS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Size: {selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.size : textOptions.size}px</label>
                    <input 
                      type="range" min="8" max="72" 
                      value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.size : textOptions.size} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setTextOptions({...textOptions, size: val});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, size: val }});
                        }
                      }} 
                      onMouseUp={finalizeElementUpdate}
                      className="w-full accent-indigo-600" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Color</label>
                    <input 
                      type="color" 
                      value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.color : textOptions.color} 
                      onChange={e => {
                        const val = e.target.value;
                        setTextOptions({...textOptions, color: val});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, color: val }});
                          finalizeElementUpdate();
                        }
                      }} 
                      className="w-full h-8 cursor-pointer rounded" 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Click anywhere on the PDF to add new text. Click existing text to edit it.</p>
                </div>
              )}

              {activeTool === 'shape' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'rectangle', icon: 'mdi:rectangle-outline',  label: 'Rect' },
                      { id: 'circle',    icon: 'mdi:circle-outline',      label: 'Circle' },
                      { id: 'triangle',  icon: 'mdi:triangle-outline',    label: 'Tri' },
                      { id: 'line',      icon: 'mdi:minus',               label: 'Line' },
                      { id: 'arrow',     icon: 'mdi:arrow-right-thin',    label: 'Arrow' },
                      { id: 'star',      icon: 'mdi:star-outline',        label: 'Star' },
                      { id: 'diamond',   icon: 'mdi:rhombus-outline',     label: 'Diamond' },
                    ].map(s => (
                      <button key={s.id} onClick={() => {
                        if (PRO_SHAPES.includes(s.id) && !isPro) { setShowProModal(true); return; }
                        setShapeOptions({...shapeOptions, type: s.id});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, type: s.id }});
                          finalizeElementUpdate();
                        }
                      }} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 relative transition-all ${
                        ((selectedElementId && elements.find(e=>e.id===selectedElementId)?.type==='shape' ? elements.find(e=>e.id===selectedElementId).options.type : shapeOptions.type) === s.id)
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-500'
                      }`} title={s.label}>
                        <iconify-icon icon={s.icon} class="text-xl"></iconify-icon>
                        <span className="text-[9px] font-bold">{s.label}</span>
                        {PRO_SHAPES.includes(s.id) && !isPro && <span className="absolute -top-1 -right-1 text-[8px] text-yellow-500"><iconify-icon icon="solar:crown-bold"></iconify-icon></span>}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Border Color</label>
                    <input type="color" value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' ? elements.find(e=>e.id===selectedElementId).options.border : shapeOptions.border} onChange={e => {
                        const val = e.target.value;
                        setShapeOptions({...shapeOptions, border: val});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, border: val }});
                          finalizeElementUpdate();
                        }
                      }} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Fill Color (transparent: check box)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' && elements.find(e=>e.id===selectedElementId).options.fill !== 'transparent' ? elements.find(e=>e.id===selectedElementId).options.fill : (shapeOptions.fill === 'transparent' ? '#ffffff' : shapeOptions.fill)} onChange={e => {
                          const val = e.target.value;
                          setShapeOptions({...shapeOptions, fill: val});
                          if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                            updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, fill: val }});
                            finalizeElementUpdate();
                          }
                        }} className="flex-1 h-8 rounded cursor-pointer" />
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input type="checkbox" checked={(selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' ? elements.find(e=>e.id===selectedElementId).options.fill : shapeOptions.fill) === 'transparent'} onChange={e => {
                          const val = e.target.checked ? 'transparent' : '#ffffff';
                          setShapeOptions({...shapeOptions, fill: val});
                          if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                            updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, fill: val }});
                            finalizeElementUpdate();
                          }
                        }} />
                        None
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Click anywhere on the PDF to add new shape. Click existing shape to edit it.</p>
                </div>
              )}

               {activeTool === 'draw' && (
                <div className="space-y-3">
                  <div><label className="text-xs font-bold text-gray-700 flex items-center gap-1">Brush Size: {drawOptions.size}px {!isPro && <span className="text-[10px] text-yellow-500"><iconify-icon icon="solar:crown-bold"></iconify-icon></span>}</label>
                  <input type="range" min="1" max="20" value={drawOptions.size} onChange={e => { if(!checkPro('draw_full')) return; setDrawOptions({...drawOptions, size: parseInt(e.target.value)})}} className="w-full accent-indigo-600" /></div>
                  <div><label className="text-xs font-bold text-gray-700 flex items-center gap-1">Color {!isPro && <span className="text-[10px] text-yellow-500"><iconify-icon icon="solar:crown-bold"></iconify-icon></span>}</label>
                  <input type="color" value={drawOptions.color} onClick={e => { if(!isPro) e.preventDefault(); checkPro('draw_full'); }} onChange={e => setDrawOptions({...drawOptions, color: e.target.value})} className="w-full h-8 cursor-pointer rounded" /></div>
                  <button onClick={() => { setDrawPaths(prev => prev.filter(p => p.page !== currentPage)); }} className="w-full text-xs font-bold text-red-500 hover:bg-red-50 py-2 rounded-lg border border-red-200">Clear Page Drawings</button>
                </div>
              )}

              {activeTool === 'highlight' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Highlight Color</label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {[
                        { color: '#FFFF00', name: 'Yellow' },
                        { color: '#90EE90', name: 'Green' },
                        { color: '#FFB6C1', name: 'Pink' },
                        { color: '#ADD8E6', name: 'Blue' },
                        { color: '#FFA500', name: 'Orange' },
                        { color: '#DDA0DD', name: 'Purple' },
                        { color: '#90EE90', name: 'Lime' },
                        { color: '#FF6347', name: 'Red' },
                        { color: '#87CEEB', name: 'Sky' },
                        { color: '#F0E68C', name: 'Khaki' },
                      ].map(c => (
                        <button key={c.color} onClick={() => {
                          setHighlightOptions({...highlightOptions, color: c.color});
                        }} className={`w-full aspect-square rounded-lg border-2 relative transition-all flex items-center justify-center ${
                          highlightOptions.color === c.color ? 'border-gray-800 scale-110 shadow-md' : 'border-gray-200 hover:scale-105'
                        }`} style={{backgroundColor: c.color}} title={c.name}>
                          {highlightOptions.color === c.color && (
                            <iconify-icon icon="solar:check-circle-bold" class="text-gray-700 text-base"></iconify-icon>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">Opacity: {Math.round(highlightOptions.opacity * 100)}%</label>
                    <input type="range" min="10" max="80" value={Math.round(highlightOptions.opacity * 100)}
                      onChange={e => setHighlightOptions({...highlightOptions, opacity: parseInt(e.target.value) / 100})}
                      className="w-full accent-yellow-500 mt-1" />
                  </div>
                  <p className="text-xs text-gray-500">Click on PDF to place a highlight bar.</p>
                </div>
              )}

              {activeTool === 'image' && (
                <div className="space-y-4">
                  <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => imageInputRef.current.click()} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50">Upload Image</button>
                </div>
              )}

              {activeTool === 'form' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Form Field Type</label>
                    <select 
                      value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'form' ? elements.find(e=>e.id===selectedElementId).options.type : formOptions.type} 
                      onChange={e => {
                        const val = e.target.value;
                        setFormOptions({...formOptions, type: val});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'form') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, type: val }, width: val === 'checkbox' ? 4 : 25, height: val === 'checkbox' ? 4 : 4 });
                          finalizeElementUpdate();
                        }
                      }} 
                      className="w-full mt-1 p-2 border border-gray-200 rounded text-sm"
                    >
                      <option value="text_field">Text Field</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Click anywhere on the PDF to place a fillable form field.</p>
                </div>
              )}

              </div>
            )}
          </aside>
        )}

        {/* CENTER CANVAS AREA */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-auto bg-[#e5e7eb] flex flex-col p-4 sm:p-8 relative items-center ${activeTool === 'select' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`} 
          onClick={handleCanvasClick}
          onMouseDown={startPan}
          onMouseMove={movePan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
        >
          
          <div ref={wrapperRef} className="relative shadow-2xl transition-all" style={{ width: canvasRef.current?.style?.width || '100%', height: canvasRef.current?.style?.height || 'auto' }}>
            <canvas ref={canvasRef} className="block bg-white rounded-sm pointer-events-none" />
            
            {/* Freehand Draw Canvas Overlay */}
            <canvas 
              ref={drawCanvasRef}
              className="absolute inset-0 z-[5]"
              style={{ cursor: activeTool === 'draw' ? 'crosshair' : 'default', pointerEvents: activeTool === 'draw' ? 'auto' : 'none' }}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
            
            {/* Elements Overlay */}
            {elements.filter(el => el.page === currentPage).map(el => (
              <div
                key={el.id}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); if(el.type !== 'text') setActiveTool(el.type === 'highlight' ? 'highlight' : el.type); }}
                onMouseDown={(e) => { if (el.type === 'text' && selectedElementId === el.id) return; handleMouseDown(e, el); }}
                onTouchStart={(e) => { if (el.type === 'text' && selectedElementId === el.id) return; handleMouseDown(e, el); }}
                className="absolute overflow-visible group"
                style={{ 
                  left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`,
                  zIndex: selectedElementId === el.id ? 10 : 1,
                  cursor: el.type === 'text' && selectedElementId === el.id ? 'text' : 'move',
                  outline: selectedElementId === el.id
                    ? '2px solid #6366f1'
                    : undefined,
                  boxShadow: selectedElementId === el.id ? '0 0 0 2px #6366f1' : undefined,
                }}
              >
                {/* Invisible hover ring — only shows on hover, disappears on mouse leave */}
                {selectedElementId !== el.id && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-400 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                )}
                {/* Text Element */}
                {el.type === 'text' && (
                  <textarea 
                    value={el.text}
                    placeholder="Type here..."
                    onChange={(e) => updateElement(el.id, { text: e.target.value })}
                    onBlur={() => finalizeElementUpdate()}
                    onFocus={() => { setSelectedElementId(el.id); setActiveTool('text'); }}
                    className="w-full h-full bg-transparent resize-none outline-none overflow-hidden placeholder-gray-400"
                    style={{ fontSize: `${el.options.size * scale}px`, color: el.options.color, fontFamily: el.options.font, fontWeight: el.options.bold ? 'bold' : 'normal', cursor: 'text' }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => { if(selectedElementId === el.id) e.stopPropagation(); }}
                    onTouchStart={(e) => { if(selectedElementId === el.id) e.stopPropagation(); }}
                  />
                )}
                
                {/* Highlight Element */}
                {el.type === 'highlight' && (
                  <div className="w-full h-full" style={{ backgroundColor: el.options.color, opacity: el.options.opacity, borderRadius: '2px' }}></div>
                )}
                
                {/* Eraser Element */}
                {el.type === 'eraser' && (
                  <div className="w-full h-full bg-white pointer-events-none"></div>
                )}
                
                {/* Shape Element */}
                {el.type === 'shape' && (
                  <div className="w-full h-full relative" style={{pointerEvents: 'none'}}>
                    {el.options.type === 'rectangle' && (
                      <div className="w-full h-full" style={{ border: `${el.options.width}px solid ${el.options.border}`, backgroundColor: el.options.fill }}></div>
                    )}
                    {el.options.type === 'circle' && (
                      <div className="w-full h-full rounded-full" style={{ border: `${el.options.width}px solid ${el.options.border}`, backgroundColor: el.options.fill }}></div>
                    )}
                    {el.options.type === 'line' && (
                      <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${el.options.width}px`, backgroundColor: el.options.border }}></div>
                    )}
                    {el.options.type === 'triangle' && (
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
                        <polygon points="50,0 100,100 0,100" fill={el.options.fill} stroke={el.options.border} strokeWidth={el.options.width} vectorEffect="non-scaling-stroke" />
                      </svg>
                    )}
                    {el.options.type === 'arrow' && (
                      <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0">
                        <line x1="0" y1="25" x2="75" y2="25" stroke={el.options.border} strokeWidth={el.options.width} vectorEffect="non-scaling-stroke" />
                        <polygon points="70,10 100,25 70,40" fill={el.options.border} />
                      </svg>
                    )}
                    {el.options.type === 'star' && (
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
                        <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill={el.options.fill} stroke={el.options.border} strokeWidth={el.options.width} vectorEffect="non-scaling-stroke" />
                      </svg>
                    )}
                    {el.options.type === 'diamond' && (
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
                        <polygon points="50,0 100,50 50,100 0,50" fill={el.options.fill} stroke={el.options.border} strokeWidth={el.options.width} vectorEffect="non-scaling-stroke" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Image Element */}
                {el.type === 'image' && (
                  <img src={el.src} className="w-full h-full object-contain" draggable={false} style={{pointerEvents: 'none'}} />
                )}

                {/* Form Element */}
                {el.type === 'form' && (
                  <div className="w-full h-full bg-blue-100/50 border-2 border-blue-400 flex items-center justify-center pointer-events-none rounded-sm overflow-hidden">
                    {el.options.type === 'checkbox' ? (
                      <div className="w-[80%] h-[80%] border border-blue-500 bg-white"></div>
                    ) : (
                      <span className="text-[12px] text-blue-600 font-bold truncate px-1">Text Field</span>
                    )}
                  </div>
                )}

                {/* Resize Handle for Selected */}
                {selectedElementId === el.id && (
                  <div 
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-20 shadow-md"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startW = el.width; const startH = el.height;
                      const startX = e.clientX; const startY = e.clientY;
                      const wRect = wrapperRef.current.getBoundingClientRect();
                      const onMove = (ev) => {
                        updateElement(el.id, { width: Math.max(3, startW + ((ev.clientX - startX)/wRect.width)*100), height: Math.max(2, startH + ((ev.clientY - startY)/wRect.height)*100) });
                      };
                      const onUp = () => { finalizeElementUpdate(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const startW = el.width; const startH = el.height;
                      const startX = e.touches[0].clientX; const startY = e.touches[0].clientY;
                      const wRect = wrapperRef.current.getBoundingClientRect();
                      const onMove = (ev) => {
                        updateElement(el.id, { width: Math.max(3, startW + ((ev.touches[0].clientX - startX)/wRect.width)*100), height: Math.max(2, startH + ((ev.touches[0].clientY - startY)/wRect.height)*100) });
                      };
                      const onUp = () => { finalizeElementUpdate(); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
                      window.addEventListener('touchmove', onMove, {passive:false}); window.addEventListener('touchend', onUp);
                    }}
                  />
                )}

                {/* Delete button for selected */}
                {selectedElementId === el.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-20 hover:bg-red-600 text-xs"
                  >✕</button>
                )}

                {/* Drag Handle for Selected */}
                {selectedElementId === el.id && (
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full cursor-move z-20 shadow-md flex items-center justify-center text-indigo-500"
                    onMouseDown={(e) => handleMouseDown(e, el)}
                    onTouchStart={(e) => handleMouseDown(e, el)}
                  >
                    <iconify-icon icon="solar:transfer-horizontal-bold" class="rotate-90 text-xs pointer-events-none"></iconify-icon>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* BOTTOM FLOATING CONTROLS */}
          {!isMobile && (
             <div className="fixed bottom-6 left-1/2 ml-[150px] -translate-x-1/2 bg-[#333538] text-white h-12 px-2 rounded-lg shadow-2xl flex items-center gap-2 z-40 border border-gray-700">
               <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30">
                 <iconify-icon icon="solar:alt-arrow-up-linear"></iconify-icon>
               </button>
               <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage === numPages} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30">
                 <iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon>
               </button>
               <div className="bg-[#4d5156] px-3 h-8 rounded flex items-center text-sm mx-1">
                 {currentPage} <span className="mx-2 text-gray-400">/</span> {numPages}
               </div>
               
               <div className="w-px h-6 bg-gray-600 mx-2"></div>
               
               <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10">
                 <iconify-icon icon="solar:minus-circle-linear" class="text-xl"></iconify-icon>
               </button>
               <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10">
                 <iconify-icon icon="solar:add-circle-linear" class="text-xl"></iconify-icon>
               </button>
               <button onClick={zoomReset} className="bg-[#4d5156] px-3 h-8 rounded flex items-center text-sm mx-1 min-w-[60px] justify-center hover:bg-[#5d6166] cursor-pointer" title="Reset zoom">
                 {Math.round(scale * 100)}%
               </button>
               
               <div className="w-px h-6 bg-gray-600 mx-2"></div>
               
               <button onClick={zoomReset} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-300" title="Fit to Page">
                 <iconify-icon icon="solar:full-screen-linear"></iconify-icon>
               </button>
             </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM TOOLBAR ── */}
      {isMobile && (
        <nav className="bg-white border-t border-gray-200 flex items-center justify-around pb-safe h-16 shrink-0 z-40 relative shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          {activeMode === 'annotate' ? (
            <>
              <ToolBtn name="text" icon="solar:text-square-linear" label="Text" />
              <ToolBtn name="draw" icon="solar:pen-linear" label="Draw" />
              <ToolBtn name="highlight" icon="solar:marker-linear" label="Mark" />
              <ToolBtn name="shape" icon="solar:shapes-linear" label="Shape" />
              <ToolBtn name="image" icon="solar:gallery-linear" label="Image" />
              <ToolBtn name="form" icon="solar:document-add-linear" label="Form" />
            </>
          ) : (
            <>
              <ToolBtn name="eraser" icon="solar:eraser-linear" label="Erase" />
              <ToolBtn name="text" icon="solar:text-square-linear" label="Replace" />
              <ToolBtn name="image" icon="solar:gallery-add-linear" label="Image" />
            </>
          )}
          
          <ToolBtn name="select" icon="solar:cursor-square-linear" label="Select" />
          
          {selectedElementId && (
            <button onClick={deleteSelected} className="flex flex-col items-center justify-center gap-1 p-2 text-red-500">
              <iconify-icon icon="solar:trash-bin-trash-linear" class="text-2xl"></iconify-icon>
              <span className="text-[10px] font-bold">Delete</span>
            </button>
          )}
        </nav>
      )}

      {/* ── MOBILE BOTTOM SHEET (Options) ── */}
      {isMobile && bottomSheetOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/20 pointer-events-auto backdrop-blur-sm transition-opacity" onClick={() => setBottomSheetOpen(false)} />
          <div className="bg-white rounded-t-3xl p-6 pointer-events-auto shadow-2xl animate-slide-up relative">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">{activeTool} Options</h3>
            
            {activeTool === 'text' && (
               <div>
                  <p className="text-sm text-gray-500 mb-4">Tap on the PDF to place new text, or select existing.</p>
                  
                  <label className="text-xs font-bold text-gray-700 block mb-1">Font</label>
                  <select 
                    value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.font : textOptions.font} 
                    onChange={e => {
                      const val = e.target.value;
                      setTextOptions({...textOptions, font: val});
                      if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                        updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, font: val }});
                        finalizeElementUpdate();
                      }
                    }} 
                    className="w-full mb-4 p-3 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    {ALL_FONTS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                  </select>

                  <label className="text-xs font-bold text-gray-700 block mb-1">Size: {selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.size : textOptions.size}px</label>
                  <input 
                    type="range" min="8" max="72" 
                    value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.size : textOptions.size} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setTextOptions({...textOptions, size: val});
                      if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                        updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, size: val }});
                      }
                    }} 
                    onTouchEnd={finalizeElementUpdate}
                    className="w-full mb-4 accent-indigo-600" 
                  />

                  <label className="text-xs font-bold text-gray-700 block mb-1">Color</label>
                  <input 
                    type="color" 
                    value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'text' ? elements.find(e=>e.id===selectedElementId).options.color : textOptions.color} 
                    onChange={e => {
                      const val = e.target.value;
                      setTextOptions({...textOptions, color: val});
                      if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'text') {
                        updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, color: val }});
                        finalizeElementUpdate();
                      }
                    }} 
                    className="w-full h-12 rounded mb-4" 
                  />
               </div>
            )}
            
            {activeTool === 'shape' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Tap on the PDF to place new shape, or select existing.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {['rectangle', 'circle', 'triangle', 'line', 'arrow', 'star', 'diamond'].map(s => (
                      <button key={s} onClick={() => {
                        if (PRO_SHAPES.includes(s) && !isPro) { setShowProModal(true); return; }
                        setShapeOptions({...shapeOptions, type: s});
                        if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                          updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, type: s }});
                          finalizeElementUpdate();
                        }
                      }} className={`py-3 px-4 text-2xl rounded-xl border-2 relative ${((selectedElementId && elements.find(e=>e.id===selectedElementId)?.type==='shape' ? elements.find(e=>e.id===selectedElementId).options.type : shapeOptions.type) === s) ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-200 text-gray-400'}`} title={s}>
                        {s === 'rectangle' ? '▭' : s === 'circle' ? '◯' : s === 'triangle' ? '△' : s === 'line' ? '─' : s === 'arrow' ? '→' : s === 'star' ? '☆' : '◇'}
                        {PRO_SHAPES.includes(s) && !isPro && <span className="absolute -top-1 -right-1 text-[9px] text-yellow-500"><iconify-icon icon="solar:crown-bold"></iconify-icon></span>}
                      </button>
                    ))}
                </div>
                
                <label className="text-xs font-bold text-gray-700 block mb-1">Border Color</label>
                <input type="color" value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' ? elements.find(e=>e.id===selectedElementId).options.border : shapeOptions.border} onChange={e => {
                    const val = e.target.value;
                    setShapeOptions({...shapeOptions, border: val});
                    if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                      updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, border: val }});
                      finalizeElementUpdate();
                    }
                  }} className="w-full h-12 rounded mb-4" />

                <label className="text-xs font-bold text-gray-700 block mb-1">Fill Color (Check 'None' for transparent)</label>
                <div className="flex items-center gap-4 mb-4">
                  <input type="color" value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' && elements.find(e=>e.id===selectedElementId).options.fill !== 'transparent' ? elements.find(e=>e.id===selectedElementId).options.fill : (shapeOptions.fill === 'transparent' ? '#ffffff' : shapeOptions.fill)} onChange={e => {
                      const val = e.target.value;
                      setShapeOptions({...shapeOptions, fill: val});
                      if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                        updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, fill: val }});
                        finalizeElementUpdate();
                      }
                    }} className="flex-1 h-12 rounded" />
                  <label className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                    <input type="checkbox" checked={(selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'shape' ? elements.find(e=>e.id===selectedElementId).options.fill : shapeOptions.fill) === 'transparent'} onChange={e => {
                      const val = e.target.checked ? 'transparent' : '#ffffff';
                      setShapeOptions({...shapeOptions, fill: val});
                      if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'shape') {
                        updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, fill: val }});
                        finalizeElementUpdate();
                      }
                    }} className="w-5 h-5 accent-indigo-600" />
                    None
                  </label>
                </div>
              </div>
            )}

            {activeTool === 'image' && (
              <div>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button onClick={() => imageInputRef.current.click()} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                  <iconify-icon icon="solar:camera-linear" class="text-xl"></iconify-icon> Select from Camera/Gallery
                </button>
              </div>
            )}

            {activeTool === 'form' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Tap on the PDF to place a fillable form field.</p>
                <label className="text-xs font-bold text-gray-700 block mb-1">Field Type</label>
                <select 
                  value={selectedElementId && elements.find(e=>e.id===selectedElementId)?.type === 'form' ? elements.find(e=>e.id===selectedElementId).options.type : formOptions.type} 
                  onChange={e => {
                    const val = e.target.value;
                    setFormOptions({...formOptions, type: val});
                    if (selectedElementId && elements.find(el=>el.id===selectedElementId)?.type === 'form') {
                      updateElement(selectedElementId, { options: { ...elements.find(el=>el.id===selectedElementId).options, type: val }, width: val === 'checkbox' ? 4 : 25, height: val === 'checkbox' ? 4 : 4 });
                      finalizeElementUpdate();
                    }
                  }} 
                  className="w-full mb-4 p-3 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="text_field">Text Field</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
            )}

            {activeTool === 'draw' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Draw freely on the PDF. Close this sheet first, then draw.</p>
                <label className="text-xs font-bold text-gray-700 block mb-1">Brush Size: {drawOptions.size}px</label>
                <input type="range" min="1" max="20" value={drawOptions.size} onChange={e => setDrawOptions({...drawOptions, size: parseInt(e.target.value)})} className="w-full mb-4 accent-indigo-600" />
                <label className="text-xs font-bold text-gray-700 block mb-1">Color</label>
                <input type="color" value={drawOptions.color} onChange={e => setDrawOptions({...drawOptions, color: e.target.value})} className="w-full h-12 rounded mb-4" />
                <button onClick={() => { setDrawPaths(prev => prev.filter(p => p.page !== currentPage)); }} className="w-full text-sm font-bold text-red-500 hover:bg-red-50 py-3 rounded-xl border border-red-200">Clear Page Drawings</button>
              </div>
            )}

            {activeTool === 'highlight' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Tap on PDF to place a highlight bar.</p>
                <label className="text-xs font-bold text-gray-700 block mb-2">Highlight Color</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {['#ffff00','#00ff00','#ff99cc','#00ccff','#ff9900'].map(c => (
                    <button key={c} onClick={() => {
                      if (PRO_HIGHLIGHT_COLORS.includes(c) && !isPro) { setShowProModal(true); return; }
                      setHighlightOptions({...highlightOptions, color: c});
                    }} className={`w-10 h-10 rounded-full border-2 relative ${highlightOptions.color === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`} style={{backgroundColor:c}}>
                      {PRO_HIGHLIGHT_COLORS.includes(c) && !isPro && <span className="absolute -top-1 -right-1 text-[9px] text-yellow-600"><iconify-icon icon="solar:crown-bold"></iconify-icon></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'eraser' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Tap on the PDF to place a whiteout box over existing text to hide it. Then use "Replace Text" to type new text.</p>
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4">
                  <strong>Note:</strong> Eraser draws a white rectangle over existing text to hide it.
                </div>
              </div>
            )}

            <button onClick={() => setBottomSheetOpen(false)} className="w-full mt-6 py-3 font-bold text-gray-500">Close Options</button>
          </div>
        </div>
      )}
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Advanced Edit PDF" 
        limitMessage={upgradeMessage}
      />
    </div>
  );
}
