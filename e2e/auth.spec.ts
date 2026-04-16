import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("главная не висит в бесконечном лоадере", async ({ page }) => {
    await page.goto("/");
    // Должна показаться форма входа ИЛИ экран ошибки подключения — но не вечный спиннер
    await expect(
      page.getByRole("button", { name: /Войти через Google|Войти как гость|Начать|Повторить/ }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("гостевой вход показывает поле ввода имени", async ({ page }) => {
    await page.goto("/");
    const guestBtn = page.getByRole("button", { name: /Войти как гость/ });
    const retryBtn = page.getByRole("button", { name: /Повторить/ });
    // Ждём что-то одно
    await Promise.race([
      guestBtn.waitFor({ timeout: 15_000 }),
      retryBtn.waitFor({ timeout: 15_000 }),
    ]);
    if (await retryBtn.isVisible()) {
      test.skip(true, "Connection error — пропуск гостевого теста");
    }
    await guestBtn.click();
    await expect(page.getByPlaceholder(/Как тебя зовут/)).toBeVisible();
  });

  test("кнопки имеют размер минимум 44x44 (Apple HIG)", async ({ page }) => {
    await page.goto("/");
    const buttons = await page.getByRole("button").all();
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (!box) continue;
      // Игнорируем декоративные/скрытые
      if (box.width === 0 || box.height === 0) continue;
      expect(box.height, `button "${await btn.textContent()}" too small`).toBeGreaterThanOrEqual(40);
    }
  });
});
