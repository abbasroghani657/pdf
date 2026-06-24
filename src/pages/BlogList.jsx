import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const BlogList = ({ lang = 'en' }) => {
  const prefix = lang !== 'en' ? `/${lang}` : '';
  const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const loadPosts = async () => {
      try {
        if (lang === 'en') {
          const mod = await import('../data/blog.js');
          if (isMounted) setPosts(mod.BLOG_POSTS);
        } else {
          const mod = await import(`../data/blog-${lang}.js`);
          const key = `BLOG_POSTS_${lang.toUpperCase().replace('-', '_')}`;
          if (isMounted) setPosts(mod[key] || mod.default || Object.values(mod)[0] || []);
        }
      } catch (e) {
        const mod = await import('../data/blog.js');
        if (isMounted) setPosts(mod.BLOG_POSTS);
      }
    };
    loadPosts();
    return () => { isMounted = false; };
  }, [lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Only the top 5 languages have translated meta currently, fallback to English for others.
  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';
  
  const title = isEs ? 'Guías y Blog' : isFr ? 'Guides et Blog' : isDe ? 'Anleitungen & Blog' : isPt ? 'Guias e Blog' : 'Guides & Blog';
  const description = isEs ? 'Consejos, trucos y tutoriales para dominar sus documentos PDF.' : isFr ? 'Conseils, astuces et tutoriels pour maîtriser vos documents PDF.' : isDe ? 'Tipps, Tricks und Tutorials zur Beherrschung Ihrer PDF-Dokumente.' : isPt ? 'Dicas, truques e tutoriais para dominar seus documentos PDF.' : 'Tips, tricks, and tutorials to master your PDF documents.';

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        lang={lang}
        title={title}
        description={description}
        url="/blog"
      />
      <main className="flex-grow bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {isEs ? 'Guías y Blog de TheyLovePDF' : isFr ? 'Guides et Blog de TheyLovePDF' : isDe ? 'TheyLovePDF Anleitungen & Blog' : isPt ? 'Guias e Blog do TheyLovePDF' : 'TheyLovePDF Guides & Blog'}
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              {description}
            </p>
          </div>
          
          <div className="space-y-8">
            {posts.map(post => (
              <article key={post.slug} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <Link to={`${prefix}/blog/${post.slug}`} className="block">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-red-600 transition-colors">{post.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">{post.date}</p>
                  <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-red-600 font-semibold hover:underline">
                    {isEs ? 'Leer artículo completo →' : isFr ? "Lire l'article complet →" : isDe ? "Vollständigen Artikel lesen →" : isPt ? "Ler artigo completo →" : 'Read full article →'}
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
