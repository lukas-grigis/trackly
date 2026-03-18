import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes, goHome } from './helpers/session';

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Export Session', ['Alice', 'Bob']);
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    const url = page.url();
    const sessionId = url.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}/race/long_jump`);
    await expect(page.getByRole('button', { name: /Select all/i })).toBeVisible();
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.getByRole('button', { name: /Enter results/i }).click();
    await page.locator('input[type="number"]').first().fill('4.50');
    await page.getByRole('button', { name: /Save All/i }).click();
    await goHome(page);
  });

  test('CSV export triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('PDF export triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^PDF$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
