import { test, expect } from "@playwright/test";
import { seedStore, TEST_ATHLETES } from "../helpers";

test.describe("Create session", () => {
  test.beforeEach(async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [] });
    await page.goto("/#/sessions");
  });

  test("date defaults to today", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).first().click();
    const today = new Date().toISOString().slice(0, 10);
    await expect(page.locator("#session-date")).toHaveValue(today);
  });

  test("creating session navigates to session page", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).first().click();
    await page.locator("#session-name").fill("Test Session");
    await page.getByRole("button", { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);
    await expect(page.getByText("Test Session")).toBeVisible();
  });

  test("form requires a session name", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).first().click();
    await page.getByRole("button", { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/sessions/);
  });
});
