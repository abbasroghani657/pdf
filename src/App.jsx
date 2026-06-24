
const SUPPORTED_LANGS = [
  'es', 'fr', 'de', 'pt', 'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko',
  'it', 'pl', 'ro', 'bg', 'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th',
  'tr', 'uk', 'vi', 'sw', 'fi', 'da', 'no', 'cs'
];
const LANG_PREFIX_REGEX = new RegExp('^/(' + SUPPORTED_LANGS.join('|') + ')(/|$)');
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useNavigationType, Navigate } from 'react-router-dom';
import { 
  DocumentTextIcon, SparklesIcon, DocumentDuplicateIcon, 
  DocumentArrowDownIcon, PencilSquareIcon, AdjustmentsHorizontalIcon, ScissorsIcon,
  ShieldCheckIcon, LockOpenIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Toaster, toast } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import ComparePage from './pages/ComparePage';
import ToolPage from './pages/ToolPage';
import ToolRenderer from './pages/ToolRenderer';
import CompressPage from './pages/CompressPage';
import DeletePagesPage from './pages/DeletePagesPage';
import SplitPagesPage from './pages/SplitPagesPage';
import ProtectPDFPage from './pages/ProtectPDFPage';
import UnlockPDFPage from './pages/UnlockPDFPage';
import RedactPDFPage from './pages/RedactPDFPage';
import RotatePagesPage from './pages/RotatePagesPage';
import ReorderPagesPage from './pages/ReorderPagesPage';
import BlankPagesPage from './pages/BlankPagesPage';
import SignPDFPage from './pages/SignPDFPage';
import RequestSignaturePage from './pages/RequestSignaturePage';
import RepairPage from './pages/RepairPage';
import AddTextPage from './pages/AddTextPage';
import OCRPage from './pages/OCRPage';
import FlattenPDFPage from './pages/FlattenPDFPage';
import CertificateSignPage from './pages/CertificateSignPage';
import EditPDFPage from './pages/EditPDFPage';
import WatermarkPDFPage from './pages/WatermarkPDFPage';
import FillPDFFormsPage from './pages/FillPDFFormsPage';
import PageNumbersPage from './pages/PageNumbersPage';
import { slugify } from './utils/slugify';
import { UI_DICT as UI_EN } from './data/ui-en.js';
import SigningPage from './pages/SigningPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import PDFTrendsPage from './pages/PDFTrendsPage';
import DesktopAppPage from './pages/DesktopAppPage';
import ExtensionPage from './pages/ExtensionPage';
import UseCasePage from './pages/UseCasePage';
import AnnotatePDFPage from './pages/AnnotatePDFPage';
import ChatPDFPage from './pages/ChatPDFPage';
import SummarizePDFPage from './pages/SummarizePDFPage';
import TranslatePDFPage from './pages/TranslatePDFPage';
import ExtractDataPage from './pages/ExtractDataPage';
import PlagiarismCheckPage from './pages/PlagiarismCheckPage';
import MergePDFPage from './pages/MergePDFPage';
import NotFoundPage from './pages/NotFoundPage';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminJobs from './pages/admin/AdminJobs';
import AdminTools from './pages/admin/AdminTools';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminEmails from './pages/admin/AdminEmails';
import AdminSupport from './pages/admin/AdminSupport';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import MockCheckoutPage from './pages/MockCheckoutPage';
import { useAuth } from './contexts/AuthContext';
import AcceptInvite from './pages/AcceptInvite';
import InviteResponse from './pages/InviteResponse';
import ProtectedRoute from './components/ProtectedRoute';
import Logo from './components/Logo';

const PORTAL = import.meta.env.VITE_ADMIN_PORTAL_PATH || '/x-portal-9f3a';

// ─── MOBILE NAVIGATION DRAWER ─────────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, pathname, onNav, user, logout, ui }) {
  const links = [
    { id: '/', label: ui.mobile_nav.all_tools, icon: 'solar:box-linear' },
    { id: '/pricing', label: ui.mobile_nav.pricing, icon: 'solar:tag-price-linear' },
    { id: '/compare', label: ui.mobile_nav.why_us, icon: 'solar:chart-square-linear' },
  ];
  const quickTools = [
    { path: '/tools/merge-pdf', label: ui.mobile_nav.merge_pdf, icon: 'solar:layers-linear', color: 'text-blue-600' },
    { path: '/tools/split-pdf', label: ui.mobile_nav.split_pdf, icon: 'solar:scissors-linear', color: 'text-amber-600' },
    { path: '/tools/compress-pdf', label: ui.mobile_nav.compress_pdf, icon: 'solar:archive-minimalistic-linear', color: 'text-emerald-600' },
    { path: '/tools/pdf-to-word', label: ui.mobile_nav.pdf_to_word, icon: 'solar:file-text-linear', color: 'text-indigo-600' },
    { path: '/tools/word-to-pdf', label: ui.mobile_nav.word_to_pdf, icon: 'solar:document-add-linear', color: 'text-blue-600' },
    { path: '/tools/jpg-to-pdf', label: ui.mobile_nav.jpg_to_pdf, icon: 'solar:images-linear', color: 'text-orange-500' },
    { path: '/tools/protect-pdf', label: ui.mobile_nav.protect_pdf, icon: 'solar:lock-password-linear', color: 'text-red-600' },
    { path: '/tools/sign-pdf', label: ui.mobile_nav.sign_pdf, icon: 'solar:pen-linear', color: 'text-violet-600' },
    { path: '/tools/redact-pdf', label: ui.mobile_nav.redact_pdf, icon: 'solar:shield-cross-linear', color: 'text-red-500' },
    { path: '/tools/ocr-pdf', label: ui.mobile_nav.ocr_pdf, icon: 'solar:text-square-linear', color: 'text-teal-600' },
  ];
  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-[105] bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div className={clsx(
        'fixed inset-y-0 right-0 z-[110] w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100">
          <Logo size="sm" />
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <iconify-icon icon="solar:hamburger-menu-linear" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Main Nav */}
          <div className="py-4 px-4 space-y-1 border-b border-gray-100">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => { onNav(link.id); onClose(); }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-colors',
                  pathname === link.id ? 'bg-[#378ADD]/10 text-[#378ADD]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <iconify-icon icon={link.icon} class="text-lg"></iconify-icon>
                {link.label}
              </button>
            ))}
          </div>

          {/* Quick Tool Links */}
          <div className="py-4 px-4">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">{ui.mobile_nav.popular_tools}</p>
            <div className="grid grid-cols-2 gap-2">
              {quickTools.map(t => (
                <button
                  key={t.path}
                  onClick={() => { onNav(t.path); onClose(); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors border border-gray-100"
                >
                  <iconify-icon icon={t.icon} class={`text-base ${t.color}`}></iconify-icon>
                  <span className="text-xs font-semibold text-gray-700 leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3 pb-safe pb-6">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                  {user.profile?.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.profile?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={() => { onNav('/dashboard'); onClose(); }} className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                {ui.mobile_nav.dashboard}
              </button>
              <button onClick={() => { logout(); onClose(); }} className="w-full py-2.5 text-sm font-semibold text-red-600 border border-red-100 hover:bg-red-50 rounded-xl transition-colors">
                {ui.mobile_nav.logout}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { onNav('/login'); onClose(); }} className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                {ui.mobile_nav.log_in}
              </button>
              <button onClick={() => { onNav('/register'); onClose(); }} className="w-full py-2.5 text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl transition-colors shadow-sm">
                {ui.mobile_nav.sign_up_free}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
// ─── LANGUAGE SWITCHER COMPONENT ──────────────────────────────────────────────
const LanguageSwitcher = ({ location, navigate, currentLangCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = currentLangCode.toUpperCase();
  
  const switchLang = (targetLang) => {
    let newPath = location.pathname;
    newPath = newPath.replace(LANG_PREFIX_REGEX, '/');
    if (!newPath.startsWith('/')) newPath = '/' + newPath;
    
    if (targetLang.toLowerCase() !== 'en') {
      newPath = `/${targetLang.toLowerCase()}${newPath === '/' ? '' : newPath}`;
    }
    
    if (newPath === '') newPath = '/';
    navigate(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5"
        title="Change Language"
      >
        <iconify-icon icon="solar:global-linear" class="text-base"></iconify-icon>
        {currentLang}
        <iconify-icon icon="solar:alt-arrow-down-linear" class="text-xs ml-0.5"></iconify-icon>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-1 max-h-96 overflow-y-auto">
            <button 
              onClick={() => switchLang('EN')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'EN' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              English
            </button>
            <button 
              onClick={() => switchLang('ES')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'ES' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Español
            </button>
            <button 
              onClick={() => switchLang('FR')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'FR' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Français
            </button>
            <button 
              onClick={() => switchLang('DE')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'DE' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Deutsch
            </button>
            <button 
              onClick={() => switchLang('PT')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'PT' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Português
            </button>
            <button 
              onClick={() => switchLang('HI')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'HI' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              हिन्दी
            </button>
            <button 
              onClick={() => switchLang('RU')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'RU' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Pусский
            </button>
            <button 
              onClick={() => switchLang('ZH-CN')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'ZH-CN' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              中文 (简体)
            </button>
            <button 
              onClick={() => switchLang('ZH-TW')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'ZH-TW' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              中文 (繁體)
            </button>
            <button 
              onClick={() => switchLang('JA')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'JA' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              日本語
            </button>
            <button 
              onClick={() => switchLang('KO')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'KO' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              한국어
            </button>
            <button 
              onClick={() => switchLang('IT')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'IT' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Italiano
            </button>
            <button 
              onClick={() => switchLang('PL')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'PL' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Polski
            </button>
            <button 
              onClick={() => switchLang('RO')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'RO' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Română
            </button>
            <button 
              onClick={() => switchLang('BG')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'BG' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Български
            </button>
            <button 
              onClick={() => switchLang('CA')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'CA' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Català
            </button>
            <button 
              onClick={() => switchLang('NL')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'NL' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Nederlands
            </button>
            <button 
              onClick={() => switchLang('EL')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'EL' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Ελληνικά
            </button>
            <button 
              onClick={() => switchLang('ID')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'ID' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Bahasa Indonesia
            </button>
            <button 
              onClick={() => switchLang('MS')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'MS' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Bahasa Melayu
            </button>
            <button 
              onClick={() => switchLang('SV')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'SV' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Svenska
            </button>
            <button 
              onClick={() => switchLang('TH')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'TH' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              ภาษาไทย
            </button>
            <button 
              onClick={() => switchLang('TR')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'TR' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Türkçe
            </button>
            <button 
              onClick={() => switchLang('UK')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'UK' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Українська
            </button>
            <button 
              onClick={() => switchLang('VI')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'VI' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Tiếng Việt
            </button>
            <button 
              onClick={() => switchLang('SW')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'SW' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Kiswahili
            </button>
            <button 
              onClick={() => switchLang('FI')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'FI' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Suomi
            </button>
            <button 
              onClick={() => switchLang('DA')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'DA' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Dansk
            </button>
            <button 
              onClick={() => switchLang('NO')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'NO' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Norsk
            </button>
            <button 
              onClick={() => switchLang('CS')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === 'CS' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              Čeština
            </button>
          </div>
        </>
      )}
    </div>
  );
};


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navProgress, setNavProgress] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
      sessionStorage.setItem(`scroll_${location.key}`, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  // Offline Fallback
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const onOffline = () => { setIsOffline(true); toast.error('You are offline.'); };
    const onOnline = () => { setIsOffline(false); toast.success('You are back online!'); };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Global Drag & Drop Overlay
  const [globalDrag, setGlobalDrag] = useState(false);
  useEffect(() => {
    let timer;
    const onDragOver = (e) => {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setGlobalDrag(true);
        clearTimeout(timer);
        timer = setTimeout(() => setGlobalDrag(false), 200);
      }
    };
    const onDrop = () => {
      setGlobalDrag(false);
      clearTimeout(timer);
    };
    
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
       window.removeEventListener('dragover', onDragOver);
       window.removeEventListener('drop', onDrop);
    };
  }, []);

  // Progress bar and scroll to top on every route change (except browser Back button)
  useEffect(() => {
    if (navType === 'POP') {
      // Force exact scroll position restoration after DOM paints
      const savedY = sessionStorage.getItem(`scroll_${location.key}`);
      if (savedY) {
        requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
        setTimeout(() => window.scrollTo(0, parseInt(savedY, 10)), 50);
      }
      return; 
    }

    window.scrollTo(0, 0); // Snap instantly like a real page load
    
    // Start progress animation
    setNavProgress(30);
    const t1 = setTimeout(() => setNavProgress(80), 100);
    const t2 = setTimeout(() => setNavProgress(100), 200);
    const t3 = setTimeout(() => setNavProgress(0), 400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname, location.key, navType]);

  const getNavPath = (path) => {
    const match = location.pathname.match(LANG_PREFIX_REGEX);
    if (match) {
      const lang = match[1];
      if (path === '/') return `/${lang}`;
      if (!path.startsWith(`/${lang}`)) return `/${lang}${path}`;
    }
    return path;
  };

  const handleNavClick = (path) => {
    navigate(getNavPath(path));
  };

  let pathToCheck = location.pathname;
  const match = pathToCheck.match(LANG_PREFIX_REGEX);
  let currentLang = 'en';
  if (match) {
    currentLang = match[1];
    pathToCheck = pathToCheck.replace(LANG_PREFIX_REGEX, '/') || '/';
  }
  
  if (pathToCheck.endsWith('/') && pathToCheck !== '/') {
    pathToCheck = pathToCheck.slice(0, -1);
  }
                      
  const [uiDict, setUiDict] = useState(UI_EN);
  
  useEffect(() => {
    let isMounted = true;
    const loadUiDict = async () => {
      try {
        if (currentLang === 'en') {
          if (isMounted) setUiDict(UI_EN);
        } else {
          const mod = await import(`./data/ui-${currentLang}.js`);
          const key = `UI_DICT_${currentLang.toUpperCase().replace('-', '_')}`;
          if (isMounted) setUiDict(mod[key] || mod.default || Object.values(mod)[0] || UI_EN);
        }
      } catch (err) {
        console.error('Failed to load UI dict for', currentLang, err);
        if (isMounted) setUiDict(UI_EN);
      }
    };
    loadUiDict();
    return () => { isMounted = false; };
  }, [currentLang]);

  const isHome = pathToCheck === '/';
  const isPricing = pathToCheck === '/pricing';
  const isCompare = pathToCheck === '/compare';
  const isTool = pathToCheck.startsWith('/tools/');
  // These tools render their own full-screen layout with their own topbar
  const isFullscreenTool = [
    '/tools/edit-pdf',
    '/tools/watermark-pdf',
    '/tools/pdf-forms',
    '/tools/add-page-numbers',
    '/tools/annotate-pdf',
    '/tools/chat-with-pdf',
    '/tools/summarize-pdf',
    '/tools/translate-pdf',
    '/tools/extract-data',
    '/tools/plagiarism-check',
    '/tools/merge-pdf',
    '/tools/certificate-sign'
  ].includes(pathToCheck);

  // Auth pages: full-screen, no navbar/footer
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathToCheck);

  // Admin portal: also full-screen, no public navbar/footer
  const isAdminPage = location.pathname.startsWith(PORTAL);

  
  const [currentToolsData, setCurrentToolsData] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    const loadToolsData = async () => {
      try {
        if (currentLang === 'en') {
          const mod = await import('./data/tools.js');
          if (isMounted) setCurrentToolsData(mod.TOOLS_DATA);
        } else {
          const mod = await import(`./data/tools-${currentLang}.js`);
          const key = `TOOLS_DATA_${currentLang.toUpperCase().replace('-', '_')}`;
          if (isMounted) setCurrentToolsData(mod[key] || mod.default || Object.values(mod)[0] || []);
        }
      } catch (err) {
        console.error('Failed to load tools data for', currentLang, err);
        const mod = await import('./data/tools.js');
        if (isMounted) setCurrentToolsData(mod.TOOLS_DATA);
      }
    };
    loadToolsData();
    return () => { isMounted = false; };
  }, [currentLang]);

  const organizeOptimizeTools = currentToolsData.filter(t => t.category === 'organize' || t.category === 'optimize');
  const convertToTools = currentToolsData.filter(t => t.category === 'convert' && (t.title.endsWith('to PDF') || t.title.endsWith('a PDF') || t.title.endsWith('in PDF') || t.title.endsWith('para PDF')));
  const convertFromTools = currentToolsData.filter(t => t.category === 'convert' && (t.title.startsWith('PDF to') || t.title.startsWith('PDF a') || t.title.startsWith('PDF in') || t.title.startsWith('PDF para')));
  const editSignSecurityTools = currentToolsData.filter(t => t.category === 'edit' || t.category === 'sign' || t.category === 'security');
  const aiTools = currentToolsData.filter(t => t.category === 'ai');


  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#f8fafc]">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '12px 20px',
            fontWeight: 500
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#333' } },
        }}
      />

      {/* Global Drag & Drop Overlay */}
      <div className={clsx(
        "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-300",
        globalDrag ? "opacity-100 backdrop-blur-sm bg-[#378ADD]/10" : "opacity-0"
      )}>
        <div className={clsx(
          "bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center border-4 border-dashed border-[#378ADD] transition-transform duration-300",
          globalDrag ? "scale-100" : "scale-90"
        )}>
           <iconify-icon icon="solar:document-add-linear" class="text-7xl text-[#378ADD] mb-4"></iconify-icon>
           <h2 className="text-2xl font-extrabold text-slate-800">Drop your file here</h2>
           <p className="text-slate-500 font-medium">To instantly open it in a tool</p>
        </div>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-sm font-semibold py-2 px-4 text-center shadow-md animate-fade-in z-[110] relative">
          <span className="flex items-center justify-center gap-2">
            <iconify-icon icon="solar:wifi-router-minimalistic-broken" class="text-lg"></iconify-icon>
            You are offline. Waiting to reconnect...
          </span>
        </div>
      )}

      {/* ── TOP LOADING BAR (SIMULATES PAGE LOAD) ─────────────────────── */}
      {navProgress > 0 && (
        <div 
          className="fixed top-0 left-0 h-1 bg-[#378ADD] z-50 transition-all duration-200 ease-out"
          style={{ width: `${navProgress}%`, opacity: navProgress === 100 ? 0 : 1 }}
        />
      )}

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      {!isFullscreenTool && !isAuthPage && !isAdminPage && <header className={clsx(
        'sticky top-0 z-40 transition-all duration-300 flex flex-col',
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm'
          : 'bg-white/90 backdrop-blur-md'
      )}>
        {/* Main Navbar */}
        <div className="border-b border-gray-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div
            className="cursor-pointer shrink-0"
            onClick={() => handleNavClick('/')}
          >
            <Logo />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {[
              { path: '/', label: uiDict.nav.home },
              { path: '/tools', label: uiDict.nav.tools },
              { path: '/pricing', label: uiDict.nav.pricing },
              { path: '/blog', label: uiDict.nav.blog },
              { path: '/compare', label: uiDict.nav.why_us },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === getNavPath(item.path) || (item.path === '/blog' && location.pathname.startsWith(getNavPath('/blog')))
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Language Switcher Dropdown */}
            <LanguageSwitcher location={location} navigate={navigate} currentLangCode={currentLang} />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavClick('/dashboard')}>
                  {user.user_metadata?.avatar_url || user.profile?.avatar_url ? (
                    <img src={user.user_metadata?.avatar_url || user.profile?.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-[#378ADD] transition-colors" />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-indigo-200 transition-colors">
                      {user.profile?.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {user.profile?.name || uiDict.nav.dashboard}
                  </span>
                </div>
                {['admin', 'superadmin'].includes(user.profile?.role) && (
                  <button
                    onClick={() => handleNavClick(PORTAL)}
                    className="text-xs font-bold text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                    title="Admin Panel"
                  >
                    <iconify-icon icon="solar:shield-keyhole-bold" class="text-sm"></iconify-icon>
                    {uiDict.nav.admin}</button>
                )}
                <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
                  {uiDict.nav.logout}
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => handleNavClick('/login')} className="text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg px-4 py-1.5 transition-colors">
                  {uiDict.nav.sign_in}
                </button>
                <button onClick={() => handleNavClick('/register')} className="text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-lg px-4 py-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0">
                  {uiDict.nav.sign_up}
                </button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <iconify-icon icon="solar:hamburger-menu-linear" class="text-2xl"></iconify-icon>
          </button>
        </div>
        </div>

        {/* Secondary Tool Navbar */}
        <div className="hidden lg:flex border-b border-gray-200/70 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center gap-10 w-full">
            {[
              { label: uiDict.secondary_nav.merge_pdf, path: '/tools/merge-pdf' },
              { label: uiDict.secondary_nav.split_pdf, path: '/tools/split-pdf' },
              { label: uiDict.secondary_nav.compress_pdf, path: '/tools/compress-pdf' },
            ].map(link => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={clsx(
                  'text-[13px] font-bold tracking-wide uppercase transition-colors',
                  location.pathname === link.path ? 'text-[#378ADD]' : 'text-gray-700 hover:text-[#378ADD]'
                )}
              >
                {link.label}
              </button>
            ))}
            
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1.5 text-[13px] font-bold tracking-wide uppercase text-gray-700 hover:text-[#378ADD] transition-colors h-full py-3">
                {uiDict.secondary_nav.convert_pdf}
                <iconify-icon icon="solar:alt-arrow-down-linear" class="text-base transition-transform group-hover:rotate-180"></iconify-icon>
              </button>

              <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-[540px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6 flex gap-8">
                {/* Column 1 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.secondary_nav.convert_to_pdf}</p>
                  <div className="space-y-1">
                    {[
                      { name: uiDict.secondary_nav.jpg_to_pdf, path: '/tools/jpg-to-pdf', icon: 'solar:images-linear', color: 'text-amber-500 bg-amber-50' },
                      { name: uiDict.secondary_nav.word_to_pdf, path: '/tools/word-to-pdf', icon: 'solar:file-text-linear', color: 'text-blue-600 bg-blue-50' },
                      { name: uiDict.secondary_nav.powerpoint_to_pdf, path: '/tools/powerpoint-to-pdf', icon: 'solar:play-circle-linear', color: 'text-orange-600 bg-orange-50' },
                      { name: uiDict.secondary_nav.excel_to_pdf, path: '/tools/excel-to-pdf', icon: 'solar:document-add-linear', color: 'text-emerald-600 bg-emerald-50' },
                      { name: uiDict.secondary_nav.html_to_pdf, path: '/tools/html-to-pdf', icon: 'solar:global-linear', color: 'text-indigo-500 bg-indigo-50' },
                    ].map(t => (
                      <button
                        key={t.name}
                        onClick={() => handleNavClick(t.path)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item"
                      >
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.color)}>
                          <iconify-icon icon={t.icon} class="text-lg"></iconify-icon>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.secondary_nav.convert_from_pdf}</p>
                  <div className="space-y-1">
                    {[
                      { name: uiDict.secondary_nav.pdf_to_jpg, path: '/tools/pdf-to-jpg', icon: 'solar:gallery-linear', color: 'text-amber-500 bg-amber-50' },
                      { name: uiDict.secondary_nav.pdf_to_word, path: '/tools/pdf-to-word', icon: 'solar:document-text-linear', color: 'text-blue-600 bg-blue-50' },
                      { name: uiDict.secondary_nav.pdf_to_powerpoint, path: '/tools/pdf-to-powerpoint', icon: 'solar:presentation-graph-linear', color: 'text-orange-600 bg-orange-50' },
                      { name: uiDict.secondary_nav.pdf_to_excel, path: '/tools/pdf-to-excel', icon: 'solar:chart-square-linear', color: 'text-emerald-600 bg-emerald-50' },
                      { name: uiDict.secondary_nav.pdf_to_pdfa, path: '/tools/pdf-to-pdf-a', icon: 'solar:shield-check-linear', color: 'text-gray-600 bg-gray-100' },
                      { name: uiDict.secondary_nav.sign_pdf, path: '/tools/sign-pdf', icon: 'solar:pen-linear', color: 'text-violet-600 bg-violet-50' },
                    ].map(t => (
                      <button
                        key={t.name}
                        onClick={() => handleNavClick(t.path)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item"
                      >
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.color)}>
                          <iconify-icon icon={t.icon} class="text-lg"></iconify-icon>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group/all h-full flex items-center">
              <button
                onClick={() => handleNavClick('/')}
                className="flex items-center gap-1.5 text-[13px] font-bold tracking-wide uppercase text-gray-700 hover:text-[#378ADD] transition-colors h-full py-3"
              >
                {uiDict.mobile_nav.all_tools}
                <iconify-icon icon="solar:alt-arrow-down-linear" class="text-base transition-transform group-hover/all:rotate-180"></iconify-icon>
              </button>

              <div className="absolute top-[48px] right-0 w-[900px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 opacity-0 invisible group-hover/all:opacity-100 group-hover/all:visible transition-all duration-200 z-50 p-6 flex gap-6">
                {/* Column 1 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.footer.tools}</p>
                  <div className="space-y-0.5">
                    {organizeOptimizeTools.map(t => (
                      <button key={t.title} onClick={() => handleNavClick(`/tools/${slugify(t.title)}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item">
                        <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center shrink-0", t.iconColorClass)}>
                          <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.secondary_nav.convert_to_pdf}</p>
                  <div className="space-y-0.5 mb-6">
                    {convertToTools.map(t => (
                      <button key={t.title} onClick={() => handleNavClick(`/tools/${slugify(t.title)}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item">
                        <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center shrink-0", t.iconColorClass)}>
                          <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.title}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-purple-400 tracking-wider mb-3">AI TOOLS</p>
                  <div className="space-y-0.5">
                    {aiTools.map(t => (
                      <button key={t.title} onClick={() => handleNavClick(`/tools/${slugify(t.title)}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 transition-colors text-left group/item">
                        <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center shrink-0", t.iconColorClass)}>
                          <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover/item:text-purple-600 transition-colors">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.secondary_nav.convert_from_pdf}</p>
                  <div className="space-y-0.5">
                    {convertFromTools.map(t => (
                      <button key={t.title} onClick={() => handleNavClick(`/tools/${slugify(t.title)}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item">
                        <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center shrink-0", t.iconColorClass)}>
                          <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 4 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{uiDict.footer.legal}</p>
                  <div className="space-y-0.5">
                    {editSignSecurityTools.map(t => (
                      <button key={t.title} onClick={() => handleNavClick(`/tools/${slugify(t.title)}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors text-left group/item">
                        <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center shrink-0", t.iconColorClass)}>
                          <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover/item:text-[#378ADD] transition-colors">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </header>}

      {!isFullscreenTool && !isAuthPage && !isAdminPage && <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={location.pathname}
        onNav={handleNavClick}
        user={user}
        logout={logout}
        ui={uiDict}
      />}

      {/* ── HERO / HEADER ──────────────────────────────────────────────────── */}
      {(isHome || isCompare) && (
        <header className={clsx(
          'w-full text-center transition-all duration-500 relative overflow-hidden bg-white',
          isHome ? 'pt-16 pb-10' : 'pt-12 pb-6'
        )}>
          {isHome && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#378ADD]/8 blur-3xl" />
              <div className="absolute top-10 left-1/4 w-32 h-32 rounded-full bg-purple-500/6 blur-2xl" />
              <div className="absolute top-10 right-1/4 w-32 h-32 rounded-full bg-blue-400/6 blur-2xl" />
            </div>
          )}

          <div className="relative max-w-4xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              {isHome && (
                <> {uiDict.home.hero_title} <br className="hidden sm:block" />
                  <span className="gradient-text"> {uiDict.home.hero_title_gradient}</span> {uiDict.home.hero_title_suffix}</>
              )}
              {isPricing && uiDict.home.pricing_title}
              {isCompare && uiDict.home.compare_title}
            </h1>

            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-6">
              {isHome && uiDict.home.hero_subtitle}
              {isPricing && uiDict.home.pricing_subtitle}
              {isCompare && uiDict.home.compare_subtitle}
            </p>

            {isHome && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {[
                  { icon: 'solar:stars-linear', label: uiDict.home.pill_ai, cls: 'bg-purple-50 text-purple-600 border-purple-100' },
                  { icon: 'solar:widget-5-linear', label: uiDict.home.pill_tools, cls: 'bg-blue-50 text-[#378ADD] border-blue-100' },
                  { icon: 'solar:user-cross-linear', label: uiDict.home.pill_signup, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { icon: 'solar:shield-check-linear', label: uiDict.home.pill_ssl, cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                  { icon: 'solar:devices-linear', label: uiDict.home.pill_devices, cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                  { icon: 'solar:cloud-bold', label: uiDict.home.pill_fast, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', hidden: 'sm' },
                ].map((pill, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                      pill.cls,
                      pill.hidden === 'sm' ? 'hidden sm:inline-flex' : ''
                    )}
                  >
                    <iconify-icon icon={pill.icon} stroke-width="1.5"></iconify-icon>
                    {pill.label}
                  </span>
                ))}
              </div>
            )}

            {isHome && (
              <div className="relative max-w-md mx-auto w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:magnifer-linear" stroke-width="1.5" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="text"
                  placeholder={uiDict.home.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-full py-3 pl-11 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <iconify-icon icon="solar:close-circle-linear" class="text-lg"></iconify-icon>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className={clsx(
        "flex-1 w-full mx-auto transition-opacity duration-300",
        (isAuthPage || isAdminPage) ? "flex flex-col" :
        isFullscreenTool ? "flex flex-col overflow-hidden" : (!isTool ? "max-w-7xl px-4 sm:px-6 lg:px-8 pb-20" : ""),
        navProgress > 0 && navProgress < 100 ? "opacity-50" : "opacity-100"
      )}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            <Route path="/" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/tools" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<LoginPage ui={uiDict} />} />
            <Route path="/register" element={<RegisterPage ui={uiDict} />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            
            <Route path="/forgot-password" element={<ForgotPasswordPage ui={uiDict} />} />
            <Route path="/reset-password" element={<ResetPasswordPage ui={uiDict} />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/mock-checkout" element={<MockCheckoutPage />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />
            <Route path="/invite-response" element={<InviteResponse />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/pdf-trends-2026" element={<PDFTrendsPage />} />
            
            {/* SEO Growth Hack Pages */}
            <Route path="/desktop" element={<DesktopAppPage />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/for/students" element={<Navigate to="/tools" replace />} />
            <Route path="/for/:industry" element={<UseCasePage />} />

            <Route path="/tools/:toolSlug" element={<ToolRenderer />} />
            <Route path="/tools/:toolSlug/:platform" element={<ToolRenderer />} />
            <Route path="/sign/:token" element={<SigningPage />} />

            {/* DYNAMIC TRANSLATED ROUTES FOR ALL 30 LANGUAGES */}
            {SUPPORTED_LANGS.filter(l => l !== 'en').map(lang => (
              <React.Fragment key={lang}>
                <Route path={`/${lang}`} element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang={lang} />} />
                <Route path={`/${lang}/desktop`} element={<DesktopAppPage lang={lang} />} />
                <Route path={`/${lang}/extension`} element={<ExtensionPage lang={lang} />} />
                <Route path={`/${lang}/for/students`} element={<Navigate to={`/${lang}/tools`} replace />} />
                <Route path={`/${lang}/for/:industry`} element={<UseCasePage lang={lang} />} />
                <Route path={`/${lang}/pricing`} element={<PricingPage lang={lang} />} />
                <Route path={`/${lang}/compare`} element={<ComparePage lang={lang} />} />
                <Route path={`/${lang}/about`} element={<AboutPage lang={lang} />} />
                <Route path={`/${lang}/contact`} element={<ContactPage lang={lang} />} />
                <Route path={`/${lang}/privacy`} element={<PrivacyPage lang={lang} />} />
                <Route path={`/${lang}/terms`} element={<TermsPage lang={lang} />} />
                <Route path={`/${lang}/blog`} element={<BlogList lang={lang} />} />
                <Route path={`/${lang}/blog/:slug`} element={<BlogPost lang={lang} />} />
                <Route path={`/${lang}/pdf-trends-2026`} element={<PDFTrendsPage lang={lang} />} />
                <Route path={`/${lang}/login`} element={<LoginPage lang={lang} ui={uiDict} />} />
                <Route path={`/${lang}/register`} element={<RegisterPage lang={lang} ui={uiDict} />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path={`/${lang}/dashboard`} element={<DashboardPage lang={lang} />} />
                </Route>
                
                <Route path={`/${lang}/forgot-password`} element={<ForgotPasswordPage lang={lang} ui={uiDict} />} />
                <Route path={`/${lang}/reset-password`} element={<ResetPasswordPage lang={lang} ui={uiDict} />} />
                <Route path={`/${lang}/auth/callback`} element={<OAuthCallbackPage lang={lang} />} />
                <Route path={`/${lang}/payment-success`} element={<PaymentSuccessPage lang={lang} />} />
                
                <Route path={`/${lang}/tools/:toolSlug`} element={<ToolRenderer lang={lang} />} />
                <Route path={`/${lang}/tools/:toolSlug/:platform`} element={<ToolRenderer lang={lang} />} />
                <Route path={`/${lang}/sign/:token`} element={<SigningPage lang={lang} />} />
              </React.Fragment>
            ))}

            {/* ── ADMIN PANEL — Obscure path, admin-only ────────────────── */}
            {/* OLD /admin path is explicitly blocked — returns 404 */}
            <Route path="/admin" element={<NotFoundPage />} />
            <Route path="/admin/*" element={<NotFoundPage />} />
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path={PORTAL} element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="revenue" element={<AdminRevenue />} />
                <Route path="jobs" element={<AdminJobs />} />
                <Route path="tools" element={<AdminTools />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="emails" element={<AdminEmails />} />
                <Route path="support" element={<AdminSupport />} />
              </Route>
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* ── FOOTER — hidden on all tool/editor routes, auth pages, and admin pages ─── */}
      <footer className="bg-white border-t border-gray-100 mt-auto" style={{ display: pathToCheck.startsWith('/tools/') || pathToCheck.startsWith('/sign/') || isAuthPage || isAdminPage ? 'none' : undefined }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
                The world's most powerful PDF toolkit. Free, fast, and secure. Trusted by professionals worldwide.
              </p>
              {/* Social links hidden until accounts are created */}
            </div>

            {[
              { title: uiDict.footer.tools, links: [{ label: uiDict.secondary_nav.merge_pdf, path: '/tools/merge-pdf' }, { label: uiDict.secondary_nav.split_pdf, path: '/tools/split-pdf' }, { label: uiDict.secondary_nav.compress_pdf, path: '/tools/compress-pdf' }, { label: uiDict.secondary_nav.pdf_to_word, path: '/tools/pdf-to-word' }, { label: uiDict.secondary_nav.sign_pdf, path: '/tools/sign-pdf' }, { label: uiDict.mobile_nav.all_tools, path: '/tools/edit-pdf' }] },
              { title: uiDict.footer.solutions, links: [{ label: 'For Business', path: '/for/business' }, { label: 'Desktop App', path: '/desktop' }, { label: 'Chrome Extension', path: '/extension' }] },
              { title: uiDict.footer.company, links: [{ label: uiDict.footer.about_us, path: '/about' }, { label: uiDict.footer.contact, path: '/contact' }, { label: uiDict.footer.pricing, path: '/pricing' }, { label: 'Blog & Guides', path: '/blog' }, { label: 'PDF Trends 2026', path: '/pdf-trends-2026' }] },
              { title: uiDict.footer.legal, links: [{ label: uiDict.footer.privacy_policy, path: '/privacy' }, { label: uiDict.footer.terms, path: '/terms' }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      {link.path.startsWith('/') ? (
                        <Link to={getNavPath(link.path)} className="text-sm text-gray-500 hover:text-[#378ADD] transition-colors">{link.label}</Link>
                      ) : (
                        <a href={link.path} className="text-sm text-gray-500 hover:text-[#378ADD] transition-colors">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} TheyLovePDF. {uiDict.footer.all_rights_reserved}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <iconify-icon icon="solar:shield-check-linear" class="text-emerald-500 text-base"></iconify-icon>
                256-bit SSL encrypted
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <iconify-icon icon="solar:lock-keyhole-linear" class="text-blue-400 text-base"></iconify-icon>
                Privacy focused
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAV BAR ─────────────────────────────────────────── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 flex items-center justify-around pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ display: isFullscreenTool || isAuthPage || isAdminPage ? 'none' : undefined }}
      >
        {[
          { label: uiDict.bottom_nav.home, icon: 'solar:home-linear', activeIcon: 'solar:home-bold', path: '/' },
          { label: uiDict.bottom_nav.merge, icon: 'solar:layers-linear', activeIcon: 'solar:layers-bold', path: '/tools/merge-pdf' },
          { label: uiDict.bottom_nav.sign, icon: 'solar:pen-linear', activeIcon: 'solar:pen-bold', path: '/tools/sign-pdf' },
          { label: uiDict.bottom_nav.ai_chat, icon: 'solar:chat-round-linear', activeIcon: 'solar:chat-round-bold', path: '/tools/chat-with-pdf' },
          { label: uiDict.bottom_nav.more, icon: 'solar:hamburger-menu-linear', activeIcon: 'solar:hamburger-menu-bold', path: null },
        ].map(item => {
          const isActive = item.path && location.pathname === getNavPath(item.path);
          return item.path ? (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 py-2 px-3 flex-1 transition-colors min-h-[50px]',
                isActive ? 'text-[#378ADD]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <iconify-icon icon={isActive ? item.activeIcon : item.icon} class="text-[22px]"></iconify-icon>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ) : (
            <button
              key={item.label}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-3 flex-1 text-gray-400 hover:text-gray-600 min-h-[50px]"
            >
              <iconify-icon icon={item.icon} class="text-[22px]"></iconify-icon>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom spacer so content doesn't hide behind mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}