import { defineConfig, devices } from '@playwright/test';

// End-to-end checks run against the production build (`npm run build` first),
// in a real browser, so CORS, lazy chunks and layout behave as on the site.
// A dedicated port, never reused: other local servers (e.g. a dev server on
// 4173) must not stand in for the build under test. E2E_PORT lets sessions in
// separate worktrees run their suites side by side.
const port = Number(process.env.E2E_PORT) || 4317;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://127.0.0.1:${port}/`, trace: 'retain-on-failure' },
  webServer: { command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}/`, reuseExistingServer: false, timeout: 60_000 },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The cover marks (ribbons, grey covers) and the owner's grid rule are
    // layout-sensitive, so they are also checked in WebKit, Firefox and a phone browser.
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /(reading-marks|catalog-grid)\.spec\.js/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /(reading-marks|catalog-grid)\.spec\.js/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] }, testMatch: /(reading-marks|catalog-grid)\.spec\.js/ },
  ],
});
