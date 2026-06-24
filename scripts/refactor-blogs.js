import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const listPath = path.resolve(__dirname, '../src/pages/BlogList.jsx');
const postPath = path.resolve(__dirname, '../src/pages/BlogPost.jsx');

// REFACTOR BlogList.jsx
let listCode = fs.readFileSync(listPath, 'utf8');

// 1. Remove static imports
listCode = listCode.replace(/import \{ BLOG_POSTS.*? \} from '\.\.\/data\/blog.*?';\n/g, '');

// 2. Add useState and lazy dynamic import
const listHooksRegex = /const posts = .*?;/;
listCode = listCode.replace(listHooksRegex, `const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const loadPosts = async () => {
      try {
        if (lang === 'en') {
          const mod = await import('../data/blog.js');
          if (isMounted) setPosts(mod.BLOG_POSTS);
        } else {
          const mod = await import(\`../data/blog-\${lang}.js\`);
          const key = \`BLOG_POSTS_\${lang.toUpperCase().replace('-', '_')}\`;
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
`);

listCode = listCode.replace("import React, { useEffect } from 'react';", "import React, { useEffect, useState } from 'react';");
fs.writeFileSync(listPath, listCode);

// REFACTOR BlogPost.jsx
let postCode = fs.readFileSync(postPath, 'utf8');

// 1. Remove static imports
postCode = postCode.replace(/import \{ BLOG_POSTS.*? \} from '\.\.\/data\/blog.*?';\n/g, '');

// 2. Add useState and lazy dynamic import
const postHooksRegex = /const posts = .*?;/;
postCode = postCode.replace(postHooksRegex, `const [posts, setPosts] = React.useState([]);
  const [post, setPost] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const loadPost = async () => {
      try {
        let loadedPosts = [];
        if (lang === 'en') {
          const mod = await import('../data/blog.js');
          loadedPosts = mod.BLOG_POSTS;
        } else {
          const mod = await import(\`../data/blog-\${lang}.js\`);
          const key = \`BLOG_POSTS_\${lang.toUpperCase().replace('-', '_')}\`;
          loadedPosts = mod[key] || mod.default || Object.values(mod)[0] || [];
        }
        if (isMounted) {
            setPosts(loadedPosts);
            setPost(loadedPosts.find(p => p.slug === slug));
        }
      } catch (e) {
        const mod = await import('../data/blog.js');
        if (isMounted) {
            setPosts(mod.BLOG_POSTS);
            setPost(mod.BLOG_POSTS.find(p => p.slug === slug));
        }
      }
    };
    loadPost();
    return () => { isMounted = false; };
  }, [lang, slug]);
`);

// 3. Update the render logic because \`post\` is now async
postCode = postCode.replace("const post = posts.find(p => p.slug === slug);", "");

fs.writeFileSync(postPath, postCode);

console.log('BlogList and BlogPost deeply refactored with dynamic imports!');
