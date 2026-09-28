import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Component tests render real React/Mantine trees in jsdom; the data and
// domain tests keep running under node:test (`npm run test:node`).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/components/**/*.test.jsx'],
    setupFiles: ['tests/components/setup.js'],
    css: false,
  },
});
