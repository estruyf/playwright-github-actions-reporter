import { TestCase } from "@playwright/test/reporter";

/**
 * Retrieves the tags associated with a test case.
 *
 * @param test - The test case object.
 * @returns A string containing the tags separated by commas.
 */
export const getTestTags = (test: TestCase): string => {
  return (
    test?.tags
      ?.map((t) => (t.startsWith(`@`) ? t.substring(1) : t))
      .join(", ") || ""
  );
};
