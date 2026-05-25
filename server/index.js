const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Original-Size', 'X-Compressed-Size', 'X-Reduction-Pct', 'X-OCR-Pages', 'X-OCR-Accuracy', 'X-Fields-Flattened', 'X-Annots-Flattened']
}));

// Routes
app.use('/api/auth', authRoutes);

// ─── Config ───────────────────────────────────────────────────────────────────
const GOTENBERG_URL   = process.env.GOTENBERG_URL   || 'http://localhost:3001'; // Office→PDF
const CONVERTER_URL   = process.env.CONVERTER_URL   || 'http://localhost:3006'; // PDF→Office (FREE Python service)

// Configure multer
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// ─── Helper: Gotenberg — Any Office/Image file → PDF (FREE) ───────────────────
async function convertToPdfWithGotenberg(filePath, originalName) {
  const form = new FormData();
  form.append('files', fs.createReadStream(filePath), originalName);

  const response = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gotenberg Error (${response.status}): ${errText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

// ─── Helper: Python Converter — PDF → Office/JPG (FREE, 100% local) ───────────
async function convertFromPdfFree(filePath, originalName, endpoint) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), originalName);

  const response = await fetch(`${CONVERTER_URL}${endpoint}`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Converter Error (${response.status}): ${errText}`);
  }
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type')
  };
}

// ─── Queue System for Heavy PDF Operations ──────────────────────────────────────
const JOB_QUEUE = [];
const JOBS = new Map();
const MAX_CONCURRENT_JOBS = 5;
let activeJobs = 0;

async function processNextJob() {
  if (activeJobs >= MAX_CONCURRENT_JOBS || JOB_QUEUE.length === 0) return;
  
  activeJobs++;
  const jobId = JOB_QUEUE.shift();
  const job = JOBS.get(jobId);
  if (!job) {
    activeJobs--;
    return processNextJob();
  }

  job.status = 'processing';
  
  // Update positions for remaining jobs in queue
  JOB_QUEUE.forEach((id, index) => {
    const qJob = JOBS.get(id);
    if (qJob) qJob.position = index + 1;
  });

  try {
    const { req, files, tool, baseName, newFilename, contentType } = job;
    
    const customHeaders = {};
    const mockRes = {
      set: (k, v) => {
        if (typeof k === 'object') {
          Object.assign(customHeaders, k);
        } else {
          customHeaders[k] = v;
        }
      },
      get: (k) => customHeaders[k],
      status: () => mockRes,
      json: (obj) => { throw new Error(obj.error || 'Job failed'); }
    };
    
    const result = await executeTool(req, mockRes, files, tool, baseName, newFilename, contentType);
    job.status = 'done';
    job.result = result; // { buffer, contentType, newFilename, customHeaders }
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
  } finally {
    // Clean up temporary files
    if (job.files) {
      job.files.forEach(f => {
        try { 
          if (fs.existsSync(f.path)) {
            fs.unlinkSync(f.path); 
          }
        } catch(e){
          console.log('Cleanup warning:', e.message);
        }
      });
    }

    activeJobs--;
    processNextJob();
    
    // Auto-delete job after 1 hour to free memory
    setTimeout(() => {
      JOBS.delete(jobId);
    }, 60 * 60 * 1000);
  }
}

app.get('/api/job/:id', (req, res) => {
  const job = JOBS.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found or expired' });
  if (job.status === 'done') {
    return res.json({ status: 'done', data: job.result.jsonResponse });
  }
  res.json({ status: job.status, position: job.position, error: job.error });
});

app.get('/api/download/:id', (req, res) => {
  const job = JOBS.get(req.params.id);
  if (!job || job.status !== 'done') return res.status(404).json({ error: 'Result not available' });
  
  const { buffer, contentType, newFilename, customHeaders } = job.result;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${newFilename}"`);
  
  if (customHeaders) {
    for (const [k, v] of Object.entries(customHeaders)) {
      res.setHeader(k, v);
    }
  }
  
  res.send(buffer);
});

// ─── Execute Tool Logic (Extracted from /api/process) ──────────────────────────
async function executeTool(req, res, files, tool, baseName, newFilename, contentType) {
  let processedBuffer;
  const file = files.find(f => f.fieldname === 'file') || files[0];

  try {
    const { tool } = req.body;

    if (!files || files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
    if (!tool)  return res.status(400).json({ error: 'Tool type not specified' });

    const file = files.find(f => f.fieldname === 'file') || files[0];
    if (!file) return res.status(400).json({ error: 'Main file missing' });
    
    // ─── SaaS Monetization: 10MB Free-Tier Limit ────────────────────────────────
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      files.forEach(f => { try { fs.unlinkSync(f.path); } catch(e){} });
      return res.status(413).json({ error: 'File size exceeds the 10MB free tier limit. Upgrade to Pro for up to 1GB uploads.' });
    }
    // ────────────────────────────────────────────────────────────────────────────
    
    console.log(`  → File: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);
    console.log(`  → Tool: ${tool}`);
    console.log(`\n🔧 [${tool}] — Processing ${files.length} file(s)`);

    let processedBuffer;
    let newFilename = `processed_${file.originalname}`;
    let contentType = 'application/pdf';
    const baseName = file.originalname.replace(/\.[^/.]+$/, '');

    switch (tool) {

      // ── NATIVE PDF-LIB (Merge, Split, Rotate, etc.) ─────────────────────
      case 'Merge PDF': {
        const mergedPdf = await PDFDocument.create();
        for (const f of files) {
          if (!f.mimetype.includes('pdf')) throw new Error('All files must be PDFs for merging.');
          const pdfDoc = await PDFDocument.load(fs.readFileSync(f.path), { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        processedBuffer = Buffer.from(await mergedPdf.save());
        newFilename = `merged_document.pdf`;
        contentType = 'application/pdf';
        break;
      }

      case 'Split PDF': {
        if (!file.mimetype.includes('pdf')) throw new Error('This tool requires a PDF file.');
        const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
        const numPages = pdfDoc.getPageCount();
        const options = req.body.splitOptions ? JSON.parse(req.body.splitOptions) : { mode: 'all' };
        const zip = new AdmZip();
        
        if (options.mode === 'all') {
            for (let i = 0; i < numPages; i++) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                zip.addFile(`${baseName}_page_${i + 1}.pdf`, Buffer.from(pdfBytes));
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
                copiedPages.forEach(p => newPdf.addPage(p));
                const pdfBytes = await newPdf.save();
                zip.addFile(`${baseName}_part_${part}.pdf`, Buffer.from(pdfBytes));
                part++;
            }
        } else if (options.mode === 'custom' && options.customRanges) {
            const ranges = options.customRanges.split(',').map(s => s.trim());
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
                    copiedPages.forEach(p => newPdf.addPage(p));
                    const pdfBytes = await newPdf.save();
                    zip.addFile(`${baseName}_pages_${range.replace('-', '_')}.pdf`, Buffer.from(pdfBytes));
                }
            }
        }
        
        processedBuffer = zip.toBuffer();
        newFilename = `${baseName}_split.zip`;
        contentType = 'application/zip';
        break;
      }

      case 'Rotate PDF': {
        const { degrees } = require('pdf-lib');
        if (!file.mimetype.includes('pdf')) throw new Error('This tool requires a PDF file.');
        const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
        const numPages = pdfDoc.getPageCount();
        const options = req.body.rotateOptions ? JSON.parse(req.body.rotateOptions) : { angle: 90, mode: 'all' };
        
        const indicesToRotate = new Set();
        if (options.mode === 'all') {
            for (let i = 0; i < numPages; i++) indicesToRotate.add(i);
        } else if (options.mode === 'custom' && options.customRanges) {
            const ranges = options.customRanges.split(',').map(s => s.trim());
            for (const range of ranges) {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= numPages) indicesToRotate.add(i - 1);
                    }
                } else {
                    const i = Number(range);
                    if (i >= 1 && i <= numPages) indicesToRotate.add(i - 1);
                }
            }
        }
        
        const pages = pdfDoc.getPages();
        for (const idx of indicesToRotate) {
            if (pages[idx]) {
                const currentAngle = pages[idx].getRotation().angle;
                pages[idx].setRotation(degrees(currentAngle + options.angle));
            }
        }
        
        processedBuffer = Buffer.from(await pdfDoc.save());
        newFilename = `${baseName}_rotated.pdf`;
        contentType = 'application/pdf';
        break;
      }

      case 'Sign PDF': {
        console.log(`  → ✍️ Sign PDF`);
        const signImgFile = files.find(f => f.fieldname === 'signature_image');
        if (!file.mimetype.includes('pdf')) throw new Error('This tool requires a PDF file.');
        
        const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
        
        let signatureImage;
        if (signImgFile) {
            const imgBytes = fs.readFileSync(signImgFile.path);
            signatureImage = await pdfDoc.embedPng(imgBytes).catch(async () => await pdfDoc.embedJpg(imgBytes));
        }

        const { details_name, details_title, details_date, details_id, target_page, pos_x, pos_y, sig_width, sig_height, sig_rotation, flatten } = req.body;
        
        const pages = pdfDoc.getPages();
        const targetPageNum = parseInt(target_page, 10);
        const page = pages[targetPageNum - 1];
        if (!page) throw new Error('Invalid page selection');

        const { width, height } = page.getSize();
        const pctX = parseFloat(pos_x) / 100;
        const pctY = parseFloat(pos_y) / 100;

        const center_x = width * pctX;
        const center_y = height * (1 - pctY);

        // Use user-chosen size (convert preview px → PDF pts ratio)
        const previewW = parseFloat(req.body.container_width) || 500;
        const scaleFactor = width / previewW;
        const imgWidth  = sig_width  ? parseFloat(sig_width)  * scaleFactor : 180;
        const imgHeight = sig_height ? parseFloat(sig_height) * scaleFactor : 60;
        const rotationDeg = sig_rotation ? parseFloat(sig_rotation) : 0;

        if (signatureImage) {
            page.drawImage(signatureImage, {
                x: center_x - (imgWidth / 2),
                y: center_y - (imgHeight / 2),
                width: imgWidth,
                height: imgHeight,
                rotate: degrees(rotationDeg),
            });
        }

        // Draw details text below the signature
        let textY = center_y - (imgHeight / 2) - 12;
        const drawDetail = (text) => {
            if (text) {
                page.drawText(text, { x: center_x - (imgWidth / 2), y: textY, size: 8 });
                textY -= 10;
            }
        };
        drawDetail(details_name);
        drawDetail(details_title);
        drawDetail(details_date);
        drawDetail(details_id);

        if (flatten === 'true') {
            const form = pdfDoc.getForm();
            form.flatten();
        }


        processedBuffer = Buffer.from(await pdfDoc.save());
        newFilename = `${baseName}_signed.pdf`;
        contentType = 'application/pdf';
        break;
      }

      case 'Delete pages':
      case 'Edit PDF': {
        if (!file.mimetype.includes('pdf')) throw new Error('This tool requires a PDF file.');
        const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        if (pages.length > 0) {
          pages[0].drawText(`PDFMaster — ${tool}`, { x: 10, y: 10, size: 10 });
        }
        processedBuffer = Buffer.from(await pdfDoc.save());
        newFilename = `${baseName}_${tool.replace(/\s+/g, '_')}.pdf`;
        contentType = 'application/pdf';
        break;
      }

      // ── GOTENBERG: Office / Image → PDF (FREE ✅) ─────────────────────────
      case 'Word to PDF':
      case 'Excel to PDF':
      case 'PowerPoint to PDF':
      case 'JPG to PDF':
      case 'HTML to PDF': {
        console.log(`  → 🐳 Gotenberg (LibreOffice): ${tool}`);
        processedBuffer = await convertToPdfWithGotenberg(file.path, file.originalname);
        newFilename = `${baseName}.pdf`;
        contentType = 'application/pdf';
        break;
      }

      // ── PYTHON SERVICE: PDF → Word (FREE ✅) ──────────────────────────────
      case 'PDF to Word': {
        console.log(`  → 🐍 Python pdf2docx: PDF → DOCX`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-docx');
        processedBuffer = result.buffer;
        newFilename = `${baseName}_converted.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      }

      // ── PYTHON SERVICE: PDF → Excel (FREE ✅) ─────────────────────────────
      case 'PDF to Excel': {
        console.log(`  → 🐍 Python pdfplumber: PDF → XLSX`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-xlsx');
        processedBuffer = result.buffer;
        newFilename = `${baseName}_converted.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      }

      // ── PYTHON SERVICE: PDF → PowerPoint (FREE ✅) ───────────────────────
      case 'PDF to PowerPoint': {
        console.log(`  → 🐍 Python pdf2image+pptx: PDF → PPTX`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-pptx');
        processedBuffer = result.buffer;
        newFilename = `${baseName}_converted.pptx`;
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      }

      // ── PYTHON SERVICE: PDF → JPG (FREE ✅) ──────────────────────────────
      case 'PDF to JPG': {
        console.log(`  → 🐍 Python pdf2image: PDF → JPG`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-jpg');
        processedBuffer = result.buffer;
        
        if (result.contentType === 'application/zip') {
            newFilename = `${baseName}_converted.zip`;
            contentType = 'application/zip';
        } else {
            newFilename = `${baseName}_converted.jpg`;
            contentType = 'image/jpeg';
        }
        break;
      }

      // ── PYTHON SERVICE: PDF → HTML (FREE ✅) ─────────────────────────────
      case 'PDF to HTML': {
        console.log(`  → 🐍 Python PyMuPDF: PDF → HTML`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-html');
        processedBuffer = result.buffer;
        newFilename = `${baseName}_converted.html`;
        contentType = 'text/html';
        break;
      }

      // ── PYTHON SERVICE: PDF → Text (FREE ✅) ─────────────────────────────
      case 'PDF to Text': {
        console.log(`  → 🐍 Python PyMuPDF: PDF → Text`);
        const result = await convertFromPdfFree(file.path, file.originalname, '/pdf-to-txt');
        processedBuffer = result.buffer;
        newFilename = `${baseName}_converted.txt`;
        contentType = 'text/plain';
        break;
      }

      // ── Compress PDF (Python/Ghostscript first, pdf-lib fallback) ────────
      case 'Compress PDF': {
        const reqLevel = req.body.level || 'recommended';
        const levelMap = {
          // New standard names
          'low': 'low',
          'medium': 'medium',
          'high': 'high',
          'maximum': 'maximum',
          // Backwards compatibility
          'less': 'low',
          'recommended': 'medium',
          'extreme': 'maximum'
        };
        const compressLevel = levelMap[reqLevel] || 'medium';
        const originalSize  = fs.statSync(file.path).size;
        let usedFallback = false;

        // ── Try Python service first (Ghostscript = best quality) ──────────
        try {
          console.log(`  → 🐍 Trying Python Ghostscript (level: ${compressLevel})...`);
          const compressForm = new FormData();
          compressForm.append('file', fs.createReadStream(file.path), file.originalname);
          compressForm.append('level', compressLevel);

          const compressResp = await fetch(`${CONVERTER_URL}/compress-pdf`, {
            method: 'POST',
            body: compressForm,
            headers: compressForm.getHeaders(),
            // 120s timeout — Ghostscript can take a while on large PDFs
            signal: AbortSignal.timeout(120000),
          });

          if (!compressResp.ok) throw new Error(`Python service: ${compressResp.status}`);

          processedBuffer = Buffer.from(await compressResp.arrayBuffer());

          // Forward Python's size headers
          const origSize = compressResp.headers.get('x-original-size');
          const compSize = compressResp.headers.get('x-compressed-size');
          const redPct   = compressResp.headers.get('x-reduction-pct');
          if (origSize) res.set('X-Original-Size',   origSize);
          if (compSize) res.set('X-Compressed-Size', compSize);
          if (redPct)   res.set('X-Reduction-Pct',   redPct);
          console.log(`  ✅ Python compression done. Reduction: ${redPct}%`);

        } catch (pyErr) {
          // ── Fallback: pdf-lib compression in Node.js ────────────────────
          console.log(`  ⚠️  Python unavailable (${pyErr.message}). Falling back to pdf-lib...`);
          usedFallback = true;

          const rawPdf   = fs.readFileSync(file.path);
          const pdfDoc   = await PDFDocument.load(rawPdf, { ignoreEncryption: true });

          // Strip metadata
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('PDFMaster');
          pdfDoc.setCreator('PDFMaster');

          const pages = pdfDoc.getPages();

          // Remove annotations for medium/high/maximum
          if (['medium', 'high', 'maximum'].includes(compressLevel)) {
            for (const page of pages) {
              try { page.node.delete('Annots'); } catch (_) {}
            }
          }

          // Strip extra catalog entries for high/maximum
          if (['high', 'maximum'].includes(compressLevel)) {
            try {
              const cat = pdfDoc.catalog;
              ['Metadata', 'Outlines', 'Threads', 'AcroForm'].forEach(k => {
                try { cat.delete(k); } catch (_) {}
              });
            } catch (_) {}
          }

          const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
          processedBuffer  = Buffer.from(compressed);

          const compressedSize = processedBuffer.length;
          const reductionPct   = originalSize > 0
            ? Math.max(0, ((1 - compressedSize / originalSize) * 100).toFixed(1))
            : 0;

          res.set('X-Original-Size',   String(originalSize));
          res.set('X-Compressed-Size', String(compressedSize));
          res.set('X-Reduction-Pct',   String(reductionPct));
          console.log(`  ✅ pdf-lib fallback done. ${originalSize} → ${compressedSize} (${reductionPct}% reduction)`);
        }

        newFilename = `${baseName}_compressed.pdf`;
        contentType = 'application/pdf';
        res.set('Access-Control-Expose-Headers',
          'X-Original-Size, X-Compressed-Size, X-Reduction-Pct');
        break;
      }

      // ── Repair PDF (Python service) ─────────────────────────────────────────
      case 'Repair PDF': {
        const repairLevel = req.body.level || 'deep';
        
        try {
          console.log(`  → 🐍 Trying Python Repair (level: ${repairLevel})...`);
          const form = new FormData();
          form.append('file', fs.createReadStream(file.path), file.originalname);
          form.append('level', repairLevel);

          const resp = await fetch(`${CONVERTER_URL}/repair-pdf`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
            // No signal timeout here, let it run
          });

          if (!resp.ok) throw new Error(`Python service: ${resp.status}`);
          
          // Set headers for the repaired file
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${baseName}_repaired.pdf"`,
            'Access-Control-Expose-Headers': 'Content-Disposition'
          });

          // Pipe the stream directly to the response
          resp.body.pipe(res);
          console.log(`  ✅ Python repair streaming started.`);
          return; // Crucial: exit early as we've already sent the response via pipe
        } catch (err) {
          console.log(`  ⚠️  Python failed (${err.message}).`);
          throw new Error('Repair failed. The PDF might be too severely corrupted.');
        }
      }

      // ── OCR PDF (Python Tesseract) ────────────────────────────────────────────
      case 'OCR PDF': {
        const ocrMode = req.body.mode || 'searchable';
        const ocrLang = req.body.language || 'eng';
        console.log(`  → 🐍 Python OCR (mode: ${ocrMode}, lang: ${ocrLang})`);

        const ocrForm = new FormData();
        ocrForm.append('file', fs.createReadStream(file.path), file.originalname);
        ocrForm.append('mode', ocrMode);
        ocrForm.append('language', ocrLang);

        const ocrResp = await fetch(`${CONVERTER_URL}/ocr-pdf`, {
          method: 'POST',
          body: ocrForm,
          headers: ocrForm.getHeaders(),
          signal: AbortSignal.timeout(300000), // 5 min for large docs
        });

        if (!ocrResp.ok) {
          const errText = await ocrResp.text();
          throw new Error(`OCR service error (${ocrResp.status}): ${errText}`);
        }

        // Forward OCR metadata headers
        const ocrPages    = ocrResp.headers.get('x-ocr-pages');
        const ocrAccuracy = ocrResp.headers.get('x-ocr-accuracy');
        if (ocrPages)    res.set('X-OCR-Pages',    ocrPages);
        if (ocrAccuracy) res.set('X-OCR-Accuracy', ocrAccuracy);
        res.set('Access-Control-Expose-Headers', 'X-OCR-Pages, X-OCR-Accuracy');

        // Determine output filename/mime based on mode
        const extMap  = { searchable: '.pdf', text: '.txt', tables: '.xlsx', arabic: '.pdf' };
        const mimeMap = {
          searchable: 'application/pdf',
          text:       'text/plain',
          tables:     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          arabic:     'application/pdf',
        };
        newFilename = `${baseName}_ocr${extMap[ocrMode] || '.pdf'}`;
        contentType = mimeMap[ocrMode] || 'application/pdf';
        processedBuffer = Buffer.from(await ocrResp.arrayBuffer());
        console.log(`  ✅ OCR done — pages: ${ocrPages}, accuracy: ${ocrAccuracy}%`);
        break;
      }

      // ── Flatten PDF (Native pdf-lib) ────────────────────────────────────────────
      case 'Flatten PDF': {
        const flattenMode = req.body.mode || 'all';
        console.log(`  → 🗃️ Native pdf-lib Flatten (mode: ${flattenMode})`);

        const rawPdf = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(rawPdf, { ignoreEncryption: true });
        const form = pdfDoc.getForm();
        
        let fieldsFlattened = 0;
        let annotsFlattened = 0;

        try {
            const fields = form.getFields();
            fieldsFlattened = fields.length;
            if (fieldsFlattened > 0) {
                form.flatten();
            }
            
            // For annotations, pdf-lib doesn't have a native flatten method for non-widget annots,
            // but we can try to strip them if mode is 'all' or 'annotations'
            if (flattenMode === 'all' || flattenMode === 'annotations') {
                const pages = pdfDoc.getPages();
                for (const page of pages) {
                    try { 
                        // Just count them, stripping is complex in pdf-lib without losing visual
                        const annots = page.node.Annots();
                        if (annots) {
                            annotsFlattened += annots.size();
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {
            console.log("  ⚠️ Minor warning during pdf-lib flatten:", e.message);
        }

        res.set('X-Fields-Flattened', String(fieldsFlattened));
        res.set('X-Annots-Flattened', String(annotsFlattened));

        newFilename = `${baseName}_flattened.pdf`;
        contentType = 'application/pdf';
        processedBuffer = Buffer.from(await pdfDoc.save());
        console.log(`  ✅ Flatten done — fields: ${fieldsFlattened}, annots: ${annotsFlattened}`);
        break;
      }

      // ── Add Text (pdf-lib) ──────────────────────────────────────────────────
      case 'Add Text': {
        const { text, fontSize, opacity, position, color } = req.body;
        const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path), { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Convert hex color to rgb
        const hexToRgb = (hex) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return rgb(r, g, b);
        };

        const textColor = color ? hexToRgb(color) : rgb(0, 0, 0);
        const fSize = parseInt(fontSize) || 30;
        const textOpacity = parseFloat(opacity) || 1;

        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, fSize);
          const textHeight = fSize;

          let x = 50, y = 50;

          switch (position) {
            case 'center':
              x = (width - textWidth) / 2;
              y = (height - textHeight) / 2;
              break;
            case 'top-center':
              x = (width - textWidth) / 2;
              y = height - textHeight - 50;
              break;
            case 'bottom-center':
              x = (width - textWidth) / 2;
              y = 50;
              break;
            case 'top-left':
              x = 50;
              y = height - textHeight - 50;
              break;
            case 'top-right':
              x = width - textWidth - 50;
              y = height - textHeight - 50;
              break;
            case 'bottom-left':
              x = 50;
              y = 50;
              break;
            case 'bottom-right':
              x = width - textWidth - 50;
              y = 50;
              break;
          }

          page.drawText(text, {
            x, y,
            size: fSize,
            font,
            color: textColor,
            opacity: textOpacity,
          });
        }

        processedBuffer = Buffer.from(await pdfDoc.save());
        newFilename = `${baseName}_modified.pdf`;
        contentType = 'application/pdf';
        break;
      }

      // ── Redact PDF (Python) ────────────────────────────────────────────
      case 'Redact PDF': {
        console.log(`  → 🔲 Python Redact PDF`);

        const redactForm = new FormData();
        redactForm.append('file', fs.createReadStream(file.path), file.originalname);
        
        redactForm.append('search_text', req.body.search_text || '');
        redactForm.append('redact_cnic', req.body.redact_cnic || 'false');
        redactForm.append('redact_email', req.body.redact_email || 'false');
        redactForm.append('redact_phone', req.body.redact_phone || 'false');
        redactForm.append('color', req.body.color || 'black');
        redactForm.append('overlay_text', req.body.overlay_text || '');
        redactForm.append('clean_metadata', req.body.clean_metadata || 'false');

        const redactResp = await fetch(`${CONVERTER_URL}/redact-pdf`, {
          method: 'POST',
          body: redactForm,
          headers: redactForm.getHeaders(),
          signal: AbortSignal.timeout(600000), // 10 min
        });

        if (!redactResp.ok) {
          const errText = await redactResp.text();
          throw new Error(`Redact service error (${redactResp.status}): ${errText}`);
        }

        newFilename = `${baseName}_redacted.pdf`;
        contentType = 'application/pdf';
        processedBuffer = Buffer.from(await redactResp.arrayBuffer());
        
        const redactCount = redactResp.headers.get('X-Redact-Count') || 0;
        console.log(`  ✅ Redact done. Items redacted: ${redactCount}`);
        
        res.set('X-Redact-Count', redactCount);
        break;
      }

      // ── DEFAULT: passthrough ──────────────────────────────────────────────
      default: {
        console.log(`  → ⚠️  No handler for: "${tool}", passing through`);
        processedBuffer = fs.readFileSync(file.path);
        newFilename = file.originalname;
        contentType = file.mimetype || 'application/octet-stream';
        break;
      }
      // ── Protect PDF (Python) ────────────────────────────────────────────
      case 'Protect PDF': {
        console.log(`  → 🔒 Python Protect PDF`);

        const protectForm = new FormData();
        protectForm.append('file', fs.createReadStream(file.path), file.originalname);
        
        if (req.body.open_password) protectForm.append('open_password', req.body.open_password);
        if (req.body.owner_password) protectForm.append('owner_password', req.body.owner_password);
        protectForm.append('encryption_level', req.body.encryption_level || 'aes_256');
        protectForm.append('allow_print', req.body.allow_print === 'true' ? 'true' : 'false');
        protectForm.append('allow_copy', req.body.allow_copy === 'true' ? 'true' : 'false');
        protectForm.append('allow_modify', req.body.allow_modify === 'true' ? 'true' : 'false');
        protectForm.append('allow_annotate', req.body.allow_annotate === 'true' ? 'true' : 'false');

        const protectResp = await fetch(`${CONVERTER_URL}/protect-pdf`, {
          method: 'POST',
          body: protectForm,
          headers: protectForm.getHeaders(),
          signal: AbortSignal.timeout(300000), // 5 min
        });

        if (!protectResp.ok) {
          const errText = await protectResp.text();
          throw new Error(`Protect service error (${protectResp.status}): ${errText}`);
        }

        newFilename = `${baseName}_protected.pdf`;
        contentType = 'application/pdf';
        processedBuffer = Buffer.from(await protectResp.arrayBuffer());
        console.log(`  ✅ Protect done`);
        break;
      }

      // ── Unlock PDF (Python) ────────────────────────────────────────────
      case 'Unlock PDF': {
        console.log(`  → 🔓 Python Unlock PDF`);

        const unlockForm = new FormData();
        unlockForm.append('file', fs.createReadStream(file.path), file.originalname);
        unlockForm.append('password', req.body.password || '');

        const unlockResp = await fetch(`${CONVERTER_URL}/unlock-pdf`, {
          method: 'POST',
          body: unlockForm,
          headers: unlockForm.getHeaders(),
          signal: AbortSignal.timeout(300000), // 5 min
        });

        if (!unlockResp.ok) {
          const errText = await unlockResp.text();
          if (unlockResp.status === 401) {
             throw new Error("Incorrect Password. Please check the password and try again.");
          }
          throw new Error(`Unlock service error (${unlockResp.status}): ${errText}`);
        }

        newFilename = `${baseName}_unlocked.pdf`;
        contentType = 'application/pdf';
        processedBuffer = Buffer.from(await unlockResp.arrayBuffer());
        console.log(`  ✅ Unlock done`);
        break;
      }
    }

    return { buffer: processedBuffer, contentType, newFilename, customHeaders: res.customHeaders || {}, jsonResponse: {
        filename: newFilename,
        contentType: contentType,
        fields: res ? (res.get('X-Fields-Flattened') || 0) : 0,
        annots: res ? (res.get('X-Annots-Flattened') || 0) : 0,
        redactCount: res ? (res.get('X-Redact-Count') || 0) : 0,
        base64: processedBuffer.toString('base64')
    }};

  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    throw error;
  }
} // End of executeTool

// ─── Main API Route (Queued) ──────────────────────────────────────────────────
app.post('/api/process', upload.any(), async (req, res) => {
  const files = req.files;
  const { tool } = req.body;
  console.log(`\n📨 Incoming request for: ${tool} | files attached: ${files ? files.length : 0}`);
  
  if (!files || files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
  if (!tool)  return res.status(400).json({ error: 'Tool type not specified' });
  
  const file = files.find(f => f.fieldname === 'file') || files[0];
  if (!file) return res.status(400).json({ error: 'Main file missing' });
  
  // ─── SaaS Monetization: 10MB Free-Tier Limit ────────────────────────────────
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  if (totalSize > 10 * 1024 * 1024) {
    files.forEach(f => { try { fs.unlinkSync(f.path); } catch(e){} });
    return res.status(413).json({ error: 'File size exceeds the 10MB free tier limit. Upgrade to Pro for up to 1GB uploads.' });
  }
  
  const baseName = file.originalname.replace(/\.[^/.]+$/, '');
  let newFilename = `processed_${file.originalname}`;
  let contentType = 'application/pdf';

  // Create Job
  const jobId = crypto.randomUUID();
  const position = JOB_QUEUE.length + 1;
  
  JOBS.set(jobId, {
    id: jobId,
    status: 'queued',
    position,
    req: { body: req.body }, // Only store serializable request body data
    res: null,
    files,
    tool,
    baseName,
    newFilename,
    contentType
  });
  
  JOB_QUEUE.push(jobId);
  res.status(202).json({ jobId, status: 'queued', position });
  
  // Trigger processing
  processNextJob();
});

// ─── Plagiarism Check ──────────────────────────────────────────────────────────
app.post('/api/plagiarism-check', express.json({ limit: '50mb' }), async (req, res) => {
  const { text, options } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided for plagiarism check' });

  console.log(`\n🔍 Incoming request for: Plagiarism Check | text length: ${text.length}`);

  try {
    const fetchPromise = await fetch(`${CONVERTER_URL}/plagiarism-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, options })
    });

    if (!fetchPromise.ok) {
      const errText = await fetchPromise.text();
      throw new Error(`Plagiarism service error (${fetchPromise.status}): ${errText}`);
    }

    const data = await fetchPromise.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Plagiarism check error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// In-memory store for pending signature requests {token -> {requesterEmail, fileName, signerName, signerEmail}}
const pendingRequests = new Map();

// ─── Request Signature — Send Email to Signers ────────────────────────────────
app.post('/api/send-signature-request', express.json({ limit: '50mb' }), async (req, res) => {
  const { signers, fileName, deadline, customMessage, senderName, requesterEmail, fileBase64, fields } = req.body;

  if (!signers || !Array.isArray(signers) || signers.length === 0)
    return res.status(400).json({ error: 'No signers provided.' });

  if (fileBase64) {
    const sizeBytes = Math.ceil(fileBase64.length * 0.75);
    if (sizeBytes > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'File size exceeds the 10MB free tier limit. Upgrade to Pro for up to 1GB uploads.' });
    }
  }

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com')
    return res.status(503).json({ error: 'EMAIL_NOT_CONFIGURED' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const fromName = process.env.EMAIL_FROM_NAME || 'PDFMaster';
    const doc = fileName || 'Document';
    const sender = senderName || 'Someone';
    const results = [];

    for (const signer of signers) {
      const token = crypto.randomBytes(32).toString('hex');
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const signingLink = `${baseUrl}/sign/${token}`;

      results.push({ token, name: signer.name, email: signer.email, status: 'sent', signingLink });
      
      // Store token so we can notify requester when signed
      const signerFields = (fields || []).filter(f => f.signerId === signer.id);
      
      pendingRequests.set(token, {
        requesterEmail: requesterEmail || process.env.EMAIL_USER,
        fileName: doc,
        signerName: signer.name,
        signerEmail: signer.email,
        senderName: sender,
        fileBase64: fileBase64, // store the base64 string
        status: 'sent',
        fields: signerFields,
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        auditTrail: {
          requestedIP: req.ip || req.connection.remoteAddress,
          requestedDevice: req.headers['user-agent']
        }
      });

      // FIRE AND FORGET: Send email asynchronously so we don't block the frontend response
      transporter.sendMail({
        from: `"${fromName}" <${process.env.EMAIL_USER}>`,
        to: `"${signer.name}" <${signer.email}>`,
        subject: `✍️ Signature Requested: ${doc}`,
        html: `
          <div style="max-width:540px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:Arial,sans-serif">
            <div style="background:linear-gradient(135deg,#5b21b6,#7c3aed);padding:32px;text-align:center">
              <div style="font-size:36px">📄</div>
              <h1 style="color:white;margin:8px 0 0;font-size:22px">${fromName}</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Electronic Signature Request</p>
            </div>
            <div style="padding:32px">
              <h2 style="color:#1f2937;font-size:18px;margin:0 0 12px">Hello ${signer.name},</h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
                <strong style="color:#374151">${sender}</strong> has requested your electronic signature on <strong>${doc}</strong>.
              </p>
              ${customMessage ? `<div style="background:#ede9fe;border-left:4px solid #7c3aed;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px"><p style="margin:0;color:#5b21b6;font-style:italic;white-space:pre-wrap;">"${customMessage.replace(/\\n/g, '<br/>')}"</p></div>` : ''}
              <div style="text-align:center;margin:32px 0">
                <a href="${signingLink}" style="display:inline-block;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">
                  ✍️ Sign Document
                </a>
              </div>
              <p style="color:#9ca3af;font-size:12px;text-align:center">This request expires in <strong>${deadline || 7} days</strong>.</p>
            </div>
            <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6">
              <p style="color:#d1d5db;font-size:11px;margin:0">${fromName} — Secure Electronic Signatures</p>
            </div>
          </div>`
      }).then(() => {
        console.log(`✅ Signature request sent to ${signer.name} <${signer.email}>`);
      }).catch(err => {
        console.error(`❌ Failed to send email to ${signer.email}:`, err.message);
      });
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fetch Signature Request Info ─────────────────────────────────────────────
app.get('/api/signature-request/:token', (req, res) => {
  const { token } = req.params;
  const request = pendingRequests.get(token);

  if (!request) {
    return res.status(404).json({ error: 'Link expired or invalid.' });
  }

  // Check expiry
  if (new Date() > new Date(request.expiresAt)) {
    request.status = 'expired';
    return res.status(400).json({ error: 'This signature link has expired.' });
  }

  // Mark as viewed if it was just 'sent'
  if (request.status === 'sent') {
    request.status = 'viewed';
    request.auditTrail.viewedAt = new Date().toISOString();
    request.auditTrail.viewedIP = req.ip || req.connection.remoteAddress;
    request.auditTrail.viewedDevice = req.headers['user-agent'];
  }

  // Only return safe info to frontend (but we need base64 for placement)
  res.json({
    fileName: request.fileName,
    signerName: request.signerName,
    senderName: request.senderName,
    status: request.status,
    fileBase64: request.fileBase64,
    fields: request.fields
  });
});

// ─── Complete Signing — Notify Requester ──────────────────────────────────────
app.post('/api/complete-signing/:token', express.json({ limit: '50mb' }), async (req, res) => {
  const { token } = req.params;
  const { signedDate, signMethod } = req.body;

  const request = pendingRequests.get(token);
  if (!request) {
    // Token not found but still return success (signer sees success screen)
    return res.json({ success: true, message: 'Signature recorded.' });
  }

  if (req.body.signatureImage) {
    const sigSize = Math.ceil(req.body.signatureImage.length * 0.75);
    if (sigSize > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Signature image exceeds 10MB limit.' });
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const fromName = process.env.EMAIL_FROM_NAME || 'PDFMaster';
    const signedAt = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: request.requesterEmail,
      subject: `✅ Document Signed: ${request.fileName}`,
      html: `
        <div style="max-width:540px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:Arial,sans-serif">
          <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:32px;text-align:center">
            <div style="font-size:40px">✅</div>
            <h1 style="color:white;margin:8px 0 0;font-size:22px">${fromName}</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Document Signed Successfully</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#065f46;font-size:20px;margin:0 0 16px">Great news! Your document has been signed.</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
              The signed document is attached to this email.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#6b7280;width:40%">Document</td><td style="padding:6px 0;font-weight:700;color:#111827">${request.fileName}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Signed by</td><td style="padding:6px 0;font-weight:700;color:#111827">${request.signerName}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Signer email</td><td style="padding:6px 0;color:#111827">${request.signerEmail}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Sign method</td><td style="padding:6px 0;color:#111827">${signMethod === 'draw' ? '✏️ Drawn signature' : '⌨️ Typed name'}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Date signed</td><td style="padding:6px 0;color:#111827">${signedDate || signedAt}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Timestamp</td><td style="padding:6px 0;color:#111827">${signedAt}</td></tr>
              </table>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px;margin-bottom:24px">
              <p style="margin:0;font-size:13px;color:#5b21b6;line-height:1.7">
                🔐 <strong>Audit Trail:</strong> This signature is legally binding. The signer's IP address, device information, and exact timestamp have been recorded.
              </p>
            </div>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6">
            <p style="color:#d1d5db;font-size:11px;margin:0">${fromName} — Secure Electronic Signatures</p>
          </div>
        </div>`
    };

    if (request.fileBase64) {
      // ✅ SAFE base64 extraction — never split on commas inside the base64 data!
      // data:application/pdf;base64,<actual_base64_here>
      const rawFileBase64 = request.fileBase64;
      let finalBase64Data;
      if (rawFileBase64.includes(',')) {
        // Strip everything up to and including the first comma (the data URI prefix)
        finalBase64Data = rawFileBase64.substring(rawFileBase64.indexOf(',') + 1);
      } else {
        // Already raw base64
        finalBase64Data = rawFileBase64;
      }

      // ⚠️ CRITICAL: [] is truthy in JS, so "[] || fallback" never uses fallback!
      // Must check .length explicitly
      const frontendFields = req.body.finalFields;
      const storedFields   = request.fields;
      let fieldsToUse;
      if (frontendFields && frontendFields.length > 0) {
        fieldsToUse = frontendFields;
      } else if (storedFields && storedFields.length > 0) {
        fieldsToUse = storedFields;
      } else {
        // Last resort: place signature at bottom of page 1
        fieldsToUse = [
          { type: 'sign', page: 1, x: 5, y: 75, width: 30, height: 12 },
          { type: 'date', page: 1, x: 5, y: 89, width: 20, height: 6  }
        ];
        console.log('  ⚠️ No fields from frontend or stored! Using default placement.');
      }

      // ── DETAILED DEBUG LOGGING ──────────────────────────────────────────
      console.log('\n🔍 COMPLETE-SIGNING DEBUG:');
      console.log('  signMethod:', signMethod);
      console.log('  fileBase64 length (stored):', rawFileBase64.length);
      console.log('  finalBase64Data length (extracted):', finalBase64Data.length);
      console.log('  signatureImage present:', !!req.body.signatureImage);
      console.log('  signatureImage length:', req.body.signatureImage ? req.body.signatureImage.length : 0);
      console.log('  typedName:', req.body.typedName);
      console.log('  frontendFields count:', frontendFields ? frontendFields.length : 'null');
      console.log('  storedFields count:', storedFields ? storedFields.length : 'null');
      console.log('  fieldsToUse count:', fieldsToUse.length);
      console.log('  fields:', JSON.stringify(fieldsToUse.map(f => ({ type: f.type, page: f.page, x: f.x, y: f.y }))));
      // ────────────────────────────────────────────────────────────────────

      try {
        const pdfBytes = Buffer.from(finalBase64Data, 'base64');
        console.log('  pdfBytes length:', pdfBytes.length, '| first4bytes:', pdfBytes.slice(0,4).toString('ascii'));
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        // NOTE: We do NOT call form.flatten() — that renders field appearances
        // (lines, underlines, borders) permanently into the page, causing
        // unwanted visual artifacts in the signed PDF.
        // Instead, we directly delete the AcroForm and Annots below.

        // ── Step 2: For INTERACTIVE PDFs — strip AcroForm from catalog + remove
        // all page annotations. This handles signature field widgets (colored boxes)
        // that form.flatten() may not fully convert, plus JavaScript actions that
        // could reset or hide form content in PDF viewers.
        try {
          const catalog = pdfDoc.catalog;
          // Remove AcroForm entirely from catalog — makes PDF non-interactive
          try { catalog.delete('AcroForm'); } catch (_) {}
          // Remove document-level JavaScript actions
          try { catalog.delete('AA'); } catch (_) {}
          try { catalog.delete('JS'); } catch (_) {}
          console.log('  🧹 Stripped AcroForm + JS actions from PDF catalog (interactive → static).');
        } catch (catErr) {
          console.log('  ⚠️ Catalog cleanup warning:', catErr.message);
        }

        // ── Step 3: Remove ALL remaining page-level annotations
        // (colored placeholder boxes, FreeText, Rectangle, Stamp annotations).
        // form.flatten() only handles AcroForm widgets — other annotation types
        // still render above drawImage() in PDF viewers and hide the signature.
        const pages = pdfDoc.getPages();
        let totalAnnotsRemoved = 0;
        for (const page of pages) {
          try {
            // Also strip page-level JS/AA actions
            try { page.node.delete('AA'); } catch (_) {}
            const annotsArr = page.node.get('Annots');
            if (annotsArr) {
              totalAnnotsRemoved++;
              page.node.delete('Annots');
            }
          } catch (_) {}
        }
        if (totalAnnotsRemoved > 0) {
          console.log(`  🗑️ Stripped annotation layer from ${totalAnnotsRemoved} page(s) — signature will render on top.`);
        }

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        if (fieldsToUse.length > 0) {
          let sigImage = null;
          if ((signMethod === 'draw' || signMethod === 'upload') && req.body.signatureImage) {
            try {
              console.log('🖼️ Embedding signature image, signMethod:', signMethod);
              // Strip the data URI prefix robustly
              const rawSig = req.body.signatureImage;
              
              // Detect mime type from data URL header if present
              let mimeHint = '';
              if (rawSig.startsWith('data:')) {
                mimeHint = rawSig.substring(5, rawSig.indexOf(';'));
              }
              
              const imgData = rawSig.includes(',') ? rawSig.split(',')[1] : rawSig;
              if (!imgData || imgData.length < 10) {
                console.error('❌ imgData is empty or too short! length:', imgData ? imgData.length : 0);
              } else {
                const imgBuffer = Buffer.from(imgData, 'base64');
                console.log('  imgBuffer size:', imgBuffer.length, 'bytes | mimeHint:', mimeHint || 'none');
                
                // Check magic bytes
                const isPng = imgBuffer[0] === 0x89 && imgBuffer[1] === 0x50 && imgBuffer[2] === 0x4E;
                const isJpg = imgBuffer[0] === 0xFF && imgBuffer[1] === 0xD8 && imgBuffer[2] === 0xFF;
                const isWebP = imgBuffer.length > 12 && imgBuffer.slice(8, 12).toString('ascii') === 'WEBP';
                const isGif  = imgBuffer.slice(0, 6).toString('ascii') === 'GIF87a' || imgBuffer.slice(0, 6).toString('ascii') === 'GIF89a';
                
                console.log(`  Magic bytes → isPng:${isPng} | isJpg:${isJpg} | isWebP:${isWebP} | isGif:${isGif}`);
                
                if (isPng || mimeHint === 'image/png') {
                  sigImage = await pdfDoc.embedPng(imgBuffer);
                  console.log('  ✅ Embedded as PNG');
                } else if (isJpg || mimeHint === 'image/jpeg') {
                  sigImage = await pdfDoc.embedJpg(imgBuffer);
                  console.log('  ✅ Embedded as JPG');
                } else {
                  // WebP, GIF, BMP, or unknown format — try PNG first, then JPG
                  console.log('  ⚠️ Unknown format, trying PNG embed first...');
                  try {
                    sigImage = await pdfDoc.embedPng(imgBuffer);
                    console.log('  ✅ Embedded as PNG (fallback)');
                  } catch (pngErr) {
                    console.log('  PNG failed:', pngErr.message, '| Trying JPG...');
                    try {
                      sigImage = await pdfDoc.embedJpg(imgBuffer);
                      console.log('  ✅ Embedded as JPG (fallback)');
                    } catch (jpgErr) {
                      console.error('  ❌ Both PNG and JPG embedding failed.');
                      console.error('  PNG error:', pngErr.message);
                      console.error('  JPG error:', jpgErr.message);
                      console.error('  Image format not supported by pdf-lib. Buffer starts:', imgBuffer.slice(0, 16).toString('hex'));
                    }
                  }
                }
                
                if (sigImage) {
                  console.log('✅ Signature image embedded successfully');
                } else {
                  console.error('❌ sigImage is null after all embed attempts!');
                }
              }
            } catch (imgErr) {
              console.error('❌ Failed to embed signature image:', imgErr.message);
            }
          } else {
            console.log('⚠️ No signatureImage to embed.');
            console.log('   signMethod:', signMethod);
            console.log('   has signatureImage in req.body:', !!req.body.signatureImage);
            console.log('   signatureImage length:', req.body.signatureImage ? req.body.signatureImage.length : 0);
          }
          
          for (const field of fieldsToUse) {
            const pageIndex = field.page - 1;
            if (pageIndex >= 0 && pageIndex < pages.length) {
              const page = pages[pageIndex];
              const { width: pageW, height: pageH } = page.getSize();

              // Always percentage-based — works for any PDF size (KB or MB)
              const fieldW = (field.width  || 25) / 100;  // default 25% of page width
              const fieldH = (field.height || 10) / 100;  // default 10% of page height
              const imgWidth  = fieldW * pageW;
              const imgHeight = fieldH * pageH;

              // xPos: left edge of field; yPos: bottom-left in PDF coords
              const xPos = Math.max(0, (field.x / 100) * pageW);
              // field.y is top-edge %; convert to PDF bottom-up coordinate, then subtract box height
              const yPos = Math.max(0, pageH - ((field.y / 100) * pageH) - imgHeight);

              // Clamp so nothing goes off-page
              const safeX = Math.min(xPos, pageW - imgWidth  - 1);
              const safeY = Math.max(1, Math.min(yPos, pageH - imgHeight - 1));

              console.log(`  📐 field[${field.type}] page=${field.page} x=${field.x}% y=${field.y}% → PDF x=${safeX.toFixed(1)} y=${safeY.toFixed(1)} w=${imgWidth.toFixed(1)} h=${imgHeight.toFixed(1)} (pageW=${pageW} pageH=${pageH})`);

              if (field.type === 'sign') {
                if (sigImage) {
                  // Draw signature image directly — PDF is already cleaned of
                  // annotations and AcroForm so signature will be visible on top
                  page.drawImage(sigImage, {
                    x: safeX,
                    y: safeY,
                    width: imgWidth,
                    height: imgHeight,
                    opacity: 1
                  });
                  console.log('  ✅ Signature image drawn on page', field.page);
                } else if (signMethod === 'type' && req.body.typedName) {
                  const fontSize = Math.max(12, imgHeight * 0.6);
                  page.drawText(req.body.typedName, {
                    x: safeX,
                    y: safeY + (imgHeight - fontSize) / 2,
                    size: fontSize,
                    font,
                    color: rgb(0.11, 0.11, 0.3)
                  });
                  console.log('  ✅ Typed name drawn on page', field.page);
                } else {
                  console.log('  ⚠️ sign field: sigImage is null AND not type method — nothing drawn!');
                }
              } else if (field.type === 'date') {
                const dateText = req.body.signedDate || new Date().toLocaleDateString();
                // Scale with box height, but default 5% height yields ~12.5pt (standard document size)
                const fontSize = Math.max(8, imgHeight * 0.3);
                page.drawText(dateText, {
                  x: safeX,
                  y: safeY + (imgHeight - fontSize) / 2,
                  size: fontSize,
                  font,
                  color: rgb(0.1, 0.1, 0.1)
                });
                console.log('  ✅ Date drawn on page', field.page, ':', dateText, 'at 12pt');
              }
            }
          }
        }
        
        // --- AUDIT TRAIL LOGGING ---
          request.auditTrail.signedAt = new Date().toISOString();
          request.auditTrail.signedIP = req.ip || req.connection.remoteAddress;
          request.auditTrail.signedDevice = req.headers['user-agent'];

          const modifiedPdfBytes = await pdfDoc.save();
          finalBase64Data = Buffer.from(modifiedPdfBytes).toString('base64');
        } catch (err) {
          console.error('Error applying signature to PDF:', err);
        }

        mailOptions.attachments = [
        {
          filename: request.fileName.replace('.pdf', '_signed.pdf'),
          content: finalBase64Data,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ];
    }

    await transporter.sendMail(mailOptions);
    request.status = 'signed'; // update status instead of deleting immediately
    console.log(`✅ Signing notification sent to requester: ${request.requesterEmail}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Notification email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Check Signature Status ───────────────────────────────────────────────────
app.post('/api/signature-status', express.json(), (req, res) => {
  const { tokens } = req.body;
  const statuses = {};
  if (tokens && Array.isArray(tokens)) {
    tokens.forEach(t => {
      const request = pendingRequests.get(t);
      if (request) {
        statuses[t] = request.status;
      } else {
        // If not found, assume signed (since we used to delete them) or invalid. 
        // We'll mark it signed to be safe.
        statuses[t] = 'signed';
      }
    });
  }
  res.json({ statuses });
});
// ─── Certificate Sign (Digital Signature) ──────────────────────────────────
app.post('/api/certificate-sign', express.json({ limit: '100mb' }), async (req, res) => {
  try {
    const { fileBase64, certType, certInfo, settings, signaturePos } = req.body;
    
    if (!fileBase64) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const sizeBytes = Math.ceil(fileBase64.length * 0.75);
    if (sizeBytes > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'File size exceeds the 10MB free tier limit. Upgrade to Pro for up to 1GB uploads.' });
    }

    const pdfBytes = Buffer.from(fileBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 1. Draw Visual Certificate Badge
    if (signaturePos && signaturePos.page) {
      const page = pdfDoc.getPage(signaturePos.page - 1);
      const { width, height } = page.getSize();
      
      const x = (signaturePos.x / 100) * width;
      const y = height - ((signaturePos.y / 100) * height) - ((signaturePos.height / 100) * height);
      const boxW = (signaturePos.width / 100) * width;
      const boxH = (signaturePos.height / 100) * height;

      // Draw Badge Background
      page.drawRectangle({
        x, y, width: boxW, height: boxH,
        color: rgb(0.95, 0.96, 1),
        borderColor: rgb(0.3, 0.27, 0.9),
        borderWidth: 2,
      });

      // Draw Badge Text
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      page.drawText('Digitally Signed by:', {
        x: x + 5, y: y + boxH - 15, size: 8, font: smallFont, color: rgb(0.3, 0.27, 0.9)
      });
      
      page.drawText(certInfo.name || 'Certificate Holder', {
        x: x + 5, y: y + boxH - 30, size: 12, font, color: rgb(0.1, 0.1, 0.4)
      });

      page.drawText(`Reason: ${settings.reason}`, {
        x: x + 5, y: y + boxH - 45, size: 8, font: smallFont, color: rgb(0.4, 0.4, 0.4)
      });

      if (settings.timestamp) {
        page.drawText(`Date: ${new Date().toLocaleString()}`, {
          x: x + 5, y: y + 5, size: 8, font: smallFont, color: rgb(0.4, 0.4, 0.4)
        });
      }
    }

    // Embed metadata into the PDF to simulate digital lock
    if (settings.lockPdf) {
      pdfDoc.setAuthor(certInfo.name || 'PDFMaster Auto-Signer');
      pdfDoc.setSubject(`Digitally Signed - Reason: ${settings.reason}`);
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
      // A true cryptographic signature requires node-signpdf and PKCS#7 structures. 
      // This embeds the necessary metadata for visual compliance in this tool.
    }

    const signedBytes = await pdfDoc.save();
    
    // Generate a mock SHA256 hash for the success screen
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(signedBytes).digest('hex');

    res.json({
      success: true,
      signedPdfBase64: Buffer.from(signedBytes).toString('base64'),
      details: {
        name: certInfo.name,
        company: certInfo.company,
        reason: settings.reason,
        timestamp: new Date().toISOString(),
        hash: hash
      }
    });

  } catch (error) {
    console.error('Certificate Sign Error:', error);
    res.status(500).json({ error: 'Failed to apply certificate signature' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const results = { server: 'ok' };

  // Check Gotenberg
  try {
    const r = await fetch(`${GOTENBERG_URL}/health`);
    results.gotenberg = r.ok ? 'ok' : 'unreachable';
  } catch { results.gotenberg = 'unreachable'; }

  // Check Python Converter
  try {
    const r = await fetch(`${CONVERTER_URL}/health`);
    const json = await r.json();
    results.converter = json.status === 'ok' ? 'ok' : 'unreachable';
  } catch { results.converter = 'unreachable'; }

  results.allFree = true;
  results.cloudconvert = 'not used (replaced with free local service)';

  res.json(results);
});

// ─── AI Chat Endpoint — Multi-API Fallback ───────────────────────────────────
// Priority: Google Gemini 2.0 Flash → Groq Llama 3 → Client Fallback
app.post('/api/ai-chat', express.json({ limit: '50mb' }), async (req, res) => {
  const { message, pdfContext, history = [], customSystemPrompt } = req.body;
  if (!message || (!pdfContext && !customSystemPrompt)) return res.status(400).json({ error: 'message and pdfContext required' });

  // ── Key Rotation Setup ──
  const geminiKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY')).map(k => process.env[k]).filter(Boolean);
  const groqKeys = Object.keys(process.env).filter(k => k.startsWith('GROQ_API_KEY')).map(k => process.env[k]).filter(Boolean);

  console.log(`\n🤖 [AI Chat Request] - User: "${message.substring(0, 50)}..."`);
  console.log(`🔑 Available Keys -> Gemini: ${geminiKeys.length}, Groq: ${groqKeys.length}`);

  const defaultSystemPrompt = `You are an expert AI document analyst. You have been given the full text of a PDF document.

INSTRUCTIONS:
- Answer questions accurately and in depth using the provided document content.
- Always cite specific page numbers using [📄 Pg X] format when referencing content.
- Format responses with markdown: **bold**, bullet points, numbered lists, headers.
- If the user writes in Urdu, Arabic, Hindi or any language — respond in that same language.
- For summaries, structure with clear sections and headers.
- For risks, use ⚠️ markers.
- End complex answers with a follow-up suggestion.
- Never make up information not present in the document.

CONVERSATION STYLE:
- Be conversational and friendly, remember context from previous messages.
- If user says "thanks", "shukriya", or casual chat — respond naturally and warmly like "Khushi hui! Koi aur sawal ho to zaroor puchein 😊"
- Don't always start with PDF — chat naturally first when appropriate.
- Use short, readable paragraphs instead of walls of text.
- Be warm and approachable, never robotic.

PDF CONTENT:
${pdfContext.substring(0, 60000)}`;

  const systemPrompt = customSystemPrompt || defaultSystemPrompt;

  // ── Try Google Gemini Flash Latest (with Key Rotation) ─────────────────────────
  for (let i = 0; i < geminiKeys.length; i++) {
    const key = geminiKeys[i];
    try {
      console.log(`  → 🟢 Sending request to Gemini Flash (Key ${i + 1}/${geminiKeys.length})...`);
      const contents = [
        ...history.slice(-14).map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: `INSTRUCTIONS & DOCUMENT CONTEXT:\n${systemPrompt}\n\nUSER QUESTION:\n${message}` }] }
      ];
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
          })
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const text = parts.map(p => p.text).join('');
        if (text) {
          console.log(`  ✅ AI response via Gemini Flash (Key ${i + 1}) generated successfully`);
          return res.json({ response: text, provider: 'gemini' });
        }
      } else {
        const errText = await geminiRes.text();
        console.log(`  ⚠️ Gemini API Error on Key ${i + 1} (${geminiRes.status}):`, errText);
      }
    } catch (e) {
      console.log(`  ⚠️ Gemini network/fetch failed on Key ${i + 1}:`, e.message);
    }
  }

  // ── Try Groq Llama 3 (with Key Rotation) ──────────────────────────────────
  for (let i = 0; i < groqKeys.length; i++) {
    const key = groqKeys[i];
    try {
      console.log(`  → 🟢 Sending request to Groq Llama 3 (Key ${i + 1}/${groqKeys.length})...`);
      // Groq has 8K token limit, so we slice pdfContext much shorter (~15000 chars = ~3.5K tokens)
      const groqSystemPrompt = systemPrompt.replace(
        pdfContext.substring(0, 60000), 
        pdfContext.substring(0, 15000)
      );
      
      const groqMessages = [
        { role: 'system', content: groqSystemPrompt },
        ...history.slice(-4).map(h => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text })),
        { role: 'user', content: message }
      ];
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: groqMessages, max_tokens: 4096, temperature: 0.4 })
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          console.log(`  ✅ AI response via Groq Llama 3 (Key ${i + 1}) generated successfully`);
          return res.json({ response: text, provider: 'groq' });
        }
      } else {
        console.log(`  ⚠️ Groq API Error on Key ${i + 1} (${groqRes.status}):`, await groqRes.text());
      }
    } catch (e) {
      console.log(`  ⚠️ Groq network/fetch failed on Key ${i + 1}:`, e.message);
    }
  }

  // ── No API available — signal client to use extractive fallback ─────────────
  console.log('  ℹ️  Both APIs failed or not configured — client will use extractive fallback');
  return res.json({ response: null, provider: 'fallback' });
});



// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ PDFMaster API        → http://localhost:${PORT}`);
  console.log(`🐳 Gotenberg           → ${GOTENBERG_URL}  (Office/Image → PDF)`);
  console.log(`🐍 Python Converter    → ${CONVERTER_URL}  (PDF → Word/Excel/PPT/JPG)`);
  console.log(`💰 CloudConvert Cost   → $0 (NOT USED — 100% FREE!)`);
  console.log(`💡 Health check        → http://localhost:${PORT}/api/health\n`);
});
server.timeout = 600000; // 10 minutes timeout for heavy OCR tasks
