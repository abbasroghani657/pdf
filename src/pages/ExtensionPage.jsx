import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ExtensionPage() {
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
      // Fallback
      alert("To install, click the browser menu (⋮) and select 'Install TheyLovePDF' or 'Add to Home Screen'.");
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TheyLovePDF Browser Extension",
    "operatingSystem": "Chrome, Edge, Brave",
    "applicationCategory": "BrowserExtension",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Install the TheyLovePDF browser extension. Edit, merge, compress and convert PDF files directly from your browser toolbar."
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <Helmet>
        <title>TheyLovePDF Chrome & Edge Extension</title>
        <meta name="description" content="Install the TheyLovePDF browser extension. Edit, merge, compress and convert PDF files directly from your browser toolbar." />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto text-center mt-10">
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[#378ADD] rounded-2xl flex items-center justify-center shadow-lg">
            <iconify-icon icon="solar:document-bold" class="text-white text-3xl"></iconify-icon>
          </div>
          <iconify-icon icon="solar:link-round-bold" class="text-gray-300 text-2xl"></iconify-icon>
          <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-lg">
            <iconify-icon icon="logos:chrome" class="text-3xl"></iconify-icon>
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">TheyLovePDF Browser Extension</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Access all your favorite PDF tools instantly from your browser toolbar. No more searching, just 1-click PDF magic.
        </p>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 max-w-2xl mx-auto relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#378ADD]/5 rounded-bl-[100px] pointer-events-none"></div>

          {isInstalled ? (
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <iconify-icon icon="solar:check-circle-bold" class="text-3xl"></iconify-icon>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Extension Installed!</h3>
              <p className="text-gray-600 mb-6">TheyLovePDF is now added to your browser shortcuts.</p>
              <Link to="/tools" className="px-8 py-3 bg-[#378ADD] text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all inline-block">
                Open Tools
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center relative z-10">
              <div className="flex justify-center gap-6 mb-8 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <iconify-icon icon="logos:chrome" class="text-4xl grayscale hover:grayscale-0 transition-all"></iconify-icon>
                  <span className="text-xs font-semibold text-gray-600">Chrome</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <iconify-icon icon="logos:microsoft-edge" class="text-4xl grayscale hover:grayscale-0 transition-all"></iconify-icon>
                  <span className="text-xs font-semibold text-gray-600">Edge</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <iconify-icon icon="logos:brave" class="text-4xl grayscale hover:grayscale-0 transition-all"></iconify-icon>
                  <span className="text-xs font-semibold text-gray-600">Brave</span>
                </div>
              </div>
              
              <button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-10 py-4 bg-[#378ADD] text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <iconify-icon icon="logos:chrome" class="text-xl"></iconify-icon>
                Add to Chrome
              </button>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <div className="flex text-yellow-400">
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                </div>
                <span>4.9/5 (10k+ users)</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:mouse-circle-bold-duotone" class="text-4xl text-[#378ADD] shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">1-Click Access</h3>
              <p className="text-gray-500 text-sm">Open the PDF toolkit instantly from your browser's toolbar.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:shield-check-bold-duotone" class="text-4xl text-emerald-500 shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Secure Extension</h3>
              <p className="text-gray-500 text-sm">We don't track your browsing history. 100% privacy focused.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:flash-bold-duotone" class="text-4xl text-purple-500 shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Zero Bloat</h3>
              <p className="text-gray-500 text-sm">Extremely lightweight progressive web app integration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
