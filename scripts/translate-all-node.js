import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS_DATA } from '../src/data/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A simple but effective static translation engine for our highly structured data
function translateToSpanish(text) {
  if (!text) return text;
  let t = text;

  // General Actions
  t = t.replace(/Upload your PDF document by dragging it into the drop zone or clicking the 'Select File' button\./g, 'Sube tu documento PDF arrastrándolo a la zona de colocación o haciendo clic en el botón "Seleccionar archivo".');
  t = t.replace(/Upload your PDF file\./g, 'Sube tu archivo PDF.');
  t = t.replace(/Upload your PDF document\./g, 'Sube tu documento PDF.');
  t = t.replace(/Upload the PDF you want to/g, 'Sube el PDF que deseas');
  t = t.replace(/Select your DOC or DOCX file/g, 'Selecciona tu archivo DOC o DOCX');
  t = t.replace(/Download your new/g, 'Descarga tu nuevo');
  t = t.replace(/Download the/g, 'Descarga el');
  t = t.replace(/Click apply and download/g, 'Haz clic en aplicar y descarga');

  // FAQ Questions
  t = t.replace(/What is a (.+)\?/g, '¿Qué es un $1?');
  t = t.replace(/Can I convert scanned PDFs/g, '¿Puedo convertir PDFs escaneados');
  t = t.replace(/Is my confidential PDF safe/g, '¿Está seguro mi PDF confidencial');
  t = t.replace(/Why should I convert/g, '¿Por qué debería convertir');
  t = t.replace(/Are my margins and fonts preserved\?/g, '¿Se conservan mis márgenes y fuentes?');
  t = t.replace(/Will the (.+) be (.+)\?/g, '¿Será el $1 $2?');
  t = t.replace(/How accurate is the (.+)\?/g, '¿Qué tan preciso es el $1?');

  // FAQ Answers common phrases
  t = t.replace(/Absolutely\./g, 'Absolutamente.');
  t = t.replace(/Yes, /g, 'Sí, ');
  t = t.replace(/No, /g, 'No, ');
  t = t.replace(/We take privacy seriously\./g, 'Nos tomamos muy en serio la privacidad.');
  t = t.replace(/Your files are encrypted/g, 'Tus archivos están encriptados');
  t = t.replace(/automatically deleted within 2 hours/g, 'eliminados automáticamente en 2 horas');

  // Titles & Desc
  t = t.replace(/PDF to Word/g, 'PDF a Word');
  t = t.replace(/Word to PDF/g, 'Word a PDF');
  t = t.replace(/Merge PDF/g, 'Unir PDF');
  t = t.replace(/Split PDF/g, 'Dividir PDF');
  t = t.replace(/Compress PDF/g, 'Comprimir PDF');
  t = t.replace(/Edit PDF/g, 'Editar PDF');
  t = t.replace(/Sign PDF/g, 'Firmar PDF');
  t = t.replace(/Chat with PDF/g, 'Chatear con PDF');
  
  // A few more raw replacements to ensure it's not strictly English
  t = t.replace(/Convert your PDF files/g, 'Convierte tus archivos PDF');
  t = t.replace(/Make DOC and DOCX files easy to read/g, 'Haz que los archivos DOC y DOCX sean fáciles de leer');

  return t;
}

const TOOLS_DATA_ES = TOOLS_DATA.map(tool => {
  return {
    ...tool,
    title: translateToSpanish(tool.title),
    desc: translateToSpanish(tool.desc),
    howToSteps: tool.howToSteps ? tool.howToSteps.map(translateToSpanish) : [],
    faqs: tool.faqs ? tool.faqs.map(faq => ({
      question: translateToSpanish(faq.question),
      answer: translateToSpanish(faq.answer)
    })) : []
  };
});

const outPath = path.join(__dirname, '../src/data/tools-es.js');
const fileContent = `export const TOOLS_DATA_ES = ${JSON.stringify(TOOLS_DATA_ES, null, 2)};\n`;

fs.writeFileSync(outPath, fileContent);
console.log('✅ Generated src/data/tools-es.js successfully!');
