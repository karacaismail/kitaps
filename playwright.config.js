import { defineConfig, devices } from '@playwright/test';

// End-to-end checks run against the production build (`npm run build` first),
// in a real browser, so CORS, lazy chunks and layout behave as on the site.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:4317/', trace: 'retain-on-failure' },
  // A dedicated port, never reused: other local servers (e.g. a dev server on
  // 4173) must not stand in for the build under test.
  webServer: { command: 'npx vite preview --host 127.0.0.1 --port 4317 --strictPort', url: 'http://127.0.0.1:4317/', reuseExistingServer: false, timeout: 60_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
