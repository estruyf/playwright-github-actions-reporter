import type { TestError, TestResult } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getShortError } from "./getShortError.js";
import { getSourceLink } from "./getSourceLink.js";
import { getFailedStepPath } from "./getFailedStepPath.js";
import type { ErrorFormat } from "../models/index.js";

export interface ErrorOptions {
  errorFormat?: ErrorFormat;
  maxErrorLength?: number;
  showErrorSnippet?: boolean;
}

// Snippets are wrapped in these markers so the PR comment can leave them out
export const SNIPPET_START = "<!-- error-snippet -->";
export const SNIPPET_END = "<!-- /error-snippet -->";

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * All errors of the result, e.g. every failed `expect.soft()`. Falls back to
 * `result.error`, which only holds the first one.
 */
export const getTestErrors = (result?: TestResult): TestError[] => {
  if (result?.errors && result.errors.length > 0) {
    return result.errors;
  }

  return result?.error ? [result.error] : [];
};

export const getErrorMessage = (error?: TestError): string => {
  return error?.message || error?.value || "";
};

const getFullError = (
  error: TestError,
  convert: Convert,
  showSnippet: boolean,
) => {
  const parts = [convert.toHtml(getErrorMessage(error))];

  const causeMessage = getErrorMessage(error.cause);
  if (causeMessage) {
    parts.push(`<br><br><b>Cause:</b> ${convert.toHtml(causeMessage)}`);
  }

  const sourceLink = getSourceLink(error.location);
  if (sourceLink) {
    parts.push(`<br><br>at ${sourceLink}`);
  }

  if (showSnippet && error.snippet) {
    parts.push(
      `${SNIPPET_START}<details><summary>Code snippet</summary><pre>${new Convert(
        { escapeXML: true },
      ).toHtml(error.snippet.trimEnd())}</pre></details>${SNIPPET_END}`,
    );
  }

  return parts.join("");
};

const getCompactError = (error: TestError, maxLength?: number) => {
  const message = escapeHtml(getShortError(getErrorMessage(error), maxLength));
  const sourceLink = getSourceLink(error.location);

  if (!sourceLink) {
    return message;
  }

  return message ? `${message} (${sourceLink})` : sourceLink;
};

/**
 * HTML for the Error column of a test result.
 */
export const getErrorDetails = (
  result: TestResult | undefined,
  options: ErrorOptions = {},
): string => {
  const errors = getTestErrors(result);
  if (errors.length === 0) {
    return "";
  }

  // Which `test.step` or hook the test failed in
  const failedStep = getFailedStepPath(result);
  const failedAt = failedStep
    ? `<b>Failed at:</b> ${escapeHtml(failedStep)}`
    : "";

  if (options.errorFormat === "short") {
    return [
      failedAt,
      ...errors.map((error) => getCompactError(error, options.maxErrorLength)),
    ]
      .filter(Boolean)
      .join("<br>");
  }

  const convert = new Convert();
  const details = errors
    .map((error) => getFullError(error, convert, !!options.showErrorSnippet))
    .join("<hr>");

  return failedAt ? `${failedAt}<br><br>${details}` : details;
};
