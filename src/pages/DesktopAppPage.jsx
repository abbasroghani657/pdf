import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function DesktopAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      // Fallback if PWA prompt not available
      alert("To install, click the browser menu and select 'Install TheyLovePDF' or 'Add to Home Screen'.");
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TheyLovePDF Desktop App",
    "operatingSystem": "Windows, macOS",
    "applicationCategory": "UtilitiesApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Download the free TheyLovePDF desktop application for Windows and Mac. Edit, convert, compress, and sign PDFs offline."
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <Helmet>
        <title>Download TheyLovePDF for Windows & Mac</title>
        <meta name="description" content="Download the free TheyLovePDF desktop application for Windows and Mac. Edit, convert, compress, and sign PDFs offline." />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto text-center mt-10">
        <div className="w-20 h-20 bg-[#378ADD] rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-8">
          <iconify-icon icon="solar:document-bold" class="text-white text-4xl"></iconify-icon>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">TheyLovePDF for Desktop</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate PDF toolkit right on your computer. Work faster, securely, and seamlessly with our Windows and Mac application.
        </p>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 max-w-2xl mx-auto">
          {isInstalled ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <iconify-icon icon="solar:check-circle-bold" class="text-3xl"></iconify-icon>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Successfully Installed!</h3>
              <p className="text-gray-600 mb-6">You can now open TheyLovePDF directly from your computer's app menu.</p>
              <Link to="/tools" className="px-8 py-3 bg-[#378ADD] text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all inline-block">
                Go to PDF Tools
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex justify-center gap-6 mb-8 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <iconify-icon icon="logos:microsoft-windows" class="text-4xl"></iconify-icon>
                  <span className="text-sm font-semibold text-gray-600">Windows 10/11</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <iconify-icon icon="logos:apple" class="text-4xl"></iconify-icon>
                  <span className="text-sm font-semibold text-gray-600">macOS</span>
                </div>
              </div>
              <button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-10 py-4 bg-[#378ADD] text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <iconify-icon icon="solar:download-square-bold" class="text-2xl"></iconify-icon>
                Download for Free
              </button>
              <p className="text-xs text-gray-400 mt-4">Lightweight app • No credit card required • Secure</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:bolt-bold-duotone" class="text-4xl text-[#378ADD] mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm">Process documents directly using local device capabilities for maximum speed.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:shield-check-bold-duotone" class="text-4xl text-emerald-500 mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Maximum Privacy</h3>
            <p className="text-gray-600 text-sm">Offline processing means your sensitive files never leave your computer.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:layers-minimalistic-bold-duotone" class="text-4xl text-purple-500 mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">All 30+ Tools</h3>
            <p className="text-gray-600 text-sm">Access the complete suite of PDF editing, conversion, and merging tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
