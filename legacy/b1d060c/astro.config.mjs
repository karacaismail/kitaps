import { defineConfig } from 'astro/config';

// GitHub Pages: https://<kullanıcı>.github.io/kitaps
// Kendi alan adına taşırsan `base`'i kaldır, `site`'ı değiştir.
export default defineConfig({
  site: 'https://karacaismail.github.io',
  base: '/kitaps',
  trailingSlash: 'ignore',
  build: { format: 'file' },
});
