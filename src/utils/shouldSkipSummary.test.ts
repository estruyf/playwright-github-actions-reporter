import { shouldSkipSummary } from "./shouldSkipSummary.js";

const totals = (overrides = {}) => ({
  passed: 3,
  failed: 0,
  skipped: 0,
  timedOut: 0,
  flaky: 0,
  ...overrides,
});

describe("shouldSkipSummary", () => {
  it("should not skip without the option", () => {
    expect(shouldSkipSummary(undefined, "passed", totals())).toBe(false);
    expect(shouldSkipSummary(false, "passed", totals())).toBe(false);
  });

  it("should skip when the run passed without flaky tests", () => {
    expect(shouldSkipSummary(true, "passed", totals())).toBe(true);
    expect(shouldSkipSummary(true, "passed", totals({ skipped: 2 }))).toBe(
      true,
    );
    expect(shouldSkipSummary(true, "passed", totals({ passed: 0 }))).toBe(
      true,
    );
  });

  it("should not skip when a test was flaky", () => {
    expect(shouldSkipSummary(true, "passed", totals({ flaky: 1 }))).toBe(false);
  });

  it("should not skip when the run did not pass", () => {
    expect(shouldSkipSummary(true, "failed", totals({ failed: 1 }))).toBe(
      false,
    );
    expect(shouldSkipSummary(true, "timedout", totals())).toBe(false);
    expect(shouldSkipSummary(true, "interrupted", totals())).toBe(false);
    expect(shouldSkipSummary(true, undefined, totals())).toBe(false);
  });
});
