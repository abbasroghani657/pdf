import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export default function PDFViewer({ file, currentPage, setCurrentPage, highlightText }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);

  // Load PDF
  useEffect(() => {
    if (!file) return;
    (async () => {
      try {
        const ab = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('PDF load error', err);
      }
    })();
  }, [file, setCurrentPage]);

  // Render Page
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    
    let isMounted = true;

    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        let cw = containerRef.current.clientWidth;
        if (cw < 100) cw = window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth;
        const vp1 = page.getViewport({ scale: 1 });
        const scale = Math.min(Math.max((cw - 40) / vp1.width, 0.5), 1.5);
        const vp = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.transform = 'scale(1)'; 
        
        const ctx = canvas.getContext('2d');
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Cancel previous render task if still running
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (_) {}
        }
        
        const renderContext = { canvasContext: ctx, viewport: vp };
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        
        // Simple highlight overlay simulation
        if (highlightText && isMounted) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
          ctx.fillRect(vp.width * 0.1, vp.height * 0.3, vp.width * 0.8, 40);
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Render error', err);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
      }
    };
  }, [pdfDoc, currentPage, highlightText]);

  return (
    <div className="flex flex-col h-full bg-gray-100/50 relative" ref={containerRef}>
      {/* Top Nav */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <h3 className="font-semibold text-gray-800 text-sm truncate max-w-[150px] md:max-w-xs">{file?.name}</h3>
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          <span className="text-xs font-semibold text-gray-600 min-w-[50px] text-center">
            {currentPage} / {numPages || 1}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start custom-scrollbar">
        <div className="relative bg-white shadow-lg rounded-sm transition-all">
          <canvas ref={canvasRef} className="block rounded-sm" />
          {highlightText && (
            <div className="absolute inset-0 border-4 border-yellow-400/50 rounded-sm pointer-events-none transition-all duration-500 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
