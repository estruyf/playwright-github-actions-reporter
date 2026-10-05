import { marked } from "marked";
import type { SummaryMetadata } from "../models/index.js";

const isEmpty = (value: unknown) =>
  value === undefined || value === null || `${value}`.trim() === "";

/**
 * Custom context rendered between the title and the results. The step summary
 * is HTML, so the markdown is converted first.
 */
export const getSummaryContext = async (
  description?: string,
  metadata?: SummaryMetadata,
): Promise<string> => {
  const markdown: string[] = [];

  if (!isEmpty(description)) {
    markdown.push(`${description}`.trim());
  }

  // Skip empty values, so env based config stays clean
  const items = Object.entries(metadata || {})
    .filter(([key, value]) => !isEmpty(key) && !isEmpty(value))
    .map(([key, value]) => `- **${key}**: ${value}`);

  if (items.length > 0) {
    markdown.push(items.join("\n"));
  }

  if (markdown.length === 0) {
    return "";
  }

  return (await marked.parse(markdown.join("\n\n"))).trim();
};
