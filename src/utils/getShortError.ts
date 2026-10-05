// Matches ANSI escape sequences (colors, cursor movement, ...)
const ANSI_REGEX = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
// Matches control characters, except tabs and new lines
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000b-\u001f\u007f]/g;

export const DEFAULT_MAX_ERROR_LENGTH = 180;

/**
 * Turns a (multi-line) Playwright error message into a single, compact line.
 */
export const getShortError = (
  message: string | undefined,
  maxLength: number = DEFAULT_MAX_ERROR_LENGTH,
): string => {
  if (!message) {
    return "";
  }

  const firstLine =
    message
      .replace(ANSI_REGEX, "")
      .replace(CONTROL_CHARS_REGEX, "")
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .find((line) => line.length > 0) || "";

  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  return `${firstLine.substring(0, maxLength).trimEnd()}...`;
};
