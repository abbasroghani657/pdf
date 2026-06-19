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
      "goPro": "Go Pro (1GB)",
      "filesCount": "{{count}} files",
      "inQueue": "You are #{{count}} in queue...",
      "processingMsg": "Processing...",
      "uploadingValidating": "Uploading & validating file...",
      "analyzingDoc": "Analyzing document structure...",
      "applyingTransform": "Applying transformation...",
      "finalizingOutput": "Finalizing output...",
      "doneReady": "Done! Your file is ready.",
      "autoDeletePrivacy": "File will be automatically deleted in 2 hours for privacy.",
      "preparingDownload": "Preparing download...",
      "downloadBtn": "Download",
      "processAnother": "Process another",
      "errorTitle": "Oops! Something went wrong."
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
      "goPro": "Hazte Pro (1GB)",
      "filesCount": "{{count}} archivos",
      "inQueue": "Estás en la posición #{{count}} en la fila...",
      "processingMsg": "Procesando...",
      "uploadingValidating": "Subiendo y validando el archivo...",
      "analyzingDoc": "Analizando la estructura del documento...",
      "applyingTransform": "Aplicando transformación...",
      "finalizingOutput": "Finalizando el proceso...",
      "doneReady": "¡Listo! Tu archivo está preparado.",
      "autoDeletePrivacy": "El archivo se eliminará automáticamente en 2 horas por privacidad.",
      "preparingDownload": "Preparando la descarga...",
      "downloadBtn": "Descargar",
      "processAnother": "Procesar otro",
      "errorTitle": "¡Vaya! Algo salió mal."
    }
  },
  fr: {
    translation: {
      "howToUse": "Comment utiliser",
      "faqs": "Foire aux questions",
      "platformGuides": "Guides de plateforme",
      "dropFileHere": "Déposez votre fichier ici",
      "dragDropHere": "Glissez-déposez votre fichier ici",
      "orClickBrowse": "ou cliquez pour parcourir — PDF, jusqu'à",
      "chooseFile": "Choisir le fichier",
      "processWith": "Traiter avec",
      "processing": "Traitement de votre fichier...",
      "download": "Télécharger le fichier traité",
      "reset": "Traiter un autre fichier",
      "autoDeleted": "Suppression auto dans 2h",
      "private": "Privé",
      "tryAgain": "Réessayer",
      "goPro": "Passez Pro (1Go)",
      "filesCount": "{{count}} fichiers",
      "inQueue": "Vous êtes en position #{{count}} dans la file...",
      "processingMsg": "Traitement en cours...",
      "uploadingValidating": "Téléchargement et validation...",
      "analyzingDoc": "Analyse de la structure...",
      "applyingTransform": "Application de la transformation...",
      "finalizingOutput": "Finalisation en cours...",
      "doneReady": "Terminé ! Votre fichier est prêt.",
      "autoDeletePrivacy": "Le fichier sera automatiquement supprimé dans 2 heures.",
      "preparingDownload": "Préparation du téléchargement...",
      "downloadBtn": "Télécharger",
      "processAnother": "Traiter un autre",
      "errorTitle": "Oups ! Quelque chose s'est mal passé."
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
