import { test, expect } from '@playwright/test';
import { resetApp, createSessionWithAthletes } from './helpers/session';

test.describe('Games (count mode)', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
    await createSessionWithAthletes(page, 'Games Session', ['Eve']);
  });

  test('football shows score counter UI, not race UI', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(4).click();
    await page.getByRole('button', { name: 'Football' }).click();
    await expect(page.getByPlaceholder('Team A')).toBeVisible();
    await expect(page.getByPlaceholder('Team B')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start race/i })).not.toBeVisible();
  });

  test('football, basketball, and jump_rope all render same scoring layout', async ({ page }) => {
    const disciplines = [
      { tab: 4, name: 'Football' },
      { tab: 4, name: 'Basketball' },
      { tab: 4, name: 'Jump Rope' },
    ];

    for (const disc of disciplines) {
      await page
        .locator('button')
        .filter({ hasText: /60m Sprint|Football|Basketball|Jump Rope/i })
        .first()
        .click();
      await page.getByRole('tab').nth(disc.tab).click();
      await page.getByRole('button', { name: disc.name }).click();

      // All game disciplines must have Team A/B inputs
      await expect(page.getByPlaceholder('Team A')).toBeVisible();
      await expect(page.getByPlaceholder('Team B')).toBeVisible();

      // All must have +/- buttons
      await expect(page.getByRole('button', { name: /Add point/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Remove point/i }).first()).toBeVisible();

      // All must show score 0 indicators
      const scores = page.locator('.text-6xl');
      await expect(scores).toHaveCount(2);
      await expect(scores.first()).toHaveText('0');
      await expect(scores.last()).toHaveText('0');
    }
  });

  test('adjust scores and save as X:Y format', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(4).click();
    await page.getByRole('button', { name: 'Football' }).click();
    const incrementA = page.getByRole('button', { name: /Add point Team A/i });
    await incrementA.click();
    await incrementA.click();
    const incrementB = page.getByRole('button', { name: /Add point Team B/i });
    await incrementB.click();
    const scores = page.locator('.text-6xl');
    await expect(scores.first()).toHaveText('2');
    await expect(scores.last()).toHaveText('1');
    await page.getByRole('button', { name: /Save score/i }).click();
    await page.getByRole('button', { name: 'Games', exact: true }).click();
    await expect(page.getByText(/Game 1/i)).toBeVisible();
    await expect(page.getByText('2:1')).toBeVisible();
  });
});
