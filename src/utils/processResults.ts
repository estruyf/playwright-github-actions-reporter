import * as core from "@actions/core";
import { SUMMARY_ENV_VAR } from "@actions/core/lib/summary";
import { Suite } from "@playwright/test/reporter";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { getHtmlTable } from "./getHtmlTable";
import { getSuiteStatusIcon } from "./getSuiteStatusIcon";
import { getTableRows } from "./getTableRows";
import { getSummaryTitle } from "./getSummaryTitle";
import { getSummaryDetails } from "./getSummaryDetails";
import { getTestsPerFile } from "./getTestsPerFile";
import { getTestHeading } from "./getTestHeading";
import { DisplayLevel, GitHubActionOptions } from "../models";
import { getFailureScreenshot } from "./getFailureScreenshot";

export const processResults = async (
  suite: Suite | undefined,
  options: GitHubActionOptions
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

  const screenshotsDir = join(__dirname, "../../unzipped-screenshots/test-results/screenshots");

  if (process.env.GITHUB_ACTIONS && suite) {
    const os = process.platform;
    const summary = core.summary;

    const summaryTitle = getSummaryTitle(options.title);
    if (summaryTitle) {
      summary.addHeading(summaryTitle, 1);
    }

    const headerText = getSummaryDetails(suite);
    summary.addRaw(headerText.join(` - `));

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
            options.includeResults as DisplayLevel[]
          );

          if (!content) {
            continue;
          }
          // Check if there are any failed tests
          const testStatusIcon = getSuiteStatusIcon(tests[filePath]);

          summary.addDetails(
            `${testStatusIcon} ${getTestHeading(fileName, os, project)}`,
            content
          );

          for (const test of tests[filePath]) {
            for (const result of test.results) {
              if (result.status === "failed") {
                const screenshotPath = getFailureScreenshot(test, result);
                if (screenshotPath !== "No failure screenshot available.") {
                  const screenshotFileName = basename(screenshotPath);
                  const screenshotUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}/artifacts/playwright-screenshots/contents/test-results/screenshots/${screenshotFileName}`;
                  summary.addDetails(
                    `Error Screenshot for ${test.title}`,
                    `<img src="${screenshotUrl}" alt="Error Screenshot for ${test.title}" />`
                  );
                }
              }
            }
          }
        } else {
          const tableRows = await getTableRows(
            tests[filePath],
            options.showAnnotations,
            options.showTags,
            !!options.showError,
            options.includeResults as DisplayLevel[]
          );

          if (tableRows.length !== 0) {
            summary.addHeading(getTestHeading(fileName, os, project), 2);
            summary.addTable(tableRows);

            for (const test of tests[filePath]) {
              for (const result of test.results) {
                if (result.status === "failed") {
                  const screenshotPath = getFailureScreenshot(test, result);
                  if (screenshotPath !== "No failure screenshot available.") {
                    const screenshotFileName = basename(screenshotPath);
                    const screenshotUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}/artifacts/playwright-screenshots/contents/test-results/screenshots/${screenshotFileName}`;
                    summary.addDetails(
                      `Error Screenshot for ${test.title}`,
                      `<img src="${screenshotUrl}" alt="Error Screenshot for ${test.title}" />`
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    await summary.write();
  }
};
