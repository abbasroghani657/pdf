import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useCallback, useRef, Component } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft, FileText, Settings2, RefreshCw, Zap, Edit3,
  FileSpreadsheet, FileJson, Key, ListTree, Database,
  Banknote, UploadCloud, PieChart
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as XLSX from 'xlsx';
import PDFViewer from '../components/ChatPDF/PDFViewer';

// ─── Constants & Utils ────────────────────────────────────────────────────────
const DOC_TYPES = [
  { id: 'invoice',  label: 'Invoice',       icon: Banknote },
  { id: 'form',     label: 'Form',           icon: ListTree },
  { id: 'table',    label: 'Table',          icon: Database },
  { id: 'idcard',   label: 'ID Card',        icon: Key },
  { id: 'receipt',  label: 'Receipt',        icon: FileText },
  { id: 'bank',     label: 'Bank Stmt',      icon: PieChart },
  { id: 'contract', label: 'Contract',       icon: FileText },
  { id: 'custom',   label: 'Custom',         icon: Settings2 },
];

const EXTRACT_KEYS = ['tables','keyValues','entities','dates','amounts','addresses','signatures'];

const getConfidenceColor = (s) =>
  s >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : s >= 70 ? 'text-amber-600 bg-amber-50 border-amber-200'
  : 'text-red-600 bg-red-50 border-red-200';

function flattenExtractedData(extractedData) {
  const scalarData = [];
  const tables = [];

  const flatten = (obj, prefix = '') => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object') {
        tables.push({ key: prefix || 'Data Table', data: obj });
      } else {
        if (obj.length > 0) {
          scalarData.push({ Field: String(prefix).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), Value: obj.join(', ') });
        }
      }
      return;
    }
    for (const k in obj) {
      const val = obj[k];
      const isGroupKey = prefix === '' && ['keyValues', 'entities', 'dates', 'amounts', 'addresses', 'signatures', 'tables', 'data'].includes(k);
      const currentPrefix = isGroupKey ? '' : (prefix ? `${prefix}_${k}` : k);

      if (val !== null && typeof val === 'object') {
        flatten(val, currentPrefix);
      } else {
        if (val === '' || val === null || val === undefined || String(val).trim() === '') continue;
        const finalKey = currentPrefix.replace(/_/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase());
        scalarData.push({ Field: finalKey, Value: String(val) });
      }
    }
  };

  flatten(extractedData);
  return { scalarData, tables };
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-red-50 p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Render Error</h2>
          <pre className="text-sm bg-white p-6 rounded-xl shadow-sm text-left max-w-2xl w-full overflow-auto text-red-800 border border-red-100">
            {this.state.error.message}
          </pre>
          <button onClick={() => this.setState({ error: null })} className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Components ───────────────────────────────────────────────────────────────
function ConfigPanel({ docType, setDocType, extractOptions, setExtractOptions, accuracyMode, setAccuracyMode, onExtract, isProcessing }) {
  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50 shrink-0 sticky top-0 z-10 backdrop-blur-md">
        <h2 className="font-extrabold text-gray-900 flex items-center gap-2.5 text-sm tracking-wide">
          <Settings2 className="w-4 h-4 text-indigo-600" /> Configuration
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Doc Type */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Document Type</p>
          <div className="grid grid-cols-2 gap-2.5">
            {DOC_TYPES.map(t => {
              const active = docType === t.id;
              return (
                <button key={t.id} onClick={() => setDocType(t.id)} className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-200 ${
                  active ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}>
                  <t.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`text-[11px] font-bold leading-tight ${active ? 'text-indigo-900' : 'text-gray-600'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extract Options */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">What to Extract</p>
          <div className="space-y-1.5">
            {EXTRACT_KEYS.map(key => (
              <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50/50 cursor-pointer transition-colors group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={!!extractOptions[key]} onChange={() => setExtractOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 cursor-pointer focus:ring-indigo-500 focus:ring-2" />
                </div>
                <span className="text-[13px] font-semibold text-gray-700 capitalize group-hover:text-indigo-900 transition-colors">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Accuracy */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">AI Accuracy</p>
          <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner">
            {['Fast','Balanced','Accurate'].map(m => (
              <button key={m} onClick={() => setAccuracyMode(m)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                accuracyMode === m ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
              }`}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button onClick={onExtract} disabled={isProcessing} className={`w-full py-3.5 px-4 rounded-xl shadow-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-300 ${
          isProcessing ? 'bg-indigo-300 text-white cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25 hover:-translate-y-0.5'
        }`}>
          {isProcessing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Extracting AI Data...</> : <><Zap className="w-5 h-5" /> Extract Now</>}
        </button>
      </div>
    </div>
  );
}

function DataPanel({ extractStatus, progress, extractedData, confidence, onExport, onReset }) {
  let scalarData = [];
  let tables = [];
  if (extractedData && extractStatus === 'review') {
    const flat = flattenExtractedData(extractedData);
    scalarData = flat.scalarData;
    tables = flat.tables;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h2 className="font-extrabold text-gray-900 text-[15px]">Extracted Results</h2>
          {confidence > 0 && (
            <div className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-widest ${getConfidenceColor(confidence)}`}>
              Confidence: {confidence}%
            </div>
          )}
        </div>
        {extractStatus === 'review' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => onExport('excel')} className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => onExport('json')} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
              <FileJson className="w-4 h-4" /> JSON
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
            <button onClick={onReset} className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold transition-colors shadow-sm">
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {extractStatus === 'processing' ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <span className="text-indigo-600 font-extrabold text-sm">{progress}%</span>
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-gray-900 text-lg">AI Processing Document...</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">Extracting structured data dynamically</p>
            </div>
          </div>
        ) : extractStatus === 'review' && extractedData ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Scalar Fields */}
            {scalarData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scalarData.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <label className="text-[10px] font-extrabold text-indigo-500/80 uppercase tracking-widest mb-1">{item.Field}</label>
                    <div className="flex items-center gap-2">
                      <input type="text" defaultValue={item.Value} className="flex-1 bg-transparent text-[14px] font-semibold text-gray-900 outline-none border-b border-transparent focus:border-indigo-400 pb-0.5 transition-colors placeholder-gray-300" />
                      <Edit3 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tables */}
            {tables.length > 0 && (
              <div className="space-y-6">
                {tables.map((table, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-gray-100">
                      <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-widest">{table.key.replace(/_/g,' ')}</h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50">
                          <tr>
                            {Object.keys(table.data[0] || {}).map(th => (
                              <th key={th} className="px-5 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">{th.replace(/_/g,' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {table.data.map((row, i) => (
                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                              {Object.values(row).map((td, j) => (
                                <td key={j} className="px-5 py-3.5 font-medium text-gray-700 whitespace-nowrap">{String(td ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {scalarData.length === 0 && tables.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-semibold">No valid data fields were extracted from this document.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6 shadow-inner rotate-3">
              <Database className="w-10 h-10 text-indigo-400 -rotate-3" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Ready to Extract</h3>
            <p className="font-medium text-gray-500 max-w-sm">Configure your options in the sidebar and click the extract button to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExtractDataPage({ lang = 'en' }) {
  const [file, setFile]           = useState(null);
  const [mobileTab, setMobileTab] = useState('config');
  const [docType, setDocType]     = useState('invoice');
  const [accuracyMode, setAccuracyMode] = useState('Balanced');
  const [extractOptions, setExtractOptions] = useState(Object.fromEntries(EXTRACT_KEYS.map(k => [k, k !== 'signatures'])));
  const [extractStatus, setExtractStatus] = useState('idle');
  const [progress, setProgress]   = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfContextRef = useRef('');

  const onDrop = useCallback((accepted) => { if (accepted?.length > 0) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false });

  const handleStartExtraction = async () => {
    if (!file) return;
    setExtractStatus('processing');
    setProgress(10);
    try {
      const ab  = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      let fullCtx = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const tc   = await page.getTextContent();
        fullCtx += `\n--- PAGE ${i} ---\n${tc.items.map(it => it.str).join(' ')}`;
        setProgress(10 + Math.floor((i / doc.numPages) * 50));
      }
      pdfContextRef.current = fullCtx.slice(0, 80000);
      setProgress(65);
    } catch (err) {
      console.error(err);
      setExtractStatus('idle');
      alert('Error reading PDF.');
      return;
    }

    try {
      const activeFields = EXTRACT_KEYS.filter(k => extractOptions[k]).join(', ');
      const prompt = `You are a Data Extraction AI. Extract data from this ${docType}.
Return ONLY valid JSON, no markdown. Include "confidence" (0-100) and "data" object.
Fields: ${activeFields}
Example: {"confidence":92,"data":{"invoice_number":"INV-001","total":"5000","line_items":[{"item":"Laptop","price":"50000"}]}}
Text:\n${pdfContextRef.current}`;

      setProgress(80);
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Extract as JSON only.', pdfContext: '', history: [], customSystemPrompt: prompt })
      });
      setProgress(95);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const aiData = await res.json();
      let jsonStr = aiData.response || '';
      if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0];
      else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0];
      const parsed = JSON.parse(jsonStr.trim());
      setExtractedData(parsed.data || parsed);
      setConfidence(parsed.confidence || 88);
      setExtractStatus('review');
      setMobileTab('data');
    } catch (e) {
      console.error(e);
      setExtractStatus('idle');
      alert('Extraction failed. Please try again.');
    }
    setProgress(100);
  };

  const handleExport = (format) => {
    if (!extractedData) return;
    
    if (format === 'json') {
      const content = JSON.stringify(extractedData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `extracted_${docType}.json` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const flat = flattenExtractedData(extractedData);

      if (flat.scalarData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(flat.scalarData);
        ws['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Summary Data');
      }

      flat.tables.forEach((table, idx) => {
        let sheetName = String(table.key).replace(/_/g, ' ').substring(0, 31);
        if (!sheetName) sheetName = `Table ${idx + 1}`;
        const ws = XLSX.utils.json_to_sheet(table.data);
        const colWidths = Object.keys(table.data[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 15) }));
        if (colWidths.length > 0) ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      if (wb.SheetNames.length === 0) {
        const ws = XLSX.utils.json_to_sheet([{ "Message": "No recognizable tables or fields found." }]);
        XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
      }

      XLSX.writeFile(wb, `extracted_${docType}.xlsx`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Could not generate Excel file. Error: ' + err.message);
    }
  };

  const handleReset = () => { setExtractStatus('idle'); setExtractedData(null); setConfidence(0); setProgress(0); };

  if (!file) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-200/40 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-3xl w-full text-center space-y-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-indigo-100 text-indigo-700 font-extrabold text-[11px] tracking-wide mb-4">
              <Database className="w-3.5 h-3.5 text-indigo-500" /> AI-Powered Data Extraction Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
              Extract Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Like Magic.</span>
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Transform unstructured PDFs into clean, professional Excel spreadsheets instantly. Automate invoices, forms, and tables without typing a single word.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-[24px] p-8 md:p-10 cursor-pointer bg-white/80 backdrop-blur-xl shadow-lg max-w-xl mx-auto transition-all duration-300 relative group
              ${isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[1.02] shadow-indigo-500/20' : 'border-indigo-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5'}`}>
              <input {...getInputProps()} />
              
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-[24px] pointer-events-none"></div>

              <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Drag & Drop your PDF here</h3>
              <p className="text-slate-500 mb-6 text-xs font-medium">Invoices, ID Cards, Bank Statements & More</p>
              
              <span className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-md inline-flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> Select Document
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Workspace ──────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden font-sans">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button onClick={() => setFile(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 hidden sm:flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-[15px]">Extract Data</h1>
                <p className="text-xs text-slate-500 font-semibold truncate max-w-[200px] md:max-w-md">{file.name}</p>
              </div>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex md:hidden bg-slate-100 p-1.5 rounded-xl gap-1">
            {[['config','⚙️ Config'],['data','📊 Data'],['pdf','📄 PDF']].map(([id, label]) => (
              <button key={id} onClick={() => setMobileTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                mobileTab === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}>{label}</button>
            ))}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Config Panel */}
          <div className={`shrink-0 w-full md:w-[320px] border-r border-gray-200 z-10 ${mobileTab === 'config' ? 'block' : 'hidden md:block'}`}>
            <ConfigPanel
              docType={docType} setDocType={setDocType}
              extractOptions={extractOptions} setExtractOptions={setExtractOptions}
              accuracyMode={accuracyMode} setAccuracyMode={setAccuracyMode}
              onExtract={handleStartExtraction}
              isProcessing={extractStatus === 'processing'}
            />
          </div>

          {/* RIGHT: Dynamic View */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* Data Panel - Shows on Desktop only when extracting/reviewing */}
            <div className={`flex-1 overflow-hidden border-l border-gray-200 ${mobileTab === 'data' ? 'flex flex-col' : 'hidden'} ${extractStatus !== 'idle' ? 'md:flex md:flex-col' : 'md:hidden'}`}>
              <DataPanel
                extractStatus={extractStatus} progress={progress}
                extractedData={extractedData} confidence={confidence}
                onExport={handleExport} onReset={handleReset}
              />
            </div>

            {/* PDF Viewer - Shows on Desktop only initially (idle) */}
            <div className={`flex-1 overflow-hidden bg-slate-900 ${mobileTab === 'pdf' ? 'flex flex-col' : 'hidden'} ${extractStatus === 'idle' ? 'md:flex md:flex-col' : 'md:hidden'}`}>
              <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xs font-extrabold text-slate-300 tracking-wide">Source PDF Document</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <PDFViewer file={file} currentPage={currentPage} setCurrentPage={setCurrentPage} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
