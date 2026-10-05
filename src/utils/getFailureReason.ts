import type { FullResult } from "@playwright/test/reporter";
import type { TotalStatus } from "./getTotalStatus.js";

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Explains why the run failed, or `undefined` when it passed.
 */
export const getFailureReason = (
  status: FullResult["status"] | undefined,
  totals: TotalStatus,
  failOnFlakyTests = false,
  errorCount = 0,
): string | undefined => {
  if (!status || status === "passed") {
    return;
  }

  const reasons: string[] = [];

  if (status === "interrupted") {
    reasons.push("Test run was interrupted");
  } else if (status === "timedout") {
    reasons.push("Global timeout reached");
  }

  if (totals.failed > 0) {
    reasons.push(`${totals.failed} failed`);
  }

  if (totals.timedOut > 0) {
    reasons.push(`${totals.timedOut} timed out`);
  }

  // Flaky tests only fail the run with `failOnFlakyTests` (Playwright 1.50+)
  if (failOnFlakyTests && totals.flaky > 0) {
    reasons.push(
      `${plural(totals.flaky, "flaky test")} (failOnFlakyTests is enabled)`,
    );
  }

  if (errorCount > 0) {
    reasons.push(`${plural(errorCount, "error")} outside of tests`);
  }

  return reasons.length > 0 ? reasons.join(", ") : "Tests failed";
};
