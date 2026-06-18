const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Make sure {lang === 'es' ...} works, lang should be destructured from props
  if (!content.includes('lang = \'en\'') && content.includes('export default function')) {
    content = content.replace(/export default function ([A-Za-z0-9_]+)\(\) \{/g, "export default function $1({ lang = 'en' }) {");
  }

  // Upload variants
  content = content.replace(/'Drop it here!' \: 'Drop your PDF here'/g, "isDragActive ? (lang === 'es' ? '¡Suéltalo aquí!' : 'Drop it here!') : (lang === 'es' ? 'Arrastra tu PDF aquí' : 'Drop your PDF here')");
  content = content.replace(/>or click to browse</g, ">{lang === 'es' ? 'o haz clic para buscar' : 'or click to browse'}<");
  content = content.replace(/>Choose PDF File</g, ">{lang === 'es' ? 'Elegir archivo PDF' : 'Choose PDF File'}<");
  content = content.replace(/>Select File</g, ">{lang === 'es' ? 'Seleccionar archivo' : 'Select File'}<");
  content = content.replace(/>Select Image File</g, ">{lang === 'es' ? 'Seleccionar archivo de imagen' : 'Select Image File'}<");
  content = content.replace(/>Select Word File</g, ">{lang === 'es' ? 'Seleccionar archivo Word' : 'Select Word File'}<");
  content = content.replace(/>Select PowerPoint File</g, ">{lang === 'es' ? 'Seleccionar archivo PowerPoint' : 'Select PowerPoint File'}<");
  content = content.replace(/>Select Excel File</g, ">{lang === 'es' ? 'Seleccionar archivo Excel' : 'Select Excel File'}<");
  content = content.replace(/>Select HTML File</g, ">{lang === 'es' ? 'Seleccionar archivo HTML' : 'Select HTML File'}<");

  // Annotate/Edit specific
  content = content.replace(
    /\['🖍️ Highlight', '✍️ Draw', '📌 Sticky Note', '💬 Comment', '🔷 Shapes', '↩️ Undo\/Redo'\]/g,
    "lang === 'es' ? ['🖍️ Resaltar', '✍️ Dibujar', '📌 Nota', '💬 Comentario', '🔷 Formas', '↩️ Deshacer/Rehacer'] : ['🖍️ Highlight', '✍️ Draw', '📌 Sticky Note', '💬 Comment', '🔷 Shapes', '↩️ Undo/Redo']"
  );

  // Additional top bar elements in AnnotatePDFPage
  content = content.replace(
    /> Save</g,
    ">{lang === 'es' ? ' Guardar' : ' Save'}<"
  );
  content = content.replace(
    /> Share</g,
    ">{lang === 'es' ? ' Compartir' : ' Share'}<"
  );
  content = content.replace(
    /> Export PDF</g,
    ">{lang === 'es' ? ' Exportar PDF' : ' Export PDF'}<"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Translated variations in ' + file);
  }
}
