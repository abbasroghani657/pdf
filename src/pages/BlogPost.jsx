import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blog';

const BlogPost = () => {
  const { slug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8">
            <iconify-icon icon="solar:arrow-left-linear" class="mr-2 h-5 w-5"></iconify-icon>
            Back to Blog
          </Link>
          
          <article>
            <header className="mb-10 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl mb-4 leading-tight">{post.title}</h1>
              <p className="text-base text-gray-500">Published on <time dateTime={post.date}>{post.date}</time></p>
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
