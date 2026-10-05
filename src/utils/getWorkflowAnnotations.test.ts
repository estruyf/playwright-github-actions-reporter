import { error, warning } from "@actions/core";
import {
  emitWorkflowAnnotations,
  getWorkflowAnnotations,
} from "./getWorkflowAnnotations.js";

const workspace = "/home/runner/work/repo/repo";
const fileSuite = { type: "file", title: "shop.spec.ts" };
const describe_ = { type: "describe", title: "Shop", parent: fileSuite };

const createTest = (title: string, results: any[], parent: any = describe_) => ({
  title,
  parent,
  location: { file: `${workspace}/tests/shop.spec.ts`, line: 10, column: 3 },
  results,
});

const createSuite = (projects: { name?: string; tests: any[] }[]): any => ({
  suites: projects.map((p) => ({
    project: () => (p.name ? { name: p.name } : undefined),
    allTests: () => p.tests,
  })),
});

describe("getWorkflowAnnotations", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GITHUB_WORKSPACE = workspace;
    (error as jest.Mock).mockClear();
    (warning as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should not add annotations for passed and skipped tests", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("passes", [{ status: "passed", retry: 0 }]),
          createTest("skipped", [{ status: "skipped", retry: 0 }]),
        ],
      },
    ]);
    expect(getWorkflowAnnotations(suite)).toEqual([]);
  });

  it("should add an error on the failing line of a failed test", () => {
    const suite = createSuite([
      {
        name: "chromium",
        tests: [
          createTest("checkout", [
            {
              status: "failed",
              retry: 0,
              errors: [
                {
                  message:
                    "\u001b[31mError:\u001b[39m expect(locator).toBeVisible() failed\n\nCall log:",
                  location: {
                    file: `${workspace}/tests/helpers.ts`,
                    line: 4,
                    column: 5,
                  },
                },
              ],
            },
          ]),
        ],
      },
    ]);

    expect(getWorkflowAnnotations(suite)).toEqual([
      {
        level: "error",
        message: "Error: expect(locator).toBeVisible() failed",
        properties: {
          title: "[chromium] Shop > checkout",
          file: "tests/helpers.ts",
          startLine: 4,
        },
      },
    ]);
  });

  it("should fall back to the test location and status", () => {
    const suite = createSuite([
      {
        tests: [createTest("times out", [{ status: "timedOut", retry: 0 }])],
      },
    ]);

    expect(getWorkflowAnnotations(suite)).toEqual([
      {
        level: "error",
        message: "Test timedOut",
        properties: {
          title: "Shop > times out",
          file: "tests/shop.spec.ts",
          startLine: 10,
        },
      },
    ]);
  });

  it("should leave out the file when it is outside the workspace", () => {
    delete process.env.GITHUB_WORKSPACE;
    const suite = createSuite([
      {
        tests: [
          createTest("fails", [
            { status: "failed", retry: 0, errors: [{ message: "Boom" }] },
          ]),
        ],
      },
    ]);

    expect(getWorkflowAnnotations(suite)[0].properties).toEqual({
      title: "Shop > fails",
    });
  });

  it("should add a warning for a flaky test with the error of the failed attempt", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("flaky", [
            {
              status: "failed",
              retry: 0,
              errors: [
                {
                  message: "First attempt failed",
                  location: {
                    file: `${workspace}/tests/shop.spec.ts`,
                    line: 12,
                    column: 1,
                  },
                },
              ],
            },
            { status: "passed", retry: 1, errors: [] },
          ]),
        ],
      },
    ]);

    expect(getWorkflowAnnotations(suite)).toEqual([
      {
        level: "warning",
        message: "Flaky test, passed on retry 1: First attempt failed",
        properties: {
          title: "Shop > flaky",
          file: "tests/shop.spec.ts",
          startLine: 12,
        },
      },
    ]);
  });

  it("should add an error for a flaky test with failOnFlakyTests", () => {
    const suite = createSuite([
      {
        tests: [
          createTest("flaky", [
            { status: "failed", retry: 0, errors: [{ message: "Boom" }] },
            { status: "passed", retry: 1, errors: [] },
          ]),
        ],
      },
    ]);

    expect(
      getWorkflowAnnotations(suite, { failOnFlakyTests: true })[0].level,
    ).toBe("error");
  });

  it("should add the errors outside of tests", () => {
    expect(
      getWorkflowAnnotations(createSuite([]), {
        errors: [
          {
            error: {
              message: "Could not sign in",
              location: { file: `${workspace}/global-setup.ts`, line: 2, column: 1 },
            },
          },
          { error: { message: "Teardown failed" }, projectName: "api" },
        ],
      }),
    ).toEqual([
      {
        level: "error",
        message: "Could not sign in",
        properties: {
          title: "Error outside of tests",
          file: "global-setup.ts",
          startLine: 2,
        },
      },
      {
        level: "error",
        message: "Teardown failed",
        properties: { title: "[api] Error outside of tests" },
      },
    ]);
  });

  it("should emit the annotations as errors and warnings", () => {
    emitWorkflowAnnotations([
      { level: "error", message: "Boom", properties: { title: "A" } },
      { level: "warning", message: "Flaky", properties: { title: "B" } },
    ]);

    expect(error).toHaveBeenCalledWith("Boom", { title: "A" });
    expect(warning).toHaveBeenCalledWith("Flaky", { title: "B" });
  });
});
