import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate-google';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the English data
import { TOOLS_DATA } from '../src/data/tools.js';

const targetLanguages = [
  'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko', 'it', 'pl', 'ro', 'bg',
  'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th', 'tr', 'uk', 'vi',
  'sw', 'fi', 'da', 'no', 'cs'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Safely escape backticks and quotes for generating JS code
function escapeJS(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function translateTool(tool, langCode) {
  const translated = { ...tool };

  try {
    translated.title = await translate(tool.title, { to: langCode });
    translated.desc = await translate(tool.desc, { to: langCode });
    
    if (tool.badge && tool.badge.text) {
      translated.badge = { text: await translate(tool.badge.text, { to: langCode }) };
    }

    if (tool.howToSteps) {
      translated.howToSteps = [];
      for (const step of tool.howToSteps) {
        translated.howToSteps.push(await translate(step, { to: langCode }));
      }
    }

    if (tool.faqs) {
      translated.faqs = [];
      for (const faq of tool.faqs) {
        translated.faqs.push({
          question: await translate(faq.question, { to: langCode }),
          answer: await translate(faq.answer, { to: langCode })
        });
      }
    }
  } catch (err) {
    console.error(`Error translating tool ${tool.title} to ${langCode}:`, err.message);
  }

  return translated;
}

async function generateFile(langCode) {
  console.log(`Starting translation for ${langCode}...`);
  const translatedTools = [];
  
  for (const tool of TOOLS_DATA) {
    console.log(` Translating: ${tool.title} -> ${langCode}`);
    const tTool = await translateTool(tool, langCode);
    translatedTools.push(tTool);
    await sleep(2000); // 2 second pause per tool to avoid rate limits
  }

  const exportName = `TOOLS_DATA_${langCode.toUpperCase().replace('-', '_')}`;
  let fileContent = `// Auto-generated translation file for ${langCode}\n`;
  fileContent += `export const ${exportName} = [\n`;
  
  for (const tool of translatedTools) {
    fileContent += `  {\n`;
    fileContent += `    "category": \`${escapeJS(tool.category)}\`,\n`;
    fileContent += `    "title": \`${escapeJS(tool.title)}\`,\n`;
    if (tool.keywords) {
      fileContent += `    "keywords": ${JSON.stringify(tool.keywords)},\n`;
    }
    fileContent += `    "desc": \`${escapeJS(tool.desc)}\`,\n`;
    fileContent += `    "icon": \`${escapeJS(tool.icon)}\`,\n`;
    fileContent += `    "iconColorClass": \`${escapeJS(tool.iconColorClass)}\`,\n`;
    
    if (tool.badge) {
      fileContent += `    "badge": { "text": \`${escapeJS(tool.badge.text)}\` },\n`;
      fileContent += `    "badgeClass": \`${escapeJS(tool.badgeClass)}\`,\n`;
    }

    if (tool.howToSteps) {
      fileContent += `    "howToSteps": [\n`;
      for (const step of tool.howToSteps) {
        fileContent += `      \`${escapeJS(step)}\`,\n`;
      }
      fileContent += `    ],\n`;
    }

    if (tool.faqs) {
      fileContent += `    "faqs": [\n`;
      for (const faq of tool.faqs) {
        fileContent += `      {\n`;
        fileContent += `        "question": \`${escapeJS(faq.question)}\`,\n`;
        fileContent += `        "answer": \`${escapeJS(faq.answer)}\`\n`;
        fileContent += `      },\n`;
      }
      fileContent += `    ]\n`;
    }
    
    fileContent += `  },\n`;
  }
  fileContent += `];\n`;

  const outPath = path.join(__dirname, `../src/data/tools-${langCode}.js`);
  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`Successfully wrote ${outPath}\n`);
}

async function main() {
  for (const lang of targetLanguages) {
    await generateFile(lang);
    await sleep(5000); // 5 seconds between languages
  }
  console.log("ALL DONE!");
}

main().catch(console.error);
