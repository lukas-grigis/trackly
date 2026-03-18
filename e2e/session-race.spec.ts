import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

test.describe('Session race flow', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Sprint Session', ['Alice', 'Bob']);
  });

  test('full sprint race flow: select all, start, tap, ranked results, save', async ({ page }) => {
    await page.getByRole('button', { name: /Start race/i }).click();
    await expect(page.getByText('Prepare race')).toBeVisible();
    await expect(page.getByText('60m Sprint')).toBeVisible();
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /^None$/i }).click();
    await page.getByRole('button', { name: /^Start$/i }).click();
    await expect(page.getByRole('button', { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.getByRole('button', { name: /Bob/ }).click();
    await expect(page.getByText('Race finished!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);
  });

  test('View Leaderboard navigates to leaderboard after race', async ({ page }) => {
    await page.getByRole('button', { name: /Start race/i }).click();
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /^None$/i }).click();
    await page.getByRole('button', { name: /^Start$/i }).click();
    await expect(page.getByRole('button', { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.getByRole('button', { name: /Bob/ }).click();
    await expect(page.getByText('Race finished!')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /View Leaderboard/i }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test('heats tab shows saved heat with athlete count', async ({ page }) => {
    await page.getByRole('button', { name: /Start race/i }).click();
    await page.getByRole('button', { name: /Select all/i }).click();
    await page.getByRole('button', { name: /^None$/i }).click();
    await page.getByRole('button', { name: /^Start$/i }).click();
    await expect(page.getByRole('button', { name: /Alice/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.getByRole('button', { name: /Bob/ }).click();
    await expect(page.getByText('Race finished!')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /^Save$/i }).click();
    await page.getByText('Heats').click();
    await expect(page.getByText(/Heat 1/i)).toBeVisible();
    await expect(page.getByText('2/2')).toBeVisible();
  });
});
