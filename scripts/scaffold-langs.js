import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newLanguages = [
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ru', name: 'Pусский' },
  { code: 'zh-cn', name: '中文 (简体)' },
  { code: 'zh-tw', name: '中文 (繁體)' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'ca', name: 'Català' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'sv', name: 'Svenska' },
  { code: 'th', name: 'ภาษาไทย' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'fi', name: 'Suomi' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'cs', name: 'Čeština' }
];

const dataDir = path.join(__dirname, '../src/data');

// 1. Scaffold tools-{lang}.js
const englishToolsPath = path.join(dataDir, 'tools.js');
let englishToolsContent = fs.readFileSync(englishToolsPath, 'utf8');

for (const lang of newLanguages) {
  const filePath = path.join(dataDir, `tools-${lang.code}.js`);
  // Simple clone for now
  let newContent = englishToolsContent.replace('export const TOOLS_DATA =', `export const TOOLS_DATA_${lang.code.toUpperCase().replace('-', '_')} =`);
  fs.writeFileSync(filePath, newContent);
  console.log(`Created ${filePath}`);
}

// 2. Scaffold blog-{lang}.js
const englishBlogPath = path.join(dataDir, 'blog.js');
let englishBlogContent = fs.readFileSync(englishBlogPath, 'utf8');

for (const lang of newLanguages) {
  const filePath = path.join(dataDir, `blog-${lang.code}.js`);
  let newContent = englishBlogContent.replace('export const BLOG_POSTS =', `export const BLOG_POSTS_${lang.code.toUpperCase().replace('-', '_')} =`);
  fs.writeFileSync(filePath, newContent);
  console.log(`Created ${filePath}`);
}

console.log("Scaffolding complete! Next steps: Update App.jsx and SEO scripts.");
