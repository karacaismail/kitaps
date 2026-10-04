import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID_COLUMNS, PAGE_SIZES } from '../src/library.js';

// The owner's fixed rule (AGENTS.md): the catalog grid has 2 columns on phones, 3 on
// tablets and 4 from desktop up, never more, and every page size fills a full page's
// last row. The browser test (tests/e2e/catalog-grid.spec.js) checks the real layout;
// this one keeps the stylesheet from handing the column count back to the browser.
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const GRID = /\.books-grid(?![\w-])/g;
const COLUMNS_DECLARATION = /--books-columns['"]?\s*:/g;
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Flat rules ("selector{declarations}") whose selector names the catalog grid.
const gridRules = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
 .filter(([, selector]) => selector.match(GRID))
 .map(([, selector, body]) => ({
  selector: selector.trim(),
  occurrences: selector.match(GRID).length,
  declarations: [...body.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map(([, name, value]) => [name.trim().toLowerCase(), value.trim()]),
 }));
const declared = name => gridRules.flatMap(rule => rule.declarations.filter(([key]) => key === name).map(([, value]) => ({ selector: rule.selector, value })));

test('every catalog grid rule is a flat rule the checks below can read', () => {
 // A nested block (for example a media query inside .books-grid{…}) would hide its
 // declarations from these checks, so it is not allowed.
 assert.ok(gridRules.length > 0, 'styles.css has no .books-grid rule');
 assert.equal(gridRules.reduce((sum, rule) => sum + rule.occurrences, 0), css.match(GRID).length);
});

test('the catalog grid takes its column count only from the owner’s list', () => {
 for (const { selector, declarations } of gridRules) {
  for (const [name, value] of declarations) {
   assert.ok(!['grid', 'grid-template', 'columns', 'column-count'].includes(name), `${selector}: ${name} would set the columns another way`);
   if (name === 'grid-template-columns') assert.equal(value, 'repeat(var(--books-columns),minmax(0,1fr))', selector);
  }
 }
 const counts = declared('--books-columns').map(({ selector, value }) => {
  assert.ok(GRID_COLUMNS.includes(Number(value)), `${selector}: --books-columns:${value}`);
  return Number(value);
 });
 assert.deepEqual([...new Set(counts)].sort(), [...GRID_COLUMNS].sort());
 assert.equal(Math.max(...counts), 4);
});

test('nothing outside the grid rules sets the column count', () => {
 assert.equal(css.match(COLUMNS_DECLARATION).length, declared('--books-columns').length, 'styles.css sets --books-columns outside a .books-grid rule');
 // Any other source that names the variable or the grid could set the count another way
 // (an inline style, setProperty, a second stylesheet). Comment-only lines do not count.
 const elsewhere = fs.readdirSync(SRC, { recursive: true })
  .filter(file => /\.(css|jsx?|tsx?)$/.test(file) && file !== 'styles.css')
  .filter(file => {
   const code = fs.readFileSync(path.join(SRC, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
   return code.includes('--books-columns') || (file.endsWith('.css') && new RegExp(GRID.source).test(code));
  });
 assert.deepEqual(elsewhere, []);
});

test('every page size fills a full page’s last row at every column count', () => {
 for (const size of PAGE_SIZES) for (const columns of GRID_COLUMNS) assert.equal(size % columns, 0, `${size} books in ${columns} columns`);
});
