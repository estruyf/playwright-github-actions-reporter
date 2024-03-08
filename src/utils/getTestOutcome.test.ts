import { getTestOutcome } from "./getTestOutcome";

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
});
