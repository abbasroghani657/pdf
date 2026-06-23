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

const appJsxPath = path.join(__dirname, '../src/App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add the new imports
let newImports = newLanguages.map(l => {
  let varName = `TOOLS_DATA_${l.toUpperCase().replace('-', '_')}`;
  return `import { ${varName} } from './data/tools-${l}';`;
}).join('\n');

if (!content.includes('TOOLS_DATA_HI')) {
  content = content.replace("import { TOOLS_DATA_PT } from './data/tools-pt';", "import { TOOLS_DATA_PT } from './data/tools-pt';\n" + newImports);
}

// 2. Add the route generation
// Right now App.jsx has 4 hardcoded language routes:
// <Route path="/es/*" element={<AppContent lang="es" isEs={true} />} />
// <Route path="/fr/*" element={<AppContent lang="fr" isFr={true} />} />
// ...
// We need to inject the new languages. 
let newRoutes = newLanguages.map(l => {
  return `          <Route path="/${l}/*" element={<AppContent lang="${l}" is${l.charAt(0).toUpperCase() + l.slice(1).replace('-','')}={true} />} />`;
}).join('\n');

if (!content.includes('path="/hi/*"')) {
  content = content.replace('<Route path="/pt/*" element={<AppContent lang="pt" isPt={true} />} />', '<Route path="/pt/*" element={<AppContent lang="pt" isPt={true} />} />\n' + newRoutes);
}

fs.writeFileSync(appJsxPath, content);
console.log("App.jsx patched successfully!");
