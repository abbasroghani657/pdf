import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blog';

const BlogList = ({ lang = 'en' }) => {
  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const prefix = isEs ? '/es' : isFr ? '/fr' : '';
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {isEs ? 'Guías y Blog de TheyLovePDF' : isFr ? 'Guides et Blog de TheyLovePDF' : 'TheyLovePDF Guides & Blog'}
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              {isEs ? 'Consejos, trucos y tutoriales para dominar sus documentos PDF.' : isFr ? 'Conseils, astuces et tutoriels pour maîtriser vos documents PDF.' : 'Tips, tricks, and tutorials to master your PDF documents.'}
            </p>
          </div>
          
          <div className="space-y-8">
            {BLOG_POSTS.map(post => (
              <article key={post.slug} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <Link to={`${prefix}/blog/${post.slug}`} className="block">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-red-600 transition-colors">{post.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">{post.date}</p>
                  <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-red-600 font-semibold hover:underline">
                    {isEs ? 'Leer artículo completo →' : isFr ? "Lire l'article complet →" : 'Read full article →'}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogList;
