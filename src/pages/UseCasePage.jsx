import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TOOLS_DATA } from '../data/tools';

const USE_CASES = {
  students: {
    title: 'PDF Tools for Students & Educators',
    desc: 'The best free PDF tools to help you study smarter. Merge assignments, compress presentations, and chat with your textbooks using AI.',
    tools: ['merge-pdf', 'compress-pdf', 'chat-with-pdf', 'summarize-pdf', 'add-page-numbers'],
    icon: 'solar:diploma-bold-duotone',
    color: 'text-blue-500'
  },
  business: {
    title: 'PDF Solutions for Small Business',
    desc: 'Secure, fast, and free PDF tools to keep your business running smoothly. Sign contracts, edit invoices, and convert documents.',
    tools: ['sign-pdf', 'edit-pdf', 'protect-pdf', 'pdf-to-word', 'extract-data'],
    icon: 'solar:briefcase-bold-duotone',
    color: 'text-purple-500'
  },
  'real-estate': {
    title: 'PDF Tools for Real Estate Agents',
    desc: 'Accelerate property closings with easy PDF e-signatures, form filling, and document merging. 100% secure.',
    tools: ['sign-pdf', 'request-signature', 'merge-pdf', 'pdf-forms', 'split-pdf'],
    icon: 'solar:home-smile-bold-duotone',
    color: 'text-emerald-500'
  },
  legal: {
    title: 'Secure PDF Tools for Legal Professionals',
    desc: 'Bank-grade security for your sensitive documents. Redact confidential information, add bates numbering, and sign securely.',
    tools: ['redact-pdf', 'protect-pdf', 'certificate-sign', 'flatten-pdf', 'add-page-numbers'],
    icon: 'solar:scale-bold-duotone',
    color: 'text-amber-500'
  }
};

export default function UseCasePage() {
  const { industry } = useParams();
  const data = USE_CASES[industry];

  if (!data) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 text-center">
        <h1 className="text-3xl font-bold">Use Case Not Found</h1>
        <Link to="/tools" className="text-[#378ADD] hover:underline mt-4 inline-block">Browse all tools</Link>
      </div>
    );
  }

  const recommendedTools = TOOLS_DATA.filter(t => {
    // Assuming slugify logic matches here, we just check if the tool's expected path matches our list
    const slug = t.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    return data.tools.includes(slug) || data.tools.includes(t.path.replace('/tools/', ''));
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

        <h2 className="text-2xl font-bold text-gray-900 mb-8">Recommended Tools for You</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {recommendedTools.map((tool, idx) => (
            <Link key={idx} to={tool.path} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#378ADD]/30 transition-all group flex flex-col h-full">
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
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Start working smarter today.</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto relative z-10">No credit card required. 100% free and secure.</p>
          <Link to="/tools" className="px-10 py-4 bg-white text-[#378ADD] text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all inline-block relative z-10">
            View All 30+ Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
