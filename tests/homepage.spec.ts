import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load without crashing", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    // Page should return 200
    expect(response?.status()).toBe(200);

    // Body should render
    await expect(page.locator("body")).not.toBeEmpty({ timeout: 10000 });
  });

  test("should have no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("mixpanel") &&
        !e.includes("sentry") &&
        !e.includes("firebase") &&
        !e.includes("auth/invalid-api-key") &&
        !e.includes("Failed to fetch") &&
        !e.includes("api-key")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("404 page should render", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz", { waitUntil: "domcontentloaded" });

    // Should show 404 content
    await expect(page.locator("text=404")).toBeVisible({ timeout: 10000 });
  });
});
