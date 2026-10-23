export interface GitHubStorageOptions {
  /** Prefix of the refs that store the attachments, without `refs/`. Default: `test-attachments` */
  refPrefix?: string;
  /** Maximum number of attachments uploaded by one reporter. Default: `30` */
  maxUploads?: number;
}
