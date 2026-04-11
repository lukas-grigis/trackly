import { test, expect } from "@playwright/test";
import { seedStandard } from "../helpers";

test.describe("Field events", () => {
  test.beforeEach(async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/session/session-1");
    // Open discipline picker and switch to Long Jump
    await page.getByRole("button", { name: /60m Sprint/ }).click();
    await page.getByRole("button", { name: /Jumping/i }).click();
    await page.getByRole("button", { name: /Long Jump/i }).click();
  });

  test("distance discipline shows Enter result text, not Start Race button", async ({ page }) => {
    await expect(page.getByText("Enter result")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start race/i })).not.toBeVisible();
  });

  test("athlete buttons visible for field entry", async ({ page }) => {
    // For distance disciplines, athletes are shown as buttons for inline entry
    await expect(page.getByRole("button", { name: /Alice/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bob/i })).toBeVisible();
  });
});
