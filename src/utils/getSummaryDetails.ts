import { Suite } from "@playwright/test/reporter";
import { getTotalStatus } from "./getTotalStatus";

export const getSummaryDetails = (suite: Suite): string[] => {
  const totalStatus = getTotalStatus(suite.suites);

  const headerText = [`Total tests: ${suite.allTests().length}`];

  if (totalStatus.passed > 0) {
    headerText.push(`Passed: ${totalStatus.passed}`);
  }

  if (totalStatus.failed > 0) {
    headerText.push(`Failed: ${totalStatus.failed}`);
  }

  if (totalStatus.skipped > 0) {
    headerText.push(`Skipped: ${totalStatus.skipped}`);
  }

  if (totalStatus.timedOut > 0) {
    headerText.push(`Timed Out: ${totalStatus.timedOut}`);
  }

  return headerText;
};
