import { TestCase } from "@playwright/test/reporter";
import { getSuiteStatusIcon } from "./getSuiteStatusIcon";

describe("getSuiteStatusIcon", () => {
  it("should return ✅ if all tests have passed", () => {
    const tests = [
      { results: [{ status: "passed" }], outcome: () => "expected" },
    ] as TestCase[];

    const result = getSuiteStatusIcon(tests);

    expect(result).toBe("✅");
  });

  it("should return ⏭️ if any test has been skipped", () => {
    const tests = [
      { results: [{ status: "skipped" }], outcome: () => "expected" },
    ] as TestCase[];

    const result = getSuiteStatusIcon(tests);

    expect(result).toBe("✅");
  });

  it("should return ❌ if any test has failed, interrupted, or timed out", () => {
    const tests = [
      { results: [{ status: "failed" }], outcome: () => "expected" },
    ] as TestCase[];

    const result = getSuiteStatusIcon(tests);

    expect(result).toBe("❌");
  });

  it("should return ❌ if no tests", () => {
    const result = getSuiteStatusIcon(undefined as any);

    expect(result).toBe("❌");
  });

  it("should return ❌ if there is no test status", () => {
    const tests = [
      { results: [{}], outcome: () => "unexpected" },
    ] as TestCase[];

    const result = getSuiteStatusIcon(tests);

    expect(result).toBe("❌");
  });

  it("should return ⚠️ if any test is flaky", () => {
    const tests = [{ results: [{}], outcome: () => "flaky" }] as TestCase[];

    const result = getSuiteStatusIcon(tests);

    expect(result).toBe("⚠️");
  });
});
