import type { TestError, TestResult } from "@playwright/test/reporter";
import { getErrorDetails, type ErrorOptions } from "./getErrorDetails.js";
import { getTableHeaders, type SummaryTableRow } from "./summaryTable.js";

export interface GlobalError {
  error: TestError;
  projectName?: string;
}

/**
 * Table with the errors that happened outside of tests, like a failing global
 * setup or worker teardown.
 */
export const getGlobalErrors = (
  errors: GlobalError[] = [],
  errorOptions?: ErrorOptions,
): SummaryTableRow[] | undefined => {
  if (errors.length === 0) {
    return;
  }

  const showProject = errors.some(({ projectName }) => !!projectName);

  const rows = errors.map(({ error, projectName }) => {
    const details = getErrorDetails(
      { errors: [error] } as unknown as TestResult,
      errorOptions,
    );

    return showProject
      ? [{ data: projectName || "" }, { data: details }]
      : [{ data: details }];
  });

  return [
    getTableHeaders(showProject ? ["Project", "Error"] : ["Error"]),
    ...rows,
  ];
};
