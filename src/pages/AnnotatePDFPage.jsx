import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Save, Share2, Download, List, Undo2, Redo2, Loader2 } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { toast } from 'react-hot-toast';

import Toolbar from '../components/AnnotatePDF/Toolbar';
import AnnotationsList from '../components/AnnotatePDF/AnnotationsList';
import PDFCanvas from '../components/AnnotatePDF/PDFCanvas';
import PropertiesPanel from '../components/AnnotatePDF/PropertiesPanel';
import MobileBottomSheet from '../components/AnnotatePDF/MobileBottomSheet';
import CommentThread from '../components/AnnotatePDF/CommentThread';

export default function AnnotatePDFPage() {
  const [file, setFile] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [toolColor, setToolColor] = useState('#eab308');
  const [toolOpacity, setToolOpacity] = useState(50);

  // History for undo/redo
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Mobile specific states
  const [showMobileList, setShowMobileList] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIdx(0);
      setSelectedAnnotation(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const pushHistory = (newAnns) => {
    const trimmed = history.slice(0, historyIdx + 1);
    const next = [...trimmed, newAnns];
    setHistory(next);
    setHistoryIdx(next.length - 1);
  };

  const undo = () => {
    if (historyIdx <= 0) return;
    const prev = historyIdx - 1;
    setAnnotations(history[prev]);
    setHistoryIdx(prev);
    setSelectedAnnotation(null);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const next = historyIdx + 1;
    setAnnotations(history[next]);
    setHistoryIdx(next);
  };

  const handleAddAnnotation = (newAnnotation) => {
    const ann = {
      ...newAnnotation,
      id: Date.now().toString(),
      author: 'Current User',
      date: new Date(),
    };
    const newAnns = [...annotations, ann];
    setAnnotations(newAnns);
    pushHistory(newAnns);
    setSelectedAnnotation(ann);
    // auto-switch to select after placing
    if (!['draw','highlight','underline','strikethrough','squiggly','shape_rect','shape_circle'].includes(newAnnotation.type)) {
      setActiveTool('select');
    }
  };

  const handleUpdateAnnotation = (id, updates) => {
    const newAnns = annotations.map(a => a.id === id ? { ...a, ...updates } : a);
    setAnnotations(newAnns);
    pushHistory(newAnns);
    setSelectedAnnotation(newAnns.find(a => a.id === id));
  };

  const handleDeleteAnnotation = (id) => {
    const newAnns = annotations.filter(a => a.id !== id);
    setAnnotations(newAnns);
    pushHistory(newAnns);
    if (selectedAnnotation?.id === id) setSelectedAnnotation(null);
  };

  const handleAddComment = (comment) => {
    setComments(prev => [...prev, {
      id: Date.now().toString(),
      text: comment.text,
      parentId: comment.parentId,
      author: 'Current User',
      date: new Date(),
      annotationId: selectedAnnotation?.id || null,
      resolved: false
    }]);
  };

  const handleResolveComment = (id) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  const handleDeleteComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));
  };

  // ─── Export annotated PDF using pdf-lib ────────────────────────────────────
  const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1],16)/255, g: parseInt(r[2],16)/255, b: parseInt(r[3],16)/255 } : {r:0,g:0,b:0};
  };

  // Canvas-based text renderer: supports ALL unicode + emojis
  const renderTextToPng = (text, opts = {}) => {
    const { fontSize=13, color='#1e293b', bgColor=null, bold=false, italic=false, w=200, h=50, padding=4 } = opts;
    const scale = 2;
    const cvs = document.createElement('canvas');
    cvs.width  = Math.max(w, 40) * scale;
    cvs.height = Math.max(h, 20) * scale;
    const ctx = cvs.getContext('2d');
    ctx.scale(scale, scale);
    if (bgColor) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h); }
    ctx.font = `${italic?'italic ':''} ${bold?'bold ':''} ${fontSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",Arial,sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    const words = text.split(' ');
    let line = '', y = padding;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > w - padding * 2 && line) {
        ctx.fillText(line, padding, y); line = word; y += fontSize + 2;
        if (y + fontSize > h) break;
      } else { line = test; }
    }
    if (line) ctx.fillText(line, padding, y);
    const dataUrl = cvs.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };


  const exportPDF = async () => {
    if (!file) return;
    setIsSaving(true);
    const tid = toast.loading('Exporting annotated PDF...');
    try {
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      for (const ann of annotations) {
        const pageObj = pages[(ann.page || 1) - 1];
        if (!pageObj) continue;
        const { width: pw, height: ph } = pageObj.getSize();
        // Canvas is rendered at some scale — we need to get the rendered canvas dimensions
        // We stored x,y,w,h in canvas pixels. We need to convert to PDF units.
        // We'll use approximate conversion via the PDF page width
        // The canvas scale factor is canvas_width / pdf_page_width
        // Since we don't have it here, we use the canvas DOM element size as reference
        // For simplicity: annotations are stored as px on the rendered canvas.
        // We'll normalize using a reference canvas width stored on annotations.
        const scaleX = pw / (ann._canvasW || pw);
        const scaleY = ph / (ann._canvasH || ph);
        const ax = (ann.x || 0) * scaleX;
        const ay = (ann.y || 0) * scaleY;
        const aw = (ann.w || 80) * scaleX;
        const ah = (ann.h || 20) * scaleY;
        // PDF y is from bottom
        const pdfY = ph - ay - ah;
        const c = hexToRgb(ann.color || '#eab308');
        const op = (ann.opacity || 50) / 100;
        const col = rgb(c.r, c.g, c.b);

        if (ann.type === 'highlight') {
          pageObj.drawRectangle({ x: ax, y: pdfY, width: Math.max(aw,1), height: Math.max(ah,1), color: col, opacity: op });
        } else if (ann.type === 'underline') {
          pageObj.drawLine({ start:{x:ax, y:ph-ay-ah}, end:{x:ax+aw, y:ph-ay-ah}, color:col, thickness:1.5 });
        } else if (ann.type === 'strikethrough') {
          pageObj.drawLine({ start:{x:ax, y:ph-ay-ah/2}, end:{x:ax+aw, y:ph-ay-ah/2}, color:col, thickness:1.5 });
        } else if (ann.type === 'shape_rect') {
          pageObj.drawRectangle({ x:ax, y:pdfY, width:Math.max(aw,1), height:Math.max(ah,1), borderColor:col, borderWidth:2 });
        } else if (ann.type === 'shape_circle') {
          pageObj.drawEllipse({ x:ax+aw/2, y:pdfY+ah/2, xScale:Math.max(aw/2,1), yScale:Math.max(ah/2,1), borderColor:col, borderWidth:2 });
        } else if (ann.type === 'text' && ann.content) {
          // Canvas PNG embed — full emoji + unicode
          try {
            const pngBytes = renderTextToPng(ann.content, { fontSize: ann.fontSize||13, color: ann.fontColor||ann.color||'#1e293b', bgColor:null, bold: ann.fontBold, italic: ann.fontItalic, w: Math.max(aw,40), h: Math.max(ah,20) });
            const img = await pdfDoc.embedPng(pngBytes);
            pageObj.drawImage(img, { x:ax, y:pdfY, width:Math.max(aw,40), height:Math.max(ah,20) });
          } catch(e) { console.warn('text embed failed', e.message); }
        } else if (ann.type === 'note') {
          try {
            const imgH = Math.max(ah+30, 80);
            const py = ph - ay - imgH;
            const pngBytes = renderTextToPng('\uD83D\uDCCC ' + (ann.content||'Note'), { fontSize:13, color:'#92400e', bgColor:null, w:180, h:imgH });
            const img = await pdfDoc.embedPng(pngBytes);
            pageObj.drawImage(img, { x:ax, y:py, width:180, height:imgH });
          } catch(e) { console.warn('note embed failed', e.message); }
        } else if (ann.type === 'comment') {
          try {
            const imgH = Math.max(ah+30, 80);
            const py = ph - ay - imgH;
            const pngBytes = renderTextToPng('\uD83D\uDCAC ' + (ann.content||'Comment'), { fontSize:13, color:'#3730a3', bgColor:null, w:200, h:imgH });
            const img = await pdfDoc.embedPng(pngBytes);
            pageObj.drawImage(img, { x:ax, y:py, width:200, height:imgH });
          } catch(e) { console.warn('comment embed failed', e.message); }
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type:'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `annotated_${file.name}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF exported successfully!', { id: tid });
    } catch(err) {
      console.error('Export error', err);
      toast.error('Export failed: ' + err.message, { id: tid });
    }
    setIsSaving(false);
  };

  const sharePDF = async () => {
    if (navigator.share && file) {
      try {
        await navigator.share({ title: file.name, text: 'Annotated PDF', files: [file] });
      } catch(e) {
        toast('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch(e) {
        toast.error('Share not supported on this browser.');
      }
    }
  };

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const map = { h: 'highlight', u: 'underline', s: 'strikethrough', n: 'note', t: 'text', d: 'draw', e: 'eraser', c: 'comment', Escape: 'select' };
      if (map[e.key]) setActiveTool(map[e.key]);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' && selectedAnnotation) handleDeleteAnnotation(selectedAnnotation.id);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [annotations, selectedAnnotation, historyIdx, history]);

  // ─── Upload screen ───────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col pt-16">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-xl w-full text-center space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Annotate PDF</h1>
              <p className="text-lg text-gray-500">Highlight, underline, draw, add sticky notes and comments</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer bg-white
                ${isDragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1'}`}
              style={{ transition: 'all 0.2s' }}
            >
              <input {...getInputProps()} />
              <div className="text-5xl mb-4">📄</div>
              <p className="text-xl font-semibold text-gray-900 mb-1">
                {isDragActive ? 'Drop it here!' : 'Drop your PDF here'}
              </p>
              <p className="text-gray-400 mb-6">or click to browse</p>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-indigo-500/30 inline-block">
                Choose PDF File
              </span>
            </motion.div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {['🖍️ Highlight', '✍️ Draw', '📌 Sticky Note', '💬 Comment', '🔷 Shapes', '↩️ Undo/Redo'].map(f => (
                <span key={f} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600 shadow-sm">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Editor ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans">

      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setFile(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 truncate max-w-[180px] md:max-w-xs text-sm">{file.name}</span>
        </div>

        {/* Undo/Redo */}
        <div className="hidden md:flex items-center gap-1">
          <button onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)" className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors text-gray-600">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Y)" className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors text-gray-600">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Top Actions */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={undo} disabled={historyIdx <= 0} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowMobileList(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <List className="w-5 h-5" />
          </button>
          <button onClick={exportPDF} disabled={isSaving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>

        {/* Desktop Top Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={sharePDF} className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={exportPDF} disabled={isSaving} className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-60">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          <button onClick={exportPDF} disabled={isSaving} className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export PDF
          </button>
        </div>
      </header>

      {/* Desktop Toolbar */}
      <div className="hidden md:block shrink-0">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          toolColor={toolColor}
          setToolColor={setToolColor}
          toolOpacity={toolOpacity}
          setToolOpacity={setToolOpacity}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col shrink-0 overflow-hidden">
          <AnnotationsList
            annotations={annotations}
            selectedId={selectedAnnotation?.id}
            onSelect={(id) => setSelectedAnnotation(annotations.find(a => a.id === id) || null)}
            onDelete={handleDeleteAnnotation}
          />
          {selectedAnnotation && (
            <>
              <div className="border-t border-gray-100">
                <PropertiesPanel
                  annotation={selectedAnnotation}
                  onUpdate={(updates) => handleUpdateAnnotation(selectedAnnotation.id, updates)}
                />
              </div>
              <div className="border-t border-gray-100 flex-1 overflow-hidden">
                <CommentThread
                  comments={comments.filter(c => c.annotationId === selectedAnnotation.id)}
                  onAddComment={handleAddComment}
                  onResolve={handleResolveComment}
                  onDelete={handleDeleteComment}
                />
              </div>
            </>
          )}
        </aside>

        {/* PDF Canvas */}
        <main className="flex-1 relative overflow-auto bg-gray-200 p-4 md:p-8 flex justify-center">
          <PDFCanvas
            file={file}
            activeTool={activeTool}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            selectedAnnotation={selectedAnnotation}
            onSelectAnnotation={(ann) => {
              setSelectedAnnotation(ann);
              if (window.innerWidth < 768 && ann) setShowMobileProperties(true);
            }}
            toolColor={toolColor}
            toolOpacity={toolOpacity}
          />

          {/* Mobile floating toolbar */}
          <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[96%] max-w-sm">
            <Toolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              toolColor={toolColor}
              setToolColor={setToolColor}
              toolOpacity={toolOpacity}
              setToolOpacity={setToolOpacity}
              isMobile={true}
            />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Sheets */}
      <AnimatePresence>
        {showMobileList && (
          <MobileBottomSheet title={`Annotations (${annotations.length})`} onClose={() => setShowMobileList(false)}>
            <div className="h-[60vh] overflow-y-auto">
              <AnnotationsList
                annotations={annotations}
                selectedId={selectedAnnotation?.id}
                onSelect={(id) => {
                  setSelectedAnnotation(annotations.find(a => a.id === id) || null);
                  setShowMobileList(false);
                  setShowMobileProperties(true);
                }}
                onDelete={handleDeleteAnnotation}
                isMobile={true}
              />
            </div>
          </MobileBottomSheet>
        )}

        {showMobileProperties && selectedAnnotation && (
          <MobileBottomSheet title="Properties" onClose={() => setShowMobileProperties(false)}>
            <div className="overflow-y-auto max-h-[60vh]">
              <PropertiesPanel
                annotation={selectedAnnotation}
                onUpdate={(updates) => handleUpdateAnnotation(selectedAnnotation.id, updates)}
                isMobile={true}
              />
            </div>
          </MobileBottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
