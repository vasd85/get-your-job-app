import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: undefined, // undefined - to use maximum workers
  reporter: 'html',
  timeout: 300_000,
  use: {
    baseURL: '',
    actionTimeout: 10000,
    trace: 'on-first-retry',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      devtools: !process.env['CI'],
      args: ['--use-gl=egl'], // enable hardware acceleration locally
    },
  },
});
