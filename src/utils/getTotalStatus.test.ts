import { Suite } from "@playwright/test/reporter";
import { getTotalStatus } from "./getTotalStatus";

const baseSuite: Suite = {
  tests: [],
  title: "test",
  suites: [],
  titlePath: () => [""],
  project: () => undefined,
  allTests: () => [],
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
    });
  });
});
