import type { TestCase, TestResult } from "@playwright/test/reporter";
import { getTestStatus } from "./getTestStatus.js";

export const getTestStatusIcon = (
  test: TestCase,
  result: TestResult,
  failOnFlakyTests = false,
) => {
  let value = getTestStatus(test, result);

  if (value === "Flaky") {
    // With `failOnFlakyTests`, a flaky test fails the run
    value = failOnFlakyTests ? "❌" : `⚠️`;
  } else if (value === "Pass") {
    value = "✅";
  } else if (value === "Skipped") {
    value = `⏭️`;
  } else if (value === "Fail") {
    value = "❌";
  }

  return value;
};
