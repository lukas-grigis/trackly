import { test, expect } from '@playwright/test';
import { resetApp, addAthlete, createSessionWithAthletes } from './helpers/session';

test.describe('Athlete management', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
  });

  test('add athlete with name', async ({ page }) => {
    await page.goto('/#/athletes');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Add athlete/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    await dialog.getByPlaceholder('Name').fill('Max Mustermann');
    await dialog.getByRole('button', { name: /Add athlete/i }).click();
    await expect(page.getByText('Max Mustermann')).toBeVisible();
  });

  test('athlete appears in roster', async ({ page }) => {
    await addAthlete(page, 'Anna Schmidt');
    await expect(page.locator('ul').getByText('Anna Schmidt')).toBeVisible();
  });

  test('edit athlete name updates in place', async ({ page }) => {
    await addAthlete(page, 'Old Name');
    await page.getByRole('button', { name: /Edit athlete/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit athlete' })).toBeVisible();
    const nameInput = page.getByPlaceholder('Name').last();
    await nameInput.clear();
    await nameInput.fill('New Name');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByText('New Name')).toBeVisible();
    await expect(page.getByText('Old Name')).not.toBeVisible();
  });

  test('delete athlete shows confirm dialog', async ({ page }) => {
    await addAthlete(page, 'To Delete');
    await page.getByRole('button', { name: /Remove athlete/i }).click();
    await expect(page.getByText('Remove athlete?')).toBeVisible();
    await page.getByRole('button', { name: /^Remove athlete$/i }).click();
    await expect(page.getByText('To Delete')).not.toBeVisible();
  });

  test('delete athlete cascades through session (roster, heats, results)', async ({ page }) => {
    // Create session with two athletes and add a result for the one we will delete
    await createSessionWithAthletes(page, 'Cascade Session', ['Alice', 'Bob']);

    // Select long_jump discipline and add a result for Alice
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();
    await page.getByRole('button', { name: /Alice/ }).click();
    await page.locator('input[type="number"]').fill('3.50');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByText('3.50m')).toBeVisible();

    // Now delete Alice from the athletes page
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');
    // Click delete on Alice's row (first athlete)
    await page
      .getByRole('button', { name: /Remove athlete/i })
      .first()
      .click();
    await page.getByRole('button', { name: /^Remove athlete$/i }).click();
    await expect(page.getByText('Alice')).not.toBeVisible();

    // Navigate back to the session and verify Alice is removed from roster and results
    await page.goto('/#/sessions');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Cascade Session').click();

    // Alice should no longer appear in session athletes
    await expect(page.getByText('Alice')).not.toBeVisible();
    // Bob should still be there
    await expect(page.getByText('Bob')).toBeVisible();
  });

  test('photo upload survives page reload', async ({ page }) => {
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');

    // Create a small valid PNG image (1x1 pixel)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );

    // Open Add Athlete dialog
    await page.getByRole('button', { name: /Add athlete/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    await dialog.getByPlaceholder('Name').fill('Photo Test');
    const fileInput = dialog.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Wait for avatar preview to appear in the dialog, then submit
    await expect(dialog.locator('img[src^="data:image"]')).toBeVisible();
    await dialog.getByRole('button', { name: /Add athlete/i }).click();

    // Verify athlete with photo appears in the list
    await expect(page.locator('ul img[src^="data:image"]')).toBeVisible();

    // Reload and verify the photo persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('ul img[src^="data:image"]')).toBeVisible();
  });

  test('long athlete name has title tooltip when truncated', async ({ page }) => {
    const longName = 'Alexander Maximilian von Brandenburg';
    await addAthlete(page, longName);
    const nameSpan = page.locator('ul span.truncate', { hasText: longName });
    await expect(nameSpan).toBeVisible();
    await expect(nameSpan).toHaveAttribute('title', longName);
  });

  test('no horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await addAthlete(page, 'Mobile Test Athlete');
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('athlete page shows best result from multiple heats, not first', async ({ page }) => {
    // Create session with one athlete
    await createSessionWithAthletes(page, 'Multi-Heat Session', ['Mia']);

    // Select long_jump discipline
    await page
      .locator('button')
      .filter({ hasText: /60m Sprint/i })
      .click();
    await page.getByRole('tab').nth(2).click();
    await page.getByRole('button', { name: 'Long Jump' }).click();

    // Add first result: 3.00m (worse)
    await page.getByRole('button', { name: /Mia/ }).click();
    await page.locator('input[type="number"]').fill('3.00');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByText('3.00m')).toBeVisible();

    // Add second result: 4.50m (better — distance is sortAscending:false)
    await page.getByRole('button', { name: /Mia/ }).click();
    await page.locator('input[type="number"]').fill('4.50');
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByText('4.50m')).toBeVisible();

    // Navigate to Mia's athlete page
    await page.goto('/#/athletes');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Mia').click();
    await expect(page).toHaveURL(/\/#\/athlete\//);

    // The session history should show the BEST value (4.50m), not the first (3.00m)
    // It appears in both PB and session history, so use .first() for the PB card
    await expect(page.getByText('4.50m').first()).toBeVisible();
    // The 3.00m (inferior) should NOT appear anywhere
    await expect(page.getByText('3.00m')).not.toBeVisible();
  });
});
