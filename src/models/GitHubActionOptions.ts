import type { DisplayLevel } from "./index.js";

export interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showAnnotations: boolean;
  showAnnotationsInColumn?: boolean;
  showTags: boolean;
  showError?: boolean;
  showFailedOverview?: boolean;
  failedOverviewLimit?: number;
  quiet?: boolean;
  includeResults?: DisplayLevel[];
  debug?: boolean;

  // Useful links
  showArtifactsLink?: boolean;

  // Pull request comment
  prComment?: boolean;
  githubToken?: string;

  // Azure Storage
  azureStorageUrl?: string;
  azureStorageSAS?: string;
}
