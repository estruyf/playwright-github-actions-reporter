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

class GitHubAction implements Reporter {
  private testDetails: {
    total: number | undefined;

    tests: {
      [fileName: string]: {
        [testTitle: string]: {
          status: TestStatus | "pending";
          duration: number;
        };
      };
    };
  } = {
    total: undefined,
    tests: {},
  };

  constructor(private options: { title?: string } = {}) {
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
    if (process.env.NODE_ENV !== "development") {
      const summary = core.summary;
      summary.addHeading(this.options.title || `Test results`, 1);

      summary.addRaw(`Total tests: ${this.testDetails.total}`);

      for (const fileName of Object.keys(this.testDetails.tests)) {
        const content: string[] = [];

        content.push(`\n`);
        content.push(`<table role="table">`);
        content.push(`<thead>`);
        content.push(`<tr>`);
        content.push(`<th>Test</th>`);
        content.push(`<th>Status</th>`);
        content.push(`<th>Duration</th>`);
        content.push(`</tr>`);
        content.push(`</thead>`);

        content.push(`<tbody>`);

        // summary.addHeading(fileName, 2);

        // const tableRows = [
        //   [
        //     {
        //       data: "Test",
        //       header: true,
        //     },
        //     {
        //       data: "Status",
        //       header: true,
        //     },
        //     {
        //       data: "Duration",
        //       header: true,
        //     },
        //   ],
        // ];

        for (const testName of Object.keys(this.testDetails.tests[fileName])) {
          const test = this.testDetails.tests[fileName][testName];

          content.push(`<tr>`);
          content.push(`<td>${testName}</td>`);
          content.push(
            `<td>${test.status === "passed" ? "✅ Pass" : "❌ Fail"}</td>`
          );
          content.push(`<td>${test.duration / 1000}s</td>`);
          content.push(`</tr>`);

          // content.push(
          //   `| ${testName} | ${
          //     test.status === "passed" ? "✅ Pass" : "❌ Fail"
          //   } | ${test.duration / 1000}s |`
          // );

          // tableRows.push([
          //   {
          //     data: testName,
          //     header: false,
          //   },
          //   {
          //     data: test.status === "passed" ? "✅ Pass" : "❌ Fail",
          //     header: false,
          //   },
          //   {
          //     data: `${test.duration / 1000}s`,
          //     header: false,
          //   },
          // ]);
        }

        content.push(`</tbody>`);
        content.push(`</table>`);
        content.push(`\n`);

        // summary.addTable(tableRows);

        summary.addDetails(fileName, content.join("\n"));
      }

      await summary.write();
    }

    if (result.status !== "passed") {
      core.setFailed("Tests failed");
    }
  }
}

export default GitHubAction;
