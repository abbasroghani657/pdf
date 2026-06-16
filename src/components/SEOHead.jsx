import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  const siteName = 'PDFMaster';
  const defaultDescription = 'The world\'s most powerful PDF toolkit. Free, fast, and secure. 37+ tools including merge, split, compress, sign, OCR, and AI chat.';
  
  const metaTitle = title ? `${title} - ${siteName}` : `${siteName} — Free PDF Tools Online`;
  const metaDesc = description || defaultDescription;
  
  // Clean the base URL (it usually comes in without /es prefix from ToolPage)
  const baseUrl = url ? (url.startsWith('/es') ? url.replace('/es', '') : url) : '';
  
  const englishUrl = baseUrl ? `https://www.theylovepdf.com${baseUrl}` : 'https://www.theylovepdf.com';
  const spanishUrl = baseUrl ? `https://www.theylovepdf.com/es${baseUrl}` : 'https://www.theylovepdf.com/es';
  
  const canonicalUrl = lang === 'es' ? spanishUrl : englishUrl;

  const schemas = [];

  // 1. WebSite or SoftwareApplication Schema
  if (toolName) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": `${toolName} - ${siteName}`,
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
        "text": step
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

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* International SEO (i18n) */}
      <link rel="alternate" hreflang="en" href={englishUrl} />
      <link rel="alternate" hreflang="es" href={spanishUrl} />
      <link rel="alternate" hreflang="x-default" href={englishUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
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
