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
import { TOOLS_DATA } from './data/tools';
import { TOOLS_DATA_ES } from './data/tools-es';
import { TOOLS_DATA_FR } from './data/tools-fr';
import { slugify } from './utils/slugify';
import SigningPage from './pages/SigningPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AnnotatePDFPage from './pages/AnnotatePDFPage';
import ChatPDFPage from './pages/ChatPDFPage';
import SummarizePDFPage from './pages/SummarizePDFPage';
import TranslatePDFPage from './pages/TranslatePDFPage';
import ExtractDataPage from './pages/ExtractDataPage';
import PlagiarismCheckPage from './pages/PlagiarismCheckPage';
import MergePDFPage from './pages/MergePDFPage';
import NotFoundPage from './pages/NotFoundPage';
import PDFTrendsPage from './pages/PDFTrendsPage';
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
function MobileDrawer({ isOpen, onClose, pathname, onNav, user, logout }) {
  const links = [
    { id: '/', label: 'All Tools', icon: 'solar:box-linear' },
    { id: '/pricing', label: 'Pricing', icon: 'solar:tag-price-linear' },
    { id: '/compare', label: 'vs ILovePDF', icon: 'solar:chart-square-linear' },
  ];
  const quickTools = [
    { path: '/tools/merge-pdf', label: 'Merge PDF', icon: 'solar:layers-linear', color: 'text-blue-600' },
    { path: '/tools/split-pdf', label: 'Split PDF', icon: 'solar:scissors-linear', color: 'text-amber-600' },
    { path: '/tools/compress-pdf', label: 'Compress PDF', icon: 'solar:archive-minimalistic-linear', color: 'text-emerald-600' },
    { path: '/tools/pdf-to-word', label: 'PDF to Word', icon: 'solar:file-text-linear', color: 'text-indigo-600' },
    { path: '/tools/word-to-pdf', label: 'Word to PDF', icon: 'solar:document-add-linear', color: 'text-blue-600' },
    { path: '/tools/jpg-to-pdf', label: 'JPG to PDF', icon: 'solar:images-linear', color: 'text-orange-500' },
    { path: '/tools/protect-pdf', label: 'Protect PDF', icon: 'solar:lock-password-linear', color: 'text-red-600' },
    { path: '/tools/sign-pdf', label: 'Sign PDF', icon: 'solar:pen-linear', color: 'text-violet-600' },
    { path: '/tools/redact-pdf', label: 'Redact PDF', icon: 'solar:shield-cross-linear', color: 'text-red-500' },
    { path: '/tools/ocr-pdf', label: 'OCR PDF', icon: 'solar:text-square-linear', color: 'text-teal-600' },
  ];
  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div className={clsx(
        'fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100">
          <Logo size="sm" />
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <iconify-icon icon="solar:close-linear" class="text-xl"></iconify-icon>
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
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">Popular Tools</p>
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

        <div className="p-4 border-t border-gray-100 space-y-3 pb-safe">
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
                Dashboard
              </button>
              <button onClick={() => { logout(); onClose(); }} className="w-full py-2.5 text-sm font-semibold text-red-600 border border-red-100 hover:bg-red-50 rounded-xl transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { onNav('/login'); onClose(); }} className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                Log in
              </button>
              <button onClick={() => { onNav('/register'); onClose(); }} className="w-full py-2.5 text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-xl transition-colors shadow-sm">
                Sign up free
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

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
    if (location.pathname.startsWith('/es/') || location.pathname === '/es') {
      if (path === '/') return '/es';
      if (!path.startsWith('/es')) return `/es${path}`;
    }
    return path;
  };

  const handleNavClick = (path) => {
    navigate(getNavPath(path));
  };

  const pathToCheck = location.pathname.startsWith('/es') ? location.pathname.replace(/^\/es/, '') || '/' : location.pathname.startsWith('/fr') ? location.pathname.replace(/^\/fr/, '') || '/' : location.pathname;
  const isEs = location.pathname.startsWith('/es');
  const isFr = location.pathname.startsWith('/fr');

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
    '/tools/plagiarism-check'
  ].includes(pathToCheck);

  // Auth pages: full-screen, no navbar/footer
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathToCheck);

  // Admin portal: also full-screen, no public navbar/footer
  const isAdminPage = location.pathname.startsWith(PORTAL);

  const currentToolsData = isEs ? TOOLS_DATA_ES : isFr ? TOOLS_DATA_FR : TOOLS_DATA;
  const organizeOptimizeTools = currentToolsData.filter(t => t.category === 'organize' || t.category === 'optimize');
  const convertToTools = currentToolsData.filter(t => t.category === 'convert' && (t.title.endsWith('to PDF') || t.title.endsWith('a PDF')));
  const convertFromTools = currentToolsData.filter(t => t.category === 'convert' && (t.title.startsWith('PDF to') || t.title.startsWith('PDF a')));
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
              { path: '/', label: isEs ? 'Inicio' : isFr ? 'Accueil' : 'Home' },
              { path: '/tools', label: isEs ? 'Herramientas' : isFr ? 'Outils' : 'Tools' },
              { path: '/pricing', label: isEs ? 'Precios' : isFr ? 'Tarifs' : 'Pricing' },
              { path: '/blog', label: isEs ? 'Blog' : isFr ? 'Blog' : 'Blog' },
              { path: '/compare', label: isEs ? '¿Por qué nosotros?' : isFr ? 'Pourquoi nous?' : 'Why Us?' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.path || (item.path === '/blog' && location.pathname.startsWith('/blog'))
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => {
                const isCurrentlyEs = location.pathname.startsWith('/es/') || location.pathname === '/es';
                const isCurrentlyFr = location.pathname.startsWith('/fr/') || location.pathname === '/fr';
                let newPath = location.pathname;
                
                // Toggle between EN -> ES -> FR -> EN
                if (isCurrentlyEs) {
                  newPath = newPath.replace(/^\/es(\/|$)/, '/fr$1');
                } else if (isCurrentlyFr) {
                  newPath = newPath.replace(/^\/fr(\/|$)/, '/');
                } else {
                  newPath = newPath === '/' ? '/es' : `/es${newPath}`;
                }
                if (newPath === '') newPath = '/';
                navigate(newPath);
              }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5"
              title={isEs ? 'Cambiar a Francés' : isFr ? 'Passer à l\\'anglais' : 'Switch to Spanish'}
            >
              <iconify-icon icon="solar:global-linear" class="text-base"></iconify-icon>
              {isEs ? 'ES' : isFr ? 'FR' : 'EN'}
            </button>

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
                    {user.profile?.name || (isEs ? 'Panel' : isFr ? 'Tableau' : 'Dashboard')}
                  </span>
                </div>
                {['admin', 'superadmin'].includes(user.profile?.role) && (
                  <button
                    onClick={() => handleNavClick(PORTAL)}
                    className="text-xs font-bold text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                    title="Admin Panel"
                  >
                    <iconify-icon icon="solar:shield-keyhole-bold" class="text-sm"></iconify-icon>
                    {isEs ? 'Administrador' : 'Admin'}</button>
                )}
                <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
                  {isEs ? 'Cerrar sesión' : 'Logout'}
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => handleNavClick('/login')} className="text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg px-4 py-1.5 transition-colors">
                  {isEs ? 'Iniciar sesión' : 'Sign in'}
                </button>
                <button onClick={() => handleNavClick('/register')} className="text-sm font-semibold bg-[#378ADD] text-white hover:bg-[#2b71b8] rounded-lg px-4 py-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0">
                  {isEs ? 'Registrarse' : 'Sign up'}
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
              { label: isEs ? 'UNIR PDF' : 'MERGE PDF', path: '/tools/merge-pdf' },
              { label: isEs ? 'DIVIDIR PDF' : 'SPLIT PDF', path: '/tools/split-pdf' },
              { label: isEs ? 'COMPRIMIR PDF' : 'COMPRESS PDF', path: '/tools/compress-pdf' },
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
                {isEs ? 'CONVERTIR PDF' : 'CONVERT PDF'}
                <iconify-icon icon="solar:alt-arrow-down-linear" class="text-base transition-transform group-hover:rotate-180"></iconify-icon>
              </button>

              <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-[540px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6 flex gap-8">
                {/* Column 1 */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'CONVERTIR A PDF' : 'CONVERT TO PDF'}</p>
                  <div className="space-y-1">
                    {[
                      { name: isEs ? 'JPG a PDF' : 'JPG to PDF', path: '/tools/jpg-to-pdf', icon: 'solar:images-linear', color: 'text-amber-500 bg-amber-50' },
                      { name: isEs ? 'WORD a PDF' : 'WORD to PDF', path: '/tools/word-to-pdf', icon: 'solar:file-text-linear', color: 'text-blue-600 bg-blue-50' },
                      { name: isEs ? 'POWERPOINT a PDF' : 'POWERPOINT to PDF', path: '/tools/powerpoint-to-pdf', icon: 'solar:play-circle-linear', color: 'text-orange-600 bg-orange-50' },
                      { name: isEs ? 'EXCEL a PDF' : 'EXCEL to PDF', path: '/tools/excel-to-pdf', icon: 'solar:document-add-linear', color: 'text-emerald-600 bg-emerald-50' },
                      { name: isEs ? 'HTML a PDF' : 'HTML to PDF', path: '/tools/html-to-pdf', icon: 'solar:global-linear', color: 'text-indigo-500 bg-indigo-50' },
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
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'CONVERTIR DESDE PDF' : 'CONVERT FROM PDF'}</p>
                  <div className="space-y-1">
                    {[
                      { name: isEs ? 'PDF a JPG' : 'PDF to JPG', path: '/tools/pdf-to-jpg', icon: 'solar:gallery-linear', color: 'text-amber-500 bg-amber-50' },
                      { name: isEs ? 'PDF a WORD' : 'PDF to WORD', path: '/tools/pdf-to-word', icon: 'solar:document-text-linear', color: 'text-blue-600 bg-blue-50' },
                      { name: isEs ? 'PDF a POWERPOINT' : 'PDF to POWERPOINT', path: '/tools/pdf-to-powerpoint', icon: 'solar:presentation-graph-linear', color: 'text-orange-600 bg-orange-50' },
                      { name: isEs ? 'PDF a EXCEL' : 'PDF to EXCEL', path: '/tools/pdf-to-excel', icon: 'solar:chart-square-linear', color: 'text-emerald-600 bg-emerald-50' },
                      { name: isEs ? 'PDF a PDF/A' : 'PDF to PDF/A', path: '/tools/pdf-to-pdf-a', icon: 'solar:shield-check-linear', color: 'text-gray-600 bg-gray-100' },
                      { name: isEs ? 'Firmar PDF' : 'Sign PDF', path: '/tools/sign-pdf', icon: 'solar:pen-linear', color: 'text-violet-600 bg-violet-50' },
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
                {isEs ? 'TODAS LAS HERRAMIENTAS' : 'ALL PDF TOOLS'}
                <iconify-icon icon="solar:alt-arrow-down-linear" class="text-base transition-transform group-hover/all:rotate-180"></iconify-icon>
              </button>

              <div className="absolute top-[48px] right-0 w-[900px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 opacity-0 invisible group-hover/all:opacity-100 group-hover/all:visible transition-all duration-200 z-50 p-6 flex gap-6">
                
                {/* Column 1: {isEs ? 'ORGANIZAR Y OPTIMIZAR' : 'ORGANIZE & OPTIMIZE'} */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'ORGANIZAR Y OPTIMIZAR' : 'ORGANIZE & OPTIMIZE'}</p>
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

                {/* Column 2: {isEs ? 'CONVERTIR A PDF' : 'CONVERT TO PDF'} */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'CONVERTIR A PDF' : 'CONVERT TO PDF'}</p>
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
                  <p className="text-xs font-bold text-purple-400 tracking-wider mb-3">{isEs ? 'HERRAMIENTAS IA' : 'AI TOOLS'}</p>
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

                {/* Column 3: {isEs ? 'CONVERTIR DESDE PDF' : 'CONVERT FROM PDF'} */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'CONVERTIR DESDE PDF' : 'CONVERT FROM PDF'}</p>
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

                {/* Column 4: {isEs ? 'EDICIÓN Y SEGURIDAD' : 'EDIT & SECURITY'} */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-3">{isEs ? 'EDICIÓN Y SEGURIDAD' : 'EDIT & SECURITY'}</p>
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
      />}

      {/* ── HERO / HEADER ──────────────────────────────────────────────────── */}
      {!isTool && !isAuthPage && !isAdminPage && !isPricing && (
        <header className={clsx(
          'w-full text-center transition-all duration-500 relative overflow-hidden',
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
                isEs ? (
                  <> El kit de herramientas PDF<br className="hidden sm:block" />
                    <span className="gradient-text"> más potente</span> gratis</>
                ) : (
                  <> The most powerful<br className="hidden sm:block" />
                    <span className="gradient-text"> PDF toolkit</span> free</>
                )
              )}
              {isPricing && (isEs ? 'Precios simples y transparentes' : 'Simple, transparent pricing')}
              {isCompare && (isEs ? 'TheyLovePDF vs Competidores' : 'TheyLovePDF vs Competitors')}
            </h1>

            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-6">
              {isHome && (isEs ? 'Más de 37 herramientas. Desarrollado por IA. Sin límites en el nivel gratuito. Confiado por profesionales de todo el mundo.' : '37+ tools. AI powered. Faster processing. No limits on free tier. Trusted by professionals worldwide.')}
              {isPricing && (isEs ? 'Haga más con TheyLovePDF Pro. Sin cargos ocultos, cancele en cualquier momento.' : 'Get more done with TheyLovePDF Pro. No hidden fees, cancel anytime.')}
              {isCompare && (isEs ? 'Por qué millones están cambiando a la alternativa más rápida, inteligente y asequible.' : 'Why millions are switching to the faster, smarter, and more affordable alternative.')}
            </p>

            {isHome && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {[
                  { icon: 'solar:stars-linear', label: isEs ? 'Con IA' : 'AI powered', cls: 'bg-purple-50 text-purple-600 border-purple-100' },
                  { icon: 'solar:widget-5-linear', label: isEs ? 'Más de 37 herramientas' : '37+ tools', cls: 'bg-blue-50 text-[#378ADD] border-blue-100' },
                  { icon: 'solar:user-cross-linear', label: isEs ? 'Sin registro' : 'No signup', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { icon: 'solar:shield-check-linear', label: isEs ? 'SSL de 256 bits' : '256-bit SSL', cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                  { icon: 'solar:devices-linear', label: isEs ? 'Todos los dispositivos' : 'All devices', cls: 'bg-gray-100 text-gray-600 border-gray-200', hidden: 'sm' },
                  { icon: 'solar:cloud-bold', label: isEs ? 'Rápido y seguro' : 'Fast & Secure', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', hidden: 'sm' },
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
                  placeholder={isEs ? 'Buscar herramientas... comprimir, unir, firmar...' : 'Search tools... compress, merge, sign...'}
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/es/login" element={<LoginPage lang="es" />} />
            <Route path="/fr/login" element={<LoginPage lang="fr" />} />
            
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/es/register" element={<RegisterPage lang="es" />} />
            <Route path="/fr/register" element={<RegisterPage lang="fr" />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/es/dashboard" element={<DashboardPage lang="es" />} />
              <Route path="/fr/dashboard" element={<DashboardPage lang="fr" />} />
            </Route>
            
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/es/forgot-password" element={<ForgotPasswordPage lang="es" />} />
            <Route path="/fr/forgot-password" element={<ForgotPasswordPage lang="fr" />} />
            
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/es/reset-password" element={<ResetPasswordPage lang="es" />} />
            <Route path="/fr/reset-password" element={<ResetPasswordPage lang="fr" />} />
            
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="/es/auth/callback" element={<OAuthCallbackPage lang="es" />} />
            <Route path="/fr/auth/callback" element={<OAuthCallbackPage lang="fr" />} />
            
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/es/payment-success" element={<PaymentSuccessPage lang="es" />} />
            <Route path="/fr/payment-success" element={<PaymentSuccessPage lang="fr" />} />
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

            {/* Spanish & French Static Routes */}
            <Route path="/es" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang="es" />} />
            <Route path="/es/pricing" element={<PricingPage lang="es" />} />
            <Route path="/es/compare" element={<ComparePage lang="es" />} />
            <Route path="/es/about" element={<AboutPage lang="es" />} />
            <Route path="/es/contact" element={<ContactPage lang="es" />} />
            <Route path="/es/privacy" element={<PrivacyPage lang="es" />} />
            <Route path="/es/terms" element={<TermsPage lang="es" />} />
            <Route path="/es/pdf-trends-2026" element={<PDFTrendsPage lang="es" />} />
            
            <Route path="/fr" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang="fr" />} />
            <Route path="/fr/pricing" element={<PricingPage lang="fr" />} />
            <Route path="/fr/compare" element={<ComparePage lang="fr" />} />
            <Route path="/fr/about" element={<AboutPage lang="fr" />} />
            <Route path="/fr/contact" element={<ContactPage lang="fr" />} />
            <Route path="/fr/privacy" element={<PrivacyPage lang="fr" />} />
            <Route path="/fr/terms" element={<TermsPage lang="fr" />} />
            <Route path="/fr/pdf-trends-2026" element={<PDFTrendsPage lang="fr" />} />

            <Route path="/tools/:toolSlug" element={<ToolRenderer />} />
            <Route path="/tools/:toolSlug/:platform" element={<ToolRenderer />} />
            <Route path="/es/tools/:toolSlug" element={<ToolRenderer lang="es" />} />
            <Route path="/es/tools/:toolSlug/:platform" element={<ToolRenderer lang="es" />} />
            <Route path="/fr/tools/:toolSlug" element={<ToolRenderer lang="fr" />} />
            <Route path="/fr/tools/:toolSlug/:platform" element={<ToolRenderer lang="fr" />} />
            <Route path="/sign/:token" element={<SigningPage />} />
            <Route path="/es/sign/:token" element={<SigningPage lang="es" />} />
            <Route path="/fr/sign/:token" element={<SigningPage lang="fr" />} />

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
              { title: isEs ? 'Herramientas' : isFr ? 'Outils' : 'Tools', links: [{ label: isEs ? 'Unir PDF' : isFr ? 'Fusionner PDF' : 'Merge PDF', path: '/tools/merge-pdf' }, { label: isEs ? 'Dividir PDF' : isFr ? 'Diviser PDF' : 'Split PDF', path: '/tools/split-pdf' }, { label: isEs ? 'Comprimir PDF' : isFr ? 'Compresser PDF' : 'Compress PDF', path: '/tools/compress-pdf' }, { label: isEs ? 'PDF a Word' : isFr ? 'PDF en Word' : 'PDF to Word', path: '/tools/pdf-to-word' }, { label: isEs ? 'Firmar PDF' : isFr ? 'Signer PDF' : 'Sign PDF', path: '/tools/sign-pdf' }, { label: isEs ? 'Editar PDF' : isFr ? 'Modifier PDF' : 'Edit PDF', path: '/tools/edit-pdf' }] },
              { title: isEs ? 'Compañía' : isFr ? 'Entreprise' : 'Company', links: [{ label: isEs ? 'Sobre nosotros' : isFr ? 'À propos' : 'About Us', path: '/about' }, { label: isEs ? 'Contacto' : isFr ? 'Contact' : 'Contact', path: '/contact' }, { label: isEs ? 'Precios' : isFr ? 'Tarifs' : 'Pricing', path: '/pricing' }, { label: 'Blog & Guides', path: '/blog' }, { label: 'PDF Trends 2026', path: '/pdf-trends-2026' }] },
              { title: isEs ? 'Legal' : isFr ? 'Légal' : 'Legal', links: [{ label: isEs ? 'Política de privacidad' : isFr ? 'Confidentialité' : 'Privacy Policy', path: '/privacy' }, { label: isEs ? 'Términos de servicio' : isFr ? 'Conditions' : 'Terms of Service', path: '/terms' }] },
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
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} TheyLovePDF. {isEs ? 'Todos los derechos reservados.' : isFr ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ display: pathToCheck.startsWith('/tools/') || pathToCheck.startsWith('/sign/') || isAuthPage || isAdminPage ? 'none' : undefined }}
      >
        {[
          { label: isEs ? 'Inicio' : 'Home', icon: 'solar:home-linear', path: '/' },
          { label: isEs ? 'Unir' : 'Merge', icon: 'solar:layers-linear', path: '/tools/merge-pdf' },
          { label: isEs ? 'Firmar' : 'Sign', icon: 'solar:pen-linear', path: '/tools/sign-pdf' },
          { label: isEs ? 'Chat de IA' : 'AI Chat', icon: 'solar:chat-round-linear', path: '/tools/chat-with-pdf' },
          { label: isEs ? 'Más' : 'More', icon: 'solar:hamburger-menu-linear', path: null },
        ].map(item => (
          item.path ? (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 transition-colors',
                location.pathname === item.path ? 'text-[#378ADD]' : 'text-gray-400'
              )}
            >
              <iconify-icon icon={item.icon} class="text-2xl"></iconify-icon>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ) : (
            <button
              key={item.label}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 text-gray-400"
            >
              <iconify-icon icon={item.icon} class="text-2xl"></iconify-icon>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          )
        ))}
      </nav>

      {/* Bottom spacer so content doesn't hide behind mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}