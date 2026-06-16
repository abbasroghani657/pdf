import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './components/ToastProvider.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './i18n.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Trigger prerender event for @prerenderer/rollup-plugin
setTimeout(() => {
  document.dispatchEvent(new Event('custom-render-trigger'));
}, 1000);