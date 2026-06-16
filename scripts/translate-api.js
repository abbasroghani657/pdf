import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS_DATA } from '../src/data/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function translateText(text) {
  if (!text) return text;
  
  // Custom manual overrides for specific UI terms
  if (text === 'PDF to Word') return 'PDF a Word';
  if (text === 'Word to PDF') return 'Word a PDF';
  if (text === 'Merge PDF') return 'Unir PDF';
  if (text === 'Split PDF') return 'Dividir PDF';
  if (text === 'Compress PDF') return 'Comprimir PDF';
  if (text === 'Edit PDF') return 'Editar PDF';
  if (text === 'Sign PDF') return 'Firmar PDF';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();
    return json[0].map(item => item[0]).join('');
  } catch (e) {
    console.error("Error translating:", text, e);
    return text;
  }
}

// Implement a delay to avoid rate limiting
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log("Starting translation of 37 tools...");
  const translatedTools = [];
  
  for (let i = 0; i < TOOLS_DATA.length; i++) {
    const tool = TOOLS_DATA[i];
    console.log(`Translating tool ${i+1}/${TOOLS_DATA.length}: ${tool.title}`);
    
    const translatedTool = { ...tool };
    translatedTool.title = await translateText(tool.title);
    await delay(100);
    translatedTool.desc = await translateText(tool.desc);
    await delay(100);
    
    if (tool.howToSteps) {
      translatedTool.howToSteps = [];
      for (const step of tool.howToSteps) {
        translatedTool.howToSteps.push(await translateText(step));
        await delay(100);
      }
    }
    
    if (tool.faqs) {
      translatedTool.faqs = [];
      for (const faq of tool.faqs) {
        translatedTool.faqs.push({
          question: await translateText(faq.question),
          answer: await translateText(faq.answer)
        });
        await delay(100);
      }
    }
    
    translatedTools.push(translatedTool);
  }
  
  const outPath = path.join(__dirname, '../src/data/tools-es.js');
  const fileContent = `export const TOOLS_DATA_ES = ${JSON.stringify(translatedTools, null, 2)};\n`;
  fs.writeFileSync(outPath, fileContent);
  console.log("✅ Successfully translated all tools and saved to src/data/tools-es.js");
}

main();
