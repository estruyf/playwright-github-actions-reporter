import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  MAX_COMMENT_LENGTH,
  commentOnPullRequest,
  getCommentMarker,
  getPullRequestCommentBody,
  getPullRequestNumber,
  getRunUrl,
} from "./commentOnPullRequest.js";

const ENV_KEYS = [
  "GITHUB_EVENT_PATH",
  "GITHUB_REF",
  "GITHUB_SERVER_URL",
  "GITHUB_API_URL",
  "GITHUB_REPOSITORY",
  "GITHUB_RUN_ID",
  "GITHUB_WORKFLOW",
  "GITHUB_JOB",
];

const writeEvent = (event: unknown): string => {
  const dir = mkdtempSync(join(tmpdir(), "gh-event-"));
  const filePath = join(dir, "event.json");
  writeFileSync(filePath, JSON.stringify(event), "utf-8");
  return filePath;
};

const jsonResponse = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }) as Response;

describe("commentOnPullRequest", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
    stdoutSpy = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    stdoutSpy.mockRestore();
  });

  describe("getPullRequestNumber", () => {
    it("should return the number from a pull_request event", () => {
      process.env.GITHUB_EVENT_PATH = writeEvent({
        pull_request: { number: 42 },
      });
      expect(getPullRequestNumber()).toBe(42);
    });

    it("should return the number from an issue comment on a pull request", () => {
      process.env.GITHUB_EVENT_PATH = writeEvent({
        issue: { number: 7, pull_request: {} },
      });
      expect(getPullRequestNumber()).toBe(7);
    });

    it("should ignore issue comments on plain issues", () => {
      process.env.GITHUB_EVENT_PATH = writeEvent({ issue: { number: 7 } });
      expect(getPullRequestNumber()).toBeUndefined();
    });

    it("should fall back to the pull request ref", () => {
      process.env.GITHUB_REF = "refs/pull/13/merge";
      expect(getPullRequestNumber()).toBe(13);
    });

    it("should return undefined outside of a pull request", () => {
      process.env.GITHUB_EVENT_PATH = writeEvent({ ref: "refs/heads/main" });
      process.env.GITHUB_REF = "refs/heads/main";
      expect(getPullRequestNumber()).toBeUndefined();
    });
  });

  describe("getRunUrl", () => {
    it("should return the workflow run URL", () => {
      process.env.GITHUB_REPOSITORY = "owner/repo";
      process.env.GITHUB_RUN_ID = "123";
      expect(getRunUrl()).toBe("https://github.com/owner/repo/actions/runs/123");
    });

    it("should return undefined without repository information", () => {
      expect(getRunUrl()).toBeUndefined();
    });
  });

  describe("getCommentMarker", () => {
    it("should include the workflow, job, and title", () => {
      process.env.GITHUB_WORKFLOW = "E2E";
      process.env.GITHUB_JOB = "testing";
      expect(getCommentMarker("My title")).toBe(
        "<!-- @estruyf/github-actions-reporter E2E:testing:My title -->",
      );
    });

    it("should stay the same without a comment id", () => {
      process.env.GITHUB_WORKFLOW = "E2E";
      process.env.GITHUB_JOB = "testing";
      expect(getCommentMarker("My title", "")).toBe(getCommentMarker("My title"));
      expect(getCommentMarker("My title", undefined)).toBe(
        "<!-- @estruyf/github-actions-reporter E2E:testing:My title -->",
      );
    });

    it("should keep matrix legs apart with a comment id", () => {
      process.env.GITHUB_WORKFLOW = "E2E";
      process.env.GITHUB_JOB = "testing";
      const pages = getCommentMarker("My title", "pages");
      const webparts = getCommentMarker("My title", "webparts");
      expect(pages).toBe(
        "<!-- @estruyf/github-actions-reporter E2E:testing:My title:pages -->",
      );
      expect(pages).not.toBe(webparts);
    });

    it("should keep shards apart", () => {
      process.env.GITHUB_WORKFLOW = "E2E";
      process.env.GITHUB_JOB = "testing";
      expect(getCommentMarker("My title", "pages:shard-2-of-4")).toBe(
        "<!-- @estruyf/github-actions-reporter E2E:testing:My title:pages:shard-2-of-4 -->",
      );
      expect(getCommentMarker("", "shard-1-of-2")).not.toBe(
        getCommentMarker("", "shard-2-of-2"),
      );
    });

    it("should not contain a double dash which would end the HTML comment", () => {
      const marker = getCommentMarker("a -- b --- c");
      expect(marker).toBe("<!-- @estruyf/github-actions-reporter a - b - c -->");
    });
  });

  describe("getPullRequestCommentBody", () => {
    const marker = "<!-- marker -->";
    const runUrl = "https://github.com/owner/repo/actions/runs/1";

    it("should prefix the marker and add the run link", () => {
      const body = getPullRequestCommentBody(
        { content: "<p>results</p>", headerText: [] },
        marker,
        runUrl,
      );
      expect(body).toBe(
        `${marker}\n<p>results</p>\n\n[View workflow run](${runUrl})`,
      );
    });

    it("should leave out the error code snippets", () => {
      const body = getPullRequestCommentBody(
        {
          content: `<td>Error<!-- error-snippet --><details><pre>code</pre></details><!-- /error-snippet --></td><td>Other<!-- error-snippet -->x<!-- /error-snippet --></td>`,
          headerText: [],
        },
        marker,
      );
      expect(body).toBe(`${marker}\n<td>Error</td><td>Other</td>`);
    });

    it("should point the artifacts link to the workflow run", () => {
      const body = getPullRequestCommentBody(
        { content: `<a href="#artifacts">Go to artifacts</a>`, headerText: [] },
        marker,
        runUrl,
      );
      expect(body).toContain(`href="${runUrl}#artifacts"`);
    });

    it("should fall back to the totals when the content is too large", () => {
      const body = getPullRequestCommentBody(
        {
          content: "x".repeat(MAX_COMMENT_LENGTH),
          title: "Test results",
          headerText: ["Total tests: 2", "Passed: 2"],
        },
        marker,
        runUrl,
      );
      expect(body.length).toBeLessThanOrEqual(MAX_COMMENT_LENGTH);
      expect(body).toContain("<h1>Test results</h1>");
      expect(body).toContain("Total tests: 2 - Passed: 2");
      expect(body).toContain(`[workflow run summary](${runUrl})`);
    });

    it("should keep the custom context when the content is too large", () => {
      const body = getPullRequestCommentBody(
        {
          content: "x".repeat(MAX_COMMENT_LENGTH),
          title: "Test results",
          context: "<p>Environment: staging</p>",
          headerText: ["Total tests: 2"],
        },
        marker,
        runUrl,
      );
      expect(body).toContain(
        "<h1>Test results</h1>\n<p>Environment: staging</p>\nTotal tests: 2",
      );
    });
  });

  describe("commentOnPullRequest", () => {
    const details = {
      content: "<p>results</p>",
      title: "Test results",
      headerText: [],
    };

    beforeEach(() => {
      process.env.GITHUB_EVENT_PATH = writeEvent({
        pull_request: { number: 5 },
      });
      process.env.GITHUB_REPOSITORY = "owner/repo";
      process.env.GITHUB_RUN_ID = "1";
    });

    it("should create a new comment when none exists", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(jsonResponse([{ id: 1, body: "other" }]))
        .mockResolvedValueOnce(jsonResponse({ id: 2 }, 201));
      global.fetch = fetchMock;

      await commentOnPullRequest(details, "token");

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe(
        "https://api.github.com/repos/owner/repo/issues/5/comments",
      );
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer token");
      expect(JSON.parse(init.body).body).toContain("<p>results</p>");
    });

    it("should update the existing comment", async () => {
      const marker = getCommentMarker(details.title);
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse([{ id: 99, body: `${marker}\nold results` }]),
        )
        .mockResolvedValueOnce(jsonResponse({ id: 99 }));
      global.fetch = fetchMock;

      await commentOnPullRequest(details, "token");

      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe(
        "https://api.github.com/repos/owner/repo/issues/comments/99",
      );
      expect(init.method).toBe("PATCH");
    });

    it("should only update the comment of the same shard", async () => {
      const shard1 = getCommentMarker(details.title, "shard-1-of-2");
      const shard2 = getCommentMarker(details.title, "shard-2-of-2");
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse([
            { id: 1, body: `${shard1}\nshard 1 results` },
            { id: 2, body: `${shard2}\nshard 2 results` },
          ]),
        )
        .mockResolvedValueOnce(jsonResponse({ id: 2 }));
      global.fetch = fetchMock;

      await commentOnPullRequest({ ...details, marker: shard2 }, "token");

      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe(
        "https://api.github.com/repos/owner/repo/issues/comments/2",
      );
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body).body.startsWith(shard2)).toBe(true);
    });

    it("should page through the existing comments", async () => {
      const marker = getCommentMarker(details.title);
      const firstPage = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        body: "other",
      }));
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(jsonResponse(firstPage))
        .mockResolvedValueOnce(jsonResponse([{ id: 150, body: marker }]))
        .mockResolvedValueOnce(jsonResponse({ id: 150 }));
      global.fetch = fetchMock;

      await commentOnPullRequest(details, "token");

      expect(fetchMock.mock.calls[1][0]).toContain("page=2");
      expect(fetchMock.mock.calls[2][0]).toContain("/issues/comments/150");
    });

    it("should not call the API without a token", async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      await commentOnPullRequest(details, undefined);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should not call the API outside of a pull request", async () => {
      process.env.GITHUB_EVENT_PATH = writeEvent({ ref: "refs/heads/main" });
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      await commentOnPullRequest(details, "token");

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should not throw when the API call fails", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(jsonResponse({ message: "Forbidden" }, 403));

      await expect(
        commentOnPullRequest(details, "token"),
      ).resolves.toBeUndefined();
    });
  });
});
