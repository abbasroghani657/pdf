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
              Global PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#378ADD] to-indigo-600">Trends</span> <span className="text-gray-400 font-light">2026</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
              The Portable Document Format remains the cornerstone of global digital infrastructure.
              Explore our verified statistics on the scale, growth, and future of digital documents.
            </p>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/5 max-w-4xl mx-auto divide-x divide-y md:divide-y-0 divide-gray-100">
              {[
                { v: `${(trillionCount / 1000).toFixed(1)}T+`, l: 'PDFs in existence', c: 'text-[#378ADD]' },
                { v: `${billionCount}B`,                        l: 'Created annually', c: 'text-emerald-500' },
                { v: `${adoptionCount}%`,                       l: 'Business adoption', c: 'text-purple-500' },
                { v: `$${(marketCount / 100).toFixed(2)}B`,     l: 'Market size 2024', c: 'text-orange-500' },
              ].map((s, i) => (
                <div key={i} className="px-4 py-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors">
                  <span className={`text-3xl md:text-4xl font-black mb-1 tracking-tight ${s.c}`}>{s.v}</span>
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{s.l}</span>
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
              Key Finding
            </p>
            <h2 className="text-gray-900 text-xl md:text-2xl font-extrabold mb-4">
              What is the total number of PDFs in the world?
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              As of 2025, there are over{' '}
              <strong className="text-[#378ADD] font-extrabold">2.5 trillion PDFs<sup className="text-[10px] ml-0.5">[1]</sup></strong>{' '}
              in existence worldwide. More than{' '}
              <strong className="text-[#378ADD] font-extrabold">290 billion new PDFs<sup className="text-[10px] ml-0.5">[2]</sup></strong>{' '}
              are created annually — a 12% year-over-year growth rate. Additionally,{' '}
              <strong className="text-gray-900 font-bold">98% of businesses</strong> utilize PDF as their default format for external communications, making it the second most-served file type on the internet after JPEG images.
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
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">01 — Global Volume</span>
                    <sup className="text-blue-100 font-medium text-xs bg-blue-800/50 px-1.5 rounded">[1]</sup>
                  </div>
                  <div className="text-5xl md:text-7xl font-black tracking-tighter mb-3 drop-shadow-sm">2.5T+</div>
                  <p className="text-blue-100 text-base max-w-sm leading-relaxed font-medium">Estimated total PDF files currently in existence across all global digital infrastructure.</p>
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
                    02 — Annual Creation
                  </span>
                  <div className="text-4xl md:text-5xl text-gray-900 font-black mt-4 tracking-tight">290B</div>
                  <p className="text-gray-500 mt-1 text-sm font-medium">New PDFs created per year</p>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    +12% YoY Growth
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
                    <span className="w-4 h-px bg-purple-200"></span> 03 — Business Adoption <sup className="text-purple-300">[3]</sup>
                  </span>
                  <div className="text-4xl text-gray-900 font-black tracking-tight">98%</div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">Of enterprises use PDF as their default external format.</p>
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
                    <span className="w-4 h-px bg-orange-200"></span> 04 — Market Size '24 <sup className="text-orange-300">[4]</sup>
                  </span>
                  <div className="text-4xl text-gray-900 font-black tracking-tight">$2.15B</div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">Projected to reach <strong className="text-gray-900">$5.7B</strong> by 2033 (11.5% CAGR).</p>
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
                    <span className="w-4 h-px bg-gray-600"></span> 05 — Web File Share
                  </span>
                  <div className="text-4xl text-white font-black tracking-tight">#2</div>
                </div>
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                  Most-served filetype on the Web, trailing only behind JPEG images.
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
                <p className="text-[#378ADD] text-xs font-bold uppercase tracking-widest mb-2">Market Projection</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">From $2.15B to <br/><span className="text-[#378ADD]">$5.7B by 2033</span></h2>
                <p className="text-gray-500 text-base mt-4 leading-relaxed">
                  The PDF software market is expanding at an 11.5% CAGR driven by enterprise digitisation, stringent compliance mandates, and cloud-native document workflows.
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
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Sources & Methodology</h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Statistics aggregated from leading industry analysts and enterprise PDF software providers to provide an accurate overview of the document management ecosystem.
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
              <p className="text-[#378ADD] text-xs font-bold uppercase tracking-widest mb-4">Join the ecosystem</p>
              <h2 className="text-white text-4xl md:text-5xl font-black mb-4 tracking-tight">
                2.5 Trillion<sup className="text-white/40 text-xl md:text-2xl ml-1.5 align-top">[1]</sup>
              </h2>
              <p className="text-blue-100/70 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
                PDFs are circulating the world right now. Work with them faster using our secure, lightning-fast tools.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/tools/merge-pdf" className="px-6 py-3 rounded-lg text-white font-bold bg-[#378ADD] hover:bg-blue-600 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/30 text-base">
                  Merge PDFs →
                </Link>
                <Link to="/tools/compress-pdf" className="px-6 py-3 rounded-lg text-white font-bold border-2 border-white/20 hover:bg-white/10 transition-all hover:-translate-y-0.5 text-base">
                  Compress PDFs
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
