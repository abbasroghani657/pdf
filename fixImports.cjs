const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const replaceDuplicate = (regex) => {
    let matches = content.match(regex);
    if (matches && matches.length > 1) {
      let first = true;
      content = content.replace(regex, (match) => {
        if (first) {
          first = false;
          return match;
        }
        return '';
      });
    }
  };

  replaceDuplicate(/import\s+\{\s*TOOLS_DATA\s*\}\s+from\s+['"][^'"]+['"];?/g);
  replaceDuplicate(/import\s+\{\s*TOOLS_DATA_ES\s*\}\s+from\s+['"][^'"]+['"];?/g);
  replaceDuplicate(/import\s+\{\s*slugify\s*\}\s+from\s+['"][^'"]+['"];?/g);

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed duplicate imports in ' + file);
  }
}
