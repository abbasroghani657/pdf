import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate-google';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { BLOG_POSTS } from '../src/data/blog.js';

const targetLanguages = ['pt', 'de'];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeJS(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function translateBlog(blog, langCode) {
  const translated = { ...blog };
  try {
    translated.title = await translate(blog.title, { to: langCode });
    translated.excerpt = await translate(blog.excerpt, { to: langCode });
    // Note: Translate-google attempts to preserve HTML tags
    translated.content = await translate(blog.content, { to: langCode });
  } catch (err) {
    console.error(`Error translating blog ${blog.slug} to ${langCode}:`, err.message);
  }
  return translated;
}

async function generateFile(langCode) {
  console.log(`Starting blog translation for ${langCode}...`);
  const translatedBlogs = [];
  
  for (const blog of BLOG_POSTS) {
    console.log(` Translating Blog: ${blog.slug} -> ${langCode}`);
    const tBlog = await translateBlog(blog, langCode);
    translatedBlogs.push(tBlog);
    await sleep(2000); 
  }

  const exportName = `BLOG_POSTS_${langCode.toUpperCase().replace('-', '_')}`;
  let fileContent = `// Auto-generated blog translation for ${langCode}\n`;
  fileContent += `export const ${exportName} = [\n`;
  
  for (const blog of translatedBlogs) {
    fileContent += `  {\n`;
    fileContent += `    slug: \`${escapeJS(blog.slug)}\`,\n`;
    fileContent += `    title: \`${escapeJS(blog.title)}\`,\n`;
    fileContent += `    date: \`${escapeJS(blog.date)}\`,\n`;
    fileContent += `    excerpt: \`${escapeJS(blog.excerpt)}\`,\n`;
    fileContent += `    content: \`${escapeJS(blog.content)}\`\n`;
    fileContent += `  },\n`;
  }
  fileContent += `];\n`;

  const outPath = path.join(__dirname, `../src/data/blog-${langCode}.js`);
  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`Successfully wrote ${outPath}\n`);
}

async function main() {
  for (const lang of targetLanguages) {
    await generateFile(lang);
    await sleep(5000);
  }
  console.log("ALL DONE!");
}

main().catch(console.error);
