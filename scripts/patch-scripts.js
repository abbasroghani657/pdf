import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newLanguages = [
  'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko', 'it', 'pl', 'ro', 'bg',
  'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th', 'tr', 'uk', 'vi',
  'sw', 'fi', 'da', 'no', 'cs'
];

// Helper to replace text in file
function replaceInFile(filePath, search, replace) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// 1. Update build-seo-html.js
const seoScript = path.join(__dirname, 'build-seo-html.js');
let seoContent = fs.readFileSync(seoScript, 'utf8');
const langArrayStr = `const languages = ['en', 'es', 'fr', 'de', 'pt', ` + newLanguages.map(l => `'${l}'`).join(', ') + `];`;
seoContent = seoContent.replace(/const languages = \['es', 'fr', 'de', 'pt'\];/, langArrayStr);
// There's a meta description logic in build-seo-html.js
// Let's just add a generic fallback for the altText for the new languages to keep it simple for now.
seoContent = seoContent.replace(/lang === 'pt' \? ' A melhor alternativa gratuita ao iLovePDF\.' :/g, `lang === 'pt' ? ' A melhor alternativa gratuita ao iLovePDF.' :\n                  newLanguages.includes(lang) ? ' The #1 free alternative to iLovePDF.' :`);
// Add newLanguages variable definition at the top
if (!seoContent.includes('const newLanguages')) {
  seoContent = `const newLanguages = ${JSON.stringify(newLanguages)};\n` + seoContent;
}
fs.writeFileSync(seoScript, seoContent);
console.log(`Updated build-seo-html.js`);

// 2. Update generate-sitemap.js
const sitemapScript = path.join(__dirname, 'generate-sitemap.js');
let sitemapContent = fs.readFileSync(sitemapScript, 'utf8');
sitemapContent = sitemapContent.replace(/const languages = \[\n\s+'es', 'fr', 'de', 'pt'\n\];/, `const languages = ['es', 'fr', 'de', 'pt', ` + newLanguages.map(l => `'${l}'`).join(', ') + `];`);
fs.writeFileSync(sitemapScript, sitemapContent);
console.log(`Updated generate-sitemap.js`);

// 3. Update build-blog-html.js
const blogScript = path.join(__dirname, 'build-blog-html.js');
if (fs.existsSync(blogScript)) {
  let blogContent = fs.readFileSync(blogScript, 'utf8');
  blogContent = blogContent.replace(/const languages = \['en', 'es', 'fr', 'de', 'pt'\];/, `const languages = ['en', 'es', 'fr', 'de', 'pt', ` + newLanguages.map(l => `'${l}'`).join(', ') + `];`);
  fs.writeFileSync(blogScript, blogContent);
  console.log(`Updated build-blog-html.js`);
}

console.log("Scripts patched. Next: manual App.jsx update.");
