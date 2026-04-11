import { test, expect } from "@playwright/test";
import { resetApp, seedStandard } from "../helpers";

test.describe("Session list", () => {
  test("empty state shows no sessions message", async ({ page }) => {
    await resetApp(page);
    await page.goto("/#/sessions");
    await expect(page.getByText("No sessions yet")).toBeVisible();
  });

  test("session card shows name and athlete count", async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/sessions");
    await expect(page.getByText("Spring Meet 2026")).toBeVisible();
    await expect(page.getByText("3")).toBeVisible();
  });

  test("delete session dialog warns athletes remain", async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/sessions");
    await page.getByRole("button", { name: /delete/i }).click();
    await expect(page.getByText(/will remain/i)).toBeVisible();
  });

  test("clicking session card navigates to session page", async ({ page }) => {
    await seedStandard(page);
    await page.goto("/#/sessions");
    await page.getByText("Spring Meet 2026").click();
    await expect(page).toHaveURL(/\/#\/session\/session-1/);
  });
});
