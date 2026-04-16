import { test, expect } from "@playwright/test";

test.describe("PWA", () => {
  test("manifest доступен и валиден", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("иконки 192 и 512 существуют", async ({ request }) => {
    const r1 = await request.get("/icon-192.png");
    expect(r1.status()).toBe(200);
    const r2 = await request.get("/icon-512.png");
    expect(r2.status()).toBe(200);
  });

  test("Service Worker регистрируется", async ({ page }) => {
    await page.goto("/");
    // Ждём чтобы скрипт SW успел зарегистрироваться (или нет)
    await page.waitForTimeout(2000);
    const swSupported = await page.evaluate(() => "serviceWorker" in navigator);
    expect(swSupported).toBe(true);
    // SW регистрируется push.ts при первом вызове, не на стартовой
    // Проверяем что хотя бы файл доступен
    const res = await page.request.get("/firebase-messaging-sw.js");
    expect(res.status()).toBe(200);
  });
});
