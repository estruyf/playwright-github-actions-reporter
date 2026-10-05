import { setOutput } from "@actions/core";
import { setResultOutputs } from "./setResultOutputs.js";

const totals = { passed: 4, failed: 2, skipped: 1, timedOut: 1, flaky: 3 };

describe("setResultOutputs", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    (setOutput as jest.Mock).mockClear();
    delete process.env.GITHUB_OUTPUT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should not set outputs outside of GitHub Actions", () => {
    setResultOutputs(11, totals, "failed");
    expect(setOutput).not.toHaveBeenCalled();
  });

  it("should set the counts and status as step outputs", () => {
    process.env.GITHUB_OUTPUT = "/tmp/github-output";
    setResultOutputs(11, totals, "failed");

    expect((setOutput as jest.Mock).mock.calls).toEqual([
      ["total", 11],
      ["passed", 4],
      ["failed", 2],
      ["flaky", 3],
      ["skipped", 1],
      ["timed-out", 1],
      ["status", "failed"],
    ]);
  });
});
