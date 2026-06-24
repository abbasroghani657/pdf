import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPath = path.resolve(__dirname, '../src/App.jsx');

let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add SUPPORTED_LANGS array at the top of LanguageSwitcher
const supportedLangsStr = `
const SUPPORTED_LANGS = [
  'es', 'fr', 'de', 'pt', 'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko',
  'it', 'pl', 'ro', 'bg', 'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th',
  'tr', 'uk', 'vi', 'sw', 'fi', 'da', 'no', 'cs'
];
const LANG_PREFIX_REGEX = new RegExp('^/(' + SUPPORTED_LANGS.join('|') + ')(/|$)');
`;

// 2. Fix LanguageSwitcher's switchLang logic
appCode = appCode.replace(/newPath = newPath\.replace\(\/\^\\\/.*?\/, '\/'\);/, `newPath = newPath.replace(LANG_PREFIX_REGEX, '/');`);

// 3. Fix getNavPath logic
appCode = appCode.replace(/const getNavPath = \(path\) => \{[\s\S]*?return path;\n  \};/, `const getNavPath = (path) => {
    const match = location.pathname.match(LANG_PREFIX_REGEX);
    if (match) {
      const lang = match[1];
      if (path === '/') return \`/\${lang}\`;
      if (!path.startsWith(\`/\${lang}\`)) return \`/\${lang}\${path}\`;
    }
    return path;
  };`);

// 4. Fix pathToCheck logic
appCode = appCode.replace(/let pathToCheck = location\.pathname;[\s\S]*?const isPt = location\.pathname\.startsWith\('\/pt\/'\) \|\| location\.pathname === '\/pt';/, `let pathToCheck = location.pathname;
  const match = pathToCheck.match(LANG_PREFIX_REGEX);
  let currentLang = 'en';
  if (match) {
    currentLang = match[1];
    pathToCheck = pathToCheck.replace(LANG_PREFIX_REGEX, '/') || '/';
  }
  
  if (pathToCheck.endsWith('/') && pathToCheck !== '/') {
    pathToCheck = pathToCheck.slice(0, -1);
  }
                      
  const isEs = currentLang === 'es';
  const isFr = currentLang === 'fr';
  const isDe = currentLang === 'de';
  const isPt = currentLang === 'pt';`);

fs.writeFileSync(appPath, supportedLangsStr + appCode);
console.log('App.jsx patched successfully for language routing.');
