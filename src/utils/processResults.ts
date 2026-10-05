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
import { commentOnPullRequest } from "./commentOnPullRequest.js";
import { getFailedOverview } from "./getFailedOverview.js";
import { getSlowestTests } from "./getSlowestTests.js";
import type { ErrorOptions } from "./getErrorDetails.js";
import { excludeProjects } from "./excludeProjects.js";
import { getSummaryContext } from "./getSummaryContext.js";
import { getTableHtml } from "./summaryTable.js";
import type {
  BlobService,
  DisplayLevel,
  GitHubActionOptions,
} from "../models/index.js";

const SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";

export const processResults = async (
  rootSuite: Suite | undefined,
  options: GitHubActionOptions,
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
    if (summaryTitle) {
      summary.addHeading(summaryTitle, 1);
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
    summary.addRaw(headerText.join(` - `));

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
          );

          if (!content) {
            continue;
          }

          // Check if there are any failed tests
          const testStatusIcon = getSuiteStatusIcon(tests[filePath]);

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
          title: summaryTitle,
          context: summaryContext,
          headerText,
        },
        options.githubToken || process.env.GITHUB_TOKEN,
      );
    }
  }
};
