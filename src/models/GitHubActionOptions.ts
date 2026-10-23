import type {
  AttachmentUploader,
  DisplayLevel,
  ErrorFormat,
  GitHubStorageOptions,
  SummaryMetadata,
} from "./index.js";

export interface GitHubActionOptions {
  title?: string;
  description?: string;
  metadata?: SummaryMetadata;
  useDetails?: boolean;
  showAnnotations: boolean;
  showAnnotationsInColumn?: boolean;
  showTags: boolean;
  showError?: boolean;
  errorFormat?: ErrorFormat;
  maxErrorLength?: number;
  showErrorSnippet?: boolean;
  showFailedOverview?: boolean;
  workflowAnnotations?: boolean;
  failedOverviewLimit?: number;
  showSlowestTests?: number;
  quiet?: boolean;
  includeResults?: DisplayLevel[];
  excludeProjects?: (string | RegExp)[];
  debug?: boolean;

  // Useful links
  showArtifactsLink?: boolean;

  // Pull request comment
  prComment?: boolean;
  prCommentId?: string;
  githubToken?: string;

  // Azure Storage
  azureStorageUrl?: string;
  azureStorageSAS?: string;

  // GitHub repository storage
  githubStorage?: boolean | GitHubStorageOptions;

  // Custom storage
  uploadAttachment?: AttachmentUploader;
}
