import { getGlobalErrors } from "./getGlobalErrors.js";
import { TABLE_SPACER } from "./summaryTable.js";

describe("getGlobalErrors", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of [
      "GITHUB_EVENT_PATH",
      "GITHUB_REPOSITORY",
      "GITHUB_WORKSPACE",
      "GITHUB_SHA",
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return undefined without errors", () => {
    expect(getGlobalErrors()).toBeUndefined();
    expect(getGlobalErrors([])).toBeUndefined();
  });

  it("should render the errors without a project column", () => {
    expect(
      getGlobalErrors([
        {
          error: {
            message: "Global setup failed",
            location: { file: "/repo/global-setup.ts", line: 4, column: 1 },
          },
        },
      ]),
    ).toEqual([
      [{ data: `Error${TABLE_SPACER}`, header: true, width: "100%" }],
      [{ data: "Global setup failed<br><br>at global-setup.ts:4" }],
    ]);
  });

  it("should add the project when the error happened in a worker", () => {
    expect(
      getGlobalErrors([
        { error: { message: "Global setup failed" } },
        { error: { message: "Fixture teardown failed" }, projectName: "chromium" },
      ]),
    ).toEqual([
      [
        { data: "Project", header: true },
        { data: `Error${TABLE_SPACER}`, header: true, width: "100%" },
      ],
      [{ data: "" }, { data: "Global setup failed" }],
      [{ data: "chromium" }, { data: "Fixture teardown failed" }],
    ]);
  });

  it("should use the short error format", () => {
    const rows = getGlobalErrors([{ error: { message: "Boom\nCall log:" } }], {
      errorFormat: "short",
    });
    expect(rows?.[1]).toEqual([{ data: "Boom" }]);
  });
});
