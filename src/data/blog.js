export const BLOG_POSTS = [
  {
    slug: "how-to-compress-pdf-mac-2026",
    title: "How to Compress a PDF on Mac (2026 Guide)",
    date: "2026-06-20",
    excerpt: "Learn the fastest and easiest ways to reduce your PDF file size on a Mac without losing quality. We compare Preview, Automator, and Web tools.",
    content: `
      <p>Dealing with large PDF files on your Mac can be frustrating, especially when you need to email a document and it exceeds the standard 25MB attachment size limit. Whether you're a student submitting an assignment or a professional sending a portfolio, knowing how to properly compress a PDF is an essential skill.</p>
      
      <h2>Method 1: The Built-in Preview App (Free but Basic)</h2>
      <p>Apple's Preview app comes with a built-in "Quartz Filter" that can shrink your PDFs. It's fast and requires no internet connection.</p>
      <ol>
        <li>Open your PDF using the <strong>Preview</strong> app.</li>
        <li>Click on <strong>File</strong> in the top menu bar, then select <strong>Export</strong> (Don't select "Export as PDF").</li>
        <li>In the export window, look for the <strong>Quartz Filter</strong> dropdown menu.</li>
        <li>Select <strong>Reduce File Size</strong> and click Save.</li>
      </ol>
      <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
        <p class="text-red-700 m-0"><strong>Warning:</strong> While this method is free, Apple's default compression algorithm is incredibly aggressive. It often ruins the quality of images and makes vector text blurry. We do not recommend this for professional documents.</p>
      </div>

      <h2>Method 2: Using TheyLovePDF (Professional & High Quality)</h2>
      <p>If you want to maintain the crisp quality of your text and images while significantly reducing the file size, using a dedicated AI-powered compression tool is the best option.</p>
      <ol>
        <li>Go to the <a href="/tools/compress-pdf" class="text-blue-600 hover:underline">Compress PDF tool on TheyLovePDF</a>.</li>
        <li>Drag and drop your PDF file onto the page.</li>
        <li>Select your compression level:
          <ul>
            <li><strong>Extreme Compression:</strong> Best for emailing (lowest quality).</li>
            <li><strong>Recommended Compression:</strong> The sweet spot between size and quality.</li>
            <li><strong>Less Compression:</strong> High quality, perfect for printing.</li>
          </ul>
        </li>
        <li>Click <strong>Compress PDF</strong> and download your optimized file.</li>
      </ol>
      <p>Our intelligent compression algorithms strip out unnecessary metadata and compress images using modern web standards, ensuring your document looks exactly the same while taking up a fraction of the storage space!</p>

      <h2>Conclusion</h2>
      <p>While Mac's built-in tools are great in an offline pinch, they severely lack the granular control required for modern documents. For anything important, always rely on a dedicated compression engine.</p>
    `
  },
  {
    slug: "merge-pdf-files-iphone",
    title: "How to Merge Multiple PDF Files on Your iPhone",
    date: "2026-06-19",
    excerpt: "Discover the simplest way to combine several PDF documents into one single file directly from your iOS device.",
    content: `
      <p>With iPhones becoming our primary devices for work and study, knowing how to merge PDF files on the go is an essential skill. Whether you are compiling receipts for an expense report or merging lecture notes, here is exactly how you can do it without a computer.</p>
      
      <h2>The Challenge with iOS</h2>
      <p>While iOS has a robust built-in Files app, it doesn't offer a native, straightforward way to select multiple PDFs and stitch them together seamlessly. You can scan documents into a single PDF, but merging existing files is surprisingly difficult.</p>
      
      <h2>The Solution: TheyLovePDF Web App</h2>
      <p>You don't need to download any heavy, subscription-based apps from the App Store. You can do this directly from Safari or Chrome using our cloud architecture.</p>
      
      <div class="bg-gray-50 border border-gray-200 p-6 rounded-xl my-8">
        <h3 class="text-lg font-bold text-gray-900 mt-0 mb-4">Step-by-Step Guide</h3>
        <ol class="space-y-3 mb-0">
          <li>Open Safari on your iPhone and navigate to the <a href="/tools/merge-pdf" class="text-blue-600 hover:underline">TheyLovePDF Merge Tool</a>.</li>
          <li>Tap the massive <strong>Select PDF files</strong> button.</li>
          <li>Choose the files from your iPhone's <em>Files</em> app or your <em>Photo Library</em>. You can select multiple files at once.</li>
          <li>Once uploaded, you will see a visual grid of your files. Press and hold any file to drag and reorder them exactly how you want.</li>
          <li>Tap <strong>Merge PDF</strong>. Our servers will process the files in milliseconds.</li>
          <li>Tap <strong>Download</strong> and save the new, combined document straight to your device.</li>
        </ol>
      </div>

      <h2>Why Not Use an App?</h2>
      <p>Most PDF apps on the App Store are "freemium"—they let you download the app for free, but put a paywall in front of the merge feature. By using a cloud tool, you bypass App Store fees and save valuable storage space on your device.</p>
      <p>It's that simple, fast, and entirely secure!</p>
    `
  },
  {
    slug: "password-protect-pdf-guide",
    title: "How to Secure Your PDF with a Password",
    date: "2026-06-18",
    excerpt: "Protect sensitive information by adding a secure, unbreakable 256-bit AES encryption password to your PDF files.",
    content: `
      <p>In today's digital age, data privacy is more critical than ever. Whether you're sending financial statements, medical records, or a confidential business contract, leaving a PDF unprotected is a massive security risk.</p>
      <p>In this guide, we'll show you how to lock down your PDF documents using military-grade encryption.</p>

      <h2>What is 256-bit AES Encryption?</h2>
      <p>Advanced Encryption Standard (AES) is the encryption algorithm used by the U.S. government to secure classified information. A 256-bit encryption key means there are 2^256 possible combinations—a number so massive that not even the world's most powerful supercomputers could crack it in a billion years.</p>
      <p>When you use our tool, we don't just "add a password" that can be easily bypassed. We mathematically scramble the contents of your file using AES-256.</p>

      <h2>How to Protect Your PDF</h2>
      <div class="flex flex-col md:flex-row gap-6 my-8 items-start">
        <div class="flex-1">
          <ol>
            <li>Navigate to the <a href="/tools/protect-pdf" class="text-blue-600 hover:underline">Protect PDF</a> tool.</li>
            <li>Upload your sensitive document over our secure TLS 1.3 connection.</li>
            <li>Enter a strong password. (We recommend at least 12 characters, mixing letters, numbers, and symbols).</li>
            <li>Click <strong>Protect PDF</strong>.</li>
            <li>Download your newly encrypted file.</li>
          </ol>
        </div>
      </div>

      <h2>Best Practices for Password Security</h2>
      <ul>
        <li><strong>Never send the password in the same email:</strong> If you're emailing the PDF, send the password via a different channel (like SMS or a secure messaging app like Signal).</li>
        <li><strong>Use a password manager:</strong> Generate a random string of characters rather than using a word that can be found in a dictionary.</li>
        <li><strong>Don't use personal info:</strong> Avoid birth dates, pet names, or company names.</li>
      </ul>

      <p>Once your file is encrypted, the original contents are permanently deleted from our servers within 2 hours. Your privacy is our absolute priority.</p>
    `
  },
  {
    slug: "ocr-technology-explained",
    title: "What is OCR? How to Make Scanned PDFs Searchable",
    date: "2026-06-17",
    excerpt: "Learn how Optical Character Recognition (OCR) technology works and how it can extract selectable text from flat images.",
    content: `
      <p>Have you ever received a PDF that looks like a document, but when you try to highlight the text, nothing happens? You've encountered a "flat" or "scanned" PDF. It's essentially just a digital photograph of a piece of paper.</p>
      <p>To interact with that text, you need the magic of <strong>Optical Character Recognition (OCR)</strong>.</p>

      <h2>How OCR Works</h2>
      <p>When you run a file through an OCR engine, the software acts like a highly trained human eye. It scans the image pixel by pixel, looking for patterns that resemble letters and numbers.</p>
      <p>Modern OCR doesn't just match shapes; it uses complex Artificial Intelligence and Machine Learning models to understand context. For example, it can tell the difference between a capital 'I' and a lowercase 'l' based on the surrounding letters in the word.</p>

      <h2>The Benefits of OCR</h2>
      <ul>
        <li><strong>Searchability:</strong> Finding a specific clause in a 500-page scanned contract is impossible without reading the whole thing. OCR lets you use CTRL+F to find exactly what you need instantly.</li>
        <li><strong>Editability:</strong> Once the text is recognized, you can copy, paste, and edit it in Word or Google Docs.</li>
        <li><strong>Accessibility:</strong> Screen readers for visually impaired users cannot read flat images. OCR makes your documents accessible to everyone.</li>
      </ul>

      <h2>How to OCR a Document</h2>
      <p>Transforming your scanned documents is incredibly simple with TheyLovePDF:</p>
      <ol>
        <li>Go to the <a href="/tools/ocr-pdf" class="text-blue-600 hover:underline">OCR PDF tool</a>.</li>
        <li>Upload your scanned document.</li>
        <li>Select the language of the document. This is crucial—telling the AI what language to expect drastically improves accuracy, especially for languages with unique characters or accents.</li>
        <li>Hit process. The AI will reconstruct your document, layering an invisible text layer over the original images.</li>
      </ol>
      
      <p>Stop re-typing documents manually. Let AI do the heavy lifting for you!</p>
    `
  }
];
