import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : '50%',
  outputDir: './test-results',
  reporter: CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:4173/trackly',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  ],

  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    url: 'http://localhost:4173/trackly/',
    timeout: 120_000,
    reuseExistingServer: !CI,
  },
});
