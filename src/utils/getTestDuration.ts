import { TestResult } from "@playwright/test/reporter";

export const getTestDuration = (result?: TestResult) => {
  return result?.duration ? `${result.duration / 1000}s` : "";
};
