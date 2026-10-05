import { setOutput } from "@actions/core";
import type { FullResult } from "@playwright/test/reporter";
import type { TotalStatus } from "./getTotalStatus.js";

/**
 * Sets the test result counts as outputs of the step that runs the tests, so
 * later steps can use them via `steps.<id>.outputs.<name>`.
 */
export const setResultOutputs = (
  total: number,
  totals: TotalStatus,
  status: FullResult["status"],
) => {
  // Only set by GitHub Actions, without it `setOutput` logs a command instead
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  setOutput("total", total);
  setOutput("passed", totals.passed);
  setOutput("failed", totals.failed);
  setOutput("flaky", totals.flaky);
  setOutput("skipped", totals.skipped);
  setOutput("timed-out", totals.timedOut);
  setOutput("status", status);
};
