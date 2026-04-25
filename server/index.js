const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const CloudConvert = require('cloudconvert');
const fs = require('fs');

const app = express();
app.use(cors());

// Initialize CloudConvert with the API Key
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'dummy_key');

// Configure multer for disk storage so we can stream files to CloudConvert
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } 
});

app.post('/api/process', upload.single('file'), async (req, res) => {
  try {
    const { tool } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!tool) {
      return res.status(400).json({ error: 'Tool type not specified' });
    }

    console.log(`Processing [${tool}] - File: ${file.originalname}`);

    let processedBuffer;
    let newFilename = `processed_${file.originalname}`;
    let contentType = 'application/pdf';

    switch (tool) {
      // ─── NATIVE PDF TOOLS (using pdf-lib) ───
      case 'Merge PDF':
      case 'Split PDF':
      case 'Rotate PDF':
      case 'Delete pages':
      case 'Protect PDF':
      case 'Edit PDF':
        // Prove the backend worked by stamping the PDF
        if (!file.mimetype.includes('pdf')) {
            throw new Error('This tool requires a PDF file.');
        }
        
        // Read from disk instead of memory buffer
        const fileBuffer = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        
        if (pages.length > 0) {
            const firstPage = pages[0];
            firstPage.drawText(`Processed by PDFMaster API - ${tool}`, {
              x: 10,
              y: 10,
              size: 12,
            });
        }

        const pdfBytes = await pdfDoc.save();
        processedBuffer = Buffer.from(pdfBytes);
        newFilename = file.originalname.replace(/\.pdf$/i, `_${tool.replace(/\s+/g, '_')}.pdf`);
        break;

      // ─── CONVERSION TOOLS (Using CloudConvert) ───
      case 'Word to PDF':
      case 'Excel to PDF':
      case 'PowerPoint to PDF':
      case 'JPG to PDF':
      case 'HTML to PDF':
      case 'PDF to Word':
      case 'PDF to Excel':
      case 'PDF to PowerPoint':
      case 'PDF to JPG':
        if (!process.env.CLOUDCONVERT_API_KEY || process.env.CLOUDCONVERT_API_KEY === 'your_api_key_here') {
           throw new Error("Missing CloudConvert API Key. Please add it to your server/.env file.");
        }

        // Determine target format
        let targetFormat = 'pdf';
        if (tool === 'PDF to Word') targetFormat = 'docx';
        if (tool === 'PDF to Excel') targetFormat = 'xlsx';
        if (tool === 'PDF to PowerPoint') targetFormat = 'pptx';
        if (tool === 'PDF to JPG') targetFormat = 'jpg';

        // Step 1: Create a Job
        let job = await cloudConvert.jobs.create({
            tasks: {
                'import-my-file': {
                    operation: 'import/upload'
                },
                'convert-my-file': {
                    operation: 'convert',
                    input: 'import-my-file',
                    output_format: targetFormat
                },
                'export-my-file': {
                    operation: 'export/url',
                    input: 'convert-my-file'
                }
            }
        });

        // Step 2: Upload the file
        const uploadTask = job.tasks.filter(task => task.name === 'import-my-file')[0];
        await cloudConvert.tasks.upload(uploadTask, fs.createReadStream(file.path), file.originalname);

        // Step 3: Wait for job completion
        job = await cloudConvert.jobs.wait(job.id);
        
        // Check if the job actually failed on CloudConvert's side
        if (job.status === 'error') {
            const failedTask = job.tasks.find(t => t.status === 'error');
            const cloudConvertError = failedTask?.message || failedTask?.code || 'Unknown CloudConvert Error';
            throw new Error(`CloudConvert Error: ${cloudConvertError}`);
        }
        
        const exportTask = job.tasks.find(task => task.name === 'export-my-file');
        if (!exportTask || !exportTask.result || !exportTask.result.files) {
            throw new Error("CloudConvert did not return a valid download URL.");
        }
        
        // Step 4: Download the result and send it to the client
        const fileUrl = exportTask.result.files[0].url;
        const fetchResponse = await fetch(fileUrl);
        const arrayBuffer = await fetchResponse.arrayBuffer();
        processedBuffer = Buffer.from(arrayBuffer);
        
        const baseName = file.originalname.replace(/\.[^/.]+$/, "");
        newFilename = `${baseName}_converted.${targetFormat}`;
        
        // Set the correct MIME type based on output format
        if (targetFormat === 'xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (targetFormat === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (targetFormat === 'pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (targetFormat === 'jpg') contentType = 'image/jpeg';
        else contentType = 'application/pdf';
        
        break;

      default:
        // Pass through for unsupported tools
        processedBuffer = file.buffer;
        newFilename = file.originalname;
        contentType = file.mimetype || 'application/octet-stream';
        break;
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${newFilename}"`,
    });
    
    // Cleanup uploaded file from disk
    if (file && file.path) {
       fs.unlink(file.path, (err) => {
         if (err) console.error("Error deleting temp file:", err);
       });
    }

    res.send(processedBuffer);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Global error handler for multer and express errors
app.use((err, req, res, next) => {
  console.error('Express Global Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PDFMaster API Engine running on http://localhost:${PORT}`);
});
