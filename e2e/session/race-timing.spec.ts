import { test, expect } from "@playwright/test";
import { seedStandard } from "../helpers";

test.describe("Race timing", () => {
  test.beforeEach(async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/session/session-1");
  });

  test("full sprint race: select all, start, tap athletes, save results", async ({ page }) => {
    await page.getByRole("button", { name: /Start race/i }).click();
    await page.getByRole("button", { name: /Select all/i }).click();
    await page.getByRole("button", { name: /None/i }).click();
    await page.getByRole("button", { name: /^Start$/i }).click();

    await expect(page.getByRole("button", { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /Alice/ }).click();
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /Bob/ }).click();
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /Charlie/ }).click();

    await expect(page.getByText("Race finished!")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /^Save$/i }).click();
    await expect(page).toHaveURL(/\/#\/session\/session-1/);
  });

  test("select all / deselect all toggle works", async ({ page }) => {
    await page.getByRole("button", { name: /Start race/i }).click();
    await page.getByRole("button", { name: /Select all/i }).click();
    await page.getByRole("button", { name: /Deselect all/i }).click();
    await expect(page.getByRole("button", { name: /Select all/i })).toBeVisible();
  });

  test("saved heat appears in heats tab", async ({ page }) => {
    await page.getByRole("button", { name: /Start race/i }).click();
    await page.getByRole("button", { name: /Select all/i }).click();
    await page.getByRole("button", { name: /None/i }).click();
    await page.getByRole("button", { name: /^Start$/i }).click();

    await expect(page.getByRole("button", { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /Alice/ }).click();
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /Bob/ }).click();
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /Charlie/ }).click();

    await expect(page.getByText("Race finished!")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /^Save$/i }).click();

    await page.getByText("Heats").click();
    await expect(page.getByText(/Heat 1/i)).toBeVisible();
    await expect(page.getByText("3/3")).toBeVisible();
  });
});
