import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { TOOLS_DATA_FR } from '../data/tools-fr';
import { TOOLS_DATA_DE } from '../data/tools-de';
import { TOOLS_DATA_PT } from '../data/tools-pt';
import { slugify } from '../utils/slugify';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

// ── Category config with color themes ──────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',      label: 'All tools',  icon: 'solar:widget-5-bold-duotone' },
  { id: 'convert',  label: 'Convert',    icon: 'solar:refresh-bold-duotone' },
  { id: 'organize', label: 'Organize',   icon: 'solar:layers-bold-duotone' },
  { id: 'optimize', label: 'Optimize',   icon: 'solar:zip-file-bold-duotone' },
  { id: 'security', label: 'Security',   icon: 'solar:shield-keyhole-bold-duotone' },
  { id: 'edit',     label: 'Edit',       icon: 'solar:pen-bold-duotone' },
  { id: 'sign',     label: 'eSign',      icon: 'solar:pen-new-square-bold-duotone' },
  { id: 'ai',       label: 'AI Tools',   icon: 'solar:stars-bold-duotone', isAI: true },
];

// ── Category gradient themes (iLovePDF style colored headers) ─────────────────
const CATEGORY_GRADIENTS = {
  convert:  { from: '#4F8EF7', to: '#1D60D4', light: '#EFF6FF', text: '#1D60D4' },
  organize: { from: '#22C5A0', to: '#0E9977', light: '#ECFDF5', text: '#0E9977' },
  optimize: { from: '#34D399', to: '#059669', light: '#ECFDF5', text: '#059669' },
  security: { from: '#F87171', to: '#DC2626', light: '#FEF2F2', text: '#DC2626' },
  edit:     { from: '#FBBF24', to: '#D97706', light: '#FFFBEB', text: '#D97706' },
  sign:     { from: '#A78BFA', to: '#7C3AED', light: '#F5F3FF', text: '#7C3AED' },
  ai:       { from: '#E879F9', to: '#9333EA', light: '#FDF4FF', text: '#9333EA' },
};

// ── Section titles for grouped display ────────────────────────────────────────
const SECTION_ORDER = [
  { id: 'convert',  title: 'Convert PDF',       desc: 'Transform PDFs to and from any format' },
  { id: 'organize', title: 'Organize PDF',       desc: 'Rearrange and manage your PDF pages' },
  { id: 'optimize', title: 'Optimize PDF',       desc: 'Compress, repair and enhance your files' },
  { id: 'security', title: 'PDF Security',       desc: 'Protect and secure your PDF files' },
  { id: 'edit',     title: 'Edit PDF',           desc: 'Annotate, watermark and enhance PDFs' },
  { id: 'sign',     title: 'eSign PDF',          desc: 'Digitally sign and collect signatures' },
  { id: 'ai',       title: 'AI-Powered Tools',   desc: 'Intelligent automation for your documents' },
];

export default function HomePage({ searchQuery, setSearchQuery, lang = 'en' }) {
  const { isPro } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const toolDataList = lang === 'es' ? TOOLS_DATA_ES : lang === 'fr' ? TOOLS_DATA_FR : lang === 'de' ? TOOLS_DATA_DE : lang === 'pt' ? TOOLS_DATA_PT : TOOLS_DATA;

  const filteredTools = toolDataList.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group tools by category for section display
  const groupedTools = SECTION_ORDER.map(section => ({
    ...section,
    tools: filteredTools.filter(t => t.category === section.id),
  })).filter(s => s.tools.length > 0);

  const openTool = (tool) => {
    const toolIndex = toolDataList.findIndex(t => t === tool);
    const enTool = TOOLS_DATA[toolIndex];
    const slug = slugify(enTool ? enTool.title : tool.title);
    const prefix = lang === 'es' ? '/es' : lang === 'fr' ? '/fr' : lang === 'de' ? '/de' : lang === 'pt' ? '/pt' : '';
    navigate(`${prefix}/tools/${slug}`);
  };

  const isSearching = searchQuery.trim().length > 0;

  const translatedCategories = CATEGORIES.map(c => {
    if (lang === 'en') return c;
    if (lang === 'es') {
      const labels = { 'all': 'Todas', 'convert': 'Convertir', 'organize': 'Organizar', 'optimize': 'Optimizar', 'security': 'Seguridad', 'edit': 'Editar', 'sign': 'Firmar', 'ai': 'IA Tools' };
      return { ...c, label: labels[c.id] };
    }
    if (lang === 'fr') {
      const labels = { 'all': 'Toutes', 'convert': 'Convertir', 'organize': 'Organiser', 'optimize': 'Optimiser', 'security': 'Sécurité', 'edit': 'Modifier', 'sign': 'Signer', 'ai': 'Outils IA' };
      return { ...c, label: labels[c.id] };
    }
    if (lang === 'de') {
      const labels = { 'all': 'Alle', 'convert': 'Konvertieren', 'organize': 'Organisieren', 'optimize': 'Optimieren', 'security': 'Sicherheit', 'edit': 'Bearbeiten', 'sign': 'Unterschreiben', 'ai': 'KI-Tools' };
      return { ...c, label: labels[c.id] };
    }
    if (lang === 'pt') {
      const labels = { 'all': 'Todas', 'convert': 'Converter', 'organize': 'Organizar', 'optimize': 'Otimizar', 'security': 'Segurança', 'edit': 'Editar', 'sign': 'Assinar', 'ai': 'Ferramentas de IA' };
      return { ...c, label: labels[c.id] };
    }
    return c;
  });

  return (
    <div className="space-y-6">
      <SEOHead />

      {/* ── Category Filter Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {translatedCategories.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 border',
              activeCategory === tab.id
                ? tab.isAI
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-transparent shadow-md shadow-purple-200'
                  : 'bg-[#378ADD] text-white border-[#378ADD] shadow-md shadow-blue-100'
                : tab.isAI
                  ? 'text-purple-600 border-purple-100 hover:bg-purple-50 bg-white'
                  : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 bg-white'
            )}
          >
            <iconify-icon icon={tab.icon} class="text-base"></iconify-icon>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search Result Flat Grid (when searching) ─────────────────────────── */}
      {isSearching && (
        <>
          {filteredTools.length > 0 ? (
            <>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filteredTools.length}</span> {lang === 'es' ? 'herramientas encontradas para' : lang === 'fr' ? 'outils trouvés pour' : lang === 'de' ? 'Werkzeuge gefunden für' : lang === 'pt' ? 'ferramentas encontradas para' : 'tools found for'} "<span className="text-[#378ADD]">{searchQuery}</span>"
              </p>
              <div className="tools-grid">
                {filteredTools.map((tool, idx) => (
                  <ToolCard key={idx} tool={tool} onClick={() => openTool(tool)} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState setSearchQuery={setSearchQuery} setActiveCategory={setActiveCategory} lang={lang} />
          )}
        </>
      )}

      {/* ── Default Grid (All Tools or Single Category) ───────────────────────── */}
      {!isSearching && (
        <>
          {filteredTools.length > 0 ? (
            <div className="tools-grid">
              {filteredTools.map((tool, idx) => (
                <ToolCard key={idx} tool={tool} onClick={() => openTool(tool)} lang={lang} />
              ))}
            </div>
          ) : (
            <EmptyState setSearchQuery={setSearchQuery} setActiveCategory={setActiveCategory} lang={lang} />
          )}
        </>
      )}

      {/* ── Bottom CTA Banner ───────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 text-center mt-6"
        style={{ background: 'linear-gradient(135deg, #1a3a6e 0%, #378ADD 60%, #5b9ee8 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-xl" />
          <div className="absolute -bottom-8 -left-8 w-64 h-64 rounded-full bg-white/5 blur-xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full bg-white/5 blur-2xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold text-white mb-4 border border-white/20">
            <iconify-icon icon="solar:stars-bold" class="text-yellow-300 text-sm"></iconify-icon>
            PLAN PRO
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {lang === 'es' ? '¿Listo para un poder ilimitado?' : lang === 'fr' ? 'Prêt pour une puissance illimitée ?' : lang === 'de' ? 'Bereit für unbegrenzte Macht?' : lang === 'pt' ? 'Pronto para poder ilimitado?' : 'Ready for unlimited power?'}
          </h2>
          <p className="text-blue-100 text-sm mb-7 max-w-md mx-auto">
            {lang === 'es' ? 'Desbloquee más de 37 herramientas por solo $4.99/mes.' : lang === 'fr' ? 'Débloquez plus de 37 outils pour seulement 4,99 $/mois.' : lang === 'de' ? 'Schalten Sie über 37 Werkzeuge für nur 4,99 $/Monat frei.' : lang === 'pt' ? 'Desbloqueie mais de 37 ferramentas por apenas $ 4,99/mês.' : 'Unlock all 37+ tools, 2GB file sizes, batch processing, API access, and zero ads for just $4.99/month.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(lang === 'en' ? '/pricing' : `/${lang}/pricing`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#378ADD] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <iconify-icon icon="solar:crown-bold" class="text-base text-amber-500"></iconify-icon>
              {lang === 'es' ? 'Ver Precios' : lang === 'fr' ? 'Voir les Tarifs' : lang === 'de' ? 'Preise ansehen' : lang === 'pt' ? 'Ver Preços' : 'View Pricing'}
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              <iconify-icon icon="solar:play-bold" class="text-base"></iconify-icon>
              {lang === 'es' ? 'Pruébalo gratis' : lang === 'fr' ? 'Essayez gratuitement' : lang === 'de' ? 'Kostenlos testen' : lang === 'pt' ? 'Experimente grátis' : 'Try free — no card needed'}
            </button>
          </div>
          {/* Trust pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {[
              { icon: 'solar:shield-check-bold', text: '256-bit SSL' },
              { icon: 'solar:user-cross-bold', text: lang === 'es' ? 'Sin registro' : lang === 'fr' ? 'Sans inscription' : lang === 'de' ? 'Ohne Anmeldung' : lang === 'pt' ? 'Sem registro' : 'No signup required' },
              { icon: 'solar:trash-bin-minimalistic-bold', text: lang === 'es' ? 'Borrado automático' : lang === 'fr' ? 'Suppression auto' : lang === 'de' ? 'Autom. Löschung' : lang === 'pt' ? 'Exclusão automática' : 'Auto-delete files' },
            ].map((pill, i) => (
              <div key={i} className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                <iconify-icon icon={pill.icon} class="text-white/60 text-sm"></iconify-icon>
                {pill.text}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Tool Card Component (Exact iLovePDF Style) ────────────────────────────────
function ToolCard({ tool, onClick, lang }) {
  const gradient = CATEGORY_GRADIENTS[tool.category];
  const iconColor = gradient ? gradient.from : '#378ADD';

  return (
    <div
      onClick={onClick}
      className="tool-card group relative bg-white rounded-[10px] cursor-pointer overflow-hidden p-6 flex flex-col items-start gap-4"
    >
      {/* ── Icon (Top Left) ────────── */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-50 transition-transform duration-300 group-hover:scale-[1.05]"
      >
        <iconify-icon icon={tool.icon} class="text-[28px]" style={{ color: iconColor }}></iconify-icon>
      </div>

      {/* ── Text Content ────────── */}
      <div className="flex flex-col flex-1 text-left w-full">
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">
          {tool.title}
        </h3>
        <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
          {tool.desc}
        </p>
      </div>

      {/* ── Badge ────────── */}
      {tool.badge && (
        <span className={clsx(
          'absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full border',
          tool.badge.text === 'AI' || tool.badge.text?.includes('AI')
            ? 'bg-purple-50 text-purple-700 border-purple-100'
            : tool.badge.text === 'Popular'
              ? 'bg-red-50 text-red-600 border-red-100'
              : tool.badge.text === 'New'
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : tool.badge.text === 'Pro'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
        )}>
          {tool.badge.text === 'AI' || tool.badge.text?.includes('AI') ? (
            <span className="flex items-center gap-0.5">
              <iconify-icon icon="solar:stars-bold" class="text-[8px]"></iconify-icon>
              {tool.badge.text}
            </span>
          ) : tool.badge.text}
        </span>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ setSearchQuery, setActiveCategory, lang }) {
  return (
    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <iconify-icon icon="solar:file-remove-bold-duotone" class="text-3xl text-gray-400"></iconify-icon>
      </div>
      <h3 className="text-base font-bold text-gray-900">{lang === 'es' ? 'No se encontraron herramientas' : lang === 'fr' ? 'Aucun outil trouvé' : lang === 'de' ? 'Keine Werkzeuge gefunden' : lang === 'pt' ? 'Nenhuma ferramenta encontrada' : 'No tools found'}</h3>
      <p className="text-sm text-gray-500 mt-1">{lang === 'es' ? 'Pruebe con un término de búsqueda o categoría diferente.' : lang === 'fr' ? 'Essayez un terme de recherche ou une catégorie différente.' : lang === 'de' ? 'Versuchen Sie einen anderen Suchbegriff oder eine andere Kategorie.' : lang === 'pt' ? 'Tente um termo de pesquisa ou categoria diferente.' : 'Try a different search term or category.'}</p>
      <button
        onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
        className="mt-5 px-5 py-2 bg-[#378ADD] text-white text-xs font-bold rounded-xl hover:bg-[#2b71b8] transition-colors shadow-sm"
      >
        {lang === 'es' ? 'Borrar filtros' : lang === 'fr' ? 'Effacer les filtres' : lang === 'de' ? 'Filter löschen' : lang === 'pt' ? 'Limpar filtros' : 'Clear filters'}
      </button>
    </div>
  );
}
