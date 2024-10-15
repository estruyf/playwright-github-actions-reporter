import { DisplayLevel } from ".";

export interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showAnnotations: boolean;
  showTags: boolean;
  showError?: boolean;
  quiet?: boolean;
  includeResults?: DisplayLevel[];
  debug?: boolean;

  // Useful links
  showArtifactsLink?: boolean;

  // Azure Storage
  azureStorageUrl?: string;
  azureStorageSAS?: string;
}
