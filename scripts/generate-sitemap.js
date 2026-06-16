import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS_DATA } from '../src/data/tools.js';
import { slugify } from '../src/utils/slugify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.theylovepdf.com';

const staticRoutes = [
  '/',
  '/pricing',
  '/compare',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/pdf-trends-2026',
  '/login',
  '/register'
];

const platforms = ['mac', 'windows', 'iphone', 'android'];

const toolRoutes = [];
const esToolRoutes = [];
TOOLS_DATA.forEach(t => {
  const baseSlug = `/tools/${slugify(t.title)}`;
  const esBaseSlug = `/es/tools/${slugify(t.title)}`;
  toolRoutes.push(baseSlug);
  esToolRoutes.push(esBaseSlug);
  platforms.forEach(platform => {
    toolRoutes.push(`${baseSlug}/${platform}`);
    esToolRoutes.push(`${esBaseSlug}/${platform}`);
  });
});

const allRoutes = [...staticRoutes, ...toolRoutes, ...esToolRoutes];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/tools/') ? '0.9' : '0.8'}</priority>
  </url>
`).join('')}
</urlset>`;

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap.trim());

console.log(`Sitemap generated with ${allRoutes.length} URLs`);
