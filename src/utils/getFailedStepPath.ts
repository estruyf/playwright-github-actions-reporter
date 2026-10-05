import type { TestResult } from "@playwright/test/reporter";

// Steps that tell which part of the test broke. The last step, the `expect`
// or API call, is already described by the error message.
const PATH_CATEGORIES = ["test.step", "hook"];

/**
 * Path of the steps where the test failed, e.g.
 * `Checkout › Add to cart (SKU 42)`. Only set when the failure happened inside
 * a `test.step` or a hook.
 */
export const getFailedStepPath = (result?: TestResult): string | undefined => {
  const titles: string[] = [];

  let steps = result?.steps || [];
  let failedStep = steps.find((step) => step.error);
  while (failedStep) {
    if (PATH_CATEGORIES.includes(failedStep.category)) {
      // The subtitle is available since Playwright 1.63
      titles.push(
        failedStep.subtitle
          ? `${failedStep.title} (${failedStep.subtitle})`
          : failedStep.title,
      );
    }

    steps = failedStep.steps || [];
    failedStep = steps.find((step) => step.error);
  }

  return titles.length > 0 ? titles.join(" › ") : undefined;
};
