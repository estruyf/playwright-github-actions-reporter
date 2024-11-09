import { getSummaryDetails } from "./getSummaryDetails";

describe("getSummaryDetails", () => {
  it("should return the total number of tests", () => {
    const suite = {
      suites: [],
      allTests: () => [{}, {}, {}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result).toContain("🧪 Total: 3");
    expect(result.length).toBe(1);
  });

  it("should include the number of passed tests if there are any", () => {
    const suite = {
      suites: [
        {
          allTests: () => [{ results: [{ status: "passed" }] }],
        },
        {
          allTests: () => [
            { results: [{ status: "passed" }] },
            { results: [{ status: "passed" }] },
          ],
        },
      ],
      allTests: () => [{}, {}, {}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result).toContain("✅ Pass: 3");
    expect(result.length).toBe(2);
  });

  it("should include the number of failed tests if there are any", () => {
    const suite = {
      suites: [
        {
          allTests: () => [{ results: [{ status: "passed" }] }],
        },
        {
          allTests: () => [
            { results: [{ status: "failed" }] },
            { results: [{ status: "passed" }] },
          ],
        },
      ],
      allTests: () => [{}, {}, {}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result).toContain("❌ Fail: 1");
    expect(result.length).toBe(3);
  });

  it("should include the number of skipped tests if there are any", () => {
    const suite = {
      suites: [
        {
          allTests: () => [{ results: [{ status: "skipped" }] }],
        },
        {
          allTests: () => [{ results: [{ status: "skipped" }] }],
        },
      ],
      allTests: () => [{}, {}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result).toContain("⏭️ Skip: 2");
    expect(result.length).toBe(2);
  });

  it("should include the number of timed out tests if there are any", () => {
    const suite = {
      suites: [
        {
          allTests: () => [{ results: [{ status: "timedOut" }] }],
        },
      ],
      allTests: () => [{}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result).toContain("🕐 Time Out: 1");
    expect(result.length).toBe(2);
  });

  it("should include all test states", () => {
    const suite = {
      suites: [
        {
          allTests: () => [{ results: [{ status: "passed" }] }],
        },
        {
          allTests: () => [
            { results: [{ status: "failed" }] },
            { results: [{ status: "skipped" }] },
          ],
        },
        {
          allTests: () => [{ results: [{ status: "timedOut" }] }],
        },
      ],
      allTests: () => [{}, {}, {}, {}],
    };
    const result = getSummaryDetails(suite as any);
    expect(result.length).toBe(5);
  });
});
