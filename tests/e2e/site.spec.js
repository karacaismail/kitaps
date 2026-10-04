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
  const badge = page.locator('.reading-priority-badge').first();
  await expect(badge).toContainText('#1');
  // Only the score is set off by a divider; nothing is drawn before the rank.
  await expect(badge.locator('.priority-rank')).toHaveCSS('border-left-width', '0px');
  await expect(badge.locator('.priority-score')).toHaveCSS('border-left-width', '1px');
  await page.getByRole('combobox', { name: 'Sayfa başına kitap' }).click();
  await expect(page.getByRole('option')).toHaveText(['24 / sayfa', '48 / sayfa', '96 / sayfa', '192 / sayfa', '384 / sayfa']);
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
  // The live shared state could already mark this book; start from an empty one.
  await page.context().route('https://raw.githubusercontent.com/karacaismail/kitaps-state/**', route => route.fulfill({ json: { schemaVersion: 2, updatedAt: '1970-01-01T00:00:00.000Z', books: {}, queue: null } }));
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

test('the per-page control shows its whole label on a 320 px phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const page = await context.newPage();
  await page.goto('./?page-size=384');
  const control = page.getByRole('combobox', { name: 'Sayfa başına kitap' });
  await expect(control).toHaveValue('384 / sayfa');
  expect(await control.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await context.close();
});

test('the phone sheet grip shows its whole focus ring', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('./?book=good-to-great-by-jim-collins');
  const grip = page.locator('.sheet-grip');
  await expect(grip).toBeVisible();
  await page.keyboard.press('Shift');
  await grip.focus();
  // The ring must start inside the sheet, whose top edge clips anything above it.
  const clear = await grip.evaluate(element => {
    const style = getComputedStyle(element);
    const ringTop = element.getBoundingClientRect().top - parseFloat(style.outlineOffset) - parseFloat(style.outlineWidth);
    return element.matches(':focus-visible') && ringTop >= element.closest('.mantine-Drawer-content').getBoundingClientRect().top;
  });
  expect(clear).toBe(true);
  await context.close();
});

test('books can be filtered by the day they were added to the library', async ({ page }) => {
  const catalog = JSON.parse(readFileSync(new URL('../../src/catalog.json', import.meta.url), 'utf8'));
  const latest = catalog.books.map(book => book.addedAt).sort().at(-1);
  const count = catalog.books.filter(book => book.addedAt === latest).length;
  const label = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${latest}T00:00:00Z`));
  await page.goto(`./?added=${latest}`);
  await expect(page.locator('.results-heading [role="status"]')).toHaveText(new RegExp(`^${count} eser\\b`));
  await page.getByRole('button', { name: /^Filtreler/ }).click();
  await page.getByRole('button', { name: /Eklenme tarihi/ }).click();
  const option = page.getByRole('checkbox', { name: `${label} · ${count} kitap` });
  await expect(option).toBeChecked();
  // The hidden checkbox's keyboard focus is drawn on the whole option.
  await page.keyboard.press('Shift');
  await option.focus();
  await expect(page.locator('.filter-choice').filter({ has: option })).toHaveCSS('outline-style', 'solid');
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('.filter-sheet .mantine-Drawer-content') || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(item => item.id));
  expect(violations).toEqual([]);
  await page.keyboard.press('Escape');
  // The active day shows above the results and can be removed there.
  const chip = page.getByRole('button', { name: new RegExp(`Eklenme · ${label}`) });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.locator('.results-heading [role="status"]')).toHaveText(new RegExp(`^${catalog.books.length} eser\\b`));
  await expect(page).not.toHaveURL(/added=/);
  const book = catalog.books.find(item => item.addedAt === latest);
  await page.goto(`./?book=${book.id}`);
  await expect(page.locator('.detail-heading')).toContainText(`Kitaplığa eklendi · ${label}`);
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
