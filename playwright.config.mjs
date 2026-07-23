import { defineConfig, devices } from "@playwright/test";
import { normalizeSiteBaseUrl } from "./tests/browser/site-route.mjs";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = normalizeSiteBaseUrl(externalBaseUrl || "http://127.0.0.1:4173/");

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  outputDir: ".tmp/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: ".tmp/playwright-report", open: "never" }]
  ],
  use: {
    baseURL,
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "python -m http.server 4173 --bind 127.0.0.1 --directory .tmp/site",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 15_000
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] }
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 12"] }
    }
  ]
});
