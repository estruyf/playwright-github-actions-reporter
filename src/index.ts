import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  FullResult,
  TestResult,
} from "@playwright/test/reporter";
import * as core from "@actions/core";
import { basename } from "path";
import { getHtmlTable } from "./utils/getHtmlTable";
import { getTableRows } from "./utils/getTableRows";
import { checkForFailedTests } from "./utils/checkForFailedTests";
import Convert from "ansi-to-html";

interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showError?: boolean;
}

class GitHubAction implements Reporter {
  private suite: Suite | undefined;

  constructor(private options: GitHubActionOptions = {}) {
    console.log(`Using GitHub Actions reporter`);
  }

  onBegin(_: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  onStdOut(
    chunk: string | Buffer,
    test: void | TestCase,
    result: void | TestResult
  ): void {
    console.log(chunk.toString());
  }

  async onEnd(result: FullResult) {
    if (process.env.GITHUB_ACTIONS && this.suite) {
      const os = process.platform;
      const summary = core.summary;
      summary.addHeading(this.options.title || `Test results`, 1);

      summary.addRaw(`Total tests: ${this.suite.allTests().length}`);

      if (this.options.useDetails) {
        summary.addSeparator();
      }

      for (const suite of this.suite?.suites) {
        const project = suite.project();

        // Get all the test files
        const files = suite
          .allTests()
          .map((test) => test.location.file)
          .reduce((acc, curr) => {
            if (!acc.includes(curr)) {
              acc.push(curr);
            }

            return acc;
          }, [] as string[]);

        // Get all the tests per file
        const tests = files.reduce((acc, curr) => {
          acc[curr] = suite.allTests().filter((test) => {
            return test.location.file === curr;
          });

          return acc;
        }, {} as { [fileName: string]: TestCase[] });

        for (const filePath of Object.keys(tests)) {
          const fileName = basename(filePath);

          if (this.options.useDetails) {
            const content = getHtmlTable(
              tests[filePath],
              !!this.options.showError
            );

            // Check if there are any failed tests
            const hasFailedTests = checkForFailedTests(tests[filePath]);

            summary.addDetails(
              `${hasFailedTests ? "❌" : "✅"} ${fileName} (${os}${
                project!.name ? ` / ${project!.name}` : ""
              })`,
              content
            );
          } else {
            summary.addHeading(
              `${fileName} (${os}${
                project!.name ? ` / ${project!.name}` : ""
              })`,
              2
            );

            const tableRows = getTableRows(
              tests[filePath],
              !!this.options.showError
            );
            summary.addTable(tableRows);
          }
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
