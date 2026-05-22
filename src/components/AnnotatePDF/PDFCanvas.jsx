import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// ─── Annotation Overlay (moveable + resizable + editable) ────────────────────
function AnnotationOverlay({ ann, isSelected, onSelect, onUpdate, onDelete, canvasRect }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(null); // handle name
  const [editingText, setEditingText] = useState(false);
  const dragStart = useRef(null);
  const textRef = useRef(null);

  const MIN_W = 20, MIN_H = 14;

  // Start drag (move annotation)
  const handleMouseDown = (e) => {
    if (resizing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(ann);
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ax: ann.x, ay: ann.y };
  };

  // Resize handle mousedown
  const handleResizeDown = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(handle);
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ax: ann.x, ay: ann.y, aw: ann.w, ah: ann.h
    };
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const onMove = (e) => {
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      if (dragging) {
        const cw = canvasRect?.width || 800;
        const ch = canvasRect?.height || 1000;
        onUpdate({
          x: Math.max(0, Math.min(cw - ann.w, dragStart.current.ax + dx)),
          y: Math.max(0, Math.min(ch - ann.h, dragStart.current.ay + dy)),
        });
      } else if (resizing) {
        const { ax, ay, aw, ah } = dragStart.current;
        let nx = ax, ny = ay, nw = aw, nh = ah;
        if (resizing.includes('e')) nw = Math.max(MIN_W, aw + dx);
        if (resizing.includes('s')) nh = Math.max(MIN_H, ah + dy);
        if (resizing.includes('w')) { nx = ax + dx; nw = Math.max(MIN_W, aw - dx); }
        if (resizing.includes('n')) { ny = ay + dy; nh = Math.max(MIN_H, ah - dy); }
        onUpdate({ x: nx, y: ny, w: nw, h: nh });
      }
    };
    const onUp = () => { setDragging(false); setResizing(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, resizing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingText && textRef.current) textRef.current.focus();
  }, [editingText]);

  const handles = ['n','s','e','w','ne','nw','se','sw'];
  const getHandleStyle = (h) => {
    const base = { position:'absolute', width:8, height:8, background:'#6366f1', border:'2px solid white', borderRadius:2, zIndex:100 };
    const pos = {
      n:  { top:-4, left:'50%', transform:'translateX(-50%)', cursor:'n-resize' },
      s:  { bottom:-4, left:'50%', transform:'translateX(-50%)', cursor:'s-resize' },
      e:  { right:-4, top:'50%', transform:'translateY(-50%)', cursor:'e-resize' },
      w:  { left:-4, top:'50%', transform:'translateY(-50%)', cursor:'w-resize' },
      ne: { top:-4, right:-4, cursor:'ne-resize' },
      nw: { top:-4, left:-4, cursor:'nw-resize' },
      se: { bottom:-4, right:-4, cursor:'se-resize' },
      sw: { bottom:-4, left:-4, cursor:'sw-resize' },
    };
    return { ...base, ...pos[h] };
  };

  const isIcon = ['note','comment'].includes(ann.type);
  const isText = ann.type === 'text';
  const isComment = ann.type === 'comment';
  const fontSize = ann.fontSize || 13;
  const fontColor = ann.fontColor || ann.color || '#1e293b';

  const containerStyle = {
    position: 'absolute',
    left: ann.x, top: ann.y,
    width: isIcon ? 'auto' : ann.w,
    height: isIcon ? 'auto' : ann.h,
    cursor: dragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    zIndex: isSelected ? 50 : 20,
    outline: isSelected ? '2px solid #6366f1' : '2px solid transparent',
    outlineOffset: 1,
    borderRadius: ann.type === 'shape_circle' ? '50%' : 2,
    boxSizing: 'border-box',
    minWidth: isIcon ? 28 : undefined,
    minHeight: isIcon ? 28 : undefined,
  };

  return (
    <div style={containerStyle} onMouseDown={handleMouseDown} onDoubleClick={() => setEditingText(true)}>
      {/* Highlight */}
      {ann.type === 'highlight' && (
        <div style={{ width:'100%', height:'100%', background: ann.color, opacity: (ann.opacity||50)/100, borderRadius:2 }} />
      )}
      {/* Underline */}
      {ann.type === 'underline' && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, borderBottom: `2px solid ${ann.color}` }} />
      )}
      {/* Strikethrough */}
      {ann.type === 'strikethrough' && (
        <div style={{ position:'absolute', top:'50%', left:0, right:0, borderTop: `2px solid ${ann.color}` }} />
      )}
      {/* Squiggly */}
      {ann.type === 'squiggly' && (
        <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:8, overflow:'visible' }}>
          <path d={`M0,6 ${Array.from({length:Math.ceil(ann.w/6)},(_,i)=>`Q${i*6+3},0 ${i*6+6},6`).join(' ')}`} fill="none" stroke={ann.color} strokeWidth={2} />
        </svg>
      )}
      {/* Rect */}
      {ann.type === 'shape_rect' && (
        <div style={{ width:'100%', height:'100%', border:`2px solid ${ann.color}`, boxSizing:'border-box', borderRadius:2 }} />
      )}
      {/* Circle */}
      {ann.type === 'shape_circle' && (
        <div style={{ width:'100%', height:'100%', border:`2px solid ${ann.color}`, borderRadius:'50%', boxSizing:'border-box' }} />
      )}
      {/* Sticky Note */}
      {ann.type === 'note' && (
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:24, lineHeight:1 }}>📌</div>
          {(editingText || ann.content) && (
            <div style={{ position:'absolute', top:28, left:0, minWidth:180, background:'#fef9c3', border:'1px solid #eab308', borderRadius:6, padding:'6px 8px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', zIndex:200 }}>
              {editingText ? (
                <textarea
                  ref={textRef}
                  value={ann.content || ''}
                  onChange={e => onUpdate({ content: e.target.value })}
                  onBlur={() => setEditingText(false)}
                  placeholder="Add note..."
                  style={{ width:160, height:80, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:12, fontFamily:'inherit', color:'#78350f' }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              ) : (
                <p style={{ fontSize:12, color:'#78350f', margin:0, maxWidth:160, wordBreak:'break-word' }}>{ann.content}</p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Comment */}
      {isComment && (
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:24, lineHeight:1 }}>💬</div>
          {(editingText || ann.content) && (
            <div style={{ position:'absolute', top:28, left:0, minWidth:200, background:'white', border:'1px solid #6366f1', borderRadius:8, padding:'8px', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', zIndex:200 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#6366f1', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Comment</div>
              {editingText ? (
                <textarea
                  ref={textRef}
                  value={ann.content || ''}
                  onChange={e => onUpdate({ content: e.target.value })}
                  onBlur={() => setEditingText(false)}
                  placeholder="Write comment..."
                  style={{ width:'100%', minHeight:60, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:4, padding:'4px 6px', outline:'none', resize:'none', fontSize:12, fontFamily:'inherit', color:'#1e293b', boxSizing:'border-box' }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              ) : (
                <p style={{ fontSize:12, color:'#334155', margin:0, maxWidth:180, wordBreak:'break-word' }}>{ann.content}</p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Text Box */}
      {isText && !editingText && (
        <div style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.92)', border:`1.5px solid ${ann.color}`, padding:'3px 5px', fontSize, color: fontColor, overflow:'hidden', borderRadius:3, boxSizing:'border-box', fontWeight: ann.fontBold ? 700 : 400, fontStyle: ann.fontItalic ? 'italic' : 'normal' }}>
          {ann.content || <span style={{color:'#aaa',fontStyle:'italic',fontSize:11}}>Double-click to type...</span>}
        </div>
      )}
      {isText && editingText && (
        <textarea
          ref={textRef}
          value={ann.content || ''}
          onChange={e => onUpdate({ content: e.target.value })}
          onBlur={() => setEditingText(false)}
          placeholder="Type here..."
          style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.97)', border:`2px solid ${ann.color}`, padding:'3px 5px', fontSize, color: fontColor, resize:'none', outline:'none', boxSizing:'border-box', borderRadius:3, cursor:'text', fontFamily:'inherit', fontWeight: ann.fontBold ? 700 : 400, fontStyle: ann.fontItalic ? 'italic' : 'normal' }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        />
      )}

      {/* Resize handles (not for icons) */}
      {isSelected && !isIcon && handles.map(h => (
        <div key={h} style={getHandleStyle(h)} onMouseDown={e => handleResizeDown(e, h)} />
      ))}
    </div>
  );
}

// ─── Main PDFCanvas ──────────────────────────────────────────────────────────
export default function PDFCanvas({ file, activeTool, annotations, onAddAnnotation, onUpdateAnnotation, onDeleteAnnotation, selectedAnnotation, onSelectAnnotation, toolColor='#eab308', toolOpacity=50 }) {
  const canvasRef     = useRef(null);
  const drawCanvasRef = useRef(null);
  const containerRef  = useRef(null);
  const wrapperRef    = useRef(null);

  const [pdfDoc,      setPdfDoc]      = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages,    setNumPages]    = useState(0);
  const [canvasSize,  setCanvasSize]  = useState({ w: 0, h: 0 });

  // Creating state (drag to create)
  const [creating,    setCreating]    = useState(false);
  const [createStart, setCreateStart] = useState(null);
  const [createRect,  setCreateRect]  = useState(null);

  // Draw paths
  const drawPathsRef   = useRef([]);
  const [isDrawing,    setIsDrawing]   = useState(false);
  const [currentPath,  setCurrentPath] = useState([]);

  // ─── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!file) return;
    (async () => {
      try {
        const ab  = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) { console.error('PDF load error', err); }
    })();
  }, [file]);

  // ─── Render PDF page ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const vp1  = page.getViewport({ scale: 1 });
        const cw   = containerRef.current.clientWidth - 40;
        const sc   = Math.min(cw / vp1.width, 1.6);
        const vp   = page.getViewport({ scale: sc });
        const cvs  = canvasRef.current;
        cvs.width  = vp.width;
        cvs.height = vp.height;
        setCanvasSize({ w: vp.width, h: vp.height });
        if (drawCanvasRef.current) {
          drawCanvasRef.current.width  = vp.width;
          drawCanvasRef.current.height = vp.height;
        }
        await page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise;
        redrawPaths();
      } catch (err) { console.error('Render error', err); }
    })();
  }, [pdfDoc, currentPage]);

  // ─── Redraw freehand ──────────────────────────────────────────────────────
  const redrawPaths = useCallback(() => {
    const dc = drawCanvasRef.current;
    if (!dc) return;
    const ctx = dc.getContext('2d');
    ctx.clearRect(0, 0, dc.width, dc.height);
    for (const p of drawPathsRef.current) {
      if (p.page !== currentPage || p.points.length < 2) continue;
      ctx.beginPath();
      // ERASER FIX: use opaque color with destination-out, not transparent
      ctx.strokeStyle = p.eraser ? 'rgba(0,0,0,1)' : p.color;
      if (p.eraser) { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = p.size; }
      else { ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = p.size; }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.moveTo(p.points[0].x, p.points[0].y);
      for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x, p.points[i].y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [currentPage]);

  useEffect(() => { redrawPaths(); }, [currentPage]);

  // ─── Get canvas-local coords ──────────────────────────────────────────────
  const getXY = (e) => {
    const cvs  = canvasRef.current;
    if (!cvs) return { x: 0, y: 0 };
    const rect = cvs.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  };

  // ─── Pointer Down (on canvas bg) ──────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (activeTool === 'select') { onSelectAnnotation(null); return; }
    const { x, y } = getXY(e);

    if (activeTool === 'draw' || activeTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      return;
    }

    const dragTools = ['highlight','underline','strikethrough','squiggly','shape_rect','shape_circle'];
    if (dragTools.includes(activeTool)) {
      setCreating(true);
      setCreateStart({ x, y });
      setCreateRect({ x, y, w: 1, h: 1 });
      return;
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getXY(e);

    if (isDrawing) {
      setCurrentPath(prev => {
        const next = [...prev, { x, y }];
        // live draw on canvas
        const dc = drawCanvasRef.current;
        if (dc && next.length >= 2) {
          const ctx = dc.getContext('2d');
          const last = next[next.length - 2];
          if (activeTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = 20;
          } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = toolColor;
            ctx.lineWidth = 2;
          }
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        return next;
      });
      return;
    }

    if (creating && createStart) {
      const rx = Math.min(createStart.x, x);
      const ry = Math.min(createStart.y, y);
      const rw = Math.abs(x - createStart.x);
      const rh = Math.abs(y - createStart.y);
      setCreateRect({ x: rx, y: ry, w: rw, h: rh });

      // Live preview on draw canvas
      const dc = drawCanvasRef.current;
      if (!dc) return;
      const ctx = dc.getContext('2d');
      ctx.clearRect(0, 0, dc.width, dc.height);
      redrawPaths();

      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = toolColor;
      ctx.lineWidth = 1.5;

      if (activeTool === 'highlight') {
        ctx.globalAlpha = (toolOpacity / 100) * 0.7;
        ctx.fillStyle = toolColor;
        ctx.fillRect(rx, ry, rw || 1, Math.max(rh, 18));
        ctx.globalAlpha = 1;
      } else if (activeTool === 'underline') {
        const bottom = ry + Math.max(rh, 18);
        ctx.beginPath(); ctx.moveTo(rx, bottom); ctx.lineTo(rx + rw, bottom); ctx.stroke();
      } else if (activeTool === 'strikethrough') {
        const mid = ry + Math.max(rh, 18) / 2;
        ctx.beginPath(); ctx.moveTo(rx, mid); ctx.lineTo(rx + rw, mid); ctx.stroke();
      } else if (activeTool === 'shape_rect') {
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (activeTool === 'shape_circle') {
        ctx.beginPath();
        ctx.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleMouseUp = (e) => {
    const { x, y } = getXY(e);

    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        drawPathsRef.current = [...drawPathsRef.current, {
          page: currentPage, points: currentPath,
          color: toolColor, size: activeTool === 'eraser' ? 20 : 2,
          eraser: activeTool === 'eraser'
        }];
        redrawPaths();
        if (activeTool === 'draw') {
          onAddAnnotation({ type: 'draw', page: currentPage, x: 0, y: 0, w: 0, h: 0, color: toolColor, content: 'Freehand drawing', _canvasW: canvasSize.w, _canvasH: canvasSize.h });
        }
      }
      setCurrentPath([]);
      return;
    }

    if (creating && createStart) {
      setCreating(false);
      const rx = Math.min(createStart.x, x);
      const ry = Math.min(createStart.y, y);
      let rw = Math.abs(x - createStart.x);
      let rh = Math.abs(y - createStart.y);

      // minimums
      const defaults = { highlight: [100,18], underline:[100,18], strikethrough:[100,18], squiggly:[100,18], shape_rect:[80,60], shape_circle:[80,60] };
      const [dw, dh] = defaults[activeTool] || [80,40];
      if (rw < 10) rw = dw;
      if (rh < 10) rh = dh;

      const labels = { highlight:'Highlighted text', underline:'Underlined text', strikethrough:'Strikethrough text', squiggly:'Squiggly underline', shape_rect:'Rectangle', shape_circle:'Circle' };
      onAddAnnotation({ type: activeTool, page: currentPage, x: rx, y: ry, w: rw, h: rh, color: toolColor, opacity: toolOpacity, content: labels[activeTool] || activeTool, _canvasW: canvasSize.w, _canvasH: canvasSize.h });

      setCreateStart(null);
      setCreateRect(null);
      redrawPaths();
      return;
    }
  };

  // Click for point-placement tools (note, text, comment)
  const handleClick = (e) => {
    if (['select','draw','eraser','highlight','underline','strikethrough','squiggly','shape_rect','shape_circle'].includes(activeTool)) return;
    const { x, y } = getXY(e);
    const configs = {
      note:    { w: 28, h: 28, content: '' },
      text:    { w: 180, h: 60, content: '', fontSize: 13, fontColor: '#1e293b' },
      comment: { w: 28, h: 28, content: '' },
    };
    const cfg = configs[activeTool];
    if (cfg) onAddAnnotation({ type: activeTool, page: currentPage, x, y, ...cfg, color: toolColor, opacity: toolOpacity, _canvasW: canvasSize.w, _canvasH: canvasSize.h });
  };

  const cursorMap = { select:'default', highlight:'crosshair', underline:'crosshair', strikethrough:'crosshair', squiggly:'crosshair', note:'crosshair', text:'text', comment:'crosshair', shape_rect:'crosshair', shape_circle:'crosshair', draw:'crosshair', eraser:'cell' };
  const cursor = cursorMap[activeTool] || 'default';

  const canvasRect = canvasRef.current ? { width: canvasSize.w, height: canvasSize.h } : null;

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      {/* Page nav */}
      <div className="bg-white px-5 py-2 rounded-full shadow-md mb-4 flex items-center gap-4 sticky top-4 z-10">
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 disabled:opacity-30 text-xl font-bold">‹</button>
        <span className="text-sm font-semibold text-gray-700 min-w-[90px] text-center">Page {currentPage} / {numPages||1}</span>
        <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage===numPages||numPages===0} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 disabled:opacity-30 text-xl font-bold">›</button>
      </div>

      {/* Canvas wrapper */}
      <div
        ref={wrapperRef}
        className="relative bg-white shadow-2xl"
        style={{ width: canvasSize.w||'auto', minHeight:200, cursor, touchAction:'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={() => { if(creating||isDrawing) handleMouseUp({clientX:0,clientY:0}); }}
      >
        <canvas ref={canvasRef} style={{ display:'block' }} />
        <canvas ref={drawCanvasRef} style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} />

        {/* Annotations */}
        <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
          {annotations.filter(a => (a.page||1)===currentPage && a.type !== 'draw').map(ann => (
            <AnnotationOverlay
              key={ann.id}
              ann={ann}
              isSelected={selectedAnnotation?.id === ann.id}
              onSelect={onSelectAnnotation}
              onUpdate={(u) => onUpdateAnnotation(ann.id, u)}
              onDelete={() => onDeleteAnnotation(ann.id)}
              canvasRect={canvasRect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
