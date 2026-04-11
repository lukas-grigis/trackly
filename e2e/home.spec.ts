import { test, expect } from '@playwright/test';
import { resetApp, goHome } from './helpers/session';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
  });

  test('empty state shows no sessions message', async ({ page }) => {
    await expect(page.getByText('No sessions yet')).toBeVisible();
  });

  test('create session form requires name', async ({ page }) => {
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    await page.getByRole('button', { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/sessions/);
  });

  test('date defaults to today', async ({ page }) => {
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    const today = new Date().toISOString().slice(0, 10);
    await expect(page.locator('#session-date')).toHaveValue(today);
  });

  test('after creating session navigates to session page', async ({ page }) => {
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    await page.locator('#session-name').fill('Test Session');
    await page.getByRole('button', { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);
    await expect(page.getByText('Test Session')).toBeVisible();
  });

  test('session card shows name on home page', async ({ page }) => {
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    await page.locator('#session-name').fill('Card Display Test');
    await page.getByRole('button', { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);
    await goHome(page);
    await expect(page.getByText('Card Display Test')).toBeVisible();
  });

  test('export PDF button is disabled when session has no heats', async ({ page }) => {
    // First add an athlete so the PDF button appears (it requires athleteIds.length > 0)
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Add athlete/i }).first().click();
    const addDialog = page.getByRole('dialog');
    await addDialog.waitFor({ state: 'visible' });
    await addDialog.getByPlaceholder('Name').fill('TestAthlete');
    await addDialog.getByRole('button', { name: /Add athlete/i }).click();
    await expect(page.getByText('TestAthlete')).toBeVisible();

    // Create a session (auto-selects all athletes)
    await goHome(page);
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    await page.locator('#session-name').fill('Export Test');
    await page.getByRole('button', { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);

    // Navigate back to home to see the session card
    await goHome(page);
    await expect(page.getByText('Export Test')).toBeVisible();

    // PDF button should be visible but disabled (no heats yet)
    const pdfButton = page.getByRole('button', { name: /^PDF$/i });
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toBeDisabled();

    // CSV button should NOT be visible (no results at all)
    await expect(page.getByRole('button', { name: /^CSV$/i })).not.toBeVisible();
  });
});
