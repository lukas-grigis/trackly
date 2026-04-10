import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

async function runSprintRace(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Start race/i }).click();
  await page.getByRole('button', { name: /Select all/i }).click();
  await page.getByRole('button', { name: /^None$/i }).click();
  await page.getByRole('button', { name: /^Start$/i }).click();
  await expect(page.getByRole('button', { name: /Alice/ })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Alice/ }).click();
  await page.getByRole('button', { name: /Bob/ }).click();
  await expect(page.getByText('Race finished!')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /^Save$/i }).click();
}

async function navigateToLeaderboard(page: import('@playwright/test').Page) {
  await page
    .getByRole('link', { name: /Leaderboard/i })
    .or(page.getByRole('button', { name: /Leaderboard/i }))
    .first()
    .click();
  await expect(page).toHaveURL(/\/leaderboard/);
  await expect(page.getByRole('button', { name: /TV Mode/i })).toBeVisible({ timeout: 5000 });
}

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'LB Session', ['Alice', 'Bob']);
    await runSprintRace(page);
    await navigateToLeaderboard(page);
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

test.describe('Leaderboard TV mode rotation', () => {
  test('TV mode rotates between disciplines after interval', { timeout: 60000 }, async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'TV Rotation', ['Alice', 'Bob']);

    // Record a sprint race result
    await runSprintRace(page);

    // Extract session ID from URL and navigate back to session page
    const raceUrl = page.url();
    const sessionId = raceUrl.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}`);
    await page.waitForLoadState('domcontentloaded');

    // Switch to long_jump discipline
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();

    // Enter a long jump result for Alice
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.locator('input[type="number"]').fill('4.50');
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Navigate to leaderboard
    await navigateToLeaderboard(page);

    // Verify both disciplines visible on leaderboard page
    await expect(page.getByText('60m Sprint', { exact: true })).toBeVisible();
    await expect(page.getByText('Long Jump', { exact: true })).toBeVisible();

    // Enter TV mode
    await page.getByRole('button', { name: /TV Mode/i }).click();

    // TV mode should show first discipline and a counter (1 / 2)
    await expect(page.getByText('1 / 2')).toBeVisible({ timeout: 3000 });

    // Wait for the 8s rotation interval to elapse and check the counter changed
    await expect(page.getByText('2 / 2')).toBeVisible({ timeout: 10000 });
  });

  test('TV mode nav buttons have aria-label attributes', { timeout: 60000 }, async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'TV Aria', ['Alice', 'Bob']);
    await runSprintRace(page);

    const raceUrl = page.url();
    const sessionId = raceUrl.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.locator('input[type="number"]').fill('4.50');
    await page.getByRole('button', { name: /^Save$/i }).click();

    await navigateToLeaderboard(page);
    await page.getByRole('button', { name: /TV Mode/i }).click();
    await expect(page.getByText('1 / 2')).toBeVisible({ timeout: 3000 });

    // Verify nav buttons have accessible aria-labels
    await expect(page.getByRole('button', { name: 'Previous discipline' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next discipline' })).toBeVisible();
  });

  test('TV mode arrow keys change discipline', { timeout: 60000 }, async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'TV Keys', ['Alice', 'Bob']);
    await runSprintRace(page);

    const raceUrl = page.url();
    const sessionId = raceUrl.match(/session\/([^/]+)/)?.[1];
    await page.goto(`/#/session/${sessionId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.locator('input[type="number"]').fill('4.50');
    await page.getByRole('button', { name: /^Save$/i }).click();

    await navigateToLeaderboard(page);
    await page.getByRole('button', { name: /TV Mode/i }).click();
    await expect(page.getByText('1 / 2')).toBeVisible({ timeout: 3000 });

    // Press ArrowRight to advance to next discipline
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 / 2')).toBeVisible({ timeout: 3000 });

    // Press ArrowLeft to go back to previous discipline
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('1 / 2')).toBeVisible({ timeout: 3000 });
  });

  test('TV mode Escape key exits TV mode', { timeout: 60000 }, async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'TV Escape', ['Alice', 'Bob']);
    await runSprintRace(page);
    await navigateToLeaderboard(page);

    // Enter TV mode
    await page.getByRole('button', { name: /TV Mode/i }).click();
    await expect(page.getByText('Tap anywhere to exit')).toBeVisible({ timeout: 3000 });

    // Press Escape to exit TV mode
    await page.keyboard.press('Escape');

    // Should be back on the leaderboard page
    await expect(page.getByRole('button', { name: /TV Mode/i })).toBeVisible({ timeout: 5000 });
  });
});
