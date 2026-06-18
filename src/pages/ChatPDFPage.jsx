import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, MessageSquare, FileText as FileIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PDFViewer from '../components/ChatPDF/PDFViewer';
import ChatPanel from '../components/ChatPDF/ChatPanel';
import { PDFAIEngine } from '../components/ChatPDF/PDFAIEngine';

export default function ChatPDFPage({ lang = 'en' }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat');
  const aiRef = useRef(null);
  const historyRef = useRef([]);
  const pdfContextRef = useRef(''); // Use ref to avoid stale closure in askAI
  const location = useLocation();

  useEffect(() => {
    if (location.state?.file && !file) {
      setFile(location.state.file);
      extractPDF(location.state.file);
    }
  }, [location.state]);

  const onDrop = useCallback(async (accepted) => {
    if (accepted?.length > 0) { 
      const file = accepted[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Free tier: 10MB limit. Upgrade to Pro for 1GB uploads!');
        return;
      }
      setFile(file); 
      setMessages([]); 
      extractPDF(file); 
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false
  });

  const extractPDF = async (pdfFile) => {
    setIsProcessing(true); setProgress(10);
    try {
      const ab = await pdfFile.arrayBuffer();
      setProgress(30);
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      const n = doc.numPages; setPageCount(n);
      const pages = [];
      let fullCtx = '';
      for (let i = 1; i <= n; i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items.map(it => it.str).join(' ');
        pages.push({ pageNum: i, text: pageText });
        fullCtx += `\n--- PAGE ${i} ---\n` + pageText;
        setProgress(30 + Math.floor((i / n) * 65));
      }
      aiRef.current = new PDFAIEngine(pages);
      pdfContextRef.current = fullCtx.slice(0, 80000); // Store in ref for fresh access
      historyRef.current = [];
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setMessages([{
          id: 'welcome', role: 'ai',
          text: `## 👋 Ready to Analyze\n\nI've fully processed **${pdfFile.name}** — ${n} pages indexed.\n\nAsk me anything: summaries, specific clauses, risk analysis, key findings — in any language you prefer.`
        }]);
      }, 400);
    } catch (err) {
      console.error(err); setIsProcessing(false); setFile(null);
      alert('Error reading PDF. It may be corrupted or password-protected.');
    }
  };

  // ── AI Chat: Backend first, extractive fallback ─────────────────────────────
  const askAI = async (userText, fallbackFn) => {
    setIsTyping(true);
    let aiText = null;
    try {
      const res = await fetch(`/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, pdfContext: pdfContextRef.current, history: historyRef.current.slice(-14) })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          aiText = data.response;
          historyRef.current = [...historyRef.current, { role: 'user', text: userText }, { role: 'ai', text: aiText }];
          if (historyRef.current.length > 20) historyRef.current = historyRef.current.slice(-20);
        }
      } else {
        console.error("AI API Error:", res.status, await res.text());
      }
    } catch (e) { 
      console.error('Fetch error calling /api/ai-chat:', e);
    }

    // Use client-side extractive AI if backend not available
    if (!aiText && aiRef.current) aiText = fallbackFn();
    if (!aiText) aiText = 'I could not process your request. Please try again.';

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: aiText }]);
    setIsTyping(false);
  };

  const handleSendMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    askAI(text, () => aiRef.current?.answerQuestion(text));
  };

  const handleQuickAction = (action) => {
    const prompts = {
      summary:    'Please provide a comprehensive, well-structured executive summary of this entire document with key sections.',
      key_points: 'Extract and list the most important key points, facts, and critical information as a numbered list with page citations.',
      faq:        'Generate a detailed FAQ (Frequently Asked Questions with thorough answers) based on this document.',
      translate:  'Provide a comprehensive Urdu translation of the main content of this document.',
      explain:    'Identify and explain all technical, legal, or specialized terminology found in this document in simple language.',
      tables:     'Find and extract all tabular data, structured lists, and numerical data from this document. Present them clearly.',
      risks:      'Perform a thorough risk analysis. Identify penalties, obligations, liabilities, deadlines, and any clauses that require careful attention.',
    };
    const clientFallbacks = {
      summary: () => aiRef.current?.summarize(),
      key_points: () => aiRef.current?.keyPoints(),
      faq: () => aiRef.current?.faq(),
      risks: () => aiRef.current?.risks(),
      explain: () => aiRef.current?.explainTerms(),
    };
    const userLabel = `Please ${action.label.toLowerCase()} the document.`;
    const prompt = prompts[action.id] || userLabel;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userLabel }]);
    askAI(prompt, clientFallbacks[action.id] || (() => aiRef.current?.answerQuestion(userLabel)));
  };

  const handleReferenceClick = (pageNum) => {
    setCurrentPage(pageNum);
    setHighlightTrigger(prev => prev + 1);
    if (window.innerWidth < 768) setMobileTab('pdf');
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  if (!file) return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-5">
        <div className="relative mx-auto w-16 h-16">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md ring-2 ring-white">AI</span>
        </div>
        
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chat with PDF</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Upload your document and instantly ask complex questions to get expert-level answers powered by AI.
          </p>
        </div>

        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer bg-white mt-4
          ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-md' : 'border-gray-200 hover:border-indigo-400 hover:shadow-sm hover:bg-slate-50/50'}`}>
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileIcon className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-gray-800 mb-1">{isDragActive ? 'Drop file here' : 'Select a PDF to begin'}</p>
          <p className="text-xs text-gray-400 mb-5">or drag and drop your file here</p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            Browse Files
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 pt-2 font-medium">
          {['Expert AI Analysis', 'High Accuracy', '100% Private'].map(f => (
            <div key={f} className="flex items-center gap-1"><span className="text-emerald-500">✓</span>{f}</div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ── Processing ─────────────────────────────────────────────────────────────
  if (isProcessing) return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e0e7ff" strokeWidth="6" />
            <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#6366f1" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="226"
              animate={{ strokeDashoffset: 226 - (226 * progress / 100) }}
              transition={{ duration: 0.4 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-indigo-600">{progress}%</div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Reading Document...</h2>
          <p className="text-sm text-gray-400 mt-1">Extracting · Indexing · Building intelligence</p>
        </div>
        <div className="space-y-2 text-left">
          {[['Parsing PDF structure', progress >= 30], ['Extracting page content', progress >= 65], ['Building AI knowledge base', progress >= 95]].map(([label, done]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span>{done ? '✅' : '⏳'}</span>
              <span className={done ? 'text-gray-700 font-medium' : 'text-gray-400'}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ── Chat Interface ─────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setFile(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 hidden sm:flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">Chat with PDF</h1>
              <p className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-sm">{file.name} · {pageCount} pages</p>
            </div>
          </div>
        </div>
        <div className="flex md:hidden bg-gray-100 p-1 rounded-lg">
          {[['chat', MessageSquare, 'Chat'], ['pdf', FileIcon, 'PDF']].map(([tab, Icon, label]) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mobileTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 border-r border-gray-200 h-full ${mobileTab === 'pdf' ? 'block absolute inset-0 z-10 bg-white md:relative' : 'hidden md:block'}`}>
          <PDFViewer file={file} currentPage={currentPage} setCurrentPage={setCurrentPage} highlightText={highlightTrigger} />
        </div>
        <div className={`flex-1 md:w-[460px] md:flex-none h-full bg-white ${mobileTab === 'chat' ? 'block' : 'hidden md:block'}`}>
          <ChatPanel messages={messages} isTyping={isTyping} onSendMessage={handleSendMessage} onQuickAction={handleQuickAction} onReferenceClick={handleReferenceClick} />
        </div>
      </div>
    </div>
  );
}
