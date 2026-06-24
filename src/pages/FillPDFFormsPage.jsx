import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFSignature } from 'pdf-lib';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';
import UpgradeModal from '../components/UpgradeModal';
import clsx from 'clsx';

// Example profile for Smart Auto-Fill
const MOCK_PROFILE = {
  full_name: 'Ahmed Khan',
  name: 'Ahmed Khan',
  email: 'ahmed@gmail.com',
  email_address: 'ahmed@gmail.com',
  phone: '0312-9876543',
  mobile: '0312-9876543',
  cnic: '12345-6789012-3',
  dob: '15/03/1990',
  date_of_birth: '15/03/1990',
  city: 'Peshawar'
};

export default function FillPDFFormsPage({ lang = 'en', ui, toolData }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  
  // pdf-lib form
  const [pdfForm, setPdfForm] = useState(null);
  // pdfjs for rendering
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [viewport, setViewport] = useState(null);
  
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [step, setStep] = useState('UPLOAD'); // UPLOAD, FILL, SUCCESS
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Pro checks
  const { isPro } = useAuth();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Resize listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      setStep('PROCESSING');
      
      setTimeout(async () => {
        try {
        // Load with pdf-lib to extract form fields
        const pdfDocLib = await PDFDocument.load(bytes);
        const form = pdfDocLib.getForm();
        setPdfForm(form);

        // Build a page-ref → 1-based pageIndex lookup
        const pdfPages = pdfDocLib.getPages();
        const pageRefMap = new Map();
        pdfPages.forEach((page, idx) => {
          const ref = page.ref;
          pageRefMap.set(`${ref.objectNumber}_${ref.generationNumber}`, idx + 1);
        });

        const rawFields = form.getFields();
        const extractedFields = rawFields.map((f) => {
          const type =
            f instanceof PDFTextField ? 'text' :
            f instanceof PDFCheckBox ? 'checkbox' :
            f instanceof PDFRadioGroup ? 'radio' :
            f instanceof PDFDropdown ? 'dropdown' :
            f instanceof PDFSignature ? 'signature' : 'unknown';

          const widgets = f.acroField.getWidgets();
          let rect = { x: 0, y: 0, width: 0, height: 0, pageIndex: 1 };

          if (widgets && widgets.length > 0) {
            const widget = widgets[0];
            const r = widget.getRectangle();
            // Determine which page this widget is on
            let detectedPage = 1;
            try {
              const pageRef = widget.P();
              if (pageRef) {
                const key = `${pageRef.objectNumber}_${pageRef.generationNumber}`;
                detectedPage = pageRefMap.get(key) ?? 1;
              }
            } catch (_) {}
            rect = { x: r.x, y: r.y, width: r.width, height: r.height, pageIndex: detectedPage };
          }

          let options = [];
          if (type === 'dropdown' || type === 'radio') {
            try { options = f.getOptions(); } catch (_) {}
          }

          return {
            id: f.getName(),
            name: f.getName(),
            type,
            required: f.isRequired(),
            rect,
            options,
            value: type === 'checkbox' ? f.isChecked() : (type === 'text' || type === 'dropdown' ? f.getText() : null)
          };
        });

        setFields(extractedFields.filter(f => f.type !== 'unknown'));
        
        // Load with pdfjs for rendering
        const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        
        setStep('FILL');
      } catch (err) {
        console.error(err);
        toast.error("Error reading PDF form. Ensure it is a valid AcroForm PDF.");
        setStep('UPLOAD');
      }
    }, 50);
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
      setViewport(viewport);
      
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
    if (step === 'FILL') {
      renderPage();
    }
  }, [renderPage, step]);

  const handleFieldChange = (name, val) => {
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleAutoFill = () => {
    const newData = { ...formData };
    fields.forEach(f => {
      const match = Object.keys(MOCK_PROFILE).find(key => f.name.toLowerCase().includes(key));
      if (match) {
        newData[f.name] = MOCK_PROFILE[match];
      }
    });
    setFormData(newData);
    toast.success('Fields auto-filled successfully!');
  };

  const processAndDownload = async () => {
    try {
      const pdfDocLib = await PDFDocument.load(fileBytes);
      const form = pdfDocLib.getForm();
      
      fields.forEach(f => {
        const field = form.getField(f.name);
        if (!field) return;
        const val = formData[f.name];
        if (val === undefined || val === null) return;
        
        if (f.type === 'text') {
          field.setText(val.toString());
        } else if (f.type === 'checkbox') {
          if (val) field.check(); else field.uncheck();
        } else if (f.type === 'dropdown' || f.type === 'radio') {
          try { field.select(val); } catch(e){}
        }
      });
      
      // Flatten
      form.flatten();
      
      const newPdfBytes = await pdfDocLib.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Form saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save filled form.');
    }
  };

  const getOverlayStyle = (rect) => {
    if (!viewport) return {};
    const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([rect.x, rect.y, rect.x + rect.width, rect.y + rect.height]);
    return {
      position: 'absolute',
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };
  };

  // ── UI Render ─────────────────────────────────────────────────────────────

  if (step === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-gray-100">
           <div className="w-20 h-20 mb-6 rounded-full border-4 border-gray-100 border-t-indigo-600 animate-spin"></div>
           <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Reading Form...</h2>
           <p className="text-gray-500 text-sm">We are detecting fields in your PDF.</p>
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
              <iconify-icon icon="solar:checklist-minimalistic-linear" class="text-indigo-600"></iconify-icon> Fill PDF Forms
            </h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <iconify-icon icon="solar:checklist-minimalistic-bold-duotone" class="text-5xl"></iconify-icon>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">{toolData?.title || 'Fill PDF Forms'}</h1>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">Fill interactive AcroForm PDF documents online. Fast, secure, and precise.</p>
            
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

  // DESKTOP
  if (!isMobile) {
    return (
      <div className="h-screen flex flex-col bg-[#f3f4f6] overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <iconify-icon icon="solar:home-smile-linear" class="text-xl"></iconify-icon>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <h1 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <iconify-icon icon="solar:checklist-minimalistic-linear" class="text-indigo-600"></iconify-icon> Fill PDF Form
            </h1>
          </div>
          <button onClick={processAndDownload} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all">
            <iconify-icon icon="solar:diskette-linear"></iconify-icon> Save Filled PDF
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-sm overflow-y-auto">
             <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Detected Fields ({fields.length})</h3>
                  
                  <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-indigo-900">Progress</span>
                       <span className="text-xs font-bold text-indigo-700">{Object.keys(formData).length} / {fields.length}</span>
                    </div>
                    <div className="w-full bg-indigo-200/50 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{width: `${fields.length ? (Object.keys(formData).length/fields.length)*100 : 0}%`}}></div>
                    </div>
                  </div>

                  <button onClick={handleAutoFill} className="w-full mb-4 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 font-bold text-sm py-2 rounded-xl transition-all flex items-center justify-center gap-2">
                    <iconify-icon icon="solar:magic-stick-3-linear"></iconify-icon> Smart Auto-Fill
                  </button>

                  <div className="space-y-2">
                    {fields.map(f => {
                      const isFilled = formData[f.name] !== undefined && formData[f.name] !== '' && formData[f.name] !== false;
                      return (
                        <button 
                          key={f.id} 
                          onClick={() => { setSelectedField(f); setCurrentPage(f.rect.pageIndex || 1); }}
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between",
                            selectedField?.id === f.id ? "bg-indigo-50 text-indigo-700 font-bold border-indigo-200" : "hover:bg-gray-50 text-gray-700 font-medium border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                             {isFilled ? <iconify-icon icon="solar:check-circle-bold" class="text-emerald-500"></iconify-icon> : <iconify-icon icon="solar:record-circle-linear" class="text-gray-300"></iconify-icon>}
                             <span className="truncate">{f.name}</span>
                          </div>
                          {f.required && !isFilled && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold ml-2 shrink-0">REQ</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>

          {/* Center Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 relative">
            <div className="min-h-full flex flex-col items-center justify-start py-8 px-8 pb-24">
              <div className="relative shadow-2xl bg-white rounded overflow-hidden select-none">
                 <canvas ref={canvasRef} className="block"></canvas>
                 
                 {/* Visual Overlay — only current page fields */}
                 {viewport && fields.filter(f => f.rect.pageIndex === currentPage).map(f => {
                   const style = getOverlayStyle(f.rect);
                   const isSelected = selectedField?.id === f.id;
                   
                   return (
                     <div 
                       key={f.id} 
                       style={style} 
                       className={clsx(
                         "absolute bg-indigo-500/20 border-2 transition-colors",
                         isSelected ? "border-indigo-500 z-10" : "border-transparent hover:border-indigo-300"
                       )}
                       onClick={() => setSelectedField(f)}
                     >
                       {f.type === 'text' && (
                         <input 
                           type="text" 
                           value={formData[f.name] || ''} 
                           onChange={e => handleFieldChange(f.name, e.target.value)}
                           className="w-full h-full bg-transparent border-none p-1 outline-none text-sm font-semibold text-indigo-900" 
                           placeholder={f.name}
                         />
                       )}
                       {f.type === 'checkbox' && (
                         <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleFieldChange(f.name, !formData[f.name])}>
                           {formData[f.name] && <iconify-icon icon="solar:check-read-bold" class="text-indigo-600 text-xl"></iconify-icon>}
                         </div>
                       )}
                       {f.type === 'radio' && (
                         <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleFieldChange(f.name, true)}>
                           {formData[f.name] && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                         </div>
                       )}
                       {f.type === 'dropdown' && (
                         <select 
                           value={formData[f.name] || ''} 
                           onChange={e => handleFieldChange(f.name, e.target.value)}
                           className="w-full h-full bg-transparent border-none p-1 outline-none text-sm font-semibold text-indigo-900 cursor-pointer"
                         >
                           <option value=""></option>
                           {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                       )}
                     </div>
                   );
                 })}
              </div>

              {/* Page Navigation */}
              {numPages > 1 && (
                <div className="flex items-center gap-4 mt-4 bg-gray-900/85 backdrop-blur-md px-5 py-2.5 rounded-full text-white shadow-xl self-center">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="hover:text-indigo-300 disabled:opacity-30 transition-colors">
                    <iconify-icon icon="solar:alt-arrow-left-linear" class="text-xl"></iconify-icon>
                  </button>
                  <span className="text-sm font-bold w-28 text-center">Page {currentPage} of {numPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="hover:text-indigo-300 disabled:opacity-30 transition-colors">
                    <iconify-icon icon="solar:alt-arrow-right-linear" class="text-xl"></iconify-icon>
                  </button>
                </div>
              )}
            </div>

            {/* Empty State / No Fields Detected */}
            {fields.length === 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <iconify-icon icon="solar:shield-warning-bold" class="text-3xl"></iconify-icon>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Interactive Fields Found</h3>
                <p className="text-sm text-gray-600 max-w-sm mb-6">
                  This PDF is a flat document and does not contain any fillable AcroForm fields. 
                </p>
                <Link to="/tools/edit-pdf" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2">
                  <iconify-icon icon="solar:pen-new-square-linear"></iconify-icon> Use Edit PDF Tool Instead
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MOBILE LAYOUT
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <header className="h-14 bg-white flex items-center px-4 justify-between shrink-0 shadow-sm sticky top-0 z-50">
        <Link to="/" className="text-gray-500"><iconify-icon icon="solar:alt-arrow-left-linear" class="text-2xl"></iconify-icon></Link>
        <span className="font-bold text-gray-800 text-sm">Fill Form</span>
        <button onClick={processAndDownload} className="text-indigo-600 font-bold text-sm">Save</button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center pb-24 relative">
         <div className="relative shadow-xl bg-white rounded overflow-hidden select-none">
           <canvas ref={canvasRef} className="block w-full"></canvas>
           {/* Visual Overlay — only current page fields */}
           {viewport && fields.filter(f => f.rect.pageIndex === currentPage).map(f => {
             const style = getOverlayStyle(f.rect);
             const isSelected = selectedField?.id === f.id;
             
             return (
               <div 
                 key={f.id} 
                 style={style} 
                 className={clsx(
                   "absolute bg-indigo-500/20 border-2 transition-colors",
                   isSelected ? "border-indigo-500 z-10" : "border-transparent"
                 )}
                 onClick={() => setSelectedField(f)}
               >
                 {f.type === 'text' && (
                   <input 
                     type="text" 
                     value={formData[f.name] || ''} 
                     onChange={e => handleFieldChange(f.name, e.target.value)}
                     className="w-full h-full bg-transparent border-none p-1 outline-none text-sm font-semibold text-indigo-900" 
                     placeholder={f.name}
                   />
                 )}
                 {f.type === 'checkbox' && (
                   <div className="w-full h-full flex items-center justify-center" onClick={() => handleFieldChange(f.name, !formData[f.name])}>
                     {formData[f.name] && <iconify-icon icon="solar:check-read-bold" class="text-indigo-600 text-xl"></iconify-icon>}
                   </div>
                 )}
                 {f.type === 'radio' && (
                   <div className="w-full h-full flex items-center justify-center" onClick={() => handleFieldChange(f.name, true)}>
                     {formData[f.name] && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                   </div>
                 )}
                 {f.type === 'dropdown' && (
                   <select 
                     value={formData[f.name] || ''} 
                     onChange={e => handleFieldChange(f.name, e.target.value)}
                     className="w-full h-full bg-transparent border-none p-1 outline-none text-sm font-semibold text-indigo-900"
                   >
                     <option value=""></option>
                     {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>
                 )}
               </div>
             );
           })}
         </div>

         {/* Mobile Empty State */}
         {fields.length === 0 && (
           <div className="absolute inset-x-4 top-20 bg-white shadow-2xl rounded-2xl p-6 text-center z-50 border border-gray-100">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <iconify-icon icon="solar:shield-warning-bold" class="text-2xl"></iconify-icon>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Not a Fillable Form</h3>
              <p className="text-xs text-gray-500 mb-5">This document doesn't have interactive fields.</p>
              <Link to="/tools/edit-pdf" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl block hover:bg-indigo-700 transition-colors">
                Open in Edit PDF
              </Link>
           </div>
         )}
      </main>

       {/* Mobile Page Navigation */}
       {numPages > 1 && (
         <div className="flex items-center justify-center gap-4 mt-4 mb-2">
           <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center disabled:opacity-30">
             <iconify-icon icon="solar:alt-arrow-left-linear" class="text-xl text-gray-700"></iconify-icon>
           </button>
           <span className="text-sm font-bold text-gray-700">Page {currentPage} of {numPages}</span>
           <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center disabled:opacity-30">
             <iconify-icon icon="solar:alt-arrow-right-linear" class="text-xl text-gray-700"></iconify-icon>
           </button>
         </div>
       )}

      {/* Mobile Auto Fill floating button */}
      {fields.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button onClick={handleAutoFill} className="bg-gray-900 text-white font-bold text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <iconify-icon icon="solar:magic-stick-3-bold" class="text-yellow-400 text-lg"></iconify-icon> Auto-Fill
          </button>
        </div>
      )}
    </div>
  );
}
