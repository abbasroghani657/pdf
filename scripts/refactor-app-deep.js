import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPath = path.resolve(__dirname, '../src/App.jsx');

let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Remove all TOOLS_DATA static imports
appCode = appCode.replace(/import \{ TOOLS_DATA.*? \} from '\.\/data\/tools.*?';\n/g, '');

// 2. Add useEffect to imports if missing
if (!appCode.includes('useEffect')) {
  appCode = appCode.replace(/import React, \{ (.*?) \} from 'react';/, `import React, { $1, useEffect } from 'react';`);
}

// 3. Replace the static currentToolsData definition with a state and effect
const staticDefStr = `const currentToolsData = isEs ? TOOLS_DATA_ES : isFr ? TOOLS_DATA_FR : isDe ? TOOLS_DATA_DE : isPt ? TOOLS_DATA_PT : TOOLS_DATA;`;

const dynamicDefStr = `
  const [currentToolsData, setCurrentToolsData] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    const loadToolsData = async () => {
      try {
        if (currentLang === 'en') {
          const mod = await import('./data/tools.js');
          if (isMounted) setCurrentToolsData(mod.TOOLS_DATA);
        } else {
          const mod = await import(\`./data/tools-\${currentLang}.js\`);
          const key = \`TOOLS_DATA_\${currentLang.toUpperCase().replace('-', '_')}\`;
          if (isMounted) setCurrentToolsData(mod[key] || mod.default || Object.values(mod)[0] || []);
        }
      } catch (err) {
        console.error('Failed to load tools data for', currentLang, err);
        const mod = await import('./data/tools.js');
        if (isMounted) setCurrentToolsData(mod.TOOLS_DATA);
      }
    };
    loadToolsData();
    return () => { isMounted = false; };
  }, [currentLang]);
`;

appCode = appCode.replace(staticDefStr, dynamicDefStr);

fs.writeFileSync(appPath, appCode);
console.log('App.jsx deeply refactored with dynamic currentToolsData!');
