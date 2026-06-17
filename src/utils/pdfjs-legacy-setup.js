/**
 * Shared pdfjs-dist LEGACY build setup utility.
 * Import this for components that use pdfjs-dist/legacy (full feature set with polyfills).
 *
 * Sets up the worker using a CDN URL built from the INSTALLED version
 * so the main library and worker always match exactly.
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Use CDN worker URL built from installed version — guaranteed to match
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

export { pdfjsLib };
export default pdfjsLib;
