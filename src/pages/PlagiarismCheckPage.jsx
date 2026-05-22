import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft, FileText, Search, AlertTriangle, CheckCircle, 
  Settings, Download, RefreshCw, Layers, ShieldCheck, 
  Globe, BookOpen, Clock, FileBadge
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PlagiarismCheckPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Options, 3: Scanning, 4: Results
  const [progress, setProgress] = useState(0);
  const [mobileTab, setMobileTab] = useState('options'); // options, results
  const [result, setResult] = useState(null);
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Options state
  const [options, setOptions] = useState({
    webPages: true,
    academicDb: true,
    publications: true,
    myDocs: false,
    excludeQuotes: true,
    excludeRefs: true,
    excludeCommon: true,
    sensitivity: 'Medium'
  });

  const onDrop = useCallback((accepted) => { 
    if (accepted?.length > 0) {
      setFile(accepted[0]);
      setStep(2);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }, multiple: false });

  const extractText = async (f) => {
    if (f.name.endsWith('.txt')) return await f.text();
    const ab = await f.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    let fullText = '';
    for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      fullText += tc.items.map(it => it.str).join(' ') + '\n';
    }
    return fullText;
  };

  const startScan = async () => {
    setStep(3);
    setProgress(10);
    try {
      const text = await extractText(file);
      setProgress(40);
      
      const fetchPromise = fetch('/api/plagiarism-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, options })
      });
      
      let p = 40;
      const interval = setInterval(() => { p += Math.floor(Math.random() * 5); if (p < 95) setProgress(p); }, 800);

      const res = await fetchPromise;
      clearInterval(interval);
      setProgress(100);

      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('Scanning failed: ' + err.message);
      setStep(2);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStep(1);
    setProgress(0);
    setResult(null);
  };

  const handleHistory = () => {
    toast('History tracking is coming soon!', { icon: '🕒' });
  };

  const handleExport = async () => {
    if (!result || !result.analysis || !reportRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating professional PDF report...');
    
    try {
      reportRef.current.style.display = 'block';
      await new Promise(resolve => setTimeout(resolve, 100)); // wait for render
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5, // slightly faster than 2, still good quality
        useCORS: true,
        logging: false
      });
      
      reportRef.current.style.display = 'none';
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${file?.name.replace(/\.[^/.]+$/, "") || 'Document'}_Originality_Report.pdf`);
      toast.success('Report exported as PDF successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/40 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-200/40 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-3xl w-full text-center space-y-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 text-blue-700 font-extrabold text-[11px] tracking-wide mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Professional Plagiarism Scanner
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
              Check Plagiarism <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Instantly.</span>
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Compare your document against billions of web pages and academic databases. Ensure 100% originality for your thesis, articles, or reports.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-[24px] p-8 md:p-10 cursor-pointer bg-white/80 backdrop-blur-xl shadow-lg max-w-xl mx-auto transition-all duration-300 relative group
              ${isDragActive ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-blue-500/20' : 'border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5'}`}>
              <input {...getInputProps()} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-[24px] pointer-events-none"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Drag & Drop your Document</h3>
              <p className="text-slate-500 mb-6 text-xs font-medium">Supported: PDF, DOC, DOCX, TXT</p>
              <span className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-md inline-flex items-center gap-2">
                Upload to Scan
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-[15px]">Plagiarism Check</h1>
            <p className="text-xs text-slate-500 font-semibold truncate max-w-[200px] md:max-w-md">{file.name}</p>
          </div>
        </div>
        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Uploaded</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-blue-600' : ''}>Options</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-blue-600' : ''}>Scanning</span>
          <span>→</span>
          <span className={step === 4 ? 'text-blue-600' : ''}>Results</span>
        </div>
        <div className="flex gap-2">
            <button onClick={handleHistory} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> History</button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel - Options */}
        <div className={`w-full md:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 ${(step === 2 || (step > 2 && mobileTab === 'options')) ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-slate-50 font-extrabold text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-slate-500"/> Scan Options</div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* Databases */}
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Check Against</p>
              <div className="space-y-2">
                {[
                  { id: 'webPages', label: 'Web Pages', icon: Globe },
                  { id: 'academicDb', label: 'Academic Databases', icon: BookOpen },
                  { id: 'publications', label: 'Publications', icon: FileBadge },
                  { id: 'myDocs', label: 'My Documents (Test)', icon: Layers, pro: false }
                ].map(db => (
                  <label key={db.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={options[db.id]} disabled={db.pro} onChange={() => setOptions(p => ({...p, [db.id]: !p[db.id]}))} className="w-4 h-4 text-blue-600 rounded" />
                    <db.icon className="w-4 h-4 text-slate-400" />
                    <span className={`text-sm font-semibold ${db.pro ? 'text-slate-400' : 'text-slate-700'}`}>{db.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Smart Exclusions</p>
              <div className="space-y-2">
                {[
                  { id: 'excludeQuotes', label: 'Quotes ("...")' },
                  { id: 'excludeRefs', label: 'References / Biblio' },
                  { id: 'excludeCommon', label: 'Common Phrases' }
                ].map(ex => (
                  <label key={ex.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={options[ex.id]} onChange={() => setOptions(p => ({...p, [ex.id]: !p[ex.id]}))} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-semibold text-slate-700">{ex.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sensitivity */}
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Sensitivity</p>
              <select value={options.sensitivity} onChange={e => setOptions({...options, sensitivity: e.target.value})} className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-bold bg-slate-50 outline-none focus:ring-2 ring-blue-500">
                <option>Low (Fewer Matches)</option>
                <option>Medium (Balanced)</option>
                <option>High (Strict)</option>
              </select>
            </div>
          </div>

          <div className="p-5 border-t border-gray-200">
            {step === 2 && (
              <button onClick={startScan} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2">
                <Search className="w-4 h-4"/> Start Scan
              </button>
            )}
            {step > 2 && (
              <div className="text-center text-xs font-bold text-slate-500">Scan parameters locked.</div>
            )}
          </div>
        </div>

        {/* Center Panel - Results */}
        <div className={`flex-1 bg-slate-100 flex flex-col relative ${(step > 2 && mobileTab !== 'options') || (step === 2 && window.innerWidth >= 768) ? 'flex' : 'hidden md:flex'}`}>
          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
               <Search className="w-16 h-16 text-slate-200 mb-4" />
               <h3 className="text-xl font-black text-slate-800 mb-2">Ready to Scan</h3>
               <p className="text-sm font-medium max-w-sm">Configure your options on the left and click "Start Scan" to check this document against billions of sources.</p>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
               <div className="w-24 h-24 relative flex items-center justify-center mb-6">
                 <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                 <span className="font-black text-blue-600 text-lg">{progress}%</span>
               </div>
               <h2 className="text-xl font-black text-slate-800 mb-2">Scanning Document...</h2>
               <div className="text-sm font-bold text-slate-500 space-y-1 text-center">
                 <p className={progress > 10 ? "text-emerald-600" : ""}>✓ Text extracted</p>
                 <p className={progress > 40 ? "text-emerald-600" : ""}>{progress > 40 ? '✓' : '⟳'} Web search running</p>
                 <p className={progress > 70 ? "text-emerald-600" : ""}>{progress > 70 ? '✓' : '⟳'} Academic DB comparison</p>
                 <p className={progress > 90 ? "text-emerald-600" : ""}>{progress > 90 ? '✓' : '⟳'} Scoring similarities</p>
               </div>
            </div>
          )}

          {step === 4 && result && (() => {
            const stats = { original: 0, copied: 0, similar: 0, quoted: 0 };
            let totalWords = 0;
            let sourcesObj = {};

            (result.analysis || []).forEach(item => {
              const wCount = item.text.split(/\\s+/).length;
              totalWords += wCount;
              if (item.status === 'Copied') stats.copied += wCount;
              else if (item.status === 'Similar') stats.similar += wCount;
              else if (item.status === 'Quoted') stats.quoted += wCount;
              else stats.original += wCount;

              if (item.sourceUrl && (item.status === 'Copied' || item.status === 'Similar')) {
                if (!sourcesObj[item.sourceUrl]) sourcesObj[item.sourceUrl] = { count: 0 };
                sourcesObj[item.sourceUrl].count += wCount;
              }
            });

            const getPct = (c) => totalWords > 0 ? Math.round((c/totalWords)*100) : 0;
            const pOriginal = getPct(stats.original);
            const pCopied = getPct(stats.copied);
            const pSimilar = getPct(stats.similar);
            const pQuoted = getPct(stats.quoted);

            const sortedSources = Object.entries(sourcesObj).sort((a,b) => b[1].count - a[1].count).map(s => ({
              domain: s[0],
              score: getPct(s[1].count),
              color: 'text-red-600 bg-red-50' // Could be dynamic
            }));

            const finalScore = pOriginal + pQuoted;
            const copiedOffset = 402 - ((pCopied+pSimilar)/100)*402;

            return (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar block">
                 {/* Score Overview */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center relative shrink-0">
                      <div className="text-center">
                        <div className="text-3xl font-black text-slate-800">{finalScore}%</div>
                        <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Original</div>
                      </div>
                      <svg className="absolute inset-[-12px] w-[152px] h-[152px] -rotate-90 pointer-events-none">
                         <circle cx="76" cy="76" r="64" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="402" strokeDashoffset={copiedOffset} />
                      </svg>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <h3 className="font-extrabold text-lg text-slate-800 mb-4">Originality Report</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="flex items-center gap-2 text-emerald-600"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Original</span>
                          <span>{pOriginal}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="flex items-center gap-2 text-red-600"><span className="w-3 h-3 rounded-full bg-red-500"></span> Copied (High match)</span>
                          <span>{pCopied}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="flex items-center gap-2 text-amber-500"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Similar (Paraphrased)</span>
                          <span>{pSimilar}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="flex items-center gap-2 text-blue-500"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Quoted</span>
                          <span>{pQuoted}%</span>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Matched Sources */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                     <h3 className="font-extrabold text-sm text-slate-800">Matched Sources ({sortedSources.length})</h3>
                     <button 
                       onClick={handleExport} 
                       disabled={isExporting}
                       className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
                     >
                       {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5"/>}
                       {isExporting ? 'Generating...' : 'Generate PDF Report'}
                     </button>
                   </div>
                   <div className="divide-y divide-gray-100">
                     {sortedSources.length === 0 && <div className="p-4 text-sm font-bold text-slate-400 text-center">No copied sources found!</div>}
                     {sortedSources.map((src, i) => (
                       <div key={i} className="p-4 hover:bg-slate-50 flex items-center justify-between group cursor-pointer transition-colors">
                         <div className="flex items-center gap-4 truncate">
                            <span className={`px-2 py-1 rounded text-xs font-black ${src.color}`}>{src.score}%</span>
                            <span className="text-sm font-semibold text-slate-700 truncate">{src.domain}</span>
                         </div>
                         <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-xs font-bold text-slate-400 hover:text-slate-800">Cite</span>
                           <a href={src.domain.startsWith('http') ? src.domain : 'https://'+src.domain} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600">Open →</a>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Highlighted Text Preview */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
                     <h3 className="font-extrabold text-sm text-slate-800">Document Highlights</h3>
                   </div>
                   <div className="p-6 text-sm font-medium leading-loose text-slate-700">
                     {(result.analysis || []).map((item, idx) => {
                        if (item.status === 'Copied') return <span key={idx} className="bg-red-200 text-red-900 px-1 rounded cursor-pointer mx-0.5 border-b-2 border-red-500 hover:bg-red-300 transition-colors" title={`Matched: ${item.sourceUrl}`}>{item.text} </span>;
                        if (item.status === 'Similar') return <span key={idx} className="bg-amber-200 text-amber-900 px-1 rounded cursor-pointer mx-0.5 border-b-2 border-amber-500 hover:bg-amber-300 transition-colors" title={`Paraphrased from: ${item.sourceUrl}`}>{item.text} </span>;
                        if (item.status === 'Quoted') return <span key={idx} className="bg-blue-100 text-blue-800 px-1 rounded cursor-pointer mx-0.5">{item.text} </span>;
                        return <span key={idx}>{item.text} </span>;
                     })}
                   </div>
                 </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Hidden PDF Report Container */}
      {step === 4 && result && (
        <div 
          ref={reportRef} 
          style={{ 
            display: 'none', 
            position: 'absolute', 
            left: '-9999px', 
            top: 0, 
            width: '800px', 
            backgroundColor: 'white',
            padding: '60px',
            color: '#0f172a',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Report Header */}
          <div style={{ borderBottom: '3px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', color: '#1e293b' }}>Originality Report</h1>
              <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}><strong>Document:</strong> {file?.name}</div>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Generated on:</strong> {new Date().toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right', padding: '10px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#10b981', lineHeight: '1' }}>
                {(() => {
                  let totalWords = 0; let orig = 0; let quoted = 0;
                  (result.analysis || []).forEach(item => {
                    const w = item.text.split(/\s+/).length; totalWords += w;
                    if (item.status === 'Original') orig += w;
                    if (item.status === 'Quoted') quoted += w;
                  });
                  return totalWords ? Math.round(((orig+quoted)/totalWords)*100) : 0;
                })()}%
              </div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '900', color: '#64748b', letterSpacing: '1px', marginTop: '6px' }}>Originality Score</div>
            </div>
          </div>

          {/* Highlighted Document Text */}
          <h2 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', color: '#334155' }}>Document Analysis</h2>
          <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155', marginBottom: '50px', textAlign: 'justify' }}>
            {(result.analysis || []).map((item, idx) => {
               if (item.status === 'Copied') return <span key={idx} style={{ backgroundColor: '#fecaca', color: '#991b1b', padding: '2px 4px', borderRadius: '3px' }}>{item.text} </span>;
               if (item.status === 'Similar') return <span key={idx} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '2px 4px', borderRadius: '3px' }}>{item.text} </span>;
               if (item.status === 'Quoted') return <span key={idx} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 4px', borderRadius: '3px' }}>{item.text} </span>;
               return <span key={idx}>{item.text} </span>;
            })}
          </div>

          {/* Primary Sources List */}
          <h2 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', color: '#334155' }}>Primary Sources</h2>
          <div style={{ marginBottom: '40px' }}>
            {(() => {
               let sourcesObj = {};
               let totalWords = 0;
               (result.analysis || []).forEach(item => {
                 const w = item.text.split(/\s+/).length;
                 totalWords += w;
                 if (item.sourceUrl && (item.status === 'Copied' || item.status === 'Similar')) {
                   if (!sourcesObj[item.sourceUrl]) sourcesObj[item.sourceUrl] = 0;
                   sourcesObj[item.sourceUrl] += w;
                 }
               });
               const sortedSources = Object.entries(sourcesObj).sort((a,b) => b[1] - a[1]);
               if (sortedSources.length === 0) return <p style={{ fontSize: '14px', color: '#64748b' }}>No matching sources found.</p>;
               
               return sortedSources.map((src, i) => {
                 const pct = totalWords ? Math.round((src[1]/totalWords)*100) : 0;
                 return (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444', minWidth: '40px' }}>{pct}%</span>
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{src[0]}</span>
                   </div>
                 );
               });
            })()}
          </div>
          
          <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            Generated by PDFMaster Professional Plagiarism Scanner
          </div>
        </div>
      )}

    </div>
  );
}
