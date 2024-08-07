import { getTestStatusIcon } from "./getTestStatusIcon";

describe("getTestStatusIcon", () => {
  it("should return '⚠️' when test status is 'passed' and result retry is greater than 0", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 1,
      status: "passed",
    };

    const status = getTestStatusIcon(test, result);

    expect(status).toBe("⚠️");
  });

  it("should return '✅' when test status is 'passed' and result retry is 0", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 0,
      status: "passed",
    };

    const status = getTestStatusIcon(test, result);

    expect(status).toBe("✅");
  });

  it("should return '⏭️' when test status is 'skipped'", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 1,
      status: "skipped",
    };

    const status = getTestStatusIcon(test, result);

    expect(status).toBe("⏭️");
  });

  it("should return '❌' when test status is not 'passed' or 'skipped'", () => {
    const test: any = {
      outcome: () => "unexpected",
    };
    const result: any = {
      retry: 1,
      status: "failed",
    };

    const status = getTestStatusIcon(test, result);

    expect(status).toBe("❌");
  });

  it("should return '❌' when no test status is provided", () => {
    const test: any = {
      outcome: () => "unexpected",
    };
    const result: any = {
      retry: 1,
    };

    const status = getTestStatusIcon(test, result);

    expect(status).toBe("❌");
  });
});
