import { info, warning } from "@actions/core";
import { existsSync, readFileSync } from "fs";

// GitHub limits issue/PR comment bodies to 65536 characters
export const MAX_COMMENT_LENGTH = 65536;

const MARKER_PREFIX = "<!-- @estruyf/github-actions-reporter";

export interface PullRequestCommentDetails {
  content: string;
  title?: string;
  headerText: string[];
}

export const getPullRequestNumber = (): number | undefined => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && existsSync(eventPath)) {
    try {
      const event = JSON.parse(readFileSync(eventPath, "utf-8"));
      if (event?.pull_request?.number) {
        return event.pull_request.number;
      }
      if (event?.issue?.pull_request && event?.issue?.number) {
        return event.issue.number;
      }
    } catch {
      // Ignore invalid event payloads and fall back to the ref
    }
  }

  const refMatch = (process.env.GITHUB_REF || "").match(
    /^refs\/pull\/(\d+)\//,
  );
  if (refMatch) {
    return parseInt(refMatch[1], 10);
  }

  return undefined;
};

export const getRunUrl = (): string | undefined => {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (!GITHUB_REPOSITORY || !GITHUB_RUN_ID) {
    return undefined;
  }

  const serverUrl = GITHUB_SERVER_URL || "https://github.com";
  return `${serverUrl}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
};

/**
 * Hidden marker to find the comment again on the next run. It is unique per
 * workflow, job, and reporter title so multiple reporters do not overwrite
 * each other.
 */
export const getCommentMarker = (title?: string): string => {
  const id = [process.env.GITHUB_WORKFLOW, process.env.GITHUB_JOB, title ?? ""]
    .filter((value) => typeof value === "string")
    .join(":")
    .replace(/-{2,}/g, "-");
  return `${MARKER_PREFIX} ${id} -->`;
};

export const getPullRequestCommentBody = (
  details: PullRequestCommentDetails,
  marker: string,
  runUrl?: string,
): string => {
  let content = details.content;

  // In-page links of the job summary do not work in a PR comment
  if (runUrl) {
    content = content.replace(/href="#artifacts"/g, `href="${runUrl}#artifacts"`);
  }

  const footer = runUrl ? `\n\n[View workflow run](${runUrl})` : "";
  const body = `${marker}\n${content}${footer}`;
  if (body.length <= MAX_COMMENT_LENGTH) {
    return body;
  }

  // Too large for a comment, fall back to the totals and a link to the run
  const lines = [marker];
  if (details.title) {
    lines.push(`<h1>${details.title}</h1>`);
  }
  lines.push(details.headerText.join(" - "));
  lines.push(
    "",
    `The full test results are too large for a pull request comment.${
      runUrl ? ` Check the [workflow run summary](${runUrl}) instead.` : ""
    }`,
  );
  return lines.join("\n");
};

const githubRequest = async (
  url: string,
  token: string,
  method = "GET",
  body?: unknown,
) => {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `GitHub API ${method} ${url} failed with ${response.status}: ${text}`,
    );
  }

  return response.json();
};

const findExistingComment = async (
  commentsUrl: string,
  token: string,
  marker: string,
): Promise<number | undefined> => {
  const perPage = 100;
  for (let page = 1; ; page++) {
    const comments: { id: number; body?: string }[] = await githubRequest(
      `${commentsUrl}?per_page=${perPage}&page=${page}`,
      token,
    );

    const comment = comments.find((c) => c.body?.startsWith(marker));
    if (comment) {
      return comment.id;
    }

    if (comments.length < perPage) {
      return undefined;
    }
  }
};

export const commentOnPullRequest = async (
  details: PullRequestCommentDetails,
  token?: string,
) => {
  const prNumber = getPullRequestNumber();
  if (!prNumber) {
    info("Not running for a pull request, skipping the pull request comment");
    return;
  }

  if (!token) {
    warning(
      "No GitHub token available to comment on the pull request. Set the GITHUB_TOKEN environment variable or the githubToken option.",
    );
    return;
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    warning("GITHUB_REPOSITORY is not set, skipping the pull request comment");
    return;
  }

  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  const commentsUrl = `${apiUrl}/repos/${repository}/issues/${prNumber}/comments`;
  const marker = getCommentMarker(details.title);
  const body = getPullRequestCommentBody(details, marker, getRunUrl());

  try {
    const commentId = await findExistingComment(commentsUrl, token, marker);
    if (commentId) {
      await githubRequest(
        `${apiUrl}/repos/${repository}/issues/comments/${commentId}`,
        token,
        "PATCH",
        { body },
      );
      info(`Updated the test results comment on pull request #${prNumber}`);
    } else {
      await githubRequest(commentsUrl, token, "POST", { body });
      info(`Added the test results comment to pull request #${prNumber}`);
    }
  } catch (error) {
    warning(
      `Failed to comment on pull request #${prNumber}. Make sure the workflow has the "pull-requests: write" permission. ${
        (error as Error).message
      }`,
    );
  }
};
