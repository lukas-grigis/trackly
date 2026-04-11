import { test, expect } from "@playwright/test";
import { resetApp } from "../helpers";

test.describe("PWA / Offline", () => {
  test("landing page renders without network errors", async ({ page }) => {
    await resetApp(page);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/#/");
    await expect(page.getByText("Open App").first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
