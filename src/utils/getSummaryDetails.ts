import { Suite } from "@playwright/test/reporter";
import { getTotalStatus } from "./getTotalStatus";

export const getSummaryDetails = (suite: Suite): string[] => {
  const totalStatus = getTotalStatus(suite.suites);

  const headerText = [`🧪 Total: ${suite.allTests().length}`];

  if (totalStatus.passed > 0) {
    headerText.push(`✅ Pass: ${totalStatus.passed}`);
  }

  if (totalStatus.failed > 0) {
    headerText.push(`❌ Fail: ${totalStatus.failed}`);
  }

  if (totalStatus.skipped > 0) {
    headerText.push(`⏭️ Skip: ${totalStatus.skipped}`);
  }

  if (totalStatus.timedOut > 0) {
    headerText.push(`🕐 Time Out: ${totalStatus.timedOut}`);
  }

  return headerText;
};
