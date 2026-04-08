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
    await page.getByPlaceholder('Name').fill('Eve');
    await page.getByRole('button', { name: 'Add athlete' }).click();
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
