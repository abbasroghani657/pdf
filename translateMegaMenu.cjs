const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Import TOOLS_DATA_ES
app = app.replace("import { TOOLS_DATA } from './data/tools';", "import { TOOLS_DATA, TOOLS_DATA_ES } from './data/tools';");

// Change the filtering logic to use currentToolsData
app = app.replace(
  /const organizeOptimizeTools = TOOLS_DATA\.filter/g,
  "const currentToolsData = isEs ? TOOLS_DATA_ES : TOOLS_DATA;\n  const organizeOptimizeTools = currentToolsData.filter"
);
app = app.replace(
  /const convertToTools = TOOLS_DATA\.filter/g,
  "const convertToTools = currentToolsData.filter"
);
app = app.replace(
  /const convertFromTools = TOOLS_DATA\.filter/g,
  "const convertFromTools = currentToolsData.filter"
);
app = app.replace(
  /const editSignSecurityTools = TOOLS_DATA\.filter/g,
  "const editSignSecurityTools = currentToolsData.filter"
);
app = app.replace(
  /const aiTools = TOOLS_DATA\.filter/g,
  "const aiTools = currentToolsData.filter"
);

// Update filtering conditions for Spanish
app = app.replace(
  /t\.title\.endsWith\('to PDF'\)/g,
  "(t.title.endsWith('to PDF') || t.title.endsWith('a PDF'))"
);
app = app.replace(
  /t\.title\.startsWith\('PDF to'\)/g,
  "(t.title.startsWith('PDF to') || t.title.startsWith('PDF a'))"
);

// Translate the nested column links in the 'CONVERT PDF' mega menu
app = app.replace(
  /\{ name: 'JPG to PDF',/g,
  "{ name: isEs ? 'JPG a PDF' : 'JPG to PDF',"
);
app = app.replace(
  /\{ name: 'WORD to PDF',/g,
  "{ name: isEs ? 'WORD a PDF' : 'WORD to PDF',"
);
app = app.replace(
  /\{ name: 'POWERPOINT to PDF',/g,
  "{ name: isEs ? 'POWERPOINT a PDF' : 'POWERPOINT to PDF',"
);
app = app.replace(
  /\{ name: 'EXCEL to PDF',/g,
  "{ name: isEs ? 'EXCEL a PDF' : 'EXCEL to PDF',"
);
app = app.replace(
  /\{ name: 'HTML to PDF',/g,
  "{ name: isEs ? 'HTML a PDF' : 'HTML to PDF',"
);

app = app.replace(
  /\{ name: 'PDF to JPG',/g,
  "{ name: isEs ? 'PDF a JPG' : 'PDF to JPG',"
);
app = app.replace(
  /\{ name: 'PDF to WORD',/g,
  "{ name: isEs ? 'PDF a WORD' : 'PDF to WORD',"
);
app = app.replace(
  /\{ name: 'PDF to POWERPOINT',/g,
  "{ name: isEs ? 'PDF a POWERPOINT' : 'PDF to POWERPOINT',"
);
app = app.replace(
  /\{ name: 'PDF to EXCEL',/g,
  "{ name: isEs ? 'PDF a EXCEL' : 'PDF to EXCEL',"
);
app = app.replace(
  /\{ name: 'PDF to PDF\/A',/g,
  "{ name: isEs ? 'PDF a PDF/A' : 'PDF to PDF/A',"
);
app = app.replace(
  /\{ name: 'Sign PDF',/g,
  "{ name: isEs ? 'Firmar PDF' : 'Sign PDF',"
);

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx mega menu translated!');
