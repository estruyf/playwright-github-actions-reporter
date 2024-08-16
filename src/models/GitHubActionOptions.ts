import { DisplayLevel } from ".";

export interface GitHubActionOptions {
  title?: string;
  useDetails?: boolean;
  showAnnotations: boolean;
  showTags: boolean;
  showError?: boolean;
  quiet?: boolean;
  includeResults?: DisplayLevel[];

  // Azure Storage
  azureStorageUrl?: string;
  azureStorageSAS?: string;
}
