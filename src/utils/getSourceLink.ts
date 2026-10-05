import type { Location } from "@playwright/test/reporter";
import { existsSync, readFileSync } from "fs";
import { basename, isAbsolute, relative } from "path";

/**
 * On pull requests, GITHUB_SHA is a temporary merge commit that is replaced on
 * every push. Use the head commit of the pull request so the links keep working.
 */
export const getCommitSha = (): string | undefined => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && existsSync(eventPath)) {
    try {
      const event = JSON.parse(readFileSync(eventPath, "utf-8"));
      if (event?.pull_request?.head?.sha) {
        return event.pull_request.head.sha;
      }
    } catch {
      // Ignore invalid event payloads and fall back to GITHUB_SHA
    }
  }

  return process.env.GITHUB_SHA;
};

/**
 * Link to the line of the location in the GitHub repository, or `undefined`
 * when not running in GitHub Actions or when the file is outside the workspace.
 */
export const getSourceUrl = (location?: Location): string | undefined => {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_WORKSPACE } =
    process.env;
  const sha = getCommitSha();

  if (!location?.file || !GITHUB_REPOSITORY || !GITHUB_WORKSPACE || !sha) {
    return undefined;
  }

  const filePath = relative(GITHUB_WORKSPACE, location.file);
  if (!filePath || filePath.startsWith("..") || isAbsolute(filePath)) {
    return undefined;
  }

  const serverUrl = GITHUB_SERVER_URL || "https://github.com";
  // Windows runners use backslashes, URLs need forward slashes
  const urlPath = filePath.split(/[\\/]/).map(encodeURIComponent).join("/");
  return `${serverUrl}/${GITHUB_REPOSITORY}/blob/${sha}/${urlPath}#L${location.line}`;
};

/**
 * Location as `file.spec.ts:12`, linked to the source on GitHub when possible.
 */
export const getSourceLink = (location?: Location): string => {
  if (!location?.file) {
    return "";
  }

  const text = `${basename(location.file)}:${location.line}`;
  const url = getSourceUrl(location);
  return url ? `<a href="${url}">${text}</a>` : text;
};
