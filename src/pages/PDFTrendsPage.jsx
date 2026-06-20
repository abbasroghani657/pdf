import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const sources = [
  { id: 1, cite: 'Phil Ydens, Adobe VP of Engineering (via PDF Association)', text: 'Industry estimates originating from Adobe Document Cloud telemetry highlighting the total estimated 2.5 Trillion PDFs stored globally.' },
  { id: 2, cite: 'Smallpdf / TechHQ Industry Reports', text: 'Analysis of document telemetrics indicating over 290 billion new PDFs are created and opened annually.' },
  { id: 3, cite: 'CloudFiles / AIIM International', text: 'Survey of enterprise adoption indicating 98% reliance on PDF formats for immutable record keeping and external communication.' },
  { id: 4, cite: 'Global Market Insights (2024)', text: 'PDF Editor Software Market Size By Deployment, Forecast 2024–2032.' },
];

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatBar({ value, max = 100, color, bgClass = 'bg-gray-100' }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 300);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className={`h-1.5 ${bgClass} rounded-full overflow-hidden mt-3`}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ProjectionBar({ year, value, max, label, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 400 + delay);
    return () => clearTimeout(t);
  }, [value, max, delay]);
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-10 text-gray-500 font-medium text-xs shrink-0 text-right">
        {year}
      </span>
      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative shadow-inner">
        <div
          className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center shadow-md"
          style={{ width: `${width}%`, background: 'linear-gradient(90deg, #378ADD, #60a5fa)' }}
        >
           <span className="absolute left-3 text-white font-semibold text-[10px] drop-shadow-sm whitespace-nowrap opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:opacity-100">
             {label}
           </span>
        </div>
      </div>
    </div>
  );
}

export default function PDFTrendsPage({ lang = 'en' }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "name": "Global PDF Usage Statistics and Market Trends 2026",
        "description": "A comprehensive dataset of global Portable Document Format (PDF) usage, market valuation, creation rates, and business adoption metrics compiled for 2025-2026.",
        "creator": { "@type": "Organization", "name": "TheyLovePDF Research", "sameAs": "https://www.theylovepdf.com" },
        "citation": [
          "Phil Ydens, Adobe VP of Engineering. Industry estimates via PDF Association.",
          "Smallpdf / TechHQ Industry Reports.",
          "CloudFiles / AIIM International. Paper-Free Progress.",
          "Global Market Insights. PDF Editor Software Market Size."
        ],
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "isAccessibleForFree": true,
        "variableMeasured": ["Total Global PDF Volume", "Annual PDF Creation Rate", "Business Adoption Rate", "Global PDF Software Market Valuation", "Asia-Pacific Regional Growth"]
      },
      {
        "@type": "Article",
        "headline": "Global PDF Trends 2026: Statistics & Market Outlook",
        "description": "Discover verified 2025-2026 statistics on PDF usage worldwide, including total volume, annual growth, and market valuation.",
        "author": { "@type": "Organization", "name": "TheyLovePDF" },
        "publisher": { "@type": "Organization", "name": "TheyLovePDF" }
      }
    ]
  };

  const heroRef = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeroVisible(true); },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const trillionCount = useCountUp(2500, 2000, heroVisible);
  const billionCount  = useCountUp(290,  1800, heroVisible);
  const adoptionCount = useCountUp(98,   1600, heroVisible);
  const marketCount   = useCountUp(215,  1400, heroVisible);

  return (
    <>
      <Helmet>
        <title>Global PDF Trends 2026: Statistics & Market Outlook | TheyLovePDF</title>
        <meta name="description" content="Discover verified 2025-2026 statistics on PDF usage worldwide. Learn about total PDF volume, annual growth rates, and market valuation in this comprehensive data report." />
        <link rel="canonical" href="https://www.theylovepdf.com/pdf-trends-2026" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* Main container with bright, light premium aesthetic */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 pt-0 pb-20 font-sans text-gray-900">

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative overflow-hidden border-b border-gray-200">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, #378ADD 0%, transparent 70%)' }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
              {lang === 'es' ? 'Tendencias Globales de ' : lang === 'fr' ? 'Tendances Mondiales des ' : lang === 'de' ? 'Globale PDF ' : lang === 'pt' ? 'Tendências Globais de ' : 'Global PDF '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#378ADD] to-indigo-600">
                {lang === 'es' || lang === 'fr' || lang === 'pt' ? 'PDF' : 'Trends'}
              </span> 
              <span className="text-gray-400 font-light"> 2026</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
              {lang === 'es' ? 'El Formato de Documento Portátil sigue siendo la piedra angular de la infraestructura digital global. Explore nuestras estadísticas verificadas sobre la escala, el crecimiento y el futuro de los documentos digitales.' :
               lang === 'fr' ? 'Le Format de Document Portable reste la pierre angulaire de l\'infrastructure numérique mondiale. Découvrez nos statistiques vérifiées sur l\'échelle, la croissance et l\'avenir des documents numériques.' :
               lang === 'de' ? 'Das Portable Document Format bleibt der Eckpfeiler der globalen digitalen Infrastruktur. Entdecken Sie unsere verifizierten Statistiken über Größe, Wachstum und Zukunft digitaler Dokumente.' :
               lang === 'pt' ? 'O Portable Document Format continua sendo a pedra angular da infraestrutura digital global. Explore nossas estatísticas verificadas sobre a escala, crescimento e futuro dos documentos digitais.' :
               'The Portable Document Format remains the cornerstone of global digital infrastructure. Explore our verified statistics on the scale, growth, and future of digital documents.'}
            </p>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/5 max-w-4xl mx-auto divide-x divide-y md:divide-y-0 divide-gray-100">
              {[
                { v: `${(trillionCount / 1000).toFixed(1)}T+`, l: lang === 'es' ? 'PDFs en existencia' : lang === 'fr' ? 'PDFs en existence' : lang === 'de' ? 'PDFs im Umlauf' : lang === 'pt' ? 'PDFs em existência' : 'PDFs in existence', c: 'text-[#378ADD]' },
                { v: `${billionCount}B`,                        l: lang === 'es' ? 'Creados anualmente' : lang === 'fr' ? 'Créés annuellement' : lang === 'de' ? 'Jährlich erstellt' : lang === 'pt' ? 'Criados anualmente' : 'Created annually', c: 'text-emerald-500' },
                { v: `${adoptionCount}%`,                       l: lang === 'es' ? 'Adopción empresarial' : lang === 'fr' ? 'Adoption en entreprise' : lang === 'de' ? 'Unternehmensadoption' : lang === 'pt' ? 'Adoção corporativa' : 'Business adoption', c: 'text-purple-500' },
                { v: `$${(marketCount / 100).toFixed(2)}B`,     l: lang === 'es' ? 'Mercado en 2024' : lang === 'fr' ? 'Marché en 2024' : lang === 'de' ? 'Marktgröße 2024' : lang === 'pt' ? 'Mercado em 2024' : 'Market size 2024', c: 'text-orange-500' },
              ].map((s, i) => (
                <div key={i} className="px-4 py-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors">
                  <span className={`text-3xl md:text-4xl font-black mb-1 tracking-tight ${s.c}`}>{s.v}</span>
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wider text-center">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEFINITION CARD (AEO) ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-6 -mt-6 opacity-50"></div>
            <p className="text-[#378ADD] text-xs uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#378ADD] animate-pulse"></span>
              {lang === 'es' ? 'Hallazgo Clave' : lang === 'fr' ? 'Découverte Clé' : lang === 'de' ? 'Wichtigste Erkenntnis' : lang === 'pt' ? 'Descoberta Principal' : 'Key Finding'}
            </p>
            <h2 className="text-gray-900 text-xl md:text-2xl font-extrabold mb-4">
              {lang === 'es' ? '¿Cuál es el número total de PDFs en el mundo?' : lang === 'fr' ? 'Quel est le nombre total de PDFs dans le monde ?' : lang === 'de' ? 'Wie hoch ist die Gesamtzahl der PDFs weltweit?' : lang === 'pt' ? 'Qual é o número total de PDFs no mundo?' : 'What is the total number of PDFs in the world?'}
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              {lang === 'es' ? 'A partir de 2025, existen más de ' : lang === 'fr' ? 'En 2025, il existe plus de ' : lang === 'de' ? 'Ab 2025 gibt es weltweit über ' : lang === 'pt' ? 'A partir de 2025, existem mais de ' : 'As of 2025, there are over '}
              <strong className="text-[#378ADD] font-extrabold">{lang === 'es' || lang === 'pt' ? '2.5 billones de PDFs' : lang === 'fr' ? '2.5 billions de PDFs' : lang === 'de' ? '2,5 Billionen PDFs' : '2.5 trillion PDFs'}<sup className="text-[10px] ml-0.5">[1]</sup></strong>{' '}
              {lang === 'es' ? 'en existencia en todo el mundo. Más de ' : lang === 'fr' ? 'en existence dans le monde. Plus de ' : lang === 'de' ? 'im Umlauf. Mehr als ' : lang === 'pt' ? 'em existência em todo o mundo. Mais de ' : 'in existence worldwide. More than '}
              <strong className="text-[#378ADD] font-extrabold">{lang === 'es' ? '290 mil millones de nuevos PDFs' : lang === 'fr' ? '290 milliards de nouveaux PDFs' : lang === 'de' ? '290 Milliarden neue PDFs' : lang === 'pt' ? '290 bilhões de novos PDFs' : '290 billion new PDFs'}<sup className="text-[10px] ml-0.5">[2]</sup></strong>{' '}
              {lang === 'es' ? 'se crean anualmente — una tasa de crecimiento del 12%. Además, el ' : lang === 'fr' ? 'sont créés chaque année — un taux de croissance de 12%. De plus, ' : lang === 'de' ? 'werden jährlich erstellt — eine Wachstumsrate von 12%. Zudem nutzen ' : lang === 'pt' ? 'são criados anualmente — uma taxa de crescimento de 12%. Além disso, ' : 'are created annually — a 12% year-over-year growth rate. Additionally, '}
              <strong className="text-gray-900 font-bold">{lang === 'es' ? '98% de las empresas' : lang === 'fr' ? '98% des entreprises' : lang === 'de' ? '98% der Unternehmen' : lang === 'pt' ? '98% das empresas' : '98% of businesses'}</strong>
              {lang === 'es' ? ' utilizan PDF como su formato predeterminado para comunicaciones externas, convirtiéndolo en el segundo tipo de archivo más utilizado en Internet después de las imágenes JPEG.' : lang === 'fr' ? ' utilisent le PDF comme format par défaut pour les communications externes, ce qui en fait le deuxième type de fichier le plus utilisé sur Internet après les images JPEG.' : lang === 'de' ? ' PDF als Standardformat für die externe Kommunikation, was es zum am zweithäufigsten genutzten Dateityp im Internet nach JPEG-Bildern macht.' : lang === 'pt' ? ' utilizam o PDF como seu formato padrão para comunicações externas, tornando-o o segundo tipo de arquivo mais utilizado na internet, atrás apenas de imagens JPEG.' : ' utilize PDF as their default format for external communications, making it the second most-served file type on the internet after JPEG images.'}
            </p>
          </div>
        </section>

        {/* ── BENTO GRID ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Total Volume — large accent box */}
            <div className="md:col-span-7 bg-gradient-to-br from-[#378ADD] to-blue-700 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative h-full flex flex-col justify-between min-h-[260px]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                      01 — {lang === 'es' ? 'Volumen Global' : lang === 'fr' ? 'Volume Global' : lang === 'de' ? 'Globales Volumen' : lang === 'pt' ? 'Volume Global' : 'Global Volume'}
                    </span>
                    <sup className="text-blue-100 font-medium text-xs bg-blue-800/50 px-1.5 rounded">[1]</sup>
                  </div>
                  <div className="text-5xl md:text-7xl font-black tracking-tighter mb-3 drop-shadow-sm">2.5T+</div>
                  <p className="text-blue-100 text-base max-w-sm leading-relaxed font-medium">
                    {lang === 'es' ? 'Archivos PDF totales estimados actualmente en existencia en toda la infraestructura digital global.' : lang === 'fr' ? 'Nombre total estimé de fichiers PDF actuellement en existence dans l\'infrastructure numérique mondiale.' : lang === 'de' ? 'Geschätzte Gesamtzahl der derzeit existierenden PDF-Dateien in der gesamten globalen digitalen Infrastruktur.' : lang === 'pt' ? 'Total estimado de arquivos PDF atualmente em existência em toda a infraestrutura digital global.' : 'Estimated total PDF files currently in existence across all global digital infrastructure.'}
                  </p>
                </div>
                <StatBar value={90} max={100} color="#ffffff" bgClass="bg-blue-900/40" />
              </div>
            </div>

            {/* Creation Rate */}
            <div className="md:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-700 bg-emerald-500" />
              <div className="relative h-full flex flex-col justify-between min-h-[260px]">
                <div>
                  <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-px bg-emerald-200"></span>
                    02 — {lang === 'es' ? 'Creación Anual' : lang === 'fr' ? 'Création Annuelle' : lang === 'de' ? 'Jährliche Erstellung' : lang === 'pt' ? 'Criação Anual' : 'Annual Creation'}
                  </span>
                  <div className="text-4xl md:text-5xl text-gray-900 font-black mt-4 tracking-tight">290B</div>
                  <p className="text-gray-500 mt-1 text-sm font-medium">
                    {lang === 'es' ? 'Nuevos PDFs creados por año' : lang === 'fr' ? 'Nouveaux PDFs créés par an' : lang === 'de' ? 'Neue PDFs pro Jahr erstellt' : lang === 'pt' ? 'Novos PDFs criados por ano' : 'New PDFs created per year'}
                  </p>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    {lang === 'es' ? '+12% Crecimiento Interanual' : lang === 'fr' ? '+12% Croissance Annuelle' : lang === 'de' ? '+12% Wachstum' : lang === 'pt' ? '+12% Crescimento Anual' : '+12% YoY Growth'}
                  </span>
                  <StatBar value={72} max={100} color="#10b981" />
                </div>
              </div>
            </div>

            {/* Business Adoption */}
            <div className="md:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-700 bg-purple-500" />
              <div className="relative h-full flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-purple-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-4 h-px bg-purple-200"></span> 03 — {lang === 'es' ? 'Adopción Empresarial' : lang === 'fr' ? 'Adoption en Entreprise' : lang === 'de' ? 'Unternehmensadoption' : lang === 'pt' ? 'Adoção Corporativa' : 'Business Adoption'} <sup className="text-purple-300">[3]</sup>
                  </span>
                  <div className="text-4xl text-gray-900 font-black tracking-tight">98%</div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">
                    {lang === 'es' ? 'De las empresas usan PDF como su formato externo predeterminado.' : lang === 'fr' ? 'Des entreprises utilisent le PDF comme format externe par défaut.' : lang === 'de' ? 'Der Unternehmen nutzen PDF als Standard-Ausgangsformat.' : lang === 'pt' ? 'Das empresas usam PDF como seu formato externo padrão.' : 'Of enterprises use PDF as their default external format.'}
                  </p>
                  <StatBar value={98} max={100} color="#a855f7" />
                </div>
              </div>
            </div>

            {/* Market Size */}
            <div className="md:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-700 bg-orange-500" />
              <div className="relative h-full flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-4 h-px bg-orange-200"></span> 04 — {lang === 'es' ? 'Tamaño del Mercado' : lang === 'fr' ? 'Taille du Marché' : lang === 'de' ? 'Marktgröße' : lang === 'pt' ? 'Tamanho do Mercado' : 'Market Size'} '24 <sup className="text-orange-300">[4]</sup>
                  </span>
                  <div className="text-4xl text-gray-900 font-black tracking-tight">$2.15B</div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">
                    {lang === 'es' ? 'Proyectado para alcanzar ' : lang === 'fr' ? 'Prévu pour atteindre ' : lang === 'de' ? 'Voraussichtlich ' : lang === 'pt' ? 'Projetado para atingir ' : 'Projected to reach '}<strong className="text-gray-900">$5.7B</strong>{lang === 'es' ? ' para 2033 (11.5% CAGR).' : lang === 'fr' ? ' d\'ici 2033 (11,5% CAGR).' : lang === 'de' ? ' bis 2033 (11,5% CAGR).' : lang === 'pt' ? ' até 2033 (11,5% CAGR).' : ' by 2033 (11.5% CAGR).'}
                  </p>
                  <StatBar value={38} max={100} color="#f97316" />
                </div>
              </div>
            </div>

            {/* Internet Rank */}
            <div className="md:col-span-4 bg-gray-900 rounded-3xl border border-gray-800 p-6 shadow-xl shadow-gray-900/10 group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-700 bg-white" />
              <div className="relative h-full flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-4 h-px bg-gray-600"></span> 05 — {lang === 'es' ? 'Cuota en la Web' : lang === 'fr' ? 'Part du Web' : lang === 'de' ? 'Web-Anteil' : lang === 'pt' ? 'Compartilhamento na Web' : 'Web File Share'}
                  </span>
                  <div className="text-4xl text-white font-black tracking-tight">#2</div>
                </div>
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                  {lang === 'es' ? 'El tipo de archivo más servido en la Web, solo por detrás de las imágenes JPEG.' : lang === 'fr' ? 'Le type de fichier le plus servi sur le Web, juste derrière les images JPEG.' : lang === 'de' ? 'Am zweithäufigsten genutzter Dateityp im Internet nach JPEG-Bildern.' : lang === 'pt' ? 'O tipo de arquivo mais servido na Web, atrás apenas de imagens JPEG.' : 'Most-served filetype on the Web, trailing only behind JPEG images.'}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── PROJECTION TIMELINE ── */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-[1fr_2fr] gap-10 items-center">
              <div>
                <p className="text-[#378ADD] text-xs font-bold uppercase tracking-widest mb-2">{lang === 'es' ? 'Proyección del Mercado' : lang === 'fr' ? 'Projection du Marché' : lang === 'de' ? 'Marktprognose' : lang === 'pt' ? 'Projeção de Mercado' : 'Market Projection'}</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                  {lang === 'es' ? 'De $2.15B a ' : lang === 'fr' ? 'De 2,15 MM$ à ' : lang === 'de' ? 'Von $2,15 Mrd. auf ' : lang === 'pt' ? 'De $2,15B para ' : 'From $2.15B to '}<br/>
                  <span className="text-[#378ADD]">{lang === 'es' ? '$5.7B para 2033' : lang === 'fr' ? '5,7 MM$ d\'ici 2033' : lang === 'de' ? '$5,7 Mrd. bis 2033' : lang === 'pt' ? '$5,7B até 2033' : '$5.7B by 2033'}</span>
                </h2>
                <p className="text-gray-500 text-base mt-4 leading-relaxed">
                  {lang === 'es' ? 'El mercado de software PDF se expande a un 11.5% de CAGR impulsado por la digitalización, los mandatos de cumplimiento y los flujos de trabajo en la nube.' : lang === 'fr' ? 'Le marché des logiciels PDF est en expansion avec un TCAC de 11,5% stimulé par la numérisation, les mandats de conformité et les flux de travail cloud.' : lang === 'de' ? 'Der Markt für PDF-Software wächst um 11,5% CAGR, angetrieben durch Digitalisierung, Compliance-Mandate und cloud-native Workflows.' : lang === 'pt' ? 'O mercado de software PDF está se expandindo a um CAGR de 11,5% impulsionado pela digitalização, mandatos de conformidade e fluxos de trabalho nativos da nuvem.' : 'The PDF software market is expanding at an 11.5% CAGR driven by enterprise digitisation, stringent compliance mandates, and cloud-native document workflows.'}
                </p>
              </div>
              <div className="space-y-3 bg-gray-50 p-5 md:p-6 rounded-2xl border border-gray-100 shadow-inner">
                {[
                  { year: '2024', value: 2.15, max: 5.7, label: '$2.15B' },
                  { year: '2025', value: 2.4,  max: 5.7, label: '$2.40B (est.)' },
                  { year: '2027', value: 3.0,  max: 5.7, label: '$3.0B (proj.)' },
                  { year: '2030', value: 4.1,  max: 5.7, label: '$4.1B (proj.)' },
                  { year: '2033', value: 5.7,  max: 5.7, label: '$5.7B (proj.)' },
                ].map((row, i) => (
                  <ProjectionBar key={i} {...row} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SOURCES ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{lang === 'es' ? 'Fuentes y Metodología' : lang === 'fr' ? 'Sources & Méthodologie' : lang === 'de' ? 'Quellen & Methodik' : lang === 'pt' ? 'Fontes e Metodologia' : 'Sources & Methodology'}</h2>
            <p className="text-gray-500 text-base leading-relaxed">
              {lang === 'es' ? 'Estadísticas agregadas de los principales analistas de la industria para proporcionar una visión general precisa de la gestión de documentos.' : lang === 'fr' ? 'Statistiques agrégées auprès des principaux analystes de l\'industrie pour fournir un aperçu précis de la gestion des documents.' : lang === 'de' ? 'Statistiken wurden von führenden Branchenanalysten aggregiert, um einen genauen Überblick über das Dokumentenmanagement zu geben.' : lang === 'pt' ? 'Estatísticas agregadas de analistas líderes do setor para fornecer uma visão geral precisa da gestão de documentos.' : 'Statistics aggregated from leading industry analysts and enterprise PDF software providers to provide an accurate overview of the document management ecosystem.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {sources.map(s => (
              <div key={s.id} id={`source-${s.id}`} className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-[#378ADD] font-bold text-xs">
                  {s.id}
                </span>
                <div>
                  <p className="text-gray-900 text-sm font-bold mb-1">{s.cite}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0d1f3c] to-[#0a1628] p-8 md:p-14 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#378ADD 1px, transparent 1px), linear-gradient(90deg, #378ADD 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10">
              <p className="text-[#378ADD] text-xs font-bold uppercase tracking-widest mb-4">{lang === 'es' ? 'Únete al ecosistema' : lang === 'fr' ? 'Rejoignez l\'écosystème' : lang === 'de' ? 'Treten Sie dem Ökosystem bei' : lang === 'pt' ? 'Junte-se ao ecossistema' : 'Join the ecosystem'}</p>
              <h2 className="text-white text-4xl md:text-5xl font-black mb-4 tracking-tight">
                {lang === 'es' ? '2.5 Billones' : lang === 'fr' ? '2.5 Billions' : lang === 'de' ? '2,5 Billionen' : lang === 'pt' ? '2.5 Trilhões' : '2.5 Trillion'}<sup className="text-white/40 text-xl md:text-2xl ml-1.5 align-top">[1]</sup>
              </h2>
              <p className="text-blue-100/70 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
                {lang === 'es' ? 'Los PDFs están circulando por el mundo en este momento. Trabaje con ellos más rápido utilizando nuestras herramientas seguras y ultrarrápidas.' : lang === 'fr' ? 'Les PDFs circulent dans le monde entier en ce moment même. Travaillez plus rapidement grâce à nos outils sécurisés et ultrarapides.' : lang === 'de' ? 'PDFs zirkulieren derzeit um die Welt. Arbeiten Sie schneller mit ihnen mithilfe unserer sicheren und blitzschnellen Werkzeuge.' : lang === 'pt' ? 'Os PDFs estão circulando pelo mundo agora mesmo. Trabalhe com eles mais rápido usando nossas ferramentas seguras e ultrarrápidas.' : 'PDFs are circulating the world right now. Work with them faster using our secure, lightning-fast tools.'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/tools/merge-pdf" className="px-6 py-3 rounded-lg text-white font-bold bg-[#378ADD] hover:bg-blue-600 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/30 text-base">
                  {lang === 'es' ? 'Unir PDFs →' : lang === 'fr' ? 'Fusionner PDFs →' : lang === 'de' ? 'PDFs Zusammenführen →' : lang === 'pt' ? 'Mesclar PDFs →' : 'Merge PDFs →'}
                </Link>
                <Link to="/tools/compress-pdf" className="px-6 py-3 rounded-lg text-white font-bold border-2 border-white/20 hover:bg-white/10 transition-all hover:-translate-y-0.5 text-base">
                  {lang === 'es' ? 'Comprimir PDFs' : lang === 'fr' ? 'Compresser PDFs' : lang === 'de' ? 'PDFs Komprimieren' : lang === 'pt' ? 'Comprimir PDFs' : 'Compress PDFs'}
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
