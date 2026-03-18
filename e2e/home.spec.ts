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
});
