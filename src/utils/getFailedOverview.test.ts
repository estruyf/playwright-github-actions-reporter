import type { DisplayLevel } from "../models/index.js";
import { TABLE_SPACER } from "./summaryTable.js";
import { getFailedOverview } from "./getFailedOverview.js";

const defaultDisplayLevel: DisplayLevel[] = [
  "pass",
  "fail",
  "flaky",
  "skipped",
];

const headers = [
  { data: "File", header: true },
  { data: "Test", header: true, width: "40%" },
  { data: `Error${TABLE_SPACER}`, header: true, width: "60%" },
];

const createTest = (
  title: string,
  file: string,
  results: any[],
  parentTitle = "",
) => ({
  title,
  location: { file },
  results,
  parent: { title: parentTitle },
});

const createSuite = (projects: { name?: string; tests: any[] }[]): any => ({
  suites: projects.map((p) => ({
    project: () => (p.name ? { name: p.name } : undefined),
    allTests: () => p.tests,
  })),
});

describe("getFailedOverview", () => {
  it("should return undefined when no test failed", () => {
    const suite = createSuite([
      {
        name: "chromium",
        tests: [
          createTest("passes", "/tests/a.spec.ts", [{ status: "passed" }]),
          createTest("flaky", "/tests/a.spec.ts", [
            { status: "failed", retry: 0 },
            { status: "passed", retry: 1 },
          ]),
          createTest("skipped", "/tests/b.spec.ts", [{ status: "skipped" }]),
        ],
      },
    ]);

    expect(getFailedOverview(suite, defaultDisplayLevel)).toBeUndefined();
  });

  it("should return undefined when failed tests are not included in the results", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("fails", "/tests/a.spec.ts", [
            { status: "failed", error: { message: "Boom" } },
          ]),
        ],
      },
    ]);

    expect(
      getFailedOverview(suite, ["pass", "flaky", "skipped"]),
    ).toBeUndefined();
  });

  it("should list failed and timed out tests across all files and projects", () => {
    const suite = createSuite([
      {
        name: "chromium",
        tests: [
          createTest(
            "opens the menu",
            "/tests/navigation.spec.ts",
            [
              {
                status: "failed",
                error: {
                  message:
                    "\u001b[31mError:\u001b[39m expect(locator).toBeVisible() failed\n\nCall log:\n  - waiting",
                },
              },
            ],
            "Navigation",
          ),
          createTest("passes", "/tests/navigation.spec.ts", [
            { status: "passed" },
          ]),
          createTest("takes too long", "/tests/timeout.spec.ts", [
            {
              status: "timedOut",
              error: { message: "Test timeout of 2000ms exceeded." },
            },
          ]),
        ],
      },
      {
        tests: [
          createTest("no error", "/tests/setup.spec.ts", [
            { status: "interrupted" },
          ]),
        ],
      },
    ]);

    expect(getFailedOverview(suite, defaultDisplayLevel)).toEqual({
      rows: [
        headers,
        [
          { data: "<code>navigation.spec.ts</code>&nbsp;(chromium)" },
          { data: "Navigation > opens the menu" },
          {
            data: "<code>Error: expect(locator).toBeVisible() failed</code>",
          },
        ],
        [
          { data: "<code>timeout.spec.ts</code>&nbsp;(chromium)" },
          { data: "takes too long" },
          { data: "<code>Test timeout of 2000ms exceeded.</code>" },
        ],
        [
          { data: "<code>setup.spec.ts</code>" },
          { data: "no error" },
          { data: "" },
        ],
      ],
      remaining: 0,
    });
  });

  it("should escape HTML in the error message", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("fails", "/tests/a.spec.ts", [
            {
              status: "failed",
              error: { message: "Expected <div> & <span>" },
            },
          ]),
        ],
      },
    ]);

    const overview = getFailedOverview(suite, defaultDisplayLevel);
    expect(overview?.rows[1][2]).toEqual({
      data: "<code>Expected &lt;div&gt; &amp; &lt;span&gt;</code>",
    });
  });

  it("should use the last result of a test", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("retried", "/tests/a.spec.ts", [
            { status: "failed", retry: 0, error: { message: "First" } },
            { status: "failed", retry: 1, error: { message: "Second" } },
          ]),
        ],
      },
    ]);

    const overview = getFailedOverview(suite, defaultDisplayLevel);
    expect(overview?.rows[1][2]).toEqual({ data: "<code>Second</code>" });
  });

  it("should cap the rows to 10 by default and return the remaining count", () => {
    const tests = Array.from({ length: 13 }, (_, i) =>
      createTest(`Test ${i + 1}`, "/tests/a.spec.ts", [{ status: "failed" }]),
    );
    const suite = createSuite([{ tests }]);

    const overview = getFailedOverview(suite, defaultDisplayLevel);
    expect(overview?.rows.length).toBe(11);
    expect(overview?.rows[10][1]).toEqual({ data: "Test 10" });
    expect(overview?.remaining).toBe(3);
  });

  it("should cap the rows to the provided limit", () => {
    const tests = Array.from({ length: 5 }, (_, i) =>
      createTest(`Test ${i + 1}`, "/tests/a.spec.ts", [{ status: "failed" }]),
    );
    const suite = createSuite([{ tests }]);

    const overview = getFailedOverview(suite, defaultDisplayLevel, 2);
    expect(overview?.rows.length).toBe(3);
    expect(overview?.remaining).toBe(3);
  });
});
