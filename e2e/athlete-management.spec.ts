import { test, expect } from '@playwright/test';
import { resetApp, addAthlete } from './helpers/session';

test.describe('Athlete management', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page);
  });

  test('add athlete with name', async ({ page }) => {
    await page.goto('/#/athletes');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Name').fill('Max Mustermann');
    await page.getByRole('button', { name: 'Add athlete' }).click();
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
});
