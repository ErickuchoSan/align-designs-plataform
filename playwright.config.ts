import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Align Designs Platform
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for dependent flows
  forbidOnly: !!process.env.CI, // Fail if test.only is left in CI
  retries: process.env.CI ? 2 : 0, // Retry on CI only
  workers: 1, // Single worker for sequential execution
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60000, // 60 seconds per test

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://45.55.71.127',
    trace: 'on-first-retry', // Collect trace on first retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Global setup to authenticate before tests
  globalSetup: undefined, // Can add auth setup later if needed
});
