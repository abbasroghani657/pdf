import React from 'react';
import { Helmet } from 'react-helmet-async';

// All 30 supported languages with prefixes
const ALL_LANGS = [
  { code: 'en', prefix: '' },
  { code: 'es', prefix: '/es' },
  { code: 'fr', prefix: '/fr' },
  { code: 'de', prefix: '/de' },
  { code: 'pt', prefix: '/pt' },
  { code: 'hi', prefix: '/hi' },
  { code: 'ru', prefix: '/ru' },
  { code: 'zh-cn', prefix: '/zh-cn' },
  { code: 'zh-tw', prefix: '/zh-tw' },
  { code: 'ja', prefix: '/ja' },
  { code: 'ko', prefix: '/ko' },
  { code: 'it', prefix: '/it' },
  { code: 'pl', prefix: '/pl' },
  { code: 'ro', prefix: '/ro' },
  { code: 'bg', prefix: '/bg' },
  { code: 'ca', prefix: '/ca' },
  { code: 'nl', prefix: '/nl' },
  { code: 'el', prefix: '/el' },
  { code: 'id', prefix: '/id' },
  { code: 'ms', prefix: '/ms' },
  { code: 'sv', prefix: '/sv' },
  { code: 'th', prefix: '/th' },
  { code: 'tr', prefix: '/tr' },
  { code: 'uk', prefix: '/uk' },
  { code: 'vi', prefix: '/vi' },
  { code: 'sw', prefix: '/sw' },
  { code: 'fi', prefix: '/fi' },
  { code: 'da', prefix: '/da' },
  { code: 'no', prefix: '/no' },
  { code: 'cs', prefix: '/cs' },
];

// Language-specific alt text for meta descriptions (all 30 languages)
const ALT_TEXT_MAP = {
  en: ' The #1 free alternative to iLovePDF.',
  es: ' La mejor alternativa a iLovePDF gratis.',
  fr: ' La meilleure alternative gratuite à iLovePDF.',
  de: ' Die beste kostenlose iLovePDF Alternative.',
  pt: ' A melhor alternativa gratuita ao iLovePDF.',
  hi: ' iLovePDF का #1 मुफ़्त विकल्प।',
  ru: ' Лучшая бесплатная альтернатива iLovePDF.',
  'zh-cn': ' iLovePDF 的 #1 免费替代品。',
  'zh-tw': ' iLovePDF 的 #1 免費替代品。',
  ja: ' iLovePDF の #1 無料代替ツール。',
  ko: ' iLovePDF의 #1 무료 대안.',
  it: ' La migliore alternativa gratuita a iLovePDF.',
  pl: ' Najlepsza darmowa alternatywa dla iLovePDF.',
  ro: ' Cea mai bună alternativă gratuită la iLovePDF.',
  bg: ' Най-добрата безплатна алтернатива на iLovePDF.',
  ca: ' La millor alternativa gratuïta a iLovePDF.',
  nl: ' Het beste gratis alternatief voor iLovePDF.',
  el: ' Η #1 δωρεάν εναλλακτική του iLovePDF.',
  id: ' Alternatif gratis #1 untuk iLovePDF.',
  ms: ' Alternatif percuma #1 untuk iLovePDF.',
  sv: ' Det bästa gratis alternativet till iLovePDF.',
  th: ' ทางเลือกฟรีอันดับ 1 แทน iLovePDF',
  tr: ' iLovePDF için #1 ücretsiz alternatif.',
  uk: ' Найкраща безкоштовна альтернатива iLovePDF.',
  vi: ' Giải pháp thay thế miễn phí #1 cho iLovePDF.',
  sw: ' Mbadala bure #1 wa iLovePDF.',
  fi: ' Paras ilmainen vaihtoehto iLovePDF:lle.',
  da: ' Det bedste gratis alternativ til iLovePDF.',
  no: ' Det beste gratis alternativet til iLovePDF.',
  cs: ' Nejlepší bezplatná alternativa k iLovePDF.',
};

export default function SEOHead({ 
  lang = 'en',
  title, 
  description, 
  url, 
  type = 'website',
  image = 'https://www.theylovepdf.com/og-image.png',
  toolName,
  howToSteps = [],
  faqs = []
}) {
  const siteName = 'TheyLovePDF';
  const defaultDescription = 'TheyLovePDF: ✓ Free & Secure. ✓ No Watermarks. ✓ Auto-delete in 2 hours. Edit, convert, compress, and sign PDFs in seconds. 100% free online PDF toolkit.';
  
  const metaTitle = title ? `${title} - ${siteName}` : `Online PDF Editor & Converter - ${siteName}`;
  const altText = ALT_TEXT_MAP[lang] || ALT_TEXT_MAP['en'];
  const metaDesc = (description || defaultDescription) + altText;

  // Determine the og:type — tool pages should be WebApplication, not website
  const ogType = toolName ? 'WebApplication' : type;
  
  // Clean the base URL — strip any language prefix to get the bare route
  let baseUrl = url || '';
  const langEntry = ALL_LANGS.find(l => l.prefix && baseUrl.startsWith(l.prefix));
  if (langEntry) {
    baseUrl = baseUrl.slice(langEntry.prefix.length) || '/';
  }
  // Ensure baseUrl starts correctly
  if (baseUrl && !baseUrl.startsWith('/')) baseUrl = '/' + baseUrl;

  // Generate URL for any language
  const getUrlForLang = (langCode) => {
    const entry = ALL_LANGS.find(l => l.code === langCode);
    const prefix = entry ? entry.prefix : '';
    const path = baseUrl === '/' ? '' : baseUrl;
    return `https://www.theylovepdf.com${prefix}${path}`;
  };

  const canonicalUrl = getUrlForLang(lang);
  const englishUrl = getUrlForLang('en');

  const schemas = [];

  // 1. WebSite or SoftwareApplication or Article Schema
  if (type === 'article') {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": metaTitle,
      "description": metaDesc,
      "image": image,
      "author": {
        "@type": "Organization",
        "name": siteName
      },
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.theylovepdf.com/logo.png"
        }
      }
    });
  } else if (toolName) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": `${toolName} - ${siteName}`,
      "url": canonicalUrl,
      "description": metaDesc,
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    });
  } else {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": "https://www.theylovepdf.com"
    });
  }

  // 2. HowTo Schema
  if (howToSteps && howToSteps.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to use ${toolName}`,
      "description": `Step by step guide to use the ${toolName} tool.`,
      "step": howToSteps.map((step, idx) => ({
        "@type": "HowToStep",
        "name": `Step ${idx + 1}`,
        "text": step,
        "url": `${canonicalUrl}#step-${idx + 1}`
      }))
    });
  }

  // 3. FAQPage Schema
  if (faqs && faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  }

  // 4. BreadcrumbList Schema — fixed: /tools points to homepage (no dedicated /tools page)
  if (toolName) {
    const homeUrl = getUrlForLang(lang).replace(baseUrl === '/' ? '' : baseUrl, '') || getUrlForLang(lang).split('/tools/')[0];
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": homeUrl || 'https://www.theylovepdf.com'
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": toolName,
          "item": canonicalUrl
        }
      ]
    });
  }

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* International SEO — all 30 languages hreflang */}
      {ALL_LANGS.map(l => (
        <link key={l.code} rel="alternate" hreflang={l.code} href={getUrlForLang(l.code)} />
      ))}
      <link rel="alternate" hreflang="x-default" href={englishUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@theylovepdf" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data / JSON-LD */}
      {schemas.map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
