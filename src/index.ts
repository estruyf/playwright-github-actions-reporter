import * as core from "@actions/core";
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  FullResult,
  TestResult,
} from "@playwright/test/reporter";
import { processResults } from "./utils/processResults";
import { GitHubActionOptions } from "./models";
export { GitHubActionOptions } from "./models";

class GitHubAction implements Reporter {
  private suite: Suite | undefined;

  constructor(
    private options: GitHubActionOptions = {
      showAnnotations: true,
      showTags: true,
      quiet: false,
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

    if (typeof options.includeResults === "undefined") {
      this.options.includeResults = ["fail", "flaky", "pass", "skipped"];
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
    await processResults(this.suite, this.options);

    if (result?.status !== "passed") {
      core.setFailed("Tests failed");
    }
  }
}

export default GitHubAction;
