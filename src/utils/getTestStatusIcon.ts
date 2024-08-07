import { TestCase, TestResult } from "@playwright/test/reporter";
import { getTestStatus } from "./getTestStatus";

export const getTestStatusIcon = (test: TestCase, result: TestResult) => {
  let value = getTestStatus(test, result);

  if (value === "Flaky") {
    value = `⚠️`;
  } else if (value === "Pass") {
    value = "✅";
  } else if (value === "Skipped") {
    value = `⏭️`;
  } else if (value === "Fail") {
    value = "❌";
  }

  return value;
};
