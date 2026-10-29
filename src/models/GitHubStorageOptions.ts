export interface GitHubStorageOptions {
  /** Prefix of the refs that store the attachments, without `refs/`. Default: `test-attachments` */
  refPrefix?: string;
  /** Maximum number of attachment uploads by one reporter, failed ones included. Default: `30` */
  maxUploads?: number;
  /** Timeout of a GitHub API request in seconds; uploading an image gets three times as long. Default: `10` */
  requestTimeout?: number;
}
