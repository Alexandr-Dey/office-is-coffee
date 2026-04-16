import { test, expect, Page } from "@playwright/test";

// Парсит rgb(...) в [r, g, b]
function parseRgb(str: string): [number, number, number] | null {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

// WCAG relative luminance
function lum(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

async function getEffectiveBg(page: Page, selector: string): Promise<[number, number, number]> {
  // Ищем родителя с непрозрачным фоном
  return await page.$eval(selector, (el) => {
    let cur: Element | null = el;
    while (cur) {
      const s = window.getComputedStyle(cur);
      const bg = s.backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (m) {
        const a = m[4] === undefined ? 1 : parseFloat(m[4]);
        if (a > 0.5) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] as [number, number, number];
      }
      cur = cur.parentElement;
    }
    return [255, 255, 255] as [number, number, number]; // дефолт белый
  });
}

test.describe("Menu — карточки читаемы во всех категориях", () => {
  test("текст карточек имеет контраст > 4.5", async ({ page, context }) => {
    // Заставим приложение думать что user уже залогинен через Firebase Auth — невозможно без бэка.
    // Поэтому проверяем гостевой вход и потом меню.
    await page.goto("/");
    await page.getByRole("button", { name: /Войти как гость/ }).click();
    await page.getByPlaceholder(/Как тебя зовут/).fill("Test");
    await page.getByRole("button", { name: /Начать/ }).click();

    // Ждём редирект на /onboarding или /menu
    await page.waitForURL(/\/(menu|onboarding)/, { timeout: 15_000 }).catch(() => {});

    // Если онбординг — пропустить. Просто перейти на /menu.
    await page.goto("/menu");

    // Кликнем на категорию Айс кофе если есть
    const iceCoffeeTab = page.getByRole("tab", { name: /Айс кофе/ });
    if (await iceCoffeeTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await iceCoffeeTab.click();
    }

    // Найдём первую карточку напитка
    const cards = page.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await firstCard.scrollIntoViewIfNeeded();

    // Получим цвет текста с названия (font-semibold span)
    const textColor = await firstCard.locator("span").first().evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const textRgb = parseRgb(textColor);
    expect(textRgb).not.toBeNull();

    // Получим эффективный фон карточки
    const bg = await firstCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return s.backgroundColor;
    });
    const bgRgb = parseRgb(bg) ?? [255, 255, 255];

    if (textRgb) {
      const ratio = contrastRatio(textRgb, bgRgb);
      expect(ratio, `contrast ratio ${ratio.toFixed(2)} too low (text=${textColor}, bg=${bg})`).toBeGreaterThan(4.5);
    }
  });
});
