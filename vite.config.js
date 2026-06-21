import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // ELECTRON FIX: Use relative paths only when building for Electron packaging.
  // Website always uses '/' (absolute), Electron uses './' (relative for file:// protocol).
  base: process.env.ELECTRON_BUILD === 'true' ? './' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'TheyLovePDF - Advanced PDF Editor',
        short_name: 'TheyLovePDF',
        description: 'The worlds most powerful PDF toolkit. Free, fast, and secure.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // PDF processing libraries (heaviest)
          'vendor-pdf': ['pdf-lib', '@pdf-lib/fontkit', 'jspdf'],
          // Animations & UI
          'vendor-ui': ['framer-motion', 'lucide-react', '@heroicons/react'],
          // Data & utilities
          'vendor-data': ['axios', 'jszip', 'file-saver', 'xlsx', 'dompurify'],
          // Supabase & Stripe (auth & payments)
          'vendor-services': ['@supabase/supabase-js', '@stripe/stripe-js'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Charts
          'vendor-charts': ['recharts'],
          // Markdown
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
        }
      }
    }
  },
  server: {
    port: 3000,
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3005',
        changeOrigin: true,
      }
    }
  }
})