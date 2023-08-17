import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
  TestStatus,
} from "@playwright/test/reporter";
import * as core from "@actions/core";
import { basename } from "path";
import { getHtmlTable } from "./utils/getHtmlTable";
import { getTableRows } from "./utils/getTableRows";

interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
}

interface TestDetails {
  total: number | undefined;

  tests: {
    [fileName: string]: TestResults;
  };
}

export interface TestResults {
  [testTitle: string]: {
    status: TestStatus | "pending";
    duration: number;
  };
}

class GitHubAction implements Reporter {
  private testDetails: TestDetails = {
    total: undefined,
    tests: {},
  };

  constructor(private options: GitHubActionOptions = {}) {
    console.log(`Using GitHub Actions reporter`);
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.testDetails.total = suite.allTests().length;
  }

  onTestBegin(test: TestCase, result: TestResult) {
    const fileName = basename(test.location.file);

    if (!this.testDetails.tests[fileName]) {
      this.testDetails.tests[fileName] = {};
    }

    if (!this.testDetails.tests[fileName][test.title]) {
      this.testDetails.tests[fileName][test.title] = {
        status: "pending",
        duration: 0,
      };
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const fileName = basename(test.location.file);

    this.testDetails.tests[fileName][test.title] = {
      status: result.status,
      duration: result.duration,
    };
  }

  async onEnd(result: FullResult) {
    if (process.env.GITHUB_ACTIONS) {
      const summary = core.summary;
      summary.addHeading(this.options.title || `Test results`, 1);

      summary.addRaw(`Total tests: ${this.testDetails.total}`);

      if (this.options.useDetails) {
        summary.addSeparator();
      }

      for (const fileName of Object.keys(this.testDetails.tests)) {
        // Check if there are any failed tests
        const failedTests = Object.values(
          this.testDetails.tests[fileName]
        ).filter((test) => test.status !== "passed");

        if (this.options.useDetails) {
          const content = getHtmlTable(this.testDetails.tests[fileName]);

          summary.addDetails(
            `${failedTests.length === 0 ? "✅" : "❌"} ${fileName}`,
            content
          );
        } else {
          summary.addHeading(
            `${failedTests.length === 0 ? "✅" : "❌"} ${fileName}`,
            2
          );

          const tableRows = getTableRows(this.testDetails.tests[fileName]);
          summary.addTable(tableRows);
        }
      }

      await summary.write();
    }

    if (result.status !== "passed") {
      core.setFailed("Tests failed");
    }
  }
}

export default GitHubAction;
