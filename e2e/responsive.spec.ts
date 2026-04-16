import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "iphone-se", w: 375, h: 812 },
  { name: "iphone-11", w: 414, h: 896 },
  { name: "desktop", w: 1280, h: 800 },
];

const ROUTES = ["/"];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`${route} на ${vp.name} — нет горизонтального скролла`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});

      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });

      expect(
        overflow.scrollWidth,
        `horizontal scroll: ${overflow.scrollWidth} > ${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
}
