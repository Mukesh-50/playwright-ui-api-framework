// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env.js';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 2 : 0,
 
  workers: process.env.CI ? 2 : undefined,
  
  reporter: process.env.CI
    ? [
        ['list'],
        ['html'],
        ["allure-playwright"],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['github'],
      ]
    : [['list'], ['html'], ["allure-playwright"]],

  use: {

    // UI base URL; the "api" project below overrides it
    baseURL: env.uiBaseURL,

    trace: 'retain-on-failure',

    screenshot: "only-on-failure",

    video:"retain-on-failure"
  },

  
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Safari'] },
    },

    // API tests: no browser, own base URL and JSON headers
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: env.apiBaseURL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    },

  ],

});

