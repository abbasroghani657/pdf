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

// ── Translations for Homepage SEO ───────────────────────────────────────────────
const HOME_TITLES = {
  en: 'Free Online PDF Tools', es: 'Herramientas PDF Gratuitas en Línea', fr: 'Outils PDF Gratuits en Ligne', de: 'Kostenlose Online-PDF-Tools', pt: 'Ferramentas PDF Gratuitas Online',
  hi: 'मुफ़्त ऑनलाइन PDF टूल', ru: 'Бесплатные онлайн PDF-инструменты', 'zh-cn': '免费在线 PDF 工具', 'zh-tw': '免費線上 PDF 工具', ja: '無料のオンラインPDFツール',
  ko: '무료 온라인 PDF 도구', it: 'Strumenti PDF gratuiti online', pl: 'Darmowe narzędzia PDF online', ro: 'Instrumente PDF gratuite online', bg: 'Безплатни онлайн PDF инструменти',
  ca: 'Eines PDF gratuïtes en línia', nl: 'Gratis online PDF-tools', el: 'Δωρεάν διαδικτυακά εργαλεία PDF', id: 'Alat PDF Online Gratis', ms: 'Alat PDF Dalam Talian Percuma',
  sv: 'Gratis online PDF-verktyg', th: 'เครื่องมือ PDF ออนไลน์ฟรี', tr: 'Ücretsiz Çevrimiçi PDF Araçları', uk: 'Безкоштовні онлайн-інструменти PDF', vi: 'Công cụ PDF trực tuyến miễn phí',
  sw: 'Zana za PDF za bure mtandaoni', fi: 'Ilmaiset online-PDF-työkalut', da: 'Gratis online PDF-værktøjer', no: 'Gratis online PDF-verktøy', cs: 'Bezplatné online nástroje PDF'
};

const HOME_DESCRIPTIONS = {
  en: 'TheyLovePDF: 37+ free online PDF tools. Merge, compress, convert, edit, and sign PDFs in seconds. No watermarks. No signup required.',
  es: 'TheyLovePDF: Más de 37 herramientas PDF gratuitas. Fusionar, comprimir, convertir, editar y firmar PDFs en segundos. Sin marca de agua. Sin registro.',
  fr: 'TheyLovePDF: Plus de 37 outils PDF gratuits. Fusionner, compresser, convertir, éditer et signer des PDF en quelques secondes. Sans filigrane. Sans inscription.',
  de: 'TheyLovePDF: Über 37 kostenlose PDF-Tools. PDF zusammenführen, komprimieren, konvertieren, bearbeiten und unterschreiben in Sekunden. Ohne Wasserzeichen. Ohne Anmeldung.',
  pt: 'TheyLovePDF: Mais de 37 ferramentas PDF gratuitas. Mesclar, comprimir, converter, editar e assinar PDFs em segundos. Sem marca d\'água. Sem cadastro.',
  hi: 'TheyLovePDF: 37+ मुफ़्त ऑनलाइन PDF टूल। सेकंडों में PDF को मर्ज, कंप्रेस, कन्वर्ट, एडिट और साइन करें। कोई वॉटरमार्क नहीं। कोई साइनअप आवश्यक नहीं।',
  ru: 'TheyLovePDF: 37+ бесплатных онлайн PDF-инструментов. Объединяйте, сжимайте, конвертируйте, редактируйте и подписывайте PDF-файлы за секунды. Без водяных знаков. Без регистрации.',
  'zh-cn': 'TheyLovePDF：37+ 免费在线 PDF 工具。在几秒钟内合并、压缩、转换、编辑和签名 PDF。无水印。无需注册。',
  'zh-tw': 'TheyLovePDF：37+ 免費線上 PDF 工具。在幾秒鐘內合併、壓縮、轉換、編輯和簽名 PDF。無浮水印。無需註冊。',
  ja: 'TheyLovePDF: 37以上の無料オンラインPDFツール。数秒でPDFを結合、圧縮、変換、編集、署名します。透かしなし。登録不要。',
  ko: 'TheyLovePDF: 37개 이상의 무료 온라인 PDF 도구. 몇 초 만에 PDF 병합, 압축, 변환, 편집 및 서명. 워터마크 없음. 가입 불필요.',
  it: 'TheyLovePDF: Oltre 37 strumenti PDF gratuiti. Unisci, comprimi, converti, modifica e firma i PDF in pochi secondi. Nessuna filigrana. Nessuna registrazione.',
  pl: 'TheyLovePDF: Ponad 37 darmowych narzędzi PDF. Łącz, kompresuj, konwertuj, edytuj i podpisuj PDF w kilka sekund. Bez znaków wodnych. Bez rejestracji.',
  ro: 'TheyLovePDF: 37+ instrumente PDF gratuite online. Îmbină, comprimă, convertește, editează și semnează PDF-uri în câteva secunde. Fără filigrane. Fără înregistrare.',
  bg: 'TheyLovePDF: 37+ безплатни онлайн PDF инструмента. Обединявайте, компресирайте, конвертирайте, редактирайте и подписвайте PDF файлове за секунди. Без водни знаци. Без регистрация.',
  ca: 'TheyLovePDF: Més de 37 eines PDF gratuïtes en línia. Combina, comprimeix, converteix, edita i signa PDF en qüestió de segons. Sense filigranes. Sense registre.',
  nl: 'TheyLovePDF: 37+ gratis online PDF-tools. PDF\'s samenvoegen, comprimeren, converteren, bewerken en ondertekenen in enkele seconden. Geen watermerken. Geen aanmelding vereist.',
  el: 'TheyLovePDF: 37+ δωρεάν διαδικτυακά εργαλεία PDF. Συγχωνεύστε, συμπιέστε, μετατρέψτε, επεξεργαστείτε και υπογράψτε PDF σε δευτερόλεπτα. Χωρίς υδατογραφήματα. Δεν απαιτείται εγγραφή.',
  id: 'TheyLovePDF: 37+ alat PDF online gratis. Gabungkan, kompres, konversi, edit, dan tanda tangani PDF dalam hitungan detik. Tanpa tanda air. Tidak perlu mendaftar.',
  ms: 'TheyLovePDF: 37+ alat PDF dalam talian percuma. Gabungkan, mampatkan, tukar, edit dan tandatangan PDF dalam beberapa saat. Tiada tera air. Tiada pendaftaran diperlukan.',
  sv: 'TheyLovePDF: 37+ gratis online PDF-verktyg. Slå ihop, komprimera, konvertera, redigera och signera PDF:er på några sekunder. Inga vattenstämplar. Ingen registrering krävs.',
  th: 'TheyLovePDF: 37+ เครื่องมือ PDF ออนไลน์ฟรี รวม, บีบอัด, แปลง, แก้ไข และเซ็นชื่อ PDF ในไม่กี่วินาที ไม่มีลายน้ำ ไม่ต้องลงทะเบียน',
  tr: 'TheyLovePDF: 37+ ücretsiz çevrimiçi PDF aracı. PDF\'leri saniyeler içinde birleştirin, sıkıştırın, dönüştürün, düzenleyin ve imzalayın. Filigran yok. Kayıt gerekmez.',
  uk: 'TheyLovePDF: 37+ безкоштовних онлайн-інструментів PDF. Об\'єднуйте, стискайте, перетворюйте, редагуйте та підписуйте PDF-файли за лічені секунди. Без водяних знаків. Без реєстрації.',
  vi: 'TheyLovePDF: Hơn 37 công cụ PDF trực tuyến miễn phí. Nối, nén, chuyển đổi, chỉnh sửa và ký tệp PDF trong vài giây. Không có hình mờ. Không cần đăng ký.',
  sw: 'TheyLovePDF: Zana 37+ za PDF za bure mtandaoni. Unganisha, finyaza, badilisha, hariri na utie saini PDF kwa sekunde. Hakuna alama za maji. Hakuna kujiandikisha.',
  fi: 'TheyLovePDF: Yli 37 ilmaista online-PDF-työkalua. Yhdistä, pakkaa, muunna, muokkaa ja allekirjoita PDF-tiedostoja sekunneissa. Ei vesileimoja. Ei rekisteröitymistä.',
  da: 'TheyLovePDF: 37+ gratis online PDF-værktøjer. Flet, komprimer, konverter, rediger og underskriv PDF\'er på få sekunder. Ingen vandmærker. Ingen tilmelding kræves.',
  no: 'TheyLovePDF: 37+ gratis online PDF-verktøy. Slå sammen, komprimer, konverter, rediger og signer PDF-er på sekunder. Ingen vannmerker. Ingen registrering kreves.',
  cs: 'TheyLovePDF: Více než 37 bezplatných online nástrojů PDF. Slučujte, komprimujte, převádějte, upravujte a podepisujte PDF během několika sekund. Bez vodoznaků. Není nutná registrace.'
};

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
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tool.title.toLowerCase().includes(query) ||
      tool.desc.toLowerCase().includes(query) ||
      (tool.keywords && tool.keywords.some(k => k.toLowerCase().includes(query)));
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
    const prefix = lang !== 'en' ? `/${lang}` : '';
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
      <SEOHead 
        lang={lang}
        title={HOME_TITLES[lang] || HOME_TITLES['en']}
        description={HOME_DESCRIPTIONS[lang] || HOME_DESCRIPTIONS['en']}
        url="/"
      />

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

      {/* ── Information / Trust Signals ─────────────────────────────────────── */}
      <section className="py-12 mt-8 border-t border-gray-100">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{lang === 'es' ? '¿Por qué elegir TheyLovePDF?' : lang === 'fr' ? 'Pourquoi choisir TheyLovePDF ?' : lang === 'de' ? 'Warum TheyLovePDF wählen?' : lang === 'pt' ? 'Por que escolher TheyLovePDF?' : 'Why Choose TheyLovePDF?'}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">{lang === 'es' ? 'Herramientas de PDF gratuitas, seguras y fáciles de usar.' : lang === 'fr' ? 'Outils PDF gratuits, sécurisés et faciles à utiliser.' : lang === 'de' ? 'Kostenlose, sichere und einfach zu bedienende PDF-Tools.' : lang === 'pt' ? 'Ferramentas de PDF gratuitas, seguras e fáceis de usar.' : 'Free, secure, and easy-to-use PDF tools that make you more productive.'}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { icon: 'solar:widget-add-bold-duotone', title: lang === 'es' ? 'Colección extensa' : 'Extensive collection', desc: lang === 'es' ? 'Todo lo que necesitas en un solo lugar. Más de 37 herramientas.' : 'Everything you need in one place. Over 37+ tools.' },
            { icon: 'solar:shield-check-bold-duotone', title: lang === 'es' ? 'La seguridad es prioridad' : 'Safety is important to us', desc: lang === 'es' ? 'Archivos encriptados y eliminados automáticamente después de 2 horas.' : 'Files are encrypted and automatically deleted after 2 hours.' },
            { icon: 'solar:monitor-smartphone-bold-duotone', title: lang === 'es' ? 'Sin instalación' : 'No installation necessary', desc: lang === 'es' ? 'Funciona directamente en tu navegador en cualquier dispositivo.' : 'Works directly in your web browser on any device.' },
            { icon: 'solar:wallet-bold-duotone', title: lang === 'es' ? '100% Gratis' : '100% free of charge', desc: lang === 'es' ? 'Usa todas las herramientas gratis sin marcas de agua.' : 'Use all tools completely free without watermarks.' },
            { icon: 'solar:infinity-bold-duotone', title: lang === 'es' ? 'Sin límites ocultos' : 'No hidden limits', desc: lang === 'es' ? 'Procesa archivos de hasta 10MB gratis, o 2GB en Pro.' : 'Process files up to 10MB for free, or 2GB on Pro.' },
            { icon: 'solar:verified-check-bold-duotone', title: lang === 'es' ? 'Fácil de usar' : 'Easy to use', desc: lang === 'es' ? 'Diseño intuitivo que te ahorra tiempo en cada tarea.' : 'Intuitive design that saves you time on every task.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#378ADD] flex items-center justify-center shrink-0">
                <iconify-icon icon={item.icon} class="text-2xl"></iconify-icon>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social Share & Developer ────────────────────────────────────────── */}
      <section className="py-10 mb-6 bg-gradient-to-b from-transparent to-gray-50 rounded-3xl text-center border border-gray-100/50">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{lang === 'es' ? '¡Ayúdanos a crecer!' : 'Please share TheyLovePDF with friends'}</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{lang === 'es' ? 'Escribe un artículo sobre nuestras herramientas en tu blog o compártelo.' : 'Write an article about our tools on your blog, forum, or share it on social media.'}</p>
        
        <div className="flex items-center justify-center gap-4 mb-10">
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://theylovepdf.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
            <iconify-icon icon="fa6-brands:facebook-f" class="text-xl"></iconify-icon>
          </a>
          <a href="https://twitter.com/intent/tweet?url=https://theylovepdf.com&text=Check%20out%20this%20awesome%20PDF%20toolkit!" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
            <iconify-icon icon="fa6-brands:x-twitter" class="text-xl"></iconify-icon>
          </a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://theylovepdf.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
            <iconify-icon icon="fa6-brands:linkedin-in" class="text-xl"></iconify-icon>
          </a>
        </div>

      </section>

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
      className="tool-card group relative bg-white rounded-2xl sm:rounded-xl cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col border border-gray-100 hover:border-[#378ADD]/30 hover:shadow-[0_8px_30px_rgba(55,138,221,0.12)] transition-all duration-300 min-h-[140px] sm:min-h-0 gap-3 sm:gap-4 justify-between sm:justify-start"
    >
      {/* ── Top Area (Icon & Arrow) ────────── */}
      <div className="flex justify-between items-start w-full">
        <div 
          className={clsx(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm border border-gray-50 transition-transform duration-300 group-hover:scale-[1.05]",
            tool.iconColorClass || 'bg-blue-50 text-blue-500'
          )}
        >
          <iconify-icon icon={tool.icon} class="text-[22px] sm:text-[28px]" style={{ color: tool.iconColorClass ? undefined : iconColor }}></iconify-icon>
        </div>
        <iconify-icon icon="solar:alt-arrow-right-linear" class="text-gray-300 text-sm sm:hidden group-hover:text-[#378ADD] transition-colors mt-1 mr-1"></iconify-icon>
      </div>

      {/* ── Text Content ────────── */}
      <div className="flex flex-col w-full text-left mt-auto sm:mt-0">
        <h3 className="text-[13px] sm:text-[15px] font-bold text-gray-900 leading-tight mb-1 line-clamp-1">
          {tool.title}
        </h3>
        <p className="text-[10px] sm:text-[13px] text-gray-500 leading-snug font-medium line-clamp-1 sm:line-clamp-2">
          {tool.desc}
        </p>
      </div>

      {/* ── Badge ────────── */}
      {tool.badge && (
        <span className={clsx(
          'absolute top-3 right-8 sm:top-4 sm:right-4 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full border',
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
              <iconify-icon icon="solar:stars-bold" class="text-[7px] sm:text-[8px]"></iconify-icon>
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
