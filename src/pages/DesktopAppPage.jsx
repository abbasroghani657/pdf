import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function DesktopAppPage({ lang = 'en' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';

  const t = {
    title: isEs ? 'TheyLovePDF para Escritorio' : isFr ? 'TheyLovePDF pour Bureau' : isDe ? 'TheyLovePDF für den Desktop' : isPt ? 'TheyLovePDF para Desktop' : 'TheyLovePDF for Desktop',
    desc: isEs ? 'El kit de herramientas PDF definitivo en tu computadora. Trabaja más rápido, de forma segura y sin problemas.' : isFr ? 'La boîte à outils PDF ultime sur votre ordinateur. Travaillez plus vite, en toute sécurité.' : isDe ? 'Das ultimative PDF-Toolkit direkt auf Ihrem Computer. Arbeiten Sie schneller und sicher.' : isPt ? 'O kit de ferramentas PDF definitivo no seu computador. Trabalhe mais rápido e com segurança.' : 'The ultimate PDF toolkit right on your computer. Work faster, securely, and seamlessly with our Windows and Mac application.',
    installedTitle: isEs ? '¡Instalado con éxito!' : isFr ? 'Installé avec succès !' : isDe ? 'Erfolgreich installiert!' : isPt ? 'Instalado com sucesso!' : 'Successfully Installed!',
    installedDesc: isEs ? 'Ahora puedes abrir TheyLovePDF directamente desde tu menú de aplicaciones.' : isFr ? 'Vous pouvez maintenant ouvrir TheyLovePDF depuis votre menu d\'applications.' : isDe ? 'Sie können TheyLovePDF nun direkt über Ihr App-Menü öffnen.' : isPt ? 'Você já pode abrir o TheyLovePDF no menu de aplicativos.' : 'You can now open TheyLovePDF directly from your computer\'s app menu.',
    goTools: isEs ? 'Ir a Herramientas PDF' : isFr ? 'Aller aux Outils PDF' : isDe ? 'Zu den PDF-Tools' : isPt ? 'Ir para Ferramentas PDF' : 'Go to PDF Tools',
    download: isEs ? 'Descargar Gratis' : isFr ? 'Télécharger Gratuitement' : isDe ? 'Kostenlos Herunterladen' : isPt ? 'Baixar Grátis' : 'Download for Free',
    fallback: isEs ? 'Para instalar, haga clic en el menú del navegador y seleccione "Instalar TheyLovePDF".' : isFr ? 'Pour installer, cliquez sur le menu du navigateur et sélectionnez "Installer TheyLovePDF".' : isDe ? 'Zur Installation klicken Sie auf das Browser-Menü und wählen "TheyLovePDF installieren".' : isPt ? 'Para instalar, clique no menu do navegador e selecione "Instalar TheyLovePDF".' : 'To install, click the browser menu and select \'Install TheyLovePDF\' or \'Add to Home Screen\'.',
    features: [
      {
        title: isEs ? 'Ultra Rápido' : isFr ? 'Ultra Rapide' : isDe ? 'Blitzschnell' : isPt ? 'Ultra Rápido' : 'Lightning Fast',
        desc: isEs ? 'Procesa documentos usando la capacidad local.' : isFr ? 'Traite les documents avec la capacité locale.' : isDe ? 'Verarbeitet Dokumente mit lokaler Kapazität.' : isPt ? 'Processa documentos usando a capacidade local.' : 'Process documents directly using local device capabilities for maximum speed.'
      },
      {
        title: isEs ? 'Privacidad Máxima' : isFr ? 'Confidentialité' : isDe ? 'Maximale Privatsphäre' : isPt ? 'Privacidade Máxima' : 'Maximum Privacy',
        desc: isEs ? 'El procesamiento offline significa que tus archivos no salen.' : isFr ? 'Le traitement hors ligne garde vos fichiers en sécurité.' : isDe ? 'Offline-Verarbeitung hält Ihre Dateien sicher.' : isPt ? 'O processamento offline mantém seus arquivos seguros.' : 'Offline processing means your sensitive files never leave your computer.'
      },
      {
        title: isEs ? 'Más de 30 Herramientas' : isFr ? 'Plus de 30 Outils' : isDe ? 'Alle 30+ Tools' : isPt ? 'Mais de 30 Ferramentas' : 'All 30+ Tools',
        desc: isEs ? 'Accede a la suite completa de edición PDF.' : isFr ? 'Accédez à la suite complète d\'édition PDF.' : isDe ? 'Zugriff auf die komplette Suite zur PDF-Bearbeitung.' : isPt ? 'Acesse a suíte completa de edição de PDF.' : 'Access the complete suite of PDF editing, conversion, and merging tools.'
      }
    ]
  };

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
      alert(t.fallback);
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": t.title,
    "operatingSystem": "Windows, macOS",
    "applicationCategory": "UtilitiesApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": t.desc
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <Helmet>
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto text-center mt-10">
        <div className="w-20 h-20 bg-[#378ADD] rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-8">
          <iconify-icon icon="solar:document-bold" class="text-white text-4xl"></iconify-icon>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{t.title}</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.desc}
        </p>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 max-w-2xl mx-auto">
          {isInstalled ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <iconify-icon icon="solar:check-circle-bold" class="text-3xl"></iconify-icon>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.installedTitle}</h3>
              <p className="text-gray-600 mb-6">{t.installedDesc}</p>
              <Link to={`${lang === 'en' ? '' : '/' + lang}/tools`} className="px-8 py-3 bg-[#378ADD] text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all inline-block">
                {t.goTools}
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
                {t.download}
              </button>
              <p className="text-xs text-gray-400 mt-4">Lightweight app • No credit card required • Secure</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:bolt-bold-duotone" class="text-4xl text-[#378ADD] mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features[0].title}</h3>
            <p className="text-gray-600 text-sm">{t.features[0].desc}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:shield-check-bold-duotone" class="text-4xl text-emerald-500 mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features[1].title}</h3>
            <p className="text-gray-600 text-sm">{t.features[1].desc}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <iconify-icon icon="solar:layers-minimalistic-bold-duotone" class="text-4xl text-purple-500 mb-4"></iconify-icon>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features[2].title}</h3>
            <p className="text-gray-600 text-sm">{t.features[2].desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
