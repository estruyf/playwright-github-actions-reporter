import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { basename } from "path";
import { warning } from "@actions/core";
import type { Suite } from "@playwright/test/reporter";
import type {
  Attachment,
  DisplayLevel,
  GitHubAttachmentStorage,
  GitHubStorageOptions,
} from "../../models/index.js";
import { getTestStatus } from "../getTestStatus.js";

const DEFAULT_REF_PREFIX = "test-attachments";
const DEFAULT_MAX_UPLOADS = 30;
const DEFAULT_REQUEST_TIMEOUT = 10;
// Blobs carry the image itself, so they get more time than the other requests
const BLOB_TIMEOUT_FACTOR = 3;
// A read-only token, a missing repository or a rate limit: the remaining uploads fail the same way
const STOP_STATUSES = [401, 403, 404, 429];

interface TreeEntry {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string;
}

interface Stats {
  uploaded: number;
  skipped: number;
  failed: number;
  stoppedReason?: string;
  duration: number;
}

/**
 * Stores image attachments as commits under a ref of the repository that runs the workflow,
 * `refs/<refPrefix>/<run id>/<run attempt>/<uuid>`. The summary links them as
 * `<server>/<repo>/blob/<sha>/<file>?raw=true`, which GitHub shows with the session of the viewer,
 * so this also works for private repositories.
 *
 * `uploadSuite` uploads the attachments of all tests shown in the summary in one commit,
 * `getUrl` returns their URL, and uploads an attachment it did not see before in a new commit.
 */
export class GitHubStorage implements GitHubAttachmentStorage {
  private readonly apiUrl: string;
  private readonly serverUrl: string;
  private readonly ref: string;
  private readonly maxUploads: number;
  private readonly requestTimeout: number;
  private readonly urls = new Map<string, string>();
  private readonly handled = new Set<string>();
  private parent?: { commit: string; tree: string };
  private index = 0;
  private stats: Stats = { uploaded: 0, skipped: 0, failed: 0, duration: 0 };

  constructor(
    private readonly token: string,
    private readonly repo: string,
    private readonly runId: string,
    options: GitHubStorageOptions = {},
  ) {
    this.apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
    this.serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
    // One ref per reporter, so matrix jobs and shards of a run do not overwrite each other
    this.ref = `${(options.refPrefix || DEFAULT_REF_PREFIX)
      .replace(/^refs\//, "")
      .replace(/\/+$/, "")}/${runId}/${
      process.env.GITHUB_RUN_ATTEMPT || "1"
    }/${randomUUID()}`;
    this.maxUploads = options.maxUploads ?? DEFAULT_MAX_UPLOADS;
    this.requestTimeout =
      (options.requestTimeout && options.requestTimeout > 0
        ? options.requestTimeout
        : DEFAULT_REQUEST_TIMEOUT) * 1000;
  }

  async uploadSuite(suite: Suite, displayLevel: DisplayLevel[]) {
    const paths = getImagePaths(suite, displayLevel).filter(
      (path) => !this.handled.has(path),
    );
    if (paths.length === 0) {
      return;
    }
    paths.forEach((path) => this.handled.add(path));

    await this.measure(async () => {
      const entries: TreeEntry[] = [];
      const files = new Map<string, string>();

      for (const [i, path] of paths.entries()) {
        if (this.stats.stoppedReason) {
          // Not attempted: the remaining uploads would fail the same way
          this.stats.skipped += paths.length - i;
          break;
        }
        if (!this.canUpload(entries.length)) {
          this.stats.skipped++;
          continue;
        }

        try {
          const entry = await this.createEntry(path);
          entries.push(entry);
          files.set(path, entry.path);
        } catch (e) {
          this.logFailure(path, e);
        }
      }

      if (entries.length === 0) {
        return;
      }

      try {
        const commit = await this.commit(entries);
        for (const [path, file] of files) {
          this.urls.set(path, this.getFileUrl(commit, file));
        }
        this.stats.uploaded += entries.length;
      } catch (e) {
        this.logFailure(`${entries.length} attachment(s)`, e, entries.length);
      }
    });
  }

  async getUrl(
    attachment: Attachment & { path: string },
  ): Promise<string | undefined> {
    const url = this.urls.get(attachment.path);
    if (url || this.handled.has(attachment.path) || this.stats.stoppedReason) {
      return url;
    }
    this.handled.add(attachment.path);

    if (!this.canUpload()) {
      this.stats.skipped++;
      return;
    }

    return await this.measure(async () => {
      try {
        const entry = await this.createEntry(attachment.path);
        const commit = await this.commit([entry]);
        this.stats.uploaded++;
        return this.getFileUrl(commit, entry.path);
      } catch (e) {
        this.logFailure(attachment.name, e);
        return undefined;
      }
    });
  }

  /** Logs what was uploaded, and adds a workflow warning when attachments are missing from the summary */
  report() {
    const { uploaded, skipped, failed, stoppedReason, duration } = this.stats;
    if (uploaded + skipped + failed === 0 && !stoppedReason) {
      return;
    }

    console.log(
      `GitHub storage: ${uploaded} attachment(s) uploaded in ${(
        duration / 1000
      ).toFixed(1)}s${this.parent ? ` to refs/${this.ref}` : ""}`,
    );

    if (stoppedReason) {
      warning(`GitHub storage: uploads stopped, ${stoppedReason}`);
    }
    if (skipped > 0) {
      warning(
        `GitHub storage: ${skipped} attachment(s) not uploaded${
          stoppedReason ? "" : `, over the limit of ${this.maxUploads}`
        }`,
      );
    }
    if (failed > 0) {
      warning(
        `GitHub storage: ${failed} attachment(s) failed to upload, see the log for details`,
      );
    }
  }

  private canUpload(pending = 0) {
    return this.stats.uploaded + pending < this.maxUploads;
  }

  private async createEntry(path: string): Promise<TreeEntry> {
    const blob = await this.request<{ sha: string }>("POST", "git/blobs", {
      content: (await readFile(path)).toString("base64"),
      encoding: "base64",
    });

    return {
      path: `${++this.index}-${basename(path)}`,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    };
  }

  /** Adds the entries to the last commit of the ref, and moves the ref to the new commit */
  private async commit(entries: TreeEntry[]) {
    const tree = await this.request<{ sha: string }>("POST", "git/trees", {
      base_tree: this.parent?.tree,
      tree: entries,
    });
    const commit = await this.request<{ sha: string }>("POST", "git/commits", {
      message: `Test attachments of run ${this.runId}`,
      tree: tree.sha,
      parents: this.parent ? [this.parent.commit] : [],
    });

    if (this.parent) {
      await this.request("PATCH", `git/refs/${this.ref}`, { sha: commit.sha });
    } else {
      await this.request("POST", "git/refs", {
        ref: `refs/${this.ref}`,
        sha: commit.sha,
      });
    }

    this.parent = { commit: commit.sha, tree: tree.sha };
    return commit.sha;
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}/repos/${this.repo}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(
        path === "git/blobs"
          ? this.requestTimeout * BLOB_TIMEOUT_FACTOR
          : this.requestTimeout,
      ),
    });

    if (!response.ok) {
      const details = `${method} ${path}: ${response.status} ${(
        await response.text()
      ).slice(0, 200)}`;

      if (STOP_STATUSES.includes(response.status)) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        this.stats.stoppedReason = `${details}${
          remaining !== null ? ` (rate limit remaining: ${remaining})` : ""
        }`;
      }

      throw new Error(details);
    }

    return (await response.json()) as T;
  }

  private async measure<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.stats.duration += Date.now() - start;
    }
  }

  private logFailure(name: string, e: unknown, count = 1) {
    this.stats.failed += count;
    console.log(`Failed to upload attachment: ${name}`);
    console.log((e as Error).message);
  }

  private getFileUrl(commit: string, file: string) {
    return `${this.serverUrl}/${this.repo}/blob/${commit}/${file}?raw=true`;
  }
}

export const createGitHubStorage = (
  options: GitHubStorageOptions | boolean | undefined,
  token: string | undefined,
): GitHubStorage | undefined => {
  if (!options) {
    return;
  }

  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!token || !repo || !runId) {
    console.log(
      "GitHub storage: skipped, it needs a token, GITHUB_REPOSITORY and GITHUB_RUN_ID",
    );
    return;
  }

  return new GitHubStorage(
    token,
    repo,
    runId,
    typeof options === "object" ? options : {},
  );
};

/** Image attachments of the last result of each test that is shown in the summary */
const getImagePaths = (suite: Suite, displayLevel: DisplayLevel[]) => {
  const paths = new Set<string>();

  for (const test of suite.allTests()) {
    const result = test.results[test.results.length - 1];
    if (
      !result ||
      !displayLevel.includes(
        getTestStatus(test, result).toLowerCase() as DisplayLevel,
      )
    ) {
      continue;
    }

    for (const attachment of result.attachments) {
      if (attachment.path && attachment.contentType.startsWith("image/")) {
        paths.add(attachment.path);
      }
    }
  }

  return [...paths];
};
