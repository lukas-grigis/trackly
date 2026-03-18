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
