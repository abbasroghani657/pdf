# TheyLovePDF

The most powerful PDF toolkit. Free, fast, and secure. Trusted by 2.4M+ professionals worldwide.

## Features
- Over 37+ PDF tools.
- AI-powered Chat PDF, OCR, Plagiarism Check.
- Document merging, splitting, compression.
- Secure Electronic Signatures.
- ...and much more!

## Setup

1. Install Frontend Dependencies
```bash
npm install
```

2. Install Backend Dependencies
```bash
cd server
npm install
```

3. Setup Environment Variables
```bash
cp server/.env.example server/.env
```
Add your API keys in `server/.env`.

4. Start All Services
```bash
npm run start:all
```

## Services needed
- **Gotenberg (Docker)**: For converting Office files to PDF.
- **Python Converter Service**: For OCR, advanced compression, plagiarism check, and PDF to Office conversion.
- **Node.js Backend**: Express API server.
- **Vite Frontend**: React application.

## Free APIs used
- **Google Gemini**: Document Analysis, Plagiarism detection.
- **Groq Llama**: Fallback for AI chat processing.
