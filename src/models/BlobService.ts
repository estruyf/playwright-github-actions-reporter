export interface Attachment {
  name: string;
  path?: string;
  contentType: string;
}

/**
 * Uploads an image attachment and returns the URL to show in the summary.
 * Return `undefined` to leave the attachment out.
 */
export type AttachmentUploader = (
  attachment: Attachment & { path: string },
) => Promise<string | undefined>;

/** Storage that keeps its uploads for the run, see `githubStorage` */
export interface GitHubAttachmentStorage {
  getUrl: AttachmentUploader;
  report: () => void;
}

export interface BlobService {
  azure?: {
    azureStorageUrl?: string;
    azureStorageSAS?: string;
  };
  github?: GitHubAttachmentStorage;
  custom?: AttachmentUploader;
}
