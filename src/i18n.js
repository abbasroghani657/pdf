import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Common UI translations for the Tool Page
const resources = {
  en: {
    translation: {
      "howToUse": "How to use",
      "faqs": "Frequently Asked Questions",
      "platformGuides": "Platform Guides",
      "dropFileHere": "Drop your file here",
      "dragDropHere": "Drag & drop your file here",
      "orClickBrowse": "or click to browse — PDF, up to",
      "chooseFile": "Choose file",
      "processWith": "Process with",
      "processing": "Processing your file...",
      "download": "Download Processed File",
      "reset": "Process another file",
      "autoDeleted": "Auto-deleted in 2h",
      "private": "Private",
      "tryAgain": "Try again",
      "goPro": "Go Pro (1GB)"
    }
  },
  es: {
    translation: {
      "howToUse": "Cómo utilizar",
      "faqs": "Preguntas frecuentes",
      "platformGuides": "Guías de plataforma",
      "dropFileHere": "Suelta tu archivo aquí",
      "dragDropHere": "Arrastra y suelta tu archivo aquí",
      "orClickBrowse": "o haz clic para buscar — PDF, hasta",
      "chooseFile": "Elegir archivo",
      "processWith": "Procesar con",
      "processing": "Procesando tu archivo...",
      "download": "Descargar archivo procesado",
      "reset": "Procesar otro archivo",
      "autoDeleted": "Eliminación automática en 2h",
      "private": "Privado",
      "tryAgain": "Intentar de nuevo",
      "goPro": "Hazte Pro (1GB)"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
