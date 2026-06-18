const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'ToolPage.jsx' && f !== 'HomePage.jsx' && f !== 'ToolRenderer.jsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Change function signature
  content = content.replace(/export default function ([A-Za-z0-9_]+)\\(\\) \\{/g, "export default function $1({ lang = 'en', toolSlug }) {");

  // Common Upload strings
  content = content.replace(/>Drag & drop your PDF here</g, ">{lang === 'es' ? 'Arrastra y suelta tu PDF aquí' : 'Drag & drop your PDF here'}<");
  content = content.replace(/>or click to browse — PDF only, up to 2GB \\(Free for Testing\\)</g, ">{lang === 'es' ? 'o haz clic para buscar — Solo PDF, hasta 2GB' : 'or click to browse — PDF only, up to 2GB (Free for Testing)'}<");
  content = content.replace(/>Select PDF File</g, ">{lang === 'es' ? 'Seleccionar archivo PDF' : 'Select PDF File'}<");
  content = content.replace(/>Auto-deleted in 2h</g, ">{lang === 'es' ? 'Eliminación automática en 2h' : 'Auto-deleted in 2h'}<");
  content = content.replace(/>Private & Secure</g, ">{lang === 'es' ? 'Privado y seguro' : 'Private & Secure'}<");

  // Add the imports for TOOLS_DATA and slugify if not there
  if (!content.includes('TOOLS_DATA_ES') && content.includes('export default function')) {
    content = "import { TOOLS_DATA } from '../data/tools';\nimport { TOOLS_DATA_ES } from '../data/tools-es';\nimport { slugify } from '../utils/slugify';\n" + content;
  }

  // Inject display variables
  if (content.includes('export default function') && !content.includes('const displayTitle')) {
    const fnMatch = content.match(/export default function ([A-Za-z0-9_]+)\(\{(.*?)\}\) \{/);
    if (fnMatch) {
       const injection = `
  const enToolIndex = toolSlug ? TOOLS_DATA.findIndex(t => slugify(t.title) === toolSlug) : -1;
  const toolData = enToolIndex >= 0 ? (lang === 'es' ? TOOLS_DATA_ES[enToolIndex] : TOOLS_DATA[enToolIndex]) : null;
  const displayTitle = toolData?.title || '';
  const displayDesc = toolData?.desc || '';
`;
       content = content.replace(new RegExp("export default function " + fnMatch[1] + "\\(\\{ lang = 'en', toolSlug \\}\\) \\{", "g"), "export default function " + fnMatch[1] + "({ lang = 'en', toolSlug }) {" + injection);
       
       // Now replace the hardcoded h1 and p
       // We replace literal titles with displayTitle fallback to match
       content = content.replace(/<h1 className=\"([^\"]+)\">([^<]+)<\/h1>/g, '<h1 className=\"$1\">{displayTitle || \'$2\'}</h1>');
       content = content.replace(/<p className=\"([^\"]+mx-auto[^\"]*)\">([^<]+)<\/p>/g, '<p className=\"$1\">{displayDesc || \'$2\'}</p>');
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
