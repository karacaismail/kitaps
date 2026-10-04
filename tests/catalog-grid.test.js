import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRID_COLUMNS, PAGE_SIZES } from '../src/library.js';

// The owner's fixed rule (AGENTS.md): the catalog grid has 2 columns on phones, 3 on
// tablets and 4 from desktop up, never more, and every page size fills the last row.
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const gridRules = [...css.matchAll(/([^{}]*\.books-grid[^{}]*)\{([^{}]*)\}/g)]
 .map(([, selector, body]) => ({ selector: selector.trim(), body }));
const columnCounts = gridRules
 .map(({ body }) => body.match(/--books-columns:\s*([^;}]+)/)?.[1]?.trim())
 .filter(Boolean);

test('the catalog grid takes its column count only from the owner’s list', () => {
 assert.ok(gridRules.length > 0, 'styles.css has no .books-grid rule');
 for (const { selector, body } of gridRules) {
  const template = body.match(/grid-template-columns:\s*([^;}]+)/)?.[1]?.trim();
  if (template) assert.equal(template, 'repeat(var(--books-columns),minmax(0,1fr))', selector);
 }
 for (const count of columnCounts) assert.ok(GRID_COLUMNS.includes(Number(count)), `--books-columns:${count}`);
 assert.deepEqual([...new Set(columnCounts.map(Number))].sort(), [...GRID_COLUMNS].sort());
 assert.equal(Math.max(...columnCounts.map(Number)), 4);
});

test('every page size fills the last row at every column count', () => {
 for (const size of PAGE_SIZES) for (const columns of GRID_COLUMNS) assert.equal(size % columns, 0, `${size} books in ${columns} columns`);
});
