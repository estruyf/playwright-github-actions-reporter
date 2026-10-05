import { getFailureReason } from "./getFailureReason.js";

const totals = (overrides = {}) => ({
  passed: 0,
  failed: 0,
  skipped: 0,
  timedOut: 0,
  flaky: 0,
  ...overrides,
});

describe("getFailureReason", () => {
  it("should return undefined when the run passed", () => {
    expect(getFailureReason("passed", totals({ flaky: 2 }))).toBeUndefined();
    expect(getFailureReason(undefined, totals())).toBeUndefined();
  });

  it("should list the failed and timed out tests", () => {
    expect(getFailureReason("failed", totals({ failed: 2, timedOut: 1 }))).toBe(
      "2 failed, 1 timed out",
    );
  });

  it("should explain a run that only failed on flaky tests", () => {
    expect(getFailureReason("failed", totals({ flaky: 1 }), true)).toBe(
      "1 flaky test (failOnFlakyTests is enabled)",
    );
    expect(getFailureReason("failed", totals({ flaky: 3 }), true)).toBe(
      "3 flaky tests (failOnFlakyTests is enabled)",
    );
  });

  it("should not mention flaky tests without failOnFlakyTests", () => {
    expect(getFailureReason("failed", totals({ failed: 1, flaky: 2 }))).toBe(
      "1 failed",
    );
  });

  it("should mention errors outside of tests", () => {
    expect(getFailureReason("failed", totals(), false, 1)).toBe(
      "1 error outside of tests",
    );
    expect(getFailureReason("failed", totals({ failed: 1 }), false, 2)).toBe(
      "1 failed, 2 errors outside of tests",
    );
  });

  it("should explain a global timeout", () => {
    expect(getFailureReason("timedout", totals())).toBe(
      "Global timeout reached",
    );
    expect(getFailureReason("timedout", totals({ failed: 1 }))).toBe(
      "Global timeout reached, 1 failed",
    );
  });

  it("should explain an interrupted run", () => {
    expect(getFailureReason("interrupted", totals())).toBe(
      "Test run was interrupted",
    );
  });

  it("should fall back to a generic message", () => {
    expect(getFailureReason("failed", totals({ passed: 3 }))).toBe(
      "Tests failed",
    );
  });
});
