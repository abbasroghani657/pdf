/**
 * Shared pdfjs-dist setup utility.
 * Import this ONCE at the top of any component that uses pdfjs.
 * 
 * Uses the Vite ?url import to get the correct hashed worker URL in production.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch (e) {
  // CDN fallback matching the installed pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export { pdfjsLib };
export default pdfjsLib;
