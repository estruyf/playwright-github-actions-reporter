import { Suite } from "@playwright/test/reporter";
import { getTotalStatus } from "./getTotalStatus.js";

const baseSuite: Suite = {
  tests: [],
  title: "test",
  suites: [],
  titlePath: () => [""],
  project: () => undefined,
  allTests: () => [],
  entries: () => [],
  type: "describe",
};

describe("getTotalStatus", () => {
  it("should return the correct total status when all tests have passed", () => {
    const suites: Suite[] = [
      {
        ...baseSuite,
        allTests: () =>
          [
            {
              results: [{ status: "passed" }],
            },
            {
              results: [{ status: "passed" }],
            },
          ] as any[],
      },
    ];

    const result = getTotalStatus(suites);

    expect(result).toEqual({
      passed: 2,
      failed: 0,
      skipped: 0,
      timedOut: 0,
      flaky: 0,
    });
  });

  it("should return the correct total status when there are failed, skipped, and timed out tests", () => {
    const suites: Suite[] = [
      {
        ...baseSuite,
        allTests: () =>
          [
            {
              results: [{ status: "passed" }],
            },
            {
              results: [{ status: "failed" }],
            },
            {
              results: [{ status: "skipped" }],
            },
            {
              results: [{ status: "timedOut" }],
            },
            {
              results: [{}],
              outcome: () => "unexpected",
            },
          ] as any[],
      },
    ];

    const result = getTotalStatus(suites);

    expect(result).toEqual({
      passed: 1,
      failed: 2,
      skipped: 1,
      timedOut: 1,
      flaky: 0,
    });
  });

  it("should count flaky tests separately (passed with retry > 0)", () => {
    const suites: Suite[] = [
      {
        ...baseSuite,
        allTests: () =>
          [
            {
              results: [{ status: "passed" }],
            },
            {
              results: [{ status: "failed" }, { status: "passed", retry: 1 }],
            },
            {
              results: [
                { status: "failed" },
                { status: "failed" },
                { status: "passed", retry: 2 },
              ],
            },
            {
              results: [{ status: "failed" }],
            },
          ] as any[],
      },
    ];

    const result = getTotalStatus(suites);

    expect(result).toEqual({
      passed: 3,
      failed: 1,
      skipped: 0,
      timedOut: 0,
      flaky: 2,
    });
  });

  it("should return the correct total status when there are no tests", () => {
    const suites: Suite[] = [];

    const result = getTotalStatus(suites);

    expect(result).toEqual({
      passed: 0,
      failed: 0,
      skipped: 0,
      timedOut: 0,
      flaky: 0,
    });
  });
});
