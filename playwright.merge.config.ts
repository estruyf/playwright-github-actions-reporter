import type { GitHubActionOptions } from "./src/models/GitHubActionOptions";

/**
 * Config for `playwright merge-reports`, which combines the blob reports of
 * the shards from the sharding sample workflow into a single summary.
 */
export default {
  testDir: "./tests",
  reporter: [
    [
      "./src/index.ts",
      <GitHubActionOptions>{
        title: "Sharding sample (merged)",
        showError: true,
        errorFormat: "short",
        showFailedOverview: true,
        showSlowestTests: 5,
        includeResults: ["fail", "flaky", "skipped"],
      },
    ],
  ],
};
