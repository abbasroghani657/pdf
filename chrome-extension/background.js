// background.js (Manifest V3 Service Worker)

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-theylovepdf",
    title: "Edit PDF with TheyLovePDF",
    contexts: ["link"], // Only show when right-clicking a link
    targetUrlPatterns: ["*://*/*.pdf"] // Only show for PDF links
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-theylovepdf") {
    // Open the PDF URL in TheyLovePDF app
    const pdfUrl = encodeURIComponent(info.linkUrl);
    const targetUrl = \`https://www.theylovepdf.com/tools?url=\${pdfUrl}\`;
    
    chrome.tabs.create({ url: targetUrl });
  }
});

// Setup offscreen document management for heavy processing if needed
let creating; // A global promise to avoid race conditions
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'Process PDF using pdf-lib which requires DOM elements in some cases'
    });
    await creating;
    creating = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processPDF') {
    setupOffscreenDocument('offscreen.html').then(() => {
      // Forward to offscreen
      chrome.runtime.sendMessage(message, response => {
        sendResponse(response);
      });
    });
    return true; // Keep message channel open for async response
  }
});
