import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerenderer from '@prerenderer/rollup-plugin'
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer'
import { TOOLS_DATA } from './src/data/tools.js'
import { slugify } from './src/utils/slugify.js'

const platforms = ['mac', 'windows', 'iphone', 'android'];
const toolRoutes = [];
const esToolRoutes = [];
TOOLS_DATA.forEach(t => {
  const baseSlug = `/tools/${slugify(t.title)}`;
  const esBaseSlug = `/es/tools/${slugify(t.title)}`;
  toolRoutes.push(baseSlug);
  esToolRoutes.push(esBaseSlug);
  platforms.forEach(platform => {
    toolRoutes.push(`${baseSlug}/${platform}`);
    esToolRoutes.push(`${esBaseSlug}/${platform}`);
  });
});
const routes = ['/', '/pricing', '/compare', '/about', '/contact', '/privacy', '/terms', '/pdf-trends-2026', ...toolRoutes, ...esToolRoutes];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prerenderer({
      routes: routes,
      renderer: new PuppeteerRenderer({
        renderAfterDocumentEvent: 'custom-render-trigger',
        headless: true,
        maxConcurrentRoutes: 5,
        navigationOptions: {
          timeout: 60000
        }
      }),
      postProcess: (renderedRoute) => {
        // Strip out the custom render trigger script
        renderedRoute.html = renderedRoute.html.replace(
          /<script>window\.dispatchEvent\(new Event\('custom-render-trigger'\)\);<\/script>/i,
          ''
        );
        return renderedRoute;
      }
    })
  ],
  server: {
    port: 3000,
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3005',
        changeOrigin: true,
      }
    }
  }
})