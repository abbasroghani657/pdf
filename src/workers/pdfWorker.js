import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

self.onmessage = async (e) => {
  const { tool, files, options } = e.data;

  try {
    if (tool === 'Merge PDF') {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      self.postMessage({ success: true, blob });
    } 
    else if (tool === 'Split PDF') {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const numPages = pdfDoc.getPageCount();
      const zip = new JSZip();
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      if (options.mode === 'all') {
        for (let i = 0; i < numPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
          
          // Report progress
          self.postMessage({ type: 'progress', progress: Math.round(((i + 1) / numPages) * 100) });
        }
      } else if (options.mode === 'fixed') {
        const fixed = options.fixedPages || 1;
        let part = 1;
        for (let i = 0; i < numPages; i += fixed) {
          const newPdf = await PDFDocument.create();
          const indices = [];
          for (let j = 0; j < fixed && i + j < numPages; j++) {
            indices.push(i + j);
          }
          const copiedPages = await newPdf.copyPages(pdfDoc, indices);
          copiedPages.forEach((p) => newPdf.addPage(p));
          const pdfBytes = await newPdf.save();
          zip.file(`${baseName}_part_${part}.pdf`, pdfBytes);
          part++;
          
          self.postMessage({ type: 'progress', progress: Math.round((i / numPages) * 100) });
        }
      } else if (options.mode === 'custom' && options.customRanges) {
        const ranges = options.customRanges.split(',').map((s) => s.trim());
        let part = 1;
        for (const range of ranges) {
          const newPdf = await PDFDocument.create();
          const indices = [];
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= numPages) indices.push(i - 1);
            }
          } else {
            const i = Number(range);
            if (i >= 1 && i <= numPages) indices.push(i - 1);
          }
          if (indices.length > 0) {
            const copiedPages = await newPdf.copyPages(pdfDoc, indices);
            copiedPages.forEach((p) => newPdf.addPage(p));
            const pdfBytes = await newPdf.save();
            zip.file(`${baseName}_custom_${part}.pdf`, pdfBytes);
            part++;
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
         self.postMessage({ type: 'progress', progress: Math.round(metadata.percent) });
      });
      self.postMessage({ success: true, blob: zipBlob });
    }
    else if (tool === 'Add Text') {
      const file = files[0];
      const { text, fontSize, opacity, position, color } = options;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const parsedColor = hexToRgb(color || '#000000');
      const textWidth = font.widthOfTextAtSize(text, Number(fontSize));
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        let x = 50;
        let y = height - 50;
        
        switch (position) {
          case 'top-left': x = 50; y = height - 50; break;
          case 'top-center': x = (width - textWidth) / 2; y = height - 50; break;
          case 'top-right': x = width - textWidth - 50; y = height - 50; break;
          case 'bottom-left': x = 50; y = 50; break;
          case 'bottom-center': x = (width - textWidth) / 2; y = 50; break;
          case 'bottom-right': x = width - textWidth - 50; y = 50; break;
        }
        
        page.drawText(text, {
          x, y,
          size: Number(fontSize),
          font,
          color: rgb(parsedColor.r, parsedColor.g, parsedColor.b),
          opacity: Number(opacity)
        });
        
        // Report progress
        if (i % 10 === 0) {
          self.postMessage({ type: 'progress', progress: Math.round(((i + 1) / pages.length) * 100) });
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      self.postMessage({ success: true, blob });
    }
    else {
      throw new Error(`Tool ${tool} not implemented in worker.`);
    }
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
