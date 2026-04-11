import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

test.describe('Field events', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Field Session', ['Charlie', 'Dana']);
  });

  test('long jump shows Enter results button, not Start race', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    // For distance disciplines, the session page shows an inline entry form instead of "Start race"
    await expect(page.getByRole('button', { name: /Start race/i })).not.toBeVisible();
    // The inline form shows athlete chips and a Save button (not a "Start race" navigation button)
    await expect(page.locator('text=Enter result')).toBeVisible();
  });

  test('distance result persists across page reload', async ({ page }) => {
    // Select long_jump discipline
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();

    // Select Charlie and enter a distance
    await page.getByRole('button', { name: /Charlie/ }).click();
    await page.locator('input[type="number"]').fill('3.52');
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Verify result appears in rankings view
    await expect(page.getByText('3.52m')).toBeVisible();

    // Full page reload to test localStorage persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Re-select long_jump discipline (state resets after reload)
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();

    // Verify result still present after reload
    await expect(page.getByText('3.52m')).toBeVisible();
  });

  test('ranking with ties shows competition ranking 1,1,3', async ({ page }) => {
    // Need a third athlete
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Add athlete/i }).first().click();
    const addDialog = page.getByRole('dialog');
    await addDialog.waitFor({ state: 'visible' });
    await addDialog.getByPlaceholder('Name').fill('Eve');
    await addDialog.getByRole('button', { name: /Add athlete/i }).click();
    await expect(page.getByText('Eve')).toBeVisible();

    // Navigate back to session and add Eve
    await page.goto('/#/sessions');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Field Session').click();

    // Add Eve to session
    await page.getByRole('button', { name: /Select athletes/i }).click();
    await page.locator('button').filter({ hasText: 'Eve' }).click();
    await page.getByRole('button', { name: /^Done$/i }).click();

    // Select long_jump
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();

    // Enter same value for Charlie and Dana (tied), lower for Eve
    await page.getByRole('button', { name: /Charlie/ }).click();
    await page.locator('input[type="number"]').fill('4.00');
    await page.getByRole('button', { name: /^Save$/i }).click();

    await page.getByRole('button', { name: /Dana/ }).click();
    await page.locator('input[type="number"]').fill('4.00');
    await page.getByRole('button', { name: /^Save$/i }).click();

    await page.getByRole('button', { name: /Eve/ }).click();
    await page.locator('input[type="number"]').fill('3.50');
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Switch to All Runs view to see per-result ranking
    await page.getByRole('button', { name: /All Runs/i }).click();

    // Verify competition ranking: 1, 1, 3 (not 1, 2, 3)
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    // First two should have rank 1 (tied at 4.00m)
    const rankCells = rows.locator('td:first-child');
    await expect(rankCells.nth(0)).toHaveText('1');
    await expect(rankCells.nth(1)).toHaveText('1');
    await expect(rankCells.nth(2)).toHaveText('3');
  });

  test('custom discipline note has title tooltip in All Runs view', async ({ page }) => {
    // Open discipline picker and select custom discipline
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();

    // Enter a custom discipline name in the custom input and confirm
    const customInput = page.getByLabel('Enter discipline name');
    await customInput.fill('Obstacle Run');
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Wait for the discipline picker dialog to close and custom entry form to appear
    await expect(page.getByPlaceholder('Optional note')).toBeVisible();

    // Select an athlete using the entry form button (not the header chip)
    await page.locator('button[type="button"]').filter({ hasText: 'Charlie' }).click();

    // Fill in a value
    await page.locator('input[type="number"]').fill('25');

    // Fill in a note
    await page.getByPlaceholder('Optional note').fill('Fastest attempt with wind');

    // Save the result (click the Save button inside the entry form, not the dialog)
    await page
      .locator('.rounded-xl.border.bg-card')
      .getByRole('button', { name: /^Save$/i })
      .click();

    // Switch to All Games view (custom disciplines use "Games" terminology)
    await page.getByRole('button', { name: /All Games/i }).click();

    // Verify the note cell has a title attribute with the note text
    const noteCell = page.locator('td.truncate');
    await expect(noteCell).toBeVisible();
    await expect(noteCell).toHaveAttribute('title', 'Fastest attempt with wind');
  });

  test('custom discipline unit buttons have aria-labels on RacePage', async ({ page }) => {
    // Navigate to RacePage with a custom discipline
    const url = page.url();
    const sessionId = url.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}/race/custom`);

    // Select all athletes and start field entry
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /^Start$/i }).click();

    // Verify unit selection buttons are visible and have aria-labels
    for (const unit of ['m', 'cm', 's', 'ms']) {
      const button = page.getByRole('button', { name: unit, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('aria-label', unit);
    }
  });

  test('field entry UI: enter attempt and mark foul, best highlighted', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    // Navigate to RacePage for field entry flow (session page uses inline form for distance mode,
    // but the full field-entry UI with attempts/fouls is on the RacePage)
    const url = page.url();
    const sessionId = url.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}/race/long_jump`);
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /Enter results/i }).click();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('Dana')).toBeVisible();
    const attemptInputs = page.locator('input[type="number"]');
    await attemptInputs.first().fill('4.52');
    const foulButtons = page.getByRole('button', { name: /^Foul$/i });
    await foulButtons.last().click();
    await expect(page.locator('text=Foul').first()).toBeVisible();
    await expect(page.getByText('Best')).toBeVisible();
  });
});
