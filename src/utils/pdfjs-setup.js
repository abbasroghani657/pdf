/**
 * Shared pdfjs-dist setup utility.
 * Import this ONCE at the top of any component that uses pdfjs.
 *
 * Sets up the worker using a CDN URL built from the INSTALLED version
 * so the main library and worker always match exactly.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker URL built from installed version — guaranteed to match
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export { pdfjsLib };
export default pdfjsLib;
