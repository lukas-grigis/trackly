import { test, expect } from '@playwright/test';
import { resetApp } from './helpers/session';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
  });

  test('landing page has Open App link', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByText('Open App').first()).toBeVisible();
  });

  test('Open App navigates to sessions', async ({ page }) => {
    await page.goto('/#/');
    await page.getByText('Open App').first().click();
    await expect(page).toHaveURL(/\/#\/sessions/);
  });

  test('how-to guide accessible from navbar', async ({ page }) => {
    await page.getByRole('button', { name: /Quick Start/i }).click();
    await expect(page).toHaveURL(/\/#\/how-to/);
    await expect(page.getByText('Quick Start')).toBeVisible();
  });

  test('back navigation from session to sessions list', async ({ page }) => {
    await page
      .getByRole('button', { name: /New Session/i })
      .first()
      .click();
    await page.locator('#session-name').fill('Nav Test');
    await page.getByRole('button', { name: /Create Session/i }).click();
    await expect(page).toHaveURL(/\/#\/session\//);
    await page.getByRole('link', { name: /Sessions/i }).click();
    await expect(page).toHaveURL(/\/#\/sessions/);
  });

  test('language toggle switches between DE and EN', async ({ page }) => {
    await expect(page.getByText('Sessions').first()).toBeVisible();
    await page.locator('button').filter({ hasText: /^de$/i }).click();
    await expect(page.getByText('Neue Session').first()).toBeVisible();
    await page.locator('button').filter({ hasText: /^en$/i }).click();
    await expect(page.getByText('New Session').first()).toBeVisible();
  });
});
