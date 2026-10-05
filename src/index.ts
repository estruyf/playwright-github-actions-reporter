import { setFailed } from "@actions/core";
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  FullResult,
  TestError,
  TestResult,
  WorkerInfo,
} from "@playwright/test/reporter";
import { processResults } from "./utils/processResults.js";
import { getTotalStatus } from "./utils/getTotalStatus.js";
import { getFailureReason } from "./utils/getFailureReason.js";
import { setResultOutputs } from "./utils/setResultOutputs.js";
import type { GlobalError } from "./utils/getGlobalErrors.js";
import type { Shard } from "./utils/getShard.js";
import type { GitHubActionOptions } from "./models/index.js";
export type { GitHubActionOptions } from "./models/index.js";

class GitHubAction implements Reporter {
  private suite: Suite | undefined;
  private failOnFlakyTests = false;
  private shard: Shard | null = null;
  private errors: GlobalError[] = [];

  constructor(
    private options: GitHubActionOptions = {
      showAnnotations: true,
      showAnnotationsInColumn: false,
      showTags: true,
      quiet: false,
    },
  ) {
    console.log(`Using GitHub Actions reporter`);

    // Set default options
    if (typeof options.showAnnotations === "undefined") {
      this.options.showAnnotations = true;
    }
    if (typeof options.showAnnotationsInColumn === "undefined") {
      this.options.showAnnotationsInColumn = false;
    }

    if (typeof options.showTags === "undefined") {
      this.options.showTags = true;
    }

    if (typeof options.includeResults === "undefined") {
      this.options.includeResults = ["fail", "flaky", "pass", "skipped"];
    }

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log(`Using development mode`);
      console.log(`Options: ${JSON.stringify(this.options, null, 2)}`);
    }
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.suite = suite;
    // Available since Playwright 1.50
    this.failOnFlakyTests = !!(config as { failOnFlakyTests?: boolean })
      .failOnFlakyTests;
    this.shard = config?.shard || null;
  }

  // Errors outside of tests, like a failing global setup or worker teardown
  onError(error: TestError, workerInfo?: WorkerInfo) {
    this.errors.push({ error, projectName: workerInfo?.project?.name });
  }

  onStdOut(
    chunk: string | Buffer,
    _: void | TestCase,
    __: void | TestResult,
  ): void {
    if (this.options.quiet) {
      return;
    }

    const text = chunk.toString("utf-8");
    process.stdout.write(text);
  }

  onStdErr(chunk: string | Buffer, _: TestCase, __: TestResult) {
    if (this.options.quiet) {
      return;
    }

    const text = chunk.toString("utf-8");
    process.stderr.write(text);
  }

  async onEnd(result: FullResult) {
    const totals = getTotalStatus(this.suite?.suites || []);
    const failureReason = getFailureReason(
      result?.status,
      totals,
      this.failOnFlakyTests,
      this.errors.length,
    );

    await processResults(this.suite, this.options, {
      failureReason,
      errors: this.errors,
      failOnFlakyTests: this.failOnFlakyTests,
      shard: this.shard,
    });

    if (result?.status) {
      setResultOutputs(
        this.suite?.allTests().length || 0,
        totals,
        result.status,
      );
    }

    if (result?.status !== "passed") {
      setFailed(failureReason || "Tests failed");
    }
  }
}

export default GitHubAction;
