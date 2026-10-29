import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { warning } from "@actions/core";
import {
  createGitHubStorage,
  GitHubStorage,
} from "../../../src/utils/blobServices/githubStorage.js";

const dir = mkdtempSync(join(tmpdir(), "github-storage-"));
const createImage = (name: string) => {
  const path = join(dir, name);
  writeFileSync(path, "png");
  return path;
};

const createTest = (status: string, attachments: any[], retry = 0) => ({
  results: [{ status, retry, attachments }],
});

const createSuite = (tests: any[]): any => ({ allTests: () => tests });

const image = (name: string) => ({
  name: "screenshot",
  contentType: "image/png",
  path: createImage(name),
});

const mockFetch = (failStatus?: number, failOn?: string) => {
  let sha = 0;
  return jest.fn(async (url: string, init: any) => {
    if (failStatus && (!failOn || url.endsWith(failOn))) {
      return {
        ok: false,
        status: failStatus,
        text: async () => "error",
        headers: new Map([["x-ratelimit-remaining", "0"]]),
      };
    }
    return {
      ok: true,
      status: 201,
      json: async () => ({ sha: `sha${++sha}`, method: init.method }),
      headers: new Map([
        ["x-ratelimit-remaining", `${5000 - sha}`],
        ["x-ratelimit-limit", "5000"],
      ]),
    };
  });
};

const today = new Date().toISOString().slice(0, 10);

const calls = (fetchMock: jest.Mock) =>
  fetchMock.mock.calls.map(([url, init]) => {
    const path = (url as string).replace(
      "https://api.github.com/repos/owner/repo/",
      "",
    );
    return `${init.method} ${path.replace(/\/[^/]+-[^/]+$/, "/<uuid>")}`;
  });

describe("GitHubStorage", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let log: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = mockFetch();
    global.fetch = fetchMock as any;
    log = jest.spyOn(console, "log").mockImplementation(() => {});
    (warning as jest.Mock).mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    log.mockRestore();
  });

  test("should upload the images of the shown tests in one commit", async () => {
    const storage = new GitHubStorage("token", "owner/repo", "123");
    const suite = createSuite([
      createTest("failed", [image("a.png"), image("b.png")]),
      createTest("failed", [
        { name: "trace", contentType: "application/zip", path: "trace.zip" },
      ]),
      createTest("passed", [image("c.png")]),
    ]);

    await storage.uploadSuite(suite, ["fail"]);

    expect(calls(fetchMock)).toEqual([
      "POST git/blobs",
      "POST git/blobs",
      "POST git/trees",
      "POST git/commits",
      "POST git/refs",
    ]);
    const ref = JSON.parse(fetchMock.mock.calls[4][1].body).ref;
    expect(ref).toMatch(
      /^refs\/test-attachments\/\d{4}-\d{2}-\d{2}\/123\/1\/[0-9a-f-]{36}$/,
    );

    const url = await storage.getUrl({
      ...suite.allTests()[0].results[0].attachments[0],
    });
    expect(url).toBe(
      "https://github.com/owner/repo/blob/sha4/1-a.png?raw=true",
    );
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  test("should upload an attachment that was not in the batch in a new commit", async () => {
    const storage = new GitHubStorage("token", "owner/repo", "123");
    await storage.uploadSuite(
      createSuite([createTest("failed", [image("a.png")])]),
      ["fail"],
    );
    fetchMock.mockClear();

    const url = await storage.getUrl(image("extra.png"));

    expect(calls(fetchMock)).toEqual([
      "POST git/blobs",
      "POST git/trees",
      "POST git/commits",
      `PATCH git/refs/test-attachments/${today}/123/1/<uuid>`,
    ]);
    expect(url).toMatch(/\/blob\/sha\d+\/2-extra\.png\?raw=true$/);
  });

  test("should stop at the upload limit and warn about it", async () => {
    const storage = new GitHubStorage("token", "owner/repo", "123", {
      maxUploads: 2,
      refPrefix: "e2e",
    });
    const suite = createSuite([
      createTest("failed", [image("a.png"), image("b.png"), image("c.png")]),
    ]);

    await storage.uploadSuite(suite, ["fail"]);
    const urls = await Promise.all(
      suite
        .allTests()[0]
        .results[0].attachments.map((a: any) => storage.getUrl(a)),
    );
    storage.report();

    expect(calls(fetchMock).filter((c) => c === "POST git/blobs")).toHaveLength(
      2,
    );
    expect(urls.filter(Boolean)).toHaveLength(2);
    expect(JSON.parse(fetchMock.mock.calls[4][1].body).ref).toMatch(
      /^refs\/e2e\/\d{4}-\d{2}-\d{2}\/123\//,
    );
    expect(warning).toHaveBeenCalledWith(
      "GitHub storage: 1 attachment(s) not uploaded, over the limit of 2",
    );
  });

  test("should stop all uploads after a refused request", async () => {
    fetchMock = mockFetch(403, "git/blobs");
    global.fetch = fetchMock as any;
    const storage = new GitHubStorage("token", "owner/repo", "123");

    await storage.uploadSuite(
      createSuite([createTest("failed", [image("a.png"), image("b.png")])]),
      ["fail"],
    );
    const url = await storage.getUrl(image("extra.png"));
    storage.report();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(url).toBeUndefined();
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining(
        "GitHub storage: uploads stopped, POST git/blobs: 403 error (rate limit remaining: 0)",
      ),
    );
  });

  test("should not retry an attachment that failed in the batch", async () => {
    fetchMock = mockFetch(500, "git/commits");
    global.fetch = fetchMock as any;
    const storage = new GitHubStorage("token", "owner/repo", "123");
    const attachment = image("a.png");

    await storage.uploadSuite(
      createSuite([createTest("failed", [attachment])]),
      ["fail"],
    );
    fetchMock.mockClear();
    const url = await storage.getUrl(attachment);
    storage.report();

    expect(url).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      "GitHub storage: 1 attachment(s) failed to upload, see the log for details",
    );
  });

  test("should count every attachment of a failed batch commit", async () => {
    fetchMock = mockFetch(500, "git/trees");
    global.fetch = fetchMock as any;
    const storage = new GitHubStorage("token", "owner/repo", "123");

    await storage.uploadSuite(
      createSuite([createTest("failed", [image("a.png"), image("b.png")])]),
      ["fail"],
    );
    storage.report();

    expect(warning).toHaveBeenCalledWith(
      "GitHub storage: 2 attachment(s) failed to upload, see the log for details",
    );
  });

  test("should count the attachments after a stop as not uploaded", async () => {
    fetchMock = mockFetch(429, "git/blobs");
    global.fetch = fetchMock as any;
    const storage = new GitHubStorage("token", "owner/repo", "123");

    await storage.uploadSuite(
      createSuite([
        createTest("failed", [image("a.png"), image("b.png"), image("c.png")]),
      ]),
      ["fail"],
    );
    storage.report();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      "GitHub storage: 2 attachment(s) not uploaded",
    );
  });

  test("should accept a ref prefix that starts with refs/", async () => {
    const storage = new GitHubStorage("token", "owner/repo", "123", {
      refPrefix: "refs/e2e/",
    });

    await storage.getUrl(image("a.png"));

    expect(JSON.parse(fetchMock.mock.calls[3][1].body).ref).toMatch(
      /^refs\/e2e\/\d{4}-\d{2}-\d{2}\/123\/1\//,
    );
  });

  test("should use the request timeout, and three times as long for images", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout");
    const storage = new GitHubStorage("token", "owner/repo", "123", {
      requestTimeout: 5,
    });

    await storage.getUrl(image("a.png"));

    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([
      15000, 5000, 5000, 5000,
    ]);
    timeout.mockRestore();
  });

  test("should default to a 10 second timeout", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout");
    const storage = new GitHubStorage("token", "owner/repo", "123", {
      requestTimeout: 0,
    });

    await storage.getUrl(image("a.png"));

    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([
      30000, 10000, 10000, 10000,
    ]);
    timeout.mockRestore();
  });

  test("should log the uploads with the rate limit of the last response", async () => {
    const storage = new GitHubStorage("token", "owner/repo", "123");

    await storage.uploadSuite(
      createSuite([createTest("failed", [image("a.png")])]),
      ["fail"],
    );
    storage.report();

    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(
          `^GitHub storage: 1 attachment\\(s\\) uploaded in \\d+\\.\\ds to refs/test-attachments/${today}/123/1/[0-9a-f-]{36}, rate limit remaining: 4997/5000$`,
        ),
      ),
    );
  });

  test("should use the GitHub Enterprise Server URLs", async () => {
    process.env.GITHUB_API_URL = "https://ghe.example.com/api/v3";
    process.env.GITHUB_SERVER_URL = "https://ghe.example.com";
    const storage = new GitHubStorage("token", "owner/repo", "123");
    delete process.env.GITHUB_API_URL;
    delete process.env.GITHUB_SERVER_URL;

    const url = await storage.getUrl(image("a.png"));

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://ghe.example.com/api/v3/repos/owner/repo/git/blobs",
    );
    expect(url).toMatch(/^https:\/\/ghe\.example\.com\/owner\/repo\/blob\//);
  });
});

describe("createGitHubStorage", () => {
  const env = { ...process.env };
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...env };
    log.mockRestore();
  });

  test("should return undefined when the option is not set", () => {
    expect(createGitHubStorage(undefined, "token")).toBeUndefined();
    expect(createGitHubStorage(false, "token")).toBeUndefined();
  });

  test("should return undefined without a token or the workflow context", () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_RUN_ID = "123";
    expect(createGitHubStorage(true, undefined)).toBeUndefined();

    delete process.env.GITHUB_RUN_ID;
    expect(createGitHubStorage(true, "token")).toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      "GitHub storage: skipped, it needs a token, GITHUB_REPOSITORY and GITHUB_RUN_ID",
    );
  });

  test("should create the storage in a workflow", () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_RUN_ID = "123";
    expect(createGitHubStorage({ refPrefix: "e2e" }, "token")).toBeInstanceOf(
      GitHubStorage,
    );
  });
});
