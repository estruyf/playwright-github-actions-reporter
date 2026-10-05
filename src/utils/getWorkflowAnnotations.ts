import {
  error as annotateError,
  warning as annotateWarning,
  type AnnotationProperties,
} from "@actions/core";
import type { Location, Suite, TestError } from "@playwright/test/reporter";
import { getErrorMessage, getTestErrors } from "./getErrorDetails.js";
import { getShortError } from "./getShortError.js";
import { getTestStatus } from "./getTestStatus.js";
import { getTestTitlePath } from "./getTestTitlePath.js";
import { getWorkspacePath } from "./getSourceLink.js";
import type { GlobalError } from "./getGlobalErrors.js";

export interface WorkflowAnnotation {
  level: "error" | "warning";
  message: string;
  properties: AnnotationProperties;
}

interface AnnotationOptions {
  maxErrorLength?: number;
  failOnFlakyTests?: boolean;
  errors?: GlobalError[];
}

const getProperties = (
  title: string,
  location?: Location,
): AnnotationProperties => {
  // Without a file in the repository, the annotation only shows on the run
  const file = getWorkspacePath(location?.file);
  return file && location
    ? { title, file, startLine: location.line }
    : { title };
};

const getMessage = (error: TestError | undefined, maxErrorLength?: number) =>
  getShortError(getErrorMessage(error), maxErrorLength);

/**
 * Annotations for the failed and flaky tests, and the errors outside of tests.
 * They are placed on the failing line, or on the test when it is unknown.
 */
export const getWorkflowAnnotations = (
  suite: Suite,
  options: AnnotationOptions = {},
): WorkflowAnnotation[] => {
  const annotations: WorkflowAnnotation[] = [];

  for (const projectSuite of suite.suites) {
    const projectName = projectSuite.project()?.name;

    for (const test of projectSuite.allTests()) {
      const result = test.results[test.results.length - 1];
      const status = getTestStatus(test, result);
      const title = `${projectName ? `[${projectName}] ` : ""}${getTestTitlePath(
        test,
      )}`;

      if (status === "Fail") {
        const error = getTestErrors(result)[0];
        annotations.push({
          level: "error",
          message:
            getMessage(error, options.maxErrorLength) ||
            `Test ${result?.status || "failed"}`,
          properties: getProperties(title, error?.location || test.location),
        });
      } else if (status === "Flaky") {
        // The error of the attempt that failed before the retry passed
        const error = test.results
          .map((attempt) => getTestErrors(attempt)[0])
          .find(Boolean);
        const message = getMessage(error, options.maxErrorLength);
        annotations.push({
          // With `failOnFlakyTests`, a flaky test fails the run
          level: options.failOnFlakyTests ? "error" : "warning",
          message: `Flaky test, passed on retry ${result.retry}${
            message ? `: ${message}` : ""
          }`,
          properties: getProperties(title, error?.location || test.location),
        });
      }
    }
  }

  for (const { error, projectName } of options.errors || []) {
    annotations.push({
      level: "error",
      message: getMessage(error, options.maxErrorLength) || "Unknown error",
      properties: getProperties(
        `${projectName ? `[${projectName}] ` : ""}Error outside of tests`,
        error.location,
      ),
    });
  }

  return annotations;
};

export const emitWorkflowAnnotations = (annotations: WorkflowAnnotation[]) => {
  for (const { level, message, properties } of annotations) {
    if (level === "error") {
      annotateError(message, properties);
    } else {
      annotateWarning(message, properties);
    }
  }
};
