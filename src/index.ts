import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  FullResult,
  TestResult,
} from "@playwright/test/reporter";
import * as core from "@actions/core";
import { basename, join } from "path";
import { getHtmlTable } from "./utils/getHtmlTable";
import { getTableRows } from "./utils/getTableRows";
import { getTestStatusIcon } from "./utils/getTestStatusIcon";
import { SUMMARY_ENV_VAR } from "@actions/core/lib/summary";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { getTotalStatus } from "./utils/getTotalStatus";

interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showAnnotations: boolean;
  showTags: boolean;
  showError?: boolean;
}

class GitHubAction implements Reporter {
  private suite: Suite | undefined;

  constructor(
    private options: GitHubActionOptions = {
      showAnnotations: true,
      showTags: true,
    }
  ) {
    console.log(`Using GitHub Actions reporter`);

    // Set default options
    if (typeof options.showAnnotations === "undefined") {
      this.options.showAnnotations = true;
    }

    if (typeof options.showTags === "undefined") {
      this.options.showTags = true;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Using development mode`);
      console.log(`Options: ${JSON.stringify(this.options, null, 2)}`);
    }
  }

  onBegin(_: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  onStdOut(
    chunk: string | Buffer,
    _: void | TestCase,
    __: void | TestResult
  ): void {
    console.log(chunk.toString());
  }

  async onEnd(result: FullResult) {
    if (process.env.NODE_ENV === "development") {
      const summaryFile = join(__dirname, "../summary.html");
      if (existsSync(summaryFile)) {
        unlinkSync(summaryFile);
      }
      writeFileSync(summaryFile, "", "utf-8");
      process.env[SUMMARY_ENV_VAR] = summaryFile;
      process.env.GITHUB_ACTIONS = "true";
    }

    if (process.env.GITHUB_ACTIONS && this.suite) {
      const os = process.platform;
      const summary = core.summary;

      const summaryTitle =
        typeof this.options.title === "undefined"
          ? "Test results"
          : this.options.title;
      if (summaryTitle) {
        summary.addHeading(summaryTitle, 1);
      }

      const totalStatus = getTotalStatus(this.suite?.suites);

      const headerText = [`Total tests: ${this.suite.allTests().length}`];

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

      summary.addRaw(headerText.join(` - `));

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
              this.options.showAnnotations,
              this.options.showTags,
              !!this.options.showError
            );

            // Check if there are any failed tests
            const testStatusIcon = getTestStatusIcon(tests[filePath]);

            summary.addDetails(
              `${testStatusIcon} ${fileName} (${os}${
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
              this.options.showAnnotations,
              this.options.showTags,
              !!this.options.showError
            );
            summary.addTable(tableRows);
          }
        }
      }

      await summary.write();
    }

    if (result?.status !== "passed") {
      core.setFailed("Tests failed");
    }
  }
}

export default GitHubAction;
