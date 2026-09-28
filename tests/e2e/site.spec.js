import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const axeSource = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const consoleErrors = page => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
};

test('the shared state is read from GitHub in a real browser, without CORS errors', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./?view=notes');
  await expect(page.getByText(/GitHub durumu salt okunur olarak güncel|Değişiklikler cihazda kuyrukta/)).toBeVisible({ timeout: 20_000 });
  expect(errors.filter(text => /CORS|Access-Control|Failed to fetch/i.test(text))).toEqual([]);
});

test('the catalog opens sorted by reading priority with the compact summary', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./');
  await expect(page.locator('.book-card')).toHaveCount(24);
  const toggle = page.getByRole('button', { name: /Okuma önceliğine göre sıralı/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.header-children svg circle')).toHaveCount(3);
  await expect(page.locator('.reading-priority-badge').first()).toContainText('#1');
  expect(errors).toEqual([]);
});

test('a phone shows book titles on the first screen', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('./');
  const title = page.locator('.book-card .title-button').first();
  await expect(title).toBeVisible();
  const box = await title.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(812);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test('marking a book as purchased changes neither its score nor its explanation', async ({ page }) => {
  await page.goto('./?book=good-to-great-by-jim-collins');
  const card = page.locator('.reading-priority-card');
  await expect(card).toBeVisible();
  const before = await card.innerText();
  await page.getByRole('button', { name: 'Satın alındı', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Satın alındı', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await card.innerText()).toBe(before);
  expect(before).not.toMatch(/sahip olunan/i);
});

test('a Turkish original is not labelled as an unverified translation', async ({ page }) => {
  await page.goto('./?book=fadis-by-gulten-dayioglu');
  await expect(page.getByRole('heading', { name: 'Baskı bilgisi' })).toBeVisible();
  await expect(page.getByText(/Türkçe baskı doğrulanamadı/)).toHaveCount(0);
  await expect(page.getByText(/Özgün baskı · Amazon/)).toHaveCount(0);
});

test('page state lives in the URL and survives a reload', async ({ page }) => {
  await page.goto('./?page=5');
  await expect(page.locator('.pagination-page-status')).toContainText('5');
  await page.reload();
  await expect(page.locator('.pagination-page-status')).toContainText('5');
});

for (const colorScheme of ['light', 'dark']) {
  test(`no WCAG A/AA violations on the catalog and a book page (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    for (const path of ['./', './?book=good-to-great-by-jim-collins']) {
      await page.goto(path);
      await page.locator('.book-card').first().waitFor();
      if (path.includes('book=')) await page.locator('.reading-priority-card').waitFor();
      await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`));
      expect(violations, `${colorScheme} ${path}`).toEqual([]);
    }
    await context.close();
  });
}
