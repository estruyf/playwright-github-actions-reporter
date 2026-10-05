import { summary } from "@actions/core";
import type { Suite } from "@playwright/test/reporter";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { getHtmlTable } from "./getHtmlTable.js";
import { getSuiteStatusIcon } from "./getSuiteStatusIcon.js";
import { getTableRows } from "./getTableRows.js";
import { getSummaryTitle } from "./getSummaryTitle.js";
import { getSummaryDetails } from "./getSummaryDetails.js";
import { getTestsPerFile } from "./getTestsPerFile.js";
import { getTestHeading } from "./getTestHeading.js";
import {
  commentOnPullRequest,
  getCommentMarker,
} from "./commentOnPullRequest.js";
import { getFailedOverview } from "./getFailedOverview.js";
import { getSlowestTests } from "./getSlowestTests.js";
import type { ErrorOptions } from "./getErrorDetails.js";
import { excludeProjects } from "./excludeProjects.js";
import { getSummaryContext } from "./getSummaryContext.js";
import { getTableHtml } from "./summaryTable.js";
import { getGlobalErrors, type GlobalError } from "./getGlobalErrors.js";
import {
  getShardCommentId,
  getShardLabel,
  type Shard,
} from "./getShard.js";
import type {
  BlobService,
  DisplayLevel,
  GitHubActionOptions,
} from "../models/index.js";

const SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";

export interface RunDetails {
  failureReason?: string;
  errors?: GlobalError[];
  failOnFlakyTests?: boolean;
  shard?: Shard | null;
}

export const processResults = async (
  rootSuite: Suite | undefined,
  options: GitHubActionOptions,
  runDetails: RunDetails = {},
) => {
  if (process.env.NODE_ENV === "development") {
    const summaryFile = join(__dirname, "../../summary.html");
    if (existsSync(summaryFile)) {
      unlinkSync(summaryFile);
    }
    writeFileSync(summaryFile, "", "utf-8");
    process.env[SUMMARY_ENV_VAR] = summaryFile;
    process.env.GITHUB_ACTIONS = "true";
  }

  if (process.env.GITHUB_ACTIONS && rootSuite) {
    const suite = excludeProjects(rootSuite, options.excludeProjects);
    const os = process.platform;

    let blobService: BlobService | undefined = undefined;
    if (options.azureStorageSAS && options.azureStorageUrl) {
      blobService = {};
      blobService.azure = {};
      blobService.azure.azureStorageSAS = options.azureStorageSAS;
      blobService.azure.azureStorageUrl = options.azureStorageUrl;
    }

    if (options.showArtifactsLink) {
      summary.addLink("Go to artifacts", "#artifacts");
    }

    const summaryTitle = getSummaryTitle(options.title);
    const shardLabel = getShardLabel(runDetails.shard);
    const displayTitle =
      summaryTitle && shardLabel
        ? `${summaryTitle} (${shardLabel})`
        : summaryTitle;
    if (displayTitle) {
      summary.addHeading(displayTitle, 1);
    } else if (shardLabel) {
      // Without a title, the shard still needs to be visible
      const label = shardLabel.charAt(0).toUpperCase() + shardLabel.slice(1);
      summary.addRaw(`<p>${label}</p>`, true);
    }

    const summaryContext = await getSummaryContext(
      options.description,
      options.metadata,
    );
    if (summaryContext) {
      summary.addRaw(summaryContext, true);
    }

    const errorOptions: ErrorOptions = {
      errorFormat: options.errorFormat,
      maxErrorLength: options.maxErrorLength,
      showErrorSnippet: options.showErrorSnippet,
    };

    const headerText = getSummaryDetails(suite);
    summary.addRaw(headerText.join(` - `), true);

    if (runDetails.failureReason) {
      summary.addRaw(
        `<p>❌ <strong>Run failed:</strong> ${runDetails.failureReason}</p>`,
        true,
      );
    }

    // Shown regardless of `showError`, otherwise the failure is unexplained
    const globalErrors = getGlobalErrors(runDetails.errors, errorOptions);
    if (globalErrors) {
      summary.addHeading("Errors outside of tests", 2);
      summary.addRaw(getTableHtml(globalErrors), true);
    }

    if (options.showFailedOverview) {
      const failedOverview = getFailedOverview(
        suite,
        options.includeResults as DisplayLevel[],
        options.failedOverviewLimit,
        options.maxErrorLength,
      );

      if (failedOverview) {
        summary.addHeading("Failed tests", 2);
        summary.addRaw(getTableHtml(failedOverview.rows), true);

        if (failedOverview.remaining > 0) {
          summary.addRaw(
            `<p>+${failedOverview.remaining} more failed test${
              failedOverview.remaining === 1 ? "" : "s"
            }</p>`,
            true,
          );
        }
      }
    }

    if (options.showSlowestTests && options.showSlowestTests > 0) {
      const slowestTests = getSlowestTests(suite, options.showSlowestTests);

      if (slowestTests) {
        summary.addHeading("Slowest tests", 2);
        summary.addRaw(getTableHtml(slowestTests), true);
      }
    }

    if (options.useDetails) {
      summary.addSeparator();
    }

    for (const crntSuite of suite?.suites) {
      const project = crntSuite.project();

      const tests = getTestsPerFile(crntSuite);

      for (const filePath of Object.keys(tests)) {
        const fileName = basename(filePath);

        if (options.useDetails) {
          const content = await getHtmlTable(
            tests[filePath],
            options.showAnnotations,
            options.showTags,
            !!options.showError,
            options.includeResults as DisplayLevel[],
            options.showAnnotationsInColumn,
            blobService,
            errorOptions,
            runDetails.failOnFlakyTests,
          );

          if (!content) {
            continue;
          }

          // Check if there are any failed tests
          const testStatusIcon = getSuiteStatusIcon(
            tests[filePath],
            runDetails.failOnFlakyTests,
          );

          summary.addDetails(
            `${testStatusIcon} ${getTestHeading(fileName, os, project)}`,
            content,
          );
        } else {
          const tableRows = await getTableRows(
            tests[filePath],
            options.showAnnotations,
            options.showTags,
            !!options.showError,
            options.includeResults as DisplayLevel[],
            options.showAnnotationsInColumn,
            blobService,
            errorOptions,
            runDetails.failOnFlakyTests,
          );

          if (tableRows.length !== 0) {
            summary.addHeading(getTestHeading(fileName, os, project), 2);
            summary.addRaw(getTableHtml(tableRows), true);
          }
        }
      }
    }

    // The summary buffer is emptied on write, so grab the content first
    const summaryContent = options.prComment ? summary.stringify() : "";

    await summary.write();

    if (options.prComment) {
      await commentOnPullRequest(
        {
          content: summaryContent,
          title: displayTitle,
          context: summaryContext,
          headerText,
          marker: getCommentMarker(
            summaryTitle,
            [options.prCommentId, getShardCommentId(runDetails.shard)]
              .filter(Boolean)
              .join(":"),
          ),
        },
        options.githubToken || process.env.GITHUB_TOKEN,
      );
    }
  }
};
