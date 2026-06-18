import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef } from 'react';
import { LockOpenIcon, DocumentArrowUpIcon, DocumentIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import UpgradeModal from '../components/UpgradeModal';
import { processWithQueue } from '../utils/queueApi';
import { ArrowPathIcon, ExclamationCircleIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

export default function UnlockPDFPage() {
  const { isPro } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [resultFile, setResultFile] = useState(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'unlock',
    {},
    file,
    ({ bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setState('idle');
    },
    !!file
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
    if (!password) {
        setErrorMsg('Please enter the password to unlock the document.');
        setState('error'); return;
    }
    
    setState('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Unlock PDF');
      formData.append('password', password);

      const data = await processWithQueue('/api/process', formData, null, true);

      if (!data || !data.base64) throw new Error('Received invalid data from server.');

      const binaryString = window.atob(data.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const fileObj = { 
        name: file.name.replace(/\.pdf$/i, '_unlocked.pdf'),
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
      toast.success('PDF unlocked and downloaded!');

    } catch (err) {
      setErrorMsg(err.message || 'Failed to unlock PDF. Please check the password.');
      setState('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
          <LockOpenIcon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Unlock PDF</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Remove passwords and restrictions from your protected PDF documents instantly.
        </p>
      </div>

      {!file ? (
        <div
          className={clsx(
            "relative flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl transition-all duration-200 bg-white group cursor-pointer",
            isDragging 
              ? "border-emerald-500 bg-emerald-50 shadow-xl scale-[1.02]" 
              : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50 hover:shadow-lg"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} accept=".pdf" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <DocumentArrowUpIcon className="w-10 h-10" />
          </div>
          <button 
            type="button"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl mb-4 transition-all shadow-lg shadow-emerald-500/20"
          >
            Select PDF File
          </button>
          <p className="text-slate-500">or drop PDF here</p>
        </div>
      ) : state === 'processing' ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <ArrowPathIcon className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Unlocking Document...</h3>
          <p className="text-slate-500">Decrypting and removing restrictions</p>
        </div>
      ) : state === 'done' && resultFile ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Successfully Unlocked!</h3>
          <p className="text-slate-500 mb-8">All passwords and restrictions have been removed.</p>
          <div className="flex justify-center gap-4">
            <a href={resultFile.url} download={resultFile.name} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2">
              <DocumentArrowUpIcon className="w-5 h-5 rotate-180" /> Download Unlocked PDF
            </a>
            <button onClick={() => { setFile(null); setResultFile(null); setState('idle'); setPassword(''); }} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all">
              Unlock Another
            </button>
          </div>
        </div>
      ) : state === 'error' ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Unlock Failed</h3>
          <p className="text-red-500 mb-8">{errorMsg}</p>
          <button onClick={() => setState('idle')} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl">Try Again</button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-500">
              <DocumentIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 truncate">{file.name}</h4>
              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500"><ExclamationCircleIcon className="w-6 h-6 rotate-45" /></button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Enter PDF Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter the password to unlock..."
                  className="w-full pl-11 pr-12 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                />
                <KeyIcon className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
                <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlashIcon className="w-6 h-6"/> : <EyeIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <button onClick={handleProcess} disabled={!password || state === 'processing'} className={clsx("w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-lg", !password || state === 'processing' ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30")}>
              <LockOpenIcon className="w-6 h-6" /> Unlock PDF
            </button>
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Unlock PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
