import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef } from 'react';
import { ShieldCheckIcon, DocumentArrowUpIcon, DocumentIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import UpgradeModal from '../components/UpgradeModal';
import { ExclamationCircleIcon, ArrowPathIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';
import { processWithQueue } from '../utils/queueApi';

export default function ProtectPDFPage({ lang = 'en' }) {
  const { isPro } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState('idle'); // idle, processing, done, error
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [resultFile, setResultFile] = useState(null);
  const fileInputRef = useRef(null);

  // Form State
  const [openPassword, setOpenPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOpenPassword, setShowOpenPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [encryptionLevel, setEncryptionLevel] = useState('aes_256');
  
  // Permissions
  const [allowPrint, setAllowPrint] = useState(false);
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowModify, setAllowModify] = useState(false);
  const [allowAnnotate, setAllowAnnotate] = useState(false);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'protect',
    { encryptionLevel, allowPrint, allowCopy, allowModify, allowAnnotate },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setEncryptionLevel(s?.encryptionLevel || 'aes_256');
      setAllowPrint(s?.allowPrint || false);
      setAllowCopy(s?.allowCopy || false);
      setAllowModify(s?.allowModify || false);
      setAllowAnnotate(s?.allowAnnotate || false);
      setState('idle');
    },
    !!file
  );
  // ─────────────────────────────────────────────────────────────────────────

  const MAX_FILE_SIZE = isPro ? 2000 * 1024 * 1024 : 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setErrorMsg('Please select a valid PDF file.');
      setState('error');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(selectedFile);
    setState('idle');
    setErrorMsg('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    if (!openPassword && !ownerPassword && allowPrint && allowCopy && allowModify && allowAnnotate) {
        setErrorMsg('Please specify a password or restrict at least one permission.');
        setState('error');
        return;
    }
    
    if (openPassword && ownerPassword && openPassword === ownerPassword) {
        setErrorMsg('Open Password and Permissions Password must be different. If they are the same, anyone who opens the PDF will automatically bypass all permissions.');
        setState('error');
        return;
    }
    
    setState('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'Protect PDF');
      formData.append('open_password', openPassword);
      formData.append('owner_password', ownerPassword);
      formData.append('encryption_level', encryptionLevel);
      formData.append('allow_print', allowPrint);
      formData.append('allow_copy', allowCopy);
      formData.append('allow_modify', allowModify);
      formData.append('allow_annotate', allowAnnotate);

      const data = await processWithQueue(formData, (status) => {
        if (status === 'processing' && state !== 'processing') setState('processing');
      });
      
      if (!data.base64) {
        throw new Error('Received invalid data from server.');
      }

      const binaryString = window.atob(data.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const newSize = bytes.length;
      const baseName = file.name.replace(/\.pdf$/i, '');
      
      const fileObj = { 
        name: `${baseName}_protected.pdf`,
        url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })),
        originalSize: file.size,
        newSize: newSize,
        encryptionUsed: encryptionLevel === 'aes_256' ? 'AES 256-bit' : encryptionLevel === 'aes_128' ? 'AES 128-bit' : 'RC4'
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
      toast.success('Protected PDF downloaded!');

    } catch (err) {
      setErrorMsg(err.message || 'Protection failed. Please try again.');
      setState('error');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-2xl mb-4">
          <ShieldCheckIcon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Protect PDF</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Secure your PDF with a password and set advanced permissions to prevent unauthorized printing, copying, or editing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {!file ? (
            <div
              className={clsx(
                "relative flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-3xl transition-all duration-200 bg-white group cursor-pointer",
                isDragging 
                  ? "border-red-500 bg-red-50 shadow-xl scale-[1.02]" 
                  : "border-slate-200 hover:border-red-400 hover:bg-slate-50 hover:shadow-lg"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <DocumentArrowUpIcon className="w-10 h-10" />
              </div>
              <button 
                type="button"
                className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl mb-4 transition-all shadow-lg shadow-red-500/20"
              >
                Select PDF File
              </button>
              <p className="text-slate-500">or drop PDF here</p>
            </div>
          ) : state === 'processing' ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
              <ArrowPathIcon className="w-12 h-12 text-red-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Protecting Document...</h3>
              <p className="text-slate-500">Applying military-grade encryption</p>
            </div>
          ) : state === 'done' && resultFile ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-center">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Successfully Protected!</h3>
              <p className="text-slate-500 mb-8">Your PDF is now securely encrypted.</p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
                <div className="bg-slate-50 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]">
                    <span className="text-slate-500 mb-1">Encryption</span>
                    <span className="font-semibold text-slate-800">{resultFile.encryptionUsed}</span>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]">
                    <span className="text-slate-500 mb-1">Permissions</span>
                    <span className="font-semibold text-slate-800">{(!allowPrint && !allowCopy && !allowModify && !allowAnnotate) ? 'All Blocked' : 'Custom'}</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <a
                  href={resultFile.url}
                  download={resultFile.name}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-red-500/30 flex items-center gap-2"
                >
                  <DocumentArrowUpIcon className="w-5 h-5 rotate-180" />
                  Download Protected PDF
                </a>
                <button
                  onClick={() => { setFile(null); setResultFile(null); setState('idle'); setOpenPassword(''); setOwnerPassword(''); clearSession(); }}
                  className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                >
                  Protect Another
                </button>
              </div>
            </div>
          ) : state === 'error' ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center">
              <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Protection Failed</h3>
              <p className="text-red-500 mb-8">{errorMsg}</p>
              <button
                onClick={() => setState('idle')}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-red-500">
                  <DocumentIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{file.name}</h4>
                  <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <ExclamationCircleIcon className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {/* Password Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Open Password (Optional)</label>
                  <p className="text-xs text-slate-500 mb-3">Require a password to open and view the document.</p>
                  <div className="relative">
                    <input 
                      type={showOpenPassword ? "text" : "password"} 
                      placeholder="Enter password to open document..."
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      value={openPassword}
                      onChange={(e) => setOpenPassword(e.target.value)}
                    />
                    <LockClosedIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                    <button 
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowOpenPassword(!showOpenPassword)}
                    >
                      {showOpenPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Permissions Password (Optional)</label>
                  <p className="text-xs text-slate-500 mb-3">Require a password to bypass the restrictions below.</p>
                  <div className="relative">
                    <input 
                      type={showOwnerPassword ? "text" : "password"} 
                      placeholder="Enter permissions password..."
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                    />
                    <ShieldCheckIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                    <button 
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    >
                      {showOwnerPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 sticky top-6">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-red-500" />
              Protection Settings
            </h3>
            
            <div className="space-y-6">
              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Permissions</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-red-300 transition-colors">
                    <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-slate-300 focus:ring-red-500" />
                    <span className="text-sm text-slate-700">Allow Printing</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-red-300 transition-colors">
                    <input type="checkbox" checked={allowCopy} onChange={(e) => setAllowCopy(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-slate-300 focus:ring-red-500" />
                    <span className="text-sm text-slate-700">Allow Copying</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-red-300 transition-colors">
                    <input type="checkbox" checked={allowModify} onChange={(e) => setAllowModify(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-slate-300 focus:ring-red-500" />
                    <span className="text-sm text-slate-700">Allow Editing</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-red-300 transition-colors">
                    <input type="checkbox" checked={allowAnnotate} onChange={(e) => setAllowAnnotate(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-slate-300 focus:ring-red-500" />
                    <span className="text-sm text-slate-700">Allow Comments</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">Unchecked items will be blocked.</p>
              </div>

              {/* Encryption Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Encryption Level</label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm text-slate-700"
                  value={encryptionLevel}
                  onChange={(e) => setEncryptionLevel(e.target.value)}
                >
                  <option value="aes_256">AES 256-bit (Recommended)</option>
                  <option value="aes_128">AES 128-bit (Strong)</option>
                  <option value="rc4_128">RC4 128-bit (Legacy)</option>
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProcess}
                disabled={!file || state === 'processing'}
                className={clsx(
                  "w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                  !file || state === 'processing'
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
                )}
              >
                <LockClosedIcon className="w-5 h-5" />
                Protect PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="Protect PDF" 
        limitMessage="Files over 10MB require a Pro account. Upgrade to Pro for up to 1GB file uploads."
      />
    </div>
  );
}
