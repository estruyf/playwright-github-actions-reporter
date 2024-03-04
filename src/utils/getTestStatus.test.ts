import { getTestStatus } from "./getTestStatus";

describe("getTestStatus", () => {
  it("should return '⚠️ Pass' when test status is 'passed' and result retry is greater than 0", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 1,
      status: "passed",
    };

    const status = getTestStatus(test, result);

    expect(status).toBe("⚠️ Pass");
  });

  it("should return '✅ Pass' when test status is 'passed' and result retry is 0", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 0,
      status: "passed",
    };

    const status = getTestStatus(test, result);

    expect(status).toBe("✅ Pass");
  });

  it("should return '⚠️ Skipped' when test status is 'skipped'", () => {
    const test: any = {
      outcome: () => "expected",
    };
    const result: any = {
      retry: 1,
      status: "skipped",
    };

    const status = getTestStatus(test, result);

    expect(status).toBe("⚠️ Skipped");
  });

  it("should return '❌ Fail' when test status is not 'passed' or 'skipped'", () => {
    const test: any = {
      outcome: () => "unexpected",
    };
    const result: any = {
      retry: 1,
      status: "failed",
    };

    const status = getTestStatus(test, result);

    expect(status).toBe("❌ Fail");
  });

  it("should return '❌ Fail' when no test status is provided", () => {
    const test: any = {
      outcome: () => "unexpected",
    };
    const result: any = {
      retry: 1,
    };

    const status = getTestStatus(test, result);

    expect(status).toBe("❌ Fail");
  });
});
