import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../src/pages');

// Text replacements mapping
const stringReplacements = [
  // 1. JSX text replacements (preceded by >)
  { search: ">Drag & drop your PDF here<", replace: ">{ui?.tools_common?.drag_drop_pdf || 'Drag & drop your PDF here'}<" },
  { search: ">Drag & drop your files here<", replace: ">{ui?.tools_common?.drag_drop_files || 'Drag & drop your files here'}<" },
  { search: ">Drag & drop multiple PDF files here, or click to browse<", replace: ">{ui?.tools_common?.drag_drop_multiple || 'Drag & drop multiple PDF files here, or click to browse'}<" },
  { search: ">Drop your PDF here<", replace: ">{ui?.tools_common?.drop_here || 'Drop your PDF here'}<" },
  { search: ">or click to browse — PDF only<", replace: ">{ui?.tools_common?.or_click_browse || 'or click to browse — PDF only'}<" },
  { search: ">Choose PDF<", replace: ">{ui?.tools_common?.choose_pdf || 'Choose PDF'}<" },
  { search: ">Choose PDF Files<", replace: ">{ui?.tools_common?.choose_pdfs || 'Choose PDF Files'}<" },
  { search: ">256-bit SSL<", replace: ">{ui?.tools_common?.ssl_256 || '256-bit SSL'}<" },
  { search: ">Auto-deleted in 2h<", replace: ">{ui?.tools_common?.auto_deleted || 'Auto-deleted in 2h'}<" },
  { search: ">Private<", replace: ">{ui?.tools_common?.private || 'Private'}<" },
  { search: ">Something went wrong<", replace: ">{ui?.tools_common?.something_went_wrong || 'Something went wrong'}<" },
  { search: ">Try again<", replace: ">{ui?.tools_common?.try_again || 'Try again'}<" },
  { search: ">Go Pro (1 GB)<", replace: ">{ui?.tools_common?.go_pro || 'Go Pro (1 GB)'}<" },
  { search: ">File will be automatically deleted from our servers in 2 hours<", replace: ">{ui?.tools_common?.auto_delete_notice || 'File will be automatically deleted from our servers in 2 hours'}<" },
  { search: ">Uploading to server...<", replace: ">{ui?.tools_common?.uploading || 'Uploading to server...'}<" },
  { search: ">Done!<", replace: ">{ui?.tools_common?.done || 'Done!'}<" },

  // 2. Pure JS string replacements (surrounded by quotes)
  { search: "'Drop your PDF here'", replace: "(ui?.tools_common?.drop_here || 'Drop your PDF here')" },
  { search: "'Drag & drop your PDF here'", replace: "(ui?.tools_common?.drag_drop_pdf || 'Drag & drop your PDF here')" },
  { search: "'Something went wrong'", replace: "(ui?.tools_common?.something_went_wrong || 'Something went wrong')" },
  { search: "'Please upload a valid PDF file.'", replace: "(ui?.tools_common?.invalid_pdf || 'Please upload a valid PDF file.')" },
  { search: "'Ghostscript analyzing structure...'", replace: "(ui?.tools_common?.analyzing || 'Ghostscript analyzing structure...')" },
  { search: "'Optimizing image streams...'", replace: "(ui?.tools_common?.optimizing || 'Optimizing image streams...')" },
  { search: "'Compressing fonts & metadata...'", replace: "(ui?.tools_common?.compressing || 'Compressing fonts & metadata...')" },
  { search: "'Done!'", replace: "(ui?.tools_common?.done || 'Done!')" },
  { search: "'Uploading to server...'", replace: "(ui?.tools_common?.uploading || 'Uploading to server...')" },
  { search: "'Processing...'", replace: "(ui?.tools_common?.processing || 'Processing...')" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Update function signature
  content = content.replace(
    /export default function ([A-Za-z0-9]+)\(\{ lang = 'en' \}\) \{/,
    "export default function $1({ lang = 'en', ui, toolData }) {"
  );

  // 2. Replace hardcoded h1 titles safely
  content = content.replace(
    /<h1([^>]*)>([^<]+)<\/h1>/g,
    (match, p1, p2) => {
      if (p2.includes('{') || p2.includes('}')) return match;
      if (filePath.includes('NotFoundPage')) return match;
      return `<h1${p1}>{toolData?.title || '${p2}'}</h1>`;
    }
  );

  // 3. Replace text safely
  for (const item of stringReplacements) {
    content = content.split(item.search).join(item.replace);
  }

  // 4. Update dynamic buttons safely
  content = content.split(">Compress PDF Now<").join(">{toolData?.title || 'Compress PDF'} Now<");
  content = content.split(">Merge & Download<").join(">{toolData?.title || 'Merge'} & Download<");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(PAGES_DIR);
const excludeFiles = ['ToolRenderer.jsx', 'ToolPage.jsx', 'HomePage.jsx', 'DashboardPage.jsx', 'LoginPage.jsx', 'RegisterPage.jsx', 'UseCasePage.jsx', 'NotFoundPage.jsx'];

files.forEach(file => {
  if (file.endsWith('Page.jsx') && !excludeFiles.includes(file)) {
    processFile(path.join(PAGES_DIR, file));
  }
});

console.log('Localization script finished.');
