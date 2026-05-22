import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, List, AlignLeft, Target, Languages, 
  Settings2, Download, Copy, RefreshCw, MessageSquare, Save, Check
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PDFViewer from '../components/ChatPDF/PDFViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LANGUAGES = [
  'English', 'Urdu', 'Arabic', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean',
  'Russian', 'Portuguese', 'Italian', 'Dutch', 'Turkish', 'Bengali', 'Punjabi', 'Tamil', 'Telugu', 'Marathi'
];

export default function SummarizePDFPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState('options'); // 'options' | 'output' | 'pdf'

  // Summary Options State
  const [options, setOptions] = useState({
    length: 'Medium',
    format: 'Bullet Points',
    focus: 'Key Points',
    language: 'English',
    pages: 'All'
  });

  // Result State
  const [summaryStatus, setSummaryStatus] = useState('idle'); // 'idle' | 'generating' | 'done'
  const [summaryResult, setSummaryResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const pdfContextRef = useRef('');

  const onDrop = useCallback(async (accepted) => {
    if (accepted?.length > 0) {
      setFile(accepted[0]);
      extractPDF(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false
  });

  const extractPDF = async (pdfFile) => {
    setIsProcessing(true);
    setProgress(10);
    try {
      const ab = await pdfFile.arrayBuffer();
      setProgress(30);
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      const n = doc.numPages;
      setPageCount(n);
      
      let fullCtx = '';
      for (let i = 1; i <= n; i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items.map(it => it.str).join(' ');
        fullCtx += `\n--- PAGE ${i} ---\n` + pageText;
        setProgress(30 + Math.floor((i / n) * 65));
      }
      pdfContextRef.current = fullCtx.slice(0, 80000);
      setProgress(100);
      setTimeout(() => setIsProcessing(false), 400);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setFile(null);
      alert('Error reading PDF. It may be corrupted or password-protected.');
    }
  };

  const generateSummary = async () => {
    setSummaryStatus('generating');
    setMobileTab('output');
    try {
      const customSystemPrompt = `You are a professional PDF document summarizer. You have been given the full text of a PDF document.

CRITICAL INSTRUCTIONS:
- You must generate a summary of the document using EXACTLY these settings:
  * Length: ${options.length} (Short=~150 words, Medium=~400 words, Detailed=~800 words)
  * Format: ${options.format} (If 'Bullet Points', use mostly bullets. If 'Numbered List', use numbers. If 'Paragraph', use flowing text.)
  * Focus: ${options.focus} (Concentrate entirely on this aspect)
  * Language: ${options.language} (The entire response MUST be written in this language)
  * Pages to cover: ${options.pages}
- ALWAYS cite the page number where the information is found using EXACTLY this format: [📄 Pg X]
- Format beautifully with markdown.

PDF CONTENT:
${pdfContextRef.current}`;

      const res = await fetch(`/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Please summarize the document based on the provided settings.', 
          pdfContext: pdfContextRef.current,
          history: [],
          customSystemPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSummaryResult(data.response);
      } else {
        setSummaryResult("⚠️ Failed to generate summary. Rate limit exceeded or API error.");
      }
    } catch (e) {
      console.error(e);
      setSummaryResult("⚠️ Network error while generating summary.");
    }
    setSummaryStatus('done');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([summaryResult], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Summary_${file?.name || 'Document'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReferenceClick = (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#page-')) {
      e.preventDefault();
      const pg = parseInt(e.target.getAttribute('href').replace('#page-', ''), 10);
      if (!isNaN(pg)) {
        setCurrentPage(pg);
        setHighlightTrigger(prev => prev + 1);
        if (window.innerWidth < 768) setMobileTab('pdf');
      }
    }
  };

  // Convert [📄 Pg X] to clickable links in markdown
  const processedSummary = summaryResult?.replace(
    /\[📄 Pg (\d+)\]/g, 
    '[$&](#page-$1)'
  );

  // ── 1. Upload Screen ───────────────────────────────────────────────────────
  if (!file) return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-5">
        <div className="relative mx-auto w-16 h-16">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <List className="w-8 h-8 text-white" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md ring-2 ring-white">AI</span>
        </div>
        
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Summarize PDF</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Instantly compress long documents into clear, concise summaries. Perfect for research, legal, and business reports.
          </p>
        </div>

        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer bg-white mt-4
          ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-md' : 'border-gray-200 hover:border-blue-400 hover:shadow-sm hover:bg-slate-50/50'}`}>
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-gray-800 mb-1">{isDragActive ? 'Drop file here' : 'Select a PDF to begin'}</p>
          <p className="text-xs text-gray-400 mb-5">or drag and drop your file here</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            Browse Files
          </button>
        </div>
        
        {/* Recent PDFs (Mock for UI purposes as requested) */}
        <div className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-6">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Recent Summaries</p>
          <div className="space-y-2">
            {['Q3_Financial_Report.pdf', 'Stanford_Research_2025.pdf'].map(name => (
              <div key={name} className="flex items-center gap-3 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  // ── 2. Processing Screen ───────────────────────────────────────────────────
  if (isProcessing) return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#eff6ff" strokeWidth="6" />
            <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#3b82f6" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="226"
              animate={{ strokeDashoffset: 226 - (226 * progress / 100) }}
              transition={{ duration: 0.4 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-blue-600">{progress}%</div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reading Document...</h2>
          <p className="text-sm text-gray-400 mt-1">Preparing for summarization</p>
        </div>
      </motion.div>
    </div>
  );

  // ── Options Panel Component ───────────────────────────────────────────────
  const OptionsPanel = () => (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" /> Summary Settings
        </h2>
      </div>

      {/* Length */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-gray-400" /> Summary Length
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['Short', 'Medium', 'Detailed'].map(len => (
            <button key={len} onClick={() => setOptions({ ...options, length: len })}
              className={`py-2 px-1 text-xs font-semibold rounded-lg border ${options.length === len ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {len}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center">
          {options.length === 'Short' ? '~150 words (Quick overview)' : options.length === 'Medium' ? '~400 words (Standard)' : '~800 words (In-depth)'}
        </p>
      </div>

      {/* Format */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <List className="w-4 h-4 text-gray-400" /> Format
        </label>
        <div className="grid grid-cols-1 gap-2">
          {['Paragraph', 'Bullet Points', 'Numbered List'].map(fmt => (
            <button key={fmt} onClick={() => setOptions({ ...options, format: fmt })}
              className={`py-2.5 px-4 text-sm font-semibold rounded-lg border flex items-center justify-between ${options.format === fmt ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {fmt}
              {options.format === fmt && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Focus */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" /> Focus Area
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['All Content', 'Key Points', 'Conclusions', 'Action Items'].map(foc => (
            <button key={foc} onClick={() => setOptions({ ...options, focus: foc })}
              className={`py-2 px-2 text-xs font-semibold rounded-lg border ${options.focus === foc ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {foc}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-400" /> Output Language
        </label>
        <select 
          value={options.language} 
          onChange={(e) => setOptions({...options, language: e.target.value})}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
        >
          {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>

      <button onClick={generateSummary}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-8">
        <List className="w-5 h-5" /> Generate Summary
      </button>
    </div>
  );

  // ── Output Panel Component ────────────────────────────────────────────────
  const OutputPanel = () => (
    <div className="flex flex-col h-full bg-white relative">
      {summaryStatus === 'generating' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">AI is reading...</h3>
            <p className="text-gray-500 text-sm">Generating a {options.length.toLowerCase()} summary in {options.language}</p>
          </div>
          <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      ) : summaryStatus === 'done' ? (
        <>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Summary Result</h3>
              <p className="text-[10px] text-gray-500 font-medium">{options.length} • {options.format} • {options.language}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors tooltip-trigger relative group">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Copy text</span>
              </button>
              <button onClick={handleExport} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors tooltip-trigger relative group">
                <Download className="w-4 h-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Export to Word</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6" onClick={handleReferenceClick}>
            <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed prose-a:text-blue-600 prose-a:bg-blue-50 prose-a:px-1 prose-a:rounded prose-a:no-underline hover:prose-a:bg-blue-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {processedSummary}
              </ReactMarkdown>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 grid grid-cols-2 gap-3">
            <button onClick={() => setSummaryStatus('idle')} className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <button onClick={() => navigate('/tools/chat-with-pdf', { state: { file } })} className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Chat About It
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
          <List className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Select your options and click generate.</p>
        </div>
      )}
    </div>
  );

  // ── 3. Main Interface ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setFile(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 hidden sm:flex items-center justify-center shadow-sm">
              <List className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">Summarize PDF</h1>
              <p className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-sm">{file.name} • {pageCount} pages</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'options', label: 'Settings', icon: Settings2 },
            { id: 'output', label: 'Summary', icon: List },
            { id: 'pdf', label: 'PDF', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setMobileTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mobileTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                <Icon className="w-3.5 h-3.5" /> <span className="hidden xs:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer (Left Panel on Desktop, conditional on Mobile) */}
        <div className={`flex-1 border-r border-gray-200 h-full ${mobileTab === 'pdf' ? 'block absolute inset-0 z-10 bg-white md:relative' : 'hidden md:block'}`}>
          <PDFViewer file={file} currentPage={currentPage} setCurrentPage={setCurrentPage} highlightText={highlightTrigger} />
        </div>
        
        {/* Right Panel Wrapper (Desktop side-by-side, Mobile single view) */}
        <div className={`flex-1 md:w-[500px] md:flex-none h-full bg-white flex flex-col ${(mobileTab === 'options' || mobileTab === 'output') ? 'block absolute inset-0 z-10 bg-white md:relative' : 'hidden md:block'}`}>
          
          {/* On Desktop, we split the right panel into Options (top) and Output (bottom). Or tabs. Let's use tabs. */}
          <div className="hidden md:flex p-1 bg-gray-100 m-4 rounded-lg shrink-0">
            <button onClick={() => setSummaryStatus('idle')} className={`flex-1 py-1.5 text-sm font-bold rounded-md ${summaryStatus === 'idle' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              Settings
            </button>
            <button onClick={() => summaryStatus !== 'idle' && setMobileTab('output')} className={`flex-1 py-1.5 text-sm font-bold rounded-md ${summaryStatus !== 'idle' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 cursor-not-allowed'}`}>
              Summary Output
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {/* If mobileTab is 'options' or (desktop and status is idle) */}
              {((mobileTab === 'options' && window.innerWidth < 768) || (summaryStatus === 'idle' && window.innerWidth >= 768)) ? (
                <motion.div key="options" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="absolute inset-0">
                  <OptionsPanel />
                </motion.div>
              ) : (
                <motion.div key="output" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="absolute inset-0">
                  <OutputPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

