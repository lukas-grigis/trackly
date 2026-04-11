import { type Page, expect } from '@playwright/test';

export async function resetApp(page: Page) {
  await page.goto('/#/sessions');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('trackly-lang', JSON.stringify({ state: { lang: 'en' }, version: 0 }));
    localStorage.setItem('trackly-countdown-pref', '0');
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

export async function goHome(page: Page) {
  await page.goto('/#/sessions');
  await page.waitForLoadState('domcontentloaded');
}

export async function createSession(page: Page, name: string) {
  await goHome(page);
  await page
    .getByRole('button', { name: /New Session/i })
    .first()
    .click();
  await page.locator('#session-name').fill(name);
  await page.getByRole('button', { name: /Create Session/i }).click();
  await expect(page).toHaveURL(/\/#\/session\//);
}

export async function addAthlete(page: Page, name: string) {
  await page.goto('/#/athletes');
  await page.waitForLoadState('domcontentloaded');
  // Open the Add Athlete dialog (button is next to the page heading)
  await page.getByRole('button', { name: /Add athlete/i }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByPlaceholder('Name').fill(name);
  // Submit button inside the dialog
  await dialog.getByRole('button', { name: /Add athlete/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

export async function createSessionWithAthletes(page: Page, sessionName: string, athletes: string[]) {
  for (const name of athletes) {
    await addAthlete(page, name);
  }
  await createSession(page, sessionName);
}

export async function navigateToSession(page: Page, sessionName: string) {
  await goHome(page);
  await page.getByText(sessionName).click();
  await expect(page).toHaveURL(/\/#\/session\//);
}
