import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and display the OiC landing page", async ({ page }) => {
    await page.goto("/");

    // Verify the page title
    await expect(page).toHaveTitle(/Office is Coffee/);

    // Verify the main heading is visible
    await expect(
      page.getByRole("heading", { name: /Your Office Runs on Coffee/i })
    ).toBeVisible();

    // Verify the OiC logo/brand is present
    await expect(page.getByText("OiC")).toBeVisible();

    // Verify key CTA buttons exist
    await expect(page.getByRole("button", { name: /Get Early Access/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Waitlist/i })).toBeVisible();

    // Verify feature cards are rendered
    await expect(page.getByText("Group Orders")).toBeVisible();
    await expect(page.getByText("Coffee Buddies")).toBeVisible();
    await expect(page.getByText("Office Stats")).toBeVisible();
    await expect(page.getByText("Smart Recommendations")).toBeVisible();

    // Verify footer
    await expect(page.getByText("Office is Coffee")).toBeVisible();
  });

  test("should have no console errors on load", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) => !e.includes("mixpanel") && !e.includes("sentry") && !e.includes("firebase")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
