import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { BLOG_POSTS as BLOG_POSTS_EN } from '../data/blog';
import { BLOG_POSTS_ES } from '../data/blog-es';
import { BLOG_POSTS_FR } from '../data/blog-fr';

const BlogPost = ({ lang = 'en' }) => {
  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';
  const prefix = isEs ? '/es' : isFr ? '/fr' : isDe ? '/de' : isPt ? '/pt' : '';
  const posts = isEs ? BLOG_POSTS_ES : isFr ? BLOG_POSTS_FR : BLOG_POSTS_EN;
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to={`${prefix}/blog`} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        lang={lang}
        title={post.title}
        description={post.excerpt}
        url={`/blog/${post.slug}`}
        type="article"
      />
      <main className="flex-grow bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`${prefix}/blog`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8">
            <iconify-icon icon="solar:arrow-left-linear" class="mr-2 h-5 w-5"></iconify-icon>
            {isEs ? 'Volver al Blog' : isFr ? 'Retour au Blog' : isDe ? 'Zurück zum Blog' : isPt ? 'Voltar ao Blog' : 'Back to Blog'}
          </Link>
          
          <article>
            <header className="mb-10 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl mb-4 leading-tight">{post.title}</h1>
              <p className="text-base text-gray-500">
                {isEs ? 'Publicado el ' : isFr ? 'Publié le ' : isDe ? 'Veröffentlicht am ' : isPt ? 'Publicado em ' : 'Published on '}
                <time dateTime={post.date}>{post.date}</time>
              </p>
            </header>
            
            <div 
              className="prose prose-lg prose-red mx-auto text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
