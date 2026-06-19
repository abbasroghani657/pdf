import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { processWithQueue } from '../utils/queueApi';
import UpgradeModal from '../components/UpgradeModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useToolSession } from '../hooks/useToolSession';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const OCR_MODES = [
  {
    id: 'searchable',
    label: 'Searchable PDF',
    desc: 'Keep original layout, add invisible text layer',
    icon: 'solar:magnifer-zoom-in-linear',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    activeBorder: 'border-blue-500',
    tag: 'Most Popular',
    tagCls: 'bg-blue-100 text-blue-700',
    outputExt: '.pdf',
    outputMime: 'application/pdf',
  },
  {
    id: 'text',
    label: 'Extract Text',
    desc: 'Extract all text to a plain .txt file',
    icon: 'solar:text-bold-linear',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    activeBorder: 'border-emerald-500',
    tag: 'Fast',
    tagCls: 'bg-emerald-100 text-emerald-700',
    outputExt: '.txt',
    outputMime: 'text/plain',
  },
  {
    id: 'tables',
    label: 'Extract Tables',
    desc: 'Detect tables and export to Excel (.xlsx)',
    icon: 'solar:table-linear',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
    activeBorder: 'border-violet-500',
    tag: 'Excel',
    tagCls: 'bg-violet-100 text-violet-700',
    outputExt: '.xlsx',
    outputMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'arabic',
    label: 'Arabic / Urdu (RTL)',
    desc: 'Specialized engine for Arabic, Urdu and RTL languages',
    icon: 'solar:text-square-bold',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    activeBorder: 'border-rose-500',
    tag: 'RTL',
    tagCls: 'bg-rose-100 text-rose-700',
    outputExt: '.pdf',
    outputMime: 'application/pdf',
  },
];

const LANGUAGES = [
  {"code": "afr", "label": "Afrikaans"}, {"code": "sqi", "label": "Albanian"}, {"code": "amh", "label": "Amharic"},
  {"code": "ara", "label": "Arabic"}, {"code": "hye", "label": "Armenian"}, {"code": "asm", "label": "Assamese"},
  {"code": "aze_cyrl", "label": "Azerbaijani - Cyrillic"}, {"code": "aze", "label": "Azerbaijani"}, {"code": "eus", "label": "Basque"},
  {"code": "bel", "label": "Belarusian"}, {"code": "ben", "label": "Bengali"}, {"code": "bos", "label": "Bosnian"},
  {"code": "bre", "label": "Breton"}, {"code": "bul", "label": "Bulgarian"}, {"code": "mya", "label": "Burmese"},
  {"code": "cat", "label": "Catalan"}, {"code": "ceb", "label": "Cebuano"}, {"code": "khm", "label": "Central Khmer"},
  {"code": "chr", "label": "Cherokee"}, {"code": "chi_sim", "label": "Chinese - Simplified"}, {"code": "chi_tra", "label": "Chinese - Traditional"},
  {"code": "cos", "label": "Corsican"}, {"code": "hrv", "label": "Croatian"}, {"code": "ces", "label": "Czech"},
  {"code": "dan", "label": "Danish"}, {"code": "nld", "label": "Dutch; Flemish"}, {"code": "dzo", "label": "Dzongkha"},
  {"code": "enm", "label": "English, Middle (1100-1500)"}, {"code": "eng", "label": "English"}, {"code": "epo", "label": "Esperanto"},
  {"code": "est", "label": "Estonian"}, {"code": "fao", "label": "Faroese"}, {"code": "tgl", "label": "Filipino (Old - Tagalog)"},
  {"code": "fin", "label": "Finnish"}, {"code": "frm", "label": "French, Middle (ca. 1400-1600)"}, {"code": "fra", "label": "French"},
  {"code": "glg", "label": "Galician"}, {"code": "kat_old", "label": "Georgian - Old"}, {"code": "kat", "label": "Georgian"},
  {"code": "frk", "label": "German (Fraktur Latin)"}, {"code": "deu", "label": "German"}, {"code": "grc", "label": "Greek, Ancient"},
  {"code": "ell", "label": "Greek, Modern (1453-)"}, {"code": "guj", "label": "Gujarati"}, {"code": "hat", "label": "Haitian; Haitian Creole"},
  {"code": "heb", "label": "Hebrew"}, {"code": "hin", "label": "Hindi"}, {"code": "hun", "label": "Hungarian"},
  {"code": "isl", "label": "Icelandic"}, {"code": "ind", "label": "Indonesian"}, {"code": "iku", "label": "Inuktitut"},
  {"code": "gle", "label": "Irish"}, {"code": "ita_old", "label": "Italian - Old"}, {"code": "ita", "label": "Italian"},
  {"code": "jpn", "label": "Japanese"}, {"code": "jav", "label": "Javanese"}, {"code": "kan", "label": "Kannada"},
  {"code": "kaz", "label": "Kazakh"}, {"code": "kir", "label": "Kirghiz; Kyrgyz"}, {"code": "kor_vert", "label": "Korean (Vertical)"},
  {"code": "kor", "label": "Korean"}, {"code": "kmr", "label": "Kurmanji (Kurdish - Latin Script)"}, {"code": "lao", "label": "Lao"},
  {"code": "lat", "label": "Latin"}, {"code": "lav", "label": "Latvian"}, {"code": "lit", "label": "Lithuanian"},
  {"code": "ltz", "label": "Luxembourgish"}, {"code": "mkd", "label": "Macedonian"}, {"code": "msa", "label": "Malay"},
  {"code": "mal", "label": "Malayalam"}, {"code": "mlt", "label": "Maltese"}, {"code": "mri", "label": "Maori"},
  {"code": "mar", "label": "Marathi"}, {"code": "equ", "label": "Math / Equation Detection"}, {"code": "mon", "label": "Mongolian"},
  {"code": "nep", "label": "Nepali"}, {"code": "nor", "label": "Norwegian"}, {"code": "oci", "label": "Occitan (Post 1500)"},
  {"code": "ori", "label": "Oriya"}, {"code": "pan", "label": "Panjabi; Punjabi"}, {"code": "fas", "label": "Persian"},
  {"code": "pol", "label": "Polish"}, {"code": "por", "label": "Portuguese"}, {"code": "pus", "label": "Pushto; Pashto"},
  {"code": "que", "label": "Quechua"}, {"code": "ron", "label": "Romanian; Moldavian; Moldovan"}, {"code": "rus", "label": "Russian"},
  {"code": "san", "label": "Sanskrit"}, {"code": "gla", "label": "Scottish Gaelic"}, {"code": "srp_latn", "label": "Serbian - Latin"},
  {"code": "srp", "label": "Serbian"}, {"code": "snd", "label": "Sindhi"}, {"code": "sin", "label": "Sinhala; Sinhalese"},
  {"code": "slk", "label": "Slovak"}, {"code": "slv", "label": "Slovenian"}, {"code": "spa_old", "label": "Spanish - Old"},
  {"code": "spa", "label": "Spanish"}, {"code": "sun", "label": "Sundanese"}, {"code": "swa", "label": "Swahili"},
  {"code": "swe", "label": "Swedish"}, {"code": "syr", "label": "Syriac"}, {"code": "tgk", "label": "Tajik"},
  {"code": "tam", "label": "Tamil"}, {"code": "tat", "label": "Tatar"}, {"code": "tel", "label": "Telugu"},
  {"code": "tha", "label": "Thai"}, {"code": "bod", "label": "Tibetan"}, {"code": "tir", "label": "Tigrinya"},
  {"code": "ton", "label": "Tonga"}, {"code": "tur", "label": "Turkish"}, {"code": "uig", "label": "Uighur; Uyghur"},
  {"code": "ukr", "label": "Ukrainian"}, {"code": "urd", "label": "Urdu"}, {"code": "uzb_cyrl", "label": "Uzbek - Cyrillic"},
  {"code": "uzb", "label": "Uzbek"}, {"code": "vie", "label": "Vietnamese"}, {"code": "cym", "label": "Welsh"},
  {"code": "fry", "label": "Western Frisian"}, {"code": "yid", "label": "Yiddish"}, {"code": "yor", "label": "Yoruba"}
];

const SearchableLanguageSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = LANGUAGES.filter(l => l.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLang = LANGUAGES.find(l => l.code === value);

  return (
    <div className="relative w-full max-w-sm" ref={wrapperRef}>
      <div 
        className="flex items-center justify-between w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={clsx("text-sm font-semibold", selectedLang ? "text-gray-900" : "text-gray-400")}>
          {selectedLang ? selectedLang.label : "Select a language..."}
        </span>
        <iconify-icon icon="solar:alt-arrow-down-linear" class="text-gray-400 text-lg"></iconify-icon>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></iconify-icon>
              <input
                type="text"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 text-sm font-medium bg-gray-50 border border-transparent rounded-lg focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="Search language (e.g. Arabic, French)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm font-medium text-gray-500">No languages found.</div>
            ) : (
              filtered.map(l => (
                <button
                  key={l.code}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                    value === l.code ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 font-medium hover:bg-gray-50"
                  )}
                  onClick={() => {
                    onChange(l.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {l.label}
                  {value === l.code && <iconify-icon icon="solar:check-circle-bold" class="text-blue-600 text-lg"></iconify-icon>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OCRPage({ lang = 'en' }) {
  const { isPro } = useAuth();
  const [state, setState] = useState('idle'); // idle | selected | processing | done | error
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('searchable');
  const [language, setLanguage] = useState('eng');
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState(null); // { bytes, pages, accuracy, filename }
  const [errorMsg, setErrorMsg] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  const activeMode = OCR_MODES.find(m => m.id === mode);

  // ── Session persistence ──────────────────────────────────────────────────
  const { clearSession } = useToolSession(
    'ocr',
    { mode, language },
    file,
    ({ state: s, bytes, fileName }) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const f = new File([blob], fileName, { type: 'application/pdf' });
      setFile(f);
      setMode(s?.mode || 'searchable');
      setLanguage(s?.language || 'eng');
      setState('selected');
    },
    state === 'selected' || state === 'done'
  );
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file.');
      setState('error');
      return;
    }
    if (f.size > (isPro ? 100 * 1024 * 1024 : 10 * 1024 * 1024)) {
      setIsUpgradeOpen(true);
      return;
    }
    setFile(f);
    setState('selected');
    setErrorMsg('');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleOCR = async () => {
    if (!file) return;
    setState('processing');
    setProgress(0);

    const labels = [
      'Uploading PDF...',
      'Converting pages to images...',
      'Running OCR engine...',
      'Recognizing characters...',
      'Building text layer...',
      'Finalizing output...',
    ];
    let p = 0;
    let labelIdx = 0;
    progressRef.current = setInterval(() => {
      const inc = p < 30 ? 1.2 : p < 60 ? 0.9 : p < 85 ? 0.5 : 0.15;
      p = Math.min(p + inc, 95);
      setProgress(p);
      const newIdx = Math.min(Math.floor((p / 95) * labels.length), labels.length - 1);
      if (newIdx !== labelIdx) { labelIdx = newIdx; }
      setProgressLabel(labels[labelIdx]);
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'OCR PDF');
      formData.append('mode', mode);
      formData.append('language', language);

      const response = await processWithQueue('/api/process', formData, (status) => {
        if (status.type === 'queued') {
           setQueuePosition(status.position);
        } else if (status.type === 'processing') {
           setQueuePosition(null);
        }
      });

      const blob = await response.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const pages = parseInt(response.headers.get('X-OCR-Pages')) || '?';
      const accuracy = response.headers.get('X-OCR-Accuracy') || '~95';

      clearInterval(progressRef.current);
      setProgress(100);
      setProgressLabel('Done!');

      const baseName = file.name.replace(/\.pdf$/i, '');
      const ext = activeMode.outputExt;

      setTimeout(() => {
        setResult({ bytes, pages, accuracy, filename: `${baseName}_ocr${ext}`, mime: activeMode.outputMime });
        setState('done');
      }, 300);
    } catch (err) {
      clearInterval(progressRef.current);
      setErrorMsg(err.message || 'OCR failed. Please try again.');
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.bytes], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('OCR file downloaded!');
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setProgress(0);
    setErrorMsg('');
    setQueuePosition(null);
    clearSession();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 bg-blue-50 text-blue-600">
          <iconify-icon icon="solar:scanner-linear" class="text-3xl" stroke-width="1.5"></iconify-icon>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">OCR PDF</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Make scanned PDFs searchable, selectable &amp; editable. Supports 100+ languages including Urdu &amp; Arabic.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-4xl mx-auto">
        <div className="px-6 py-6 md:px-10 md:py-8 space-y-6">

          {/* ── IDLE ── */}
          {state === 'idle' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={clsx(
                  'relative border-2 border-dashed rounded-3xl py-10 px-6 flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden',
                  isDragging ? 'drag-over border-blue-500 bg-blue-50/50' : 'border-blue-200 hover:border-blue-500/50 hover:bg-blue-50/30 bg-blue-50/10'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                  isDragging ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30' : 'bg-white text-blue-600 group-hover:scale-110 group-hover:shadow-md'
                )}>
                  <iconify-icon icon="solar:upload-minimalistic-bold" class="text-3xl"></iconify-icon>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {isDragging ? 'Drop your scanned PDF' : 'Drag & drop your scanned PDF'}
                </p>
                <p className="text-sm text-gray-500 mb-6">PDF only · up to 10 MB for free users · works on any scanned document</p>
                <button type="button" className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-0 pointer-events-none">
                  Choose PDF File
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-400 mt-2">
                {[
                  { icon: 'solar:shield-check-linear', label: '256-bit SSL' },
                  { icon: 'solar:trash-bin-trash-linear', label: 'Auto-deleted 2h' },
                  { icon: 'solar:eye-closed-linear', label: 'Private' },
                  { icon: 'solar:global-linear', label: '100+ Languages' },
                ].map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <iconify-icon icon={b.icon} class="text-lg"></iconify-icon>
                    {b.label}
                  </span>
                ))}
              </div>


            </>
          )}

          {/* ── SELECTED ── */}
          {state === 'selected' && file && (
            <div className="space-y-8">
              {/* File info */}
              <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)} · Scanned PDF</p>
                </div>
                <button onClick={handleReset} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <iconify-icon icon="solar:trash-bin-trash-linear" class="text-xl"></iconify-icon>
                </button>
              </div>

              {/* OCR Mode picker */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">Select OCR Mode</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OCR_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMode(m.id);
                        if (m.id === 'arabic') {
                          if (language !== 'ara' && language !== 'urd' && language !== 'heb') {
                            setLanguage('ara');
                          }
                        }
                      }}
                      className={clsx(
                        'flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left',
                        mode === m.id
                          ? `${m.bg} ${m.activeBorder} shadow-sm`
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', mode === m.id ? m.bg : 'bg-gray-100')}>
                        <iconify-icon icon={m.icon} class={clsx('text-xl', mode === m.id ? m.color : 'text-gray-400')}></iconify-icon>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={clsx('text-sm font-bold', mode === m.id ? 'text-gray-900' : 'text-gray-700')}>{m.label}</span>
                          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', m.tagCls)}>{m.tag}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language picker */}
              <div className="z-10 relative">
                <p className="text-sm font-semibold text-gray-700 mb-3">Document Language</p>
                <SearchableLanguageSelect value={language} onChange={setLanguage} />
                <p className="text-xs text-gray-400 mt-2">
                  Select the primary language of your document for best OCR accuracy.
                </p>
              </div>

              {/* Mode info */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <iconify-icon icon="solar:info-circle-linear" class="text-gray-400 text-lg mt-0.5"></iconify-icon>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{activeMode?.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Output: <strong>{activeMode?.outputExt}</strong> · {activeMode?.desc}</p>
                </div>
              </div>

              {/* Run OCR button */}
              <button
                onClick={handleOCR}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <iconify-icon icon="solar:scanner-bold" class="text-xl"></iconify-icon>
                Run OCR Now
              </button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {state === 'processing' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:file-bold" class="text-2xl"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{file?.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file?.size || 0)}</p>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="pulse-dot w-2.5 h-2.5 bg-[#378ADD] rounded-full inline-block"></span>
                    {queuePosition ? `You are #${queuePosition} in queue...` : progressLabel}
                  </span>
                  <span className="text-blue-600 text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium pt-1">{progressLabel}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                {[
                  { icon: 'solar:cpu-bolt-linear', label: 'OCR Engine', val: 'Tesseract v5' },
                  { icon: 'solar:global-linear', label: 'Language', val: LANGUAGES.find(l => l.code === language)?.label },
                  { icon: 'solar:layers-linear', label: 'Mode', val: activeMode?.label },
                ].map((s, i) => (
                  <div key={i}>
                    <iconify-icon icon={s.icon} class="text-blue-400 text-xl mb-1"></iconify-icon>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {state === 'done' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="success-icon w-24 h-24 mx-auto rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center shadow-sm mb-4">
                  <iconify-icon icon="solar:check-circle-bold" class="text-5xl text-blue-500"></iconify-icon>
                </div>
                <p className="text-xl font-bold text-gray-900">OCR Complete!</p>
                <p className="text-sm text-gray-500 mt-2">Your PDF has been successfully processed.</p>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { icon: 'solar:documents-linear', label: 'Pages OCR\'d', val: result.pages },
                    { icon: 'solar:chart-square-linear', label: 'Est. Accuracy', val: `${result.accuracy}%` },
                    { icon: 'solar:file-download-linear', label: 'Output Format', val: activeMode?.outputExt.toUpperCase() },
                  ].map((s, i) => (
                    <div key={i}>
                      <iconify-icon icon={s.icon} class="text-blue-400 text-2xl mb-2"></iconify-icon>
                      <p className="text-xl font-extrabold text-blue-600">{s.val}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-blue-200/50 space-y-2">
                  {[
                    { icon: 'solar:cursor-linear', label: 'Text is now selectable', ok: true },
                    { icon: 'solar:magnifer-linear', label: 'Ctrl+F search now works', ok: true },
                    { icon: 'solar:copy-linear', label: 'Copy & paste enabled', ok: true },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <iconify-icon icon="solar:check-circle-bold" class="text-green-500 text-base shrink-0"></iconify-icon>
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                >
                  <iconify-icon icon="solar:download-minimalistic-bold" class="text-xl"></iconify-icon>
                  Download {result.filename.split('_ocr')[1]?.toUpperCase().replace('.', '') || 'File'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl text-base font-semibold transition-all"
                >
                  OCR Another PDF
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 pt-2">
                File will be automatically deleted from our servers in 2 hours
              </p>
            </div>
          )}

          {/* ── ERROR ── */}
          {state === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center shadow-sm">
                <iconify-icon icon="solar:close-circle-bold" class="text-5xl text-red-500"></iconify-icon>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">OCR Failed</p>
                <p className="text-sm text-gray-500 mt-2">{errorMsg}</p>
              </div>

              <button onClick={handleReset} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        featureName="OCR (Optical Character Recognition)" 
        limitMessage="Files over 10MB require a Pro account for OCR processing. Upgrade to Pro for unlimited access."
      />
    </div>
  );
}
