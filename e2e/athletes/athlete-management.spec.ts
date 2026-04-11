import { test, expect } from "@playwright/test";
import { resetApp, seedStore, TEST_ATHLETES } from "../helpers";

test.describe("Athlete management", () => {
  test("add athlete with name", async ({ page }) => {
    await resetApp(page);
    await page.goto("/#/athletes");
    await page.getByRole("button", { name: /Add athlete/i }).first().click();
    const addDialog = page.getByRole("dialog");
    await addDialog.waitFor({ state: "visible" });
    await addDialog.getByPlaceholder("Name").fill("Max Mustermann");
    await addDialog.getByRole("button", { name: /Add athlete/i }).click();
    await expect(page.getByText("Max Mustermann")).toBeVisible();
  });

  test("edit athlete name updates in place", async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [] });
    await page.goto("/#/athletes");
    await page.getByRole("button", { name: /Edit athlete/i }).first().click();
    const editDialog = page.getByRole("dialog");
    await editDialog.waitFor({ state: "visible" });
    const nameInput = editDialog.getByPlaceholder("Name");
    await nameInput.clear();
    await nameInput.fill("Updated Name");
    await editDialog.getByRole("button", { name: /^Save$/i }).click();
    await expect(page.getByText("Updated Name")).toBeVisible();
  });

  test("delete athlete removes from roster", async ({ page }) => {
    await seedStore(page, { athletes: TEST_ATHLETES, sessions: [] });
    await page.goto("/#/athletes");
    const name = await page.locator("ul li").first().innerText();
    await page.getByRole("button", { name: /Remove athlete/i }).first().click();
    // Confirm in dialog
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Remove athlete/i }).click();
  });
});
