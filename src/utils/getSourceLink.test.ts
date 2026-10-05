import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  getCommitSha,
  getSourceLink,
  getSourceUrl,
  getWorkspacePath,
} from "./getSourceLink.js";

const ENV_KEYS = [
  "GITHUB_EVENT_PATH",
  "GITHUB_SERVER_URL",
  "GITHUB_REPOSITORY",
  "GITHUB_WORKSPACE",
  "GITHUB_SHA",
];

const writeEvent = (event: unknown): string => {
  const dir = mkdtempSync(join(tmpdir(), "gh-event-"));
  const filePath = join(dir, "event.json");
  writeFileSync(filePath, JSON.stringify(event), "utf-8");
  return filePath;
};

const location = {
  file: "/home/runner/work/repo/repo/tests/fail.spec.ts",
  line: 22,
  column: 5,
};

describe("getSourceLink", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const setGitHubEnv = () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_WORKSPACE = "/home/runner/work/repo/repo";
    process.env.GITHUB_SHA = "merge-sha";
  };

  describe("getCommitSha", () => {
    it("should return GITHUB_SHA outside of pull requests", () => {
      process.env.GITHUB_SHA = "abc123";
      process.env.GITHUB_EVENT_PATH = writeEvent({ ref: "refs/heads/main" });
      expect(getCommitSha()).toBe("abc123");
    });

    it("should return the head commit of a pull request", () => {
      process.env.GITHUB_SHA = "merge-sha";
      process.env.GITHUB_EVENT_PATH = writeEvent({
        pull_request: { head: { sha: "head-sha" } },
      });
      expect(getCommitSha()).toBe("head-sha");
    });

    it("should fall back to GITHUB_SHA for an invalid event payload", () => {
      process.env.GITHUB_SHA = "abc123";
      const dir = mkdtempSync(join(tmpdir(), "gh-event-"));
      const eventPath = join(dir, "event.json");
      writeFileSync(eventPath, "not json", "utf-8");
      process.env.GITHUB_EVENT_PATH = eventPath;
      expect(getCommitSha()).toBe("abc123");
    });
  });

  describe("getWorkspacePath", () => {
    it("should return undefined outside of GitHub Actions", () => {
      expect(getWorkspacePath(location.file)).toBeUndefined();
    });

    it("should return the path relative to the workspace", () => {
      setGitHubEnv();
      expect(getWorkspacePath(location.file)).toBe("tests/fail.spec.ts");
    });

    it("should return undefined for files outside the workspace", () => {
      setGitHubEnv();
      expect(getWorkspacePath("/home/runner/other/file.ts")).toBeUndefined();
      expect(getWorkspacePath(undefined)).toBeUndefined();
    });
  });

  describe("getSourceUrl", () => {
    it("should return undefined outside of GitHub Actions", () => {
      expect(getSourceUrl(location)).toBeUndefined();
    });

    it("should return undefined without a location", () => {
      setGitHubEnv();
      expect(getSourceUrl(undefined)).toBeUndefined();
    });

    it("should link to the line relative to the workspace", () => {
      setGitHubEnv();
      expect(getSourceUrl(location)).toBe(
        "https://github.com/owner/repo/blob/merge-sha/tests/fail.spec.ts#L22",
      );
    });

    it("should use the server URL and the pull request head commit", () => {
      setGitHubEnv();
      process.env.GITHUB_SERVER_URL = "https://github.example.com";
      process.env.GITHUB_EVENT_PATH = writeEvent({
        pull_request: { head: { sha: "head-sha" } },
      });
      expect(getSourceUrl(location)).toBe(
        "https://github.example.com/owner/repo/blob/head-sha/tests/fail.spec.ts#L22",
      );
    });

    it("should encode special characters in the path", () => {
      setGitHubEnv();
      expect(
        getSourceUrl({
          ...location,
          file: "/home/runner/work/repo/repo/tests/my #1 test.spec.ts",
        }),
      ).toBe(
        "https://github.com/owner/repo/blob/merge-sha/tests/my%20%231%20test.spec.ts#L22",
      );
    });

    it("should return undefined for files outside the workspace", () => {
      setGitHubEnv();
      expect(
        getSourceUrl({
          ...location,
          file: "/home/runner/node_modules/pkg/index.js",
        }),
      ).toBeUndefined();
    });
  });

  describe("getSourceLink", () => {
    it("should return an empty string without a location", () => {
      expect(getSourceLink(undefined)).toBe("");
    });

    it("should return the file and line as text outside of GitHub Actions", () => {
      expect(getSourceLink(location)).toBe("fail.spec.ts:22");
    });

    it("should return a link in GitHub Actions", () => {
      setGitHubEnv();
      expect(getSourceLink(location)).toBe(
        `<a href="https://github.com/owner/repo/blob/merge-sha/tests/fail.spec.ts#L22">fail.spec.ts:22</a>`,
      );
    });
  });
});
