import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright configuration optimized for streamlined test suite
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests - our streamlined suite is focused and fast */
  workers: 1,
  /* Enhanced reporting for QA showcase */
  reporter: process.env.CI ? [
    ['github'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ] : [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['line']
  ],

  /* Global test settings */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'retain-on-failure',
    /* Screenshots only on failure to keep CI clean */
    screenshot: 'only-on-failure',
    /* Video recording disabled for performance */
    video: 'off',
    
    /* Browser context options optimized for extension testing */
    viewport: { width: 380, height: 480 },
    ignoreHTTPSErrors: true,
    
    /* Reasonable timeouts for our working tests */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Test timeout - generous but not excessive */
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  /* Chrome extension testing configuration */
  projects: [
    {
      name: 'chrome-extension',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        /* Automatically detect CI environment for headless mode */
        headless: !!process.env.CI,
        launchOptions: {
          args: [
            '--no-first-run',
            '--disable-default-apps',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--disable-features=VizDisplayCompositor',
            '--disable-site-isolation-trials',
            '--disable-features=BlockInsecurePrivateNetworkRequests',
            '--allow-running-insecure-content',
            '--disable-features=TrustSafeBrowsingClientCanCheck',
            '--disable-features=TrustedDOMTypes',
            '--disable-blink-features=TrustedDOMTypes',
            /* Additional CI-friendly flags */
            ...(process.env.CI ? [
              '--disable-gpu',
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-extensions-except=dist',
              '--disable-background-timer-throttling'
            ] : [])
          ]
        }
      },
    }
  ],

  /* Output directories */
  outputDir: 'test-results',
});
