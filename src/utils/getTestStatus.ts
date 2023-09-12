import { TestResult } from "@playwright/test/reporter";

export const getTestStatus = (result: TestResult) => {
  let value = "";

  if (result.status === "passed" && result.retry > 0) {
    value = `⚠️ Pass`;
  } else if (result.status === "passed") {
    value = "✅ Pass";
  } else if (result.status === "skipped") {
    value = `⚠️ Skipped`;
  } else {
    value = "❌ Fail";
  }

  return value;
};
