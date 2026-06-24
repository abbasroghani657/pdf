import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ExtensionPage({ lang = 'en', ui, toolData }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';

  const t = {
    title: isEs ? 'Extensión TheyLovePDF para Chrome y Edge' : isFr ? 'Extension TheyLovePDF pour Chrome & Edge' : isDe ? 'TheyLovePDF Chrome & Edge Erweiterung' : isPt ? 'Extensão TheyLovePDF para Chrome e Edge' : 'TheyLovePDF Chrome & Edge Extension',
    desc: isEs ? 'Accede a todas tus herramientas PDF favoritas al instante desde la barra de herramientas de tu navegador. Sin complicaciones, solo magia PDF a 1 clic.' : isFr ? 'Accédez instantanément à tous vos outils PDF préférés depuis la barre d\'outils de votre navigateur. Aucune recherche, juste la magie du PDF en 1 clic.' : isDe ? 'Greifen Sie sofort von der Symbolleiste Ihres Browsers auf all Ihre bevorzugten PDF-Tools zu. Kein Suchen mehr, nur noch PDF-Magie mit 1 Klick.' : isPt ? 'Acesse instantaneamente todas as suas ferramentas de PDF favoritas da barra de ferramentas do seu navegador. Sem mais buscas, apenas mágica em PDF com 1 clique.' : 'Access all your favorite PDF tools instantly from your browser toolbar. No more searching, just 1-click PDF magic.',
    installedTitle: isEs ? '¡Extensión Instalada!' : isFr ? 'Extension Installée !' : isDe ? 'Erweiterung installiert!' : isPt ? 'Extensão Instalada!' : 'Extension Installed!',
    installedDesc: isEs ? 'TheyLovePDF ha sido añadida a los accesos directos de tu navegador.' : isFr ? 'TheyLovePDF est maintenant ajouté aux raccourcis de votre navigateur.' : isDe ? 'TheyLovePDF wurde jetzt zu Ihren Browser-Verknüpfungen hinzugefügt.' : isPt ? 'O TheyLovePDF agora foi adicionado aos atalhos do seu navegador.' : 'TheyLovePDF is now added to your browser shortcuts.',
    goTools: isEs ? 'Abrir Herramientas' : isFr ? 'Ouvrir les Outils' : isDe ? 'Tools Öffnen' : isPt ? 'Abrir Ferramentas' : 'Open Tools',
    download: isEs ? 'Añadir a Chrome' : isFr ? 'Ajouter à Chrome' : isDe ? 'Zu Chrome Hinzufügen' : isPt ? 'Adicionar ao Chrome' : 'Add to Chrome',
    fallback: isEs ? 'Para instalar, haga clic en el menú del navegador (⋮) y seleccione "Instalar TheyLovePDF".' : isFr ? 'Pour installer, cliquez sur le menu du navigateur (⋮) et sélectionnez "Installer TheyLovePDF".' : isDe ? 'Zur Installation klicken Sie auf das Browser-Menü (⋮) und wählen "TheyLovePDF installieren".' : isPt ? 'Para instalar, clique no menu do navegador (⋮) e selecione "Instalar TheyLovePDF".' : 'To install, click the browser menu (⋮) and select \'Install TheyLovePDF\' or \'Add to Home Screen\'.',
    schemaDesc: isEs ? 'Instala la extensión del navegador TheyLovePDF. Edita, une, comprime y convierte archivos PDF.' : isFr ? 'Installez l\'extension TheyLovePDF. Modifiez, fusionnez, compressez et convertissez.' : isDe ? 'Installieren Sie die TheyLovePDF Browser-Erweiterung. PDFs direkt bearbeiten, zusammenführen und komprimieren.' : isPt ? 'Instale a extensão de navegador TheyLovePDF. Edite, mescle, comprima e converta arquivos PDF.' : 'Install the TheyLovePDF browser extension. Edit, merge, compress and convert PDF files directly from your browser toolbar.',
    users: isEs ? 'usuarios' : isFr ? 'utilisateurs' : isDe ? 'Benutzer' : isPt ? 'usuários' : 'users',
    features: [
      {
        title: isEs ? 'Acceso en 1 clic' : isFr ? 'Accès en 1 clic' : isDe ? '1-Klick-Zugang' : isPt ? 'Acesso em 1 clique' : '1-Click Access',
        desc: isEs ? 'Abre el kit de herramientas al instante.' : isFr ? 'Ouvrez la boîte à outils instantanément.' : isDe ? 'Öffnen Sie das PDF-Toolkit sofort.' : isPt ? 'Abra o kit de ferramentas instantaneamente.' : 'Open the PDF toolkit instantly from your browser\'s toolbar.'
      },
      {
        title: isEs ? 'Extensión Segura' : isFr ? 'Extension Sécurisée' : isDe ? 'Sichere Erweiterung' : isPt ? 'Extensão Segura' : 'Secure Extension',
        desc: isEs ? 'No rastreamos tu historial de navegación. 100% privacidad.' : isFr ? 'Nous ne suivons pas votre historique. 100% privé.' : isDe ? 'Wir verfolgen Ihren Browserverlauf nicht. 100% Datenschutz.' : isPt ? 'Não rastreamos seu histórico de navegação. 100% de privacidade.' : 'We don\'t track your browsing history. 100% privacy focused.'
      },
      {
        title: isEs ? 'Súper Ligera' : isFr ? 'Zéro Lenteur' : isDe ? 'Null Bloat' : isPt ? 'Zero Bloat' : 'Zero Bloat',
        desc: isEs ? 'Integración extremadamente ligera.' : isFr ? 'Intégration d\'application web extrêmement légère.' : isDe ? 'Extrem leichte Web-App-Integration.' : isPt ? 'Integração extremamente leve.' : 'Extremely lightweight progressive web app integration.'
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
      // Fallback
      alert(t.fallback);
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": t.title,
    "operatingSystem": "Chrome, Edge, Brave",
    "applicationCategory": "BrowserExtension",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": t.schemaDesc
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <Helmet>
        <title>{t.title}</title>
        <meta name="description" content={t.schemaDesc} />
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
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{t.title}</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.desc}
        </p>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 max-w-2xl mx-auto relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#378ADD]/5 rounded-bl-[100px] pointer-events-none"></div>

          {isInstalled ? (
            <div className="text-center relative z-10">
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
                {t.download}
              </button>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <div className="flex text-yellow-400">
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                  <iconify-icon icon="solar:star-bold"></iconify-icon>
                </div>
                <span>4.9/5 (10k+ {t.users})</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:mouse-circle-bold-duotone" class="text-4xl text-[#378ADD] shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{t.features[0].title}</h3>
              <p className="text-gray-500 text-sm">{t.features[0].desc}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:shield-check-bold-duotone" class="text-4xl text-emerald-500 shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{t.features[1].title}</h3>
              <p className="text-gray-500 text-sm">{t.features[1].desc}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
            <iconify-icon icon="solar:flash-bold-duotone" class="text-4xl text-purple-500 shrink-0"></iconify-icon>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{t.features[2].title}</h3>
              <p className="text-gray-500 text-sm">{t.features[2].desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
