import type { GitHubActionOptions } from "./src/models/GitHubActionOptions";
import { PlaywrightTestConfig, defineConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig<{}, {}> = {
  testDir: "./tests",
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 30 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    // ["json", { outputFile: "results.json" }],
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "Reporter (details: false, report: fail, flaky, skipped)",
        useDetails: false,
        showError: true,
        quiet: false,
        includeResults: ["fail", "flaky", "skipped"],
      },
    ],
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "Reporter (details: false, report: pass, skipped)",
        useDetails: false,
        showError: true,
        quiet: false,
        includeResults: ["pass", "skipped"],
      },
    ],
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "Reporter (details: true, report: fail, flaky, skipped)",
        useDetails: true,
        quiet: true,
        includeResults: ["fail", "flaky", "skipped"],
      },
    ],
  ],
  use: {
    actionTimeout: 0,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: "setup.spec.ts",
    },
    {
      name: "chromium",
      // dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // {
    //   name: "firefox",
    //   // dependencies: ["setup"],
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },
  ],
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(config);
