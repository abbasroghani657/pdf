import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Globe, ArrowRightLeft, Languages,
  Settings2, Download, Copy, RefreshCw, Zap, Scale, Target, Check
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PDFViewer from '../components/ChatPDF/PDFViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LANGUAGES = [
  'Auto Detect',
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 
  'Bulgarian', 'Burmese', 'Catalan', 'Cebuano', 'Chichewa', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Corsican', 
  'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Filipino', 'Finnish', 'French', 'Frisian', 
  'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Haitian Creole', 'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 
  'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 
  'Kinyarwanda', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 
  'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia (Oriya)', 
  'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'Scots Gaelic', 'Serbian', 
  'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish', 
  'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 
  'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu'
];

export default function TranslatePDFPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileTab, setMobileTab] = useState('options'); // 'options' | 'output' | 'pdf'

  // Translation Options State
  const [options, setOptions] = useState({
    from: 'Auto Detect',
    to: 'English',
    mode: 'Balanced', // 'Fast' | 'Balanced' | 'Accurate'
  });

  // Result State
  const [translateStatus, setTranslateStatus] = useState('idle'); // 'idle' | 'translating' | 'done'
  const [translatedText, setTranslatedText] = useState(null);
  const [copied, setCopied] = useState(false);
  const pdfContextRef = useRef('');
  const translatedPagesRef = useRef({});

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
        fullCtx += `\n\n--- PAGE ${i} ---\n\n` + pageText;
        setProgress(30 + Math.floor((i / n) * 65));
      }
      pdfContextRef.current = fullCtx.slice(0, 80000); // Send up to ~20,000 words
      setProgress(100);
      setTimeout(() => setIsProcessing(false), 400);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setFile(null);
      alert('Error reading PDF. It may be corrupted or password-protected.');
    }
  };

  const handleSwapLanguages = () => {
    if (options.from === 'Auto Detect') return;
    setOptions(prev => ({ ...prev, from: prev.to, to: prev.from }));
  };

  const generateTranslation = async () => {
    setTranslateStatus('translating');
    setMobileTab('output');
    try {
      const customSystemPrompt = `You are a professional, world-class document translator. You have been given the full text of a PDF document containing multiple pages separated by "--- PAGE X ---" markers.

CRITICAL INSTRUCTIONS:
1. Translate the ENTIRE text from ${options.from === 'Auto Detect' ? 'its original language' : options.from} to ${options.to}. DO NOT stop until you have translated every single word of the document.
2. PRESERVE ALL FORMATTING perfectly using Markdown (tables, bullet points, headers, lists, bold text).
3. EXTREMELY IMPORTANT: You MUST preserve the exact "--- PAGE X ---" delimiters in your translation so we know which translated text belongs to which page. Do not translate the word "PAGE", keep the delimiter exactly as "--- PAGE X ---". Ensure EVERY page marker present in the original is also present in the translation.
4. If the target language is ${options.to} and it is RTL (e.g. Urdu, Arabic, Persian, Hebrew), make sure the markdown structure remains intact.
5. Translation Mode chosen by user: ${options.mode} (Adjust your tone and precision accordingly).
6. DO NOT summarize. DO NOT truncate. Provide a 1-to-1 full translation.

ORIGINAL PDF CONTENT:
${pdfContextRef.current}`;

      const res = await fetch(`/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Please provide the complete translation preserving all page markers and markdown formatting.', 
          pdfContext: pdfContextRef.current,
          history: [],
          customSystemPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.response);
        parseTranslatedPages(data.response);
      } else {
        setTranslatedText("⚠️ Failed to generate translation. Rate limit exceeded or API error.");
      }
    } catch (e) {
      console.error(e);
      setTranslatedText("⚠️ Network error while translating.");
    }
    setTranslateStatus('done');
  };

  // Parse translation into pages for sync scrolling
  const parseTranslatedPages = (text) => {
    if (!text) return;
    const pages = {};
    const parts = text.split(/--- PAGE (\d+) ---/i);
    
    // parts[0] is usually before the first marker.
    let currentPg = 1;
    for (let i = 1; i < parts.length; i += 2) {
      const pgNum = parseInt(parts[i], 10);
      const content = parts[i + 1]?.trim() || '';
      pages[pgNum] = content;
    }
    
    // Fallback if no page markers were preserved
    if (Object.keys(pages).length === 0) {
      pages[1] = text;
    }
    
    translatedPagesRef.current = pages;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const content = document.getElementById('translation-output')?.innerHTML || 'No content to print.';
    printWindow.document.write(`
      <html>
        <head>
          <title>Translated Document - ${file?.name || 'PDF'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRTL ? 'right' : 'left'}; }
            th { background-color: #f9f9f9; }
            h1, h2, h3 { color: #111; margin-top: 1.5em; }
            hr { border: 0; border-top: 1px solid #eee; margin: 2em 0; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body dir="${isRTL ? 'rtl' : 'ltr'}">
          ${content}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isRTL = ['Urdu', 'Arabic', 'Persian', 'Hebrew'].includes(options.to);

  // ── 1. Upload View ────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-4 shadow-sm border border-blue-200">
              <Globe className="w-4 h-4" /> Professional Global Translator
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Translate PDF Document</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">Instantly translate PDFs into 100+ languages while preserving exact formatting, tables, and layouts.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-12 transition-all duration-300 cursor-pointer bg-white shadow-xl max-w-2xl mx-auto
              ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-blue-100' : 'border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:bg-slate-50/50'}`}>
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3 hover:rotate-6 transition-transform">
                <Globe className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Drag & Drop your PDF here</h3>
              <p className="text-gray-500 mb-6 font-medium text-sm">or click to browse files</p>
              <span className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg inline-flex items-center gap-2">
                Select File
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── 2. Loading View ───────────────────────────────────────────────────────
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
          <h2 className="text-xl font-bold text-gray-900">Scanning Document...</h2>
          <p className="text-sm text-gray-400 mt-1">Extracting layout & text for translation</p>
        </div>
      </motion.div>
    </div>
  );

  // ── Options Panel Component ───────────────────────────────────────────────
  const OptionsPanel = () => (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      
      {/* Languages Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Languages className="w-5 h-5 text-blue-600" /> Languages
        </h2>
        
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Translate From</label>
            <select value={options.from} onChange={(e) => setOptions({...options, from: e.target.value})}
              className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-bold shadow-sm">
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
          
          <div className="flex justify-center -my-2 relative z-10">
            <button onClick={handleSwapLanguages} className="bg-white p-2 rounded-full border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors">
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Translate To</label>
            <select value={options.to} onChange={(e) => setOptions({...options, to: e.target.value})}
              className="w-full bg-white border border-blue-300 text-blue-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-bold shadow-sm">
              {LANGUAGES.filter(l => l !== 'Auto Detect').map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Translation Mode */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" /> Translation Mode
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'Fast', icon: Zap, desc: 'Quick gist translation' },
            { id: 'Balanced', icon: Scale, desc: 'Speed and context accuracy' },
            { id: 'Accurate', icon: Target, desc: 'Professional nuanced translation' }
          ].map(mode => (
            <button key={mode.id} onClick={() => setOptions({ ...options, mode: mode.id })}
              className={`p-3 text-left rounded-xl border transition-all ${options.mode === mode.id ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <mode.icon className={`w-4 h-4 ${options.mode === mode.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`font-bold text-sm ${options.mode === mode.id ? 'text-blue-800' : 'text-gray-700'}`}>{mode.id}</span>
                </div>
                {options.mode === mode.id && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-6">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={generateTranslation} disabled={options.from === options.to}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-4">
        <Globe className="w-5 h-5" /> Translate Document
      </button>
    </div>
  );

  // ── Output Panel Component ────────────────────────────────────────────────
  const OutputPanel = () => (
    <div className="flex flex-col h-full bg-white relative">
      {translateStatus === 'translating' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Translating Document...</h3>
            <p className="text-gray-500 text-sm">Preserving formatting and generating {options.to} text.</p>
          </div>
          <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-[85%]"></div>
          </div>
        </div>
      ) : translateStatus === 'done' ? (
        <>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Translated Text</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{options.to} • {options.mode} Mode</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors tooltip-trigger relative group">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="absolute -bottom-8 right-0 text-[10px] bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Copy text</span>
              </button>
              <button onClick={handleExport} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors tooltip-trigger relative group">
                <Download className="w-4 h-4" />
                <span className="absolute -bottom-8 right-0 text-[10px] bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Export to PDF</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 lg:px-10" dir={isRTL ? 'rtl' : 'ltr'}>
            <div id="translation-output" className={`prose prose-sm prose-blue max-w-none ${isRTL ? 'text-right font-urdu' : 'text-left'} 
              prose-p:leading-relaxed prose-headings:font-bold prose-table:w-full prose-th:bg-gray-50 prose-td:border prose-th:border prose-td:p-2 prose-th:p-2`}>
              
              {/* Display synced page content if available, else show full text */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {translatedPagesRef.current[currentPage] || translatedText || '*No content available for this page.*'}
              </ReactMarkdown>

            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
             <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                Syncing with Page {currentPage}
             </div>
            <button onClick={() => setTranslateStatus('idle')} className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Start Over
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
          <Globe className="w-20 h-20 text-gray-300 mb-6" />
          <h3 className="font-bold text-gray-500 text-lg mb-2">Translation Ready</h3>
          <p className="text-gray-400 font-medium max-w-xs">Select your languages and click translate to see the results here.</p>
        </div>
      )}
    </div>
  );

  // ── 3. Main Interface ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setFile(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 hidden sm:flex items-center justify-center shadow-sm">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">Translate PDF</h1>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px] md:max-w-sm font-semibold">{file.name} • {pageCount} pages</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'options', label: 'Settings', icon: Settings2 },
            { id: 'output', label: 'Translation', icon: Globe },
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
          <PDFViewer 
            file={file} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>

        {/* Action Panel (Right Panel on Desktop, conditional on Mobile) */}
        <div className={`flex-1 md:w-[550px] md:flex-none h-full bg-white flex flex-col ${(mobileTab === 'options' || mobileTab === 'output') ? 'block absolute inset-0 z-10 bg-white md:relative' : 'hidden md:block'}`}>
          
          {/* Desktop/Tablet Action Tabs */}
          <div className="flex border-b border-gray-100 p-2 gap-2 bg-slate-50/50 shrink-0">
            <button onClick={() => setTranslateStatus('idle')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translateStatus === 'idle' ? 'bg-white shadow-sm text-gray-800 border border-gray-200' : 'text-gray-500 hover:bg-gray-100 border border-transparent'}`}>
              Settings
            </button>
            <button onClick={() => translateStatus !== 'idle' && setMobileTab('output')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translateStatus !== 'idle' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-400 cursor-not-allowed border border-transparent'}`}>
              Result
            </button>
          </div>

          {/* Dynamic Content Panel */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={translateStatus === 'idle' ? 'opt' : 'out'}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="h-full">
                {translateStatus === 'idle' ? <OptionsPanel /> : <OutputPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
