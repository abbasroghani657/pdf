const fs = require('fs');

const blogContent = fs.readFileSync('src/data/blog.js', 'utf-8');

const translations = {
  fr: {
    "How to Compress a PDF on Mac (2026 Guide)": "Comment compresser un PDF sur Mac (Guide 2026)",
    "Learn the fastest and easiest ways to reduce your PDF file size on a Mac without losing quality. We compare Preview, Automator, and Web tools.": "Découvrez les moyens les plus rapides et les plus simples de réduire la taille de votre fichier PDF sur Mac sans perte de qualité.",
    "How to Merge Multiple PDF Files on Your iPhone": "Comment fusionner plusieurs fichiers PDF sur votre iPhone",
    "Discover the simplest way to combine several PDF documents into one single file directly from your iOS device.": "Découvrez le moyen le plus simple de combiner plusieurs documents PDF en un seul fichier directement depuis votre appareil iOS.",
    "How to Secure Your PDF with a Password": "Comment sécuriser votre PDF avec un mot de passe",
    "Protect sensitive information by adding a secure, unbreakable 256-bit AES encryption password to your PDF files.": "Protégez les informations sensibles en ajoutant un mot de passe de cryptage AES 256 bits sécurisé et incassable à vos fichiers PDF.",
    "What is OCR? How to Make Scanned PDFs Searchable": "Qu'est-ce que l'OCR ? Comment rendre les PDF numérisés consultables",
    "Learn how Optical Character Recognition (OCR) technology works and how it can extract selectable text from flat images.": "Découvrez le fonctionnement de la technologie de reconnaissance optique de caractères (OCR) et comment elle peut extraire du texte sélectionnable.",
    "How to Edit PDF Text on Windows 11 (Without Adobe Acrobat)": "Comment modifier le texte d'un PDF sur Windows 11",
    "Stop paying for expensive software. Discover the most efficient, free, and smart ways to directly edit PDF text and images on your Windows PC.": "Arrêtez de payer pour des logiciels coûteux. Découvrez les moyens les plus efficaces et gratuits de modifier directement le texte d'un PDF.",
    "The Ultimate Guide to Signing PDFs on Android for Free": "Le guide ultime pour signer des PDF sur Android gratuitement",
    "Need to sign a document urgently? Learn how to draw, type, or upload your electronic signature directly from your Android phone.": "Besoin de signer un document de toute urgence ? Apprenez à dessiner, taper ou télécharger votre signature électronique.",
    "Why Students Should Always Convert PDFs to Word for Editing": "Pourquoi les étudiants devraient toujours convertir les PDF en Word",
    "Writing a thesis or taking notes? Discover why extracting text to a Word Document is fundamentally better than editing a PDF directly.": "Vous rédigez une thèse ou prenez des notes ? Découvrez pourquoi l'extraction de texte vers un document Word est fondamentalement meilleure.",
    "Combine Multiple PDFs on Windows 10: Step-by-Step": "Combiner plusieurs PDF sur Windows 10 : Étape par étape",
    "Organize your messy folders by stitching related PDF documents into single, cohesive files right from your Windows desktop.": "Organisez vos dossiers en assemblant des documents PDF liés en un seul fichier cohérent.",
    "Why Legal Professionals Must Protect PDFs with Passwords": "Pourquoi les professionnels du droit doivent protéger les PDF",
    "A deep dive into document security, compliance, and why sending open PDFs via email is a major liability for law firms.": "Une plongée approfondie dans la sécurité des documents, la conformité et les responsabilités des cabinets d'avocats.",
    "How to Compress a PDF on Android to Send via WhatsApp": "Comment compresser un PDF sur Android pour WhatsApp",
    "WhatsApp has file size limits that block large documents. Learn how to crush your PDF size down on your Android phone to share it instantly.": "WhatsApp a des limites de taille de fichier. Apprenez à réduire la taille de votre PDF sur votre téléphone Android.",
    "How to Extract Specific Pages from a Massive PDF": "Comment extraire des pages spécifiques d'un PDF massif",
    "Don't send a 500-page manual when someone only needs chapter 3. Here is the smartest way to extract and split PDF pages.": "N'envoyez pas un manuel de 500 pages. Voici la façon la plus intelligente d'extraire et de diviser des pages PDF.",
    "Chat with PDF: How AI is Changing How We Read Long Documents": "Discuter avec un PDF : Comment l'IA change notre façon de lire",
    "Stop reading 100-page reports. Learn how Large Language Models (LLMs) allow you to literally 'talk' to your documents to extract answers instantly.": "Arrêtez de lire des rapports de 100 pages. Découvrez comment les LLMs vous permettent de «parler» à vos documents."
  },
  es: {
    "How to Compress a PDF on Mac (2026 Guide)": "Cómo comprimir un PDF en Mac (Guía 2026)",
    "Learn the fastest and easiest ways to reduce your PDF file size on a Mac without losing quality. We compare Preview, Automator, and Web tools.": "Aprenda las formas más rápidas y fáciles de reducir el tamaño de su archivo PDF en una Mac sin perder calidad.",
    "How to Merge Multiple PDF Files on Your iPhone": "Cómo fusionar varios archivos PDF en tu iPhone",
    "Discover the simplest way to combine several PDF documents into one single file directly from your iOS device.": "Descubra la forma más sencilla de combinar varios documentos PDF en un solo archivo directamente desde su dispositivo iOS.",
    "How to Secure Your PDF with a Password": "Cómo asegurar su PDF con una contraseña",
    "Protect sensitive information by adding a secure, unbreakable 256-bit AES encryption password to your PDF files.": "Proteja la información confidencial agregando una contraseña de cifrado AES de 256 bits segura a sus archivos PDF.",
    "What is OCR? How to Make Scanned PDFs Searchable": "¿Qué es el OCR? Cómo hacer que los PDF escaneados permitan búsquedas",
    "Learn how Optical Character Recognition (OCR) technology works and how it can extract selectable text from flat images.": "Descubra cómo funciona la tecnología de reconocimiento óptico de caracteres (OCR) y cómo extrae texto seleccionable.",
    "How to Edit PDF Text on Windows 11 (Without Adobe Acrobat)": "Cómo editar texto de PDF en Windows 11",
    "Stop paying for expensive software. Discover the most efficient, free, and smart ways to directly edit PDF text and images on your Windows PC.": "Deje de pagar por software costoso. Descubra las formas más eficientes de editar texto en PDF directamente en Windows.",
    "The Ultimate Guide to Signing PDFs on Android for Free": "La guía definitiva para firmar archivos PDF en Android gratis",
    "Need to sign a document urgently? Learn how to draw, type, or upload your electronic signature directly from your Android phone.": "¿Necesita firmar un documento urgentemente? Aprenda a dibujar, escribir o cargar su firma electrónica en su teléfono.",
    "Why Students Should Always Convert PDFs to Word for Editing": "Por qué los estudiantes siempre deben convertir PDF a Word",
    "Writing a thesis or taking notes? Discover why extracting text to a Word Document is fundamentally better than editing a PDF directly.": "¿Escribiendo una tesis o tomando notas? Descubra por qué extraer texto a un documento de Word es fundamentalmente mejor.",
    "Combine Multiple PDFs on Windows 10: Step-by-Step": "Combine varios PDF en Windows 10: paso a paso",
    "Organize your messy folders by stitching related PDF documents into single, cohesive files right from your Windows desktop.": "Organice sus carpetas desordenadas uniendo documentos PDF relacionados en archivos únicos desde su escritorio.",
    "Why Legal Professionals Must Protect PDFs with Passwords": "Por qué los profesionales legales deben proteger los PDF",
    "A deep dive into document security, compliance, and why sending open PDFs via email is a major liability for law firms.": "Una inmersión profunda en la seguridad de los documentos y por qué enviar PDF abiertos por correo electrónico es un riesgo.",
    "How to Compress a PDF on Android to Send via WhatsApp": "Cómo comprimir un PDF en Android para WhatsApp",
    "WhatsApp has file size limits that block large documents. Learn how to crush your PDF size down on your Android phone to share it instantly.": "WhatsApp tiene límites de tamaño de archivo. Aprenda a reducir el tamaño de su PDF en Android para compartirlo al instante.",
    "How to Extract Specific Pages from a Massive PDF": "Cómo extraer páginas específicas de un PDF masivo",
    "Don't send a 500-page manual when someone only needs chapter 3. Here is the smartest way to extract and split PDF pages.": "No envíe un manual de 500 páginas. Aquí está la forma más inteligente de extraer y dividir páginas PDF.",
    "Chat with PDF: How AI is Changing How We Read Long Documents": "Chatear con PDF: Cómo la IA cambia nuestra forma de leer",
    "Stop reading 100-page reports. Learn how Large Language Models (LLMs) allow you to literally 'talk' to your documents to extract answers instantly.": "Deje de leer informes de 100 páginas. Descubra cómo los LLM le permiten 'hablar' con sus documentos para extraer respuestas."
  }
};

function generateFile(lang) {
  let content = blogContent.replace('export const BLOG_POSTS', 'export const BLOG_POSTS_' + lang.toUpperCase());
  
  for (const [en, trans] of Object.entries(translations[lang])) {
    content = content.replace(en, trans);
  }
  
  fs.writeFileSync('src/data/blog-' + lang + '.js', content);
}

generateFile('fr');
generateFile('es');
console.log('Generated blog-fr.js and blog-es.js');
