import React, { useState, useRef } from 'react';
import { EyeSlashIcon, DocumentArrowUpIcon, DocumentIcon, CheckCircleIcon, SparklesIcon, TrashIcon, AdjustmentsHorizontalIcon, PhoneIcon, EnvelopeIcon, IdentificationIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import UpgradeModal from '../components/UpgradeModal';
import { processWithQueue } from '../utils/queueApi';
import { ArrowPathIcon, ExclamationCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

export default function RedactPDFPage() {
  const { isPro } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [resultFile, setResultFile] = useState(null);
  const [redactCount, setRedactCount] = useState(0);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Redact Options
  const [searchText, setSearchText] = useState('');
  const [redactCnic, setRedactCnic] = useState(false);
  const [redactEmail, setRedactEmail] = useState(false);
  const [redactPhone, setRedactPhone] = useState(false);
  
  const [color, setColor] = useState('black');
  const [overlayText, setOverlayText] = useState('');
  const [cleanMetadata, setCleanMetadata] = useState(true);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'redact',
    { searchText, redactCnic, redactEmail, redactPhone, color, overlayText, cleanMetadata },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setSearchText(s?.searchText || '');
      setRedactCnic(s?.redactCnic || false);
      setRedactEmail(s?.redactEmail || false);
      setRedactPhone(s?.redactPhone || false);
      setColor(s?.color || 'black');
      setOverlayText(s?.overlayText || '');
      setCleanMetadata(s?.cleanMetadata ?? true);
      setState('idle');
    },
    !!file && state !== 'processing'
  );
  // ─────────────────────────────────────────────────────────────────────────

  const MAX_FILE_SIZE = isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024;

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setErrorMsg('Please select a valid PDF file.');
      setState('error'); return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setIsUpgradeOpen(true); return;
    }
    setFile(selectedFile);
    setState('idle');
    setErrorMsg('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleProcess = async () => {
    if (!file) return;

    if (!searchText && !redactCnic && !redactEmail && !redactPhone) {
        setErrorMsg('Please select at least one redaction option (Search Text, CNIC, Email, or Phone).');
        setState('error'); return;
    }
    
    setState('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Redact PDF');
      
      formData.append('search_text', searchText);
      formData.append('redact_cnic', redactCnic.toString());
      formData.append('redact_email', redactEmail.toString());
      formData.append('redact_phone', redactPhone.toString());
      formData.append('color', color);
      formData.append('overlay_text', overlayText);
      formData.append('clean_metadata', cleanMetadata.toString());

      const data = await processWithQueue('/api/process', formData, null, true);

      if (!data || !data.base64) throw new Error('Received invalid data from server.');

      setRedactCount(parseInt(data.redactCount || 0, 10));

      const binaryString = window.atob(data.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const fileObj = { 
        name: file.name.replace(/\.pdf$/i, '_redacted.pdf'),
        url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })),
      };
      
      setResultFile(fileObj);
      setState('done');

      // Auto Download
      const a = document.createElement('a');
      a.href = fileObj.url;
      a.download = fileObj.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Redacted PDF downloaded!');

    } catch (err) {
      setErrorMsg(err.message || 'Failed to redact PDF. Please try again.');
      setState('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-slate-800 text-white rounded-2xl mb-4 shadow-lg">
          <EyeSlashIcon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Redact PDF</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Permanently remove visible text and hidden metadata. Safe, secure, and unrecoverable.
        </p>
      </div>

      {!file ? (
        <div
          className={clsx(
            "relative flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl transition-all duration-200 bg-white group cursor-pointer",
            isDragging 
              ? "border-slate-800 bg-slate-50 shadow-xl scale-[1.02]" 
              : "border-slate-200 hover:border-slate-800 hover:bg-slate-50 hover:shadow-lg"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} accept=".pdf" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
          <div className="w-20 h-20 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <DocumentArrowUpIcon className="w-10 h-10" />
          </div>
          <button type="button" className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl mb-4 transition-all shadow-lg shadow-slate-900/20">
            Select PDF File
          </button>
          <p className="text-slate-500">or drop PDF here</p>
        </div>
      ) : state === 'processing' ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-16 h-16 text-slate-800 animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Redacting Document...</h3>
          <p className="text-slate-500 max-w-md mx-auto">Searching for sensitive information and permanently scrubbing it from the document and metadata.</p>
        </div>
      ) : state === 'done' && resultFile ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircleIcon className="w-12 h-12" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <span className="font-bold text-sm">{redactCount}</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">Redaction Complete!</h3>
          <p className="text-slate-500 mb-8 text-lg">
            Successfully found and permanently redacted <strong className="text-slate-800">{redactCount}</strong> items from your document.
          </p>
          <div className="flex justify-center gap-4">
            <a href={resultFile.url} download={resultFile.name} className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-slate-900/30 flex items-center gap-2">
              <DocumentArrowUpIcon className="w-6 h-6 rotate-180" /> Download Redacted PDF
            </a>
            <button onClick={() => { setFile(null); setResultFile(null); setState('idle'); clearSession(); }} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl transition-all">
              Redact Another
            </button>
          </div>
        </div>
      ) : state === 'error' ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center">
          <ExclamationCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Redaction Failed</h3>
          <p className="text-red-500 mb-8 max-w-md mx-auto">{errorMsg}</p>
          <button onClick={() => setState('idle')} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl">Try Again</button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-3xl mx-auto">
          {/* File Header */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-slate-800">
              <DocumentIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 truncate">{file.name}</h4>
              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => { setFile(null); clearSession(); }} className="p-2 text-slate-400 hover:text-red-500"><ExclamationCircleIcon className="w-6 h-6 rotate-45" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Left Column: What to Redact */}
              <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-indigo-500" />
                        Smart Auto-Redaction
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Automatically find and permanently erase sensitive patterns.</p>
                    
                    <div className="space-y-3">
                        <label className={clsx("flex items-center p-4 border rounded-xl cursor-pointer transition-all", redactCnic ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300")}>
                            <input type="checkbox" className="w-5 h-5 text-slate-800 border-gray-300 rounded focus:ring-slate-800" checked={redactCnic} onChange={(e) => setRedactCnic(e.target.checked)} />
                            <IdentificationIcon className="w-6 h-6 text-slate-400 ml-4 mr-3" />
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">National IDs / SSNs</p>
                                <p className="text-xs text-slate-500">Aadhaar, NID, CNIC, SSN etc.</p>
                            </div>
                        </label>
                        
                        <label className={clsx("flex items-center p-4 border rounded-xl cursor-pointer transition-all", redactPhone ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300")}>
                            <input type="checkbox" className="w-5 h-5 text-slate-800 border-gray-300 rounded focus:ring-slate-800" checked={redactPhone} onChange={(e) => setRedactPhone(e.target.checked)} />
                            <PhoneIcon className="w-6 h-6 text-slate-400 ml-4 mr-3" />
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Phone Numbers</p>
                                <p className="text-xs text-slate-500">e.g. +1-234-567-8900, +44 20...</p>
                            </div>
                        </label>

                        <label className={clsx("flex items-center p-4 border rounded-xl cursor-pointer transition-all", redactEmail ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300")}>
                            <input type="checkbox" className="w-5 h-5 text-slate-800 border-gray-300 rounded focus:ring-slate-800" checked={redactEmail} onChange={(e) => setRedactEmail(e.target.checked)} />
                            <EnvelopeIcon className="w-6 h-6 text-slate-400 ml-4 mr-3" />
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Email Addresses</p>
                                <p className="text-xs text-slate-500">e.g. name@domain.com</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-orange-500" />
                        Specific Text Redaction
                    </h3>
                    <input 
                        type="text" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="e.g. Ahmed Khan, PK36SCBL000..." 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">Finds exact matches anywhere in the document and erases them.</p>
                </div>
              </div>

              {/* Right Column: Appearance & Settings */}
              <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />
                        Appearance
                    </h3>
                    
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Redaction Box Color</label>
                        <div className="flex gap-3">
                            {['black', 'white', 'red', 'blue'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={clsx(
                                        "w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center",
                                        color === c ? "border-blue-500 scale-110 shadow-md" : "border-slate-200 hover:scale-105",
                                        c === 'black' ? "bg-black" : c === 'white' ? "bg-white" : c === 'red' ? "bg-red-600" : "bg-blue-600"
                                    )}
                                >
                                    {color === c && <CheckCircleIcon className={clsx("w-6 h-6", c === 'white' ? "text-slate-800" : "text-white")} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Overlay Text (Optional)</label>
                        <input 
                            type="text" 
                            value={overlayText}
                            onChange={(e) => setOverlayText(e.target.value)}
                            placeholder="e.g. [REDACTED], [CLASSIFIED]" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-mono"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                        Deep Cleaning
                    </h3>
                    <label className={clsx("flex items-start p-4 border rounded-xl cursor-pointer transition-all", cleanMetadata ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300")}>
                        <input type="checkbox" className="w-5 h-5 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-600" checked={cleanMetadata} onChange={(e) => setCleanMetadata(e.target.checked)} />
                        <div className="ml-3">
                            <p className="font-semibold text-slate-800 text-sm">Wipe Document Metadata</p>
                            <p className="text-xs text-slate-500 mt-1">Removes hidden author info, creation dates, edit history, and software trails.</p>
                        </div>
                    </label>
                </div>
              </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 mb-6">
              <ExclamationCircleIcon className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                  <h4 className="font-semibold text-amber-900 text-sm">Permanent Action Warning</h4>
                  <p className="text-xs text-amber-700 mt-1">
                      Unlike simple drawing tools, this redaction is irreversible. The underlying text vectors are completely deleted from the PDF file. You will not be able to copy-paste or recover the hidden content.
                  </p>
              </div>
          </div>

          <button onClick={handleProcess} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-900/30 flex items-center justify-center gap-2 text-lg">
            <TrashIcon className="w-6 h-6" /> Apply Permanent Redactions
          </button>
        </div>
      )}

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Redact PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
