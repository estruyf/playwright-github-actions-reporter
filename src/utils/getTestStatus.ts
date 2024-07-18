import { TestCase, TestResult } from "@playwright/test/reporter";
import { getTestOutcome } from "./getTestOutcome";

export const getTestStatus = (test: TestCase, result: TestResult) => {
  let value = "";

  let status = getTestOutcome(test, result);

  if (status === "passed" && result.retry > 0) {
    value = `⚠️ Flaky`;
  } else if (status === "passed") {
    value = "✅ Pass";
  } else if (status === "skipped") {
    value = `⏭️ Skipped`;
  } else {
    value = "❌ Fail";
  }

  return value;
};
