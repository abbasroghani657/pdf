import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS_DATA } from '../src/data/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lang = process.argv[2];
const outFile = process.argv[3];

if (!lang || !outFile) {
  console.error("Usage: node translate-lang.js <lang_code> <out_file>");
  process.exit(1);
}

// Custom manual overrides to ensure high quality for technical terms
const overrides = {
  de: {
    'Merge PDF': 'PDF zusammenführen',
    'Split PDF': 'PDF teilen',
    'Compress PDF': 'PDF komprimieren',
    'Edit PDF': 'PDF bearbeiten',
    'Sign PDF': 'PDF unterschreiben',
    'PDF to Word': 'PDF in Word',
    'Word to PDF': 'Word in PDF'
  },
  pt: {
    'Merge PDF': 'Juntar PDF',
    'Split PDF': 'Dividir PDF',
    'Compress PDF': 'Comprimir PDF',
    'Edit PDF': 'Editar PDF',
    'Sign PDF': 'Assinar PDF',
    'PDF to Word': 'PDF para Word',
    'Word to PDF': 'Word para PDF'
  }
};

async function translateText(text, retries = 3) {
  if (!text) return text;
  
  if (overrides[lang] && overrides[lang][text]) {
    return overrides[lang][text];
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json[0].map(item => item[0]).join('');
    } catch (e) {
      if (attempt === retries) {
        console.error("Error translating after 3 attempts:", text, e.message);
        return text;
      }
      console.warn(`Retry ${attempt} for text: ${text.substring(0, 20)}...`);
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log(`Starting translation of ${TOOLS_DATA.length} tools to ${lang}...`);
  const translatedTools = [];
  
  for (let i = 0; i < TOOLS_DATA.length; i++) {
    const tool = TOOLS_DATA[i];
    console.log(`Translating [${lang}] ${i+1}/${TOOLS_DATA.length}: ${tool.title}`);
    
    const translatedTool = { ...tool };
    translatedTool.title = await translateText(tool.title);
    await delay(100);
    translatedTool.desc = await translateText(tool.desc);
    await delay(100);
    
    if (tool.howToSteps) {
      translatedTool.howToSteps = [];
      for (const step of tool.howToSteps) {
        translatedTool.howToSteps.push(await translateText(step));
        await delay(500);
      }
    }
    
    if (tool.faqs) {
      translatedTool.faqs = [];
      for (const faq of tool.faqs) {
        translatedTool.faqs.push({
          question: await translateText(faq.question),
          answer: await translateText(faq.answer)
        });
        await delay(500);
      }
    }
    
    translatedTools.push(translatedTool);
  }
  
  const outPath = path.join(__dirname, '../src/data/', outFile);
  const varName = `TOOLS_DATA_${lang.toUpperCase()}`;
  const fileContent = `export const ${varName} = ${JSON.stringify(translatedTools, null, 2)};\n`;
  fs.writeFileSync(outPath, fileContent);
  console.log(`✅ Successfully translated to ${lang} and saved to ${outFile}`);
}

main();
