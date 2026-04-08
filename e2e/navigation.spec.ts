import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

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
    await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible();
    await page.locator('button').filter({ hasText: /^de$/i }).click();
    await expect(page.getByText('Neue Session').first()).toBeVisible();
    await page.locator('button').filter({ hasText: /^en$/i }).click();
    await expect(page.getByText('New Session').first()).toBeVisible();
  });

  test('language toggle persists across reload', async ({ page }) => {
    // Switch to German
    await page.locator('button').filter({ hasText: /^de$/i }).click();
    await expect(page.getByText('Neue Session').first()).toBeVisible();
    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Neue Session').first()).toBeVisible();
  });

  test('theme toggle persists across reload', async ({ page }) => {
    // Verify initial state — no dark class (resetApp clears localStorage)
    const hasDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    // Toggle theme
    await page.getByRole('button', { name: /Toggle theme/i }).click();
    const hasDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkAfter).not.toBe(hasDarkBefore);
    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const hasDarkReloaded = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkReloaded).toBe(hasDarkAfter);
  });

  test('back button from RacePage returns to SessionPage', async ({ page }) => {
    await createSessionWithAthletes(page, 'Back Nav Session', ['Alice', 'Bob']);
    // We're now on the session page — capture its URL
    const sessionUrl = page.url();
    // Navigate to race preparation page
    await page.getByRole('button', { name: /Start race/i }).click();
    await expect(page).toHaveURL(/\/race\//);
    // Click the navbar back button
    await page.getByRole('button', { name: /Back/i }).click();
    // Should return to the session page, not home
    await expect(page).toHaveURL(sessionUrl);
  });
});
