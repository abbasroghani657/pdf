import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOG_POSTS as BLOG_POSTS_EN } from '../src/data/blog.js';

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

// Blog list title & description per language
const BLOG_META = {
  en: { title: 'Blog & Guides - TheyLovePDF', desc: 'Discover tips, tricks, and tutorials to master your PDF documents with TheyLovePDF.' },
  es: { title: 'Guías y Blog - TheyLovePDF', desc: 'Consejos, trucos y tutoriales para dominar sus documentos PDF.' },
  fr: { title: 'Guides et Blog - TheyLovePDF', desc: 'Conseils, astuces et tutoriels pour maîtriser vos documents PDF.' },
  de: { title: 'Anleitungen & Blog - TheyLovePDF', desc: 'Tipps, Tricks und Tutorials zur Beherrschung Ihrer PDF-Dokumente.' },
  pt: { title: 'Guias e Blog - TheyLovePDF', desc: 'Dicas, truques e tutoriais para dominar seus documentos PDF.' },
  hi: { title: 'ब्लॉग और गाइड - TheyLovePDF', desc: 'अपने PDF दस्तावेज़ों में महारत हासिल करने के लिए टिप्स और ट्यूटोरियल।' },
  ru: { title: 'Блог и руководства - TheyLovePDF', desc: 'Советы и руководства по работе с PDF-документами.' },
  'zh-cn': { title: '博客和指南 - TheyLovePDF', desc: '掌握 PDF 文档的技巧和教程。' },
  'zh-tw': { title: '部落格和指南 - TheyLovePDF', desc: '掌握 PDF 文件的技巧和教學。' },
  ja: { title: 'ブログとガイド - TheyLovePDF', desc: 'PDF ドキュメントをマスターするためのヒントとチュートリアル。' },
  ko: { title: '블로그 및 가이드 - TheyLovePDF', desc: 'PDF 문서를 마스터하기 위한 팁과 튜토리얼.' },
  it: { title: 'Blog e Guide - TheyLovePDF', desc: 'Suggerimenti e tutorial per gestire i tuoi documenti PDF.' },
  pl: { title: 'Blog i poradniki - TheyLovePDF', desc: 'Porady i samouczki dotyczące pracy z dokumentami PDF.' },
  ro: { title: 'Blog și ghiduri - TheyLovePDF', desc: 'Sfaturi și tutoriale pentru documentele PDF.' },
  bg: { title: 'Блог и ръководства - TheyLovePDF', desc: 'Съвети и уроци за PDF документи.' },
  ca: { title: 'Blog i guies - TheyLovePDF', desc: 'Consells i tutorials per dominar els vostres documents PDF.' },
  nl: { title: 'Blog en handleidingen - TheyLovePDF', desc: 'Tips en tutorials voor het beheren van uw PDF-documenten.' },
  el: { title: 'Ιστολόγιο και οδηγοί - TheyLovePDF', desc: 'Συμβουλές και οδηγοί για τα PDF έγγραφά σας.' },
  id: { title: 'Blog dan Panduan - TheyLovePDF', desc: 'Tips dan tutorial untuk menguasai dokumen PDF Anda.' },
  ms: { title: 'Blog dan Panduan - TheyLovePDF', desc: 'Petua dan tutorial untuk menguasai dokumen PDF anda.' },
  sv: { title: 'Blogg och guider - TheyLovePDF', desc: 'Tips och handledningar för att bemästra dina PDF-dokument.' },
  th: { title: 'บล็อกและคู่มือ - TheyLovePDF', desc: 'เคล็ดลับและบทช่วยสอนสำหรับเอกสาร PDF ของคุณ' },
  tr: { title: 'Blog ve Kılavuzlar - TheyLovePDF', desc: 'PDF belgelerinizde uzmanlaşmak için ipuçları ve öğreticiler.' },
  uk: { title: 'Блог і посібники - TheyLovePDF', desc: 'Поради та посібники для роботи з PDF-документами.' },
  vi: { title: 'Blog và Hướng dẫn - TheyLovePDF', desc: 'Mẹo và hướng dẫn để làm chủ tài liệu PDF của bạn.' },
  sw: { title: 'Blogu na Miongozo - TheyLovePDF', desc: 'Vidokezo na mafunzo ya kufanya kazi na hati za PDF.' },
  fi: { title: 'Blogi ja oppaat - TheyLovePDF', desc: 'Vinkkejä ja oppaita PDF-dokumenttien hallintaan.' },
  da: { title: 'Blog og vejledninger - TheyLovePDF', desc: 'Tips og vejledninger til at mestre dine PDF-dokumenter.' },
  no: { title: 'Blogg og veiledninger - TheyLovePDF', desc: 'Tips og veiledninger for å mestre PDF-dokumentene dine.' },
  cs: { title: 'Blog a průvodci - TheyLovePDF', desc: 'Tipy a návody pro práci s PDF dokumenty.' },
};

async function generateBlogPages() {
  for (const lang of languages) {
    const prefix = lang === 'en' ? '' : `/${lang}`;
    const blogDir = path.join(DIST_DIR, `${prefix}/blog`);
  
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Dynamically load blog data for each language
    let posts = BLOG_POSTS_EN; // Default fallback
    try {
      if (lang === 'en') {
        posts = BLOG_POSTS_EN;
      } else {
        const mod = await import(`../src/data/blog-${lang}.js`);
        const key = `BLOG_POSTS_${lang.toUpperCase().replace('-', '_')}`;
        posts = mod[key] || mod.default || Object.values(mod)[0] || BLOG_POSTS_EN;
      }
    } catch (err) {
      console.warn(`Warning: Could not load blog data for ${lang}, using English fallback: ${err.message}`);
      posts = BLOG_POSTS_EN;
    }

    const meta = BLOG_META[lang] || BLOG_META['en'];

    // 1. Generate Blog List Page
    let blogListHtml = baseHtml;
    blogListHtml = blogListHtml.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
    blogListHtml = blogListHtml.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);
    blogListHtml = blogListHtml.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${meta.desc}" />`);
    
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
  }
}

await generateBlogPages();
console.log(`Multi-language Blog static generation complete.`);
