import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'LB Session', ['Alice', 'Bob']);
    await page.getByRole('button', { name: /Start race/i }).click();
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /^None$/i }).click();
    await page.getByRole('button', { name: /^Start$/i }).click();
    await expect(page.getByRole('button', { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.getByRole('button', { name: /Bob/ }).click();
    await expect(page.getByText('Race finished!')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /^Save$/i }).click();
    await page
      .getByRole('link', { name: /Leaderboard/i })
      .or(page.getByRole('button', { name: /Leaderboard/i }))
      .first()
      .click();
    await expect(page).toHaveURL(/\/leaderboard/);
    // Wait for leaderboard content to be fully rendered before any test assertions
    await expect(page.getByRole('button', { name: /TV Mode/i })).toBeVisible({ timeout: 5000 });
  });

  test('shows discipline section with athletes', async ({ page }) => {
    await expect(page.getByText('60m Sprint', { exact: true })).toBeVisible();
    await expect(page.getByText('Alice', { exact: true })).toBeVisible();
    await expect(page.getByText('Bob', { exact: true })).toBeVisible();
  });

  test('TV mode button exists', async ({ page }) => {
    await expect(page.getByRole('button', { name: /TV Mode/i })).toBeVisible();
  });

  test('age group filter hidden when no birth years', async ({ page }) => {
    await expect(page.getByText('Age group')).not.toBeVisible();
  });
});
