import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import { clsx } from 'clsx';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const POSITIONS = [
  { id: 'center', label: 'Center', icon: 'solar:align-center-bold' },
  { id: 'top-center', label: 'Top', icon: 'solar:align-top-bold' },
  { id: 'bottom-center', label: 'Bottom', icon: 'solar:align-bottom-bold' },
  { id: 'top-left', label: 'Top Left', icon: 'solar:align-left-bold' },
  { id: 'top-right', label: 'Top Right', icon: 'solar:align-right-bold' },
  { id: 'bottom-left', label: 'Bottom Left', icon: 'solar:align-left-bold' },
  { id: 'bottom-right', label: 'Bottom Right', icon: 'solar:align-right-bold' },
];

const COLORS = [
  { id: 'black', value: '#000000', label: 'Black' },
  { id: 'red', value: '#EF4444', label: 'Red' },
  { id: 'blue', value: '#3B82F6', label: 'Blue' },
  { id: 'green', value: '#10B981', label: 'Green' },
  { id: 'yellow', value: '#F59E0B', label: 'Yellow' },
  { id: 'white', value: '#FFFFFF', label: 'White' },
];

export default function AddTextPage({ lang = 'en', ui, toolData }) {
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('idle'); // idle | selected | processing | done | error
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('TheyLovePDF.com');
  const [fontSize, setFontSize] = useState(30);
  const [opacity, setOpacity] = useState(1);
  const [position, setPosition] = useState('center');
  const [color, setColor] = useState('#000000');
  
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'add_text',
    { text, fontSize, opacity, position, color },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setText(s?.text || 'TheyLovePDF.com');
      setFontSize(s?.fontSize || 30);
      setOpacity(s?.opacity || 1);
      setPosition(s?.position || 'center');
      setColor(s?.color || '#000000');
      setState('selected');
    },
    state === 'selected' || state === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg((ui?.tools_common?.invalid_pdf || 'Please upload a valid PDF file.'));
      setState('error');
      return;
    }
    if (f.size > (isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(f);
    setState('selected');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setState('idle');
    setProgress(0);
    setResult(null);
    setErrorMsg('');
    clearSession();
  };

  const handleProcess = async () => {
    if (!file || !text) return;
    setState('processing');
    setProgress(0);

    let currentProgress = 0;
    progressRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) currentProgress = 90;
      setProgress(currentProgress);
    }, 300);

    try {
      const worker = new Worker(new URL('../workers/pdfWorker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        if (e.data.success) {
          clearInterval(progressRef.current);
          setProgress(100);
          const blob = e.data.blob;
          
          setTimeout(() => {
            setResult({
              bytes: blob,
              originalSize: file.size,
              compressedSize: blob.size,
              message: 'Text successfully added to PDF.'
            });
            setState('done');
            worker.terminate();
          }, 600);
        } else if (e.data.type === 'progress') {
           // We are handling progress manually in AddText for simplicity, but worker also reports it.
        } else {
          clearInterval(progressRef.current);
          setErrorMsg(e.data.error || 'Worker failed');
          setState('error');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        clearInterval(progressRef.current);
        setErrorMsg('Worker error: ' + err.message);
        setState('error');
        worker.terminate();
      };

      worker.postMessage({
        tool: 'Add Text',
        files: [file],
        options: { text, fontSize, opacity, position, color }
      });
    } catch (err) {
      clearInterval(progressRef.current);
      setErrorMsg(err.message || 'An error occurred.');
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!result?.bytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    saveAs(result.bytes, `${baseName}_modified.pdf`);
    toast.success('Text added — PDF downloaded!');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pt-4 pb-8 animate-in fade-in duration-500">
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/20 mb-2">
          <iconify-icon icon="solar:pen-new-square-bold" class="text-3xl"></iconify-icon>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{toolData?.title || 'Add Text to PDF'}</h1>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto">
          Add custom text overlays, captions or annotations to your PDF pages easily.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">
        {state === 'idle' && (
          <div
            className={clsx(
              "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] transition-all duration-300",
              isDragging ? "border-yellow-500 bg-yellow-50/50 scale-[0.99]" : "border-gray-200 hover:border-yellow-400 hover:bg-gray-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 mb-4">
              <iconify-icon icon="solar:file-text-linear" class="text-3xl"></iconify-icon>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select PDF file</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
              Drag and drop your PDF here to add text.
            </p>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileSelect(e.target.files[0])} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <iconify-icon icon="solar:folder-open-bold" class="text-lg"></iconify-icon>
              Choose PDF File
            </button>
          </div>
        )}

        {state === 'selected' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: File & Preview */}
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-yellow-600/10 text-yellow-600 flex items-center justify-center shrink-0">
                    <iconify-icon icon="solar:file-text-bold" class="text-2xl"></iconify-icon>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                </button>
              </div>

              <div className="bg-gray-100 rounded-3xl aspect-[3/4] flex items-center justify-center border border-gray-200 relative overflow-hidden group">
                {/* Mock Preview */}
                <div className="w-[80%] h-[80%] bg-white shadow-lg rounded-sm p-8 flex flex-col gap-4 relative">
                   <div className="h-4 w-full bg-gray-100 rounded"></div>
                   <div className="h-4 w-[90%] bg-gray-100 rounded"></div>
                   <div className="h-4 w-full bg-gray-100 rounded"></div>
                   <div className="h-4 w-[60%] bg-gray-100 rounded"></div>
                   
                   {/* Dynamic Text Overlay Mock */}
                   <div 
                    className={clsx(
                      "absolute inset-0 p-8 flex transition-all duration-300 pointer-events-none",
                      position === 'center' && 'items-center justify-center',
                      position === 'top-center' && 'items-start justify-center',
                      position === 'bottom-center' && 'items-end justify-center',
                      position === 'top-left' && 'items-start justify-start',
                      position === 'top-right' && 'items-start justify-end',
                      position === 'bottom-left' && 'items-end justify-start',
                      position === 'bottom-right' && 'items-end justify-end',
                    )}
                   >
                     <span 
                      style={{ 
                        color: color, 
                        fontSize: `${fontSize / 2}px`, 
                        opacity: opacity,
                        fontWeight: 'bold'
                      }}
                      className="max-w-full break-words"
                     >
                       {text || 'Enter text...'}
                     </span>
                   </div>
                </div>
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                   Preview
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 block">Text to Add</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all outline-none resize-none font-medium text-gray-900"
                  placeholder="Type your text here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 block">Font Size ({fontSize}px)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-yellow-500"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 block">Opacity ({Math.round(opacity * 100)}%)</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-yellow-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 block">Text Color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c.value)}
                      className={clsx(
                        "w-10 h-10 rounded-xl border-2 transition-all shadow-sm",
                        color === c.value ? "border-yellow-500 scale-110" : "border-gray-100"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-100 cursor-pointer overflow-hidden p-0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 block">Position</label>
                <div className="grid grid-cols-4 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        position === p.id 
                          ? "border-yellow-500 bg-yellow-50 text-yellow-600" 
                          : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                      )}
                    >
                      <iconify-icon icon={p.icon} class="text-xl"></iconify-icon>
                      <span className="text-[10px] font-bold mt-1 uppercase tracking-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProcess}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
              >
                <iconify-icon icon="solar:magic-stick-3-bold" class="text-2xl"></iconify-icon>
                Add Text to PDF
              </button>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="py-20 flex flex-col items-center animate-in fade-in duration-500">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-100"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-yellow-600 font-bold text-xl">
                {Math.round(progress)}%
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Adding text...</h3>
            <p className="text-sm text-gray-500">Please wait, modifying your document.</p>
          </div>
        )}

        {state === 'done' && (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
              <iconify-icon icon="solar:check-circle-bold" class="text-4xl"></iconify-icon>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Process Completed!</h3>
            <p className="text-gray-500 mb-10 max-w-md">
              {result?.message} You can now download your modified file.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={handleDownload}
                className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <iconify-icon icon="solar:download-bold" class="text-2xl"></iconify-icon>
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <iconify-icon icon="solar:restart-bold" class="text-xl"></iconify-icon>
                Start Over
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="py-20 flex flex-col items-center text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <iconify-icon icon="solar:danger-bold" class="text-4xl"></iconify-icon>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h3>
            <p className="text-gray-500 mb-8 max-w-sm">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Add Text to PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
