const fs = require('fs');
const path = require('path');

const toolsPath = path.join(__dirname, '../src/data/tools.js');
let content = fs.readFileSync(toolsPath, 'utf8');

const keywordMap = {
  'PDF to Word': '"doc", "docx", "text", "convert", "extract"',
  'Word to PDF': '"doc", "docx", "create", "convert"',
  'PDF to Excel': '"xls", "xlsx", "spreadsheet", "table", "data"',
  'Excel to PDF': '"xls", "xlsx", "spreadsheet", "create"',
  'PDF to PPT': '"powerpoint", "presentation", "pptx", "slides"',
  'PPT to PDF': '"powerpoint", "presentation", "pptx", "create"',
  'PDF to JPG': '"image", "picture", "photo", "convert"',
  'JPG to PDF': '"image", "picture", "photo", "create"',
  'Merge PDF': '"combine", "join", "concatenate", "assemble", "connect"',
  'Split PDF': '"cut", "divide", "separate", "extract"',
  'Compress PDF': '"reduce", "shrink", "smaller", "size"',
  'Edit PDF': '"modify", "change", "text", "add"',
  'Sign PDF': '"signature", "esign", "sign", "document"',
  'Watermark PDF': '"logo", "stamp", "mark", "brand"',
  'Protect PDF': '"lock", "encrypt", "password", "secure"',
  'Unlock PDF': '"decrypt", "remove password", "open"',
  'Rotate PDF': '"turn", "orientation", "pages", "flip"',
  'Add Page Numbers': '"numbering", "pagination", "pages"',
  'Remove Pages': '"delete", "extract", "discard"',
  'Organize PDF': '"rearrange", "sort", "order", "move"',
  'PDF to PDF/A': '"archive", "long-term", "iso"',
  'Repair PDF': '"fix", "recover", "corrupt", "broken"',
  'Chat with PDF': '"ai", "ask", "bot", "assistant", "read"',
  'Summarize PDF': '"ai", "shorten", "tldr", "abstract"',
  'Translate PDF': '"language", "translate", "localization", "ai"',
  'Extract Text': '"txt", "ocr", "read", "words"',
  'Extract Images': '"pictures", "photos", "export"',
  'Crop PDF': '"trim", "margin", "resize", "cut"',
  'Flatten PDF': '"flatten", "forms", "merge layers", "uneditable"',
  'HTML to PDF': '"webpage", "website", "url", "link"',
  'PDF to HTML': '"webpage", "website", "convert"',
  'Markdown to PDF': '"md", "markdown", "text", "convert"',
  'PDF to Markdown': '"md", "markdown", "text", "convert"',
  'EPUB to PDF': '"ebook", "book", "reader", "convert"',
  'PDF to EPUB': '"ebook", "book", "reader", "convert"',
  'Compare PDFs': '"diff", "difference", "changes", "compare"',
  'Redact PDF': '"blacken", "hide", "censor", "sensitive", "remove"'
};

// Replace titles with title + keywords
for (const [title, keywords] of Object.entries(keywordMap)) {
  const regex = new RegExp(`"title":\\s*"${title}",`, 'g');
  content = content.replace(regex, `"title": "${title}",\n    "keywords": [${keywords}],`);
}

fs.writeFileSync(toolsPath, content);
console.log('Keywords added to tools.js successfully.');
