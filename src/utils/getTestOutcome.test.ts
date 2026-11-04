import { getTestOutcome } from "./getTestOutcome.js";

describe("getTestOutcome", () => {
  it("should return the status if it exists", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      status: "passed",
    };

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("passed");
  });

  it("should return the result status if it exists", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      status: "passed",
    };

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("passed");
  });

  it("should return 'passed' when the test outcome is 'expected'", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {};

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("passed");
  });

  it("should return 'failed' when the test outcome is 'flaky'", () => {
    const test: any = {
      outcome: () => "flaky",
    };
    const result: any = {};

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("failed");
  });

  it("should return 'failed' when the test outcome is 'unexpected'", () => {
    const test: any = {
      outcome: () => "unexpected",
    };
    const result: any = {};

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("failed");
  });

  it("should return the test outcome when it is neither 'expected', 'flaky', nor 'unexpected'", () => {
    const test: any = {
      outcome: () => "other",
    };
    const result: any = {};

    const outcome = getTestOutcome(test, result);

    expect(outcome).toBe("other");
  });

  it("should return 'passed' when a test.fail() test fails as expected", () => {
    const test: any = {
      expectedStatus: "failed",
      outcome: () => "expected",
    };
    const result: any = {
      status: "failed",
    };

    expect(getTestOutcome(test, result)).toBe("passed");
  });

  it("should return 'failed' when a test.fail() test passes unexpectedly", () => {
    const test: any = {
      expectedStatus: "failed",
      outcome: () => "unexpected",
    };
    const result: any = {
      status: "passed",
    };

    expect(getTestOutcome(test, result)).toBe("failed");
  });

  it("should keep other statuses of a test.fail() test", () => {
    const test: any = {
      expectedStatus: "failed",
      outcome: () => "unexpected",
    };

    expect(getTestOutcome(test, { status: "timedOut" } as any)).toBe(
      "timedOut",
    );
    expect(getTestOutcome(test, { status: "skipped" } as any)).toBe("skipped");
  });
});
