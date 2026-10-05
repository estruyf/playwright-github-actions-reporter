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
      return { outcome: getTestOutcome(test, lastResult), retry: lastResult?.retry || 0 };
    });


    for (const { outcome, retry } of testOutcome) {
      if (outcome === "passed") {
        total.passed++;
        // A test that failed first and passed on retry shows as "Flaky"
        // in the summary table - count it separately in the header too.
        if (retry > 0) {
          total.flaky++;
        }
      } else if (outcome === "failed") {
        total.failed++;
      } else if (outcome === "skipped") {
        total.skipped++;
      } else if (outcome === "timedOut") {
        total.timedOut++;
      }
    }
  }


  return total;
};
