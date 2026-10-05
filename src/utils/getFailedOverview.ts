import type { Suite } from "@playwright/test/reporter";
import { basename } from "path";
import { getTestsPerFile } from "./getTestsPerFile.js";
import { getTestStatus } from "./getTestStatus.js";
import { getTableHeaders, type SummaryTableRow } from "./summaryTable.js";
import { getTestTitle } from "./getTestTitle.js";
import { getShortError } from "./getShortError.js";
import {
  escapeHtml,
  getErrorMessage,
  getTestErrors,
} from "./getErrorDetails.js";
import type { DisplayLevel } from "../models/index.js";

export interface FailedOverview {
  rows: SummaryTableRow[];
  remaining: number;
}

export const DEFAULT_FAILED_OVERVIEW_LIMIT = 10;

export const getFailedOverview = (
  suite: Suite,
  displayLevel: DisplayLevel[],
  limit: number = DEFAULT_FAILED_OVERVIEW_LIMIT,
  maxErrorLength?: number,
): FailedOverview | undefined => {
  if (!displayLevel.includes("fail")) {
    return;
  }

  const failedRows: SummaryTableRow[] = [];

  for (const crntSuite of suite.suites) {
    const projectName = crntSuite.project()?.name;
    const tests = getTestsPerFile(crntSuite);

    for (const filePath of Object.keys(tests)) {
      const fileName = basename(filePath);

      for (const test of tests[filePath]) {
        // Get the last result
        const result = test.results[test.results.length - 1];

        // Timed out and interrupted tests are reported as "Fail" as well
        if (getTestStatus(test, result) !== "Fail") {
          continue;
        }

        const error = getShortError(
          getErrorMessage(getTestErrors(result)[0]),
          maxErrorLength,
        );

        failedRows.push([
          {
            data: `<code>${fileName}</code>${
              projectName ? `&nbsp;(${projectName})` : ""
            }`,
          },
          { data: getTestTitle(test) },
          { data: error ? `<code>${escapeHtml(error)}</code>` : "" },
        ]);
      }
    }
  }

  if (failedRows.length === 0) {
    return;
  }

  const maxRows = Math.max(1, limit);

  return {
    rows: [
      getTableHeaders(["File", "Test", "Error"]),
      ...failedRows.slice(0, maxRows),
    ],
    remaining: Math.max(0, failedRows.length - maxRows),
  };
};
