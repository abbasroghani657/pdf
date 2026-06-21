import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { TOOLS_DATA_FR } from '../data/tools-fr';
import { slugify } from '../utils/slugify';
import SEOHead from '../components/SEOHead';
import ToolPage from './ToolPage';

import MergePDFPage from './MergePDFPage';
import CompressPage from './CompressPage';
import DeletePagesPage from './DeletePagesPage';
import SplitPagesPage from './SplitPagesPage';
import ProtectPDFPage from './ProtectPDFPage';
import UnlockPDFPage from './UnlockPDFPage';
import RedactPDFPage from './RedactPDFPage';
import RotatePagesPage from './RotatePagesPage';
import ReorderPagesPage from './ReorderPagesPage';
import BlankPagesPage from './BlankPagesPage';
import SignPDFPage from './SignPDFPage';
import RequestSignaturePage from './RequestSignaturePage';
import RepairPage from './RepairPage';
import AddTextPage from './AddTextPage';
import OCRPage from './OCRPage';
import FlattenPDFPage from './FlattenPDFPage';
import CertificateSignPage from './CertificateSignPage';
import EditPDFPage from './EditPDFPage';
import WatermarkPDFPage from './WatermarkPDFPage';
import FillPDFFormsPage from './FillPDFFormsPage';
import PageNumbersPage from './PageNumbersPage';
import AnnotatePDFPage from './AnnotatePDFPage';
import ChatPDFPage from './ChatPDFPage';
import SummarizePDFPage from './SummarizePDFPage';
import TranslatePDFPage from './TranslatePDFPage';
import ExtractDataPage from './ExtractDataPage';
import PlagiarismCheckPage from './PlagiarismCheckPage';

// ─── ERROR BOUNDARY ────────────────────────────────────────────────────────────
// Catches silent React render errors that would otherwise show a blank white page
class ToolErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('ToolRenderer caught a render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-6">We encountered an error loading this tool. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#378ADD] text-white rounded-xl font-semibold hover:bg-[#2b71b8] transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── CUSTOM TOOL MAP ───────────────────────────────────────────────────────────
const customTools = {
  'merge-pdf': <MergePDFPage />,
  'compress-pdf': <CompressPage />,
  'delete-pages': <DeletePagesPage />,
  'split-pdf': <SplitPagesPage />,
  'protect-pdf': <ProtectPDFPage />,
  'unlock-pdf': <UnlockPDFPage />,
  'redact-pdf': <RedactPDFPage />,
  'rotate-pdf': <RotatePagesPage />,
  'reorder-pages': <ReorderPagesPage />,
  'add-blank-page': <BlankPagesPage />,
  'sign-pdf': <SignPDFPage />,
  'request-signature': <RequestSignaturePage />,
  'repair-pdf': <RepairPage />,
  'add-text-to-pdf': <AddTextPage />,
  'ocr-pdf': <OCRPage />,
  'flatten-pdf': <FlattenPDFPage />,
  'certificate-sign': <CertificateSignPage />,
  'edit-pdf': <EditPDFPage />,
  'watermark-pdf': <WatermarkPDFPage />,
  'pdf-forms': <FillPDFFormsPage />,
  'add-page-numbers': <PageNumbersPage />,
  'annotate-pdf': <AnnotatePDFPage />,
  'chat-with-pdf': <ChatPDFPage />,
  'summarize-pdf': <SummarizePDFPage />,
  'translate-pdf': <TranslatePDFPage />,
  'extract-data': <ExtractDataPage />,
  'plagiarism-check': <PlagiarismCheckPage />
};

// ─── INNER COMPONENT ───────────────────────────────────────────────────────────
function ToolRendererInner({ lang = 'en' }) {
  const { toolSlug, platform } = useParams();
  const { t, i18n } = useTranslation();
  
  React.useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const enToolIndex = TOOLS_DATA.findIndex(t => slugify(t.title) === toolSlug);
  const toolDataList = lang === 'es' ? TOOLS_DATA_ES : lang === 'fr' ? TOOLS_DATA_FR : TOOLS_DATA;
  const tool = toolDataList[enToolIndex];
  
  const localizedTitle = tool?.title;

  const Component = customTools[toolSlug] 
    ? React.cloneElement(customTools[toolSlug], { lang, toolSlug }) 
    : <ToolPage lang={lang} hideSEO={true} />;
    
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '';
  const displayTitle = platform ? `${localizedTitle} on ${platformName}` : localizedTitle;
  const currentUrl = `${lang === 'en' ? '' : '/' + lang}/tools/${toolSlug}${platform ? '/' + platform : ''}`;

  const dynamicSteps = (tool?.howToSteps || [
    `Select or drag and drop your file into the ${localizedTitle || 'PDF'} tool.`,
    `Click on the process button.`,
    `Download your processed file.`
  ]).map(step => injectPlatformContext(step, platform));

  const dynamicFaqs = (tool?.faqs || []).map(faq => ({
    question: injectPlatformContext(faq.question, platform),
    answer: injectPlatformContext(faq.answer, platform)
  }));

  return (
    <div className="flex flex-col min-h-screen relative">
      <SEOHead 
        lang={lang}
        title={displayTitle} 
        description={tool?.desc || ''} 
        url={currentUrl} 
        toolName={displayTitle}
        howToSteps={dynamicSteps}
        faqs={dynamicFaqs}
      />
      
      <div className="flex-grow z-10">
        {Component}
      </div>

      {tool && (
        <div className="relative z-0 py-20 px-4 bg-white/50">
          <div className="max-w-4xl mx-auto text-left bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('howToUse')} {localizedTitle}</h2>
            <div className="space-y-4 mb-12">
              {dynamicSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#378ADD] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-gray-600 mt-1">{step}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('faqs')}</h2>
            <div className="space-y-6">
              {dynamicFaqs.map((faq, idx) => (
                <div key={idx} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 max-w-4xl mx-auto text-center mb-20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t('platformGuides')}</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link to={`${lang === 'en' ? '' : '/' + lang}/tools/${toolSlug}/windows`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Windows
              </Link>
              <Link to={`${lang === 'en' ? '' : '/' + lang}/tools/${toolSlug}/mac`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Mac
              </Link>
              <Link to={`${lang === 'en' ? '' : '/' + lang}/tools/${toolSlug}/iphone`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                iPhone
              </Link>
              <Link to={`${lang === 'en' ? '' : '/' + lang}/tools/${toolSlug}/android`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Android
              </Link>
            </div>

            {/* Related Tools — FIXED: was using rt.color (undefined) causing silent crash */}
            <h3 className="text-2xl font-bold text-gray-900 mb-8">{t('relatedTools') || 'Related Tools'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
              {toolDataList.filter(rt => rt.title !== localizedTitle).slice(0, 6).map((rt, idx) => (
                <Link
                  key={idx}
                  to={`${lang === 'en' ? '' : '/' + lang}/tools/${slugify(rt.title)}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#378ADD]/30 transition-all group"
                >
                  {/* FIX: TOOLS_DATA uses iconColorClass, NOT color */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rt.iconColorClass || 'bg-blue-50 text-blue-500'} group-hover:scale-110 transition-transform`}>
                    <iconify-icon icon={rt.icon} class="text-xl"></iconify-icon>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#378ADD] transition-colors line-clamp-1">{rt.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{rt.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EXPORTED COMPONENT (with ErrorBoundary) ────────────────────────────────────
export default function ToolRenderer({ lang = 'en' }) {
  return (
    <ToolErrorBoundary>
      <ToolRendererInner lang={lang} />
    </ToolErrorBoundary>
  );
}

// ─── PLATFORM CONTEXT INJECTION ───────────────────────────────────────────────
function injectPlatformContext(text, platform) {
  if (!platform || !text) return text;
  const p = platform.toLowerCase();
  
  let result = text;
  if (p === 'mac') {
    result = result.replace(/your device/gi, 'your Mac');
    result = result.replace(/your computer/gi, 'your Mac');
    result = result.replace(/any device/gi, 'any Mac or Apple device');
    result = result.replace(/web browser/gi, 'Safari or Chrome browser');
  } else if (p === 'windows') {
    result = result.replace(/your device/gi, 'your Windows PC');
    result = result.replace(/your computer/gi, 'your Windows PC');
    result = result.replace(/any device/gi, 'any Windows device');
    result = result.replace(/web browser/gi, 'Edge or Chrome browser');
  } else if (p === 'iphone') {
    result = result.replace(/your device/gi, 'your iPhone');
    result = result.replace(/your computer/gi, 'your iPhone');
    result = result.replace(/any device/gi, 'any iOS device');
    result = result.replace(/web browser/gi, 'Safari browser');
    result = result.replace(/drag and drop/gi, 'select');
    result = result.replace(/dragging/gi, 'selecting');
  } else if (p === 'android') {
    result = result.replace(/your device/gi, 'your Android phone');
    result = result.replace(/your computer/gi, 'your Android device');
    result = result.replace(/any device/gi, 'any Android device');
    result = result.replace(/web browser/gi, 'Chrome browser');
    result = result.replace(/drag and drop/gi, 'select');
  }
  return result;
}
