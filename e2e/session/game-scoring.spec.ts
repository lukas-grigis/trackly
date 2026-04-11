import { test, expect } from "@playwright/test";
import { seedStandard } from "../helpers";

test.describe("Game scoring", () => {
  test.beforeEach(async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/session/session-1");
    // Open discipline picker and switch to Football
    await page.getByRole("button", { name: /60m Sprint/ }).click();
    await page.getByRole("button", { name: /Games/i }).click();
    await page.getByRole("button", { name: /Football/i }).click();
  });

  test("football shows team name inputs and score UI", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /Team A/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Team B/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start race/i })).not.toBeVisible();
  });

  test("increment scores and save", async ({ page }) => {
    const incrementA = page.getByRole("button", { name: /Add point Team A/i });
    await incrementA.click();
    await incrementA.click();

    const incrementB = page.getByRole("button", { name: /Add point Team B/i });
    await incrementB.click();

    const scores = page.locator(".text-6xl");
    await expect(scores.first()).toHaveText("2");
    await expect(scores.last()).toHaveText("1");

    await page.getByRole("button", { name: /Save score/i }).click();

    // After saving, results appear in Heats tab
    await page.getByRole("button", { name: /Heats/i }).click();
    await expect(page.getByText("2:1")).toBeVisible();
  });

  test("decrement button reduces score", async ({ page }) => {
    const incrementA = page.getByRole("button", { name: /Add point Team A/i });
    await incrementA.click();
    await incrementA.click();

    const decrementA = page.getByRole("button", { name: /Remove point Team A/i });
    await decrementA.click();

    const scores = page.locator(".text-6xl");
    await expect(scores.first()).toHaveText("1");
  });
});
