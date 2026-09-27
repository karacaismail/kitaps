import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const notices = ['REACT-BITS-LICENSE.md', 'FONT-LICENSES.txt']
  .map(file => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n\n');

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'include-third-party-notices',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return html.replace('</head>', `<!-- Third-party notices\n${notices.replaceAll('--', '—')}\n-->\n</head>`);
        }
      }
    }
  ]
});
