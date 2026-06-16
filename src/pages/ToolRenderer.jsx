import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TOOLS_DATA } from '../data/tools';
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

export default function ToolRenderer({ lang = 'en' }) {
  const { toolSlug, platform } = useParams();
  const { t, i18n } = useTranslation();
  
  React.useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const tool = TOOLS_DATA.find((t) => slugify(t.title) === toolSlug);
  
  const esTitles = {
    'Merge PDF': 'Unir PDF',
    'Split PDF': 'Dividir PDF',
    'Compress PDF': 'Comprimir PDF',
    'PDF to Word': 'PDF a Word',
    'Word to PDF': 'Word a PDF',
    'PDF to JPG': 'PDF a JPG',
    'JPG to PDF': 'JPG a PDF',
    'Edit PDF': 'Editar PDF',
    'Sign PDF': 'Firmar PDF',
    'Watermark PDF': 'Marca de agua PDF',
    'Unlock PDF': 'Desbloquear PDF',
    'Extract Data': 'Extraer datos',
    'Translate PDF': 'Traducir PDF',
    'Chat with PDF': 'Chatear con PDF',
    'Plagiarism Check': 'Comprobar plagio'
  };

  const localizedTitle = lang === 'es' ? (esTitles[tool?.title] || tool?.title) : tool?.title;
  const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '';
  const displayTitle = platform ? `${localizedTitle} on ${platformName}` : localizedTitle;

  const dynamicSteps = (tool?.howToSteps || [
    `Select or drag and drop your file into the ${tool?.title} tool.`,
    `Click on the process button.`,
    `Download your processed file.`
  ]).map(step => injectPlatformContext(step, platform));

  const dynamicFaqs = (tool?.faqs || []).map(faq => ({
    question: injectPlatformContext(faq.question, platform),
    answer: injectPlatformContext(faq.answer, platform)
  }));

  const Component = customTools[toolSlug] || <ToolPage lang={lang} hideSEO={true} />;

  return (
    <div className="flex flex-col min-h-screen relative">
      <SEOHead 
        lang={lang}
        title={`${displayTitle} Online`} 
        description={tool?.desc || ''} 
        url={`/tools/${toolSlug}${platform ? '/' + platform : ''}`} 
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
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={`${lang === 'es' ? '/es' : ''}/tools/${toolSlug}/windows`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Windows
              </Link>
              <Link to={`${lang === 'es' ? '/es' : ''}/tools/${toolSlug}/mac`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Mac
              </Link>
              <Link to={`${lang === 'es' ? '/es' : ''}/tools/${toolSlug}/iphone`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                iPhone
              </Link>
              <Link to={`${lang === 'es' ? '/es' : ''}/tools/${toolSlug}/android`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-[#378ADD] transition-colors">
                Android
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
