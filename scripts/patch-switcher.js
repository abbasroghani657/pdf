import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appJsxPath = path.join(__dirname, '../src/App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

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

const newButtons = newLanguages.map(l => {
  return `            <button 
              onClick={() => switchLang('${l.code.toUpperCase()}')}
              className={clsx("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", currentLang === '${l.code.toUpperCase()}' ? "font-bold text-[#378ADD] bg-blue-50/50" : "text-gray-700")}
            >
              ${l.name}
            </button>`;
}).join('\n');

// Ensure the dropdown is scrollable if it gets too long
content = content.replace('<div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-1">', '<div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-1 max-h-96 overflow-y-auto">');

if (!content.includes('switchLang(\'HI\')')) {
  content = content.replace('Português\n            </button>', 'Português\n            </button>\n' + newButtons);
}

// We also need to fix `switchLang` logic to handle the new languages!
let switchLangLogic = `if (lang === 'ES') {
      newPath = \`/es\${newPath === '/' ? '' : newPath}\`;
    } else if (lang === 'FR') {
      newPath = \`/fr\${newPath === '/' ? '' : newPath}\`;
    } else if (lang === 'DE') {
      newPath = \`/de\${newPath === '/' ? '' : newPath}\`;
    } else if (lang === 'PT') {
      newPath = \`/pt\${newPath === '/' ? '' : newPath}\`;`;

let newSwitchLogic = switchLangLogic + newLanguages.map(l => `
    } else if (lang === '${l.code.toUpperCase()}') {
      newPath = \`/${l.code}\${newPath === '/' ? '' : newPath}\`;`).join('');

if (!content.includes('lang === \'HI\'')) {
  content = content.replace(switchLangLogic, newSwitchLogic);
}

// The path replacement logic in switchLang:
// newPath = newPath.replace(/^\/(es|fr|de|pt)(\/|$)/, '/');
// Needs to include the new languages.
const allLangs = ['es', 'fr', 'de', 'pt', ...newLanguages.map(l=>l.code)].join('|');
content = content.replace(/newPath\.replace\(\/\^\\\/\(es\|fr\|de\|pt\)\\\/\(\\\/\|\\$\)\//g, `newPath.replace(/^\\/(${allLangs})(\\/|$)/`);

fs.writeFileSync(appJsxPath, content);
console.log("LanguageSwitcher patched successfully!");
