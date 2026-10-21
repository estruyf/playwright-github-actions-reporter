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

export interface BlobService {
  azure?: {
    azureStorageUrl?: string;
    azureStorageSAS?: string;
  };
  custom?: AttachmentUploader;
}
