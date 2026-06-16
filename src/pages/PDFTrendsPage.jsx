import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const sources = [
  { id: 1, cite: 'Phil Ydens, Adobe VP of Engineering (via PDF Association)', text: 'Industry estimates from Adobe Document Cloud telemetry — 2.5 trillion PDFs stored globally.' },
  { id: 2, cite: 'Smallpdf / TechHQ Industry Reports', text: 'Telemetrics analysis indicating 290 billion+ PDFs created and opened annually.' },
  { id: 3, cite: 'CloudFiles / AIIM International', text: 'Enterprise adoption survey — 98% reliance on PDF for immutable records and external communication.' },
  { id: 4, cite: 'Global Market Insights (2024)', text: 'PDF Editor Software Market Size by Deployment, Forecast 2024–2032.' },
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

function StatBar({ value, max = 100, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 300);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-3">
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
    <div className="flex items-center gap-4">
      <span className="w-10 text-white/30 text-xs shrink-0 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {year}
      </span>
      <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: 'linear-gradient(90deg, #378ADD, #60a5fa)' }}
        />
        <span className="absolute inset-y-0 left-3 flex items-center text-white/60 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default function PDFTrendsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "name": "Global PDF Usage Statistics and Market Trends 2026",
        "description": "A comprehensive dataset of global Portable Document Format (PDF) usage, market valuation, creation rates, and business adoption metrics compiled for 2025-2026.",
        "creator": { "@type": "Organization", "name": "PDFMaster Research", "sameAs": "https://www.theylovepdf.com" },
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
        "author": { "@type": "Organization", "name": "PDFMaster" },
        "publisher": { "@type": "Organization", "name": "PDFMaster" }
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
        <title>Global PDF Trends 2026: Statistics & Market Outlook | PDFMaster</title>
        <meta name="description" content="Discover verified 2025-2026 statistics on PDF usage worldwide. Learn about total PDF volume, annual growth rates, and market valuation in this comprehensive data report." />
        <link rel="canonical" href="https://www.theylovepdf.com/pdf-trends-2026" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* ── Google Fonts ── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Main container with primary brand blue integrated into dark theme */}
      <div className="min-h-screen bg-[#0a0a0f] pt-0 pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative overflow-hidden border-b border-white/8">
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(ellipse, #378ADD 0%, transparent 70%)' }} />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 rounded-full text-xs tracking-widest uppercase border" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#378ADD', borderColor: '#378ADD40', background: '#378ADD12' }}>
                Data Report · 2026
              </span>
              <span className="w-8 h-px bg-white/20" />
              <span className="text-white/30 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>PDF Association · Adobe · Smallpdf</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-8" style={{ fontWeight: 700 }}>
              Global PDF
              <br />
              <span style={{ color: '#378ADD' }}>Trends</span>
              <span className="text-white/20"> 2026</span>
            </h1>

            <p className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed mb-12" style={{ fontWeight: 300 }}>
              The Portable Document Format remains the cornerstone of global digital infrastructure.
              Verified statistics on scale, growth, and the future of digital documents.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 border border-white/8 rounded-2xl overflow-hidden shadow-lg shadow-[#378ADD]/5">
              {[
                { v: `${(trillionCount / 1000).toFixed(1)}T+`, l: 'PDFs in existence' },
                { v: `${billionCount}B`,                        l: 'Created annually' },
                { v: `${adoptionCount}%`,                       l: 'Business adoption' },
                { v: `$${(marketCount / 100).toFixed(2)}B`,     l: 'Market size 2024' },
              ].map((s, i) => (
                <div key={i} className="bg-[#0f0f17] px-6 py-5 flex flex-col gap-1">
                  <span className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{s.v}</span>
                  <span className="text-white/35 text-xs uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEFINITION CARD (AEO) ── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-start">
            <div>
              <p className="text-white/25 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Key Finding</p>
              <h2 className="text-white/90 text-2xl md:text-3xl leading-tight" style={{ fontWeight: 600 }}>
                What is the total number of PDFs in the world?
              </h2>
            </div>
            <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] shadow-sm">
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                As of 2025, there are over{' '}
                <strong className="text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>2.5 trillion PDFs<sup className="text-[10px] text-white/40 ml-0.5">[1]</sup></strong>{' '}
                in existence worldwide. More than{' '}
                <strong className="text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>290 billion new PDFs<sup className="text-[10px] text-white/40 ml-0.5">[2]</sup></strong>{' '}
                are created annually — a 12% year-over-year growth rate. Additionally,{' '}
                <strong className="text-white">98% of businesses</strong> utilize PDF as their default format for external communications, making it the second most-served file type on the internet after JPEG.
              </p>
            </div>
          </div>
        </section>

        {/* ── BENTO GRID ── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Total Volume — large */}
            <div className="md:col-span-7 relative rounded-3xl overflow-hidden border border-white/8 group cursor-default" style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 60%, #050c18 100%)' }}>
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-[80px] group-hover:opacity-50 transition-opacity duration-700" style={{ background: '#378ADD' }} />
              <div className="relative p-8 md:p-10 h-full flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[#378ADD] text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>01 — Total Global Volume</span>
                    <sup className="text-white/25 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[1]</sup>
                  </div>
                  <div className="text-white leading-none mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 700 }}>2.5T+</div>
                  <p className="text-white/40 text-sm max-w-xs leading-relaxed">PDF files currently in existence across all global digital infrastructure.</p>
                </div>
                <StatBar value={90} max={100} color="#378ADD" />
              </div>
            </div>

            {/* Creation Rate */}
            <div className="md:col-span-5 rounded-3xl border border-white/8 bg-[#0f0f17] group cursor-default overflow-hidden relative">
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-[60px] group-hover:opacity-40 transition-opacity duration-700" style={{ background: '#22c55e' }} />
              <div className="relative p-8 h-full flex flex-col justify-between min-h-[280px]">
                <div>
                  <span className="text-[#22c55e] text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>02 — Annual Creation Rate</span>
                  <div className="text-white mt-4 leading-none mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700 }}>290B</div>
                  <p className="text-white/40 text-sm leading-relaxed">New PDFs created per year</p>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs mt-4 inline-block" style={{ fontFamily: "'JetBrains Mono', monospace", background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}>↑ +12% YoY</span>
                  <StatBar value={72} max={100} color="#22c55e" />
                </div>
              </div>
            </div>

            {/* Business Adoption */}
            <div className="md:col-span-4 rounded-3xl border border-white/8 bg-[#0f0f17] group cursor-default overflow-hidden relative">
              <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full opacity-15 blur-[50px] group-hover:opacity-35 transition-opacity duration-700" style={{ background: '#a78bfa' }} />
              <div className="relative p-8 h-full flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="text-[#a78bfa] text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>03 — Business Adoption <sup className="text-white/25">[3]</sup></span>
                  <div className="text-white mt-4 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 700 }}>98%</div>
                </div>
                <div>
                  <p className="text-white/40 text-sm leading-relaxed mt-3">Of enterprises use PDF as their default external documentation format.</p>
                  <StatBar value={98} max={100} color="#a78bfa" />
                </div>
              </div>
            </div>

            {/* Market Size */}
            <div className="md:col-span-4 rounded-3xl border border-white/8 bg-[#0f0f17] group cursor-default overflow-hidden relative">
              <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full opacity-15 blur-[50px] group-hover:opacity-35 transition-opacity duration-700" style={{ background: '#f97316' }} />
              <div className="relative p-8 h-full flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="text-[#f97316] text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>04 — Market Size 2024 <sup className="text-white/25">[4]</sup></span>
                  <div className="text-white mt-4 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>$2.15B</div>
                </div>
                <div>
                  <p className="text-white/40 text-sm leading-relaxed mt-3">Projected to reach <span className="text-white/70">$5.7B</span> by 2033 at 11.5% CAGR.</p>
                  <StatBar value={38} max={100} color="#f97316" />
                </div>
              </div>
            </div>

            {/* Internet Rank */}
            <div className="md:col-span-4 rounded-3xl border border-white/8 bg-[#0f0f17] group cursor-default overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-[40px] group-hover:opacity-25 transition-opacity duration-700" style={{ background: '#e2e8f0' }} />
              <div className="relative p-8 h-full flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>05 — Internet File Share</span>
                  <div className="text-white mt-4 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 700 }}>#2</div>
                </div>
                <p className="text-white/40 text-sm leading-relaxed mt-3">Most-served filetype on the Web, behind only JPEG image formats.</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── PROJECTION TIMELINE ── */}
        <section className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
            <div className="grid md:grid-cols-[1fr_2fr] gap-10 items-start">
              <div>
                <p className="text-white/25 text-xs uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Market Projection</p>
                <h2 className="text-white text-2xl md:text-3xl leading-tight" style={{ fontWeight: 600 }}>From $2.15B to $5.7B by 2033</h2>
                <p className="text-white/40 text-sm mt-4 leading-relaxed">The PDF software market is expanding at 11.5% CAGR driven by enterprise digitisation, compliance mandates, and cloud-native document workflows.</p>
              </div>
              <div className="space-y-3">
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
        <section className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
            <p className="text-white/25 text-xs uppercase tracking-widest mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sources & Methodology</p>
            <p className="text-white/40 text-sm max-w-3xl mb-8 leading-relaxed">Statistics aggregated from leading industry analysts and enterprise PDF software providers to provide an accurate overview of the document management ecosystem.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {sources.map(s => (
                <div key={s.id} id={`source-${s.id}`} className="flex gap-4 p-4 rounded-xl border border-white/6 bg-white/[0.015]">
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white/8 text-white/30 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.id}</span>
                  <div>
                    <p className="text-white/70 text-sm" style={{ fontWeight: 500 }}>{s.cite}</p>
                    <p className="text-white/35 text-xs mt-1 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="relative rounded-3xl overflow-hidden border border-[#378ADD]/20 p-10 md:p-16 text-center" style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 100%)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#378ADD 1px, transparent 1px), linear-gradient(90deg, #378ADD 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative">
                <p className="text-[#378ADD]/80 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Join the ecosystem</p>
                <h2 className="text-white text-4xl md:text-6xl mb-3" style={{ fontWeight: 700 }}>
                  2.5 Trillion<sup className="text-white/20 text-xl ml-1 align-top">[1]</sup>
                </h2>
                <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">PDFs are circulating the world right now. Work with them faster using our secure, lightning-fast tools.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/tools/merge-pdf" className="px-8 py-3.5 rounded-xl text-white text-sm transition-all hover:-translate-y-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", background: '#378ADD', fontWeight: 600 }}>
                    Merge PDFs →
                  </Link>
                  <Link to="/tools/compress-pdf" className="px-8 py-3.5 rounded-xl text-white/70 text-sm border border-white/15 bg-white/5 transition-all hover:bg-white/10 hover:-translate-y-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                    Compress PDFs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
