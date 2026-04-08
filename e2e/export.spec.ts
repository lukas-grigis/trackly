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

  test('PDF filename preserves non-Latin characters', async ({ page }) => {
    // Create a session with Cyrillic name and add a field event result
    await resetApp(page);
    await createSessionWithAthletes(page, 'Тест Сессия', ['Alice']);
    // Navigate to long jump via discipline picker
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
    await page.locator('input[type="number"]').first().fill('3.20');
    await page.getByRole('button', { name: /Save All/i }).click();
    await goHome(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^PDF$/i }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    // Filename should contain the Cyrillic characters (not stripped to empty)
    expect(filename).toMatch(/trackly-тест-сессия-/);
    expect(filename).toMatch(/\.pdf$/);
  });

  test('CSV with team-game results uses team name, not raw ID', async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Game Session', ['Alice']);
    // Navigate to football via discipline picker
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(4).click();
    await page.getByRole('button', { name: 'Football' }).click();
    // Increment Team A score and save
    const incrementA = page.getByRole('button', { name: /Add point Team A/i });
    await incrementA.click();
    await incrementA.click();
    await page.getByRole('button', { name: /Save score/i }).click();
    await goHome(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /CSV/i }).click();
    const download = await downloadPromise;
    // Read CSV content
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const csv = Buffer.concat(chunks).toString('utf-8');
    // Should contain team name (e.g. "Team A"), not raw ID "team-a"
    expect(csv).not.toContain('team-a');
    expect(csv).not.toContain('team-b');
  });

  test('PDF export button is disabled when session has no heats', async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Empty Session', ['Alice']);
    await goHome(page);
    const pdfButton = page.getByRole('button', { name: /^PDF$/i });
    await expect(pdfButton).toBeDisabled();
  });
});
