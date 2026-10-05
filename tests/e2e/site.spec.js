import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const axeSource = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const EMPTY_STATE = { schemaVersion: 2, updatedAt: '1970-01-01T00:00:00.000Z', books: {}, queue: null };
const LARGE_TEXT = 'html{font-size:200%}';
const consoleErrors = page => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
};
// The live shared reading state must not decide what a test sees. Pages read it from the
// CDN and, on opening, from the API; both answer with an empty state here.
const isolate = context => Promise.all([
  context.route('https://raw.githubusercontent.com/karacaismail/kitaps-state/**', route => route.fulfill({ json: EMPTY_STATE })),
  context.route('https://api.github.com/repos/karacaismail/kitaps-state/**', route => route.fulfill({ json: { sha: 'empty', encoding: 'base64', content: Buffer.from(JSON.stringify(EMPTY_STATE)).toString('base64') } })),
]);
const pageFits = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
// The matches of `roots`, and every element inside them, whose content runs out of their own box.
// Form fields are not judged by their own text: they scroll it, or in WebKit a date field may let it
// run over (a known limit with wide fonts), so they are clipped while measuring. The cover marks
// overhang the cover on purpose, so they are pulled in.
const spilling = roots => roots.evaluateAll(elements => {
  const pullIn = document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '.cover-marks{right:0!important} input,textarea,select{overflow:hidden!important}' }));
  const found = elements.flatMap(element => [element, ...element.querySelectorAll('*')])
    .filter(node => !node.matches('input, textarea, select') && getComputedStyle(node).overflowX === 'visible' && node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1)
    .map(node => `${node.className} "${node.textContent.trim().slice(0, 40)}"`);
  pullIn.remove();
  return found;
});

test('the shared state is read from GitHub in a real browser, without CORS errors', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./?view=notes');
  await expect(page.getByText(/GitHub durumu salt okunur olarak güncel|Değişiklikler cihazda kuyrukta/)).toBeVisible({ timeout: 20_000 });
  expect(errors.filter(text => /CORS|Access-Control|Failed to fetch/i.test(text))).toEqual([]);
});

test('the catalog opens sorted by reading priority with the compact summary', async ({ page }) => {
  const errors = consoleErrors(page);
  // GitHub's anonymous request limit must not decide whether the console stays clean.
  await isolate(page.context());
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
  await isolate(page.context());
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

// WCAG 1.4.4 and 1.4.10: with the root text doubled, a 320 px phone scrolls the catalog only vertically.
test('the catalog reflows at 320 px with 200% text', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
  await isolate(context);
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.locator('.book-card')).toHaveCount(24);
  await page.addStyleTag({ content: LARGE_TEXT });
  expect(await pageFits(page), 'horizontal overflow').toBe(true);
  expect(await spilling(page.locator('.catalog-pagination, .books-grid'))).toEqual([]);
  expect(await page.locator('.main-tabs').evaluate(list => list.scrollWidth <= list.clientWidth), 'a section tab is out of view').toBe(true);
  // The per-page control is as wide as its label, and every pagination control keeps a 44 px target.
  const perPage = page.getByRole('combobox', { name: 'Sayfa başına kitap' });
  expect(await perPage.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  for (const control of await page.locator('.catalog-pagination :is(a, button, input):visible').all()) {
    const box = await control.boundingBox();
    expect(Math.min(box.width, box.height), await control.evaluate(element => element.getAttribute('aria-label') || element.textContent)).toBeGreaterThanOrEqual(44);
  }
  const onScreen = async locator => {
    const box = await locator.boundingBox();
    return box.x >= 0 && box.x + box.width <= 320;
  };
  // A tooltip wraps on the screen instead of running past it.
  await page.locator('.book-card .reading-priority-badge').first().hover();
  const tooltip = page.locator('.mantine-Tooltip-tooltip');
  await expect(tooltip).toBeVisible();
  expect(await onScreen(tooltip)).toBe(true);
  expect(await pageFits(page), 'horizontal overflow with a tooltip').toBe(true);
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
  // The purchase toast keeps its close button on the screen.
  await page.locator('.book-card .cover-owned').first().click();
  const toast = page.locator('.library-toast');
  await expect(toast).toBeVisible();
  expect(await onScreen(toast.getByRole('button', { name: 'Bildirimi kapat' }))).toBe(true);
  expect(await spilling(toast)).toEqual([]);
  await toast.getByRole('button', { name: 'Bildirimi kapat' }).click();
  // The page jump opens inside the screen and wraps its field and button.
  await page.getByRole('button', { name: 'Sayfaya git' }).click();
  const jump = page.locator('.mantine-Popover-dropdown').filter({ has: page.locator('.pagination-jump') });
  await expect(jump).toBeVisible();
  expect(await onScreen(jump)).toBe(true);
  expect(await spilling(jump)).toEqual([]);
  await page.keyboard.press('Escape');
  // The longest page size shows its whole label too. It is chosen with the keyboard: a pointer
  // click can miss an option while the dropdown above the field is still being placed.
  await perPage.focus();
  await page.keyboard.press('ArrowDown');
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  const longest = (await options.last().textContent()).trim();
  for (let step = await options.count(); step > 1; step--) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(perPage).toHaveValue(longest);
  await expect(page).toHaveURL(/page-size=/);
  expect(await perPage.evaluate(element => element.scrollWidth <= element.clientWidth), await perPage.inputValue()).toBe(true);
  // A search without results keeps its button on the screen too.
  await page.goto('./?q=zzzz');
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.addStyleTag({ content: LARGE_TEXT });
  expect(await pageFits(page), 'horizontal overflow without results').toBe(true);
  expect(await spilling(page.locator('.empty-state'))).toEqual([]);
  await context.close();
});

// The Kümeler tab with enlarged text. The wide font stands in for the Linux UI fonts on CI; where
// Verdana is missing it falls back to the default sans, which is wide as well.
test.describe('the Kümeler tab', () => {
  const fonts = { 'system UI font': false, 'wide font': true };
  const useFont = (page, wide) => page.evaluate(on => document.documentElement.toggleAttribute('data-wide-font', on), wide);
  const WIDE_FONT = ':root[data-wide-font]{--sans:Verdana,sans-serif!important;--mantine-font-family:Verdana,sans-serif!important}';
  // Mantine's button and accordion labels hide what runs past them, so text cut off there is not overflow.
  const clipped = root => root.evaluate(element => {
    const found = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(text);
      const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
      for (let box = text.parentElement; box !== element.parentElement; box = box.parentElement) {
        const style = getComputedStyle(box);
        if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
        const outer = box.getBoundingClientRect();
        const left = outer.left + box.clientLeft, top = outer.top + box.clientTop;
        if (rects.some(rect => rect.left < left - 1 || rect.right > left + box.clientWidth + 1 || rect.top < top - 1 || rect.bottom > top + box.clientHeight + 1)) {
          found.push(text.data.trim());
          break;
        }
      }
    }
    return found;
  });
  // Words broken across lines although they would fit on one: no wider than their closest `line` box,
  // or than any line when none is given. Hyphens, dashes and slashes are ordinary break points.
  const brokenWords = (texts, line) => texts.evaluateAll((elements, line) => elements.flatMap(element => {
    const width = line ? element.closest(line).clientWidth : Infinity;
    const found = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      for (const word of text.data.matchAll(/[^\s/\u2010-\u2014-]+/g)) {
        const range = document.createRange();
        range.setStart(text, word.index);
        range.setEnd(text, word.index + word[0].length);
        const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
        if (new Set(rects.map(rect => Math.round(rect.top))).size > 1 && rects.reduce((sum, rect) => sum + rect.width, 0) <= width) found.push(word[0]);
      }
    }
    return found;
  }), line);
  const smallTargets = root => root.locator('button').evaluateAll(buttons => buttons
    .filter(button => button.getClientRects().length)
    .filter(button => Math.min(button.offsetWidth, button.offsetHeight) < 44)
    .map(button => `${button.textContent.trim()} ${button.offsetWidth}×${button.offsetHeight}`));

  // Each collection is opened in turn and checked in both fonts. With 29 collections this is slow on
  // CI's WebKit phone profile, hence the longer time limit.
  test('the collections reflow at 320 px with 200% text', async ({ browser }) => {
    test.slow();
    const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
    await isolate(context);
    const page = await context.newPage();
    await page.goto('./?view=collections');
    const accordion = page.locator('.collections-accordion');
    const items = accordion.locator('.mantine-Accordion-item');
    await expect(items.first()).toBeVisible();
    await page.addStyleTag({ content: LARGE_TEXT });
    await page.addStyleTag({ content: WIDE_FONT });
    // Mantine animates a panel's height for 200 ms and drops its fixed height when the transition
    // ends. A 1 ms transition keeps those steps, so the panels open the same way, only faster.
    await page.addStyleTag({ content: '.collections-accordion .mantine-Accordion-panel{transition-duration:1ms!important}' });
    for (const [font, wide] of Object.entries(fonts)) {
      await useFont(page, wide);
      expect(await pageFits(page), `${font}: horizontal overflow`).toBe(true);
      expect(await spilling(accordion), font).toEqual([]);
      expect(await clipped(accordion), font).toEqual([]);
      // Once a title would have too little room beside its mark, the mark moves above it.
      expect(await brokenWords(accordion.locator('.mantine-Accordion-control p'), '.mantine-Accordion-label'), font).toEqual([]);
    }
    for (let index = 0; index < await items.count(); index++) {
      const item = items.nth(index);
      const control = item.locator('.mantine-Accordion-control');
      const panel = item.locator('.mantine-Accordion-panel');
      // Opened from the keyboard, so the sticky header, tall at 200%, never takes the pointer's click.
      await control.focus();
      await page.keyboard.press('Enter');
      await expect(control).toHaveAttribute('aria-expanded', 'true');
      // The panel has finished opening once Mantine drops its fixed height and hidden overflow.
      await expect.poll(() => panel.evaluate(element => getComputedStyle(element).overflow), { intervals: [20] }).toBe('visible');
      for (const [font, wide] of Object.entries(fonts)) {
        await useFont(page, wide);
        const name = `${font}, collection ${index + 1}`;
        expect(await pageFits(page), `${name}: horizontal overflow`).toBe(true);
        expect(await spilling(item), name).toEqual([]);
        expect(await clipped(item), name).toEqual([]);
        expect(await smallTargets(item), name).toEqual([]);
        expect(await brokenWords(panel.locator('.mantine-Button-label'), '.mantine-Button-label'), name).toEqual([]);
        // The main button keeps its default side insets, so even "kümedeki" stays whole.
        expect(await brokenWords(item.getByRole('button', { name: 'Bu kümedeki kitaplar' }).locator('.mantine-Button-label')), name).toEqual([]);
      }
    }
    await context.close();
  });

  // The mark moves above a title only when the title would have less than 8em beside it: never at
  // 100% or 125% text on a 320 px phone, and at 200% text below 482 px.
  test('collection titles keep whole words beside their mark up to 200% text', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
    await isolate(context);
    const page = await context.newPage();
    await page.goto('./?view=collections');
    const accordion = page.locator('.collections-accordion');
    await expect(accordion.locator('.mantine-Accordion-item').first()).toBeVisible();
    await page.addStyleTag({ content: WIDE_FONT });
    const markAbove = () => accordion.locator('.mantine-Accordion-label').first().evaluate(label => {
      const [mark, title] = label.querySelector('.mantine-Group-root').children;
      return title.getBoundingClientRect().top >= mark.getBoundingClientRect().bottom;
    });
    for (const [size, width, above] of [['100%', 320, false], ['125%', 320, false], ['200%', 481, true], ['200%', 482, false], ['200%', 483, false]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      for (const [font, wide] of Object.entries(fonts)) {
        await useFont(page, wide);
        const name = `${size} text, ${width} px, ${font}`;
        expect(await markAbove(), name).toBe(above);
        expect(await pageFits(page), `${name}: horizontal overflow`).toBe(true);
        expect(await brokenWords(accordion.locator('.mantine-Accordion-control p'), '.mantine-Accordion-label'), name).toEqual([]);
      }
    }
    await context.close();
  });
});

// The page numbers replace the compact "Sayfa x / y" only when the bar has room for them at the current text size.
// At the default size the bar switches at 400 and 640 px screens; that assumes the 8 px phone
// gutter and overlay scrollbars, as in headless browsers.
test('page numbers appear only when the pagination has room for them', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 400, height: 900 } });
  await isolate(context);
  const page = await context.newPage();
  await page.goto('./');
  const chevron = page.getByRole('button', { name: 'Sayfaya git' }).locator('.mantine-Button-section');
  const numbers = page.locator('.pagination-desktop');
  const compact = page.locator('.pagination-mobile');
  await expect(chevron).toBeHidden();
  await page.setViewportSize({ width: 401, height: 900 });
  await expect(chevron).toBeVisible();
  await page.setViewportSize({ width: 639, height: 900 });
  await expect(compact).toBeVisible();
  await expect(numbers).toBeHidden();
  await page.setViewportSize({ width: 640, height: 900 });
  await expect(numbers).toBeVisible();
  await expect(compact).toBeHidden();
  // With 150% text a 1280 px screen still has room for the page numbers.
  await page.addStyleTag({ content: 'html{font-size:150%}' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(numbers).toBeVisible();
  expect(await pageFits(page), '1280 px, 150% text').toBe(true);
  expect(await spilling(page.locator('.catalog-pagination')), '1280 px, 150% text').toEqual([]);
  await page.addStyleTag({ content: LARGE_TEXT });
  for (const width of [640, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await pageFits(page), `${width} px, 200% text`).toBe(true);
    expect(await spilling(page.locator('.catalog-pagination')), `${width} px, 200% text`).toEqual([]);
  }
  await context.close();
});

test('the book sheet keeps its text inside its boxes at 320 px with 200% text', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
  await isolate(context);
  const page = await context.newPage();
  for (const book of ['good-to-great-by-jim-collins', 'fadis-by-gulten-dayioglu']) {
    await page.goto(`./?book=${book}`);
    const sheet = page.locator('.mantine-Drawer-content');
    await expect(sheet.locator('.reading-priority-card')).toBeVisible();
    // Open every section one at a time. One sits inside another's panel and shows only once that
    // panel opens, and a click on a section that is still moving can be lost, so each click is
    // repeated until its own section reports it is open.
    const controls = sheet.locator('.mantine-Accordion-control');
    for (let index = 0; index < await controls.count(); index++) {
      const control = controls.nth(index);
      await expect(async () => {
        if (await control.getAttribute('aria-expanded') === 'false') await control.click({ timeout: 2_000 });
        await expect(control).toHaveAttribute('aria-expanded', 'true', { timeout: 1_000 });
      }).toPass({ timeout: 15_000 });
    }
    await expect(sheet.locator('.mantine-Accordion-control[aria-expanded="false"]')).toHaveCount(0);
    await page.addStyleTag({ content: LARGE_TEXT });
    // The sheet scrolls on its own, so it is checked apart from the page.
    expect(await sheet.evaluate(element => element.scrollWidth <= element.clientWidth), `${book}: the sheet scrolls sideways`).toBe(true);
    expect(await spilling(sheet.locator('.reading-priority-card, .detail-sections')), book).toEqual([]);
  }
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
