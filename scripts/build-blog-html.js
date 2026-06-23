import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOG_POSTS as BLOG_POSTS_EN } from '../src/data/blog.js';
import { BLOG_POSTS_ES } from '../src/data/blog-es.js';
import { BLOG_POSTS_FR } from '../src/data/blog-fr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found. Run vite build first.');
  process.exit(1);
}
const baseHtml = fs.readFileSync(indexPath, 'utf-8');

const languages = ['en', 'es', 'fr', 'de', 'pt', 'hi', 'ru', 'zh-cn', 'zh-tw', 'ja', 'ko', 'it', 'pl', 'ro', 'bg', 'ca', 'nl', 'el', 'id', 'ms', 'sv', 'th', 'tr', 'uk', 'vi', 'sw', 'fi', 'da', 'no', 'cs'];

languages.forEach(lang => {
  const isEs = lang === 'es';
  const isFr = lang === 'fr';
  const isDe = lang === 'de';
  const isPt = lang === 'pt';
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const blogDir = path.join(DIST_DIR, `${prefix}/blog`);
  
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const posts = isEs ? BLOG_POSTS_ES : isFr ? BLOG_POSTS_FR : BLOG_POSTS_EN;
  
  const listTitle = isEs ? 'Guías y Blog - TheyLovePDF' : isFr ? 'Guides et Blog - TheyLovePDF' : isDe ? 'Anleitungen & Blog - TheyLovePDF' : isPt ? 'Guias e Blog - TheyLovePDF' : 'Blog & Guides - TheyLovePDF';
  const listDesc = isEs ? 'Consejos, trucos y tutoriales para dominar sus documentos PDF.' : isFr ? 'Conseils, astuces et tutoriels pour maîtriser vos documents PDF.' : isDe ? 'Tipps, Tricks und Tutorials zur Beherrschung Ihrer PDF-Dokumente.' : isPt ? 'Dicas, truques e tutoriais para dominar seus documentos PDF.' : 'Discover tips, tricks, and tutorials to master your PDF documents with TheyLovePDF.';

  // 1. Generate Blog List Page
  let blogListHtml = baseHtml;
  blogListHtml = blogListHtml.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  blogListHtml = blogListHtml.replace(/<title>.*?<\/title>/, `<title>${listTitle}</title>`);
  blogListHtml = blogListHtml.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${listDesc}" />`);
  
  const listCanonical = `<link rel="canonical" href="https://www.theylovepdf.com${prefix}/blog" />`;
  blogListHtml = blogListHtml.replace('</head>', `  ${listCanonical}\n  </head>`);
  
  fs.writeFileSync(path.join(blogDir, 'index.html'), blogListHtml);

  // 2. Generate Individual Blog Posts
  posts.forEach(post => {
    const postDir = path.join(blogDir, post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    let postHtml = baseHtml;
    postHtml = postHtml.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
    postHtml = postHtml.replace(/<title>.*?<\/title>/, `<title>${post.title} - TheyLovePDF Blog</title>`);
    postHtml = postHtml.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${post.excerpt}" />`);

    const schemas = [];
    
    // Breadcrumb Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.theylovepdf.com/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `https://www.theylovepdf.com${prefix}/blog` },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://www.theylovepdf.com${prefix}/blog/${post.slug}` }
      ]
    });

    // Article Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.date,
      "author": { "@type": "Organization", "name": "TheyLovePDF" },
      "publisher": {
        "@type": "Organization",
        "name": "TheyLovePDF",
        "logo": { "@type": "ImageObject", "url": "https://www.theylovepdf.com/logo.png" }
      }
    });

    const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n</script>`;
    const canonicalTag = `<link rel="canonical" href="https://www.theylovepdf.com${prefix}/blog/${post.slug}" />`;
    
    postHtml = postHtml.replace('</head>', `  ${scriptTag}\n  ${canonicalTag}\n  </head>`);

    fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
  });
  console.log(`Generated blog html for [${lang}]`);
});

console.log(`Multi-language Blog static generation complete.`);
