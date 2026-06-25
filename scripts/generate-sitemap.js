import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS_DATA } from '../src/data/tools.js';
import { slugify } from '../src/utils/slugify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.theylovepdf.com';

const baseStaticRoutes = [
  '/',
  '/tools',
  '/pricing',
  '/compare',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/pdf-trends-2026',
  '/desktop', // Aggressive SEO
  '/extension', // Aggressive SEO
  '/for/business', // Use Cases
  '/for/real-estate', // Use Cases
  '/for/legal' // Use Cases
];

const baseToolRoutes = [];

TOOLS_DATA.forEach(t => {
  const baseSlug = `/tools/${slugify(t.title)}`;
  baseToolRoutes.push(baseSlug);
});

const allBaseRoutes = [...baseStaticRoutes, ...baseToolRoutes];

// All 30 supported languages
const languages = [
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

let sitemapUrls = '';

allBaseRoutes.forEach(baseRoute => {
  // Generate a <url> block for each language version of this route
  languages.forEach(lang => {
    const currentPath = lang.prefix + (baseRoute === '/' && lang.prefix !== '' ? '' : baseRoute);
    const fullUrl = `${BASE_URL}${currentPath}`;
    
    let xhtmlLinks = '';
    // Add alternate links for ALL languages
    languages.forEach(altLang => {
      const altPath = altLang.prefix + (baseRoute === '/' && altLang.prefix !== '' ? '' : baseRoute);
      const altUrl = `${BASE_URL}${altPath}`;
      xhtmlLinks += `\n    <xhtml:link rel="alternate" hreflang="${altLang.code === 'en' ? 'x-default' : altLang.code}" href="${altUrl}" />`;
      // For english, we explicitly add the 'en' code too, as x-default is good but explicit 'en' is also needed
      if (altLang.code === 'en') {
        xhtmlLinks += `\n    <xhtml:link rel="alternate" hreflang="en" href="${altUrl}" />`;
      }
    });

    const priority = baseRoute === '/' ? '1.0' : baseRoute === '/tools' ? '0.95' : baseRoute.startsWith('/tools/') ? '0.9' : '0.8';

    sitemapUrls += `
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${baseRoute === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${priority}</priority>${xhtmlLinks}
  </url>`;
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemapUrls}
</urlset>`;

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap.trim());

console.log(`Sitemap generated with ${allBaseRoutes.length * languages.length} URLs with full cross-language hreflang mapping.`);
