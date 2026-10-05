import type { DisplayLevel, ErrorFormat } from "./index.js";

export interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showAnnotations: boolean;
  showAnnotationsInColumn?: boolean;
  showTags: boolean;
  showError?: boolean;
  errorFormat?: ErrorFormat;
  maxErrorLength?: number;
  showErrorSnippet?: boolean;
  showFailedOverview?: boolean;
  failedOverviewLimit?: number;
  showSlowestTests?: number;
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
