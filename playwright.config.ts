import { defineConfig, devices } from '@playwright/test'

const PDF_TEST_MATCH = /tests\/Pdf\/.*\.spec\.ts/
const RESPONSIVE_TEST_MATCH = /tests\/CrossBrowser\/(mobile|tablet)\.spec\.ts/
const DEFAULT_LOCAL_TEST_IGNORE = [
  PDF_TEST_MATCH,
  RESPONSIVE_TEST_MATCH,
]

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Keep local runs memory-safe on 8 GB machines; allow an env override if needed. */
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 1),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://127.0.0.1:4173',

    /* Keep local runs light; retain retry traces in CI. */
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },

  /* Configure projects by purpose so local runs do not fan out across every browser/device. */
  projects: [
    {
      name: 'chromium-local',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: DEFAULT_LOCAL_TEST_IGNORE,
    },
    {
      name: 'firefox-matrix',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: DEFAULT_LOCAL_TEST_IGNORE,
    },
    {
      name: 'webkit-matrix',
      use: { ...devices['Desktop Safari'] },
      testIgnore: DEFAULT_LOCAL_TEST_IGNORE,
    },
    {
      name: 'responsive-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: RESPONSIVE_TEST_MATCH,
    },
    {
      name: 'pdf-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: PDF_TEST_MATCH,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'node scripts/run-vite.mjs --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
