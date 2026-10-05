import type { Suite } from "@playwright/test/reporter";
import { getTestOutcome } from "./getTestOutcome.js";

export const getTotalStatus = (
  suites: Suite[],
): {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  flaky: number;
} => {
  let total = {
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    flaky: 0,
  };

  for (const suite of suites) {
    const testOutcome = suite.allTests().map((test) => {
      const lastResult = test.results[test.results.length - 1];
      return {
        outcome: getTestOutcome(test, lastResult),
        retry: lastResult?.retry || 0,
      };
    });

    for (const { outcome, retry } of testOutcome) {
      if (outcome === "passed" && retry > 0) {
        // A test that failed first and passed on retry shows as "Flaky"
        // in the summary table, so it is not counted as passed.
        total.flaky++;
      } else if (outcome === "passed") {
        total.passed++;
      } else if (outcome === "skipped") {
        total.skipped++;
      } else if (outcome === "timedOut") {
        total.timedOut++;
      } else {
        // "failed", "interrupted" and anything else show as "Fail" in the
        // summary table. Counting them here keeps the totals adding up.
        total.failed++;
      }
    }
  }

  return total;
};
