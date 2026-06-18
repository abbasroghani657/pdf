const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix the missing colon ternary syntax error
  content = content.replace(
    /\{isDragActive \? isDragActive \? \(lang === 'es' \? '¡Suéltalo aquí!' : 'Drop it here!'\) : \(lang === 'es' \? 'Arrastra tu PDF aquí' : 'Drop your PDF here'\)\}/g,
    "{isDragActive ? (lang === 'es' ? '¡Suéltalo aquí!' : 'Drop it here!') : (lang === 'es' ? 'Arrastra tu PDF aquí' : 'Drop your PDF here')}"
  );

  // Fix the .map logic on the arrays
  content = content.replace(
    /lang === 'es' \? \['🖍️ Resaltar', '✍️ Dibujar', '📌 Nota', '💬 Comentario', '🔷 Formas', '↩️ Deshacer\/Rehacer'\] : \['🖍️ Highlight', '✍️ Draw', '📌 Sticky Note', '💬 Comment', '🔷 Shapes', '↩️ Undo\/Redo'\].map/g,
    "(lang === 'es' ? ['🖍️ Resaltar', '✍️ Dibujar', '📌 Nota', '💬 Comentario', '🔷 Formas', '↩️ Deshacer/Rehacer'] : ['🖍️ Highlight', '✍️ Draw', '📌 Sticky Note', '💬 Comment', '🔷 Shapes', '↩️ Undo/Redo']).map"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed syntax in ' + file);
  }
}
