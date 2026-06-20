import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TOOLS_DATA } from '../data/tools';

const getUseCases = (lang) => {
  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';

  return {
    students: {
      title: isEs ? 'Herramientas PDF para Estudiantes' : isFr ? 'Outils PDF pour Étudiants' : isDe ? 'PDF-Tools für Studenten' : isPt ? 'Ferramentas PDF para Estudantes' : 'PDF Tools for Students & Educators',
      desc: isEs ? 'Las mejores herramientas PDF gratuitas para estudiar mejor. Une tareas y chatea con tus libros.' : isFr ? 'Les meilleurs outils gratuits pour étudier plus intelligemment. Fusionnez vos devoirs et discutez avec vos manuels.' : isDe ? 'Die besten kostenlosen PDF-Tools, um intelligenter zu lernen. Aufgaben zusammenführen und mit Lehrbüchern chatten.' : isPt ? 'As melhores ferramentas de PDF gratuitas para estudar de forma mais inteligente. Junte tarefas e converse com seus livros.' : 'The best free PDF tools to help you study smarter. Merge assignments, compress presentations, and chat with your textbooks using AI.',
      tools: ['merge-pdf', 'compress-pdf', 'chat-with-pdf', 'summarize-pdf', 'add-page-numbers'],
      icon: 'solar:diploma-bold-duotone',
      color: 'text-blue-500'
    },
    business: {
      title: isEs ? 'Soluciones PDF para Empresas' : isFr ? 'Solutions PDF pour Entreprises' : isDe ? 'PDF-Lösungen für Unternehmen' : isPt ? 'Soluções de PDF para Empresas' : 'PDF Solutions for Small Business',
      desc: isEs ? 'Herramientas seguras y rápidas para tu negocio. Firma contratos y edita facturas.' : isFr ? 'Outils sécurisés et rapides pour votre entreprise. Signez des contrats et modifiez des factures.' : isDe ? 'Sichere, schnelle und kostenlose PDF-Tools, damit Ihr Geschäft reibungslos läuft. Verträge unterschreiben und Rechnungen bearbeiten.' : isPt ? 'Ferramentas de PDF seguras e rápidas para o seu negócio. Assine contratos e edite faturas.' : 'Secure, fast, and free PDF tools to keep your business running smoothly. Sign contracts, edit invoices, and convert documents.',
      tools: ['sign-pdf', 'edit-pdf', 'protect-pdf', 'pdf-to-word', 'extract-data'],
      icon: 'solar:briefcase-bold-duotone',
      color: 'text-purple-500'
    },
    'real-estate': {
      title: isEs ? 'Herramientas PDF para Inmobiliarias' : isFr ? 'Outils PDF pour l\'Immobilier' : isDe ? 'PDF-Tools für Immobilienmakler' : isPt ? 'Ferramentas PDF para Imobiliárias' : 'PDF Tools for Real Estate Agents',
      desc: isEs ? 'Acelera cierres de propiedades con firmas y edición de PDF 100% seguros.' : isFr ? 'Accélérez les ventes avec des signatures et modifications de PDF 100% sécurisées.' : isDe ? 'Beschleunigen Sie Immobilienabschlüsse mit einfachen PDF-E-Signaturen, Formularausfüllungen und Dokumentenzusammenführung. 100% sicher.' : isPt ? 'Acelere fechamentos de propriedades com assinaturas e edição de PDF 100% seguras.' : 'Accelerate property closings with easy PDF e-signatures, form filling, and document merging. 100% secure.',
      tools: ['sign-pdf', 'request-signature', 'merge-pdf', 'pdf-forms', 'split-pdf'],
      icon: 'solar:home-smile-bold-duotone',
      color: 'text-emerald-500'
    },
    legal: {
      title: isEs ? 'Herramientas PDF para Profesionales Legales' : isFr ? 'Outils PDF pour Professionnels du Droit' : isDe ? 'Sichere PDF-Tools für Juristen' : isPt ? 'Ferramentas de PDF para Profissionais do Direito' : 'Secure PDF Tools for Legal Professionals',
      desc: isEs ? 'Seguridad bancaria para documentos sensibles. Redacta información confidencial.' : isFr ? 'Sécurité bancaire pour vos documents sensibles. Masquez les informations confidentielles.' : isDe ? 'Sicherheit auf Bankenniveau für Ihre sensiblen Dokumente. Vertrauliche Informationen schwärzen, Bates-Nummerierung hinzufügen und sicher unterschreiben.' : isPt ? 'Segurança bancária para seus documentos sensíveis. Omita informações confidenciais.' : 'Bank-grade security for your sensitive documents. Redact confidential information, add bates numbering, and sign securely.',
      tools: ['redact-pdf', 'protect-pdf', 'certificate-sign', 'flatten-pdf', 'add-page-numbers'],
      icon: 'solar:scale-bold-duotone',
      color: 'text-amber-500'
    }
  };
};

export default function UseCasePage({ lang = 'en' }) {
  const { industry } = useParams();
  const USE_CASES = getUseCases(lang);
  const data = USE_CASES[industry];

  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';

  const t = {
    notFound: isEs ? 'Caso de uso no encontrado' : isFr ? 'Cas d\'utilisation introuvable' : isDe ? 'Anwendungsfall nicht gefunden' : isPt ? 'Caso de uso não encontrado' : 'Use Case Not Found',
    browseAll: isEs ? 'Explorar todas las herramientas' : isFr ? 'Parcourir tous les outils' : isDe ? 'Alle Tools durchsuchen' : isPt ? 'Navegar por todas as ferramentas' : 'Browse all tools',
    recommended: isEs ? 'Herramientas recomendadas para ti' : isFr ? 'Outils recommandés pour vous' : isDe ? 'Empfohlene Tools für Sie' : isPt ? 'Ferramentas recomendadas para você' : 'Recommended Tools for You',
    start: isEs ? 'Empieza a trabajar más inteligente hoy.' : isFr ? 'Commencez à travailler plus intelligemment.' : isDe ? 'Beginnen Sie noch heute intelligenter zu arbeiten.' : isPt ? 'Comece a trabalhar de forma mais inteligente hoje.' : 'Start working smarter today.',
    free: isEs ? 'Sin tarjeta de crédito. 100% gratis y seguro.' : isFr ? 'Pas de carte de crédit. 100% gratuit et sécurisé.' : isDe ? 'Keine Kreditkarte erforderlich. 100% kostenlos und sicher.' : isPt ? 'Não é necessário cartão de crédito. 100% grátis e seguro.' : 'No credit card required. 100% free and secure.',
    viewAll: isEs ? 'Ver más de 30 herramientas' : isFr ? 'Voir les 30+ outils' : isDe ? 'Alle 30+ Tools ansehen' : isPt ? 'Ver mais de 30 ferramentas' : 'View All 30+ Tools'
  };

  if (!data) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 text-center">
        <h1 className="text-3xl font-bold">{t.notFound}</h1>
        <Link to={`${lang === 'en' ? '' : '/' + lang}/tools`} className="text-[#378ADD] hover:underline mt-4 inline-block">{t.browseAll}</Link>
      </div>
    );
  }

  const recommendedTools = TOOLS_DATA.filter(tool => {
    const slug = tool.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    return data.tools.includes(slug) || data.tools.includes(tool.path.replace('/tools/', ''));
  }).slice(0, 5);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": data.title,
    "description": data.desc,
    "author": {
      "@type": "Organization",
      "name": "TheyLovePDF"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <Helmet>
        <title>{data.title} - TheyLovePDF</title>
        <meta name="description" content={data.desc} />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto text-center mt-10">
        <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-gray-100 mb-8">
          <iconify-icon icon={data.icon} class={`text-5xl ${data.color}`}></iconify-icon>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          {data.title}
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          {data.desc}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.recommended}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {recommendedTools.map((tool, idx) => (
            <Link key={idx} to={`${lang === 'en' ? '' : '/' + lang}${tool.path}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#378ADD]/30 transition-all group flex flex-col h-full">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color.replace('bg-', 'bg-opacity-10 text-').replace('text-white', 'text-blue-500')} group-hover:scale-110 transition-transform`}>
                <iconify-icon icon={tool.icon} class="text-2xl"></iconify-icon>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#378ADD] transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-grow">{tool.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-20 bg-[#378ADD] rounded-3xl p-10 md:p-16 text-white text-center shadow-xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">{t.start}</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto relative z-10">{t.free}</p>
          <Link to={`${lang === 'en' ? '' : '/' + lang}/tools`} className="px-10 py-4 bg-white text-[#378ADD] text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all inline-block relative z-10">
            {t.viewAll}
          </Link>
        </div>
      </div>
    </div>
  );
}
