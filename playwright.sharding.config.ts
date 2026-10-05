import type { GitHubActionOptions } from "./src/models/GitHubActionOptions";
import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/**
 * Config for the sharding sample workflow. Each shard writes its own summary
 * and a blob report, which the merge job combines with
 * `playwright.merge.config.ts`.
 */
export default defineConfig({
  ...config,
  reporter: [
    ["blob"],
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "Sharding sample",
        showError: true,
        errorFormat: "short",
        showFailedOverview: true,
        includeResults: ["fail", "flaky", "skipped"],
        quiet: true,
      },
    ],
  ],
});
