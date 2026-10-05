import { getSlowestTests } from "./getSlowestTests.js";

const headers = [
  { data: "File", header: true },
  { data: "Test", header: true, width: "100%" },
  { data: "Duration", header: true },
  { data: "Retries", header: true },
];

const fileSuite = { type: "file", title: "a.spec.ts" };

const createTest = (
  title: string,
  results: any[],
  parent: any = fileSuite,
  file = "/tests/a.spec.ts",
) => ({
  title,
  location: { file },
  results,
  parent,
});

const createSuite = (projects: { name?: string; tests: any[] }[]): any => ({
  suites: projects.map((p) => ({
    project: () => (p.name ? { name: p.name } : undefined),
    allTests: () => p.tests,
  })),
});

describe("getSlowestTests", () => {
  it("should return undefined when the count is 0 or lower", () => {
    const suite = createSuite([
      {
        tests: [createTest("Test", [{ status: "passed", duration: 1000 }])],
      },
    ]);

    expect(getSlowestTests(suite, 0)).toBeUndefined();
    expect(getSlowestTests(suite, -1)).toBeUndefined();
  });

  it("should return undefined when there are no tests to show", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("Skipped", [{ status: "skipped", duration: 0 }]),
          createTest("Not run", []),
        ],
      },
    ]);

    expect(getSlowestTests(suite, 5)).toBeUndefined();
  });

  it("should sort the tests by duration, descending, and cap the count", () => {
    const suite = createSuite([
      {
        name: "chromium",
        tests: [
          createTest("Fast", [{ status: "passed", duration: 1000, retry: 0 }]),
          createTest("Slowest", [
            { status: "passed", duration: 24310, retry: 0 },
          ]),
          createTest("Skipped", [{ status: "skipped", duration: 99999 }]),
        ],
      },
      {
        tests: [
          createTest(
            "Slow",
            [{ status: "failed", duration: 5000, retry: 0 }],
            fileSuite,
            "/tests/b.spec.ts",
          ),
        ],
      },
    ]);

    expect(getSlowestTests(suite, 2)).toEqual([
      headers,
      [
        { data: "<code>a.spec.ts</code>&nbsp;(chromium)" },
        { data: "Slowest" },
        { data: "24.31s" },
        { data: "0" },
      ],
      [
        { data: "<code>b.spec.ts</code>" },
        { data: "Slow" },
        { data: "5s" },
        { data: "0" },
      ],
    ]);
  });

  it("should use the duration of the slowest attempt", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("Retried", [
            { status: "failed", duration: 8000, retry: 0 },
            { status: "passed", duration: 2000, retry: 1 },
          ]),
          createTest("Single", [
            { status: "passed", duration: 5000, retry: 0 },
          ]),
        ],
      },
    ]);

    const rows = getSlowestTests(suite, 5);
    expect(rows?.[1]).toEqual([
      { data: "<code>a.spec.ts</code>" },
      { data: "Retried" },
      { data: "8s" },
      { data: "1" },
    ]);
    expect(rows?.[2][1]).toEqual({ data: "Single" });
  });

  it("should use the full describe path as the test title", () => {
    const outer = { type: "describe", title: "Pages", parent: fileSuite };
    const inner = { type: "describe", title: "Homepage", parent: outer };
    const suite = createSuite([
      {
        tests: [
          createTest(
            "loads all web parts",
            [{ status: "passed", duration: 1000, retry: 0 }],
            inner,
          ),
        ],
      },
    ]);

    const rows = getSlowestTests(suite, 1);
    expect(rows?.[1][1]).toEqual({
      data: "Pages > Homepage > loads all web parts",
    });
  });
});
