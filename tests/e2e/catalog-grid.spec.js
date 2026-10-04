import { test, expect } from '@playwright/test';

// The owner's fixed rule (AGENTS.md): the catalog shows 2 columns on phones, 3 on tablets
// and 4 from desktop up, never 5, and a full page of 24 books ends on a full row.
const LAYOUTS = [[320, 2], [360, 2], [375, 2], [390, 2], [575, 2], [576, 3], [768, 3], [895, 3], [896, 4], [1024, 4], [1152, 4], [1280, 4], [1440, 4], [1920, 4], [2560, 4]];

test('the catalog grid keeps the owner’s column counts and a full last row at every width', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.books-grid > .book-card')).toHaveCount(24);
  for (const [width, columns] of LAYOUTS) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.locator('.books-grid').evaluate(grid => {
      const boxes = [...grid.children].map(card => card.getBoundingClientRect());
      const tops = boxes.map(box => Math.round(box.top));
      const lastTop = Math.max(...tops);
      return {
        tracks: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        columns: new Set(boxes.map(box => Math.round(box.left))).size,
        lastRow: tops.filter(top => top === lastTop).length,
      };
    });
    expect(layout, `${width}px wide`).toEqual({ tracks: columns, columns, lastRow: columns });
  }
});
