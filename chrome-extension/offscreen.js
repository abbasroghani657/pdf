// offscreen.js

// This runs in the offscreen document environment.
// It receives messages from background.js to process PDFs.

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message, sender, sendResponse) {
  if (message.action !== 'processPDF') return;

  try {
    // In a full implementation, we would load pdf-lib here
    // import { PDFDocument } from 'pdf-lib';
    
    // Simulate heavy PDF processing
    // const pdfDoc = await PDFDocument.load(message.pdfBytes);
    // ... do heavy manipulation here ...
    // const pdfBytes = await pdfDoc.save();

    console.log("Processing PDF offscreen to avoid service worker termination...");
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    sendResponse({ success: true, message: 'PDF Processed Successfully offscreen' });
  } catch (error) {
    console.error("Offscreen processing error:", error);
    sendResponse({ success: false, error: error.message });
  }
}
