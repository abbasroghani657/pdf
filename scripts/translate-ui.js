import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate-google';
import { UI_DICT } from '../src/data/ui-en.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetLanguages = [
  'es', 'fr', 'de', 'pt', 'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko',
  'it', 'pl', 'ro', 'bg', 'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th',
  'tr', 'uk', 'vi', 'sw', 'fi', 'da', 'no', 'cs'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeJS(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// Flatten object
function flattenObject(obj, prefix = '') {
  let result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenObject(value, `${prefix}${key}.`) };
    } else {
      result[`${prefix}${key}`] = value;
    }
  }
  return result;
}

// Unflatten object
function unflattenObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function stringifyObject(obj, indent = 2) {
  let str = '{\n';
  const spaces = ' '.repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      str += `${spaces}${key}: \`${escapeJS(value)}\`,\n`;
    } else if (typeof value === 'object' && value !== null) {
      str += `${spaces}${key}: ${stringifyObject(value, indent + 2)},\n`;
    }
  }
  str += ' '.repeat(indent - 2) + '}';
  return str;
}

async function generateFile(langCode) {
  console.log(`Translating to ${langCode}...`);
  
  const flatDict = flattenObject(UI_DICT);
  const keys = Object.keys(flatDict);
  const values = Object.values(flatDict);
  
  try {
    const chunkSize = 30;
    const translatedValues = [];
    
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      try {
        const translatedChunk = await translate(chunk, { to: langCode });
        // Sometimes translate-google returns a single string if chunk size is 1
        if (Array.isArray(translatedChunk)) {
          translatedValues.push(...translatedChunk);
        } else {
          translatedValues.push(translatedChunk);
        }
      } catch (err) {
        // Fallback to English if translation fails
        translatedValues.push(...chunk);
        console.error(`Chunk failed for ${langCode}, using fallback`);
      }
      await sleep(100); // small delay between chunks
    }

    const translatedFlatDict = {};
    keys.forEach((key, index) => {
      translatedFlatDict[key] = translatedValues[index] || values[index]; // fallback to English if missing
    });
    
    const translatedUI = unflattenObject(translatedFlatDict);
    
    const exportName = `UI_DICT_${langCode.toUpperCase().replace('-', '_')}`;
    let fileContent = `// Auto-generated UI translation for ${langCode}\n`;
    fileContent += `export const ${exportName} = ${stringifyObject(translatedUI, 2)};\n`;

    const outPath = path.join(__dirname, `../src/data/ui-${langCode}.js`);
    fs.writeFileSync(outPath, fileContent, 'utf8');
    console.log(`  -> Saved ui-${langCode}.js`);
  } catch(err) {
    console.error(`  -> Failed for ${langCode}:`, err.message);
  }
}

async function main() {
  for (const lang of targetLanguages) {
    await generateFile(lang);
    await sleep(200); // 2s delay to prevent rate limit
  }
  console.log("ALL UI TRANSLATIONS DONE!");
}

main().catch(console.error);
