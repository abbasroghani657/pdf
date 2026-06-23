import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  publicDir: '../public',
  plugins: [react()],
  base: './', // CRITICAL for Electron: uses relative paths for assets
  build: {
    outDir: '../electron/dist', // Builds directly into the electron directory
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
