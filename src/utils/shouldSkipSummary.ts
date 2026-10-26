import type { FullResult } from "@playwright/test/reporter";
import type { TotalStatus } from "./getTotalStatus.js";

/**
 * With `skipSummaryWhenAllPassed`, a run that passed without flaky tests
 * writes no job summary, so the summaries of failed jobs stand out.
 */
export const shouldSkipSummary = (
  skipSummaryWhenAllPassed: boolean | undefined,
  status: FullResult["status"] | undefined,
  totals: TotalStatus,
): boolean =>
  !!skipSummaryWhenAllPassed && status === "passed" && totals.flaky === 0;
